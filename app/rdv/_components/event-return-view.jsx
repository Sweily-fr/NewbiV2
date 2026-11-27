"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  nextReturnPollDelay,
  returnRequestFromParams,
  unconfirmedRegistrationMessage,
} from "@/src/utils/booking-events";
import {
  returnKindFromParams,
  unconfirmedBookingMessage,
} from "@/src/utils/booking-payments";
import {
  bookingErrorText,
  cancelBookingPayment,
  cancelEventPayment,
  confirmBookingPayment,
  confirmEventPayment,
} from "../_lib/booking-api";
import { useGuestTimeZone } from "../_lib/use-guest-time-zone";
import { BookingCard, BookingShell } from "./booking-shell";
import {
  EventConfirmation,
  registrationPathFromUrl,
} from "./event-confirmation";
import { BookingConfirmation, managePathFromUrl } from "./booking-confirmation";

// Le jeton de retour ne sert plus que 5 minutes après la confirmation :
// le lien de gestion de la première réponse est gardé pour un rechargement
const storageKey = (returnToken) => `newbi:rdv:retour:${returnToken}`;

function rememberManageUrl(returnToken, manageUrl) {
  try {
    if (manageUrl) sessionStorage.setItem(storageKey(returnToken), manageUrl);
  } catch {
    // Stockage indisponible : rien à garder
  }
}

function rememberedManageUrl(returnToken) {
  try {
    return sessionStorage.getItem(storageKey(returnToken));
  } catch {
    return null;
  }
}

// Refus passagers : la vérification est retentée plus tard (rythme et
// durée maximale : nextReturnPollDelay)
const RETRYABLE_ERRORS = ["RATE_LIMITED", "NETWORK"];

function Message({ title, text, action, busy }) {
  return (
    <div className="mx-auto max-w-md space-y-3 py-6 text-center">
      {busy && (
        <Loader2
          className="mx-auto size-8 animate-spin text-[var(--rdv-accent-ink)]"
          aria-hidden="true"
        />
      )}
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {text && <p className="text-sm text-gray-600">{text}</p>}
      {action}
    </div>
  );
}

/**
 * /rdv/<adresse>/<type>/retour : retour du paiement d'une inscription à un
 * événement, ou d'un créneau (kind=slot). L'inscription ou le rendez-vous
 * n'est confirmé qu'après vérification du paiement par l'API.
 */
