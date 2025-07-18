import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId et email sont requis' },
        { status: 400 }
      );
    }

    // Créer un compte Stripe Connect
    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      metadata: {
        userId: userId,
      },
    });

    // Créer un lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=security&stripe_refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=security&stripe_success=true`,
      type: 'account_onboarding',
    });

    // Ici vous devriez sauvegarder l'ID du compte Stripe dans votre base de données
    // associé à l'utilisateur
    console.log('Compte Stripe créé:', account.id, 'pour utilisateur:', userId);

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
    });

  } catch (error) {
    console.error('Erreur création compte Stripe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte Stripe' },
      { status: 500 }
    );
  }
}
