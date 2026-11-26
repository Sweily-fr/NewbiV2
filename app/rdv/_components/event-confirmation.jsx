import { CalendarPlus, Check, Download } from "lucide-react";
import { googleCalendarUrl } from "@/src/utils/booking";
import { formatCents } from "@/src/utils/booking-events";
import { apiFileUrl } from "../_lib/booking-api";
import { EventLocation, EventSchedule, EventTicketCard } from "./event-details";

/** Lien de gestion de l'API → chemin du site (même domaine que la page). */
export function registrationPathFromUrl(manageUrl) {
  const token = String(manageUrl || "").split("/rdv/inscription/")[1];
  return token
    ? `/rdv/inscription/${token.split(/[?#]/)[0]}`
    : manageUrl || null;
}

/** Événement ajouté à l'agenda du participant. */
function calendarEvent(registration, manageUrl) {
  const event = registration.event;
  const lines = [
    event.link && `Lien : ${event.link}`,
    registration.tickets?.length
      ? `Billets : ${registration.tickets.map((t) => t.number).join(", ")}`
      : null,
    manageUrl && `Vos billets : ${manageUrl}`,
  ].filter(Boolean);
  return {
    title: event.name,
    start: event.startAt,
    end: event.endAt,
    details: lines.join("\n"),
    location: event.address || event.link || event.locationLabel || "",
  };
}

/** Récapitulatif d'un événement réservé (date, lieu, quantité, montant). */
export function RegistrationSummary({ registration, guestTimeZone }) {
  const event = registration.event;
  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 p-5 text-left text-sm">
      <p className="text-base font-medium text-gray-900">{event.name}</p>
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
      <p className="text-gray-600">
        {registration.quantity} place{registration.quantity > 1 ? "s" : ""}
        {registration.amount > 0
          ? ` · ${formatCents(registration.amount, registration.currency)} payés`
          : " · Gratuit"}
      </p>
    </div>
  );
}

/**
 * Inscription confirmée : récapitulatif, billets à QR code, ajout à
 * l'agenda et lien vers la page des billets.
 */
export function EventConfirmation({
  registration,
  manageUrl,
  guestTimeZone,
  heading = "Inscription confirmée",
  showManageLink = true,
}) {
  const managePath = registrationPathFromUrl(manageUrl);
  const ics = apiFileUrl(registration.icsUrl);
  const tickets = registration.tickets || [];
  const timeZone = registration.event?.timezone;

  return (
    <div className="mx-auto max-w-xl space-y-6 py-2 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-full bg-[var(--rdv-accent)] text-[var(--rdv-on-accent)]">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-semibold text-gray-900">{heading}</h1>
        {registration.buyer?.email && (
          <p className="text-sm text-gray-500">
            {tickets.length > 1 ? "Vos billets ont" : "Votre billet a"} été
            envoyé{tickets.length > 1 ? "s" : ""} à
            <span className="block font-medium [overflow-wrap:anywhere] text-gray-700">
              {registration.buyer.email}
            </span>
          </p>
        )}
      </div>

      <RegistrationSummary
        registration={registration}
        guestTimeZone={guestTimeZone}
      />

      {tickets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-900">
            {tickets.length > 1
              ? `Vos ${tickets.length} billets`
              : "Votre billet"}
          </h2>
          <p className="text-xs text-gray-500">
            Présentez le QR code à l&apos;entrée, sur votre téléphone ou
            imprimé.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {tickets.map((ticket) => (
              <a
                key={ticket.number}
                href={`/rdv/billet/${encodeURIComponent(ticket.token)}`}
                className="block rounded-2xl transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--rdv-accent)] focus-visible:outline-none"
                aria-label={`Ouvrir le billet ${ticket.number}`}
              >
                <EventTicketCard ticket={ticket} timeZone={timeZone} />
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <a
          href={googleCalendarUrl(calendarEvent(registration, manageUrl))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          Ajouter à Google Agenda
        </a>
        {ics && (
          <a
            href={ics}
            download="evenement.ics"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
          >
            <Download className="size-4" aria-hidden="true" />
            Télécharger (.ics)
          </a>
        )}
      </div>

      {showManageLink && managePath && (
        <p className="text-sm text-gray-500">
          Retrouvez vos billets à tout moment sur{" "}
          <a
            href={managePath}
            className="font-medium text-[var(--rdv-accent-ink)] underline underline-offset-2"
          >
            la page de votre inscription
          </a>
          .
        </p>
      )}
    </div>
  );
}
