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

        // Fallback: autoriser temporairement si l'adapter ne fonctionne pas
        console.log("🔐 [AUTHORIZE] Fallback: adapter not available, allowing");
        return true;
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
          monthlyPrice: 14.59,
          annualPrice: 13.13, // -10% de réduction (14.59 * 12 * 0.90 / 12)
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
              // ✅ FIX : Mettre à jour toutes les sessions de l'utilisateur
              const updateResult = await mongoDb
                .collection("session")
                .updateMany(
                  { userId: userId },
                  { $set: { activeOrganizationId: referenceId } }
                );

              console.log(
                `✅ [STRIPE WEBHOOK] Organisation créée: ${referenceId}`
              );
              console.log(
                `✅ [STRIPE WEBHOOK] ${updateResult.modifiedCount} session(s) mise(s) à jour avec activeOrganizationId`
              );

              // ⚠️ IMPORTANT : Créer l'abonnement AVANT d'envoyer les invitations
              // pour éviter les timeouts qui empêchent la création de l'abonnement
              console.log(
                `🔄 [STRIPE WEBHOOK] Création abonnement en priorité...`
              );

              try {
                // Vérifier si l'abonnement existe déjà
                const existingSub = await mongoDb
                  .collection("subscription")
                  .findOne({
                    stripeSubscriptionId: subscription.id,
                  });

                if (!existingSub) {
                  // Récupérer le nom du plan depuis les métadonnées
                  const planName =
                    subscription.metadata?.planName ||
                    session.metadata?.planName ||
                    "freelance";
                  console.log(`📋 [STRIPE WEBHOOK] Plan détecté: ${planName}`);

                  const subscriptionData = {
                    plan: planName,
                    referenceId: referenceId,
                    stripeCustomerId: subscription.customer,
                    status: subscription.status,
                    seats: 1,
                    cancelAtPeriodEnd:
                      subscription.cancel_at_period_end || false,
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

                  // ✅ Utiliser l'adapter Better Auth pour créer l'abonnement
                  // Cela génère automatiquement le champ `id` requis
                  await adapter.create({
                    model: "subscription",
                    data: subscriptionData,
                  });

                  console.log(
                    `✅ [STRIPE WEBHOOK] Abonnement créé via adapter pour nouvelle org: ${referenceId}`
                  );
                } else {
                  console.log(`✅ [STRIPE WEBHOOK] Abonnement existe déjà`);
                }
              } catch (subError) {
                console.error(
                  `❌ [STRIPE WEBHOOK] Erreur création abonnement:`,
                  subError
                );
                // Ne pas bloquer le reste du processus
              }

              // Envoyer les invitations APRÈS la création de l'abonnement (non bloquant)
              if (orgInvitedEmails) {
                // Utiliser Promise.resolve().then() pour rendre l'envoi asynchrone et non-bloquant
                // Compatible avec Edge Runtime (pas de setImmediate)
                Promise.resolve()
                  .then(async () => {
                    try {
                      const invitedEmailsList = JSON.parse(orgInvitedEmails);

                      if (
                        Array.isArray(invitedEmailsList) &&
                        invitedEmailsList.length > 0
                      ) {
                        console.log(
                          `📧 [STRIPE WEBHOOK] Envoi de ${invitedEmailsList.length} invitation(s) en arrière-plan...`
                        );

                        // Récupérer les infos de l'inviteur et de l'organisation
                        const inviterUser = await mongoDb
                          .collection("user")
                          .findOne({
                            _id: new ObjectId(userId),
                          });

                        const org = await mongoDb
                          .collection("organization")
                          .findOne({
                            _id: organizationObjectId,
                          });

                        if (!inviterUser || !org) {
                          console.error(
                            "❌ [STRIPE WEBHOOK] Inviteur ou organisation introuvable"
                          );
                        } else {
                          // Envoyer les invitations en parallèle (plus rapide)
                          const { ObjectId } = await import("mongodb");
                          const invitationPromises = invitedEmailsList
                            .filter(
                              (member) =>
                                member && (member.email || member).trim()
                            )
                            .map(async (member) => {
                              try {
                                // ✅ FIX : Supporter les objets {email, role} et les strings
                                const memberEmail =
                                  typeof member === "string"
                                    ? member
                                    : member.email;
                                const memberRole =
                                  typeof member === "string"
                                    ? "member"
                                    : member.role || "member";

                                const expiresAt = new Date(
                                  Date.now() + 7 * 24 * 60 * 60 * 1000
                                );

                                // Insérer l'invitation et récupérer l'_id généré
                                const insertResult = await mongoDb
                                  .collection("invitation")
                                  .insertOne({
                                    organizationId: new ObjectId(referenceId), // ✅ Convertir en ObjectId
                                    email: memberEmail.trim(),
                                    role: memberRole, // ✅ Utiliser le rôle du membre
                                    inviterId: new ObjectId(userId), // ✅ Convertir en ObjectId
                                    status: "pending",
                                    expiresAt: expiresAt,
                                    createdAt: new Date(),
                                  });

                                const invitationId =
                                  insertResult.insertedId.toString();

                                const { sendOrganizationInvitationEmail } =
                                  await import("./auth-utils.js");

                                await sendOrganizationInvitationEmail({
                                  id: invitationId,
                                  email: memberEmail.trim(),
                                  role: memberRole, // ✅ Utiliser le rôle du membre
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

                                console.log(
                                  `✅ [STRIPE WEBHOOK] Invitation envoyée à ${email}`
                                );
                              } catch (inviteError) {
                                console.error(
                                  `❌ [STRIPE WEBHOOK] Erreur invitation ${email}:`,
                                  inviteError
                                );
                              }
                            });

                          // Attendre toutes les invitations (mais en arrière-plan)
                          await Promise.allSettled(invitationPromises);
                          console.log(
                            `✅ [STRIPE WEBHOOK] Toutes les invitations traitées`
                          );
                        }
                      }
                    } catch (parseError) {
                      console.error(
                        "❌ [STRIPE WEBHOOK] Erreur parsing emails invités:",
                        parseError
                      );
                    }
                  })
                  .catch((err) => {
                    console.error(
                      "❌ [STRIPE WEBHOOK] Erreur globale invitations:",
                      err
                    );
                  });

                console.log(
                  `📧 [STRIPE WEBHOOK] Invitations programmées en arrière-plan`
                );
              }

              // ⚠️ Ne pas continuer vers la création d'abonnement normale
              // car on l'a déjà créé ci-dessus
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

              // ✅ Désactiver le trial de l'organisation si l'abonnement est actif (pas trialing)
              if (subscription.status === "active" && referenceId) {
                try {
                  const orgUpdateResult = await mongoDb
                    .collection("organization")
                    .updateOne(
                      { _id: new ObjectId(referenceId) },
                      {
                        $set: {
                          isTrialActive: false,
                          hasUsedTrial: true,
                          updatedAt: new Date(),
                        },
                      }
                    );
                  if (orgUpdateResult.modifiedCount > 0) {
                    console.log(
                      `✅ [STRIPE WEBHOOK] Trial désactivé pour l'organisation ${referenceId}`
                    );
                  }
                } catch (trialError) {
                  console.warn(
                    `⚠️ [STRIPE WEBHOOK] Erreur désactivation trial:`,
                    trialError.message
                  );
                }
              }

              // Envoyer l'email de bienvenue
              try {
                const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
                const customer = await stripe.customers.retrieve(
                  subscription.customer
                );

                const { sendSubscriptionCreatedEmail } = await import(
                  "./auth-utils.js"
                );

                // Déterminer les fonctionnalités selon le plan
                const planFeatures = {
                  freelance: [
                    "1 utilisateur inclus",
                    "Facturation complète",
                    "Gestion client et fournisseurs",
                    "OCR des reçus",
                    "Catalogue produits",
                    "Rapports financiers",
                  ],
                  pme: [
                    "10 utilisateurs inclus",
                    "Toutes les fonctionnalités Freelance",
                    "Connexion comptes bancaires",
                    "Gestion de trésorerie",
                    "Transfert de fichiers sécurisé",
                    "Rapports avancés",
                  ],
                  entreprise: [
                    "25 utilisateurs inclus",
                    "Toutes les fonctionnalités PME",
                    "Support prioritaire",
                    "Sièges additionnels (7,49€/mois)",
                    "Gestion multi-organisations",
                    "API access",
                  ],
                };

                // Déterminer le prix et l'intervalle
                const isAnnual = priceData?.recurring?.interval === "year";
                const priceMap = {
                  freelance: { monthly: "14,59€/mois", annual: "13,13€/mois" },
                  pme: { monthly: "48,99€/mois", annual: "44,09€/mois" },
                  entreprise: { monthly: "94,99€/mois", annual: "85,49€/mois" },
                };

                await sendSubscriptionCreatedEmail({
                  to: customer.email,
                  customerName: customer.name || customer.email,
                  plan: planName.toUpperCase(),
                  price: isAnnual
                    ? priceMap[planName]?.annual
                    : priceMap[planName]?.monthly,
                  billingInterval: isAnnual ? "Annuelle" : "Mensuelle",
                  features: planFeatures[planName] || [],
                });

                console.log(
                  `✅ [STRIPE WEBHOOK] Email de bienvenue envoyé à ${customer.email}`
                );
              } catch (emailError) {
                console.error(
                  `⚠️ [STRIPE WEBHOOK] Erreur envoi email bienvenue:`,
                  emailError
                );
                // Ne pas bloquer la création d'abonnement si l'email échoue
              }
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

        case "invoice.upcoming":
          // Facture à venir (7 jours avant le renouvellement)
          const upcomingInvoice = event.data.object;
          console.log(
            `📅 [STRIPE WEBHOOK] Facture à venir pour ${upcomingInvoice.customer}`
          );

          try {
            const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
            const customer = await stripe.customers.retrieve(
              upcomingInvoice.customer
            );

            // Récupérer l'abonnement
            const subscription = await stripe.subscriptions.retrieve(
              upcomingInvoice.subscription
            );

            const { sendRenewalReminderEmail } = await import(
              "./auth-utils.js"
            );

            const planName = subscription.metadata?.planName || "FREELANCE";
            const renewalDate = new Date(
              subscription.current_period_end * 1000
            ).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            // Formater le montant
            const amount = `${(upcomingInvoice.amount_due / 100).toFixed(2)}€`;

            await sendRenewalReminderEmail({
              to: customer.email,
              customerName: customer.name || customer.email,
              plan: planName.toUpperCase(),
              renewalDate: renewalDate,
              amount: amount,
            });

            console.log(
              `✅ [STRIPE WEBHOOK] Email de rappel renouvellement envoyé à ${customer.email}`
            );
          } catch (emailError) {
            console.error(
              `⚠️ [STRIPE WEBHOOK] Erreur envoi email rappel:`,
              emailError
            );
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
