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
    expiresIn: 70 * 60, // 70 minutes - Marge de sécurité au-delà du timeout d'inactivité (60 min)
    updateAge: 60 * 30, // 30 minutes - Renouvellement automatique à mi-vie si utilisateur actif
    cookieCache: {
      enabled: true,
      maxAge: 300, // 5 minutes - Évite les lookups MongoDB fréquents en Edge Runtime
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
          // ✅ NOUVEAU FLUX : NE PAS créer d'organisation au signup
          // L'organisation sera créée APRÈS le paiement Stripe dans le webhook
          // Exception : utilisateurs invités qui rejoignent une org existante
          try {
            const { mongoDb } = await import("./mongodb.js");
            const { ObjectId } = await import("mongodb");

            console.log(
              `🔄 [USER CREATE] Configuration pour ${user.email}...`
            );

            // Vérifier si l'utilisateur a une invitation pending
            const pendingInvitation = await mongoDb
              .collection("invitation")
              .findOne({
                email: user.email.toLowerCase(),
                status: "pending",
                $or: [
                  { expiresAt: { $gt: new Date() } },
                  { expiresAt: { $exists: false } },
                ],
              });

            if (pendingInvitation) {
              console.log(
                `📨 [USER CREATE] Invitation pending trouvée pour ${user.email}`
              );

              // Marquer l'utilisateur comme invité
              await mongoDb.collection("user").updateOne(
                { _id: new ObjectId(user.id) },
                {
                  $set: {
                    hasSeenOnboarding: false,
                    isInvitedUser: true,
                    pendingInvitationId: pendingInvitation._id.toString(),
                  },
                }
              );

              console.log(
                `✅ [USER CREATE] Utilisateur ${user.email} marqué comme invité`
              );
              return user;
            }

            // ✅ NOUVEAU : Ne PAS créer d'organisation ici
            // L'utilisateur passera par l'onboarding et l'org sera créée après paiement
            await mongoDb.collection("user").updateOne(
              { _id: new ObjectId(user.id) },
              {
                $set: {
                  hasSeenOnboarding: false,
                  isInvitedUser: false,
                },
              }
            );

            console.log(
              `✅ [USER CREATE] Utilisateur ${user.email} créé - organisation sera créée après paiement`
            );
          } catch (error) {
            console.error(
              "❌ [USER CREATE] Erreur:",
              error
            );
          }

          return user;
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          try {
            const { mongoDb } = await import("./mongodb.js");
            const { ObjectId } = await import("mongodb");

            console.log(
              `🔍 [SESSION CREATE] Recherche organisation pour userId: ${session.userId}`
            );

            // Chercher une organisation où l'utilisateur est membre
            const member = await mongoDb.collection("member").findOne({
              userId: new ObjectId(session.userId),
            });

            if (member) {
              console.log(
                `✅ [SESSION CREATE] Organisation trouvée: ${member.organizationId}`
              );
              return {
                data: {
                  ...session,
                  activeOrganizationId: member.organizationId.toString(),
                },
              };
            }

            // Pas d'organisation = nouvel utilisateur qui n'a pas encore payé
            console.log(
              `ℹ️ [SESSION CREATE] Pas d'organisation pour ${session.userId} (nouvel utilisateur)`
            );
            return { data: session };
          } catch (error) {
            console.error("❌ [SESSION CREATE] Erreur:", error);
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
    requireEmailVerification: false, // ✅ Désactivé pour permettre l'accès au dashboard sans validation email
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

      // ✅ Ne plus bloquer la connexion si l'email n'est pas vérifié
      // L'utilisateur peut accéder au dashboard et vérifier son email plus tard
      // Note: On peut ajouter un bandeau d'avertissement dans le dashboard si nécessaire

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
      hasCompletedTutorial: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      tutorialCompletedAt: {
        type: "date",
        required: false,
      },
      referralCode: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      // ✅ Champs pour les utilisateurs invités (pas d'organisation propre)
      isInvitedUser: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      pendingInvitationId: {
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
