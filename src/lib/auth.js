import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { mongoDb } from "./mongodb";
import {
  adminPlugin,
  phoneNumberPlugin,
  twoFactorPlugin,
  stripePlugin,
  organizationPlugin,
  multiSessionPlugin,
} from "./auth-plugins";
import { beforeSignInHook, afterOAuthHook } from "./auth-hooks";
import {
  sendReactivationEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "./auth-utils";
import { ac, admin, member, viewer, accountant } from "./permissions";

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  appName: "Newbi",

  // ⚠️ IMPORTANT: baseURL requis pour OAuth en production
  // Utiliser BETTER_AUTH_URL côté serveur (pas NEXT_PUBLIC_*)
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // ⚠️ CRITICAL: Secret requis pour signer les tokens en production
  secret: process.env.BETTER_AUTH_SECRET,

  // ⚠️ IMPORTANT: trustedOrigins pour autoriser www et non-www
  trustedOrigins: [
    "https://newbi.fr",
    "https://www.newbi.fr",
    "https://newbi-v2.vercel.app",
    "http://localhost:3000",
    "https://newbi-v2-git-develop-sofianemtimet6-2653s-projects.vercel.app",
    "newbi://", // App mobile Expo
  ],

  // Configuration de la session
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 jours - Durée maximale de la session
    updateAge: 60 * 60 * 24, // 24 heures - Renouvellement automatique si utilisateur actif
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes - Cache pour optimiser les performances
    },
    // Ajouter activeOrganizationId aux champs de session
    additionalFields: {
      activeOrganizationId: {
        type: "string",
        required: false,
      },
    },
  },

  // Database hooks pour gérer la persistance de l'organisation active
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // ✅ POINT UNIQUE DE CRÉATION D'ORGANISATION
          // S'exécute pour inscription normale ET OAuth
          try {
            const { mongoDb } = await import("./mongodb.js");
            const { ObjectId } = await import("mongodb");

            console.log(
              `🔄 [USER CREATE] Création organisation pour ${user.email}...`
            );

            // Vérifier si l'utilisateur a déjà une organisation (cas OAuth avec retry)
            const existingMember = await mongoDb
              .collection("member")
              .findOne({ userId: new ObjectId(user.id) });

            if (existingMember) {
              console.log(
                `✅ [USER CREATE] Organisation déjà existante pour ${user.email}, skip création`
              );
              return user;
            }

            // Générer le nom et le slug de l'organisation
            const organizationName =
              user.name || `Espace ${user.email.split("@")[0]}'s`;
            const organizationSlug = `org-${user.id.slice(-8)}`;

            // Calculer les dates de trial (14 jours)
            const now = new Date();
            const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

            // Créer l'organisation
            const orgResult = await mongoDb
              .collection("organization")
              .insertOne({
                name: organizationName,
                slug: organizationSlug,
                logo: null,
                metadata: {
                  autoCreated: true,
                  createdAt: now.toISOString(),
                  createdVia: user.accounts?.[0]?.providerId || "email",
                },
                trialStartDate: now,
                trialEndDate: trialEnd,
                isTrialActive: true,
                hasUsedTrial: true,
                createdAt: now,
              });

            const organizationId = orgResult.insertedId;
            console.log(
              `✅ [USER CREATE] Organisation créée: ${organizationId}`
            );

            // Créer le membre owner
            await mongoDb.collection("member").insertOne({
              organizationId: organizationId,
              userId: new ObjectId(user.id),
              email: user.email,
              role: "owner",
              createdAt: now,
            });

            console.log(
              `✅ [USER CREATE] Membre owner créé pour ${user.email}`
            );

            // ✅ S'assurer que hasSeenOnboarding est défini à false
            await mongoDb.collection("user").updateOne(
              { _id: new ObjectId(user.id) },
              {
                $set: {
                  hasSeenOnboarding: false,
                },
              }
            );

            console.log(
              `✅ [USER CREATE] hasSeenOnboarding initialisé à false pour ${user.email}`
            );
          } catch (error) {
            // ⚠️ IMPORTANT : Ne pas bloquer l'inscription si erreur
            console.error(
              "❌ [USER CREATE] Erreur création organisation:",
              error
            );
            console.error(
              "⚠️ [USER CREATE] Inscription continue malgré l'erreur"
            );
            // TODO: Envoyer notification admin pour investigation
          }

          // ✅ Toujours retourner l'utilisateur pour ne pas bloquer l'inscription
          return user;
        },
      },
    },
    session: {
      create: {
        // ✅ CORRECTION CRITIQUE : Utiliser before au lieu de after
        // Better Auth lit activeOrganizationId AVANT que after ne s'exécute
        // Documentation : https://www.better-auth.com/docs/plugins/organization#active-organization
        before: async (session) => {
          try {
            const { mongoDb } = await import("./mongodb.js");
            const { ObjectId } = await import("mongodb");

            console.log(
              `🔍 [SESSION CREATE BEFORE] Recherche organisation pour userId: ${session.userId}`
            );

            // ✅ Chercher directement une organisation owner
            const ownerMember = await mongoDb.collection("member").findOne({
              userId: new ObjectId(session.userId),
              role: "owner",
            });

            if (ownerMember) {
              console.log(
                `✅ [SESSION CREATE BEFORE] Organisation owner trouvée: ${ownerMember.organizationId}`
              );

              // ✅ Retourner la session AVEC activeOrganizationId
              return {
                data: {
                  ...session,
                  activeOrganizationId: ownerMember.organizationId.toString(),
                },
              };
            }

            // Fallback : chercher n'importe quelle organisation
            console.log(
              "⚠️ [SESSION CREATE BEFORE] Pas d'organisation owner, recherche fallback..."
            );

            const anyMember = await mongoDb.collection("member").findOne({
              userId: new ObjectId(session.userId),
            });

            if (anyMember) {
              console.log(
                `✅ [SESSION CREATE BEFORE] Organisation trouvée (fallback): ${anyMember.organizationId} (role: ${anyMember.role})`
              );

              // ✅ Retourner la session AVEC activeOrganizationId
              return {
                data: {
                  ...session,
                  activeOrganizationId: anyMember.organizationId.toString(),
                },
              };
            }

            // Aucune organisation trouvée
            console.warn(
              "⚠️ [SESSION CREATE BEFORE] Aucune organisation trouvée"
            );
            return { data: session };
          } catch (error) {
            // ⚠️ Ne pas bloquer la connexion si erreur
            console.error("❌ [SESSION CREATE BEFORE] Erreur:", error);
            console.warn(
              "⚠️ [SESSION CREATE BEFORE] Connexion continue malgré l'erreur"
            );
            return { data: session };
          }
        },
      },
    },
  },

  plugins: [
    jwt(),
    adminPlugin,
    phoneNumberPlugin,
    twoFactorPlugin,
    stripePlugin,
    organizationPlugin,
    multiSessionPlugin,
  ],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async signInRateLimit() {
      return {
        window: 60,
        max: 5,
      };
    },
    async beforeSignIn({ user }) {
      // Vérifier si le compte est actif
      if (user.isActive === false) {
        // Envoyer un email de réactivation
        await sendReactivationEmail(user);

        throw new Error(
          "Votre compte a été désactivé. Un email de réactivation vous a été envoyé."
        );
      }

      // Vérifier si l'email est vérifié (Better Auth gère cela automatiquement avec requireEmailVerification: true)
      if (!user.emailVerified) {
        throw new Error(
          "Veuillez vérifier votre adresse email avant de vous connecter."
        );
      }

      return user;
    },
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user, url);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user, url);
    },
    sendOnSignUp: true,
    // ✅ PRIORITÉ 2 : Connexion automatique après vérification d'email
    autoSignInAfterVerification: true,
    expiresIn: 3600, // 1 heure pour vérifier l'email

    // ✅ Callback après vérification réussie
    // S'exécute APRÈS que autoSignInAfterVerification ait créé la session
    async afterEmailVerification(user, request) {
      console.log(`✅ [EMAIL VERIFICATION] Email vérifié pour ${user.email}`);

      try {
        const { mongoDb } = await import("./mongodb.js");
        const { ObjectId } = await import("mongodb");

        // 1. Vérifier que l'utilisateur a une organisation
        const member = await mongoDb.collection("member").findOne({
          userId: new ObjectId(user.id),
          role: "owner", // Priorité à l'organisation owner
        });

        if (!member) {
          console.warn(
            `⚠️ [EMAIL VERIFICATION] Aucune organisation owner pour ${user.email}`
          );

          // Fallback : chercher n'importe quelle organisation
          const anyMember = await mongoDb.collection("member").findOne({
            userId: new ObjectId(user.id),
          });

          if (!anyMember) {
            console.error(
              `❌ [EMAIL VERIFICATION] Aucune organisation trouvée pour ${user.email}`
            );
            return;
          }

          console.log(
            `✅ [EMAIL VERIFICATION] Organisation trouvée (fallback): ${anyMember.organizationId}`
          );
        } else {
          console.log(
            `✅ [EMAIL VERIFICATION] Organisation owner trouvée: ${member.organizationId}`
          );
        }

        // 2. S'assurer que la session a l'organisation active définie
        // Note : Le hook session.create.after devrait déjà l'avoir fait
        // Mais on vérifie au cas où
        const sessions = await mongoDb
          .collection("session")
          .find({ userId: new ObjectId(user.id) })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();

        if (sessions.length > 0) {
          const session = sessions[0];
          if (!session.activeOrganizationId) {
            console.warn(
              `⚠️ [EMAIL VERIFICATION] Session sans organisation active, correction...`
            );

            const orgToSet = member || anyMember;
            await mongoDb.collection("session").updateOne(
              { _id: session._id },
              {
                $set: {
                  activeOrganizationId: orgToSet.organizationId.toString(),
                },
              }
            );

            console.log(
              `✅ [EMAIL VERIFICATION] Organisation active définie: ${orgToSet.organizationId}`
            );
          } else {
            console.log(
              `✅ [EMAIL VERIFICATION] Organisation active déjà définie: ${session.activeOrganizationId}`
            );
          }
        }
      } catch (error) {
        console.error("❌ [EMAIL VERIFICATION] Erreur:", error);
      }
    },
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
      redirect_after_login: {
        type: "string",
        required: false,
        defaultValue: "dashboard",
      },
      hasSeenOnboarding: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      referralCode: {
        type: "string",
        required: false,
        defaultValue: "",
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
    before: beforeSignInHook,
    after: afterOAuthHook,
  },
});
