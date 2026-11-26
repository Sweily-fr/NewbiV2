"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { returnRequestFromParams } from "@/src/utils/booking-events";
import { bookingErrorText, confirmEventPayment } from "../_lib/booking-api";
import { useGuestTimeZone } from "../_lib/use-guest-time-zone";
import { BookingCard, BookingShell } from "./booking-shell";
import { EventConfirmation } from "./event-confirmation";

// Paiement en cours de confirmation chez le prestataire : relu toutes les
// 5 secondes, une minute au plus
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 12;

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
 * /rdv/<adresse>/<événement>/retour : retour du paiement. L'inscription
 * n'est confirmée qu'après vérification du paiement par l'API.
 */
export function EventReturnView({ slug, typeSlug, params }) {
  const [guestTimeZone] = useGuestTimeZone();
  const [state, setState] = useState({ status: "loading" });
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
    const check = async () => {
      attempts += 1;
      try {
        const data = await confirmEventPayment(body, {
          signal: controller.signal,
        });
        if (data.paymentStatus === "pending" && attempts < POLL_MAX_ATTEMPTS) {
          setState({ status: "pending", data });
          timer = setTimeout(check, POLL_INTERVAL_MS);
          return;
        }
        setState({ status: "done", data });
      } catch (error) {
        if (error?.name === "AbortError") return;
        setState({ status: "error", error });
      }
    };
    check();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [requestKey]);

  const restartHref = `/rdv/${encodeURIComponent(slug)}/${encodeURIComponent(typeSlug)}`;
  const restart = (
    <a
      href={restartHref}
      className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--rdv-accent)] px-5 py-2.5 text-sm font-medium text-[var(--rdv-on-accent)] transition-opacity hover:opacity-90"
    >
      Revenir à l&apos;événement
    </a>
  );

  const data = state.data;
  const registration = data?.registration;
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
            ? "Si vous avez payé, vos billets vous ont été envoyés par e-mail."
            : bookingErrorText(state.error)
        }
        action={restart}
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
  } else if (data?.paymentStatus === "pending") {
    content = (
      <Message
        title="Paiement en attente de confirmation"
        text="Vous recevrez vos billets par e-mail dès la confirmation du paiement."
      />
    );
  } else if (
    registration?.status === "EXPIRED" &&
    data?.paymentStatus === "paid"
  ) {
    content = (
      <Message
        title="Événement complet"
        text="Votre paiement est arrivé après la fin de la réservation de vos places et l'événement est désormais complet. Vous êtes remboursé automatiquement."
        action={restart}
      />
    );
  } else {
    content = (
      <Message
        title="Paiement non effectué"
        text="Votre inscription n'est pas confirmée et aucun billet n'a été émis. Vous pouvez recommencer."
        action={restart}
      />
    );
  }

  return (
    <BookingShell accentColor={registration?.page?.accentColor}>
      <BookingCard className="mx-auto max-w-2xl">
        <div className="px-5 py-8 sm:px-10 sm:py-12">{content}</div>
      </BookingCard>
    </BookingShell>
  );
}
