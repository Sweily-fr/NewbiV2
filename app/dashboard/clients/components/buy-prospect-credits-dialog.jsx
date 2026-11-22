"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { Coins, Loader2, X } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";

const PRESETS = [25, 50, 100, 250];
const FIELD_LABEL = "text-xs font-medium text-muted-foreground";
const TOGGLE_ON =
  "data-[state=on]:bg-[#5a50ff]/10 data-[state=on]:text-[#5a50ff] dark:data-[state=on]:text-[#8b85ff]";

function formatAmount(cents, currency = "eur") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

const taxLabel = (behavior) =>
  behavior === "inclusive" ? " TTC" : behavior === "exclusive" ? " HT" : "";

/**
 * Achat de crédits de prospection à l'unité (offre Entreprise) : prix lu
 * chez Stripe, paiement unique sur Stripe Checkout, crédits ajoutés au
 * retour sur la page Contacts.
 */
export default function BuyProspectCreditsDialog({
  open,
  onOpenChange,
  workspaceId,
  suggested = 50,
}) {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [credits, setCredits] = useState(50);

  useEffect(() => {
    if (!open || !workspaceId) return;
    const preset = PRESETS.find((p) => p >= suggested) || PRESETS.at(-1);
    setCredits(preset);
    setLoading(true);
    let cancelled = false;
    fetch(
      `/api/billing/prospect-credits?organizationId=${encodeURIComponent(workspaceId)}`,
      { credentials: "include" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => !cancelled && setOffer(data))
      .catch(() => !cancelled && setOffer(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, workspaceId, suggested]);

  const min = offer?.min ?? 25;
  const max = offer?.max ?? 1000;
  const valid = Number.isInteger(credits) && credits >= min && credits <= max;
  const total = valid && offer?.unitAmount ? offer.unitAmount * credits : null;
  const tax = taxLabel(offer?.taxBehavior);

  const blocker = loading
    ? null
    : !offer
      ? "Les crédits ne peuvent pas être achetés pour le moment. Réessayez dans un instant."
      : !offer.planAllowsPurchase
        ? "L'achat de crédits est réservé à l'offre Entreprise."
        : !offer.available
          ? "L'achat de crédits arrive bientôt."
          : !offer.canManageBilling
            ? "Seul un membre qui gère l'abonnement de l'espace peut acheter des crédits."
            : null;

  const handlePay = async () => {
    setPaying(true);
    try {
      const response = await fetch("/api/billing/prospect-credits", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: workspaceId, credits }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        toast.error(data.error || "Le paiement n'a pas pu être ouvert.");
        setPaying(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Le paiement n'a pas pu être ouvert.");
      setPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={paying ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex max-h-[calc(100dvh-4rem)] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-[#efefef] p-1 sm:max-w-[440px] dark:bg-[#1a1a1a]"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-background ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/40 px-5 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#5a50ff]/10 text-[#5a50ff]">
                <Coins className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-sm font-medium">
                  Acheter des crédits
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Sans expiration, utilisés après les crédits du mois
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={paying}
              aria-label="Fermer"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Chargement du tarif…
              </p>
            ) : blocker ? (
              <p className="text-sm text-muted-foreground">{blocker}</p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label className={FIELD_LABEL}>Nombre de crédits</Label>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={PRESETS.includes(credits) ? String(credits) : ""}
                    onValueChange={(v) => v && setCredits(Number(v))}
                    className="w-full"
                  >
                    {PRESETS.map((p) => (
                      <ToggleGroupItem
                        key={p}
                        value={String(p)}
                        className={cn("flex-1 text-xs", TOGGLE_ON)}
                      >
                        {p}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <Input
                    id="prospect-credits-quantity"
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    value={Number.isNaN(credits) ? "" : credits}
                    onChange={(e) => setCredits(parseInt(e.target.value, 10))}
                    aria-label="Autre nombre de crédits"
                    className="tabular-nums"
                  />
                  <p className="text-xs text-muted-foreground">
                    Entre {min} et {max} crédits. 1 crédit = 1 prospect ajouté
                    ou 1 page de 25 entreprises lue.
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-[#fafafa] p-4 dark:bg-[#141414]">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Prix du crédit
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatAmount(offer.unitAmount, offer.currency)}
                      {tax}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-t border-border/40 pt-3">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {total != null
                        ? formatAmount(total, offer.currency)
                        : "–"}
                      {total != null && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {tax}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Paiement unique par carte, facture envoyée par e-mail. Les
                  crédits sont ajoutés à votre espace dès qu&apos;ils sont
                  prêts, en général sous 24 h : vous êtes prévenu par e-mail.
                </p>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/40 px-5 py-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={paying}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handlePay}
              disabled={Boolean(blocker) || loading || !valid || paying}
              className="gap-2"
            >
              {paying && <Loader2 className="h-4 w-4 animate-spin" />}
              {total != null
                ? `Payer ${formatAmount(total, offer.currency)}`
                : "Payer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
