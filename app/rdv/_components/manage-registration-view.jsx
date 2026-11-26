"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  shortDateTimeLabel,
  unconfirmedRegistrationMessage,
} from "@/src/utils/booking-events";
import {
  bookingErrorText,
  cancelEventRegistration,
  fetchEventRegistration,
} from "../_lib/booking-api";
import { useGuestTimeZone } from "../_lib/use-guest-time-zone";
import { BookingCard, BookingShell, BookingUnavailable } from "./booking-shell";
import { EventConfirmation, RegistrationSummary } from "./event-confirmation";
import { RdvPageSkeleton } from "./rdv-page-skeleton";

const HEADINGS = {
  PENDING_PAYMENT: "Paiement en attente",
  CANCELLED: "Inscription annulée",
  EXPIRED: "Inscription expirée",
};

/** Annulation par le participant (inscription gratuite, avant le début). */
function CancelRegistration({ token, onCancelled }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await cancelEventRegistration(token, reason);
      onCancelled();
    } catch (cancelError) {
      setError(
        cancelError?.code === "NOT_ALLOWED"
          ? "Cette inscription ne peut plus être annulée en ligne. Contactez l'organisateur."
          : bookingErrorText(cancelError),
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <p className="text-center text-sm text-gray-500">
        Vous ne pourrez pas venir ?{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer font-medium text-[var(--rdv-accent-ink)] underline underline-offset-2"
        >
          Annuler mon inscription
        </button>
      </p>
    );
  }
  return (
    <div className="mx-auto max-w-xl space-y-3 rounded-2xl border border-gray-200 p-5 text-left">
      <p className="text-sm font-medium text-gray-900">
        Annuler votre inscription ?
      </p>
      <p className="text-sm text-gray-600">
        Vos billets ne seront plus valables et vos places seront libérées pour
        d&apos;autres participants.
      </p>
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Un mot pour l'organisateur (facultatif)"
        aria-label="Motif de l'annulation"
        className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-base text-gray-900 outline-none focus:border-[var(--rdv-accent)] sm:text-sm"
      />
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Garder mon inscription
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {busy && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          Confirmer l&apos;annulation
        </button>
      </div>
    </div>
  );
}

/**
 * /rdv/inscription/<jeton> : lien des e-mails du participant. Billets,
 * statut, annulation d'une inscription gratuite.
 */
export function ManageRegistrationView({ token, embed = false }) {
  const [guestTimeZone] = useGuestTimeZone();
  const [state, setState] = useState({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchEventRegistration(token, { signal: controller.signal })
      .then((data) => setState({ status: "ready", data }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ status: "error", error });
      });
    return () => controller.abort();
  }, [token, reloadKey]);

  if (state.status === "loading") {
    return <RdvPageSkeleton variant="list" embed={embed} />;
  }
  if (state.status === "error") {
    return (
      <BookingUnavailable
        embed={embed}
        title={
          state.error?.code === "NOT_FOUND"
            ? "Inscription introuvable"
            : undefined
        }
        text={
          state.error?.code === "NOT_FOUND"
            ? "Ce lien ne correspond à aucune inscription. Vérifiez l'e-mail reçu."
            : bookingErrorText(state.error)
        }
      />
    );
  }

  const registration = state.data;
  const page = registration.page || {};
  const timeZone = registration.event?.timezone;
  const confirmed = registration.status === "CONFIRMED";
  // Payée mais non confirmée : remboursée, ou à rembourser par l'organisateur
  const refundMessage = ["REFUNDED", "MANUAL"].includes(
    registration.refundStatus,
  )
    ? unconfirmedRegistrationMessage({
        registration,
        organizerName: page.organizationName || page.title,
      })
    : null;
  const eventHref =
    page.slug && registration.typeSlug
      ? `/rdv/${encodeURIComponent(page.slug)}/${encodeURIComponent(registration.typeSlug)}`
      : null;

  return (
    <BookingShell embed={embed} accentColor={page.accentColor}>
      <BookingCard className="mx-auto max-w-2xl">
        <div className="space-y-6 px-5 py-8 sm:px-10 sm:py-12">
          {confirmed ? (
            <EventConfirmation
              registration={registration}
              guestTimeZone={guestTimeZone}
              heading="Vos billets"
              showManageLink={false}
            />
          ) : (
            <div className="mx-auto max-w-xl space-y-5 text-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                {refundMessage?.title ||
                  HEADINGS[registration.status] ||
                  "Votre inscription"}
              </h1>
              <p className="text-sm text-gray-600">
                {refundMessage
                  ? refundMessage.text
                  : registration.status === "CANCELLED"
                    ? `Cette inscription a été annulée${
                        registration.cancelledAt
                          ? ` le ${shortDateTimeLabel(registration.cancelledAt, timeZone)}`
                          : ""
                      }. Ses billets ne sont plus valables.`
                    : registration.status === "PENDING_PAYMENT"
                      ? "Le paiement n'est pas encore confirmé. Vos billets vous seront envoyés par e-mail dès sa confirmation."
                      : "Le paiement n'a pas abouti à temps : les places ont été libérées et aucun billet n'a été émis."}
              </p>
              <RegistrationSummary
                registration={registration}
                guestTimeZone={guestTimeZone}
              />
              {registration.status === "EXPIRED" &&
                refundMessage?.restart !== false &&
                eventHref && (
                  <a
                    href={eventHref}
                    className="inline-flex items-center justify-center rounded-xl bg-[var(--rdv-accent)] px-5 py-2.5 text-sm font-medium text-[var(--rdv-on-accent)] hover:opacity-90"
                  >
                    Revenir à l&apos;événement
                  </a>
                )}
            </div>
          )}

          {confirmed &&
            (registration.canCancel ? (
              <CancelRegistration
                token={token}
                onCancelled={() => {
                  setState({ status: "loading" });
                  setReloadKey((key) => key + 1);
                }}
              />
            ) : (
              <p className="text-center text-sm text-gray-500">
                {registration.amount > 0
                  ? "Pour annuler, contactez l'organisateur."
                  : "L'événement a commencé : l'inscription ne peut plus être annulée."}
              </p>
            ))}
        </div>
      </BookingCard>
    </BookingShell>
  );
}
