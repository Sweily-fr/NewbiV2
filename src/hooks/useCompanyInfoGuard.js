"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/src/lib/auth-client";
import {
  LEGAL_FORMS_WITH_CAPITAL,
  LEGAL_FORMS_WITH_RCS,
} from "@/src/lib/validation";
import { normalizeLegalForm } from "@/src/lib/company-registry";

/**
 * Hook pour vérifier si les informations d'entreprise de l'utilisateur sont complètes
 * et rediriger vers la page de configuration si nécessaire
 * Vérifie TOUTES les informations: générales ET légales
 */
export function useCompanyInfoGuard(
  redirectPath = "/dashboard/profile/company",
) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCompanyInfoComplete, setIsCompanyInfoComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    const org = session.user.organization;

    // Vérifier si TOUTES les informations d'entreprise sont présentes
    // Informations générales + Informations légales
    const isComplete = !!(
      // Informations générales
      (
        org?.companyName &&
        org?.companyEmail &&
        org?.addressStreet &&
        org?.addressCity &&
        org?.addressZipCode &&
        org?.addressCountry &&
        // Informations légales
        org?.siret &&
        org?.legalForm
      )
    );

    setIsCompanyInfoComplete(isComplete);
    setIsLoading(false);

    if (!isComplete) {
      router.push(redirectPath);
    }
  }, [session, status, router, redirectPath]);

  return {
    isCompanyInfoComplete,
    isLoading,
    organization: session?.user?.organization,
  };
}

/**
 * Mentions légales exigées sur les documents selon la forme juridique :
 * l'API refuse de finaliser une facture d'une société sans RCS ni capital
 * social (newbi-api, src/models/schemas/companyInfo.js).
 */
export function documentLegalRequirements(legalForm) {
  const form = normalizeLegalForm(legalForm);
  return {
    rcs: LEGAL_FORMS_WITH_RCS.includes(form),
    capital: LEGAL_FORMS_WITH_CAPITAL.includes(form),
  };
}

/**
 * Fonction utilitaire pour vérifier si les informations d'entreprise sont complètes
 * Vérifie TOUTES les informations: générales ET légales
 */
export function isCompanyInfoComplete(organization) {
  const required = documentLegalRequirements(organization?.legalForm);
  return !!(
    // Informations générales
    (
      organization?.companyName &&
      organization?.companyEmail &&
      organization?.addressStreet &&
      organization?.addressCity &&
      organization?.addressZipCode &&
      organization?.addressCountry &&
      // Informations légales
      organization?.siret &&
      organization?.legalForm &&
      (!required.rcs || organization?.rcs) &&
      (!required.capital || organization?.capitalSocial)
    )
  );
}
