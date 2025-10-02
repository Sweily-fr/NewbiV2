/**
 * Script de test pour vérifier la facturation par siège
 * 
 * Usage:
 * node scripts/test-seat-billing.js <organizationId>
 */

const Stripe = require("stripe");
require("dotenv").config({ path: ".env" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SEAT_PRICE_ID = process.env.STRIPE_SEAT_PRICE_ID;

async function testSeatBilling(organizationId) {
  console.log("🔍 Test de la facturation par siège\n");
  console.log(`Organization ID: ${organizationId}\n`);

  try {
    // 1. Vérifier les variables d'environnement
    console.log("📋 Vérification des variables d'environnement:");
    console.log(`✅ STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? "Définie" : "❌ MANQUANTE"}`);
    console.log(`✅ STRIPE_SEAT_PRICE_ID: ${SEAT_PRICE_ID || "❌ MANQUANTE"}\n`);

    if (!SEAT_PRICE_ID) {
      console.error("❌ STRIPE_SEAT_PRICE_ID n'est pas définie dans .env");
      process.exit(1);
    }

    // 2. Vérifier que le prix existe dans Stripe
    console.log("💳 Vérification du prix dans Stripe:");
    try {
      const price = await stripe.prices.retrieve(SEAT_PRICE_ID);
      console.log(`✅ Prix trouvé: ${price.nickname || "Siège Collaborateur"}`);
      console.log(`   Montant: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
      console.log(`   Récurrence: ${price.recurring.interval}\n`);
    } catch (error) {
      console.error(`❌ Prix introuvable: ${error.message}`);
      process.exit(1);
    }

    // 3. Récupérer l'abonnement de l'organisation
    console.log("🔍 Recherche de l'abonnement:");
    
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(process.env.MONGODB_URI);
    
    await client.connect();
    const db = client.db();
    
    const subscription = await db.collection("subscription").findOne({
      referenceId: organizationId
    });

    if (!subscription) {
      console.error(`❌ Aucun abonnement trouvé pour l'organisation ${organizationId}`);
      await client.close();
      process.exit(1);
    }

    console.log(`✅ Abonnement trouvé: ${subscription.stripeSubscriptionId}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Plan: ${subscription.planName}\n`);

    // 4. Récupérer les détails Stripe
    console.log("💳 Détails Stripe:");
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    console.log(`Status: ${stripeSubscription.status}`);
    console.log(`Items:\n`);

    let baseCost = 0;
    let seatCost = 0;
    let seatQuantity = 0;

    stripeSubscription.items.data.forEach((item, index) => {
      const amount = item.price.unit_amount / 100;
      const currency = item.price.currency.toUpperCase();
      const quantity = item.quantity;
      const total = amount * quantity;

      console.log(`  ${index + 1}. ${item.price.nickname || item.price.id}`);
      console.log(`     ${amount} ${currency} × ${quantity} = ${total} ${currency}/month`);

      if (item.price.id === SEAT_PRICE_ID) {
        seatCost = total;
        seatQuantity = quantity;
      } else {
        baseCost = total;
      }
    });

    const totalCost = baseCost + seatCost;

    console.log(`\n📊 Résumé:`);
    console.log(`   Plan de base: ${baseCost} EUR/month`);
    console.log(`   Sièges additionnels: ${seatQuantity} × 7.49 EUR = ${seatCost} EUR/month`);
    console.log(`   ─────────────────────────────────────`);
    console.log(`   TOTAL: ${totalCost} EUR/month\n`);

    // 5. Compter les membres dans la BDD
    console.log("👥 Membres de l'organisation:");
    const members = await db.collection("member").find({
      organizationId: organizationId
    }).toArray();

    console.log(`   Total membres: ${members.length}`);
    
    const owners = members.filter(m => m.role === "owner");
    const others = members.filter(m => m.role !== "owner");

    console.log(`   - Propriétaires: ${owners.length} (inclus dans le plan de base)`);
    console.log(`   - Collaborateurs: ${others.length} (sièges additionnels)\n`);

    // 6. Vérifier la cohérence
    console.log("✅ Vérification de cohérence:");
    if (others.length === seatQuantity) {
      console.log(`   ✅ CORRECT: ${others.length} collaborateurs = ${seatQuantity} sièges facturés`);
    } else {
      console.log(`   ❌ DÉSYNCHRONISÉ: ${others.length} collaborateurs ≠ ${seatQuantity} sièges facturés`);
      console.log(`   💡 Utilisez l'API de synchronisation pour corriger`);
    }

    // 7. Prochaine facture
    console.log("\n💰 Prochaine facture:");
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: stripeSubscription.customer
    });

    const nextAmount = upcomingInvoice.amount_due / 100;
    const nextDate = new Date(upcomingInvoice.period_end * 1000);

    console.log(`   Montant: ${nextAmount} EUR`);
    console.log(`   Date: ${nextDate.toLocaleDateString("fr-FR")}\n`);

    await client.close();

    console.log("✅ Test terminé avec succès !");
    
  } catch (error) {
    console.error("\n❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Récupérer l'organizationId depuis les arguments
const organizationId = process.argv[2];

if (!organizationId) {
  console.error("❌ Usage: node scripts/test-seat-billing.js <organizationId>");
  console.error("\nExemple: node scripts/test-seat-billing.js org_123456789");
  process.exit(1);
}

testSeatBilling(organizationId);
