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
import {
  ac,
  admin as adminRole,
  member,
  viewer,
  accountant,
} from "./permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    adminClient({
      ac,
      roles: {
        admin: adminRole,
        member,
        viewer,
        accountant,
      },
    }),
    phoneNumberClient(),
    twoFactorClient({
      // Redirection automatique vers la page de vérification 2FA
      onTwoFactorRedirect() {
        window.location.href = "/auth/verify-2fa";
      },
    }),
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
            logo: { type: "string" },
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
            // Document appearance settings
            documentTextColor: { type: "string" },
            documentHeaderTextColor: { type: "string" },
            documentHeaderBgColor: { type: "string" },
            // Document notes settings
            documentHeaderNotes: { type: "string" },
            documentFooterNotes: { type: "string" },
            documentTermsAndConditions: { type: "string" },
            quoteHeaderNotes: { type: "string" },
            quoteFooterNotes: { type: "string" },
            quoteTermsAndConditions: { type: "string" },
            invoiceHeaderNotes: { type: "string" },
            invoiceFooterNotes: { type: "string" },
            invoiceTermsAndConditions: { type: "string" },
            showBankDetails: { type: "boolean" },
            // Client position in PDF
            invoiceClientPositionRight: { type: "boolean" },
            quoteClientPositionRight: { type: "boolean" },
            // Trial system fields (ISO date strings)
            trialStartDate: { type: "string" },
            trialEndDate: { type: "string" },
            isTrialActive: { type: "boolean" },
            hasUsedTrial: { type: "boolean" },
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
