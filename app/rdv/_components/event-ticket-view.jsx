"use client";

import { useEffect, useState } from "react";
import {
  formatCents,
  registrationDueOnSite,
  registrationPayment,
  registrationPaymentLine,
} from "@/src/utils/booking-events";
import { bookingErrorText, fetchTicket } from "../_lib/booking-api";
import { useGuestTimeZone } from "../_lib/use-guest-time-zone";
import { BookingCard, BookingShell, BookingUnavailable } from "./booking-shell";
import {
  EventCover,
  EventLocation,
  EventSchedule,
  EventTicketCard,
} from "./event-details";
import { RdvPageSkeleton } from "./rdv-page-skeleton";

const STATUS_NOTES = {
  CANCELLED: "Ce billet a été annulé et ne permet plus d'entrer.",
  NOT_PAID:
    "Le paiement de ce billet n'est pas confirmé : il n'est pas encore valable.",
};

/**
 * /rdv/billet/<jeton> : billet à présenter à l'entrée (QR code, numéro,
 * nom, statut). Ouvert aussi par un téléphone qui scanne le QR code.
 */
export function EventTicketView({ token }) {
  const [guestTimeZone] = useGuestTimeZone();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetchTicket(token, { signal: controller.signal })
      .then((data) => setState({ status: "ready", data }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ status: "error", error });
      });
    return () => controller.abort();
  }, [token]);

  if (state.status === "loading") {
    return <RdvPageSkeleton variant="list" />;
  }
  if (state.status === "error") {
    return (
      <BookingUnavailable
        title={
          state.error?.code === "NOT_FOUND" ? "Billet introuvable" : undefined
        }
        text={
          state.error?.code === "NOT_FOUND"
            ? "Ce billet n'existe pas. Vérifiez le lien reçu par e-mail."
            : bookingErrorText(state.error)
        }
      />
    );
  }

  const ticket = state.data;
  const event = ticket.event || {};
  // Paiement de l'inscription : à plat sur le billet, ou sous `registration`.
  // Billet valable ou utilisé = inscription confirmée ; montant total
  // reconstitué s'il n'est pas transmis
  const source = ticket.registration || ticket;
  const payment = {
    ...source,
    amount:
      source.amount ??
      (Number(source.amountOnline) || 0) +
        (Number(source.amountDueOnSite) || 0),
    currency: source.currency || event.price?.currency || "EUR",
    status: ["VALID", "CHECKED_IN"].includes(ticket.status)
      ? "CONFIRMED"
      : source.status,
  };
  const priced = registrationPayment(payment).mode !== null;
  const due =
    ticket.status === "CANCELLED" ? 0 : registrationDueOnSite(payment);
  const page = ticket.page || {};
  const eventHref =
    page.slug && ticket.typeSlug
      ? `/rdv/${encodeURIComponent(page.slug)}/${encodeURIComponent(ticket.typeSlug)}`
      : null;

  return (
    <BookingShell accentColor={page.accentColor}>
      <BookingCard className="mx-auto max-w-md">
        <EventCover src={event.coverImageUrl} className="h-28 sm:h-36" />
        <div className="space-y-5 p-5 sm:p-6">
          <div className="space-y-1 text-center">
            {page.organizationName || page.title ? (
              <p className="text-sm text-gray-500">
                {page.organizationName || page.title}
              </p>
            ) : null}
            <h1 className="text-xl leading-tight font-semibold text-balance text-gray-900">
              {event.name}
            </h1>
          </div>

          <EventTicketCard
            ticket={ticket}
            status={ticket.status}
            timeZone={event.timezone}
            qrSize={220}
            className="border-dashed"
          />

          {STATUS_NOTES[ticket.status] && (
            <p
              role="status"
              className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700"
            >
              {STATUS_NOTES[ticket.status]}
            </p>
          )}

          {due > 0 && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-base font-medium text-amber-900">
              Reste à régler sur place :{" "}
              <span className="whitespace-nowrap">
                {formatCents(due, payment.currency)}
              </span>
            </p>
          )}

          {priced && due === 0 && (
            <p className="text-center text-sm text-gray-600">
              {registrationPaymentLine(payment)}
            </p>
          )}

          <div className="space-y-3 border-t border-gray-100 pt-4 text-sm">
            <EventSchedule
              startAt={event.startAt}
              endAt={event.endAt}
              pageTimeZone={event.timezone}
              guestTimeZone={guestTimeZone}
            />
            <EventLocation
              locationKind={event.locationKind}
              address={event.address}
              label={event.locationLabel}
              link={event.link}
            />
          </div>

          <p className="text-center text-xs text-gray-400">
            Présentez ce QR code à l&apos;entrée. Il n&apos;est valable
            qu&apos;une fois.
          </p>
          {eventHref && (
            <p className="text-center text-sm">
              <a
                href={eventHref}
                className="font-medium text-[var(--rdv-accent-ink)] underline-offset-2 hover:underline"
              >
                Voir la page de l&apos;événement
              </a>
            </p>
          )}
        </div>
      </BookingCard>
    </BookingShell>
  );
}
