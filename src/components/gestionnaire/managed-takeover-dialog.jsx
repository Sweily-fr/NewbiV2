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
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { PLANS_DISPLAY } from "@/src/lib/plans-display";
import { PlanPicker } from "./managed-plan-dialog";
import { euros, payerChangeMessage } from "./payer-change-messages";

const longDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Paris",
      })
    : "";
const planName = (key) =>
  PLANS_DISPLAY.find((p) => p.key === key)?.displayName || key;
const UNPAID = ["past_due", "unpaid", "incomplete"];

function TimingOption({ value, selected, onSelect, title, children }) {
  const active = selected === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onSelect(value)}
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors cursor-pointer",
        active
          ? "border-[#5b4fff] bg-[#5b4fff]/5"
          : "border-border hover:bg-muted/50",
      )}
    >
      <span className="flex items-center justify-between text-sm font-medium">
        {title}
        {active && <Check className="size-4 text-[#5b4fff]" />}
      </span>
      <span className="text-xs text-muted-foreground">{children}</span>
    </button>
  );
}

/**
 * « Prendre en charge l'abonnement » d'un client qui le payait (ou qui n'en
 * avait pas) : le cabinet choisit l'offre et, si le client a une période
 * payée en cours, quand il prend le relais (tout de suite avec
 * remboursement du client au prorata, ou à son échéance). Directe : le
 * client est prévenu par e-mail.
 */
