import { NextResponse } from "next/server";
import { resend } from "@/src/lib/resend";
import { emailTemplates } from "@/src/lib/email-templates";

export async function POST(request) {
  try {
    // Vérifier le secret partagé
    const authHeader = request.headers.get("x-api-secret");
    if (authHeader !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lead, recipients } = await request.json();

    if (!lead || !recipients?.length) {
      return NextResponse.json(
        { error: "lead et recipients sont requis" },
        { status: 400 }
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
  } catch (error) {
    console.error("[API /leads/notify] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
