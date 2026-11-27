"use client";

import { CreditCard, Landmark } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  BANK_TRANSFER,
  noPaymentMethodMessage,
  paymentMethodDelay,
  paymentMethodLabel,
} from "@/src/utils/booking-payments";

/**
 * Choix du moyen de paiement (événement ou créneau payant) : un bouton
 * radio par moyen connecté de l'organisateur, avec le délai annoncé dessous
 * (immédiat en ligne ; virement : garde jusqu'à min(3 jours, début) et
 * virement instantané conseillé quand le début est proche). Aucun moyen
 * prêt : message à la place de la liste (le bouton est retiré).
 */
export function PaymentMethodChoice({
  name,
  methods,
  value,
  onChange,
  kind = "event",
  disabled = false,
  // Début du créneau ou de l'événement : fin de la garde d'un virement
  startAt = null,
  timeZone,
  // Aucun moyen prêt : message avec le nom de l'organisateur
  organizerName = "",
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-1.5 text-sm font-medium text-gray-800">
        Moyen de paiement
      </legend>
      {methods.length === 0 ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {noPaymentMethodMessage(organizerName)}
        </p>
      ) : (
        methods.map((method) => {
          const delayId = `${name}-${method}-delai`;
          return (
            <label
              key={method}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                value === method
                  ? "border-[var(--rdv-accent)] bg-[color-mix(in_srgb,var(--rdv-accent)_6%,transparent)]"
                  : "border-gray-200 hover:bg-gray-50",
              )}
            >
              <input
                type="radio"
                name={name}
                value={method}
                checked={value === method}
                onChange={() => onChange(method)}
                aria-describedby={delayId}
                className="mt-1 accent-[var(--rdv-accent)]"
              />
              <span className="min-w-0">
                {method === "paypal" ? (
                  <span className="font-semibold text-[#003087]">PayPal</span>
                ) : (
                  <span className="flex items-center gap-2 text-gray-800">
                    {method === BANK_TRANSFER ? (
                      <Landmark className="size-4" aria-hidden="true" />
                    ) : (
                      <CreditCard className="size-4" aria-hidden="true" />
                    )}
                    {paymentMethodLabel(method, methods)}
                  </span>
                )}
                <span
                  id={delayId}
                  className="mt-0.5 block text-xs text-gray-500"
                >
                  {paymentMethodDelay(method, kind, {
                    startAt,
                    ...(timeZone ? { timeZone } : {}),
                  })}
                </span>
              </span>
            </label>
          );
        })
      )}
    </fieldset>
  );
}
