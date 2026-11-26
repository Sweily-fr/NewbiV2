"use client";

import { useEffect, useState } from "react";
import { Check, Landmark, Loader2 } from "lucide-react";
import { BankTransferDetails } from "@/src/components/payments/bank-transfer-details";
import { formatCents, shortDateTimeLabel } from "@/src/utils/booking-events";
import { bookingErrorText } from "../_lib/booking-api";

/**
 * Réservation ou inscription en attente d'un virement : coordonnées de
 * l'organisateur, montant exact, référence à recopier, échéance, puis
 * « J'ai fait le virement » (annonce, annulable). L'annonce prévient
 * l'organisateur mais ne confirme rien : la confirmation vient de la
 * réception du virement.
 *
 * `bankTransfer` : objet de l'API (holder, iban, bic, bankName, reference,
 * amount en centimes, currency, dueAt, declaredAt, autoDetect).
 * `onDeclare(cancel)` : Promise de { declaredAt }.
 * `kind` : « slot » (créneau) ou « event ».
 */
export function BankTransferPanel({
  bankTransfer,
  kind = "event",
  organizerName,
  timeZone,
  onDeclare,
}) {
  const [declaredAt, setDeclaredAt] = useState(
    bankTransfer?.declaredAt || null,
  );
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setDeclaredAt(bankTransfer?.declaredAt || null);
  }, [bankTransfer?.declaredAt]);

  if (!bankTransfer) return null;
  const organizer = organizerName || "L'organisateur";
  const amount = formatCents(bankTransfer.amount, bankTransfer.currency);
  const due = shortDateTimeLabel(bankTransfer.dueAt, timeZone);
  const held =
    kind === "slot"
      ? `Le créneau vous est gardé jusqu'au ${due}.`
      : `Vos places sont gardées jusqu'au ${due}.`;
  const confirmation = bankTransfer.autoDetect
    ? kind === "slot"
      ? "Le rendez-vous est confirmé automatiquement dès que le virement arrive, grâce à la référence."
      : "L'inscription est confirmée automatiquement dès que le virement arrive, grâce à la référence."
    : kind === "slot"
      ? `${organizer} confirme le rendez-vous dès réception du virement.`
      : `${organizer} confirme l'inscription dès réception du virement.`;

  const run = async (cancel) => {
    if (busy || !onDeclare) return;
    setBusy(cancel ? "cancel" : "declare");
    setError("");
    try {
      const result = await onDeclare(cancel);
      setDeclaredAt(result?.declaredAt || null);
    } catch (declareError) {
      setError(
        declareError?.code === "NOT_ALLOWED"
          ? "Cette réservation n'attend plus de virement. Rechargez la page."
          : bookingErrorText(declareError),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="rounded-2xl bg-[color-mix(in_srgb,var(--rdv-accent)_8%,transparent)] px-4 py-4 text-center">
        <Landmark
          className="mx-auto size-5 text-[var(--rdv-accent-ink)]"
          aria-hidden="true"
        />
        <p className="mt-2 text-sm text-gray-600">Montant à virer</p>
        <p className="text-2xl font-semibold text-gray-900 tabular-nums">
          {amount}
        </p>
        <p className="mt-2 text-sm text-gray-600">{held}</p>
        <p className="mt-1 text-sm text-gray-600">{confirmation}</p>
      </div>

      <BankTransferDetails
        details={bankTransfer}
        amount={(Number(bankTransfer.amount) || 0) / 100}
        formattedAmount={amount}
        copyClass="hover:text-[var(--rdv-accent-ink)]"
      />

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {declaredAt ? (
        <div className="space-y-2 text-center">
          <p
            role="status"
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700"
          >
            <Check
              className="size-4 shrink-0 text-[var(--rdv-accent-ink)]"
              aria-hidden="true"
            />
            Virement annoncé le {shortDateTimeLabel(declaredAt, timeZone)}. En
            attente de réception.
          </p>
          <button
            type="button"
            onClick={() => run(true)}
            disabled={Boolean(busy)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-500 underline underline-offset-2 hover:text-gray-800 disabled:cursor-default disabled:opacity-60"
          >
            {busy === "cancel" && (
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            )}
            Je n&apos;ai pas encore fait le virement
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => run(false)}
            disabled={Boolean(busy)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--rdv-accent)] px-6 py-3 text-base font-medium text-[var(--rdv-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60 sm:text-sm"
          >
            {busy === "declare" && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            J&apos;ai fait le virement
          </button>
          <p className="text-center text-xs text-gray-500">
            {organizerName || "L'organisateur"} est prévenu. Rien n&apos;est
            confirmé avant la réception du virement.
          </p>
        </div>
      )}
    </div>
  );
}
