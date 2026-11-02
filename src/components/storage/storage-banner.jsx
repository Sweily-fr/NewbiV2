"use client";

import { HardDrive } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useWorkspaceStorage } from "@/src/hooks/useWorkspaceStorage";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { formatStorageBytes } from "@/src/lib/storage-plans";

/**
 * Bandeau d'alerte du stockage de l'espace : à 80 % (presque plein) et à
 * 100 % (nouveaux envois refusés). Le bouton ouvre Paramètres > Stockage.
 */
export function StorageBanner({ onOpenStorage }) {
  const { storage } = useWorkspaceStorage();
  const { can, isReady } = useMyPermissions();
  if (!storage?.ready || storage.level === "ok") return null;
  const canViewBilling = isReady && can("billing", "read");
  const full = storage.level === "full";

  const message = full
    ? `Espace de stockage plein (${formatStorageBytes(storage.usedBytes)} sur ${formatStorageBytes(storage.quotaBytes)}) : les nouveaux envois de fichiers sont refusés. Vos fichiers restent disponibles.`
    : `Espace de stockage utilisé à ${Math.floor(storage.percent)} % (${formatStorageBytes(storage.usedBytes)} sur ${formatStorageBytes(storage.quotaBytes)}).`;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="bandeau-stockage"
      className={
        full
          ? "w-full border-b border-red-200 bg-red-50 px-4 py-2 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
          : "w-full border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <HardDrive className="size-4 shrink-0" aria-hidden="true" />
          <span>
            {message}
            {!canViewBilling &&
              " Contactez la personne qui gère l'abonnement pour ajouter du stockage."}
          </span>
        </div>
        {canViewBilling && (
          <Button
            size="sm"
            variant="default"
            className="shrink-0"
            onClick={onOpenStorage}
          >
            Gérer le stockage
          </Button>
        )}
      </div>
    </div>
  );
}

export default StorageBanner;
