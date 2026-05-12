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
  // Pas de baseURL explicite : Better Auth utilise "/api/auth" (relatif)
  // → résolu par le browser avec window.location.origin.
  // Fonctionne sur localhost, IP locale (mobile dev), et en prod.

  // Désactiver le refetch automatique de session au retour de focus (visibilitychange).
  // Sans ça, chaque Cmd+Tab re-fetch la session → cascade de re-renders
  // sur tous les composants utilisant useSession/useWorkspace (dont le PDF preview).
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
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
            vatRegime: { type: "string" },
            vatFrequency: { type: "string" },
            vatMode: { type: "string" },
            fiscalYearStartDate: { type: "string" },
            fiscalYearEndDate: { type: "string" },
            // Address information (flattened)
            addressStreet: { type: "string" },
            addressCity: { type: "string" },
            addressZipCode: { type: "string" },
            addressCountry: { type: "string" },
            // Bank details (flattened)
            bankName: { type: "string" },
            bankIban: { type: "string" },
            bankBic: { type: "string" },
            // Document appearance settings (global defaults)
            documentTextColor: { type: "string" },
            documentHeaderTextColor: { type: "string" },
            documentHeaderBgColor: { type: "string" },
            // Per-document-type appearance settings
            quoteTextColor: { type: "string" },
            quoteHeaderTextColor: { type: "string" },
            quoteHeaderBgColor: { type: "string" },
            invoiceTextColor: { type: "string" },
            invoiceHeaderTextColor: { type: "string" },
            invoiceHeaderBgColor: { type: "string" },
            purchaseOrderTextColor: { type: "string" },
            purchaseOrderHeaderTextColor: { type: "string" },
            purchaseOrderHeaderBgColor: { type: "string" },
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
            purchaseOrderHeaderNotes: { type: "string" },
            purchaseOrderFooterNotes: { type: "string" },
            purchaseOrderTermsAndConditions: { type: "string" },
            showBankDetails: { type: "boolean" },
            // Client position in PDF
            invoiceClientPositionRight: { type: "boolean" },
            quoteClientPositionRight: { type: "boolean" },
            purchaseOrderClientPositionRight: { type: "boolean" },
            // Préfixes de numérotation
            invoicePrefix: { type: "string" },
            quotePrefix: { type: "string" },
            purchaseOrderPrefix: { type: "string" },
            // Numéros de départ personnalisés
            invoiceStartNumber: { type: "string" },
            quoteStartNumber: { type: "string" },
            purchaseOrderStartNumber: { type: "string" },
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

/**
 * Nettoie tous les caches localStorage liés à la session utilisateur.
 * À appeler avant chaque signOut pour éviter les fuites de données entre comptes.
 */
export function clearSessionStorage() {
  try {
    localStorage.removeItem("user-cache");
    localStorage.removeItem("active_organization_id");
    localStorage.removeItem("user_role");

    // Vider tous les caches d'abonnement
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("subscription-")) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn("Erreur lors du nettoyage des caches localStorage:", e);
  }
}

/**
 * Déconnexion complète et centralisée.
 * Nettoie Apollo cache, localStorage, org ID, puis signOut Better Auth.
 * Utiliser cette fonction PARTOUT au lieu d'implémenter le logout manuellement.
 *
 * @param {Object} [options]
 * @param {string} [options.redirectTo="/auth/login"] - URL de redirection après logout
 * @param {boolean} [options.useHardRedirect=true] - Utiliser window.location.href (true) ou router.push (false)
 */
let _isLoggingOut = false;

export async function performLogout({
  redirectTo = "/auth/login",
  useHardRedirect = true,
} = {}) {
  // Éviter les doubles déconnexions simultanées
  if (_isLoggingOut) return;
  _isLoggingOut = true;

  try {
    // 1. Nettoyer les caches localStorage
    clearSessionStorage();

    // 2. Réinitialiser Apollo (import dynamique pour éviter les dépendances circulaires)
    try {
      const { apolloClient, resetOrganizationIdForApollo } =
        await import("@/src/lib/apolloClient");
      resetOrganizationIdForApollo();
      await apolloClient.clearStore();
    } catch {
      // Apollo peut ne pas être disponible (page auth)
    }

    // 3. SignOut Better Auth (supprime le cookie session)
    await authClient.signOut();

    // 4. Redirection
    if (useHardRedirect) {
      // Hard redirect pour s'assurer que tout l'état React est détruit
      window.location.href = redirectTo;
    }
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    // En cas d'erreur, forcer la redirection quand même
    if (useHardRedirect) {
      window.location.href = redirectTo;
    }
  } finally {
    // Reset après un délai pour laisser la redirection se faire
    setTimeout(() => {
      _isLoggingOut = false;
    }, 2000);
  }
}
