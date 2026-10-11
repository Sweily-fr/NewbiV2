import { NextResponse } from "next/server";
import { resend } from "@/src/lib/resend";
import { emailTemplates } from "@/src/lib/email-templates";
import { requireInternalSecret, withErrorHandler } from "@/src/lib/security";

async function handler(request) {
  // Secret interne comparé en temps constant ; l'ancien en-tête
  // x-api-secret n'est plus accepté (l'API envoie x-internal-secret).
  requireInternalSecret(request);

  const { lead, recipients } = await request.json();

  if (!lead || !recipients?.length) {
    return NextResponse.json(
      { error: "lead et recipients sont requis" },
      { status: 400 },
    );
  }

  const html = emailTemplates.guideLeadNotification(lead);

  await resend.emails.send({
    to: recipients,
    subject: `Nouveau lead guide facturation — ${lead.firstName} ${lead.lastName}`,
    html,
    from: "Newbi <noreply@newbi.sweily.fr>",
  });

  return NextResponse.json({ success: true });
}

export const POST = withErrorHandler(handler);
