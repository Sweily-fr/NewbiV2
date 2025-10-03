import { NextResponse } from 'next/server';
import { mongoDb } from '@/src/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId est requis' },
        { status: 400 }
      );
    }

    // Récupérer le compte Stripe Connect de l'utilisateur
    const stripeAccount = await mongoDb.collection('stripeconnectaccounts').findOne({
      userId: new ObjectId(userId)
    });

    if (!stripeAccount) {
      return NextResponse.json({
        success: false,
        message: 'Aucun compte Stripe Connect trouvé',
      });
    }

    return NextResponse.json({
      success: true,
      accountId: stripeAccount.accountId,
      isOnboarded: stripeAccount.isOnboarded,
      chargesEnabled: stripeAccount.chargesEnabled,
      payoutsEnabled: stripeAccount.payoutsEnabled,
    });

  } catch (error) {
    console.error('❌ Erreur récupération compte Stripe:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
