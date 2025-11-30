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
  const reactivationUrl = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/reactivate-account?email=${encodeURIComponent(user.email)}&token=${generateReactivationToken(user._id.toString())}`;

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
    console.log(
      `[${context} DEV] Code de vérification pour ${phoneNumber}: ${code}`
    );
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

// Fonction générique pour envoyer un email
export async function sendEmail({
  to,
  subject,
  html,
  from = "Newbi <noreply@newbi.sweily.fr>",
}) {
  try {
    await resend.emails.send({
      to,
      subject,
      html,
      from,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    throw error;
  }
}

// Fonction pour envoyer un email de paiement échoué
export async function sendPaymentFailedEmail({
  to,
  customerName,
  amount,
  invoiceUrl,
}) {
  const updatePaymentUrl = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/dashboard/settings?tab=subscription`;

  await sendEmail({
    to,
    subject: "⚠️ Échec du paiement de votre abonnement Newbi",
    html: emailTemplates.paymentFailed({
      customerName,
      amount,
      invoiceUrl,
      updatePaymentUrl,
    }),
  });
}

// Fonction pour envoyer un email de changement d'abonnement
export async function sendSubscriptionChangedEmail({
  to,
  customerName,
  oldPlan,
  newPlan,
  newPrice,
  isUpgrade,
  effectiveDate,
}) {
  await sendEmail({
    to,
    subject: isUpgrade
      ? "🎉 Votre abonnement Newbi a été amélioré !"
      : "✅ Votre abonnement Newbi a été modifié",
    html: emailTemplates.subscriptionChanged({
      customerName,
      oldPlan,
      newPlan,
      newPrice,
      isUpgrade,
      effectiveDate,
    }),
  });
}

// Fonction pour envoyer un email de nouvel abonnement
export async function sendSubscriptionCreatedEmail({
  to,
  customerName,
  plan,
  price,
  billingInterval,
  features,
}) {
  await sendEmail({
    to,
    subject: "Bienvenue sur Newbi - Votre abonnement est activé",
    html: emailTemplates.subscriptionCreated({
      customerName,
      plan,
      price,
      billingInterval,
      features,
    }),
  });
}

// Fonction pour envoyer un email d'annulation d'abonnement
export async function sendSubscriptionCancelledEmail({
  to,
  customerName,
  plan,
  endDate,
}) {
  await sendEmail({
    to,
    subject: "Annulation d'abonnement confirmée - Newbi",
    html: emailTemplates.subscriptionCancelled({
      customerName,
      plan,
      endDate,
    }),
  });
}

// Fonction pour envoyer un email d'alerte limite de sièges
export async function sendSeatLimitWarningEmail({
  to,
  customerName,
  plan,
  currentMembers,
  includedSeats,
  availableSeats,
}) {
  await sendEmail({
    to,
    subject: "Limite de sièges bientôt atteinte - Newbi",
    html: emailTemplates.seatLimitWarning({
      customerName,
      plan,
      currentMembers,
      includedSeats,
      availableSeats,
    }),
  });
}

// Fonction pour envoyer un email d'ajout de siège additionnel
export async function sendAdditionalSeatAddedEmail({
  to,
  customerName,
  plan,
  currentMembers,
  includedSeats,
  additionalSeats,
  monthlyCost,
}) {
  await sendEmail({
    to,
    subject: "Siège additionnel ajouté à votre abonnement - Newbi",
    html: emailTemplates.additionalSeatAdded({
      customerName,
      plan,
      currentMembers,
      includedSeats,
      additionalSeats,
      monthlyCost,
    }),
  });
}

// Fonction pour envoyer un email de rappel de renouvellement
export async function sendRenewalReminderEmail({
  to,
  customerName,
  plan,
  price,
  renewalDate,
  amount,
}) {
  await sendEmail({
    to,
    subject: "Renouvellement de votre abonnement dans 7 jours - Newbi",
    html: emailTemplates.renewalReminder({
      customerName,
      plan,
      price,
      renewalDate,
      amount,
    }),
  });
}

// Fonction pour envoyer un email d'invitation d'organisation
export async function sendOrganizationInvitationEmail(data) {
  // Construire le lien d'invitation avec les informations de base
  const inviteLink = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/accept-invitation/${data.id}?org=${encodeURIComponent(data.organization.name)}&email=${encodeURIComponent(data.email)}&role=${encodeURIComponent(data.role)}`;

  try {
    // Envoyer l'email d'invitation via Resend
    await sendEmail({
      to: data.email,
      subject: `${data.inviter.user.name || data.inviter.user.email} vous a invité·e à travailler dans ${data.organization.name}`,
      html: emailTemplates.organizationInvitation(data, inviteLink),
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email d'invitation:", error);
    throw error;
  }
}
