"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { BOOKING_FORM_LIMITS, validateBookingForm } from "@/src/utils/booking";
import {
  buildRegistrationPayload,
  eventNeedsOnlinePayment,
  eventOrderAmounts,
  formatCents,
  isPaidEvent,
  orderedPaymentMethods,
  quantityChoices,
  registrationSubmitLabel,
  registrationValidationOutcome,
} from "@/src/utils/booking-events";
import { bookingErrorText, registerForEvent } from "../_lib/booking-api";
import { useGuestTimeZone } from "../_lib/use-guest-time-zone";
import { BookingCard, BookingShell } from "./booking-shell";
import { EventCover, EventInfo } from "./event-details";
import {
  EventConfirmation,
  registrationPathFromUrl,
} from "./event-confirmation";
import { PaymentMethodChoice } from "./payment-method-choice";
import {
  bankTransferUnavailableNote,
  offeredPaymentMethods,
} from "@/src/utils/booking-payments";

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

/** Inscriptions fermées : complet, clos ou commencé. */
function RegistrationClosed({ soldOut }) {
  return (
    <div className="rounded-2xl bg-gray-50 px-5 py-6 text-center">
      <p className="text-base font-medium text-gray-900">
        {soldOut ? "Complet" : "Inscriptions closes"}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {soldOut
          ? "Toutes les places ont trouvé preneur."
          : "Il n'est plus possible de s'inscrire à cet événement."}
      </p>
    </div>
  );
}

/**
 * Formulaire d'inscription : coordonnées, nombre de places, moyen de
 * paiement si l'événement se paie en ligne (en entier ou en acompte).
 * Gratuit ou payé sur place : billets tout de suite ; en ligne :
 * redirection vers le paiement du vendeur.
 */
