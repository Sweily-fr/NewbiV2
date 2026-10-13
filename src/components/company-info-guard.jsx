"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { isCompanyInfoComplete } from "@/src/hooks/useCompanyInfoGuard";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { CompanyInfoDialog } from "@/src/components/company-info-gate";

/**
 * Composant Guard des pages qui CRÉENT ou modifient un document (nouvelle
 * facture, nouveau devis, nouveau bon de commande ou de livraison, nouvel
 * avoir, édition) : il faut des informations d'entreprise complètes pour le
 * générer. La fenêtre n'apparaît jamais à la consultation des listes ou d'un
 * document ; les actions de création lancées depuis une liste passent par
 * useCompanyInfoGate (company-info-gate.jsx).
 * La fenêtre contient tout le formulaire (CompanyInfoForm) : une fois les
 * informations enregistrées, l'espace se met à jour et la page s'affiche.
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

  useEffect(() => {
    if (isLoading) return;

    if (!organization) {
      return;
    }

    setShowDialog(!isCompanyInfoComplete(organization));
  }, [organization, isLoading]);

  // Retour là d'où l'on vient (en général la liste qui a lancé la création),
  // l'accueil seulement si la page a été ouverte directement.
  const handleCancel = () => {
    setShowDialog(false);
    if (window.history.length > 1) router.back();
    else router.push("/dashboard");
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
        {/* Fermer la fenêtre (Échap, clic à côté) revient au même que
            « Retour » : sinon on restait bloqué sur le squelette de l'éditeur */}
        <CompanyInfoDialog
          open={showDialog}
          onOpenChange={(open) => {
            if (!open) handleCancel();
          }}
          organization={organization}
          canEditOrgSettings={canEditOrgSettings}
          onCancel={handleCancel}
          // Une fois enregistré, l'espace se met à jour et la page s'affiche
          // d'elle-même (informations complètes).
        />

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
