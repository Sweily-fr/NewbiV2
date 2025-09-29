import {
  admin,
  organization,
  phoneNumber,
  twoFactor,
  multiSession,
} from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import {
  sendSMSInDevelopment,
  send2FAEmail,
  sendOrganizationInvitationEmail,
} from "./auth-utils";

// Configuration du plugin Admin
export const adminPlugin = admin({
  adminUserIds: ["685ff0250e083b9a2987a0b9"],
  defaultRole: "owner", // Rôle par défaut pour les nouveaux utilisateurs
});

// Configuration du plugin Phone Number
export const phoneNumberPlugin = phoneNumber({
  sendOTP: async ({ phoneNumber, code }, request) => {
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
      // Better Auth ne passe pas automatiquement type="sms"
      // Il faut détecter manuellement si l'utilisateur a un phoneNumber
      const shouldUseSMS = user.phoneNumber && user.phoneNumber.trim() !== "";

      if (shouldUseSMS) {
        // Envoi par SMS

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

            const isOwner = member?.role === "owner";

            return isOwner;
          } catch (error) {
            return false;
          }
        }

        // Fallback: autoriser temporairement si l'adapter ne fonctionne pas
        return true;
      }

      return true;
    },
    plans: [
      {
        name: "pro",
        priceId: process.env.STRIPE_PRICE_ID_MONTH,
        annualDiscountPriceId: process.env.STRIPE_PRICE_ID_YEARS,
        limits: {
          projects: 100,
          storage: 100,
          invoices: 1000,
        },
      },
    ],
    // Paramètres personnalisés pour le checkout Stripe
    getCheckoutSessionParams: async ({ user, plan }) => {
      return {
        params: {
          // Appliquer automatiquement une réduction de 20% sur la première année
          discounts: [
            {
              coupon: process.env.STRIPE_FIRST_YEAR_DISCOUNT_COUPON_ID, // ID du coupon de réduction
            }
          ],
          // Collecter l'adresse de facturation
          billing_address_collection: "required",
          // Message personnalisé
          custom_text: {
            submit: {
              message: "🎉 Réduction de 20% appliquée sur votre première année !"
            }
          },
          // Métadonnées pour le suivi
          metadata: {
            planType: plan.name,
            discountApplied: "first_year_20_percent",
            userId: user.id
          }
        },
        options: {
          // Clé d'idempotence pour éviter les doublons
          idempotencyKey: `sub_${user.id}_${plan.name}_${Date.now()}`
        }
      };
    },
  },
  // Webhooks Stripe pour mettre à jour automatiquement le statut
  onEvent: async (event, adapter) => {
    console.log(`🔔 [STRIPE WEBHOOK] Événement reçu: ${event.type}`);
    
    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "checkout.session.completed":
          let subscription;
          let referenceId;

          if (event.type === "customer.subscription.created") {
            // Événement direct de création d'abonnement
            subscription = event.data.object;
            referenceId = subscription.metadata?.referenceId;
            
            console.log(`📦 [STRIPE WEBHOOK] Abonnement créé:`, {
              subscriptionId: subscription.id,
              customerId: subscription.customer,
              status: subscription.status,
              referenceId
            });
          } else {
            // Événement de checkout complété
            const session = event.data.object;
            
            if (!session.subscription) {
              console.log(`⚠️ [STRIPE WEBHOOK] Pas d'abonnement dans la session`);
              break;
            }

            // Récupérer les détails de l'abonnement depuis Stripe
            const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
            subscription = await stripe.subscriptions.retrieve(session.subscription);
            referenceId = session.metadata?.referenceId || subscription.metadata?.referenceId;
            
            console.log(`📦 [STRIPE WEBHOOK] Checkout complété:`, {
              sessionId: session.id,
              subscriptionId: subscription.id,
              customerId: subscription.customer,
              referenceId
            });
          }

          if (!referenceId) {
            console.error(`❌ [STRIPE WEBHOOK] referenceId manquant dans les métadonnées`);
            break;
          }

          try {
            // Vérifier si l'abonnement existe déjà
            const existingSub = await adapter.findFirst({
              model: "subscription",
              where: { stripeSubscriptionId: subscription.id }
            });

            if (existingSub) {
              console.log(`✅ [STRIPE WEBHOOK] Abonnement existe déjà, mise à jour`);
              await adapter.update({
                model: "subscription",
                where: { stripeSubscriptionId: subscription.id },
                data: {
                  status: subscription.status,
                  currentPeriodStart: new Date(subscription.current_period_start * 1000),
                  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                  updatedAt: new Date(),
                },
              });
            } else {
              console.log(`✅ [STRIPE WEBHOOK] Création nouvel abonnement`);
              await adapter.create({
                model: "subscription",
                data: {
                  id: subscription.id,
                  referenceId: referenceId,
                  status: subscription.status,
                  planName: "pro",
                  stripeSubscriptionId: subscription.id,
                  stripeCustomerId: subscription.customer,
                  currentPeriodStart: new Date(subscription.current_period_start * 1000),
                  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              });
            }
            
            console.log(`✅ [STRIPE WEBHOOK] Abonnement traité avec succès`);
          } catch (error) {
            console.error(`❌ [STRIPE WEBHOOK] Erreur création/mise à jour abonnement:`, error);
            console.error(`❌ [STRIPE WEBHOOK] Stack:`, error.stack);
          }
          break;

        case "customer.subscription.updated":
          const updatedSub = event.data.object;
          
          console.log(`🔄 [STRIPE WEBHOOK] Mise à jour abonnement:`, {
            subscriptionId: updatedSub.id,
            status: updatedSub.status,
            customerId: updatedSub.customer
          });

          try {
            await adapter.update({
              model: "subscription",
              where: { stripeSubscriptionId: updatedSub.id },
              data: {
                status: updatedSub.status,
                currentPeriodStart: new Date(updatedSub.current_period_start * 1000),
                currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
                updatedAt: new Date(),
              },
            });
            console.log(`✅ [STRIPE WEBHOOK] Abonnement mis à jour avec succès`);
          } catch (error) {
            console.error(`❌ [STRIPE WEBHOOK] Erreur mise à jour abonnement:`, error);
            console.error(`❌ [STRIPE WEBHOOK] Stack:`, error.stack);
          }
          break;

        case "customer.subscription.deleted":
          const deletedSub = event.data.object;
          
          console.log(`🗑️ [STRIPE WEBHOOK] Suppression abonnement:`, {
            subscriptionId: deletedSub.id,
            customerId: deletedSub.customer
          });

          try {
            await adapter.update({
              model: "subscription",
              where: { stripeSubscriptionId: deletedSub.id },
              data: {
                status: "canceled",
                updatedAt: new Date(),
              },
            });
            console.log(`✅ [STRIPE WEBHOOK] Abonnement annulé avec succès`);
          } catch (error) {
            console.error(`❌ [STRIPE WEBHOOK] Erreur annulation abonnement:`, error);
            console.error(`❌ [STRIPE WEBHOOK] Stack:`, error.stack);
          }
          break;

        case "invoice.payment_succeeded":
        case "invoice.paid":
          console.log(`💰 [STRIPE WEBHOOK] Paiement facture réussi`);
          // Ces événements sont gérés automatiquement par Stripe
          // Pas besoin d'action supplémentaire
          break;
          
        case "invoice.created":
        case "invoice.finalized":
          console.log(`📄 [STRIPE WEBHOOK] Facture créée/finalisée`);
          // Ces événements sont informatifs
          break;
          
        case "customer.discount.created":
          console.log(`🎁 [STRIPE WEBHOOK] Réduction appliquée`);
          break;

        case "payment_intent.succeeded":
          console.log(`✅ [STRIPE WEBHOOK] Paiement réussi`);
          break;
          
        default:
          console.log(`⚠️ [STRIPE WEBHOOK] Événement non géré: ${event.type}`);
      }
    } catch (error) {
      console.error(`❌ [STRIPE WEBHOOK] Erreur globale:`, error);
      console.error(`❌ [STRIPE WEBHOOK] Stack:`, error.stack);
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
        logo: {
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
        // Trial system fields
        trialStartDate: {
          type: "date",
          input: true,
          required: false,
        },
        trialEndDate: {
          type: "date",
          input: true,
          required: false,
        },
        isTrialActive: {
          type: "boolean",
          input: true,
          required: false,
        },
        hasUsedTrial: {
          type: "boolean",
          input: true,
          required: false,
        },
        // Onboarding system fields
        hasCompletedOnboarding: {
          type: "boolean",
          input: true,
          required: false,
        },
        onboardingStep: {
          type: "number",
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

// Configuration du plugin Multi Session
export const multiSessionPlugin = multiSession({
  maximumSessions: 10, // Limite configurable depuis l'UI
});
