import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient, inferOrgAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    adminClient(), 
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
      })
    })
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  updateUser,
  forgetPassword,
  resetPassword,
  useSession,
  admin,
  organization,
} = authClient;