export default function ManagedTakeoverDialog({
  client,
  discountPercent = 0,
  open,
  onOpenChange,
}) {
  const router = useRouter();
  const [preview, setPreview] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [plan, setPlan] = useState("pme");
  const [isAnnual, setIsAnnual] = useState(false);
  const [timing, setTiming] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open || !client?.id) return;
    let cancelled = false;
    setPreview(null);
    setLoadError(null);
    setTiming(null);
    fetch(`/api/gestionnaire/clients/${client.id}/payeur`)
      .then((response) =>
        response.json().then((data) => ({ ok: response.ok, data })),
      )
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok || !data.preview) {
          setLoadError(data.error || "Impossible de préparer la reprise.");
          return;
        }
        const current = data.preview.client || data.preview.cabinet;
        if (PLANS_DISPLAY.some((p) => p.key === current?.plan)) {
          setPlan(current.plan);
        }
        if (current) setIsAnnual(current.interval === "year");
        setPreview(data.preview);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Le serveur ne répond pas, réessayez.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, client?.id]);

  const name = preview?.name || client?.name || "ce client";
  const current = preview?.client || null;
  const discount = Number(preview?.discountPercent ?? discountPercent) || 0;
  const paidPeriod = current?.status === "active";
  const unpaid = UNPAID.includes(current?.status);
  const resume = preview?.action === "resume";
  const blocked = preview?.action === "blocked";
  const canSubmit =
    Boolean(preview) && !blocked && (!paidPeriod || Boolean(timing));

  let summary = null;
  if (resume) {
    summary = `Vous aviez arrêté de payer l'abonnement de ${name}${preview.cabinet?.periodEnd ? ` à partir du ${longDate(preview.cabinet.periodEnd)}` : ""}. Votre abonnement continue, avec la même offre.`;
  } else if (blocked) {
    summary =
      preview.reason === "granted"
        ? "Cet espace a un abonnement offert par Newbi : il n'y a rien à reprendre."
        : "L'abonnement de cet espace est encore payé par un autre cabinet jusqu'à la fin de sa période.";
  } else if (preview && !current) {
    summary = preview.trialEndsAt
      ? `${name} est en essai jusqu'au ${longDate(preview.trialEndsAt)} : vous ne paierez rien avant cette date.`
      : `${name} n'a pas d'abonnement en cours : vous payez dès aujourd'hui et son espace retrouve l'accès complet.`;
  } else if (current?.status === "trialing") {
    summary = `${name} a choisi l'offre ${planName(current.plan)} pour la fin de son essai, le ${longDate(current.trialEnd)}. Elle est annulée : vous paierez à partir de cette date, rien ne lui sera prélevé.`;
  } else if (paidPeriod) {
    summary = `${name} paie aujourd'hui l'offre ${planName(current.plan)} (${current.interval === "year" ? "annuelle" : "mensuelle"}), jusqu'au ${longDate(current.periodEnd)}. Choisissez quand vous prenez le relais.`;
  } else if (unpaid) {
    summary = `Le dernier paiement de ${name} n'est pas passé : vous prenez le relais tout de suite et sa facture en attente est annulée.`;
  }

  const submit = async () => {
    if (pending || !canSubmit) return;
    setPending(true);
    try {
      const response = await fetch(
        `/api/gestionnaire/clients/${client.id}/payeur`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payer: "manager",
            plan: resume ? preview.cabinet?.plan || plan : plan,
            isAnnual,
            ...(paidPeriod ? { timing } : {}),
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || "La prise en charge n'a pas pu être faite.");
        setPending(false);
        return;
      }
      if (data.status === "redirect" && data.url) {
        window.location.assign(data.url);
        return;
      }
      if (data.status === "active") {
        const message = payerChangeMessage(name, data);
        toast[message.tone](message.text);
      } else {
        toast.warning(
          `Paiement à valider auprès de votre banque. La reprise de l'abonnement de ${name} se termine dès sa validation.`,
        );
      }
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
          <DialogTitle>
            {resume
              ? `Continuer de payer l'abonnement de ${name}`
              : `Prendre en charge l'abonnement de ${name}`}
          </DialogTitle>
          <DialogDescription>
            {summary ||
              (loadError ? loadError : "Chargement de son abonnement...")}
          </DialogDescription>
        </DialogHeader>

        {!preview && !loadError && (
          <div className="flex justify-center py-6">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {paidPeriod && (
          <div
            className="grid gap-2 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Quand prendre le relais"
          >
            <TimingOption
              value="now"
              selected={timing}
              onSelect={setTiming}
              title="Tout de suite"
            >
              Vous payez dès aujourd&apos;hui.{" "}
              {current.refundNow > 0
                ? `Votre client est remboursé de ${euros(current.refundNow)} pour la période non utilisée.`
                : "Rien à rembourser à votre client."}
            </TimingOption>
            <TimingOption
              value="renewal"
              selected={timing}
              onSelect={setTiming}
              title={`À son échéance, le ${longDate(current.periodEnd)}`}
            >
              {current.renewalChargesNow
                ? "L'échéance est dans moins de 2 jours : sans carte déjà enregistrée, vous payez dès la validation et votre client est remboursé du reste."
                : "Votre client a déjà payé jusque-là : votre premier prélèvement aura lieu à cette date."}
            </TimingOption>
          </div>
        )}

        {preview && !resume && !blocked && (
          <PlanPicker
            plan={plan}
            onPlanChange={setPlan}
            isAnnual={isAnnual}
            onAnnualChange={setIsAnnual}
            discountPercent={discount}
            additionalSeats={preview.additionalSeats}
          />
        )}

        {preview && !blocked && (
          <p className="text-xs text-muted-foreground">
            {resume
              ? "Votre client est prévenu par e-mail."
              : `L'abonnement est facturé à votre cabinet${discount > 0 ? `, avec votre remise de ${discount} %` : ""}. Votre client est prévenu par e-mail, il n'a rien à faire.`}{" "}
            {!resume &&
              (preview.hasSavedCard
                ? "Votre carte enregistrée est utilisée."
                : "Vous enregistrez votre carte sur la page de paiement sécurisée Stripe.")}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {blocked ? "Fermer" : "Annuler"}
          </Button>
          {!blocked && (
            <Button
              variant="primary"
              onClick={submit}
              disabled={pending || !canSubmit}
            >
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {resume ? "Continuer de payer" : "Prendre en charge"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
