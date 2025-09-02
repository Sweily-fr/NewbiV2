// Cette route n'est plus nécessaire
// Les webhooks Stripe doivent pointer vers /api/auth/stripe/webhook
// qui est géré automatiquement par Better Auth

export async function POST(request) {
  return new Response('Utilisez /api/auth/stripe/webhook pour les webhooks Stripe', { status: 200 });
}
