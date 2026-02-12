/**
 * Script de diagnostic de compte utilisateur
 *
 * Usage: node scripts/diagnose-account.js <email>
 *
 * Ce script vérifie:
 * - L'utilisateur existe en BDD
 * - Les sessions associées et leur activeOrganizationId
 * - Les memberships (organisations dont l'utilisateur fait partie)
 * - Les organisations et leur état
 * - Les abonnements associés
 */

const fs = require("fs");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

// Charger les variables d'environnement manuellement
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  const envPathFallback = path.resolve(__dirname, "../.env");

  let envFile = envPath;
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envPathFallback)) {
      envFile = envPathFallback;
    } else {
      console.error("❌ Fichier .env.local ou .env non trouvé");
      process.exit(1);
    }
  }

  const envContent = fs.readFileSync(envFile, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI non défini dans .env.local");
  process.exit(1);
}

async function diagnoseAccount(email) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connecté à MongoDB\n");

    const db = client.db();

    console.log("═".repeat(60));
    console.log(`📧 DIAGNOSTIC POUR: ${email}`);
    console.log("═".repeat(60));

    // 1. Trouver l'utilisateur
    console.log("\n📌 1. UTILISATEUR");
    console.log("-".repeat(40));

    const user = await db.collection("user").findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      console.log(`❌ Utilisateur non trouvé avec l'email: ${email}`);
      return;
    }

    console.log(`✅ Utilisateur trouvé`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nom: ${user.name || "N/A"} ${user.lastName || ""}`);
    console.log(`   hasSeenOnboarding: ${user.hasSeenOnboarding}`);
    console.log(`   isInvitedUser: ${user.isInvitedUser || false}`);
    console.log(`   emailVerified: ${user.emailVerified}`);
    console.log(`   isActive: ${user.isActive !== false}`);
    console.log(`   Créé le: ${user.createdAt}`);

    const userId = user._id;

    // 2. Vérifier les sessions
    console.log("\n📌 2. SESSIONS");
    console.log("-".repeat(40));

    const sessions = await db
      .collection("session")
      .find({ userId: userId.toString() })
      .toArray();

    // Chercher aussi avec ObjectId
    const sessionsWithObjectId = await db
      .collection("session")
      .find({ userId: userId })
      .toArray();

    const allSessions = [...sessions, ...sessionsWithObjectId];
    const uniqueSessions = allSessions.filter(
      (s, i, arr) => arr.findIndex((x) => x._id.toString() === s._id.toString()) === i
    );

    if (uniqueSessions.length === 0) {
      console.log(`⚠️ Aucune session trouvée`);
    } else {
      console.log(`✅ ${uniqueSessions.length} session(s) trouvée(s)`);
      uniqueSessions.forEach((session, idx) => {
        console.log(`\n   Session ${idx + 1}:`);
        console.log(`   - ID: ${session._id}`);
        console.log(`   - userId (type): ${typeof session.userId} = ${session.userId}`);
        console.log(`   - activeOrganizationId: ${session.activeOrganizationId || "❌ NON DÉFINI"}`);
        console.log(`   - expiresAt: ${session.expiresAt}`);
        console.log(`   - Expirée: ${new Date(session.expiresAt) < new Date() ? "⚠️ OUI" : "Non"}`);
      });
    }

    // 3. Vérifier les memberships
    console.log("\n📌 3. MEMBERSHIPS (Organisations dont l'utilisateur fait partie)");
    console.log("-".repeat(40));

    // Chercher avec les deux formats possibles de userId
    const membersWithString = await db
      .collection("member")
      .find({ userId: userId.toString() })
      .toArray();

    const membersWithObjectId = await db
      .collection("member")
      .find({ userId: userId })
      .toArray();

    const allMembers = [...membersWithString, ...membersWithObjectId];
    const uniqueMembers = allMembers.filter(
      (m, i, arr) => arr.findIndex((x) => x._id.toString() === m._id.toString()) === i
    );

    if (uniqueMembers.length === 0) {
      console.log(`❌ PROBLÈME: L'utilisateur n'est membre d'AUCUNE organisation!`);
      console.log(`   → C'est la cause de l'erreur "Vous n'êtes pas membre de cette organisation"`);
    } else {
      console.log(`✅ ${uniqueMembers.length} membership(s) trouvé(s)`);
      for (const member of uniqueMembers) {
        console.log(`\n   Membership:`);
        console.log(`   - ID: ${member._id}`);
        console.log(`   - userId (type): ${typeof member.userId} = ${member.userId}`);
        console.log(`   - organizationId (type): ${typeof member.organizationId} = ${member.organizationId}`);
        console.log(`   - role: ${member.role}`);
        console.log(`   - createdAt: ${member.createdAt}`);
      }
    }

    // 4. Vérifier les organisations
    console.log("\n📌 4. ORGANISATIONS");
    console.log("-".repeat(40));

    const orgIds = uniqueMembers.map((m) => {
      if (typeof m.organizationId === "string") {
        try {
          return new ObjectId(m.organizationId);
        } catch {
          return m.organizationId;
        }
      }
      return m.organizationId;
    });

    if (orgIds.length === 0) {
      console.log(`❌ Aucune organisation à vérifier (pas de membership)`);
    } else {
      for (const orgId of orgIds) {
        const org = await db.collection("organization").findOne({ _id: orgId });

        if (!org) {
          console.log(`\n   ❌ Organisation ${orgId} NON TROUVÉE en BDD!`);
          console.log(`      → Le membership pointe vers une organisation qui n'existe pas`);
        } else {
          console.log(`\n   Organisation:`);
          console.log(`   - ID: ${org._id}`);
          console.log(`   - Nom: ${org.name}`);
          console.log(`   - Slug: ${org.slug}`);
          console.log(`   - companyName: ${org.companyName || "N/A"}`);
          console.log(`   - siret: ${org.siret || "N/A"}`);
          console.log(`   - onboardingCompleted: ${org.onboardingCompleted}`);
          console.log(`   - Créé le: ${org.createdAt}`);

          // Vérifier l'abonnement
          const subscription = await db.collection("subscription").findOne({
            referenceId: org._id.toString(),
          });

          if (subscription) {
            console.log(`   - 💳 Abonnement: ${subscription.plan} (${subscription.status})`);
          } else {
            console.log(`   - ⚠️ Pas d'abonnement trouvé pour cette organisation`);
          }
        }
      }
    }

    // 5. Vérification croisée
    console.log("\n📌 5. VÉRIFICATION CROISÉE");
    console.log("-".repeat(40));

    // Vérifier si activeOrganizationId dans les sessions correspond à un membership
    for (const session of uniqueSessions) {
      if (session.activeOrganizationId) {
        const matchingMember = uniqueMembers.find((m) => {
          const memberOrgId = m.organizationId.toString();
          return memberOrgId === session.activeOrganizationId;
        });

        if (matchingMember) {
          console.log(`✅ Session ${session._id.toString().slice(-8)}... → activeOrganizationId ${session.activeOrganizationId} correspond au membership`);
        } else {
          console.log(`❌ PROBLÈME: Session ${session._id.toString().slice(-8)}... → activeOrganizationId ${session.activeOrganizationId} ne correspond à AUCUN membership!`);
          console.log(`   → Le localStorage côté client utilise probablement cet ID invalide`);
        }
      }
    }

    // 6. Recommandations
    console.log("\n📌 6. RECOMMANDATIONS");
    console.log("-".repeat(40));

    const issues = [];

    if (uniqueMembers.length === 0) {
      issues.push("L'utilisateur n'a aucun membership → Il faut créer un membership");
    }

    const hasValidActiveOrg = uniqueSessions.some((s) => {
      if (!s.activeOrganizationId) return false;
      return uniqueMembers.some(
        (m) => m.organizationId.toString() === s.activeOrganizationId
      );
    });

    if (!hasValidActiveOrg && uniqueMembers.length > 0) {
      issues.push(
        "Aucune session n'a un activeOrganizationId valide → Il faut mettre à jour les sessions"
      );
    }

    if (issues.length === 0) {
      console.log("✅ Aucun problème détecté côté BDD");
      console.log("   → Le problème vient probablement du localStorage côté client");
      console.log("   → Solution: Vider le localStorage et se reconnecter");
    } else {
      console.log("❌ Problèmes détectés:");
      issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue}`);
      });
    }

    console.log("\n" + "═".repeat(60));
    console.log("FIN DU DIAGNOSTIC");
    console.log("═".repeat(60));

  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await client.close();
  }
}

// Récupérer l'email depuis les arguments
const email = process.argv[2];

if (!email) {
  console.log("Usage: node scripts/diagnose-account.js <email>");
  console.log("Exemple: node scripts/diagnose-account.js user@example.com");
  process.exit(1);
}

diagnoseAccount(email);
