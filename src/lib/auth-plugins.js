import {
  admin,
  organization,
  phoneNumber,
  twoFactor,
} from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import { 
  sendSMSInDevelopment, 
  send2FAEmail, 
  sendOrganizationInvitationEmail 
} from "./auth-utils";

// Configuration du plugin Admin
export const adminPlugin = admin({
  adminUserIds: ["685ff0250e083b9a2987a0b9"],
  defaultRole: "owner", // Rôle par défaut pour les nouveaux utilisateurs
});

// Configuration du plugin Phone Number
export const phoneNumberPlugin = phoneNumber({
  sendOTP: async ({ phoneNumber, code }, request) => {
    console.log(`[SMS] Envoi du code ${code} vers ${phoneNumber}`);

    // Pour le développement, on simule l'envoi
    // En production, vous devrez intégrer un service SMS comme Twilio, AWS SNS, etc.
    sendSMSInDevelopment(phoneNumber, code);

    return { success: true };
  },
});

// Configuration du plugin Two Factor
export const twoFactorPlugin = twoFactor({
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

        sendSMSInDevelopment(user.phoneNumber, otp, "2FA SMS");
      } else {
        // Envoi par email via Resend
        await send2FAEmail(user, otp);
      }

      return { success: true };
    },
  },
});

// Configuration du plugin Stripe
export const stripePlugin = stripe({
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
        // Utiliser l'adapter Better Auth comme dans l'ancien code fonctionnel
        // On importe auth depuis le fichier auth.js pour accéder à l'adapter
        const { auth } = await import("./auth");
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
});

// Configuration du plugin Organization
export const organizationPlugin = organization({
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
    await sendOrganizationInvitationEmail(data);
  },
});
