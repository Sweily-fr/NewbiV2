import { useMemo } from "react";
import { useActiveOrganization } from "@/src/lib/organization-client";

/**
 * Hook pour vérifier le type d'organisation et ses fonctionnalités
 *
 * Types d'organisation:
 * - 'business': Organisation simple (entreprise, freelance)
 * - 'accounting_firm': Cabinet comptable avec fonctionnalités avancées
 *
 * @returns {Object} Informations sur le type d'organisation
 */
export function useOrganizationType() {
  const { organization, loading, error } = useActiveOrganization();

  const organizationInfo = useMemo(() => {
    if (!organization) {
      return {
        type: null,
        isAccountingFirm: false,
        isBusiness: false,
        isOnboardingCompleted: false,
        hasType: false,
      };
    }

    const type = organization.organizationType;
    const isOnboardingCompleted = organization.onboardingCompleted === true;

    return {
      // Type brut de l'organisation
      type,

      // Vérifications de type
      isAccountingFirm: type === "accounting_firm",
      isBusiness: type === "business",

      // Statut de l'onboarding
      isOnboardingCompleted,

      // Vérification si le type a été défini
      hasType: type !== null && type !== undefined,

      // Informations supplémentaires
      organizationName: organization.name,
      organizationId: organization.id,
    };
  }, [organization]);

  return {
    ...organizationInfo,
    loading,
    error,
    organization,
  };
}

/**
 * Hook pour vérifier si l'utilisateur a accès aux fonctionnalités comptables
 *
 * @returns {boolean} true si l'organisation est un cabinet comptable
 */
export function useIsAccountingFirm() {
  const { isAccountingFirm, loading } = useOrganizationType();
  return { isAccountingFirm, loading };
}

/**
 * Hook pour vérifier si l'onboarding de l'organisation est complété
 *
 * @returns {Object} Statut de l'onboarding
 */
export function useOrganizationOnboarding() {
  const { isOnboardingCompleted, hasType, loading } = useOrganizationType();

  return {
    isCompleted: isOnboardingCompleted,
    needsOnboarding: !isOnboardingCompleted || !hasType,
    loading,
  };
}

export default useOrganizationType;
