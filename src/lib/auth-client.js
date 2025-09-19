import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  organizationClient,
  inferOrgAdditionalFields,
  phoneNumberClient,
  twoFactorClient,
  multiSessionClient,
} from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        console.log(
          "✅ [Auth Client] Bearer token récupéré depuis set-auth-token"
        );
        localStorage.setItem("bearer_token", authToken);
      }
    },
  },
  plugins: [
    adminClient(),
    phoneNumberClient(),
    twoFactorClient(),
    multiSessionClient(),
    organizationClient({
      schema: inferOrgAdditionalFields({
        organization: {
          additionalFields: {
            // Company basic information
            companyName: { type: "string" },
            companyEmail: { type: "string" },
            companyPhone: { type: "string" },
            website: { type: "string" },
            // Legal information
            siret: { type: "string" },
            vatNumber: { type: "string" },
            rcs: { type: "string" },
            legalForm: { type: "string" },
            capitalSocial: { type: "string" },
            fiscalRegime: { type: "string" },
            activityCategory: { type: "string" },
            isVatSubject: { type: "boolean" },
            hasCommercialActivity: { type: "boolean" },
            // Address information (flattened)
            addressStreet: { type: "string" },
            addressCity: { type: "string" },
            addressZipCode: { type: "string" },
            addressCountry: { type: "string" },
            // Bank details (flattened)
            bankName: { type: "string" },
            bankIban: { type: "string" },
            bankBic: { type: "string" },
          },
        },
      }),
    }),
    stripeClient({
      subscription: true,
    }),
  ],
});

export const {
  signUp,
  signIn,
  signOut,
  updateUser,
  forgetPassword,
  resetPassword,
  useSession,
  admin,
  organization,
  twoFactor,
  multiSession,
} = authClient;
