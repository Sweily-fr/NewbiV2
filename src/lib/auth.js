import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoDb } from "./mongodb";
import { resend } from "./resend";
import {
  admin,
  organization,
  phoneNumber,
  twoFactor,
} from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { createAuthMiddleware } from "better-auth/api";
import { authClient } from "./auth-client";
import Stripe from "stripe";
// import { bearer } from "better-auth/plugins";

// Fonction pour envoyer un email de réactivation
async function sendReactivationEmail(user) {
  const reactivationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reactivate-account?email=${encodeURIComponent(user.email)}&token=${generateReactivationToken(user._id.toString())}`;
  
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réactivez votre compte</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Réactivez votre compte
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Votre compte a été désactivé. Cliquez sur le bouton ci-dessous pour le réactiver et retrouver l'accès à vos données.
        </p>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${reactivationUrl}" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Réactiver mon compte
          </a>
        </div>
        
        <!-- Lien de secours -->
        <p style="font-size: 11px; line-height: 1.4; color: #9ca3af; margin: 32px 0 0 0; text-align: center;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <span style="color: #5B4FFF; word-break: break-all;">${reactivationUrl}</span>
        </p>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette réactivation, ignorez cet e-mail.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    to: user.email,
    subject: "Réactivez votre compte - Newbi",
    html: htmlTemplate,
    from: "Newbi <noreply@newbi.sweily.fr>",
  });
}

// Fonction pour générer un token de réactivation
function generateReactivationToken(userId) {
  // Simple token basé sur l'ID utilisateur et timestamp
  const timestamp = Date.now();
  return Buffer.from(`${userId}:${timestamp}`).toString('base64');
}

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  appName: "Newbi",
  plugins: [
    admin({
      adminUserIds: ["685ff0250e083b9a2987a0b9"],
      defaultRole: "owner", // Rôle par défaut pour les nouveaux utilisateurs
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }, request) => {
        console.log(`[SMS] Envoi du code ${code} vers ${phoneNumber}`);

        // Pour le développement, on simule l'envoi
        // En production, vous devrez intégrer un service SMS comme Twilio, AWS SNS, etc.

        // En développement, afficher le code dans les logs
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[SMS DEV] Code de vérification pour ${phoneNumber}: ${code}`
          );
        }

        // TODO: Intégrer un vrai service SMS en production
        // Exemple avec Twilio:
        // const twilio = require('twilio');
        // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        // await client.messages.create({
        //   body: `Votre code de vérification Newbi: ${code}`,
        //   from: process.env.TWILIO_PHONE_NUMBER,
        //   to: phoneNumber
        // });

        return { success: true };
      },
    }),
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp, type }, request) {
          console.log(
            `[2FA PLUGIN] ========== FONCTION SENDOTP APPELÉE ==========`
          );
          console.log(
            `[2FA] Envoi du code ${otp} vers ${user.email} (type: ${type})`
          );
          console.log(`🔐 CODE DE VÉRIFICATION 2FA: ${otp}`);
          console.log(
            `[DEBUG] Type reçu: "${type}" | User phoneNumber: "${user.phoneNumber}"`
          );

          // Better Auth ne passe pas automatiquement type="sms"
          // Il faut détecter manuellement si l'utilisateur a un phoneNumber
          const shouldUseSMS =
            user.phoneNumber && user.phoneNumber.trim() !== "";

          if (shouldUseSMS) {
            // Envoi par SMS
            console.log(
              `[2FA SMS] Code de vérification pour ${user.phoneNumber}: ${otp}`
            );

            // En développement, afficher le code dans les logs
            if (process.env.NODE_ENV === "development") {
              console.log(
                `[2FA SMS DEV] Code de vérification pour ${user.phoneNumber}: ${otp}`
              );
            }

            // TODO: Intégrer un vrai service SMS en production
            // Exemple avec Twilio:
            // const twilio = require('twilio');
            // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            // await client.messages.create({
            //   body: `Votre code de vérification 2FA Newbi: ${otp}`,
            //   from: process.env.TWILIO_PHONE_NUMBER,
            //   to: user.phoneNumber
            // });
          } else {
            // Envoi par email via Resend
            try {
              await resend.emails.send({
                to: user.email,
                subject: "Code de vérification 2FA - Newbi",
                html: `
                  <!DOCTYPE html>
                  <html lang="fr">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Code de vérification 2FA</title>
                  </head>
                  <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
                    <div style="max-width: 500px; margin: 0 auto;">
                      
                      <!-- Logo -->
                      <div style="text-align: center; margin-bottom: 40px;">
                        <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px;">
                      </div>
                      
                      <!-- Titre principal -->
                      <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
                        Code de vérification 2FA
                      </h1>
                      
                      <!-- Message principal -->
                      <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
                        Voici votre code de vérification à usage unique pour l'authentification à deux facteurs :
                      </p>
                      
                      <!-- Code OTP -->
                      <div style="text-align: center; margin: 32px 0;">
                        <div style="display: inline-block; background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px 40px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1f2937;">
                          ${otp}
                        </div>
                      </div>
                      
                      <!-- Instructions -->
                      <p style="font-size: 14px; line-height: 1.4; color: #6b7280; margin: 32px 0 0 0; text-align: center;">
                        Ce code expire dans 10 minutes. Si vous n'avez pas demandé cette vérification, ignorez cet e-mail.
                      </p>
                      
                    </div>
                  </body>
                  </html>
                `,
                from: "Newbi <noreply@newbi.sweily.fr>",
              });
              console.log(
                `[2FA EMAIL] Code envoyé avec succès à ${user.email}`
              );
            } catch (error) {
              console.error(`[2FA EMAIL] Erreur lors de l'envoi:`, error);
              throw error;
            }
          }

          return { success: true };
        },
      },
    }),
    stripe({
      stripeClient: new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-02-24.acacia",
      }),
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      createCustomerOnSignUp: false, // Désactivé car on gère les abonnements au niveau organisation
      subscription: {
        enabled: true,
        authorizeReference: async (
          { user, session, referenceId, action },
          request
        ) => {
          console.log(
            `[STRIPE] Autorisation pour ${action} sur org ${referenceId} par user ${user.id}`
          );

          // Vérification des permissions selon la documentation Better Auth
          console.log(`[STRIPE] Début de la vérification d'autorisation`);
          console.log(`[STRIPE] User ID: ${user.id}`);
          console.log(`[STRIPE] Reference ID (org): ${referenceId}`);
          console.log(`[STRIPE] Action: ${action}`);

          // Vérifier si l'utilisateur a les permissions pour gérer les abonnements
          if (
            action === "upgrade-subscription" ||
            action === "cancel-subscription" ||
            action === "restore-subscription"
          ) {
            // Utiliser l'adapter Better Auth pour accéder aux données
            const adapter = auth.options.database;

            if (adapter && typeof adapter.findFirst === "function") {
              try {
                const member = await adapter.findFirst({
                  model: "member",
                  where: {
                    organizationId: referenceId,
                    userId: user.id,
                  },
                });

                console.log(`[STRIPE] Membre trouvé:`, member);
                const isOwner = member?.role === "owner";
                console.log(`[STRIPE] Est owner: ${isOwner}`);

                return isOwner;
              } catch (error) {
                console.error(
                  `[STRIPE] Erreur lors de la vérification du membre:`,
                  error
                );
                return false;
              }
            }

            // Fallback: autoriser temporairement si l'adapter ne fonctionne pas
            console.log(
              `[STRIPE] Adapter non disponible - autorisation temporaire`
            );
            return true;
          }

          return true;
        },
        plans: [
          {
            name: "free",
            priceId: process.env.STRIPE_FREE_PRICE_ID,
          },
          {
            name: "pro",
            priceId: process.env.STRIPE_PRICE_ID_MONTH,
            annualDiscountPriceId: process.env.STRIPE_PRICE_ID_YEARS,
            limits: {
              projects: 100,
              storage: 100,
              invoices: 1000,
            },
            freeTrial: {
              days: 14,
            },
          },
        ],
      },
      // Webhooks Stripe pour mettre à jour automatiquement le statut
      onEvent: async (event, adapter) => {
        console.log(`[STRIPE WEBHOOK] Événement reçu: ${event.type}`);

        switch (event.type) {
          case "checkout.session.completed":
            console.log(
              `[STRIPE WEBHOOK] Checkout complété:`,
              event.data.object
            );
            console.log(
              `[STRIPE WEBHOOK] Métadonnées session:`,
              event.data.object.metadata
            );
            const session = event.data.object;

            if (session.subscription && session.metadata?.referenceId) {
              try {
                // Récupérer les détails de l'abonnement depuis Stripe
                const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
                const subscription = await stripe.subscriptions.retrieve(
                  session.subscription
                );

                console.log(
                  `[STRIPE WEBHOOK] Création abonnement pour org: ${session.metadata.referenceId}`
                );

                // Créer l'abonnement dans Better Auth
                await adapter.create({
                  model: "subscription",
                  data: {
                    id: subscription.id,
                    referenceId: session.metadata.referenceId,
                    status: subscription.status,
                    planName: "pro", // ou récupérer depuis les métadonnées
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: subscription.customer,
                    currentPeriodStart: new Date(
                      subscription.current_period_start * 1000
                    ),
                    currentPeriodEnd: new Date(
                      subscription.current_period_end * 1000
                    ),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                });

                console.log(`[STRIPE WEBHOOK] Abonnement créé avec succès`);
              } catch (error) {
                console.error(
                  `[STRIPE WEBHOOK] Erreur création abonnement:`,
                  error
                );
              }
            }
            break;

          case "customer.subscription.updated":
            console.log(
              `[STRIPE WEBHOOK] Abonnement mis à jour:`,
              event.data.object
            );
            const updatedSub = event.data.object;

            try {
              await adapter.update({
                model: "subscription",
                where: { stripeSubscriptionId: updatedSub.id },
                data: {
                  status: updatedSub.status,
                  currentPeriodStart: new Date(
                    updatedSub.current_period_start * 1000
                  ),
                  currentPeriodEnd: new Date(
                    updatedSub.current_period_end * 1000
                  ),
                  updatedAt: new Date(),
                },
              });
              console.log(`[STRIPE WEBHOOK] Abonnement mis à jour avec succès`);
            } catch (error) {
              console.error(
                `[STRIPE WEBHOOK] Erreur mise à jour abonnement:`,
                error
              );
            }
            break;

          case "customer.subscription.deleted":
            console.log(
              `[STRIPE WEBHOOK] Abonnement annulé:`,
              event.data.object
            );
            const deletedSub = event.data.object;

            try {
              await adapter.update({
                model: "subscription",
                where: { stripeSubscriptionId: deletedSub.id },
                data: {
                  status: "canceled",
                  updatedAt: new Date(),
                },
              });
              console.log(`[STRIPE WEBHOOK] Abonnement annulé avec succès`);
            } catch (error) {
              console.error(
                `[STRIPE WEBHOOK] Erreur annulation abonnement:`,
                error
              );
            }
            break;

          case "invoice.paid":
            console.log(`[STRIPE WEBHOOK] Facture payée:`, event.data.object);
            break;
          case "payment_intent.succeeded":
            console.log(`[STRIPE WEBHOOK] Paiement réussi:`, event.data.object);
            break;
          default:
            console.log(`[STRIPE WEBHOOK] Événement non géré: ${event.type}`);
        }
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 100,
      creatorRole: "owner",
      schema: {
        organization: {
          additionalFields: {
            // Company basic information
            companyName: {
              type: "string",
              input: true,
              required: false,
            },
            companyEmail: {
              type: "string",
              input: true,
              required: false,
            },
            companyPhone: {
              type: "string",
              input: true,
              required: false,
            },
            website: {
              type: "string",
              input: true,
              required: false,
            },
            // Legal information
            siret: {
              type: "string",
              input: true,
              required: false,
            },
            vatNumber: {
              type: "string",
              input: true,
              required: false,
            },
            rcs: {
              type: "string",
              input: true,
              required: false,
            },
            legalForm: {
              type: "string",
              input: true,
              required: false,
            },
            capitalSocial: {
              type: "string",
              input: true,
              required: false,
            },
            fiscalRegime: {
              type: "string",
              input: true,
              required: false,
            },
            activityCategory: {
              type: "string",
              input: true,
              required: false,
            },
            isVatSubject: {
              type: "boolean",
              input: true,
              required: false,
            },
            hasCommercialActivity: {
              type: "boolean",
              input: true,
              required: false,
            },
            // Address information (flattened)
            addressStreet: {
              type: "string",
              input: true,
              required: false,
            },
            addressCity: {
              type: "string",
              input: true,
              required: false,
            },
            addressZipCode: {
              type: "string",
              input: true,
              required: false,
            },
            addressCountry: {
              type: "string",
              input: true,
              required: false,
            },
            // Bank details (flattened)
            bankName: {
              type: "string",
              input: true,
              required: false,
            },
            bankIban: {
              type: "string",
              input: true,
              required: false,
            },
            bankBic: {
              type: "string",
              input: true,
              required: false,
            },
            // Document appearance settings
            documentTextColor: {
              type: "string",
              input: true,
              required: false,
            },
            documentHeaderTextColor: {
              type: "string",
              input: true,
              required: false,
            },
            documentHeaderBgColor: {
              type: "string",
              input: true,
              required: false,
            },
            // Document notes settings
            documentHeaderNotes: {
              type: "string",
              input: true,
              required: false,
            },
            documentFooterNotes: {
              type: "string",
              input: true,
              required: false,
            },
            documentTermsAndConditions: {
              type: "string",
              input: true,
              required: false,
            },
            // Notes séparées pour les devis
            quoteHeaderNotes: {
              type: "string",
              input: true,
              required: false,
            },
            quoteFooterNotes: {
              type: "string",
              input: true,
              required: false,
            },
            quoteTermsAndConditions: {
              type: "string",
              input: true,
              required: false,
            },
            // Notes séparées pour les factures
            invoiceHeaderNotes: {
              type: "string",
              input: true,
              required: false,
            },
            invoiceFooterNotes: {
              type: "string",
              input: true,
              required: false,
            },
            invoiceTermsAndConditions: {
              type: "string",
              input: true,
              required: false,
            },
            // Bank details display setting
            showBankDetails: {
              type: "boolean",
              input: true,
              required: false,
            },
          },
        },
      },
      async sendInvitationEmail(data) {
        console.log("Envoi d'email d'invitation:", data);

        // Construire le lien d'invitation avec les informations de base
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation/${data.id}?org=${encodeURIComponent(data.organization.name)}&email=${encodeURIComponent(data.email)}&role=${encodeURIComponent(data.role)}`;

        try {
          // Template HTML épuré pour l'invitation
          const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Invitation à rejoindre ${data.organization.name}</title>
            </head>
            <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
              <div style="max-width: 500px; margin: 0 auto;">
                
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px;">
                </div>
                
                <!-- Titre principal -->
                <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: start;">
                  ${data.inviter.user.name || data.inviter.user.email} vous a invité·e à travailler dans ${data.organization.name}
                </h1>
                
                <!-- Message principal -->
                <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: start;">
                  Rejoignez ${data.inviter.user.name || data.inviter.user.email} pour
                  créer devis/factures, gérer la trésorerie et piloter vos projets.
                </p>
                
                <!-- Illustration de l'interface -->
               <div style="margin: 32px 0; background-color: #fafafa; border-radius: 12px; border: 1px solid #F2F2F2; overflow: hidden;">
  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; height: 350px; border-collapse: collapse;">
    <tr>
      <!-- Zone principale avec l'image -->
      <td style="height: 290px; vertical-align: top; position: relative; padding: 0;">
        <div style="width: 100%; height: 290px; position: relative; overflow: hidden;">
          <img 
            src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/Capture%20d%E2%80%99e%CC%81cran%202025-08-27%20a%CC%80%2018.18.21.png" 
            alt="Illustration" 
            style="
              float: right;
              margin-top: 50px;
              margin-right: -10px;
              width: 430px;
              height: 240px;
              border-radius: 10px;
              border: solid 2px #F2F2F2;
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
            " 
          />
        </div>
      </td>
    </tr>
    <tr>
      <!-- Footer fixé en bas -->
      <td style="height: 60px; vertical-align: bottom; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="border-top: solid 1px #F2F2F2; padding: 16px; background-color: #ffffff;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <div style="
                            width: 28px;
                            height: 28px;
                            background-color: #fafafa;
                            border-radius: 6px;
                            text-align: center;
                            line-height: 28px;
                            color: #1f2937;
                            font-weight: 600;
                            font-size: 12px;
                          ">N</div>
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 14px; font-weight: 500; color: #454545; padding-bottom: 4px;">
                            ${data.organization.name}
                          </div>
                          <div style="font-size: 12px; color: #B0B0B0;">
                            Espace de travail • 5 Membres
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                      <tr>
                        <td style="padding: 0 2px;">
                          <div style="
                            width: 24px;
                            height: 24px;
                            background-color: #fafafa;
                            border-radius: 50%;
                            text-align: center;
                            line-height: 24px;
                            color: #6b7280;
                            font-size: 10px;
                            font-weight: 600;
                          ">J</div>
                        </td>
                        <td style="padding: 0 2px;">
                          <div style="
                            width: 24px;
                            height: 24px;
                            background-color: #fafafa;
                            border-radius: 50%;
                            text-align: center;
                            line-height: 24px;
                            color: #6b7280;
                            font-size: 10px;
                            font-weight: 600;
                          ">D</div>
                        </td>
                        <td style="padding: 0 2px;">
                          <div style="
                            width: 24px;
                            height: 24px;
                            background-color: #fafafa;
                            border-radius: 50%;
                            text-align: center;
                            line-height: 24px;
                            color: #6b7280;
                            font-size: 10px;
                            font-weight: 600;
                          ">H</div>
                        </td>
                        <td style="padding: 0 2px;">
                          <div style="
                            width: 24px;
                            height: 24px;
                            background-color: #fafafa;
                            border-radius: 50%;
                            text-align: center;
                            line-height: 24px;
                            color: #6b7280;
                            font-size: 10px;
                            font-weight: 600;
                          ">A</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>


                
                <!-- Bouton CTA -->
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 32px 0;">
  <tr>
    <td 
      style="
        background-color: #5b4fff;
        border-radius: 8px;
        padding: 0;
      "
    >
      <a 
        href="${inviteLink}" 
        style="
          display: block;
          width: 100%;
          box-sizing: border-box;
          color: white;
          text-decoration: none;
          padding: 16px;
          text-align: center;
          font-size: 16px;
          font-weight: 600;
          line-height: 1.4;
        "
      >
        Accepter l'invitation
      </a>
    </td>
  </tr>
</table>
                
                <!-- Lien de secours -->
                <p style="font-size: 11px; line-height: 1.4; color: #9ca3af; margin: 32px 0 0 0; text-align: center;">
                  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                  <span style="color: #5B4FFF; word-break: break-all;">${inviteLink}</span>
                </p>
                
                <!-- Footer -->
                <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                    Si vous ne souhaitez pas rejoindre cette organisation, vous pouvez ignorer cet e-mail en toute sécurité.
                  </p>
                </div>
                
              </div>
            </body>
            </html>
          `;

          // Envoyer l'email d'invitation via Resend
          await resend.emails.send({
            to: data.email,
            subject: `${data.inviter.user.name || data.inviter.user.email} vous a invité·e à travailler dans ${data.organization.name}`,
            html: htmlTemplate,
            from: "Newbi <noreply@newbi.sweily.fr>",
          });

          console.log("Email d'invitation envoyé avec succès à:", data.email);
        } catch (error) {
          console.error(
            "Erreur lors de l'envoi de l'email d'invitation:",
            error
          );
          throw error;
        }
      },
    }),
  ],
  // plugins: [bearer()],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async signInRateLimit(request) {
      return {
        window: 60,
        max: 5,
      };
    },
    async beforeSignIn({ user }, request) {
      // Vérifier si le compte est actif
      if (user.isActive === false) {
        console.log(`Tentative de connexion d'un compte désactivé: ${user.email}`);
        
        // Envoyer un email de réactivation
        await sendReactivationEmail(user);
        
        throw new Error("Votre compte a été désactivé. Un email de réactivation vous a été envoyé.");
      }
      
      return user;
    },
    sendResetPassword: async ({ user, url, token }, request) => {
      const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisez votre mot de passe</title>
        </head>
        <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
          <div style="max-width: 500px; margin: 0 auto;">
            
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 40px;">
              <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px;">
            </div>
            
            <!-- Titre principal -->
            <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
              Réinitialisez votre mot de passe
            </h1>
            
            <!-- Message principal -->
            <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe pour votre compte Newbi.
            </p>
            
            <!-- Bouton CTA -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <!-- Lien de secours -->
            <p style="font-size: 11px; line-height: 1.4; color: #9ca3af; margin: 32px 0 0 0; text-align: center;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <span style="color: #5B4FFF; word-break: break-all;">${url}</span>
            </p>
            
            <!-- Footer -->
            <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        to: user.email,
        subject: "Réinitialisez votre mot de passe - Newbi",
        html: htmlTemplate,
        from: "Newbi <noreply@newbi.sweily.fr>",
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vérifiez votre adresse e-mail</title>
        </head>
        <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
          <div style="max-width: 500px; margin: 0 auto;">
            
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 40px;">
              <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px;">
            </div>
            
            <!-- Titre principal -->
            <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
              Vérifiez votre adresse e-mail
            </h1>
            
            <!-- Message principal -->
            <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
              Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail et finaliser votre inscription sur Newbi.
            </p>
            
            <!-- Bouton CTA -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
                Vérifier mon e-mail
              </a>
            </div>
            
            <!-- Lien de secours -->
            <p style="font-size: 11px; line-height: 1.4; color: #9ca3af; margin: 32px 0 0 0; text-align: center;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <span style="color: #5B4FFF; word-break: break-all;">${url}</span>
            </p>
            
            <!-- Footer -->
            <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                Ce lien expire dans 1 heure. Si vous n'avez pas créé de compte, ignorez cet e-mail.
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        to: user.email,
        subject: "Vérifiez votre adresse e-mail - Newbi",
        html: htmlTemplate,
        from: "Newbi <noreply@newbi.sweily.fr>",
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600,
  },
  user: {
    additionalFields: {
      name: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      lastName: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      phoneNumber: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      createdBy: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      // data: {
      //   type: "object",
      //   required: false,
      //   defaultValue: {
      //     createdBy: "",
      //   },
      // },
      avatar: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") {
        return;
      }

      console.log("Hook before signIn email déclenché");
      
      const email = ctx.body?.email;
      if (!email) {
        console.log("Pas d'email trouvé dans la requête");
        return;
      }

      console.log("Vérification du statut isActive pour:", email);

      // Vérifier si l'utilisateur existe et s'il est actif
      const { mongoDb } = await import("./mongodb");
      const usersCollection = mongoDb.collection("user");
      
      const user = await usersCollection.findOne({ email: email });
      
      if (user && user.isActive === false) {
        console.log("Utilisateur désactivé détecté, envoi de l'email de réactivation");
        
        // Envoyer l'email de réactivation
        await sendReactivationEmail(user);
        
        // Bloquer la connexion
        const { APIError } = await import("better-auth/api");
        throw new APIError("BAD_REQUEST", {
          message: "Votre compte a été désactivé. Un email de réactivation vous a été envoyé.",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // Filtrer uniquement les callbacks OAuth
      if (!ctx.path?.includes("/callback/")) {
        return;
      }

      console.log("Hook OAuth déclenché sur:", ctx.path);

      // Utiliser newSession comme nous l'avons vu dans les logs
      const newSession = ctx.context.newSession;

      if (newSession && newSession.user && newSession.session) {
        const user = newSession.user;
        const userId = newSession.session.userId;

        console.log("Nouvelle session OAuth détectée pour userId:", userId);
        console.log("Utilisateur:", user.email);

        // Créer une organisation automatiquement comme pour l'inscription normale
        try {
          console.log("Création automatique d'organisation pour OAuth...");

          // Générer le nom et le slug comme dans useAutoOrganization
          const organizationName =
            user.name || `Workspace ${user.email.split("@")[0]}'s`;
          const organizationSlug = `org-${user.id.slice(-8)}`;

          console.log("Nom de l'organisation:", organizationName);
          console.log("Slug de l'organisation:", organizationSlug);

          // Utiliser l'API interne Better Auth pour créer l'organisation
          const organizationData = {
            name: organizationName,
            slug: organizationSlug,
            metadata: {
              autoCreated: true,
              createdAt: new Date().toISOString(),
              createdVia: "oauth",
            },
          };

          const organization =
            await ctx.context.internalAdapter.createOrganization({
              ...organizationData,
              creatorId: userId,
            });

          console.log(
            "Organisation créée automatiquement via OAuth:",
            organization
          );
        } catch (error) {
          console.error(
            "Erreur lors de la création automatique d'organisation OAuth:",
            error
          );

          // Fallback: essayer avec l'adapter normal
          try {
            console.log("Tentative avec l'adapter normal...");

            const organizationData = {
              name: user.name
                ? `Organisation de ${user.name}`
                : `Organisation de ${user.email}`,
              slug: `org-${user.id.slice(-8)}`,
            };

            const organization = await ctx.context.adapter.create({
              model: "organization",
              data: organizationData,
            });

            const member = await ctx.context.adapter.create({
              model: "member",
              data: {
                userId: userId,
                organizationId: organization.id,
                role: "owner",
              },
            });

            console.log("Organisation créée avec fallback:", organization);
            console.log("Membre créé:", member);
          } catch (fallbackError) {
            console.error("Erreur même avec le fallback:", fallbackError);
          }
        }
      } else {
        console.log("Pas de nouvelle session dans le contexte pour:", ctx.path);
      }
    }),
  },
});
