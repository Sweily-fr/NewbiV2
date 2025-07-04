import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({ plugins: [adminClient()] });

export const {
  signIn,
  signUp,
  signOut,
  updateUser,
  forgetPassword,
  resetPassword,
  useSession,
  admin,
} = authClient;