function EventRegistrationForm({
  slug,
  type,
  guestTimeZone,
  embed,
  onRegistered,
}) {
  const event = type.event;
  const priced = isPaidEvent(event.price);
  // « paid » : paiement en ligne à l'inscription (total ou acompte)
  const paid = eventNeedsOnlinePayment(event);
  // Virement retiré si l'API ne le permet plus (début à moins de 48 h)
  const connectedMethods = orderedPaymentMethods(event.paymentMethods);
  const methods = offeredPaymentMethods(
    connectedMethods,
    event.bankTransferAvailable,
  );
  const bankTransferNote = bankTransferUnavailableNote(
    connectedMethods,
    event.bankTransferAvailable,
    { kind: "event" },
  );
  const choices = quantityChoices(event.maxPerOrder, event.seatsLeft);
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [quantity, setQuantity] = useState(1);
  const [provider, setProvider] = useState(methods[0] || null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef(null);

  const update = (name) => (changeEvent) => {
    const value = changeEvent.target.value;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const order = eventOrderAmounts(event, quantity);

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setFormError("");
    const found = validateBookingForm(values, {
      phoneRequired: Boolean(type.requirePhone),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(`evt-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    if (paid && !provider) {
      setFormError("Choisissez un moyen de paiement.");
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
      const result = await registerForEvent(
        slug,
        type.slug,
        buildRegistrationPayload(values, {
          quantity,
          timezone: guestTimeZone,
          provider: paid ? provider : null,
          turnstileToken,
          website: honeypot,
        }),
      );
      if (result?.status === "PENDING_PAYMENT" && result.paymentUrl) {
        // Paiement chez le prestataire du vendeur ; retour sur /retour
        window.location.assign(result.paymentUrl);
        return;
      }
      if (result?.status === "PENDING_PAYMENT" && result.manageUrl) {
        // Virement : coordonnées sur la page de l'inscription (lien
        // permanent, aussi envoyé par e-mail)
        const path = registrationPathFromUrl(result.manageUrl);
        window.location.assign(embed ? `${path}?embed=1` : path);
        return;
      }
      onRegistered(result);
      setSubmitting(false);
    } catch (error) {
      turnstileRef.current?.reset();
      setTurnstileToken("");
      setSubmitting(false);
      if (error?.code === "VALIDATION") {
        const outcome = registrationValidationOutcome(error.fields);
        setErrors(outcome.inputs);
        setFormError(outcome.message);
        return;
      }
      setFormError(bookingErrorText(error));
    }
  };

  const describedBy = (name) =>
    errors[name] ? `evt-${name}-error` : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <h2 className="text-lg font-medium text-gray-900">
        Inscription à l&apos;événement
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="evt-firstName" label="Prénom" error={errors.firstName}>
          <input
            id="evt-firstName"
            autoComplete="given-name"
            value={values.firstName}
            onChange={update("firstName")}
            maxLength={BOOKING_FORM_LIMITS.firstName}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={describedBy("firstName")}
            className={inputClass(errors.firstName)}
          />
        </Field>
        <Field id="evt-lastName" label="Nom" error={errors.lastName}>
          <input
            id="evt-lastName"
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

      <Field id="evt-email" label="Adresse e-mail" error={errors.email}>
        <input
          id="evt-email"
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
        id="evt-phone"
        label="Téléphone"
        optional={!type.requirePhone}
        error={errors.phone}
      >
        <input
          id="evt-phone"
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
      </Field>

      <Field id="evt-quantity" label="Nombre de places" error={errors.quantity}>
        <select
          id="evt-quantity"
          value={quantity}
          onChange={(changeEvent) => {
            setQuantity(Number(changeEvent.target.value));
            if (errors.quantity)
              setErrors((prev) => ({ ...prev, quantity: undefined }));
          }}
          aria-invalid={Boolean(errors.quantity)}
          aria-describedby={describedBy("quantity")}
          className={cn(inputClass(errors.quantity), "cursor-pointer")}
        >
          {choices.map((value) => (
            <option key={value} value={value}>
              {value} place{value > 1 ? "s" : ""}
              {priced
                ? ` · ${formatCents(event.price.amount * value, event.price.currency)}`
                : ""}
            </option>
          ))}
        </select>
      </Field>

      {paid && (
        <PaymentMethodChoice
          name="evt-provider"
          kind="event"
          methods={methods}
          value={provider}
          onChange={setProvider}
          note={bankTransferNote}
        />
      )}

      {/* Pot de miel : invisible pour les personnes, rempli par les robots */}
      <div
        style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
        aria-hidden="true"
      >
        <label htmlFor="evt-website">Site web</label>
        <input
          type="text"
          id="evt-website"
          name="website"
          autoComplete="off"
          tabIndex={-1}
          value={honeypot}
          onChange={(changeEvent) => setHoneypot(changeEvent.target.value)}
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
        disabled={submitting || (paid && methods.length === 0)}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--rdv-accent)] px-6 py-3 text-base font-medium text-[var(--rdv-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60 sm:text-sm"
      >
        {submitting && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
        {submitting
          ? paid && provider !== "bank_transfer"
            ? "Redirection vers le paiement"
            : "Inscription en cours"
          : registrationSubmitLabel(event, quantity)}
      </button>
      {order.onSite > 0 && (
        <p className="text-center text-sm text-gray-600">
          {order.mode === "DEPOSIT"
            ? `Reste ${formatCents(order.onSite, event.price.currency)} à régler sur place, le jour de l'événement.`
            : `${formatCents(order.onSite, event.price.currency)} à régler sur place, le jour de l'événement.`}
        </p>
      )}
      <p className="text-center text-xs text-gray-400">
        {paid
          ? "Paiement sécurisé, encaissé directement par l'organisateur. "
          : ""}
        Vos coordonnées sont transmises à l&apos;organisateur uniquement pour
        cet événement.
      </p>
    </form>
  );
}

/**
 * /rdv/<adresse>/<événement> : bandeau, informations de l'événement et
 * inscription ; confirmation avec les billets (gratuit).
 */
export function EventRegistrationView({ slug, page, type, typesCount, embed }) {
  const [guestTimeZone] = useGuestTimeZone();
  const [confirmation, setConfirmation] = useState(null);
  const event = type.event;
  const backHref = `/rdv/${encodeURIComponent(page.slug || slug)}${embed ? "?embed=1" : ""}`;

  return (
    <BookingShell embed={embed} accentColor={page.accentColor}>
      <BookingCard>
        {confirmation ? (
          <div className="px-5 py-8 sm:px-10 sm:py-12">
            <EventConfirmation
              registration={confirmation.registration}
              manageUrl={confirmation.manageUrl}
              guestTimeZone={guestTimeZone}
            />
          </div>
        ) : (
          <>
            <EventCover src={event.coverImageUrl} />
            <div className="flex flex-col md:flex-row">
              <div className="min-w-0 flex-1 p-5 sm:p-8">
                {typesCount > 1 && (
                  <Link
                    href={backHref}
                    className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Tous les rendez-vous
                  </Link>
                )}
                <EventInfo
                  page={page}
                  type={type}
                  guestTimeZone={guestTimeZone}
                />
              </div>
              <section className="border-t border-gray-100 p-5 sm:p-8 md:w-[380px] md:shrink-0 md:border-t-0 md:border-l">
                <div className="md:sticky md:top-6">
                  {event.registrationOpen ? (
                    <EventRegistrationForm
                      slug={page.slug || slug}
                      type={type}
                      guestTimeZone={guestTimeZone}
                      embed={embed}
                      onRegistered={setConfirmation}
                    />
                  ) : (
                    <RegistrationClosed soldOut={event.soldOut} />
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </BookingCard>
    </BookingShell>
  );
}
