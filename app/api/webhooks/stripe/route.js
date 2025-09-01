import { auth } from '@/src/lib/auth';
import { headers } from 'next/headers';

export async function POST(request) {
  try {
    // Le plugin Better Auth Stripe gère automatiquement les webhooks
    // Cette route délègue le traitement au plugin
    const response = await auth.api.webhookHandler({
      request,
      headers: await headers(),
    });

    return response;
  } catch (error) {
    console.error('Erreur webhook Stripe:', error);
    return new Response('Webhook Error', { status: 400 });
  }
}
