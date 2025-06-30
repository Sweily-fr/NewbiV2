import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoDb } from "./mongodb";
import { resend } from "./resend";

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await resend.emails.send({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        text: `Clique sur le lien suivant pour réinitialiser votre mot de passe: ${url}`,
        from: "noreply@newbi.sweily.fr",
      });
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
      phone: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      // avatar: {
      //   type: "string",
      //   required: false,
      //   defaultValue: "",
      // },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as any,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as any,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as any,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as any,
    },
  },
});
