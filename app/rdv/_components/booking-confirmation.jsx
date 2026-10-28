import { CalendarPlus, Check, Download, ExternalLink } from "lucide-react";
import {
  googleCalendarUrl,
  locationKindLabel,
  longDateLabel,
  outlookCalendarUrl,
  timeRangeLabel,
  timeZoneLabel,
  VIDEO_LOCATION_KINDS,
} from "@/src/utils/booking";
import { apiFileUrl } from "../_lib/booking-api";
import { LocationIcon } from "./appointment-details";

/** Lien de gestion de l'API → chemin du site (même domaine que la page). */
export function managePathFromUrl(manageUrl) {
  const token = String(manageUrl || "").split("/rdv/gerer/")[1];
  return token ? `/rdv/gerer/${token.split(/[?#]/)[0]}` : manageUrl || null;
}

/** Texte de l'événement ajouté à l'agenda de l'invité. */
export function calendarEventFor(booking, { manageUrl } = {}) {
  const locationText =
    booking.locationLabel || locationKindLabel(booking.locationKind);
  const lines = [
    `${locationKindLabel(booking.locationKind)} : ${locationText}`,
    booking.meetingUrl && `Lien de connexion : ${booking.meetingUrl}`,
    manageUrl && `Modifier ou annuler : ${manageUrl}`,
  ].filter(Boolean);
  return {
    title: booking.hostName
      ? `${booking.typeName} avec ${booking.hostName}`
      : booking.typeName,
    start: booking.startAt,
    end: booking.endAt,
    details: lines.join("\n"),
    location: booking.meetingUrl || locationText,
  };
}

function CalendarLink({ href, download, children }) {
  return (
    <a
      href={href}
      target={download ? undefined : "_blank"}
      rel="noopener noreferrer"
      download={download}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
    >
      {children}
    </a>
  );
}

/**
 * Rendez-vous confirmé : récapitulatif dans le fuseau de l'invité, lien de
 * visio s'il existe déjà, ajout à son agenda et lien de gestion.
 */
export function BookingConfirmation({ result, guestEmail, guestTimeZone }) {
  const { booking, manageUrl, icsUrl } = result;
  const event = calendarEventFor(booking, { manageUrl });
  const managePath = managePathFromUrl(manageUrl);
  const isVideo = VIDEO_LOCATION_KINDS.includes(booking.locationKind);
  const ics = apiFileUrl(icsUrl);

  return (
    <div className="mx-auto max-w-md space-y-6 py-2 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-full bg-[var(--rdv-accent)] text-[var(--rdv-on-accent)]">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-semibold text-gray-900">
          Rendez-vous confirmé
        </h1>
        {guestEmail && (
          <p className="text-sm text-gray-500">
            Un e-mail de confirmation a été envoyé à{" "}
            <span className="font-medium break-all text-gray-700">
              {guestEmail}
            </span>
            .
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-200 p-5 text-left text-sm">
        <p className="text-base font-medium text-gray-900">{event.title}</p>
        <div className="text-gray-700">
          <p>{longDateLabel(booking.startAt, guestTimeZone)}</p>
          <p className="tabular-nums">
            {timeRangeLabel(booking.startAt, booking.endAt, guestTimeZone)} ·{" "}
            {timeZoneLabel(guestTimeZone, booking.startAt)}
          </p>
        </div>
        <div className="flex items-start gap-2 text-gray-700">
          <LocationIcon
            kind={booking.locationKind}
            className="mt-0.5 size-4 shrink-0 text-gray-400"
          />
          <span className="break-words">
            {booking.locationLabel || locationKindLabel(booking.locationKind)}
          </span>
        </div>
        {booking.meetingUrl ? (
          <a
            href={booking.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-medium break-all text-[var(--rdv-accent-ink)] underline-offset-2 hover:underline"
          >
            Rejoindre la visioconférence
            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          </a>
        ) : (
          isVideo && (
            <p className="text-gray-500">
              Le lien de connexion figure dans l&apos;e-mail de confirmation.
            </p>
          )
        )}
        {booking.locationKind === "PHONE" && (
          <p className="text-gray-500">
            {booking.hostName || "Votre interlocuteur"} vous appellera au numéro
            indiqué.
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <CalendarLink href={googleCalendarUrl(event)}>
          <CalendarPlus className="size-4" aria-hidden="true" />
          Ajouter à Google Agenda
        </CalendarLink>
        <CalendarLink href={outlookCalendarUrl(event)}>
          <CalendarPlus className="size-4" aria-hidden="true" />
          Ajouter à Outlook
        </CalendarLink>
        {ics && (
          <CalendarLink href={ics} download="rendez-vous.ics">
            <Download className="size-4" aria-hidden="true" />
            Télécharger (.ics)
          </CalendarLink>
        )}
      </div>

      {managePath && (
        <p className="text-sm text-gray-500">
          Un empêchement ?{" "}
          <a
            href={managePath}
            className="font-medium text-[var(--rdv-accent-ink)] underline underline-offset-2"
          >
            Reprogrammer ou annuler
          </a>
        </p>
      )}
    </div>
  );
}
