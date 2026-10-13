"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { useOrgPaidByManager } from "@/src/hooks/useOrgPaidByManager";
import { cabinetActionFor } from "@/src/components/gestionnaire/paid-by-cabinet-notice";

/**
 * Bannière de fin d'essai app-managed.
 *
 * Décision produit #6 : la bannière n'apparaît qu'à partir de J-3, jamais avant.
 * Visible quand : trial app actif ET il reste 3 jours ou moins (J-3 → J0 inclus).
 *
 * Quand le feature flag ENABLE_APP_TRIAL est OFF, l'API ne marque jamais
 * `isTrialApp = true`, donc cette bannière reste invisible — aucune régression.
 */
export function TrialBanner({ onSubscribe }) {
  const { isTrialApp, trialDaysRemaining, isOwner, loading } =
    useSubscriptionAccess();
  const pathname = usePathname();
  // Souscrire : « Gérer l'abonnement » (grille non chargée : propriétaire)
  const { canDo, isReady: permissionsReady } = useMyPermissions();
  const canSubscribe = permissionsReady ? canDo("billing", "manage") : isOwner;
  // Espace dont un cabinet paie l'abonnement : c'est lui qui choisit l'offre
  // (vérifié seulement quand le bandeau doit s'afficher)
  const { organization } = useDashboardLayoutContext();
  const shown =
    !loading &&
    isTrialApp &&
    trialDaysRemaining !== null &&
    trialDaysRemaining !== undefined &&
    trialDaysRemaining <= 3;
  const cabinet = useOrgPaidByManager(shown ? organization?.id : null);

  if (loading) return null;
  if (!isTrialApp) return null;
  if (trialDaysRemaining === null || trialDaysRemaining === undefined)
    return null;
  // Décision figée #6 : pas d'affichage avant J-3
  if (trialDaysRemaining > 3) return null;

  // Évite le doublon avec la page d'abonnement (déjà des CTA explicites)
  if (
    pathname?.includes("/parametres/abonnement") ||
    pathname?.includes("/settings/billing")
  ) {
    return null;
  }

  // Prise en charge par un cabinet pas encore vérifiée : rien plutôt qu'un
  // « Souscrivez » à tort
  if (cabinet === undefined) return null;

  const message =
    trialDaysRemaining === 0
      ? "Votre essai gratuit se termine aujourd'hui."
      : trialDaysRemaining === 1
        ? "Il reste 1 jour à votre essai gratuit."
        : `Il reste ${trialDaysRemaining} jours à votre essai gratuit.`;

  if (cabinet) {
    const action = cabinetActionFor(cabinet);
    const remaining =
      trialDaysRemaining === 0
        ? "se termine aujourd'hui"
        : trialDaysRemaining === 1
          ? "se termine demain"
          : `se termine dans ${trialDaysRemaining} jours`;
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            <span>
              {cabinet.viewerIsManager
                ? `L'essai de cet espace ${remaining}. Choisissez son offre pour que votre client ne soit pas interrompu.`
                : `${message} Votre cabinet ${cabinet.managerName} choisit l'offre de cet espace : vous n'avez rien à faire.`}
            </span>
          </div>
          {action && cabinet.subscriptionStatus === null && (
            <Button size="sm" variant="default" className="shrink-0" asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          <span>
            {message}
            {canSubscribe
              ? " Souscrivez pour continuer à utiliser Newbi sans interruption."
              : " Demandez à l'administrateur de souscrire pour éviter l'interruption."}
          </span>
        </div>
        {canSubscribe ? (
          <Button
            size="sm"
            variant="default"
            className="shrink-0"
            onClick={() => {
              if (onSubscribe) {
                onSubscribe();
              } else {
                // Fallback si le callback n'est pas fourni : ouvre le modal
                // de paramètres sur l'onglet abonnement via l'event global.
                window.dispatchEvent(
                  new CustomEvent("openSettingsModal", {
                    detail: { section: "subscription" },
                  }),
                );
              }
            }}
          >
            Souscrire
          </Button>
        ) : null}
      </div>
    </div>
  );
}
