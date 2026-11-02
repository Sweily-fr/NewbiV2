"use client";

import { useState } from "react";
import { HardDrive, ArrowUpRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { toast } from "@/src/components/ui/sonner";
import { describeStorageOffer } from "@/src/lib/storage-plans";
import { openSubscriptionSettings } from "@/src/hooks/useStoragePacks";

function OfferCard({ highlighted, children, testId }) {
  return (
    <div
      data-testid={testId}
      className={`relative flex flex-col gap-2 rounded-xl border p-3 ${
        highlighted
          ? "border-[#5A50FF] bg-[#5A50FF]/5 dark:border-[#8b85ff]"
          : "border-gray-200 dark:border-[#2c2c2c]"
      }`}
    >
      {highlighted && (
        <span className="absolute right-3 top-3 rounded-md bg-[#5A50FF] px-2 py-0.5 text-[10px] font-medium text-white">
          Recommandé
        </span>
      )}
      {children}
    </div>
  );
}

/**
 * Deux propositions quand l'espace manque de place : ajouter des packs de
 * 50 Go, ou passer à l'offre supérieure. La moins chère (ou l'offre
 * supérieure si elle coûte au plus 10 % de plus) est mise en avant.
 */
export function StorageOffer({
  offer,
  interval,
  packsAvailable,
  canManage,
  onSetPacks,
  saving = false,
  onUpgrade,
  packsUnavailableMessage = null,
}) {
  const [confirming, setConfirming] = useState(false);
  const described = describeStorageOffer(offer, { packsAvailable, interval });
  const { packs, upgrade, recommended } = described;
  // Packs proposables en principe mais pas achetables (prix non configurés,
  // pas d'abonnement actif) : on le dit plutôt que de les cacher sans mot
  const unavailableNote =
    !packs && offer?.packs && packsUnavailableMessage
      ? packsUnavailableMessage
      : null;
  if (!packs && !upgrade && !unavailableNote) return null;

  const confirmPacks = async () => {
    try {
      await onSetPacks?.(packs.totalPacks);
      toast.success("Stockage ajouté à votre abonnement.");
      setConfirming(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {packs && (
        <OfferCard highlighted={recommended === "packs"} testId="offre-packs">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HardDrive className="size-4" aria-hidden="true" />
            {packs.title}
          </div>
          <p className="text-sm">{packs.price}</p>
          <p className="text-xs text-muted-foreground">{packs.total}</p>
          {canManage && (
            <Button
              size="sm"
              className="mt-auto"
              disabled={saving}
              onClick={() => setConfirming(true)}
            >
              Ajouter du stockage
            </Button>
          )}
        </OfferCard>
      )}
      {upgrade && (
        <OfferCard
          highlighted={recommended === "upgrade"}
          testId="offre-superieure"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <ArrowUpRight className="size-4" aria-hidden="true" />
            {upgrade.title}
          </div>
          <p className="text-sm">
            {upgrade.quota} de stockage, {upgrade.price}
          </p>
          {upgrade.detail && (
            <p className="text-xs text-muted-foreground">{upgrade.detail}</p>
          )}
          {canManage && (
            <Button
              size="sm"
              variant={recommended === "upgrade" ? "default" : "outline"}
              className="mt-auto"
              onClick={() =>
                onUpgrade ? onUpgrade() : openSubscriptionSettings()
              }
            >
              {upgrade.title}
            </Button>
          )}
        </OfferCard>
      )}
      {unavailableNote && (
        <p
          className="text-sm text-muted-foreground sm:col-span-2"
          data-testid="packs-indisponibles"
        >
          {unavailableNote}
        </p>
      )}
      {!canManage && (packs || upgrade) && (
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Seules les personnes qui gèrent l&apos;abonnement peuvent ajouter du
          stockage ou changer d&apos;offre.
        </p>
      )}

      {packs && (
        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{packs.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {packs.price}, ajouté à votre abonnement avec un prorata
                immédiat. {packs.total}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={saving}
                onClick={(event) => {
                  event.preventDefault();
                  confirmPacks();
                }}
              >
                Confirmer l'ajout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
