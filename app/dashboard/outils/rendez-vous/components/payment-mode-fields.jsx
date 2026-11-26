"use client";

import { CalendarCheck, CreditCard, Info, WalletCards } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";
import { eurosToCents, formatCents } from "@/src/utils/booking-events";

export const PROVIDER_NAMES = {
  stripe: "Stripe",
  paypal: "PayPal",
  sumup: "SumUp",
  bank_transfer: "virement",
};

// Textes du mode de paiement : événement (par place) ou créneau
const MODE_OPTIONS = {
  event: [
    {
      value: "ONLINE",
      title: "En ligne à l'inscription",
      text: "Le participant paie tout en réservant",
      Icon: CreditCard,
    },
    {
      value: "DEPOSIT",
      title: "Acompte en ligne, le reste sur place",
      text: "Un acompte à la réservation, le solde le jour J",
      Icon: WalletCards,
    },
    {
      value: "ON_SITE",
      title: "Sur place, le jour de l'événement",
      text: "Inscription confirmée sans paiement en ligne",
      Icon: CalendarCheck,
    },
  ],
  slot: [
    {
      value: "ONLINE",
      title: "En ligne à la réservation",
      text: "L'invité paie tout en réservant son créneau",
      Icon: CreditCard,
    },
    {
      value: "DEPOSIT",
      title: "Acompte en ligne, le reste sur place",
      text: "Un acompte à la réservation, le solde au rendez-vous",
      Icon: WalletCards,
    },
    {
      value: "ON_SITE",
      title: "Sur place, au rendez-vous",
      text: "Rendez-vous confirmé sans paiement en ligne",
      Icon: CalendarCheck,
    },
  ],
};

/** « Stripe, PayPal et virement » : moyens connectés, dans l'ordre reçu. */
export function connectedMethodsLabel(methods) {
  const names = (methods || []).map(
    (method) => PROVIDER_NAMES[method] || method,
  );
  if (names.length <= 1) return names[0] || "";
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

/**
 * Mode de paiement d'un type payant (en ligne, acompte, sur place), acompte
 * et rappel des moyens connectés. `kind` : « event » (montants par place)
 * ou « slot ». Le champ du prix reste dans chaque formulaire.
 */
export function PaymentModeFields({
  kind = "event",
  idPrefix,
  form,
  set,
  errors = {},
  methods = [],
  methodsLoaded = false,
}) {
  const perSeat = kind === "event";
  const cents = eurosToCents(form.priceText);
  const isPaid = cents > 0;
  if (!isPaid) return null;
  const paysOnline = form.paymentMode !== "ON_SITE";
  const noPaymentMethod = paysOnline && methodsLoaded && methods.length === 0;
  const depositCents = eurosToCents(form.depositText);
  const unit = perSeat ? ", par place" : "";
  const depositHint =
    depositCents > 0 && depositCents < cents
      ? `${formatCents(depositCents)} payés en ligne, ${formatCents(cents - depositCents)} sur place${unit}`
      : perSeat
        ? "Par place, payé en ligne à l'inscription"
        : "Payé en ligne à la réservation";
  const depositId = `${idPrefix}-deposit`;

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm">Paiement</p>
        <div role="radiogroup" aria-label="Paiement" className="grid gap-2">
          {MODE_OPTIONS[kind].map(({ value, title, text, Icon }) => {
            const selected = form.paymentMode === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => set("paymentMode")(value)}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                  selected
                    ? "border-[#5a50ff] bg-[#5a50ff]/5"
                    : "hover:bg-muted/50",
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    selected ? "text-[#5a50ff]" : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {text}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {form.paymentMode === "DEPOSIT" && (
          <div className="space-y-1.5 pt-2 sm:max-w-[calc(50%-0.5rem)]">
            <Label htmlFor={depositId} className="text-sm font-normal">
              {perSeat ? "Acompte par place (TTC)" : "Acompte (TTC)"}
            </Label>
            <div className="relative">
              <Input
                id={depositId}
                inputMode="decimal"
                value={form.depositText}
                onChange={(event) => set("depositText")(event.target.value)}
                placeholder="5"
                className="pr-8"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                €
              </span>
            </div>
            {errors.deposit ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.deposit}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{depositHint}</p>
            )}
          </div>
        )}
      </div>
      {!paysOnline && (
        <p className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {perSeat
              ? "Aucun moyen de paiement connecté n'est nécessaire. Vous encaissez sur place, puis marquez l'inscription réglée dans la liste des inscrits ou au contrôle des billets."
              : "Aucun moyen de paiement connecté n'est nécessaire. Vous encaissez au rendez-vous, puis le marquez réglé depuis sa fiche dans les réservations."}
          </span>
        </p>
      )}
      {paysOnline && (
        <p
          className={cn(
            "flex gap-2 rounded-lg px-3 py-2 text-xs",
            noPaymentMethod
              ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              : "bg-muted/50 text-muted-foreground",
          )}
        >
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {noPaymentMethod
              ? perSeat
                ? "Connectez Stripe, PayPal ou SumUp (Paramètres > Applications), ou renseignez votre IBAN, pour vendre des billets."
                : "Connectez Stripe, PayPal ou SumUp (Paramètres > Applications), ou renseignez votre IBAN, pour encaisser en ligne."
              : methods.length > 0
                ? `Paiement encaissé directement sur votre compte (${connectedMethodsLabel(methods)}), sans commission Newbi.`
                : "Paiement encaissé directement sur votre compte, sans commission Newbi."}
          </span>
        </p>
      )}
    </>
  );
}
