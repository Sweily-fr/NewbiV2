import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt, bearer } from "better-auth/plugins";
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

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  appName: "Newbi",
  plugins: [
    jwt(),
    bearer(),
    adminPlugin,
    phoneNumberPlugin,
    twoFactorPlugin,
    stripePlugin,
    organizationPlugin,
    multiSessionPlugin,
  ],

  session: {
    expiresIn: 604800, // 7 jours par défaut (en secondes)
    updateAge: 86400, // Rafraîchir toutes les 24h (en secondes)
    storeSessionInDatabase: true, // Stocker les sessions en base
    cookieCache: {
      enabled: true,
      maxAge: 300, // Cache cookie 5 minutes
    },
  },

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
        console.log(
          `Tentative de connexion d'un compte désactivé: ${user.email}`
        );

        // Envoyer un email de réactivation
        await sendReactivationEmail(user);

        throw new Error(
          "Votre compte a été désactivé. Un email de réactivation vous a été envoyé."
        );
      }

      return user;
    },
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendResetPasswordEmail(user, url);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
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