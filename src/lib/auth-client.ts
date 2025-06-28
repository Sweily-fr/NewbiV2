import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:4000/graphql/api/auth", // Chemin complet incluant /api/auth
  fetchOptions: {
    credentials: "include", // Important pour les cookies d'authentification
  },
});

export const { signIn, signUp, useSession } = authClient;
