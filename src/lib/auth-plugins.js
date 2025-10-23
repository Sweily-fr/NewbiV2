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
    getCheckoutSessionParams: async ({ user, plan, coupon, metadata }) => {
      // Déterminer quel coupon utiliser
      const couponToApply =
        coupon || process.env.STRIPE_FIRST_YEAR_DISCOUNT_COUPON_ID;

      // Message personnalisé selon le coupon
      const discountMessage =
        coupon === process.env.STRIPE_NEW_ORG_COUPON_ID
          ? "🎉 Réduction de 25% appliquée sur votre nouvelle organisation !"
          : "🎉 Réduction de 20% appliquée sur votre première année !";

      const discountType =
        coupon === process.env.STRIPE_NEW_ORG_COUPON_ID
          ? "new_org_25_percent"
          : "first_year_20_percent";

      return {
        params: {
          // Appliquer le coupon approprié
          discounts: couponToApply ? [{ coupon: couponToApply }] : [],
          // Collecter l'adresse de facturation
          billing_address_collection: "required",
          // Message personnalisé
          custom_text: {
            submit: {
              message: discountMessage,
            },
          },
          // Métadonnées pour le suivi
          metadata: {
            planType: plan.name,
            discountApplied: discountType,
            userId: user.id,
            ...metadata, // Métadonnées additionnelles
          },
        },
        options: {
          // Clé d'idempotence pour éviter les doublons
          idempotencyKey: `sub_${user.id}_${plan.name}_${Date.now()}`,
        },
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
          let userId;

          if (event.type === "customer.subscription.created") {
            // Événement direct de création d'abonnement
            subscription = event.data.object;
            referenceId = subscription.metadata?.referenceId;
            userId = subscription.metadata?.userId;
          } else {
            // Événement de checkout complété
            const session = event.data.object;

            if (!session.subscription) {
              console.log(
                `⚠️ [STRIPE WEBHOOK] Pas d'abonnement dans la session`
              );
              break;
            }

            // Récupérer les détails de l'abonnement depuis Stripe
            const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
            subscription = await stripe.subscriptions.retrieve(
              session.subscription
            );

            userId = session.metadata?.userId || subscription.metadata?.userId;

            // Vérifier si c'est une nouvelle organisation
            const isNewOrg = session.metadata?.isNewOrganization === "true";

            if (isNewOrg) {
              console.log(
                "🆕 [STRIPE WEBHOOK] Nouvelle organisation détectée, création..."
              );

              // Créer l'organisation APRÈS le paiement
              const orgName = session.metadata?.orgName;
              const orgType = session.metadata?.orgType;
              const orgInvitedEmails = session.metadata?.orgInvitedEmails;

              if (!orgName || !userId) {
                console.error(
                  "❌ [STRIPE WEBHOOK] Données organisation manquantes"
                );
                break;
              }

              // Créer l'organisation via Better Auth
              const { mongoDb } = await import("./mongodb.js");
              const { ObjectId } = require("mongodb");
              const orgSlug = `org-${userId.slice(-8)}-${Date.now().toString(36)}`;

              const newOrg = {
                name: orgName,
                slug: orgSlug,
                createdAt: new Date(),
                metadata: JSON.stringify({
                  type: orgType,
                  invitedEmails: orgInvitedEmails,
                  createdAt: new Date().toISOString(),
                  createdAfterPayment: true,
                }),
              };

              const orgResult = await mongoDb
                .collection("organization")
                .insertOne(newOrg);
              
              const organizationObjectId = orgResult.insertedId; // Garder comme ObjectId
              referenceId = organizationObjectId.toString(); // String pour l'abonnement

              // Créer le membre owner avec ObjectId
              await mongoDb.collection("member").insertOne({
                userId: new ObjectId(userId), // ✅ Convertir en ObjectId
                organizationId: organizationObjectId, // ✅ Utiliser ObjectId
                role: "owner",
                createdAt: new Date(),
              });

              // Définir comme organisation active
              await mongoDb
                .collection("session")
                .updateMany(
                  { userId: userId },
                  { $set: { activeOrganizationId: referenceId } }
                );

              console.log(
                `✅ [STRIPE WEBHOOK] Organisation créée: ${referenceId}`
              );

              // Envoyer les invitations aux emails invités
              if (orgInvitedEmails) {
                try {
                  const invitedEmailsList = JSON.parse(orgInvitedEmails);
                  
                  if (Array.isArray(invitedEmailsList) && invitedEmailsList.length > 0) {
                    console.log(`📧 [STRIPE WEBHOOK] Envoi de ${invitedEmailsList.length} invitation(s)...`);
                    
                    // Récupérer les infos de l'inviteur et de l'organisation
                    const inviterUser = await mongoDb.collection("user").findOne({ 
                      _id: new ObjectId(userId)
                    });
                    
                    const org = await mongoDb.collection("organization").findOne({ 
                      _id: organizationObjectId 
                    });
                    
                    if (!inviterUser || !org) {
                      console.error("❌ [STRIPE WEBHOOK] Inviteur ou organisation introuvable");
                      console.error("Inviteur:", inviterUser);
                      console.error("Organisation:", org);
                    } else {
                      // Envoyer les invitations seulement si on a trouvé l'inviteur et l'org
                      for (const email of invitedEmailsList) {
                        if (email && email.trim()) {
                          try {
                            // Créer l'invitation directement dans MongoDB
                            const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                            
                            await mongoDb.collection("invitation").insertOne({
                              id: invitationId,
                              organizationId: referenceId,
                              email: email.trim(),
                              role: "member",
                              inviterId: userId,
                              status: "pending",
                              expiresAt: expiresAt,
                              createdAt: new Date(),
                            });
                            
                            // Envoyer l'email d'invitation
                            const { sendOrganizationInvitationEmail } = await import("./auth-utils.js");
                            
                            await sendOrganizationInvitationEmail({
                              id: invitationId,
                              email: email.trim(),
                              role: "member",
                              organization: {
                                id: referenceId,
                                name: org.name,
                              },
                              inviter: {
                                user: {
                                  id: userId,
                                  name: inviterUser.name,
                                  email: inviterUser.email,
                                },
                              },
                            });
                            
                            console.log(`✅ [STRIPE WEBHOOK] Invitation envoyée à ${email}`);
                          } catch (inviteError) {
                            console.error(`❌ [STRIPE WEBHOOK] Erreur invitation ${email}:`, inviteError);
                          }
                        }
                      }
                    }
                  }
                } catch (parseError) {
                  console.error("❌ [STRIPE WEBHOOK] Erreur parsing emails invités:", parseError);
                }
              }
            } else {
              referenceId =
                session.metadata?.referenceId ||
                subscription.metadata?.referenceId ||
                session.metadata?.organizationId;
            }
          }

          if (!referenceId) {
            console.error(`❌ [STRIPE WEBHOOK] referenceId manquant`);
            break;
          }

          try {
            // Utiliser MongoDB directement au lieu de l'adapter
            const { mongoDb } = await import("./mongodb.js");

            // Vérifier si l'abonnement existe déjà
            const existingSub = await mongoDb
              .collection("subscription")
              .findOne({
                stripeSubscriptionId: subscription.id,
              });

            if (existingSub) {
              console.log(
                `✅ [STRIPE WEBHOOK] Abonnement existe déjà, mise à jour`
              );
              await mongoDb.collection("subscription").updateOne(
                { stripeSubscriptionId: subscription.id },
                {
                  $set: {
                    status: subscription.status,
                    currentPeriodStart: new Date(
                      subscription.current_period_start * 1000
                    ),
                    currentPeriodEnd: new Date(
                      subscription.current_period_end * 1000
                    ),
                    updatedAt: new Date(),
                  },
                }
              );
            } else {
              console.log(`✅ [STRIPE WEBHOOK] Création nouvel abonnement`);

              // Récupérer le priceId depuis l'abonnement Stripe
              const priceId = subscription.items?.data?.[0]?.price?.id;
              console.log(`📋 [STRIPE WEBHOOK] PriceId: ${priceId}`);
              console.log(`📋 [STRIPE WEBHOOK] Subscription data:`, {
                current_period_start: subscription.current_period_start,
                current_period_end: subscription.current_period_end,
                status: subscription.status,
              });

              // Récupérer les infos du price
              const priceData = subscription.items?.data?.[0]?.price;

              const subscriptionData = {
                plan: "pro", // ✅ Nom correct du champ Better Auth (pas "planName")
                referenceId: referenceId,
                stripeCustomerId: subscription.customer,
                status: subscription.status,
                seats: 1, // ✅ Champ obligatoire Better Auth
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                periodEnd: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000)
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                periodStart: subscription.current_period_start
                  ? new Date(subscription.current_period_start * 1000)
                  : new Date(),
                stripeSubscriptionId: subscription.id,
                currentPeriodEnd: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000)
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                currentPeriodStart: subscription.current_period_start
                  ? new Date(subscription.current_period_start * 1000)
                  : new Date(),
                updatedAt: new Date(),
              };

              console.log(
                `📋 [STRIPE WEBHOOK] Données abonnement:`,
                JSON.stringify(subscriptionData, null, 2)
              );

              await mongoDb
                .collection("subscription")
                .insertOne(subscriptionData);
            }

            console.log(
              `✅ [STRIPE WEBHOOK] Abonnement traité avec succès pour org: ${referenceId}`
            );
          } catch (error) {
            console.error(
              `❌ [STRIPE WEBHOOK] Erreur création/mise à jour abonnement:`,
              error
            );
            console.error(`❌ [STRIPE WEBHOOK] Stack:`, error.stack);
          }
          break;

        case "customer.subscription.updated":
          const updatedSub = event.data.object;

          try {
            // Import MongoDB directement
            const { mongoDb } = await import("./mongodb.js");

            await mongoDb.collection("subscription").updateOne(
              { stripeSubscriptionId: updatedSub.id },
              {
                $set: {
                  status: updatedSub.status,
                  currentPeriodStart: new Date(
                    updatedSub.current_period_start * 1000
                  ),
                  currentPeriodEnd: new Date(
                    updatedSub.current_period_end * 1000
                  ),
                  updatedAt: new Date(),
                },
              }
            );
            console.log(
              `✅ [STRIPE WEBHOOK] Abonnement mis à jour avec succès`
            );
          } catch (error) {
            console.error(
              `❌ [STRIPE WEBHOOK] Erreur mise à jour abonnement:`,
              error
            );
            console.error(`❌ [STRIPE WEBHOOK] Stack:`, error.stack);
          }
          break;

        case "customer.subscription.deleted":
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
            console.log(`✅ [STRIPE WEBHOOK] Abonnement annulé avec succès`);
          } catch (error) {
            console.error(
              `❌ [STRIPE WEBHOOK] Erreur annulation abonnement:`,
              error
            );
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
        // Trial system fields (ISO date strings)
        trialStartDate: {
          type: "string",
          input: true,
          required: false,
        },
        trialEndDate: {
          type: "string",
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
      },
    },
  },
  async sendInvitationEmail(data) {
    await sendOrganizationInvitationEmail(data);
  },
});

// Configuration du plugin Multi Session
export const multiSessionPlugin = multiSession({
  maximumSessions: 2, // Maximum 2 sessions simultanées
});
