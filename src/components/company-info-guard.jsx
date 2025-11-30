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
    router.push("/dashboard/outils");
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

            <div className="text-sm leading-relaxed space-y-6 text-muted-foreground">
              {/* Callout d'information */}
              <Callout type="info" noMargin>
                <p className="text-sm font-normal">
                  Ces informations seront utilisées pour générer automatiquement
                  vos documents professionnels (factures, devis, etc.).
                </p>
              </Callout>

              {/* Tableau des champs manquants */}
              <div className="overflow-hidden">
                <Table className="bg-background">
                  <TableHeader>
                    <TableRow className="border-y-0 *:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="w-48"></TableCell>
                      <TableHead
                        className="border-b border-border text-center font-medium text-foreground"
                        colSpan={fieldsInfo.generalFields?.length || 0}
                      >
                        Informations générales
                      </TableHead>
                      <TableHead
                        className="border-b border-border text-center font-medium text-foreground"
                        colSpan={fieldsInfo.legalFields?.length || 0}
                      >
                        Informations légales
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableHeader>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell></TableCell>
                      {fieldsInfo.generalFields?.map((field, index) => (
                        <TableHead
                          key={`general-header-${index}`}
                          className="h-auto rotate-180 text-xs py-3 text-foreground [writing-mode:vertical-lr]"
                        >
                          {field.name}
                        </TableHead>
                      ))}
                      {fieldsInfo.legalFields?.map((field, index) => (
                        <TableHead
                          key={`legal-header-${index}`}
                          className="h-auto rotate-180 text-xs py-3 text-foreground [writing-mode:vertical-lr]"
                        >
                          {field.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="*:border-border [&>:not(:last-child)]:border-r">
                      <TableHead className="font-medium text-foreground">
                        Statut
                      </TableHead>
                      {fieldsInfo.generalFields?.map((field, index) => (
                        <TableCell
                          key={`general-status-${index}`}
                          className="text-center"
                        >
                          {field.completed ? (
                            <>
                              <Check
                                className="inline-flex stroke-emerald-500"
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                              <span className="sr-only">Complété</span>
                            </>
                          ) : (
                            <>
                              <X
                                className="inline-flex stroke-red-500"
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                              <span className="sr-only">Manquant</span>
                            </>
                          )}
                        </TableCell>
                      ))}
                      {fieldsInfo.legalFields?.map((field, index) => (
                        <TableCell
                          key={`legal-status-${index}`}
                          className="text-center"
                        >
                          {field.completed ? (
                            <>
                              <Check
                                className="inline-flex stroke-emerald-500"
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                              <span className="sr-only">Complété</span>
                            </>
                          ) : (
                            <>
                              <X
                                className="inline-flex stroke-red-500"
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                              <span className="sr-only">Manquant</span>
                            </>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
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
