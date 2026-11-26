import QRCode from "react-qr-code";
import { CalendarDays, Globe, MapPin, Ticket, Users } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { timeZoneLabel } from "@/src/utils/booking";
import {
  checkInDateLabel,
  eventPriceLabel,
  eventScheduleLabel,
  seatsLeftLabel,
} from "@/src/utils/booking-events";
import { OrganizerAvatar } from "./booking-shell";

/** Bandeau du haut : image de fond de l'événement, sinon dégradé d'accent. */
export function EventCover({ src, className }) {
  return (
    <div
      className={cn(
        "relative h-36 w-full overflow-hidden bg-[color-mix(in_srgb,var(--rdv-accent)_18%,white)] sm:h-52",
        className,
      )}
    >
      {src ? (
        // Image R2 d'un domaine quelconque : simple balise
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <div className="size-full bg-gradient-to-br from-[color-mix(in_srgb,var(--rdv-accent)_35%,white)] to-[color-mix(in_srgb,var(--rdv-accent)_8%,white)]" />
      )}
    </div>
  );
}

/** Date et heure dans le fuseau de la page, et dans celui de l'invité s'il diffère. */
export function EventSchedule({ startAt, endAt, pageTimeZone, guestTimeZone }) {
  const schedule = eventScheduleLabel(startAt, endAt, pageTimeZone);
  const guest =
    guestTimeZone && guestTimeZone !== pageTimeZone
      ? eventScheduleLabel(startAt, endAt, guestTimeZone)
      : null;
  return (
    <div className="flex items-start gap-2.5">
      <CalendarDays
        className="mt-0.5 size-4 shrink-0 text-gray-400"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-medium text-gray-900">{schedule.date}</p>
        <p className="text-gray-600 tabular-nums">
          {schedule.time} · {timeZoneLabel(pageTimeZone, startAt)}
        </p>
        {guest && (
          <p className="mt-1 text-xs text-gray-500 tabular-nums">
            Chez vous : {guest.date}, {guest.time} (
            {timeZoneLabel(guestTimeZone, startAt)})
          </p>
        )}
      </div>
    </div>
  );
}

/** Lieu : adresse (avec lien de carte) ou « En ligne ». */
export function EventLocation({ locationKind, address, label, link }) {
  const online = locationKind === "CUSTOM_LINK";
  const Icon = online ? Globe : MapPin;
  const text = online ? label || "En ligne" : address || label;
  if (!text) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-gray-400"
        aria-hidden="true"
      />
      <div className="min-w-0 break-words text-gray-700">
        {!online && address ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            {address}
          </a>
        ) : (
          text
        )}
        {online && link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block font-medium break-all text-[var(--rdv-accent-ink)] underline-offset-2 hover:underline"
          >
            Rejoindre l&apos;événement
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Informations d'un événement : organisateur, image, titre, date, lieu,
 * places restantes, prix, description et détails (texte, jamais du HTML).
 */
export function EventInfo({ page, type, guestTimeZone }) {
  const event = type.event;
  const seats = seatsLeftLabel(event.seatsLeft);
  const name = page.organizationName || page.title;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <OrganizerAvatar
          src={page.avatarUrl}
          name={name}
          accentColor={page.accentColor}
          size={40}
        />
        <p className="min-w-0 truncate text-sm text-gray-500">{name}</p>
      </div>

      {event.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.imageUrl}
          alt={`Visuel de l'événement ${type.name}`}
          className="aspect-[4/3] w-full rounded-2xl border border-gray-100 object-cover"
        />
      )}

      <h1 className="text-2xl leading-tight font-semibold text-balance text-gray-900 sm:text-3xl">
        {type.name}
      </h1>

      <div className="space-y-3 text-sm">
        <EventSchedule
          startAt={event.startAt}
          endAt={event.endAt}
          pageTimeZone={page.timezone}
          guestTimeZone={guestTimeZone}
        />
        <EventLocation
          locationKind={type.locationKind}
          address={event.address}
          label={type.locationLabel}
        />
        <div className="flex items-center gap-2.5 text-gray-700">
          <Ticket
            className="size-4 shrink-0 text-gray-400"
            aria-hidden="true"
          />
          <span className="font-medium text-gray-900">
            {eventPriceLabel(event.price)}
          </span>
          {event.price?.amount > 0 && (
            <span className="text-gray-500">par place, TTC</span>
          )}
        </div>
        {seats && (
          <div className="flex items-center gap-2.5 text-gray-700">
            <Users
              className="size-4 shrink-0 text-gray-400"
              aria-hidden="true"
            />
            <span
              className={cn(
                event.seatsLeft === 0 && "font-medium text-red-600",
                event.seatsLeft > 0 && event.seatsLeft <= 5 && "text-amber-700",
              )}
            >
              {seats}
            </span>
          </div>
        )}
      </div>

      {type.description && (
        <p className="text-base leading-relaxed whitespace-pre-line text-gray-700">
          {type.description}
        </p>
      )}

      {event.details && (
        <section className="space-y-2 border-t border-gray-100 pt-5">
          <h2 className="text-sm font-medium text-gray-900">
            Détails de l&apos;événement
          </h2>
          <p className="text-sm leading-relaxed break-words whitespace-pre-line text-gray-600">
            {event.details}
          </p>
        </section>
      )}
    </div>
  );
}

const TICKET_STATUS = {
  VALID: { label: "Valide", className: "bg-emerald-50 text-emerald-700" },
  CHECKED_IN: { label: "Utilisé", className: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Annulé", className: "bg-red-50 text-red-700" },
  NOT_PAID: {
    label: "En attente de paiement",
    className: "bg-amber-50 text-amber-800",
  },
};

/**
 * Billet : QR code (URL du billet), numéro, nom du participant, statut.
 * `status` : VALID | CHECKED_IN | CANCELLED | NOT_PAID.
 */
export function EventTicketCard({
  ticket,
  status,
  timeZone,
  qrSize = 168,
  className,
}) {
  const effective = status || (ticket.checkedInAt ? "CHECKED_IN" : "VALID");
  const badge = TICKET_STATUS[effective] || TICKET_STATUS.VALID;
  const usable = effective === "VALID" || effective === "CHECKED_IN";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-xl bg-white p-2",
          !usable && "opacity-30 grayscale",
        )}
      >
        <QRCode
          value={ticket.url}
          size={qrSize}
          level="M"
          title={`QR code du billet ${ticket.number}`}
        />
      </div>
      <div className="space-y-0.5">
        <p className="font-mono text-base font-medium tracking-wide text-gray-900">
          {ticket.number}
        </p>
        <p className="text-sm text-gray-600">{ticket.attendeeName}</p>
      </div>
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-medium",
          badge.className,
        )}
      >
        {effective === "CHECKED_IN" && ticket.checkedInAt
          ? `Déjà utilisé ${checkInDateLabel(ticket.checkedInAt, timeZone)}`
          : badge.label}
      </span>
    </div>
  );
}
