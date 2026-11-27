"use client";

import { CreditCard, Landmark } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  BANK_TRANSFER,
  paymentMethodDelay,
  paymentMethodLabel,
} from "@/src/utils/booking-payments";

/**
 * Choix du moyen de paiement (événement ou créneau payant) : un bouton
 * radio par moyen connecté de l'organisateur, avec le délai annoncé dessous
 * (immédiat en ligne, 3 jours de tenue pour un virement).
 */
export function PaymentMethodChoice({
  name,
  methods,
  value,
  onChange,
  kind = "event",
  disabled = false,
  // Phrase sous la liste (virement plus possible, début trop proche)
  note = null,
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-1.5 text-sm font-medium text-gray-800">
        Moyen de paiement
      </legend>
      {methods.length === 0 ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Le paiement en ligne n&apos;est pas disponible pour le moment.
          Contactez l&apos;organisateur.
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
                  {paymentMethodDelay(method, kind)}
                </span>
              </span>
            </label>
          );
        })
      )}
      {note && <p className="text-xs text-gray-500">{note}</p>}
    </fieldset>
  );
}
