"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  TriangleAlert,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";
import {
  APPOINTMENT_COLOR,
  durationLabel,
  locationKindLabel,
  longDateLabel,
  timeInZone,
  timeRangeLabel,
  timeZoneLabel,
} from "@/src/utils/booking";
import { guestName } from "./bookings-panel";
import { LocationKindIcon } from "./shared";

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

const CANCELLED_BY = { GUEST: "par l'invité", HOST: "par vous" };

/**
 * Fiche d'une réservation : invité, horaire (et heure de l'invité si son
 * fuseau diffère), lieu et lien de visio, message, client CRM, annulation
 * avec motif facultatif.
 */
export function BookingSheet({
  booking,
  onClose,
  timeZone,
  canCancel,
  onCancel,
}) {
  // Dernière fiche gardée pendant l'animation de fermeture
  const lastRef = useRef(booking);
  if (booking) lastRef.current = booking;
  const shown = booking || lastRef.current;

  return (
    <Sheet open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col p-0 sm:w-[440px] sm:max-w-[440px]">
        {shown && (
          <BookingSheetBody
            booking={shown}
            timeZone={timeZone}
            canCancel={canCancel}
            onCancel={onCancel}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function BookingSheetBody({ booking, timeZone, canCancel, onCancel }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  useEffect(() => {
    setReason("");
    setConfirmOpen(false);
  }, [booking.id]);

  const cancelled = booking.status === "CANCELLED";
  const past = new Date(booking.endAt) < new Date();
  const guestZone = booking.guest?.timezone;
  const showGuestTime =
    guestZone &&
    guestZone !== timeZone &&
    timeInZone(booking.startAt, guestZone) !==
      timeInZone(booking.startAt, timeZone);
  const location = booking.location || {};
  const locationValue =
    location.kind === "IN_PERSON" || location.kind === "CUSTOM_LINK"
      ? location.value
      : null;
  const meetingUrl =
    booking.meetingUrl ||
    (location.kind === "CUSTOM_LINK" ? location.value : null);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const done = await onCancel(booking, reason);
      if (done) setConfirmOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
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
            <SheetTitle className="truncate text-base">
              {booking.typeName}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {cancelled
                ? `Annulé ${CANCELLED_BY[booking.cancelledBy] || ""}`.trim()
                : past
                  ? "Rendez-vous passé"
                  : "Rendez-vous confirmé"}
              {" · "}
              {durationLabel(booking.durationMinutes)}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <Separator className="mt-4" />

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div>
          <p className="text-lg leading-snug font-semibold break-words">
            {guestName(booking.guest)}
          </p>
          <div className="mt-1.5 flex flex-col gap-1 text-sm">
            {booking.guest?.email && (
              <a
                href={`mailto:${booking.guest.email}`}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Mail className="size-3.5" aria-hidden="true" />
                <span className="truncate">{booking.guest.email}</span>
              </a>
            )}
            {booking.guest?.phone && (
              <a
                href={`tel:${booking.guest.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Phone className="size-3.5" aria-hidden="true" />
                {booking.guest.phone}
              </a>
            )}
          </div>
        </div>

        {booking.meetingWarning && !cancelled && (
          <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
            <TriangleAlert
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>
              {booking.meetingWarning} Envoyez le lien de connexion à
              l&apos;invité par e-mail.
            </span>
          </p>
        )}

        <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
          <DetailRow label="Date">
            <span className={cn(cancelled && "line-through")}>
              {longDateLabel(booking.startAt, timeZone)}
            </span>
          </DetailRow>
          <DetailRow label="Horaire">
            <span className={cn("tabular-nums", cancelled && "line-through")}>
              {timeRangeLabel(booking.startAt, booking.endAt, timeZone)}
            </span>
            {showGuestTime && (
              <span className="block text-xs text-muted-foreground">
                {timeRangeLabel(booking.startAt, booking.endAt, guestZone)} pour
                l&apos;invité ({timeZoneLabel(guestZone, booking.startAt)})
              </span>
            )}
          </DetailRow>
          <DetailRow label="Lieu">
            <span className="inline-flex items-center gap-1.5">
              <LocationKindIcon
                kind={location.kind}
                className="size-3.5 shrink-0"
              />
              {locationKindLabel(location.kind)}
            </span>
            {locationValue && location.kind === "IN_PERSON" && (
              <span className="block text-xs text-muted-foreground">
                {locationValue}
              </span>
            )}
          </DetailRow>
          {meetingUrl && !cancelled && (
            <DetailRow label="Lien">
              <a
                href={meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all text-[#5a50ff] hover:underline"
              >
                {meetingUrl.replace(/^https?:\/\//, "")}
                <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
              </a>
            </DetailRow>
          )}
          {cancelled && booking.cancelledAt && (
            <DetailRow label="Annulé le">
              {longDateLabel(booking.cancelledAt, timeZone)}
            </DetailRow>
          )}
          {cancelled && booking.cancelReason && (
            <DetailRow label="Motif">{booking.cancelReason}</DetailRow>
          )}
          {booking.createdAt && (
            <DetailRow label="Réservé le">
              {longDateLabel(booking.createdAt, timeZone)}
            </DetailRow>
          )}
        </div>

        {booking.guest?.message && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Message de l&apos;invité
            </p>
            <p className="rounded-lg border-l-2 bg-muted/30 px-3 py-2 text-sm whitespace-pre-line">
              {booking.guest.message}
            </p>
          </div>
        )}
      </div>

      <SheetFooter className="mt-0 px-6 py-0">
        <Separator className="mb-4" />
        <div className="flex w-full flex-col gap-2 pb-4">
          {booking.clientId && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/dashboard/clients/${booking.clientId}`}>
                Voir la fiche client
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          )}
          {!cancelled && !past && canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="w-full cursor-pointer text-red-600 hover:text-red-700 dark:text-red-400"
              onClick={() => setConfirmOpen(true)}
            >
              Annuler le rendez-vous
            </Button>
          )}
        </div>
      </SheetFooter>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !cancelling && setConfirmOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
            <AlertDialogDescription>
              {guestName(booking.guest)} sera prévenu par e-mail et le créneau
              redeviendra libre. L&apos;événement est retiré de vos agendas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rdv-cancel-reason">
              Motif{" "}
              <span className="font-normal text-muted-foreground">
                (facultatif, transmis à l&apos;invité)
              </span>
            </Label>
            <Textarea
              id="rdv-cancel-reason"
              value={reason}
              maxLength={1000}
              rows={3}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={cancelling}>
              Garder
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
              className="cursor-pointer"
            >
              {cancelling && <Loader2 className="size-3.5 animate-spin" />}
              Annuler le rendez-vous
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
