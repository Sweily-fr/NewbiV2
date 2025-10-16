import { NextResponse } from "next/server";
import { emailTemplates } from "@/src/lib/email-templates";
import { sendEmail } from "@/src/lib/auth-utils";

export async function POST(request) {
  try {
    const { template, email, params } = await request.json();

    if (!email || !template) {
      return NextResponse.json(
        { error: "Email et template requis" },
        { status: 400 }
      );
    }

    // Vérifier que le template existe
    if (!emailTemplates[template]) {
      return NextResponse.json(
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    // Générer le HTML du template
    const htmlContent = emailTemplates[template](...params);

    // Titres des emails selon le template
    const emailSubjects = {
      reactivation: "Réactivez votre compte Newbi",
      twoFactor: "Votre code de vérification 2FA",
      resetPassword: "Réinitialisez votre mot de passe",
      emailVerification: "Vérifiez votre adresse e-mail",
      organizationInvitation: "Invitation à rejoindre une organisation",
      memberJoinedNotificationOwner: "Nouveau membre dans votre organisation",
      memberJoinedConfirmation: "Bienvenue dans l'organisation",
      memberJoinedNotificationInviter: "Votre invitation a été acceptée",
    };

    // Envoyer l'email via la fonction Better Auth (Resend)
    await sendEmail({
      to: email,
      subject: emailSubjects[template] || "Email de test Newbi",
      html: htmlContent,
      from: "Newbi <noreply@newbi.sweily.fr>",
    });

    return NextResponse.json({
      success: true,
      message: `Email envoyé avec succès à ${email}`,
    });
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email", details: error.message },
      { status: 500 }
    );
  }
}
