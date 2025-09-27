import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      );
    }

    // Ici vous devriez récupérer l'ID du compte Stripe depuis votre base de données
    // Pour cet exemple, nous simulons la récupération
    // const stripeAccountId = await getUserStripeAccountId(userId);
    
    // Si vous avez l'ID du compte Stripe, vous pouvez le supprimer
    // await stripe.accounts.del(stripeAccountId);

    // Ici vous devriez supprimer l'ID du compte Stripe de votre base de données
    // await removeUserStripeAccount(userId);

    return NextResponse.json({
      success: true,
      message: 'Compte Stripe déconnecté avec succès',
    });

  } catch (error) {
    console.error('Erreur déconnexion Stripe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion du compte Stripe' },
      { status: 500 }
    );
  }
}
