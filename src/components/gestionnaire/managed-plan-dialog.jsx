"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { PLANS_DISPLAY, PRICE_QUALIFIER } from "@/src/lib/plans-display";

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const longDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

/**
 * Choix de l'offre d'un espace payé par le cabinet : mensuel ou annuel,
 * mêmes offres que dans Paramètres > Abonnement, prix remisés. Les
 * utilisateurs de l'espace au-delà de l'offre sont facturés en plus
 * (offres mensuelles).
 */
export function PlanPicker({
  plan,
  onPlanChange,
  isAnnual,
  onAnnualChange,
  discountPercent = 0,
  additionalSeats = null,
}) {
  const discount = Number(discountPercent) || 0;
  const priceOf = (p) => {
    const base = isAnnual ? p.annualMonthlyPrice : p.monthlyPrice;
    return { base, net: base * (1 - discount / 100) };
  };
  const seats = !isAnnual ? Number(additionalSeats?.[plan]) || 0 : 0;

  return (
    <>
      <div className="flex items-center justify-end gap-2 text-sm">
        <span className={cn(!isAnnual && "font-medium")}>Mensuel</span>
        <Switch
          checked={isAnnual}
          onCheckedChange={onAnnualChange}
          aria-label="Facturation annuelle"
        />
        <span className={cn(isAnnual && "font-medium")}>Annuel</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
        {PLANS_DISPLAY.map((p) => {
          const active = plan === p.key;
          const { base, net } = priceOf(p);
          return (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPlanChange(p.key)}
              className={cn(
                "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors cursor-pointer",
                active
                  ? "border-[#5b4fff] bg-[#5b4fff]/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <span className="flex items-center justify-between text-sm font-medium">
                {p.displayName}
                {active && <Check className="size-4 text-[#5b4fff]" />}
              </span>
              <span className="text-xs text-muted-foreground">
                {p.description}
              </span>
              <span className="mt-2 text-lg font-medium">
                {euros.format(net)}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  / mois {PRICE_QUALIFIER}
                </span>
              </span>
              {discount > 0 && (
                <span className="text-xs text-muted-foreground line-through">
                  {euros.format(base)}
                </span>
              )}
              {isAnnual && (
                <span className="text-xs text-muted-foreground">
                  soit {euros.format(net * 12)} par an
                </span>
              )}
            </button>
          );
        })}
      </div>

      {seats > 0 && (
        <p className="text-xs text-muted-foreground">
          L&apos;espace compte {seats}{" "}
          {seats > 1
            ? "utilisateurs de plus que ceux inclus dans cette offre : ils sont facturés"
            : "utilisateur de plus que ceux inclus dans cette offre : il est facturé"}{" "}
          en plus, au tarif des utilisateurs supplémentaires.
        </p>
      )}
    </>
  );
}

/**
 * Le cabinet choisit l'offre d'un espace qu'il paie : mêmes offres que dans
 * Paramètres > Abonnement, prix remisés. Pendant l'essai, rien n'est
 * prélevé avant sa fin.
 */
export default function ManagedPlanDialog({
  client,
  discountPercent = 0,
  open,
  onOpenChange,
}) {
  const router = useRouter();
  const [plan, setPlan] = useState("pme");
  const [isAnnual, setIsAnnual] = useState(false);
  const [pending, setPending] = useState(false);
  const [additionalSeats, setAdditionalSeats] = useState(null);

  // Utilisateurs au-delà de l'offre, facturés en plus au cabinet
  useEffect(() => {
    if (!open || !client?.id) return;
    let cancelled = false;
    fetch(`/api/gestionnaire/clients/${client.id}/payeur`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setAdditionalSeats(data?.preview?.additionalSeats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, client?.id]);

  const trialEndsAt =
    client?.access?.type === "trial" ? client.access.endsAt : null;
  const discount = Number(discountPercent) || 0;

  const submit = async () => {
    if (pending || !client) return;
    setPending(true);
    try {
      const response = await fetch(
        `/api/gestionnaire/clients/${client.id}/abonnement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, isAnnual }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || "L'abonnement n'a pas pu être créé.");
        setPending(false);
        return;
      }
      if (data.status === "redirect" && data.url) {
        window.location.assign(data.url);
        return;
      }
      if (data.status !== "active") {
        // Banque qui demande une validation, sans page pour la faire ici
        toast.warning(
          `Paiement à valider auprès de votre banque pour ${client.name}. Suivez-le dans Paramètres > Dépenses clients.`,
        );
        setPending(false);
        onOpenChange(false);
        router.refresh();
        return;
      }
      toast.success(
        trialEndsAt
          ? `Offre enregistrée pour ${client.name}. Premier prélèvement le ${longDate.format(new Date(trialEndsAt))}.`
          : `Abonnement de ${client.name} activé.`,
      );
      setPending(false);
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Le serveur ne répond pas, réessayez.");
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !pending && onOpenChange(value)}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Choisir l&apos;offre de {client?.name}</DialogTitle>
          <DialogDescription>
            {trialEndsAt
              ? `Aucun prélèvement avant la fin de son essai, le ${longDate.format(new Date(trialEndsAt))}.`
              : "L'abonnement démarre tout de suite."}{" "}
            L&apos;abonnement est facturé à votre cabinet
            {discount > 0 ? `, avec votre remise de ${discount} %.` : "."}
          </DialogDescription>
        </DialogHeader>

        <PlanPicker
          plan={plan}
          onPlanChange={setPlan}
          isAnnual={isAnnual}
          onAnnualChange={setIsAnnual}
          discountPercent={discount}
          additionalSeats={additionalSeats}
        />

        <p className="text-xs text-muted-foreground">
          La première fois, vous enregistrez votre carte sur la page de paiement
          sécurisée Stripe. Ensuite, elle est utilisée directement.
          {trialEndsAt &&
            new Date(trialEndsAt).getTime() - Date.now() < 2 * 86_400_000 &&
            " L'essai se termine dans moins de 2 jours : sans carte déjà enregistrée, le premier prélèvement a lieu dès la validation."}
        </p>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            Valider l&apos;offre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
