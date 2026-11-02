"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useStoragePacks } from "@/src/hooks/useStoragePacks";
import {
  STORAGE_QUOTA_EVENT,
  storagePacksUnavailableMessage,
} from "@/src/lib/storage-plans";
import { StorageOffer } from "@/src/components/storage/storage-offer";

/**
 * Fenêtre affichée quand un envoi est refusé faute de place (erreur
 * STORAGE_QUOTA_EXCEEDED, relayée par le lien d'erreur Apollo) : le message
 * de l'API, puis les deux propositions avec leur prix.
 */
export function StorageQuotaDialog({ onUpgrade }) {
  const [refusal, setRefusal] = useState(null);
  const { workspaceId } = useWorkspace();
  const { can, canDo, isReady } = useMyPermissions();
  const canView = isReady && can("billing", "read");
  const canManage = isReady && canDo("billing", "manage");
  const packs = useStoragePacks(workspaceId, {
    enabled: Boolean(refusal) && canView,
  });

  useEffect(() => {
    const onRefusal = (event) => setRefusal(event.detail || {});
    window.addEventListener(STORAGE_QUOTA_EVENT, onRefusal);
    return () => window.removeEventListener(STORAGE_QUOTA_EVENT, onRefusal);
  }, []);

  const details = refusal?.details || null;
  return (
    <Dialog
      open={Boolean(refusal)}
      onOpenChange={(open) => !open && setRefusal(null)}
    >
      <DialogContent className="sm:max-w-lg" data-testid="refus-stockage">
        <DialogHeader>
          <DialogTitle>Espace de stockage plein</DialogTitle>
          <DialogDescription>{refusal?.message}</DialogDescription>
        </DialogHeader>
        {details?.offer && canView ? (
          <StorageOffer
            offer={details.offer}
            interval={details.interval}
            packsAvailable={packs.isAvailableFor(details.interval)}
            canManage={canManage}
            onSetPacks={async (quantity) => {
              await packs.setPacks(quantity);
              setRefusal(null);
            }}
            saving={packs.saving}
            onUpgrade={() => {
              setRefusal(null);
              onUpgrade?.();
            }}
            packsUnavailableMessage={storagePacksUnavailableMessage({
              loaded: packs.loaded,
              available: packs.isAvailableFor(details.interval),
            })}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Contactez la personne qui gère l&apos;abonnement de l&apos;espace
            pour ajouter du stockage.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default StorageQuotaDialog;
