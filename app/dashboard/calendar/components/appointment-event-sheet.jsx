"use client";

import { useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  CalendarCheck,
  ExternalLink,
  Info,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Separator } from "@/src/components/ui/separator";
import { Button } from "@/src/components/ui/button";
import { useBookingForEvent } from "@/src/hooks/useBooking";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { APPOINTMENT_COLOR, locationKindLabel } from "@/src/utils/booking";

export const APPOINTMENT_EVENT_TYPE = "APPOINTMENT";

export const isAppointmentEvent = (event) =>
  event?.type === APPOINTMENT_EVENT_TYPE;

/**
 * Lien « Gérer le rendez-vous » : fiche de la réservation (bookingId porté
 * par l'événement), sinon retrouvée par l'événement.
 */
export function manageAppointmentHref(event) {
  const params = event.bookingId
    ? new URLSearchParams({ reservation: event.bookingId })
    : new URLSearchParams({ evenement: event.id });
  if (!event.bookingId && event.end) {
    params.set("fin", new Date(event.end).toISOString());
  }
  return `/dashboard/outils/rendez-vous?${params.toString()}`;
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const isUrl = (value) => /^https?:\/\//.test(String(value || ""));

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

/**
 * Fiche d'un rendez-vous pris en ligne, en lecture seule : il se gère
 * (annulation) depuis Communication > Prise de rendez-vous. `booking` :
 * réservation retrouvée (invité, lieu), null tant qu'elle est cherchée.
 */
export function AppointmentEventSheetView({
  event,
  booking,
  loading,
  canManage = true,
  onClose,
}) {
  // Dernière fiche gardée pendant l'animation de fermeture
  const lastRef = useRef({ event, booking });
  if (event) lastRef.current = { event, booking };
  const shown = event ? { event, booking } : lastRef.current;
  const current = shown.event;
  const guest = shown.booking?.guest;
  const guestName = [guest?.firstName, guest?.lastName]
    .filter(Boolean)
    .join(" ");
  const meetingUrl =
    shown.booking?.meetingUrl ||
    (isUrl(current?.location) ? current.location : null);
  const place =
    shown.booking?.location?.kind === "IN_PERSON"
      ? shown.booking.location.value
      : !isUrl(current?.location)
        ? current?.location
        : null;

  return (
    <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col p-0 sm:w-[420px] sm:max-w-[420px]">
        {current && (
          <>
            <SheetHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${APPOINTMENT_COLOR}1a`,
                    color: APPOINTMENT_COLOR,
                  }}
                  aria-hidden="true"
                >
                  <CalendarCheck className="size-[18px]" />
                </span>
                <div className="min-w-0">
                  <SheetTitle className="text-base">Rendez-vous</SheetTitle>
                  <SheetDescription className="text-xs">
                    Réservé en ligne · Prise de rendez-vous
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Separator className="mt-4" />

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <p className="text-lg leading-snug font-semibold break-words">
                {current.title}
              </p>

              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <DetailRow label="Date">
                  {capitalize(
                    format(new Date(current.start), "EEEE d MMMM yyyy", {
                      locale: fr,
                    }),
                  )}
                </DetailRow>
                <DetailRow label="Horaire">
                  <span className="tabular-nums">
                    {format(new Date(current.start), "HH:mm")} -{" "}
                    {format(new Date(current.end), "HH:mm")}
                  </span>
                </DetailRow>
                <DetailRow label="Invité">
                  {loading && !guest ? (
                    <Loader2
                      className="size-3.5 animate-spin text-muted-foreground"
                      aria-label="Chargement"
                    />
                  ) : guest ? (
                    <span className="flex flex-col gap-1">
                      <span className="font-medium">{guestName}</span>
                      {guest.email && (
                        <a
                          href={`mailto:${guest.email}`}
                          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Mail
                            className="size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{guest.email}</span>
                        </a>
                      )}
                      {guest.phone && (
                        <a
                          href={`tel:${guest.phone.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Phone
                            className="size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          {guest.phone}
                        </a>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Voir la réservation
                    </span>
                  )}
                </DetailRow>
                {shown.booking?.location?.kind && (
                  <DetailRow label="Lieu">
                    {locationKindLabel(shown.booking.location.kind)}
                    {place && (
                      <span className="block text-xs text-muted-foreground">
                        {place}
                      </span>
                    )}
                  </DetailRow>
                )}
                {!shown.booking && place && (
                  <DetailRow label="Lieu">{place}</DetailRow>
                )}
                {meetingUrl && (
                  <DetailRow label="Lien">
                    <a
                      href={meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 break-all text-[#5a50ff] hover:underline"
                    >
                      {meetingUrl.replace(/^https?:\/\//, "")}
                      <ExternalLink
                        className="size-3 shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                  </DetailRow>
                )}
              </div>

              {guest?.message && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Message de l&apos;invité
                  </p>
                  <p className="rounded-lg border-l-2 bg-muted/30 px-3 py-2 text-sm whitespace-pre-line">
                    {guest.message}
                  </p>
                </div>
              )}

              <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Ce rendez-vous se gère depuis Communication &gt; Prise de
                  rendez-vous : il ne se modifie ni ne se supprime dans le
                  calendrier.
                </span>
              </p>
            </div>

            <SheetFooter className="mt-0 px-6 py-0">
              <Separator className="mb-4" />
              <div className="pb-4">
                {canManage ? (
                  <Button
                    asChild
                    size="sm"
                    className="w-full gap-1.5 bg-[#5a50ff] hover:bg-[#5a50ff]/90"
                  >
                    <Link href={manageAppointmentHref(current)}>
                      Gérer le rendez-vous
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onClose}
                  >
                    Fermer
                  </Button>
                )}
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Fiche d'un rendez-vous du calendrier, réservation cherchée par l'événement. */
export function AppointmentEventSheet({ event, onClose }) {
  // Sans « Voir » sur la prise de rendez-vous : ni requête ni lien
  const { canDo, isReady } = useMyPermissions();
  const canView = !isReady || canDo("appointments", "view");
  const { booking, loading } = useBookingForEvent(event, {
    skip: !event || !canView,
  });
  return (
    <AppointmentEventSheetView
      event={event}
      booking={booking}
      loading={loading}
      canManage={canView}
      onClose={onClose}
    />
  );
}
