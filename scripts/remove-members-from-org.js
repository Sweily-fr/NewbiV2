/**
 * Script pour supprimer les membres ajoutés à une organisation via l'API
 *
 * Usage:
 * 1. Assurez-vous que le serveur est démarré (npm run dev)
 * 2. Lancez: node scripts/remove-members-from-org.js
 */

// ============================================
// CONFIGURATION - Modifiez ces valeurs
// ============================================

const API_URL = "http://localhost:3000/api/admin/delete-test-users";

// ID de votre organisation
const ORGANIZATION_ID = "6925c029130f0b0eca2ba765"; // "One piece"

// Emails des membres à supprimer (les 20 qu'on a ajoutés)
const EMAILS_TO_DELETE = [
  "usopp@onepiece.com",
  "chopper@onepiece.com",
  "franky@onepiece.com",
  "brook@onepiece.com",
  "jinbe@onepiece.com",
  "ace@onepiece.com",
  "sabo@onepiece.com",
  "shanks@onepiece.com",
  "law@onepiece.com",
  "kid@onepiece.com",
  "yamato@onepiece.com",
  "vivi@onepiece.com",
  "hancock@onepiece.com",
  "rayleigh@onepiece.com",
  "marco@onepiece.com",
  "katakuri@onepiece.com",
  "crocodile@onepiece.com",
  "doflamingo@onepiece.com",
  "mihawk@onepiece.com",
  "buggy@onepiece.com",
  // Les 4 premiers aussi si besoin
  "zoro@onepiece.com",
  "nami@onepiece.com",
  "sanji@onepiece.com",
  "robin@onepiece.com",
];

// ============================================
// NE PAS MODIFIER EN DESSOUS
// ============================================

async function removeMembers() {
  console.log("🗑️  Démarrage de la suppression des membres...\n");

  try {
    console.log(
      "📝 Suppression des membres de l'organisation:",
      ORGANIZATION_ID
    );
    console.log(
      `👥 Nombre de membres à supprimer: ${EMAILS_TO_DELETE.length}\n`
    );

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId: ORGANIZATION_ID,
        emails: EMAILS_TO_DELETE,
        adminKey: "dev-admin-key-2024", // Clé pour le développement
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erreur:", data.error || data.details);
      console.log("\n💡 Vérifiez que:");
      console.log("1. Le serveur Next.js est démarré (npm run dev)");
      console.log("2. L'ID de l'organisation est correct");
      console.log("3. MongoDB est accessible");
      return;
    }

    console.log("✅ Succès!\n");
    console.log(`📋 Organisation: ${data.organization.name}`);
    console.log(`📊 Résultats:\n`);

    data.results.forEach((result) => {
      const icon = result.status === "success" ? "✅" : "❌";
      console.log(`${icon} ${result.email} - ${result.message}`);
    });

    console.log("\n🎉 Terminé!");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.log(
      "\n💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)"
    );
  }
}

removeMembers();
