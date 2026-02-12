/**
 * Script de migration pour la production
 *
 * Usage:
 *   node scripts/migrate-production.js
 *
 * Assurez-vous que MONGODB_URI est défini dans votre .env ou passez-le en argument:
 *   MONGODB_URI="mongodb+srv://..." node scripts/migrate-production.js
 */

const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Lire le fichier .env manuellement
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/^MONGODB_URI=(.+)$/m);
    if (match) {
      MONGODB_URI = match[1].trim();
    }
  } catch (e) {
    // Ignorer l'erreur
  }
}

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI non défini. Définissez-le dans .env ou en variable d'environnement.");
  process.exit(1);
}

async function migrate() {
  console.log("🚀 Démarrage de la migration...\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connecté à MongoDB\n");

    const db = client.db();

    // ============================================
    // STATISTIQUES AVANT MIGRATION
    // ============================================
    console.log("📊 État AVANT migration :");
    console.log("─".repeat(50));

    const usersBefore = await db.collection("user").countDocuments();
    const usersWithOnboarding = await db.collection("user").countDocuments({ hasSeenOnboarding: { $exists: true } });
    const orgsBefore = await db.collection("organization").countDocuments();
    const orgsWithCompleted = await db.collection("organization").countDocuments({ onboardingCompleted: { $exists: true } });
    const orgsWithSiren = await db.collection("organization").countDocuments({ siren: { $exists: true, $ne: "" } });

    console.log(`   Users total: ${usersBefore}`);
    console.log(`   Users avec hasSeenOnboarding: ${usersWithOnboarding}`);
    console.log(`   Organisations total: ${orgsBefore}`);
    console.log(`   Organisations avec onboardingCompleted: ${orgsWithCompleted}`);
    console.log(`   Organisations avec siren: ${orgsWithSiren}`);
    console.log("");

    // ============================================
    // MIGRATION 1 : Organizations - onboardingCompleted
    // ============================================
    console.log("🔄 Migration 1 : Ajout onboardingCompleted aux organisations...");

    const orgResult = await db.collection("organization").updateMany(
      { onboardingCompleted: { $exists: false } },
      {
        $set: {
          onboardingCompleted: true,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`   ✅ ${orgResult.modifiedCount} organisation(s) mise(s) à jour\n`);

    // ============================================
    // MIGRATION 2 : Organizations - siren (extrait du siret)
    // ============================================
    console.log("🔄 Migration 2 : Extraction du SIREN depuis le SIRET...");

    const orgsWithoutSiren = await db.collection("organization").find({
      siret: { $exists: true, $ne: "" },
      $or: [
        { siren: { $exists: false } },
        { siren: "" },
      ],
    }).toArray();

    let sirenCount = 0;
    for (const org of orgsWithoutSiren) {
      if (org.siret && org.siret.length >= 9) {
        const siren = org.siret.replace(/\s/g, "").substring(0, 9);
        await db.collection("organization").updateOne(
          { _id: org._id },
          {
            $set: {
              siren: siren,
              updatedAt: new Date(),
            },
          }
        );
        sirenCount++;
      }
    }
    console.log(`   ✅ ${sirenCount} organisation(s) avec SIREN ajouté\n`);

    // ============================================
    // MIGRATION 3 : Organizations - addressCountry par défaut
    // ============================================
    console.log("🔄 Migration 3 : Ajout addressCountry par défaut...");

    const countryResult = await db.collection("organization").updateMany(
      {
        $or: [
          { addressCountry: { $exists: false } },
          { addressCountry: "" },
        ],
      },
      {
        $set: {
          addressCountry: "France",
          updatedAt: new Date(),
        },
      }
    );
    console.log(`   ✅ ${countryResult.modifiedCount} organisation(s) avec addressCountry ajouté\n`);

    // ============================================
    // MIGRATION 4 : Users - hasSeenOnboarding
    // ============================================
    console.log("🔄 Migration 4 : Ajout hasSeenOnboarding aux utilisateurs...");

    // Récupérer tous les userIds qui sont membres d'une organisation
    const memberUserIds = await db.collection("member").distinct("userId");

    // Convertir en ObjectId si nécessaire
    const memberUserObjectIds = memberUserIds.map((id) => {
      if (id instanceof ObjectId) return id;
      try {
        return new ObjectId(id);
      } catch {
        return id;
      }
    });

    const userResult = await db.collection("user").updateMany(
      {
        _id: { $in: memberUserObjectIds },
        hasSeenOnboarding: { $exists: false },
      },
      {
        $set: {
          hasSeenOnboarding: true,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`   ✅ ${userResult.modifiedCount} utilisateur(s) mis à jour\n`);

    // ============================================
    // MIGRATION 5 : Users sans organisation - hasSeenOnboarding: false
    // ============================================
    console.log("🔄 Migration 5 : Utilisateurs sans organisation...");

    const usersWithoutOrgResult = await db.collection("user").updateMany(
      {
        _id: { $nin: memberUserObjectIds },
        hasSeenOnboarding: { $exists: false },
      },
      {
        $set: {
          hasSeenOnboarding: false,
          isInvitedUser: false,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`   ✅ ${usersWithoutOrgResult.modifiedCount} utilisateur(s) sans org mis à jour\n`);

    // ============================================
    // MIGRATION 6 : Subscriptions - vérifier referenceId
    // ============================================
    console.log("🔄 Migration 6 : Vérification des abonnements...");

    const subscriptions = await db.collection("subscription").find({}).toArray();
    let subFixCount = 0;

    for (const sub of subscriptions) {
      // Vérifier que le referenceId correspond à une organisation existante
      let orgExists = false;

      try {
        const orgId = sub.referenceId instanceof ObjectId
          ? sub.referenceId
          : new ObjectId(sub.referenceId);

        const org = await db.collection("organization").findOne({ _id: orgId });
        orgExists = !!org;
      } catch {
        // referenceId n'est pas un ObjectId valide, essayer en string
        const org = await db.collection("organization").findOne({
          $or: [
            { _id: sub.referenceId },
            { id: sub.referenceId },
          ]
        });
        orgExists = !!org;
      }

      if (!orgExists) {
        console.log(`   ⚠️ Abonnement orphelin trouvé: ${sub._id} (referenceId: ${sub.referenceId})`);
        subFixCount++;
      }
    }

    if (subFixCount === 0) {
      console.log(`   ✅ Tous les abonnements sont liés à une organisation valide\n`);
    } else {
      console.log(`   ⚠️ ${subFixCount} abonnement(s) orphelin(s) détecté(s)\n`);
    }

    // ============================================
    // STATISTIQUES APRÈS MIGRATION
    // ============================================
    console.log("📊 État APRÈS migration :");
    console.log("─".repeat(50));

    const usersAfterOnboarding = await db.collection("user").countDocuments({ hasSeenOnboarding: true });
    const usersAfterNoOnboarding = await db.collection("user").countDocuments({ hasSeenOnboarding: false });
    const orgsAfterCompleted = await db.collection("organization").countDocuments({ onboardingCompleted: true });
    const orgsAfterSiren = await db.collection("organization").countDocuments({ siren: { $exists: true, $ne: "" } });
    const orgsAfterCountry = await db.collection("organization").countDocuments({ addressCountry: "France" });

    console.log(`   Users avec hasSeenOnboarding=true: ${usersAfterOnboarding}`);
    console.log(`   Users avec hasSeenOnboarding=false: ${usersAfterNoOnboarding}`);
    console.log(`   Organisations avec onboardingCompleted: ${orgsAfterCompleted}`);
    console.log(`   Organisations avec siren: ${orgsAfterSiren}`);
    console.log(`   Organisations avec addressCountry: ${orgsAfterCountry}`);
    console.log("");

    console.log("─".repeat(50));
    console.log("✅ MIGRATION TERMINÉE AVEC SUCCÈS");
    console.log("─".repeat(50));

  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n👋 Connexion MongoDB fermée");
  }
}

// Exécuter la migration
migrate();
