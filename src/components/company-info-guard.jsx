"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { isCompanyInfoComplete } from "@/src/hooks/useCompanyInfoGuard";

/**
 * Composant Guard pour protéger les pages nécessitant des informations d'entreprise complètes
 * Affiche un dialog détaillé avec les champs manquants avant de rediriger
 */
export function CompanyInfoGuard({ children }) {
  const { organization, isLoading } = useDashboardLayoutContext();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [missingFieldsInfo, setMissingFieldsInfo] = useState({
    generalFields: [],
    legalFields: [],
  });

  useEffect(() => {
    if (isLoading) return;

    if (!organization) {
      return;
    }

    const isComplete = isCompanyInfoComplete(organization);

    if (!isComplete) {
      // Analyser les champs manquants
      const general = [];
      const legal = [];

      // Vérifier les informations générales
      if (!organization.companyName) general.push("Nom de l'entreprise");
      if (!organization.companyEmail) general.push("Email de contact");
      if (!organization.addressStreet) general.push("Rue");
      if (!organization.addressCity) general.push("Ville");
      if (!organization.addressZipCode) general.push("Code postal");
      if (!organization.addressCountry) general.push("Pays");

      // Vérifier les informations légales
      if (!organization.siret) legal.push("SIRET");
      if (!organization.legalForm) legal.push("Forme juridique");

      setMissingFieldsInfo({ generalFields: general, legalFields: legal });
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [organization, isLoading]);

  const handleGoToSettings = () => {
    const tab =
      missingFieldsInfo.generalFields.length > 0
        ? "generale"
        : "informations-legales";
    router.push(`/dashboard/settings?tab=${tab}`);
  };

  const handleCancel = () => {
    setShowDialog(false);
    router.push("/dashboard/outils");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si les informations sont complètes, afficher le contenu
  if (organization && isCompanyInfoComplete(organization)) {
    return <>{children}</>;
  }

  // Si les informations sont incomplètes, afficher le dialog
  if (organization && !isCompanyInfoComplete(organization)) {
    return (
      <>
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <AlertDialogTitle className="text-lg">
                    Configuration requise
                  </AlertDialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Informations d'entreprise incomplètes
                  </p>
                </div>
              </div>
              <AlertDialogDescription className="text-sm leading-relaxed space-y-4">
                <p>
                  Pour accéder à cet outil, vous devez compléter les
                  informations suivantes :
                </p>

                {missingFieldsInfo.generalFields?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Informations générales
                    </h4>
                    <ul className="space-y-1.5 ml-4">
                      {missingFieldsInfo.generalFields.map((field, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span>{field}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {missingFieldsInfo.legalFields?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Informations légales
                    </h4>
                    <ul className="space-y-1.5 ml-4">
                      {missingFieldsInfo.legalFields.map((field, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span>{field}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 <strong>Astuce :</strong> Ces informations seront
                    automatiquement utilisées pour générer vos documents
                    professionnels.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="cursor-pointer"
              >
                Retour aux outils
              </Button>
              <Button
                onClick={handleGoToSettings}
                className="bg-[#5b4eff] hover:bg-[#4a3dd9] cursor-pointer"
              >
                Compléter les informations
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Afficher un loader pendant que le dialog est ouvert */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">
              Vérification des informations...
            </p>
          </div>
        </div>
      </>
    );
  }

  // Fallback : si pas d'organisation, afficher un loader
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">
          Chargement de l'organisation...
        </p>
      </div>
    </div>
  );
}
