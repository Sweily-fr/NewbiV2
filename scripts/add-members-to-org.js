/**
 * Script pour ajouter des membres à une organisation via l'API
 *
 * Usage:
 * 1. Assurez-vous que le serveur est démarré (npm run dev)
 * 2. Connectez-vous sur http://localhost:3000
 * 3. Lancez: node scripts/add-members-to-org.js
 *
 * Pour personnaliser, modifiez ORGANIZATION_ID et MEMBERS ci-dessous
 */

// ============================================
// CONFIGURATION - Modifiez ces valeurs
// ============================================

const API_URL = "http://localhost:3000/api/admin/create-test-users";

// ID de votre organisation (trouvable dans MongoDB ou dans l'URL du dashboard)
const ORGANIZATION_ID = "6925c029130f0b0eca2ba765"; // "One piece"

// Membres à ajouter
const MEMBERS = [
  {
    email: "usopp@onepiece.com",
    name: "Usopp",
    role: "member",
  },
  {
    email: "chopper@onepiece.com",
    name: "Tony Tony Chopper",
    role: "member",
  },
  {
    email: "franky@onepiece.com",
    name: "Franky",
    role: "member",
  },
  {
    email: "brook@onepiece.com",
    name: "Brook",
    role: "member",
  },
  {
    email: "jinbe@onepiece.com",
    name: "Jinbe",
    role: "admin",
  },
  {
    email: "ace@onepiece.com",
    name: "Portgas D. Ace",
    role: "member",
  },
  {
    email: "sabo@onepiece.com",
    name: "Sabo",
    role: "admin",
  },
  {
    email: "shanks@onepiece.com",
    name: "Shanks",
    role: "admin",
  },
  {
    email: "law@onepiece.com",
    name: "Trafalgar Law",
    role: "member",
  },
  {
    email: "kid@onepiece.com",
    name: "Eustass Kid",
    role: "member",
  },
  {
    email: "yamato@onepiece.com",
    name: "Yamato",
    role: "member",
  },
  {
    email: "vivi@onepiece.com",
    name: "Nefertari Vivi",
    role: "guest",
  },
  {
    email: "hancock@onepiece.com",
    name: "Boa Hancock",
    role: "member",
  },
  {
    email: "rayleigh@onepiece.com",
    name: "Silvers Rayleigh",
    role: "admin",
  },
  {
    email: "marco@onepiece.com",
    name: "Marco",
    role: "member",
  },
  {
    email: "katakuri@onepiece.com",
    name: "Charlotte Katakuri",
    role: "member",
  },
  {
    email: "crocodile@onepiece.com",
    name: "Crocodile",
    role: "guest",
  },
  {
    email: "doflamingo@onepiece.com",
    name: "Donquixote Doflamingo",
    role: "guest",
  },
  {
    email: "mihawk@onepiece.com",
    name: "Dracule Mihawk",
    role: "member",
  },
  {
    email: "buggy@onepiece.com",
    name: "Buggy",
    role: "guest",
  },
];

// ============================================
// NE PAS MODIFIER EN DESSOUS
// ============================================

async function addMembers() {
  console.log("🚀 Démarrage de l'ajout de membres...\n");

  try {
    console.log("📝 Ajout de membres à l'organisation:", ORGANIZATION_ID);
    console.log(`👥 Nombre de membres à ajouter: ${MEMBERS.length}\n`);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId: ORGANIZATION_ID,
        members: MEMBERS,
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
      const icon =
        result.status === "success"
          ? "✅"
          : result.status === "already_member"
            ? "⚠️ "
            : "❌";
      console.log(
        `${icon} ${result.email} - ${result.message} (${result.role || "N/A"})`
      );
    });

    console.log("\n🎉 Terminé!");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.log(
      "\n💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)"
    );
  }
}

addMembers();
