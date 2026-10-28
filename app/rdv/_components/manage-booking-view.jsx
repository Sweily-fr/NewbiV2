"use client";

import { useEffect, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  ExternalLink,
  Loader2,
  XCircle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  bookingValidationOutcome,
  locationKindLabel,
  longDateLabel,
  timeRangeLabel,
  timeZoneLabel,
} from "@/src/utils/booking";
import {
  bookingErrorText,
  cancelManagedBooking,
  fetchAppointmentType,
  fetchManagedBooking,
  manageIcsUrl,
  rescheduleManagedBooking,
} from "../_lib/booking-api";
import { useGuestTimeZone } from "../_lib/use-guest-time-zone";
import { BookingCard, BookingShell, BookingUnavailable } from "./booking-shell";
import { LocationIcon } from "./appointment-details";
import { SlotPicker } from "./slot-picker";
import { SelectedSlotSummary } from "./booking-form";
import { RdvPageSkeleton } from "./rdv-page-skeleton";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const SLOT_TAKEN_NOTICE =
  "Ce créneau vient d'être réservé, choisissez-en un autre.";

const buttonBase =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-medium transition-colors disabled:cursor-default disabled:opacity-60 sm:text-sm";

function StatusBadge({ booking, guestTimeZone }) {
  if (booking.status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        <XCircle className="size-3.5" aria-hidden="true" />
        Annulé
        {booking.cancelledAt &&
          ` le ${longDateLabel(booking.cancelledAt, guestTimeZone).toLowerCase()}`}
      </span>
    );
  }
  const past = new Date(booking.endAt) < new Date();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        past
          ? "bg-gray-100 text-gray-600"
          : "bg-[color-mix(in_srgb,var(--rdv-accent)_12%,transparent)] text-[var(--rdv-accent-ink)]",
      )}
    >
      {past ? "Passé" : "Confirmé"}
    </span>
  );
}

