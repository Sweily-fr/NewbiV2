import { resend } from "./resend";
import { emailTemplates } from "./email-templates";

// Fonction pour générer un token de réactivation
export function generateReactivationToken(userId) {
  // Simple token basé sur l'ID utilisateur et timestamp
  const timestamp = Date.now();
  return Buffer.from(`${userId}:${timestamp}`).toString("base64");
}

// Fonction pour envoyer un email de réactivation
export async function sendReactivationEmail(user) {
  const reactivationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reactivate-account?email=${encodeURIComponent(user.email)}&token=${generateReactivationToken(user._id.toString())}`;

  await resend.emails.send({
    to: user.email,
    subject: "Réactivez votre compte - Newbi",
    html: emailTemplates.reactivation(reactivationUrl),
    from: "Newbi <noreply@newbi.sweily.fr>",
  });
}

// Fonction pour envoyer un SMS (développement)
export function sendSMSInDevelopment(phoneNumber, code, context = "SMS") {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${context} DEV] Code de vérification pour ${phoneNumber}: ${code}`);
  }
  
  // TODO: Intégrer un vrai service SMS en production
  // Exemple avec Twilio:
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: `Votre code de vérification ${context} Newbi: ${code}`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phoneNumber
  // });
}

// Fonction pour envoyer un email 2FA
export async function send2FAEmail(user, otp) {
  try {
    await resend.emails.send({
      to: user.email,
      subject: "Code de vérification 2FA - Newbi",
      html: emailTemplates.twoFactor(otp),
      from: "Newbi <noreply@newbi.sweily.fr>",
    });
    console.log(`[2FA EMAIL] Code envoyé avec succès à ${user.email}`);
  } catch (error) {
    console.error(`[2FA EMAIL] Erreur lors de l'envoi:`, error);
    throw error;
  }
}

// Fonction pour envoyer un email de réinitialisation de mot de passe
export async function sendResetPasswordEmail(user, url) {
  await resend.emails.send({
    to: user.email,
    subject: "Réinitialisez votre mot de passe - Newbi",
    html: emailTemplates.resetPassword(url),
    from: "Newbi <noreply@newbi.sweily.fr>",
  });
}

// Fonction pour envoyer un email de vérification
export async function sendVerificationEmail(user, url) {
  await resend.emails.send({
    to: user.email,
    subject: "Vérifiez votre adresse e-mail - Newbi",
    html: emailTemplates.emailVerification(url),
    from: "Newbi <noreply@newbi.sweily.fr>",
  });
}

// Fonction pour envoyer un email d'invitation d'organisation
export async function sendOrganizationInvitationEmail(data) {
  console.log("Envoi d'email d'invitation:", data);

  // Construire le lien d'invitation avec les informations de base
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation/${data.id}?org=${encodeURIComponent(data.organization.name)}&email=${encodeURIComponent(data.email)}&role=${encodeURIComponent(data.role)}`;

  try {
    // Envoyer l'email d'invitation via Resend
    await resend.emails.send({
      to: data.email,
      subject: `${data.inviter.user.name || data.inviter.user.email} vous a invité·e à travailler dans ${data.organization.name}`,
      html: emailTemplates.organizationInvitation(data, inviteLink),
      from: "Newbi <noreply@newbi.sweily.fr>",
    });

    console.log("Email d'invitation envoyé avec succès à:", data.email);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email d'invitation:", error);
    throw error;
  }
}
