"use client";

import { useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { ArrowLeft, CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  BOOKING_FORM_LIMITS,
  buildBookingPayload,
  isPhoneRequired,
  longDateLabel,
  mapApiFieldErrors,
  timeRangeLabel,
  timeZoneLabel,
  validateBookingForm,
} from "@/src/utils/booking";
import { bookAppointment, bookingErrorText } from "../_lib/booking-api";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function Field({ id, label, optional, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-800">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-gray-400">(facultatif)</span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (error) =>
  cn(
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-gray-900 placeholder:text-gray-400 transition-colors outline-none focus:border-[var(--rdv-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--rdv-accent)_25%,transparent)] sm:text-sm",
    error ? "border-red-400" : "border-gray-200",
  );

/** Récapitulatif du créneau choisi, avec retour au choix de l'heure. */
export function SelectedSlotSummary({ slot, guestTimeZone, onBack }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[color-mix(in_srgb,var(--rdv-accent)_8%,transparent)] px-4 py-3">
      <CalendarDays
        className="mt-0.5 size-4 shrink-0 text-[var(--rdv-accent-ink)]"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-gray-900">
          {longDateLabel(slot.start, guestTimeZone)}
        </p>
        <p className="text-gray-600 tabular-nums">
          {timeRangeLabel(slot.start, slot.end, guestTimeZone)} ·{" "}
          {timeZoneLabel(guestTimeZone, slot.start)}
        </p>
      </div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 cursor-pointer text-sm font-medium text-[var(--rdv-accent-ink)] underline-offset-2 hover:underline"
        >
          Modifier
        </button>
      )}
    </div>
  );
}

/**
 * Coordonnées de l'invité puis réservation. 409 : le créneau vient d'être
 * pris, retour au choix de l'heure (créneaux relus par le parent).
 */
export function BookingForm({
  slug,
  type,
  slot,
  guestTimeZone,
  onBack,
  onBooked,
  onSlotTaken,
}) {
  const phoneRequired = isPhoneRequired(type);
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef(null);

  const update = (name) => (event) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const resetTurnstile = () => {
    turnstileRef.current?.reset();
    setTurnstileToken("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    const found = validateBookingForm(values, { phoneRequired });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      document.getElementById(`rdv-${first}`)?.focus();
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setFormError(
        "Patientez pendant la vérification anti-robot, puis réessayez.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await bookAppointment(
        slug,
        type.slug,
        buildBookingPayload(values, {
          start: slot.start,
          timezone: guestTimeZone,
          turnstileToken,
          website: honeypot,
        }),
      );
      onBooked?.(result, values);
    } catch (error) {
      resetTurnstile();
      if (error?.code === "SLOT_TAKEN") {
        onSlotTaken?.();
        return;
      }
      if (error?.code === "VALIDATION") {
        const fieldErrors = mapApiFieldErrors(error.fields);
        setErrors(fieldErrors);
        setFormError(
          Object.keys(fieldErrors).length
            ? bookingErrorText(error)
            : "Ce créneau n'est plus réservable. Choisissez-en un autre.",
        );
        return;
      }
      setFormError(bookingErrorText(error));
    } finally {
      setSubmitting(false);
    }
  };

  const describedBy = (name) =>
    errors[name] ? `rdv-${name}-error` : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
          aria-label="Revenir au choix de l'heure"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h2 className="text-lg font-medium text-gray-900">Vos coordonnées</h2>
      </div>

      <SelectedSlotSummary
        slot={slot}
        guestTimeZone={guestTimeZone}
        onBack={onBack}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="rdv-firstName" label="Prénom" error={errors.firstName}>
          <input
            id="rdv-firstName"
            name="firstName"
            autoComplete="given-name"
            value={values.firstName}
            onChange={update("firstName")}
            maxLength={BOOKING_FORM_LIMITS.firstName}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={describedBy("firstName")}
            className={inputClass(errors.firstName)}
          />
        </Field>
        <Field id="rdv-lastName" label="Nom" error={errors.lastName}>
          <input
            id="rdv-lastName"
            name="lastName"
            autoComplete="family-name"
            value={values.lastName}
            onChange={update("lastName")}
            maxLength={BOOKING_FORM_LIMITS.lastName}
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={describedBy("lastName")}
            className={inputClass(errors.lastName)}
          />
        </Field>
      </div>

      <Field id="rdv-email" label="Adresse e-mail" error={errors.email}>
        <input
          id="rdv-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.email}
          onChange={update("email")}
          maxLength={BOOKING_FORM_LIMITS.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("email")}
          className={inputClass(errors.email)}
        />
      </Field>

      <Field
        id="rdv-phone"
        label="Téléphone"
        optional={!phoneRequired}
        error={errors.phone}
      >
        <input
          id="rdv-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={update("phone")}
          maxLength={BOOKING_FORM_LIMITS.phone}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy("phone")}
          className={inputClass(errors.phone)}
        />
        {type.locationKind === "PHONE" && !errors.phone && (
          <p className="text-xs text-gray-500">
            Vous serez appelé à ce numéro à l&apos;heure du rendez-vous.
          </p>
        )}
      </Field>

      <Field id="rdv-message" label="Message" optional error={errors.message}>
        <textarea
          id="rdv-message"
          name="message"
          rows={3}
          value={values.message}
          onChange={update("message")}
          maxLength={BOOKING_FORM_LIMITS.message}
          placeholder="Précisez l'objet du rendez-vous si besoin"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message")}
          className={cn(inputClass(errors.message), "resize-none")}
        />
      </Field>

      {/* Pot de miel : invisible pour les personnes, rempli par les robots */}
      <div
        style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
        aria-hidden="true"
      >
        <label htmlFor="rdv-website">Site web</label>
        <input
          type="text"
          id="rdv-website"
          name="website"
          autoComplete="off"
          tabIndex={-1}
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

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

      {formError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--rdv-accent)] px-6 py-3 text-base font-medium text-[var(--rdv-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60 sm:text-sm"
      >
        {submitting && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
        {submitting ? "Réservation en cours" : "Confirmer le rendez-vous"}
      </button>
      <p className="text-center text-xs text-gray-400">
        Vos coordonnées sont transmises à votre interlocuteur uniquement pour ce
        rendez-vous.
      </p>
    </form>
  );
}
