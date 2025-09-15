import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoDb } from "./mongodb";
import {
  adminPlugin,
  phoneNumberPlugin,
  twoFactorPlugin,
  stripePlugin,
  organizationPlugin,
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
    adminPlugin,
    phoneNumberPlugin,
    twoFactorPlugin,
    stripePlugin,
    organizationPlugin,
  ],

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
      referralCode: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      referredBy: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      referralEarnings: {
        type: "number",
        required: false,
        defaultValue: 0,
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
