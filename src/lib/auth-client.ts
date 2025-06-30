import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({});

export const {
  signIn,
  signUp,
  signOut,
  updateUser,
  forgetPassword,
  resetPassword,
  useSession,
} = authClient;
