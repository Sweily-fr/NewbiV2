"use client";

import { Loader2 } from "lucide-react";
import { Separator } from "@/src/components/ui/separator";
import { Progress } from "@/src/components/ui/progress";
import { Button } from "@/src/components/ui/button";
import { Callout } from "@/src/components/ui/callout";
import { toast } from "@/src/components/ui/sonner";
import { useWorkspaceStorage } from "@/src/hooks/useWorkspaceStorage";
import { useStoragePacks } from "@/src/hooks/useStoragePacks";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import {
  formatStorageBytes,
  packPriceLabel,
  STORAGE_PACK_GB,
} from "@/src/lib/storage-plans";
import { StorageOffer } from "@/src/components/storage/storage-offer";

function UsageRow({ label, bytes, total }) {
  const percent = total > 0 ? Math.min(100, (bytes / total) * 100) : 0;
  return (
    <li className="flex items-center gap-3 py-1.5 text-sm">
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="hidden w-32 sm:block">
        <Progress value={percent} className="h-1.5" />
      </span>
      <span className="w-20 shrink-0 text-right tabular-nums text-muted-foreground">
        {formatStorageBytes(bytes)}
      </span>
    </li>
  );
}

/**
 * Paramètres > Stockage : espace utilisé de l'organisation, quota de l'offre
 * et packs, détail par type de fichier et par personne qui a déposé.
 * Le détail et les achats sont réservés aux rôles qui voient l'abonnement ;
 * les autres membres voient l'état seulement.
 */
export function StorageSection({ onTabChange }) {
  const { storage, loading, workspaceId } = useWorkspaceStorage({
    poll: true,
  });
  const { canDo, isReady } = useMyPermissions();
  const canManage = isReady && canDo("billing", "manage");
  const details = Boolean(storage?.canViewDetails);
  const packs = useStoragePacks(workspaceId, { enabled: details });
  const packsAvailable = packs.isAvailableFor(storage?.interval);

  const header = (
    <div>
      <h2 className="text-lg font-medium mb-1 hidden md:block">Stockage</h2>
      <p className="text-sm text-muted-foreground mb-4 hidden md:block">
        Espace utilisé par tous les fichiers de l&apos;organisation.
      </p>
      <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
    </div>
  );

  if (loading || !storage || !storage.ready) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Calcul de l&apos;espace utilisé en cours…
        </div>
      </div>
    );
  }

  const percent = Math.min(100, storage.percent || 0);
  const removePack = async () => {
    try {
      await packs.setPacks(storage.packs - 1);
      toast.success("Pack de stockage retiré.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6" data-testid="parametres-stockage">
      {header}

      <section className="space-y-3">
        <p className="text-sm" data-testid="stockage-resume">
          <strong>{formatStorageBytes(storage.usedBytes)}</strong> utilisés sur{" "}
          <strong>{formatStorageBytes(storage.quotaBytes)}</strong>, il vous
          reste <strong>{formatStorageBytes(storage.remainingBytes)}</strong>.
        </p>
        <Progress
          value={percent}
          aria-label="Espace de stockage utilisé"
          className={
            storage.level === "full"
              ? "[&>[data-slot=progress-indicator]]:bg-red-600"
              : storage.level === "warning"
                ? "[&>[data-slot=progress-indicator]]:bg-amber-500"
                : ""
          }
        />
        <p className="text-xs text-muted-foreground">
          Offre {storage.planLabel} :{" "}
          {formatStorageBytes(storage.baseQuotaBytes)}
          {storage.packs > 0 &&
            ` + ${storage.packs} pack${storage.packs > 1 ? "s" : ""} de ${STORAGE_PACK_GB} Go`}
          .
        </p>
        {storage.level === "full" && (
          <Callout type="danger" noMargin>
            <p>
              L&apos;espace de stockage est plein : les nouveaux envois de
              fichiers sont refusés. Vos fichiers existants restent disponibles.
            </p>
          </Callout>
        )}
        {storage.level === "warning" && (
          <Callout type="warning" noMargin>
            <p>
              L&apos;espace de stockage est utilisé à plus de 80 %. Une fois la
              limite atteinte, les nouveaux envois seront refusés.
            </p>
          </Callout>
        )}
      </section>

      {!details && (
        <p className="text-sm text-muted-foreground">
          Le détail du stockage et l&apos;ajout d&apos;espace sont réservés aux
          personnes qui gèrent l&apos;abonnement.
        </p>
      )}

      {details && (
        <>
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Ajouter du stockage</h3>
            <StorageOffer
              offer={storage.offer}
              interval={storage.interval}
              packsAvailable={packsAvailable && storage.subscriptionActive}
              canManage={canManage}
              onSetPacks={packs.setPacks}
              saving={packs.saving}
              onUpgrade={
                onTabChange ? () => onTabChange("subscription") : undefined
              }
            />
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium">Packs actifs</h3>
            {storage.packs > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 p-3 text-sm dark:border-[#2c2c2c]">
                <span data-testid="stockage-packs">
                  {storage.packs} pack{storage.packs > 1 ? "s" : ""} de{" "}
                  {STORAGE_PACK_GB} Go ({formatStorageBytes(storage.packBytes)}
                  ), {packPriceLabel(storage.interval)} chacun
                </span>
                {canManage && packsAvailable && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={packs.saving}
                    onClick={removePack}
                  >
                    Retirer un pack
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun pack de stockage.
              </p>
            )}
          </section>

          <section className="space-y-1">
            <h3 className="text-sm font-medium">Par type de fichier</h3>
            {storage.byCategory?.length ? (
              <ul data-testid="stockage-par-type">
                {storage.byCategory.map((row) => (
                  <UsageRow
                    key={row.category}
                    label={row.label}
                    bytes={row.bytes}
                    total={storage.usedBytes}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun fichier pour le moment.
              </p>
            )}
          </section>

          <section className="space-y-1">
            <h3 className="text-sm font-medium">Par personne</h3>
            {storage.byUser?.length ? (
              <ul data-testid="stockage-par-personne">
                {storage.byUser.map((row) => (
                  <UsageRow
                    key={row.userId || "non-attribue"}
                    label={row.name || row.email || "Non attribué"}
                    bytes={row.bytes}
                    total={storage.usedBytes}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun fichier pour le moment.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default StorageSection;
