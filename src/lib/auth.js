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

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  appName: "Newbi",
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
      // Champs pour la période d'essai
      trialStartDate: {
        type: "date",
        required: false,
        defaultValue: null,
      },
      trialEndDate: {
        type: "date",
        required: false,
        defaultValue: null,
      },
      isTrialActive: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      hasUsedTrial: {
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
