"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  Building2,
  Check,
  Circle,
  CornerDownLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { isCompanyInfoComplete } from "@/src/hooks/useCompanyInfoGuard";
import { SettingsModal } from "@/src/components/settings-modal";
import { cn } from "@/src/lib/utils";

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
      (f) => !f.completed,
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

  // Calcul de la progression
  const allFields = [...fieldsInfo.generalFields, ...fieldsInfo.legalFields];
  const completedCount = allFields.filter((f) => f.completed).length;
  const totalCount = allFields.length;

  // Ne bloquer que le chargement initial : lors d'un refetch en arrière-plan
  // (ex: mise à jour de l'organisation), garder la page montée pour ne pas
  // perdre l'état local des enfants (panneau de paramètres, formulaires…)
  if (isLoading && !organization) {
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
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[520px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
            <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
              {/* Header */}
              <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
                <DialogTitle className="text-sm font-medium">
                  Configuration de votre entreprise
                </DialogTitle>
              </DialogHeader>

              <div className="px-5 pt-4 pb-0">
                {/* Description + progression */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] text-muted-foreground">
                    Complétez ces informations pour générer vos documents.
                  </p>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-3">
                    {completedCount}/{totalCount}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="h-1 bg-muted rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full bg-foreground rounded-full transition-all duration-500"
                    style={{
                      width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>

                {/* Sections côte à côte */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Informations générales */}
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Général
                    </p>
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      {fieldsInfo.generalFields?.map((field, index) => (
                        <div
                          key={`general-${index}`}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2",
                            index !== fieldsInfo.generalFields.length - 1 &&
                              "border-b border-border/40",
                          )}
                        >
                          {field.completed ? (
                            <div className="flex items-center justify-center size-4 rounded-full bg-foreground shrink-0">
                              <Check
                                className="size-2.5 text-background"
                                strokeWidth={3}
                              />
                            </div>
                          ) : (
                            <Circle
                              className="size-4 text-border shrink-0"
                              strokeWidth={2}
                            />
                          )}
                          <span
                            className={cn(
                              "text-[13px]",
                              field.completed
                                ? "text-muted-foreground line-through"
                                : "text-foreground",
                            )}
                          >
                            {field.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Informations légales */}
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Légal
                    </p>
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      {fieldsInfo.legalFields?.map((field, index) => (
                        <div
                          key={`legal-${index}`}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2",
                            index !== fieldsInfo.legalFields.length - 1 &&
                              "border-b border-border/40",
                          )}
                        >
                          {field.completed ? (
                            <div className="flex items-center justify-center size-4 rounded-full bg-foreground shrink-0">
                              <Check
                                className="size-2.5 text-background"
                                strokeWidth={3}
                              />
                            </div>
                          ) : (
                            <Circle
                              className="size-4 text-border shrink-0"
                              strokeWidth={2}
                            />
                          )}
                          <span
                            className={cn(
                              "text-[13px]",
                              field.completed
                                ? "text-muted-foreground line-through"
                                : "text-foreground",
                            )}
                          >
                            {field.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/40 -mx-5 px-5 py-3">
                  <button
                    onClick={handleCancel}
                    className="text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Retour
                  </button>
                  <Button
                    variant="primary"
                    onClick={handleGoToSettings}
                    className="gap-2 cursor-pointer"
                  >
                    Compléter
                    <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                      <CornerDownLeft className="size-3" />
                    </kbd>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