export function EventReturnView({ slug, typeSlug, params }) {
  const [guestTimeZone] = useGuestTimeZone();
  const [state, setState] = useState({ status: "loading" });
  const kind = returnKindFromParams(params);
  const isSlot = kind === "slot";
  const request = returnRequestFromParams(params);
  const requestKey = JSON.stringify(request);

  useEffect(() => {
    const body = JSON.parse(requestKey);
    if (!body) {
      setState({ status: "invalid" });
      return undefined;
    }
    const controller = new AbortController();
    let timer = null;
    let attempts = 0;
    const startedAt = Date.now();
    // null : plus de nouvelle tentative (trois minutes écoulées)
    const later = () => {
      const delay = nextReturnPollDelay(attempts, Date.now() - startedAt);
      if (delay != null) timer = setTimeout(check, delay);
      return delay != null;
    };
    const check = async () => {
      attempts += 1;
      try {
        // Retour après une annulation chez le prestataire : l'API ferme le
        // paiement et rend les places (premier appel seulement)
        const [confirmPayment, cancelPayment] = isSlot
          ? [confirmBookingPayment, cancelBookingPayment]
          : [confirmEventPayment, cancelEventPayment];
        const verify =
          body.canceled && attempts === 1 ? cancelPayment : confirmPayment;
        const data = await verify(body, { signal: controller.signal });
        if (
          (isSlot ? data.booking : data.registration)?.status === "CONFIRMED"
        ) {
          rememberManageUrl(body.returnToken, data.manageUrl);
        }
        if (data.paymentStatus === "pending" && later()) {
          setState({ status: "pending", data });
          return;
        }
        setState({ status: "done", data });
      } catch (error) {
        if (error?.name === "AbortError") return;
        // API saturée ou réseau coupé : on réessaie plus tard sans rien
        // conclure
        if (RETRYABLE_ERRORS.includes(error?.code) && later()) {
          setState((prev) =>
            prev.status === "pending" ? prev : { status: "loading" },
          );
          return;
        }
        // Jeton déjà utilisé (rechargement après confirmation) : page de
        // l'inscription
        const manageUrl =
          error?.code === "NOT_FOUND" && rememberedManageUrl(body.returnToken);
        if (manageUrl) {
          setState({ status: "loading" });
          window.location.replace(
            isSlot
              ? managePathFromUrl(manageUrl)
              : registrationPathFromUrl(manageUrl),
          );
          return;
        }
        setState({ status: "error", error });
      }
    };
    check();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [requestKey, isSlot]);

  const restartHref = `/rdv/${encodeURIComponent(slug)}/${encodeURIComponent(typeSlug)}`;
  const restart = (
    <a
      href={restartHref}
      className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--rdv-accent)] px-5 py-2.5 text-sm font-medium text-[var(--rdv-on-accent)] transition-opacity hover:opacity-90"
    >
      {isSlot ? "Choisir un créneau" : "Revenir à l'événement"}
    </a>
  );

  const data = state.data;
  const registration = data?.registration;
  const booking = data?.booking;
  let content;
  if (state.status === "loading") {
    content = (
      <Message
        busy
        title="Vérification du paiement"
        text="Quelques secondes, nous confirmons votre paiement."
      />
    );
  } else if (state.status === "pending") {
    content = (
      <Message
        busy
        title="Paiement en cours de confirmation"
        text="Votre banque confirme le paiement. Cette page se met à jour toute seule."
      />
    );
  } else if (state.status === "invalid") {
    content = (
      <Message
        title="Lien incomplet"
        text="Ce lien de retour ne permet pas de vérifier le paiement."
        action={restart}
      />
    );
  } else if (state.status === "error") {
    content = (
      <Message
        title={
          state.error?.code === "NOT_FOUND"
            ? "Lien de retour expiré"
            : "Vérification impossible"
        }
        text={
          state.error?.code === "NOT_FOUND"
            ? isSlot
              ? "Si vous avez payé, la confirmation du rendez-vous vous a été envoyée par e-mail."
              : "Si vous avez payé, vos billets vous ont été envoyés par e-mail."
            : bookingErrorText(state.error)
        }
        action={restart}
      />
    );
  } else if (isSlot && booking?.status === "CONFIRMED") {
    content = (
      <BookingConfirmation
        result={{
          booking,
          manageUrl: data.manageUrl,
          icsUrl: data.icsUrl,
        }}
        guestTimeZone={guestTimeZone}
        heading="Paiement confirmé, rendez-vous réservé"
      />
    );
  } else if (isSlot) {
    const message = unconfirmedBookingMessage({
      booking,
      paymentStatus: data?.paymentStatus,
      refundStatus: data?.refundStatus,
      canceledByPayer: Boolean(request?.canceled),
      organizerName: booking?.page?.organizationName || booking?.page?.title,
    });
    content = (
      <Message
        title={message.title}
        text={message.text}
        action={message.restart ? restart : null}
      />
    );
  } else if (registration?.status === "CONFIRMED") {
    content = (
      <EventConfirmation
        registration={registration}
        manageUrl={data.manageUrl}
        guestTimeZone={guestTimeZone}
        heading="Paiement confirmé, vous êtes inscrit"
      />
    );
  } else {
    const message = unconfirmedRegistrationMessage({
      registration,
      paymentStatus: data?.paymentStatus,
      refundStatus: data?.refundStatus,
      canceledByPayer: Boolean(request?.canceled),
      organizerName:
        registration?.page?.organizationName || registration?.page?.title,
    });
    content = (
      <Message
        title={message.title}
        text={message.text}
        action={message.restart ? restart : null}
      />
    );
  }

  return (
    <BookingShell
      accentColor={(isSlot ? booking : registration)?.page?.accentColor}
    >
      <BookingCard className="mx-auto max-w-2xl">
        <div className="px-5 py-8 sm:px-10 sm:py-12">{content}</div>
      </BookingCard>
    </BookingShell>
  );
}
