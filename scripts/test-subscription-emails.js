/**
 * Script de test pour les emails d'abonnement
 * Envoie les nouveaux templates d'emails à une adresse de test
 *
 * Usage: node scripts/test-subscription-emails.js
 */

import { readFileSync } from "fs";
import { Resend } from "resend";
import { emailTemplates } from "../src/lib/email-templates.js";

// Charger les variables d'environnement manuellement
const envFile = readFileSync(".env", "utf-8");
const envVars = {};
envFile.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join("=").trim();
  }
});

const TEST_EMAIL = "luffy32291@gmail.com";
const resend = new Resend(envVars.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  try {
    await resend.emails.send({
      to,
      subject,
      html,
      from: "Newbi <noreply@newbi.sweily.fr>",
    });
    return true;
  } catch (error) {
    console.error("Erreur envoi email:", error);
    throw error;
  }
}

async function testSubscriptionEmails() {
  console.log("🧪 Test des emails d'abonnement...\n");

  try {
    // 1. Test email de nouvel abonnement (Plan Freelance)
    console.log("📧 Envoi de l'email de nouvel abonnement (Freelance)...");
    await sendEmail({
      to: TEST_EMAIL,
      subject: "Bienvenue sur Newbi - Votre abonnement est activé",
      html: emailTemplates.subscriptionCreated({
        customerName: "Luffy",
        plan: "FREELANCE",
        price: "14,59€/mois",
        billingInterval: "Mensuelle",
        features: [
          "1 utilisateur inclus",
          "Facturation complète",
          "Gestion client et fournisseurs",
          "OCR des reçus",
          "Catalogue produits",
          "Rapports financiers",
        ],
      }),
    });
    console.log("✅ Email Freelance envoyé avec succès\n");

    // Attendre 2 secondes entre les emails
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Test email de nouvel abonnement (Plan PME)
    console.log("📧 Envoi de l'email de nouvel abonnement (PME)...");
    await sendEmail({
      to: TEST_EMAIL,
      subject: "Bienvenue sur Newbi - Votre abonnement est activé",
      html: emailTemplates.subscriptionCreated({
        customerName: "Luffy",
        plan: "PME",
        price: "48,99€/mois",
        billingInterval: "Mensuelle",
        features: [
          "10 utilisateurs inclus",
          "Toutes les fonctionnalités Freelance",
          "Connexion comptes bancaires",
          "Gestion de trésorerie",
          "Transfert de fichiers sécurisé",
          "Rapports avancés",
        ],
      }),
    });
    console.log("✅ Email PME envoyé avec succès\n");

    // Attendre 2 secondes entre les emails
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Test email de nouvel abonnement (Plan Entreprise)
    console.log("📧 Envoi de l'email de nouvel abonnement (Entreprise)...");
    await sendEmail({
      to: TEST_EMAIL,
      subject: "Bienvenue sur Newbi - Votre abonnement est activé",
      html: emailTemplates.subscriptionCreated({
        customerName: "Luffy",
        plan: "ENTREPRISE",
        price: "94,99€/mois",
        billingInterval: "Mensuelle",
        features: [
          "25 utilisateurs inclus",
          "Toutes les fonctionnalités PME",
          "Support prioritaire",
          "Sièges additionnels (7,49€/mois)",
          "Gestion multi-organisations",
          "API access",
        ],
      }),
    });
    console.log("✅ Email Entreprise envoyé avec succès\n");

    // Attendre 2 secondes entre les emails
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. Test email de nouvel abonnement (Plan Annuel)
    console.log("📧 Envoi de l'email de nouvel abonnement (PME Annuel)...");
    await sendEmail({
      to: TEST_EMAIL,
      subject: "Bienvenue sur Newbi - Votre abonnement est activé",
      html: emailTemplates.subscriptionCreated({
        customerName: "Luffy",
        plan: "PME",
        price: "44,09€/mois",
        billingInterval: "Annuelle",
        features: [
          "10 utilisateurs inclus",
          "Toutes les fonctionnalités Freelance",
          "Connexion comptes bancaires",
          "Gestion de trésorerie",
          "Transfert de fichiers sécurisé",
          "Rapports avancés",
        ],
      }),
    });
    console.log("✅ Email PME Annuel envoyé avec succès\n");

    // Attendre 2 secondes entre les emails
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 5. Test email d'annulation
    console.log("📧 Envoi de l'email d'annulation d'abonnement...");
    await sendEmail({
      to: TEST_EMAIL,
      subject: "Annulation d'abonnement confirmée - Newbi",
      html: emailTemplates.subscriptionCancelled({
        customerName: "Luffy",
        plan: "ENTREPRISE",
        endDate: "25 décembre 2025",
      }),
    });
    console.log("✅ Email d'annulation envoyé avec succès\n");

    // Attendre 2 secondes entre les emails
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 6. Test email d'alerte limite de sièges
    console.log("📧 Envoi de l'email d'alerte limite de sièges...");
    await sendEmail({
      to: TEST_EMAIL,
      subject: "Limite de sièges bientôt atteinte - Newbi",
      html: emailTemplates.seatLimitWarning({
        customerName: "Luffy",
        plan: "PME",
        currentMembers: 9,
        includedSeats: 10,
        availableSeats: 1,
      }),
    });
    console.log("✅ Email alerte limite envoyé avec succès\n");

    // Attendre 2 secondes entre les emails
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 7. Test email d'ajout de siège additionnel
    console.log("📧 Envoi de l'email d'ajout de siège additionnel...");
    await sendEmail({
      to: TEST_EMAIL,
      subject: "Siège additionnel ajouté à votre abonnement - Newbi",
      html: emailTemplates.additionalSeatAdded({
        customerName: "Luffy",
        plan: "PME",
        currentMembers: 12,
        includedSeats: 10,
        additionalSeats: 2,
        monthlyCost: "14,98€/mois",
      }),
    });
    console.log("✅ Email siège additionnel envoyé avec succès\n");

    // Attendre 2 secondes entre les emails
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 8. Test email de rappel de renouvellement
    console.log("📧 Envoi de l'email de rappel de renouvellement...");
    await sendEmail({
      to: TEST_EMAIL,
      subject: "Renouvellement de votre abonnement dans 7 jours - Newbi",
      html: emailTemplates.renewalReminder({
        customerName: "Luffy",
        plan: "ENTREPRISE",
        price: "94,99€/mois",
        renewalDate: "7 décembre 2025",
        amount: "94,99€",
      }),
    });
    console.log("✅ Email rappel renouvellement envoyé avec succès\n");

    console.log("🎉 Tous les emails ont été envoyés avec succès !");
    console.log(`📬 Vérifiez votre boîte mail : ${TEST_EMAIL}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des emails:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
testSubscriptionEmails()
  .then(() => {
    console.log("\n✅ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exit(1);
  });
