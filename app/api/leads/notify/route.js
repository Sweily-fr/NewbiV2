import { NextResponse } from "next/server";
import { resend } from "@/src/lib/resend";
import { emailTemplates } from "@/src/lib/email-templates";
import { withErrorHandler } from "@/src/lib/security";

async function handler(request) {
  // Vérifier le secret partagé
  // TODO: retirer x-api-secret après migration de tous les appelants (~Sprint 9)
  const apiSecret =
    request.headers.get("x-internal-secret") ||
    request.headers.get("x-api-secret"); // rétro-compat temporaire
  if (!apiSecret || apiSecret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
