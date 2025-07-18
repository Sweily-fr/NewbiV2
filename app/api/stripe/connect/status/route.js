import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      );
    }

    // Ici vous devriez récupérer l'ID du compte Stripe depuis votre base de données
    // Pour cet exemple, nous simulons la récupération
    // const stripeAccountId = await getUserStripeAccountId(userId);
    
    // Si vous avez l'ID du compte, vérifiez son statut
    // const account = await stripe.accounts.retrieve(stripeAccountId);
    
    // Pour l'instant, nous simulons le statut
    const isConnected = false; // Changez selon votre logique
    
    return NextResponse.json({
      connected: isConnected,
      // account: account, // Informations du compte si connecté
    });

  } catch (error) {
    console.error('Erreur vérification statut Stripe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut Stripe' },
      { status: 500 }
    );
  }
}
