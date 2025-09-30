/**
 * Script pour créer des prix HT dans Stripe
 * À exécuter une seule fois pour créer les nouveaux prix
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createHTprices() {
  try {
    console.log('🔄 Création des prix HT dans Stripe...');

    // Prix mensuel HT
    const monthlyPrice = await stripe.prices.create({
      unit_amount: 1249, // 12,49€ HT en centimes
      currency: 'eur',
      recurring: { interval: 'month' },
      product: process.env.STRIPE_PRODUCT_ID, // ID de votre produit Pro
      tax_behavior: 'exclusive', // Prix hors taxes
      nickname: 'Pro Mensuel HT',
    });

    // Prix annuel HT (avec réduction déjà appliquée)
    const annualPrice = await stripe.prices.create({
      unit_amount: 11240, // 112,40€ HT en centimes (équivalent à 11,24€/mois)
      currency: 'eur',
      recurring: { interval: 'year' },
      product: process.env.STRIPE_PRODUCT_ID,
      tax_behavior: 'exclusive', // Prix hors taxes
      nickname: 'Pro Annuel HT (avec réduction)',
    });

    console.log('✅ Prix créés avec succès !');
    console.log('📋 Mettez à jour vos variables d\'environnement :');
    console.log(`STRIPE_PRICE_ID_MONTH=${monthlyPrice.id}`);
    console.log(`STRIPE_PRICE_ID_YEARS=${annualPrice.id}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création des prix :', error.message);
  }
}

// Exécuter le script
createHTprices();
