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
          // Après la création d'un utilisateur, créer automatiquement une organisation
          try {
            const { mongoDb } = await import("./mongodb.js");
            const { ObjectId } = await import("mongodb");
            
            console.log(`🔄 [USER CREATE] Création organisation pour ${user.email}...`);
            
            // Générer le nom et le slug de l'organisation
            const organizationName = user.name || `Espace ${user.email.split("@")[0]}'s`;
            const organizationSlug = `org-${user.id.slice(-8)}`;
            
            // Calculer les dates de trial (14 jours)
            const now = new Date();
            const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            
            // Créer l'organisation
            const orgResult = await mongoDb.collection("organization").insertOne({
              name: organizationName,
              slug: organizationSlug,
              logo: null,
              metadata: {
                autoCreated: true,
                createdAt: now.toISOString(),
              },
              trialStartDate: now,
              trialEndDate: trialEnd,
              isTrialActive: true,
              hasUsedTrial: true,
              createdAt: now,
            });
            
            const organizationId = orgResult.insertedId;
            console.log(`✅ [USER CREATE] Organisation créée: ${organizationId}`);
            
            // Créer le membre owner
            await mongoDb.collection("member").insertOne({
              organizationId: organizationId,
              userId: new ObjectId(user.id),
              email: user.email,
              role: "owner",
              createdAt: now,
            });
            
            console.log(`✅ [USER CREATE] Membre owner créé pour ${user.email}`);
            
          } catch (error) {
            console.error("❌ [USER CREATE] Erreur création organisation:", error);
          }
          
          return user;
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Après la création d'une session, définir l'organisation active selon la priorité
          try {
            const { mongoDb } = await import("./mongodb.js");
            const { ObjectId } = await import("mongodb");

            console.log(`🔍 [SESSION CREATE] Recherche organisation pour userId: ${session.userId}`);
            
            // Récupérer TOUTES les organisations de l'utilisateur
            const members = await mongoDb.collection("member").find({
              userId: new ObjectId(session.userId),
            }).toArray();
            
            if (!members || members.length === 0) {
              console.warn("⚠️ [SESSION CREATE] Aucune organisation trouvée pour cet utilisateur");
              return session;
            }
            
            console.log(`📊 [SESSION CREATE] ${members.length} organisation(s) trouvée(s)`);
            
            // Stratégie de sélection par priorité :
            // 1. Organisation où l'utilisateur est owner
            // 2. Organisation où l'utilisateur est admin
            // 3. Première organisation (par ordre de création)
            
            let selectedMember = null;
            
            // Priorité 1 : Chercher une organisation où l'utilisateur est owner
            selectedMember = members.find(m => m.role === "owner");
            
            if (selectedMember) {
              console.log(`✅ [SESSION CREATE] Organisation owner trouvée: ${selectedMember.organizationId}`);
            } else {
              // Priorité 2 : Chercher une organisation où l'utilisateur est admin
              selectedMember = members.find(m => m.role === "admin");
              
              if (selectedMember) {
                console.log(`✅ [SESSION CREATE] Organisation admin trouvée: ${selectedMember.organizationId}`);
              } else {
                // Priorité 3 : Prendre la première organisation
                selectedMember = members[0];
                console.log(`✅ [SESSION CREATE] Première organisation sélectionnée (${selectedMember.role}): ${selectedMember.organizationId}`);
              }
            }

            if (selectedMember && selectedMember.organizationId) {
              // Mettre à jour la session avec l'organisation active
              await mongoDb
                .collection("session")
                .updateOne(
                  { _id: new ObjectId(session.id) },
                  {
                    $set: {
                      activeOrganizationId: selectedMember.organizationId.toString(),
                    },
                  }
                );

              console.log(
                `✅ [SESSION CREATE] Organisation active définie: ${selectedMember.organizationId.toString()} (role: ${selectedMember.role})`
              );
            }
          } catch (error) {
            console.error("❌ [SESSION CREATE] Erreur définition organisation active:", error);
          }

          return session;
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
