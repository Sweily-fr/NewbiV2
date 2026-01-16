"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  LoaderCircle,
  Building2,
  FileText,
  CheckCircle2,
  Check,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";
import { Callout } from "@/src/components/ui/callout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { isCompanyInfoComplete } from "@/src/hooks/useCompanyInfoGuard";
import { SettingsModal } from "@/src/components/settings-modal";

/**
 * Composant Guard pour protéger les pages nécessitant des informations d'entreprise complètes
 * Affiche un dialog détaillé avec les champs manquants puis ouvre la modal de paramètres
 */
export function CompanyInfoGuard({ children }) {
  const { organization, isLoading } = useDashboardLayoutContext();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("generale");
  const [fieldsInfo, setFieldsInfo] = useState({
    generalFields: [],
    legalFields: [],
  });

  useEffect(() => {
    if (isLoading) return;

    if (!organization) {
      return;
    }

    // Ne pas vérifier si le modal de paramètres est déjà ouvert
    if (isSettingsModalOpen) {
      return;
    }

    const isComplete = isCompanyInfoComplete(organization);

    if (!isComplete) {
      // Analyser tous les champs avec leur statut
      const general = [
        { name: "Nom de l'entreprise", completed: !!organization.companyName },
        { name: "Email de contact", completed: !!organization.companyEmail },
        { name: "Rue", completed: !!organization.addressStreet },
        { name: "Ville", completed: !!organization.addressCity },
        { name: "Code postal", completed: !!organization.addressZipCode },
        { name: "Pays", completed: !!organization.addressCountry },
      ];

      const legal = [
        { name: "SIRET", completed: !!organization.siret },
        { name: "Forme juridique", completed: !!organization.legalForm },
      ];

      setFieldsInfo({ generalFields: general, legalFields: legal });
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [organization, isLoading, isSettingsModalOpen]);

  const handleGoToSettings = () => {
    const hasGeneralMissing = fieldsInfo.generalFields.some(
      (f) => !f.completed
    );
    const tab = hasGeneralMissing ? "generale" : "informations-legales";
    setSettingsInitialTab(tab);
    setShowDialog(false);
    setIsSettingsModalOpen(true);
  };

  const handleCancel = () => {
    setShowDialog(false);
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
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
          <AlertDialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto border-none shadow-2xl">
            <AlertDialogHeader className="text-left space-y-4 pb-4">
              {/* En-tête épuré */}
              <div className="space-y-2">
                <AlertDialogTitle className="text-xl font-normal text-foreground">
                  Configuration de votre entreprise
                </AlertDialogTitle>
                <p className="text-sm font-normal text-muted-foreground">
                  Quelques informations sont nécessaires pour continuer
                </p>
              </div>
            </AlertDialogHeader>

            <div className="space-y-4">
              {/* Callout d'information */}
              <Callout type="info" noMargin>
                <p className="text-sm font-normal">
                  Ces informations seront utilisées pour générer automatiquement
                  vos documents professionnels (factures, devis, etc.).
                </p>
              </Callout>

              {/* Section Informations générales */}
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-muted-foreground px-1 mb-2">
                  Informations générales
                </h3>
                <div className="space-y-0 border border-border/40 rounded-lg overflow-hidden">
                  {fieldsInfo.generalFields?.map((field, index) => (
                    <div
                      key={`general-${index}`}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors ${
                        index !== fieldsInfo.generalFields.length - 1
                          ? "border-b border-border/40"
                          : ""
                      }`}
                    >
                      <span className="text-sm text-foreground">
                        {field.name}
                      </span>
                      {field.completed ? (
                        <Check
                          className="stroke-emerald-500 shrink-0"
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      ) : (
                        <X
                          className="stroke-red-500 shrink-0"
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Informations légales */}
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-muted-foreground px-1 mb-2">
                  Informations légales
                </h3>
                <div className="space-y-0 border border-border/40 rounded-lg overflow-hidden">
                  {fieldsInfo.legalFields?.map((field, index) => (
                    <div
                      key={`legal-${index}`}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors ${
                        index !== fieldsInfo.legalFields.length - 1
                          ? "border-b border-border/40"
                          : ""
                      }`}
                    >
                      <span className="text-sm text-foreground">
                        {field.name}
                      </span>
                      {field.completed ? (
                        <Check
                          className="stroke-emerald-500 shrink-0"
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      ) : (
                        <X
                          className="stroke-red-500 shrink-0"
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <AlertDialogFooter className="gap-3 flex-col sm:flex-row pt-6 border-t">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="cursor-pointer w-full sm:w-auto font-normal order-2 sm:order-1"
              >
                Retour aux outils
              </Button>
              <Button
                onClick={handleGoToSettings}
                className="bg-[#5a50ff] hover:bg-[#4a40ef] text-white cursor-pointer w-full sm:w-auto font-normal order-1 sm:order-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Compléter maintenant
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de paramètres */}
        <SettingsModal
          open={isSettingsModalOpen}
          onOpenChange={(open) => {
            setIsSettingsModalOpen(open);
            // Quand le modal se ferme, revérifier les informations
            if (!open) {
              // Petit délai pour laisser le temps à l'organisation de se mettre à jour
              setTimeout(() => {
                const isComplete = isCompanyInfoComplete(organization);
                if (!isComplete) {
                  setShowDialog(true);
                }
              }, 500);
            }
          }}
          initialTab={settingsInitialTab}
        />

        {/* Afficher un loader pendant que le dialog est ouvert */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto" />
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
        <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">
          Chargement de l'organisation...
        </p>
      </div>
    </div>
  );
}
