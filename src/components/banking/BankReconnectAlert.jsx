"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Callout } from "@/src/components/ui/callout";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useBankingConnection } from "@/src/hooks/useBankingConnection";

/**
 * Bannière affichée quand une ou plusieurs connexions bancaires nécessitent
 * une action de l'utilisateur (SCA expirée, identifiants invalides...).
 * La synchronisation des transactions est bloquée tant que la banque
 * n'a pas été reconnectée. Ne rend rien si tout est en ordre.
 *
 * La SCA se revalide banque par banque (une webview Bridge par item) :
 * quand plusieurs connexions ont expiré, une seule bannière est affichée
 * avec des flèches pour passer d'une banque à l'autre. Au retour de chaque
 * reconnexion, la bannière se rafraîchit et montre les banques restantes.
 */
export function BankReconnectAlert() {
  const { workspaceId } = useWorkspace();
  const { itemsNeedingAction, reconnectBank, refreshStatus, isLoading } =
    useBankingConnection(workspaceId);
  const refreshedAfterCallback = useRef(false);
  const [index, setIndex] = useState(0);

  // Au retour de la webview Bridge (?banking_success=true), forcer la
  // relecture du statut des items côté Bridge pour faire disparaître
  // la bannière sans attendre l'expiration du cache.
  useEffect(() => {
    if (refreshedAfterCallback.current || !workspaceId) return;
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("banking_success=true")
    ) {
      refreshedAfterCallback.current = true;
      refreshStatus({ refresh: true });
    }
  }, [workspaceId, refreshStatus]);

  const items = itemsNeedingAction || [];
  const count = items.length;
  if (count === 0) {
    return null;
  }

  // La liste peut rétrécir après un refresh : rester dans les bornes
  const safeIndex = Math.min(index, count - 1);
  const current = items[safeIndex];
  const bankLabel = current.bankName || "cette banque";

  return (
    <Callout type="danger" noMargin>
      <div className="flex flex-col items-start gap-3">
        <div>
          <p className="font-medium">
            {count > 1
              ? `${count} connexions bancaires ont expiré`
              : current.bankName
                ? `La connexion à ${current.bankName} a expiré`
                : "Une connexion bancaire a expiré"}
          </p>
          <p className="text-sm opacity-80">
            Votre banque demande une revalidation de sécurité tous les 6 mois.
            Vos transactions ne sont plus synchronisées. Vos comptes et votre
            historique seront conservés.
            {count > 1 && " Reconnectez chaque banque l'une après l'autre."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {count > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Banque précédente"
                onClick={() => setIndex((safeIndex - 1 + count) % count)}
                className="rounded-md p-1 transition-colors hover:bg-red-500/10"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-medium tabular-nums">
                {current.bankName || "Banque"} ({safeIndex + 1}/{count})
              </span>
              <button
                type="button"
                aria-label="Banque suivante"
                onClick={() => setIndex((safeIndex + 1) % count)}
                className="rounded-md p-1 transition-colors hover:bg-red-500/10"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
          <Button
            size="sm"
            variant="destructive"
            disabled={isLoading}
            onClick={() => reconnectBank(current.itemId)}
          >
            {isLoading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {count > 1 ? `Reconnecter ${bankLabel}` : "Reconnecter ma banque"}
          </Button>
        </div>
      </div>
    </Callout>
  );
}
