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

    const company = session.user.company;
    
    // Vérifier si les informations essentielles de l'entreprise sont présentes
    const isComplete = !!(
      company?.name &&
      company?.email &&
      company?.address?.street &&
      company?.address?.city &&
      company?.address?.postalCode &&
      company?.address?.country
    );

    console.log('🏢 Vérification informations entreprise:', {
      hasCompany: !!company,
      name: company?.name,
      email: company?.email,
      address: company?.address,
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
    company: session?.user?.company
  };
}

/**
 * Fonction utilitaire pour vérifier si les informations d'entreprise sont complètes
 */
export function isCompanyInfoComplete(company) {
  return !!(
    company?.name &&
    company?.email &&
    company?.address?.street &&
    company?.address?.city &&
    company?.address?.postalCode &&
    company?.address?.country
  );
}
