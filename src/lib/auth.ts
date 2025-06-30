import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoDb } from "./mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  emailAndPassword: {
    enabled: true,
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
