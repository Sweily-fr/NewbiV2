"use client";

import { useEffect, useRef } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Callout } from "@/src/components/ui/callout";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useBankingConnection } from "@/src/hooks/useBankingConnection";

/**
 * Bannière affichée quand une connexion bancaire nécessite une action
 * de l'utilisateur (SCA expirée, identifiants invalides...).
 * La synchronisation des transactions est bloquée tant que la banque
 * n'a pas été reconnectée. Ne rend rien si tout est en ordre.
 */
export function BankReconnectAlert() {
  const { workspaceId } = useWorkspace();
  const { itemsNeedingAction, reconnectBank, refreshStatus, isLoading } =
    useBankingConnection(workspaceId);
  const refreshedAfterCallback = useRef(false);

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

  if (!itemsNeedingAction || itemsNeedingAction.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {itemsNeedingAction.map((item) => (
        <Callout key={item.itemId} type="danger" noMargin>
          <div className="flex flex-col items-start gap-3">
            <div>
              <p className="font-medium">
                {item.bankName
                  ? `La connexion à ${item.bankName} a expiré`
                  : "Une connexion bancaire a expiré"}
              </p>
              <p className="text-sm opacity-80">
                Votre banque demande une revalidation de sécurité tous les 6
                mois. Vos transactions ne sont plus synchronisées. Vos comptes
                et votre historique seront conservés.
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              disabled={isLoading}
              onClick={() => reconnectBank(item.itemId)}
            >
              {isLoading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Reconnecter ma banque
            </Button>
          </div>
        </Callout>
      ))}
    </div>
  );
}