function BookingSummary({ booking, guestTimeZone }) {
  const cancelled = booking.status === "CANCELLED";
  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 p-5 text-sm">
      <p className="text-base font-medium text-gray-900">
        {booking.hostName
          ? `${booking.typeName} avec ${booking.hostName}`
          : booking.typeName}
      </p>
      <div className={cn("text-gray-700", cancelled && "line-through")}>
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
      {!cancelled && booking.meetingUrl && (
        <a
          href={booking.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-medium break-all text-[var(--rdv-accent-ink)] underline-offset-2 hover:underline"
        >
          Rejoindre la visioconférence
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

/**
 * /rdv/gerer/<jeton> : l'invité consulte, annule (motif facultatif) ou
 * reprogramme son rendez-vous, sans compte.
 */
export function ManageBookingView({ token, embed = false }) {
  const [state, setState] = useState({ status: "loading" });
  const [guestTimeZone, setGuestTimeZone] = useGuestTimeZone();
  // view | cancel | reschedule | confirm-reschedule
  const [mode, setMode] = useState("view");
  const [notice, setNotice] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [typeInfo, setTypeInfo] = useState(null);
  const [slot, setSlot] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchManagedBooking(token, { signal: controller.signal })
      .then((data) => setState({ status: "ready", booking: data }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ status: "error", error });
      });
    return () => controller.abort();
  }, [token]);

  if (state.status === "loading") {
    return <RdvPageSkeleton variant="list" embed={embed} />;
  }
  if (state.status === "error") {
    return (
      <BookingUnavailable
        embed={embed}
        title="Rendez-vous introuvable"
        text={
          state.error?.code === "NOT_FOUND"
            ? "Ce lien de gestion n'est pas valide. Utilisez celui de votre e-mail de confirmation."
            : bookingErrorText(state.error)
        }
      />
    );
  }

  const { booking } = state;
  const page = booking.page || {};

  // Rendez-vous passé ou annulé entre-temps (NOT_ALLOWED) : état relu
  const refreshBooking = () =>
    fetchManagedBooking(token)
      .then((data) => setState({ status: "ready", booking: data }))
      .catch(() => {});

  const startReschedule = async () => {
    setActionError("");
    setNotice(null);
    setMode("reschedule");
    if (typeInfo) return;
    try {
      const data = await fetchAppointmentType(page.slug, booking.typeSlug);
      setTypeInfo(data.type);
    } catch (error) {
      setMode("view");
      setActionError(
        error?.code === "NOT_FOUND"
          ? "Ce rendez-vous ne peut plus être reprogrammé en ligne. Annulez-le puis réservez un nouveau créneau."
          : bookingErrorText(error),
      );
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    setActionError("");
    try {
      await cancelManagedBooking(token, reason);
      const fresh = await fetchManagedBooking(token).catch(() => null);
      setState({
        status: "ready",
        booking: fresh || {
          ...booking,
          status: "CANCELLED",
          canCancel: false,
          canReschedule: false,
          cancelledAt: new Date().toISOString(),
        },
      });
      setMode("view");
      setNotice({
        tone: "neutral",
        text: "Votre rendez-vous est annulé. Votre interlocuteur en a été informé.",
      });
    } catch (error) {
      setActionError(bookingErrorText(error));
      if (error?.code === "NOT_ALLOWED") {
        setMode("view");
        refreshBooking();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleReschedule = async () => {
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setActionError(
        "Patientez pendant la vérification anti-robot, puis réessayez.",
      );
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const updated = await rescheduleManagedBooking(token, {
        start: slot.start,
        turnstileToken,
      });
      setState({ status: "ready", booking: { ...booking, ...updated } });
      setMode("view");
      setSlot(null);
      setNotice({
        tone: "success",
        text: "Votre rendez-vous a été déplacé. Un e-mail de confirmation vous a été envoyé.",
      });
    } catch (error) {
      turnstileRef.current?.reset();
      setTurnstileToken("");
      const outcome =
        error?.code === "VALIDATION"
          ? bookingValidationOutcome(error.fields)
          : null;
      if (error?.code === "SLOT_TAKEN" || outcome?.slotInvalid) {
        setSlot(null);
        setReloadKey((key) => key + 1);
        setMode("reschedule");
        setNotice({ tone: "warning", text: SLOT_TAKEN_NOTICE });
        return;
      }
      if (error?.code === "NOT_ALLOWED") {
        setMode("view");
        refreshBooking();
      }
      setActionError(outcome ? outcome.message : bookingErrorText(error));
    } finally {
      setBusy(false);
    }
  };

  const picking = mode === "reschedule" || mode === "confirm-reschedule";

  return (
    <BookingShell embed={embed} accentColor={page.accentColor}>
      <BookingCard
        className={cn("mx-auto", picking ? "max-w-4xl" : "max-w-xl")}
      >
        <div className="space-y-6 p-5 sm:p-8">
          <header className="space-y-2">
            <p className="text-sm text-gray-500">{page.title}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                {picking ? "Reprogrammer" : "Votre rendez-vous"}
              </h1>
              {!picking && (
                <StatusBadge booking={booking} guestTimeZone={guestTimeZone} />
              )}
            </div>
          </header>

          {notice && (
            <p
              role="status"
              className={cn(
                "rounded-xl px-4 py-3 text-sm",
                notice.tone === "warning"
                  ? "bg-amber-50 text-amber-800"
                  : notice.tone === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-gray-50 text-gray-700",
              )}
            >
              {notice.text}
            </p>
          )}

          {mode === "view" && (
            <>
              <BookingSummary booking={booking} guestTimeZone={guestTimeZone} />

              {actionError && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {actionError}
                </p>
              )}

              {booking.status === "CONFIRMED" &&
                (booking.canReschedule || booking.canCancel) && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {booking.canReschedule && (
                      <button
                        type="button"
                        onClick={startReschedule}
                        className={cn(
                          buttonBase,
                          "bg-[var(--rdv-accent)] text-[var(--rdv-on-accent)] hover:opacity-90",
                        )}
                      >
                        <CalendarClock className="size-4" aria-hidden="true" />
                        Reprogrammer
                      </button>
                    )}
                    {booking.canCancel && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionError("");
                          setNotice(null);
                          setMode("cancel");
                        }}
                        className={cn(
                          buttonBase,
                          "border border-gray-200 text-gray-800 hover:bg-gray-50",
                        )}
                      >
                        Annuler le rendez-vous
                      </button>
                    )}
                  </div>
                )}

              {booking.status === "CONFIRMED" &&
                !booking.canCancel &&
                !booking.canReschedule && (
                  <p className="text-sm text-gray-500">
                    Ce rendez-vous ne peut plus être modifié en ligne.
                  </p>
                )}

              {booking.status === "CONFIRMED" &&
                new Date(booking.endAt) > new Date() && (
                  <a
                    href={manageIcsUrl(token)}
                    download="rendez-vous.ics"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Télécharger (.ics)
                  </a>
                )}

              {booking.status === "CANCELLED" && page.slug && (
                <a
                  href={`/rdv/${encodeURIComponent(page.slug)}${embed ? "?embed=1" : ""}`}
                  className={cn(
                    buttonBase,
                    "bg-[var(--rdv-accent)] text-[var(--rdv-on-accent)] hover:opacity-90",
                  )}
                >
                  Prendre un nouveau rendez-vous
                </a>
              )}
            </>
          )}

          {mode === "cancel" && (
            <div className="space-y-4">
              <BookingSummary booking={booking} guestTimeZone={guestTimeZone} />
              <div className="space-y-1.5">
                <label
                  htmlFor="rdv-cancel-reason"
                  className="block text-sm font-medium text-gray-800"
                >
                  Motif
                  <span className="ml-1 font-normal text-gray-400">
                    (facultatif)
                  </span>
                </label>
                <textarea
                  id="rdv-cancel-reason"
                  rows={3}
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Il sera transmis à votre interlocuteur"
                  className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-base text-gray-900 placeholder:text-gray-400 outline-none focus:border-[var(--rdv-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--rdv-accent)_25%,transparent)] sm:text-sm"
                />
              </div>
              {actionError && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {actionError}
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  disabled={busy}
                  className={cn(
                    buttonBase,
                    "border border-gray-200 text-gray-800 hover:bg-gray-50",
                  )}
                >
                  Garder le rendez-vous
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={busy}
                  className={cn(
                    buttonBase,
                    "bg-red-600 text-white hover:bg-red-700",
                  )}
                >
                  {busy && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  Confirmer l&apos;annulation
                </button>
              </div>
            </div>
          )}

          {mode === "reschedule" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  setMode("view");
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Retour au rendez-vous
              </button>
              {typeInfo ? (
                <SlotPicker
                  slug={page.slug}
                  typeSlug={booking.typeSlug}
                  pageTimeZone={page.timezone}
                  maxDaysAhead={typeInfo.maxDaysAhead}
                  guestTimeZone={guestTimeZone}
                  onGuestTimeZoneChange={setGuestTimeZone}
                  selectedStart={slot?.start}
                  excludeToken={token}
                  reloadKey={reloadKey}
                  onSelect={(picked) => {
                    setSlot(picked);
                    setNotice(null);
                    setActionError("");
                    setMode("confirm-reschedule");
                  }}
                />
              ) : (
                <div className="flex justify-center py-16">
                  <Loader2
                    className="size-5 animate-spin text-gray-400"
                    aria-label="Chargement"
                  />
                </div>
              )}
            </div>
          )}

          {mode === "confirm-reschedule" && slot && (
            <div className="mx-auto max-w-md space-y-4">
              <p className="text-sm text-gray-500">
                Horaire actuel : {longDateLabel(booking.startAt, guestTimeZone)}
                ,{" "}
                <span className="tabular-nums">
                  {timeRangeLabel(
                    booking.startAt,
                    booking.endAt,
                    guestTimeZone,
                  )}
                </span>
              </p>
              <p className="text-sm font-medium text-gray-800">
                Nouvel horaire
              </p>
              <SelectedSlotSummary
                slot={slot}
                guestTimeZone={guestTimeZone}
                onBack={() => setMode("reschedule")}
              />
              {TURNSTILE_SITE_KEY && (
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => setTurnstileToken("")}
                  options={{ theme: "light", language: "fr", size: "flexible" }}
                />
              )}
              {actionError && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {actionError}
                </p>
              )}
              <button
                type="button"
                onClick={handleReschedule}
                disabled={busy}
                className={cn(
                  buttonBase,
                  "bg-[var(--rdv-accent)] text-[var(--rdv-on-accent)] hover:opacity-90",
                )}
              >
                {busy && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                Confirmer le nouvel horaire
              </button>
            </div>
          )}
        </div>
      </BookingCard>
    </BookingShell>
  );
}
