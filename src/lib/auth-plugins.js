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
import {
  ac,
  owner,
  admin as adminRole,
  member,
  viewer,
  accountant,
} from "./permissions";

// ✅ Fonction de déduplication atomique avec MongoDB
async function isEventAlreadyProcessed(eventId, eventType) {
  const { mongoDb } = await import("./mongodb.js");

  try {
    // Insertion atomique avec upsert
    const result = await mongoDb.collection("stripeWebhookEvents").updateOne(
      { eventId },
      {
        $setOnInsert: {
          eventId,
          eventType,
          processedAt: new Date(),
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Si upsertedCount = 0, l'événement existait déjà
    if (result.upsertedCount === 0) {
      console.log(`⏭️ [STRIPE] Événement ${eventId} déjà traité, skip`);
      return true;
    }

    console.log(`✅ [STRIPE] Nouvel événement ${eventId} enregistré`);
    return false;
  } catch (error) {
    // En cas d'erreur duplicate key (race condition extrême)
    if (error.code === 11000) {
      console.log(`⏭️ [STRIPE] Événement ${eventId} déjà traité (race), skip`);
      return true;
    }
    throw error;
  }
}

// Configuration du plugin Admin avec permissions personnalisées
export const adminPlugin = admin({
  adminUserIds: ["685ff0250e083b9a2987a0b9"],
  defaultRole: "member", // Rôle par défaut pour les nouveaux utilisateurs
  ac, // Access controller
  roles: {
    owner, // ✅ Ajouter le rôle owner
    admin: adminRole,
    member,
    viewer,
    accountant,
  },
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
  // Nom de l'application affiché dans les apps d'authentification (Google Authenticator, etc.)
  issuer: "Newbi",

  // Configuration TOTP (Time-based One-Time Password)
  totp: {
    period: 30, // Période de validité du code en secondes (standard: 30s)
    digits: 6, // Nombre de chiffres du code (standard: 6)
  },

  // Configuration des codes de secours
  backupCodes: {
    amount: 10, // Nombre de codes de secours générés
    length: 10, // Longueur de chaque code de secours
  },

  // Skip verification lors de l'activation (utile pour dev/test)
  // En production, laisser à false pour forcer la vérification du premier code
  skipVerificationOnEnable: false,

  // Configuration OTP (One-Time Password) par email/SMS
  otpOptions: {
    async sendOTP({ user, otp, type }, request) {
      // ⚠️ IMPORTANT : Cette fonction est appelée UNIQUEMENT pour les codes OTP temporaires
      // (email/SMS), PAS pour TOTP (authenticator app)
      // Pour TOTP, Better Auth génère un QR code et ne devrait pas envoyer d'email

      console.log("📧 [2FA OTP] Envoi code OTP demandé");
      console.log("📧 [2FA OTP] Type:", type);
      console.log("📧 [2FA OTP] User:", user.email);
      console.log("📧 [2FA OTP] PhoneNumber:", user.phoneNumber);

      // Si type est explicitement "totp", ne rien envoyer (QR code uniquement)
      if (type === "totp") {
        console.log("🔐 [2FA OTP] Type TOTP détecté, pas d'envoi d'email/SMS");
        return { success: true };
      }

      // Better Auth ne passe pas automatiquement type="sms"
      // Il faut détecter manuellement si l'utilisateur a un phoneNumber
      const shouldUseSMS = user.phoneNumber && user.phoneNumber.trim() !== "";

      if (shouldUseSMS) {
        // Envoi par SMS
        console.log("📱 [2FA OTP] Envoi par SMS à:", user.phoneNumber);
        sendSMSInDevelopment(user.phoneNumber, otp, "2FA SMS");
      } else {
        // Envoi par email via Resend
        console.log("📧 [2FA OTP] Envoi par email à:", user.email);
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
        "🔐 [AUTHORIZE] Action:",
        action,
        "User:",
        user?.id,
        "ReferenceId:",
        referenceId
      );

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
            console.log(
              "🔐 [AUTHORIZE] Member found:",
              member,
              "isOwner:",
              isOwner
            );

            return isOwner;
          } catch (error) {
            console.error("🔐 [AUTHORIZE] Error:", error);
            return false;
          }
        }

        // Fallback: refuser l'accès si l'adapter ne fonctionne pas
        console.error("🔐 [AUTHORIZE] Adapter not available, denying access");
        return false;
      }

      return true;
    },
    plans: [
      {
        name: "freelance",
        priceId: process.env.STRIPE_FREELANCE_MONTHLY_PRICE_ID,
        annualDiscountPriceId: process.env.STRIPE_FREELANCE_YEARLY_PRICE_ID,
        limits: {
          users: 1, // 1 seul utilisateur (pas de collaborateurs)
          workspaces: 1, // 1 workspace inclus
          projects: 50,
          storage: 50,
          invoices: 500,
        },
        metadata: {
          displayName: "Pack Freelance",
          monthlyPrice: 17.99,
          annualPrice: 16.19, // -10% de réduction
          workspaceAddonPrice: 11.99,
          description: "Pour les indépendants et freelances",
        },
      },
      {
        name: "pme",
        priceId: process.env.STRIPE_PME_MONTHLY_PRICE_ID,
        annualDiscountPriceId: process.env.STRIPE_PME_YEARLY_PRICE_ID,
        limits: {
          users: 10, // Jusqu'à 10 utilisateurs inclus
          workspaces: 1, // 1 workspace inclus
          projects: 200,
          storage: 200,
          invoices: 2000,
        },
        metadata: {
          displayName: "Pack PME",
          monthlyPrice: 48.99,
          annualPrice: 44.09, // -10% de réduction (48.99 * 12 * 0.90 / 12)
          workspaceAddonPrice: 11.99,
          description: "Pour les petites et moyennes entreprises",
        },
      },
      {
        name: "entreprise",
        priceId: process.env.STRIPE_ENTREPRISE_MONTHLY_PRICE_ID,
        annualDiscountPriceId: process.env.STRIPE_ENTREPRISE_YEARLY_PRICE_ID,
        limits: {
          users: 25, // Jusqu'à 25 utilisateurs inclus
          workspaces: 1, // 1 workspace inclus
          projects: 500,
          storage: 500,
          invoices: 5000,
        },
        metadata: {
          displayName: "Pack Entreprise",
          monthlyPrice: 94.99,
          annualPrice: 85.49, // -10% de réduction (94.99 * 12 * 0.90 / 12)
          workspaceAddonPrice: 11.99,
          description: "Pour les grandes équipes",
        },
      },
    ],
    // Paramètres personnalisés pour le checkout Stripe
    getCheckoutSessionParams: async ({ user, plan, coupon, metadata }) => {
      // Déterminer quel coupon utiliser
      const couponToApply =
        coupon || process.env.STRIPE_FIRST_YEAR_DISCOUNT_COUPON_ID;

      // Message personnalisé avec info trial
      const trialMessage = "Essai gratuit 30 jours - Aucun prélèvement avant la fin de l'essai";

      const discountType =
        coupon === process.env.STRIPE_NEW_ORG_COUPON_ID
          ? "new_org_25_percent"
          : "first_year_20_percent";

      return {
        params: {
          // Appliquer le coupon approprié (s'appliquera après le trial)
          discounts: couponToApply ? [{ coupon: couponToApply }] : [],
          // Collecter l'adresse de facturation
          billing_address_collection: "required",
          // ✅ Trial de 30 jours - L'utilisateur ne sera pas prélevé avant 30 jours
          subscription_data: {
            trial_period_days: 30,
            metadata: {
              hasTrial: "true",
              trialDays: "30",
              planType: plan.name,
              userId: user.id,
            },
          },
          // Message personnalisé
          custom_text: {
            submit: {
              message: trialMessage,
            },
          },
          // Métadonnées pour le suivi
          metadata: {
            planType: plan.name,
            discountApplied: discountType,
            userId: user.id,
            hasTrial: "true",
            trialDays: "30",
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
    console.log(`🔔 [STRIPE WEBHOOK] ==================`);
    console.log(`🔔 [STRIPE WEBHOOK] Event ID: ${event.id}`);
    console.log(`🔔 [STRIPE WEBHOOK] Type: ${event.type}`);
    console.log(`🔔 [STRIPE WEBHOOK] Created: ${new Date(event.created * 1000).toISOString()}`);
    console.log(`🔔 [STRIPE WEBHOOK] Livemode: ${event.livemode}`);

    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "checkout.session.completed":
          // ✅ Déduplication atomique avec MongoDB
          if (await isEventAlreadyProcessed(event.id, event.type)) {
            break;
          }

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

            // Copier les métadonnées de la session vers l'abonnement
            if (session.metadata && Object.keys(session.metadata).length > 0) {
              console.log(
                "📋 [STRIPE WEBHOOK] Copie des métadonnées de la session vers l'abonnement"
              );
              await stripe.subscriptions.update(session.subscription, {
                metadata: session.metadata,
              });
              // Mettre à jour l'objet subscription local
              subscription.metadata = session.metadata;
            }

            userId = session.metadata?.userId || subscription.metadata?.userId;

            // Vérifier si c'est une nouvelle organisation
            const isNewOrg = session.metadata?.isNewOrganization === "true";

            console.log(
              `🔍 [STRIPE WEBHOOK] isNewOrg: ${isNewOrg}, userId: ${userId}`
            );

            if (isNewOrg) {
              console.log(
                "🆕 [STRIPE WEBHOOK] Nouvelle organisation détectée, création via shared utility..."
              );

              if (!userId) {
                console.error(
                  "❌ [STRIPE WEBHOOK] userId manquant dans les metadata"
                );
                break;
              }

              const { mongoDb } = await import("./mongodb.js");
              const { ObjectId } = require("mongodb");

              // Récupérer les données volumineuses depuis MongoDB
              let pendingOrgData = null;
              const pendingOrgDataId = session.metadata?.pendingOrgDataId;
              if (pendingOrgDataId) {
                try {
                  pendingOrgData = await mongoDb
                    .collection("pending_org_data")
                    .findOne({ _id: new ObjectId(pendingOrgDataId) });
                  console.log(
                    `✅ [STRIPE WEBHOOK] Données pendantes récupérées: ${pendingOrgDataId}`
                  );
                } catch (e) {
                  console.warn(
                    `⚠️ [STRIPE WEBHOOK] Données pendantes non trouvées: ${pendingOrgDataId}`,
                    e.message
                  );
                }
              }

              // ✅ Utiliser la shared utility pour la création idempotente
              const { createOrganizationWithSubscription } = await import("./org-creation.js");

              const creationResult = await createOrganizationWithSubscription({
                mongoDb,
                userId,
                orgData: {
                  companyName: session.metadata?.companyName || session.metadata?.orgName || "Mon entreprise",
                  orgName: session.metadata?.orgName || "Mon entreprise",
                  siret: session.metadata?.siret || "",
                  siren: session.metadata?.siren || "",
                  employeeCount: session.metadata?.employeeCount || "",
                  orgType: session.metadata?.orgType || "business",
                  legalForm: session.metadata?.legalForm || "",
                  addressStreet: session.metadata?.addressStreet || "",
                  addressCity: session.metadata?.addressCity || "",
                  addressZipCode: session.metadata?.addressZipCode || "",
                  addressCountry: session.metadata?.addressCountry || "France",
                  activitySector: session.metadata?.activitySector || "",
                  activityCategory: session.metadata?.activityCategory || "",
                },
                subscriptionInfo: subscription,
                sessionMetadata: session.metadata || {},
                pendingOrgData,
                pendingOrgDataId,
              });

              referenceId = creationResult.organizationId;
              console.log(
                `✅ [STRIPE WEBHOOK] Organisation traitée via shared utility: ${referenceId}`
              );

              // Ne pas continuer vers la création d'abonnement normale
              break;
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

            // Vérifier si l'abonnement existe déjà POUR CETTE ORGANISATION
            const existingSubForOrg = await mongoDb
              .collection("subscription")
              .findOne({
                referenceId: referenceId,
              });

            // Vérifier aussi si le stripeSubscriptionId existe (pour une autre org)
            const existingSubByStripeId = await mongoDb
              .collection("subscription")
              .findOne({
                stripeSubscriptionId: subscription.id,
              });

            console.log(`🔍 [STRIPE WEBHOOK] Recherche abonnement:`);
            console.log(`   - referenceId: ${referenceId}`);
            console.log(`   - stripeSubscriptionId: ${subscription.id}`);
            console.log(
              `   - Abonnement existant pour cette org: ${existingSubForOrg ? "OUI" : "NON"}`
            );
            console.log(
              `   - Abonnement existant avec ce stripeId: ${existingSubByStripeId ? "OUI (org: " + existingSubByStripeId.referenceId + ")" : "NON"}`
            );

            if (
              existingSubForOrg &&
              existingSubForOrg.stripeSubscriptionId === subscription.id
            ) {
              // Même abonnement, même org -> mise à jour
              console.log(
                `✅ [STRIPE WEBHOOK] Abonnement existe déjà pour cette org, mise à jour`
              );
              await mongoDb.collection("subscription").updateOne(
                {
                  referenceId: referenceId,
                  stripeSubscriptionId: subscription.id,
                },
                {
                  $set: {
                    status: subscription.status,
                    plan:
                      subscription.metadata?.planName || existingSubForOrg.plan,
                    currentPeriodStart: new Date(
                      subscription.current_period_start * 1000
                    ),
                    currentPeriodEnd: new Date(
                      subscription.current_period_end * 1000
                    ),
                    periodStart: new Date(
                      subscription.current_period_start * 1000
                    ),
                    periodEnd: new Date(subscription.current_period_end * 1000),
                    updatedAt: new Date(),
                  },
                }
              );

              // ✅ Désactiver le trial si passage de trialing à active
              if (
                subscription.status === "active" &&
                existingSubForOrg.status === "trialing"
              ) {
                try {
                  const { ObjectId } = require("mongodb");
                  await mongoDb.collection("organization").updateOne(
                    { _id: new ObjectId(referenceId) },
                    {
                      $set: {
                        isTrialActive: false,
                        hasUsedTrial: true,
                        updatedAt: new Date(),
                      },
                    }
                  );
                  console.log(
                    `✅ [STRIPE WEBHOOK] Trial désactivé après upgrade pour l'organisation ${referenceId}`
                  );
                } catch (trialError) {
                  console.warn(
                    `⚠️ [STRIPE WEBHOOK] Erreur désactivation trial:`,
                    trialError.message
                  );
                }
              }
            } else if (existingSubForOrg) {
              // L'org a déjà un abonnement avec un autre stripeSubscriptionId -> remplacer
              console.log(
                `🔄 [STRIPE WEBHOOK] L'org a un ancien abonnement, remplacement par le nouveau`
              );
              await mongoDb.collection("subscription").updateOne(
                { referenceId: referenceId },
                {
                  $set: {
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: subscription.customer,
                    status: subscription.status,
                    plan:
                      subscription.metadata?.planName || existingSubForOrg.plan,
                    currentPeriodStart: new Date(
                      subscription.current_period_start * 1000
                    ),
                    currentPeriodEnd: new Date(
                      subscription.current_period_end * 1000
                    ),
                    periodStart: new Date(
                      subscription.current_period_start * 1000
                    ),
                    periodEnd: new Date(subscription.current_period_end * 1000),
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

              // Récupérer le nom du plan depuis les métadonnées
              const planName = subscription.metadata?.planName || "freelance";
              console.log(`📋 [STRIPE WEBHOOK] Plan détecté: ${planName}`);

              const subscriptionData = {
                plan: planName, // ✅ Nom correct du champ Better Auth (pas "planName")
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
              };

              console.log(
                `📋 [STRIPE WEBHOOK] Données abonnement:`,
                JSON.stringify(subscriptionData, null, 2)
              );

              // ✅ Utiliser MongoDB directement pour créer l'abonnement
              // Générer un ID unique pour Better Auth
              const { ObjectId } = require("mongodb");
              const newId = new ObjectId();

              await mongoDb.collection("subscription").insertOne({
                _id: newId,
                id: newId.toString(), // Better Auth utilise ce champ comme identifiant
                ...subscriptionData,
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              console.log(
                `✅ [STRIPE WEBHOOK] Abonnement créé avec id: ${newId.toString()}`
              );

              // ✅ Gérer le statut trial de l'organisation et marquer onboarding comme complété
              if (referenceId) {
                try {
                  // Vérifier si c'est un flux onboarding
                  const isOnboarding =
                    subscription.metadata?.isOnboarding === "true" ||
                    (event.type === "checkout.session.completed" && event.data.object?.metadata?.isOnboarding === "true");

                  if (subscription.status === "trialing") {
                    // Abonnement en période d'essai - Activer le trial Stripe sur l'organisation
                    const trialEnd = subscription.trial_end
                      ? new Date(subscription.trial_end * 1000)
                      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut

                    const updateData = {
                      isTrialActive: true,
                      trialStartDate: new Date().toISOString(),
                      trialEndDate: trialEnd.toISOString(),
                      stripeTrialActive: true, // Marquer que c'est un trial Stripe
                      updatedAt: new Date(),
                    };

                    // ✅ CORRECTION: Marquer onboardingCompleted si c'est un flux onboarding
                    if (isOnboarding) {
                      updateData.onboardingCompleted = true;
                    }

                    const orgUpdateResult = await mongoDb
                      .collection("organization")
                      .updateOne(
                        { _id: new ObjectId(referenceId) },
                        { $set: updateData }
                      );
                    if (orgUpdateResult.modifiedCount > 0) {
                      console.log(
                        `✅ [STRIPE WEBHOOK] Trial Stripe activé pour l'organisation ${referenceId} jusqu'au ${trialEnd.toLocaleDateString('fr-FR')}`
                      );
                      if (isOnboarding) {
                        console.log(
                          `✅ [STRIPE WEBHOOK] onboardingCompleted défini à true pour org: ${referenceId}`
                        );
                      }
                    }
                  } else if (subscription.status === "active") {
                    // Abonnement actif - Désactiver le trial
                    const updateData = {
                      isTrialActive: false,
                      hasUsedTrial: true,
                      stripeTrialActive: false,
                      updatedAt: new Date(),
                    };

                    // ✅ CORRECTION: Marquer onboardingCompleted si c'est un flux onboarding
                    if (isOnboarding) {
                      updateData.onboardingCompleted = true;
                    }

                    const orgUpdateResult = await mongoDb
                      .collection("organization")
                      .updateOne(
                        { _id: new ObjectId(referenceId) },
                        { $set: updateData }
                      );
                    if (orgUpdateResult.modifiedCount > 0) {
                      console.log(
                        `✅ [STRIPE WEBHOOK] Trial désactivé pour l'organisation ${referenceId}`
                      );
                      if (isOnboarding) {
                        console.log(
                          `✅ [STRIPE WEBHOOK] onboardingCompleted défini à true pour org: ${referenceId}`
                        );
                      }
                    }
                  }
                } catch (trialError) {
                  console.warn(
                    `⚠️ [STRIPE WEBHOOK] Erreur gestion trial:`,
                    trialError.message
                  );
                }
              }

              // L'email de paiement avec facture PDF sera envoyé via le webhook invoice.payment_succeeded
              // Ne pas envoyer d'email ici pour éviter les doublons
              console.log(
                `ℹ️ [STRIPE WEBHOOK] Abonnement créé, email de paiement sera envoyé via invoice.payment_succeeded`
              );
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
            const { ObjectId } = require("mongodb");

            // ✅ NOUVEAU : Récupérer le plan depuis les métadonnées
            const newPlan = updatedSub.metadata?.planName;

            const updateData = {
              status: updatedSub.status,
              currentPeriodStart: new Date(
                updatedSub.current_period_start * 1000
              ),
              currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
              cancelAtPeriodEnd: updatedSub.cancel_at_period_end || false,
              updatedAt: new Date(),
            };

            // ✅ NOUVEAU : Mettre à jour le plan si présent dans les métadonnées
            if (newPlan) {
              updateData.plan = newPlan;
              console.log(
                `📋 [STRIPE WEBHOOK] Changement de plan détecté: ${newPlan}`
              );
            }

            // Log si résiliation programmée
            if (updatedSub.cancel_at_period_end) {
              console.log(
                `🔔 [STRIPE WEBHOOK] Résiliation programmée pour la fin de période`
              );
            }

            await mongoDb
              .collection("subscription")
              .updateOne(
                { stripeSubscriptionId: updatedSub.id },
                { $set: updateData }
              );

            // ✅ Gérer la fin du trial Stripe - Quand le statut passe de "trialing" à "active"
            // Récupérer l'abonnement existant pour voir l'ancien statut
            const existingSub = await mongoDb
              .collection("subscription")
              .findOne({ stripeSubscriptionId: updatedSub.id });

            if (existingSub?.referenceId && updatedSub.status === "active") {
              try {
                // Vérifier si l'organisation était en trial Stripe
                const org = await mongoDb
                  .collection("organization")
                  .findOne({ _id: new ObjectId(existingSub.referenceId) });

                if (org?.stripeTrialActive || org?.isTrialActive) {
                  // Le trial est terminé, désactiver
                  await mongoDb
                    .collection("organization")
                    .updateOne(
                      { _id: new ObjectId(existingSub.referenceId) },
                      {
                        $set: {
                          isTrialActive: false,
                          hasUsedTrial: true,
                          stripeTrialActive: false,
                          updatedAt: new Date(),
                        },
                      }
                    );
                  console.log(
                    `✅ [STRIPE WEBHOOK] Trial terminé - Abonnement actif pour l'organisation ${existingSub.referenceId}`
                  );
                }
              } catch (trialEndError) {
                console.warn(
                  `⚠️ [STRIPE WEBHOOK] Erreur fin de trial:`,
                  trialEndError.message
                );
              }
            }

            console.log(
              `✅ [STRIPE WEBHOOK] Abonnement mis à jour avec succès${newPlan ? ` (plan: ${newPlan})` : ""}${updatedSub.cancel_at_period_end ? " (résiliation programmée)" : ""}`
            );
          } catch (error) {
            console.error(
              `❌ [STRIPE WEBHOOK] Erreur mise à jour abonnement:`,
              error
            );
            console.error(`❌ [STRIPE WEBHOOK] Stack:`, error.stack);
          }
          break;

        case "invoice.payment_failed":
          const failedInvoice = event.data.object;

          // ✅ Déduplication atomique avec MongoDB
          if (await isEventAlreadyProcessed(event.id, event.type)) {
            break;
          }

          try {
            // Import MongoDB directement
            const { mongoDb } = await import("./mongodb.js");

            // Mettre à jour le statut de l'abonnement
            const updateResult = await mongoDb
              .collection("subscription")
              .updateOne(
                { stripeSubscriptionId: failedInvoice.subscription },
                {
                  $set: {
                    status: "past_due",
                    paymentFailedAt: new Date(),
                    updatedAt: new Date(),
                  },
                }
              );

            if (updateResult.modifiedCount > 0) {
              console.log(
                `⚠️ [STRIPE WEBHOOK] Paiement échoué pour l'abonnement: ${failedInvoice.subscription}`
              );

              // Récupérer les infos du client pour l'email
              try {
                const customer = await stripe.customers.retrieve(
                  failedInvoice.customer
                );

                const amount = `${(failedInvoice.amount_due / 100).toFixed(2)}€`;
                const invoiceUrl = failedInvoice.hosted_invoice_url;

                // Envoyer l'email de relance
                const { sendPaymentFailedEmail } = await import(
                  "./auth-utils.js"
                );

                await sendPaymentFailedEmail({
                  to: customer.email,
                  customerName: customer.name || customer.email,
                  amount,
                  invoiceUrl,
                });

                console.log(
                  `✅ [STRIPE WEBHOOK] Email de paiement échoué envoyé à ${customer.email}`
                );
              } catch (emailError) {
                console.error(
                  `❌ [STRIPE WEBHOOK] Erreur envoi email paiement échoué:`,
                  emailError
                );
                // Ne pas bloquer le webhook si l'email échoue
              }
            }
          } catch (error) {
            console.error(`❌ [STRIPE WEBHOOK] Erreur paiement échoué:`, error);
          }
          break;

        case "customer.subscription.deleted":
          const deletedSub = event.data.object;

          // ✅ Déduplication atomique avec MongoDB
          if (await isEventAlreadyProcessed(event.id, event.type)) {
            break;
          }

          try {
            // ✅ Utiliser MongoDB directement au lieu de l'adapter
            const { mongoDb: mongoDbDelete } = await import("./mongodb.js");

            await mongoDbDelete.collection("subscription").updateOne(
              { stripeSubscriptionId: deletedSub.id },
              {
                $set: {
                  status: "canceled",
                  updatedAt: new Date(),
                },
              }
            );
            console.log(`✅ [STRIPE WEBHOOK] Abonnement annulé avec succès`);

            // Envoyer l'email de confirmation d'annulation
            try {
              const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
              const customer = await stripe.customers.retrieve(
                deletedSub.customer
              );

              const { sendSubscriptionCancelledEmail } = await import(
                "./auth-utils.js"
              );

              const planName = deletedSub.metadata?.planName || "FREELANCE";
              const endDate = new Date(
                deletedSub.current_period_end * 1000
              ).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              await sendSubscriptionCancelledEmail({
                to: customer.email,
                customerName: customer.name || customer.email,
                plan: planName.toUpperCase(),
                endDate: endDate,
              });

              console.log(
                `✅ [STRIPE WEBHOOK] Email d'annulation envoyé à ${customer.email}`
              );
            } catch (emailError) {
              console.error(
                `⚠️ [STRIPE WEBHOOK] Erreur envoi email annulation:`,
                emailError
              );
              // Ne pas bloquer l'annulation si l'email échoue
            }
          } catch (error) {
            console.error(
              `❌ [STRIPE WEBHOOK] Erreur annulation abonnement:`,
              error
            );
            console.error(`❌ [STRIPE WEBHOOK] Stack:`, error.stack);
          }
          break;

        case "customer.subscription.trial_will_end":
          // ⏰ Fin d'essai imminente (3 jours avant)
          const trialEndingSub = event.data.object;

          // ✅ Déduplication atomique avec MongoDB
          if (await isEventAlreadyProcessed(event.id, event.type)) {
            break;
          }

          console.log(
            `⏰ [STRIPE WEBHOOK] Fin d'essai imminente pour abonnement: ${trialEndingSub.id}`
          );

          try {
            const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

            // Récupérer les infos du client
            const trialCustomer = await stripe.customers.retrieve(
              trialEndingSub.customer
            );

            // Récupérer le plan et le prix
            const trialPlanName =
              trialEndingSub.metadata?.planName?.toUpperCase() || "FREELANCE";

            // Formater la date de fin d'essai
            let trialEndDateFormatted = "Date non disponible";
            if (trialEndingSub.trial_end) {
              const trialEndTimestamp = trialEndingSub.trial_end * 1000;
              if (!isNaN(trialEndTimestamp) && trialEndTimestamp > 0) {
                trialEndDateFormatted = new Date(
                  trialEndTimestamp
                ).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
              }
            }

            // Calculer le montant qui sera prélevé
            let trialAmount = "Montant non disponible";
            if (trialEndingSub.items?.data?.[0]?.price?.unit_amount) {
              const unitAmount =
                trialEndingSub.items.data[0].price.unit_amount / 100;
              trialAmount = `${unitAmount.toFixed(2)}€`;
            }

            // Envoyer l'email de fin d'essai imminente
            const { sendTrialEndingEmail } = await import("./auth-utils.js");

            await sendTrialEndingEmail({
              to: trialCustomer.email,
              customerName: trialCustomer.name || trialCustomer.email,
              plan: trialPlanName,
              trialEndDate: trialEndDateFormatted,
              amount: trialAmount,
            });

            console.log(
              `✅ [STRIPE WEBHOOK] Email de fin d'essai imminente envoyé à ${trialCustomer.email} (plan: ${trialPlanName}, fin: ${trialEndDateFormatted}, montant: ${trialAmount})`
            );
          } catch (trialEmailError) {
            console.error(
              `⚠️ [STRIPE WEBHOOK] Erreur envoi email fin d'essai:`,
              trialEmailError
            );
            // Ne pas bloquer le webhook si l'email échoue
          }
          break;

        case "invoice.upcoming":
          // Facture à venir (7 jours avant le renouvellement)
          // ℹ️ Email de rappel de renouvellement DÉSACTIVÉ
          // On ne garde que l'email de confirmation de paiement (invoice.paid)
          console.log(
            `📅 [STRIPE WEBHOOK] Facture à venir - pas d'email de rappel envoyé (désactivé)`
          );
          break;

        case "invoice.paid":
          // ⚠️ On utilise UNIQUEMENT invoice.paid (pas invoice.payment_succeeded)
          // car Stripe envoie les deux événements pour le même paiement, ce qui causait des emails en double
          const paidInvoice = event.data.object;

          // ✅ Déduplication atomique avec MongoDB
          if (await isEventAlreadyProcessed(event.id, event.type)) {
            break;
          }

          console.log(
            `💰 [STRIPE WEBHOOK] Paiement facture réussi: ${paidInvoice.id}, billing_reason: ${paidInvoice.billing_reason}`
          );

          try {
            const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

            // Récupérer les infos du client
            const customer = await stripe.customers.retrieve(
              paidInvoice.customer
            );

            // Récupérer l'abonnement pour avoir le nom du plan
            let planName = "FREELANCE";
            let nextRenewalDate = "Date non disponible";
            let subscription = null;

            if (paidInvoice.subscription) {
              subscription = await stripe.subscriptions.retrieve(
                paidInvoice.subscription
              );
              planName =
                subscription.metadata?.planName?.toUpperCase() || "FREELANCE";

              // Formater la date de prochain renouvellement avec vérification
              if (subscription.current_period_end) {
                const renewalTimestamp = subscription.current_period_end * 1000;
                if (!isNaN(renewalTimestamp) && renewalTimestamp > 0) {
                  nextRenewalDate = new Date(
                    renewalTimestamp
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                }
              }
            }

            // ✅ DÉTECTION DÉBUT D'ESSAI
            // Si c'est une création d'abonnement ET que l'abonnement est en période d'essai,
            // on envoie l'email de bienvenue essai au lieu de la confirmation de paiement
            const isTrialStart =
              paidInvoice.billing_reason === "subscription_create" &&
              subscription?.status === "trialing";

            if (isTrialStart) {
              // Formater la date de fin d'essai
              let trialEndDate = "Date non disponible";
              if (subscription.trial_end) {
                const trialEndTimestamp = subscription.trial_end * 1000;
                if (!isNaN(trialEndTimestamp) && trialEndTimestamp > 0) {
                  trialEndDate = new Date(trialEndTimestamp).toLocaleDateString(
                    "fr-FR",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  );
                }
              }

              // Envoyer l'email de début d'essai
              const { sendTrialStartedEmail } = await import("./auth-utils.js");

              await sendTrialStartedEmail({
                to: customer.email,
                customerName: customer.name || customer.email,
                plan: planName,
                trialEndDate,
              });

              console.log(
                `🎉 [STRIPE WEBHOOK] Email de début d'essai envoyé à ${customer.email} (plan: ${planName}, fin: ${trialEndDate})`
              );
              break; // Sortir, ne pas envoyer l'email de paiement
            }

            // Formater les données
            const amount = `${(paidInvoice.amount_paid / 100).toFixed(2)}€`;
            const invoiceNumber = paidInvoice.number || paidInvoice.id;

            // Formater la date de paiement avec vérification
            let paymentDate = new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            if (paidInvoice.status_transitions?.paid_at) {
              const paidTimestamp =
                paidInvoice.status_transitions.paid_at * 1000;
              if (!isNaN(paidTimestamp) && paidTimestamp > 0) {
                paymentDate = new Date(paidTimestamp).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                );
              }
            }

            // URL du PDF de la facture (généré automatiquement par Stripe)
            const invoicePdfUrl = paidInvoice.invoice_pdf;

            // Récupérer l'URL du reçu Stripe via le charge
            let receiptUrl = null;
            try {
              if (paidInvoice.charge) {
                const charge = await stripe.charges.retrieve(
                  paidInvoice.charge
                );
                receiptUrl = charge.receipt_url;
                console.log(
                  `🧾 [STRIPE WEBHOOK] Reçu Stripe trouvé: ${receiptUrl}`
                );
              } else if (paidInvoice.payment_intent) {
                const paymentIntent = await stripe.paymentIntents.retrieve(
                  paidInvoice.payment_intent
                );
                if (paymentIntent.latest_charge) {
                  const charge = await stripe.charges.retrieve(
                    paymentIntent.latest_charge
                  );
                  receiptUrl = charge.receipt_url;
                  console.log(
                    `🧾 [STRIPE WEBHOOK] Reçu Stripe trouvé via payment_intent: ${receiptUrl}`
                  );
                }
              }
            } catch (receiptError) {
              console.warn(
                `⚠️ [STRIPE WEBHOOK] Impossible de récupérer le reçu:`,
                receiptError.message
              );
            }

            // Envoyer l'email avec la facture et le reçu en pièce jointe
            const { sendPaymentSucceededEmail } = await import(
              "./auth-utils.js"
            );

            await sendPaymentSucceededEmail({
              to: customer.email,
              customerName: customer.name || customer.email,
              plan: planName,
              amount,
              invoiceNumber,
              paymentDate,
              nextRenewalDate,
              invoicePdfUrl,
              receiptUrl,
            });

            console.log(
              `✅ [STRIPE WEBHOOK] Email de paiement réussi envoyé à ${customer.email} avec facture PDF${receiptUrl ? " et reçu" : ""}`
            );
          } catch (emailError) {
            console.error(
              `⚠️ [STRIPE WEBHOOK] Erreur envoi email paiement réussi:`,
              emailError
            );
            // Ne pas bloquer le webhook si l'email échoue
          }
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
  // Limite fixe élevée - la vraie vérification se fait dans canInviteMember()
  // Better Auth a des problèmes avec les limites dynamiques async
  membershipLimit: 200,
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
        // Customization
        customColor: {
          type: "string",
          input: true,
          required: false,
        },
        customIcon: {
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
        vatRegime: {
          type: "string",
          input: true,
          required: false,
        },
        vatFrequency: {
          type: "string",
          input: true,
          required: false,
        },
        vatMode: {
          type: "string",
          input: true,
          required: false,
        },
        fiscalYearStartDate: {
          type: "string",
          input: true,
          required: false,
        },
        fiscalYearEndDate: {
          type: "string",
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
        // Document appearance settings (global defaults)
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
        // Per-document-type appearance settings
        quoteTextColor: {
          type: "string",
          input: true,
          required: false,
        },
        quoteHeaderTextColor: {
          type: "string",
          input: true,
          required: false,
        },
        quoteHeaderBgColor: {
          type: "string",
          input: true,
          required: false,
        },
        invoiceTextColor: {
          type: "string",
          input: true,
          required: false,
        },
        invoiceHeaderTextColor: {
          type: "string",
          input: true,
          required: false,
        },
        invoiceHeaderBgColor: {
          type: "string",
          input: true,
          required: false,
        },
        purchaseOrderTextColor: {
          type: "string",
          input: true,
          required: false,
        },
        purchaseOrderHeaderTextColor: {
          type: "string",
          input: true,
          required: false,
        },
        purchaseOrderHeaderBgColor: {
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
        // Notes séparées pour les bons de commande
        purchaseOrderHeaderNotes: {
          type: "string",
          input: true,
          required: false,
        },
        purchaseOrderFooterNotes: {
          type: "string",
          input: true,
          required: false,
        },
        purchaseOrderTermsAndConditions: {
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
        // Client position in PDF
        invoiceClientPositionRight: {
          type: "boolean",
          input: true,
          required: false,
        },
        quoteClientPositionRight: {
          type: "boolean",
          input: true,
          required: false,
        },
        purchaseOrderClientPositionRight: {
          type: "boolean",
          input: true,
          required: false,
        },
        // Préfixes de numérotation
        invoicePrefix: {
          type: "string",
          input: true,
          required: false,
        },
        quotePrefix: {
          type: "string",
          input: true,
          required: false,
        },
        purchaseOrderPrefix: {
          type: "string",
          input: true,
          required: false,
        },
        // Numéros de départ personnalisés
        invoiceStartNumber: {
          type: "string",
          input: true,
          required: false,
        },
        quoteStartNumber: {
          type: "string",
          input: true,
          required: false,
        },
        purchaseOrderStartNumber: {
          type: "string",
          input: true,
          required: false,
        },
        // Organization type (business or accounting_firm)
        organizationType: {
          type: "string",
          input: true,
          required: false,
        },
        // Onboarding completion status
        onboardingCompleted: {
          type: "boolean",
          input: true,
          required: false,
        },
        // SIREN number
        siren: {
          type: "string",
          input: true,
          required: false,
        },
        // Activity sector
        activitySector: {
          type: "string",
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
  maximumSessions: 1, // Maximum 1 session par appareil
});
