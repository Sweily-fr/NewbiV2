"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/src/lib/auth-client";

/**
 * Hook pour vérifier si les informations d'entreprise de l'utilisateur sont complètes
 * et rediriger vers la page de configuration si nécessaire
 */
export function useCompanyInfoGuard(redirectPath = "/dashboard/profile/company") {
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

    const organization = session.user.organization;
    
    // Vérifier si les informations essentielles de l'entreprise sont présentes
    // Utilise la structure de données réelle de Better Auth (champs aplatis)
    const isComplete = !!(
      organization?.companyName &&
      organization?.companyEmail &&
      organization?.addressStreet &&
      organization?.addressCity &&
      organization?.addressZipCode &&
      organization?.addressCountry
    );

    console.log('🏢 Vérification informations entreprise:', {
      hasOrganization: !!organization,
      fullOrganization: organization,
      companyName: organization?.companyName,
      companyEmail: organization?.companyEmail,
      addressStreet: organization?.addressStreet,
      addressCity: organization?.addressCity,
      addressZipCode: organization?.addressZipCode,
      addressCountry: organization?.addressCountry,
      isComplete
    });

    setIsCompanyInfoComplete(isComplete);
    setIsLoading(false);

    if (!isComplete) {
      console.log('⚠️ Informations d\'entreprise incomplètes, redirection vers:', redirectPath);
      router.push(redirectPath);
    }
  }, [session, status, router, redirectPath]);

  return {
    isCompanyInfoComplete,
    isLoading,
    organization: session?.user?.organization
  };
}

/**
 * Fonction utilitaire pour vérifier si les informations d'entreprise sont complètes
 */
export function isCompanyInfoComplete(organization) {
  return !!(
    organization?.companyName &&
    organization?.companyEmail &&
    organization?.addressStreet &&
    organization?.addressCity &&
    organization?.addressZipCode &&
    organization?.addressCountry
  );
}
