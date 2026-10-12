"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { isCompanyInfoComplete } from "@/src/hooks/useCompanyInfoGuard";
import dynamic from "next/dynamic";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import {
  CompanyInfoDialog,
  companyInfoSettingsTab,
  getCompanyInfoFields,
} from "@/src/components/company-info-gate";

// Chunk chargé à la première ouverture seulement
const SettingsModal = dynamic(
  () => import("@/src/components/settings-modal").then((m) => m.SettingsModal),
  { ssr: false },
);

/**
 * Composant Guard pour protéger les pages qui CRÉENT ou modifient un
 * document (création, édition, avoir) : il faut des informations
 * d'entreprise complètes pour le générer. Les listes ne sont pas protégées :
 * les consulter ne demande rien, et leurs actions de création passent par
 * useCompanyInfoGate (company-info-gate.jsx).
 * Affiche un dialog détaillé avec les champs manquants puis ouvre la modal de paramètres
 */
// fallback : skeleton de la page à afficher pendant les états d'attente,
// pour rester visuellement aligné avec le loading.jsx de la route au lieu
// d'intercaler un spinner plein écran entre deux skeletons.
export function CompanyInfoGuard({ children, fallback = null }) {
  const { organization, isLoading } = useDashboardLayoutContext();
  // Compléter les informations : « Modifier » les informations de
  // l'entreprise ; sinon, on invite à contacter l'administrateur
  const { canDo, isReady: permissionsReady } = useMyPermissions();
  const canEditOrgSettings = !permissionsReady || canDo("orgSettings", "edit");
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
      setFieldsInfo(getCompanyInfoFields(organization));
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [organization, isLoading, isSettingsModalOpen]);

  const handleGoToSettings = () => {
    setSettingsInitialTab(companyInfoSettingsTab(fieldsInfo));
    setShowDialog(false);
    setIsSettingsModalOpen(true);
  };

  const handleCancel = () => {
    setShowDialog(false);
    router.push("/dashboard");
  };

  // Ne bloquer que le chargement initial : lors d'un refetch en arrière-plan
  // (ex: mise à jour de l'organisation), garder la page montée pour ne pas
  // perdre l'état local des enfants (panneau de paramètres, formulaires…)
  if (isLoading && !organization) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-screen">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
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
        <CompanyInfoDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          fieldsInfo={fieldsInfo}
          canEditOrgSettings={canEditOrgSettings}
          onCancel={handleCancel}
          onComplete={handleGoToSettings}
        />

        {/* Modal de paramètres */}
        {isSettingsModalOpen && (
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
        )}

        {/* Arrière-plan pendant que le dialog est ouvert : le skeleton de la
            page si fourni, sinon le loader historique */}
        {fallback ?? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Vérification des informations...
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback : si pas d'organisation, afficher le skeleton ou un loader
  return (
    fallback ?? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            Chargement de l'organisation...
          </p>
        </div>
      </div>
    )
  );
}
