/**
 * Paiement des rendez-vous (créneaux payants) et virement (créneaux et
 * événements) : logique pure partagée par le tableau de bord et les pages
 * publiques /rdv. Montants en centimes, comme l'API.
 *
 * Un rendez-vous ou une inscription en attente de virement n'est jamais
 * présenté comme confirmé : seule l'API confirme (repérage bancaire ou
 * « Marquer comme payé » de l'organisateur).
 */
import {
  eventDepositAmount,
  eventPaymentMode,
  eventPaymentShortLabel,
  eventPriceLabel,
  formatCents,
  shortDateTimeLabel,
} from "./booking-events";
import { DEFAULT_TIME_ZONE } from "./booking";

export const BANK_TRANSFER = "bank_transfer";

/** Prestataires, pour l'organisateur (« Payé avec Stripe »). */
export const PAYMENT_PROVIDER_NAMES = {
  stripe: "Stripe",
  paypal: "PayPal",
  sumup: "SumUp",
  bank_transfer: "Virement",
};

/** Libellé d'un moyen proposé au payeur. */
export function paymentMethodLabel(method, methods = []) {
  if (method === "sumup")
    return methods.includes("stripe") ? "Carte avec SumUp" : "Carte bancaire";
  if (method === "paypal") return "PayPal";
  if (method === BANK_TRANSFER) return "Virement";
  return "Carte bancaire";
}

/**
 * Délai annoncé sous chaque moyen, avant le choix. `kind` : « slot »
 * (créneau) ou « event ».
 */
export function paymentMethodDelay(method, kind = "event") {
  if (method === BANK_TRANSFER) {
    return kind === "slot"
      ? "Le créneau est gardé 3 jours. Il est confirmé dès que le virement arrive."
      : "Votre place est gardée 3 jours. Elle est confirmée dès que le virement arrive.";
  }
  return kind === "slot"
    ? "Rendez-vous confirmé dès le paiement"
    : "Billets envoyés dès le paiement";
}

/** Réservation ou inscription en attente d'un virement. */
export const isAwaitingBankTransfer = (item) =>
  item?.status === "PENDING_PAYMENT" && item?.paymentProvider === BANK_TRANSFER;

/**
 * Statut de paiement d'une réservation ou d'une inscription pour
 * l'organisateur : { label, tone, detail } ou null (rien de particulier).
 * tone : « danger » | « warning » | « muted » | « success ».
 * `feminine` : inscription (« Expirée ») plutôt que rendez-vous (« Expiré »).
 */
export function paymentStatus(
  item,
  { timeZone = DEFAULT_TIME_ZONE, feminine = false } = {},
) {
  if (!item) return null;
  const e = feminine ? "e" : "";
  if (item.refundFailed) {
    return { label: "À rembourser à la main", tone: "danger", detail: null };
  }
  if (item.refundedAt) {
    return { label: `Remboursé${e}`, tone: "muted", detail: null };
  }
  if (item.status === "PENDING_PAYMENT") {
    if (item.paymentProvider === BANK_TRANSFER) {
      return {
        label: "Virement en attente",
        tone: "warning",
        detail: item.bankTransferDeclaredAt
          ? `Annoncé le ${shortDateTimeLabel(item.bankTransferDeclaredAt, timeZone)}`
          : null,
      };
    }
    return { label: "En attente de paiement", tone: "warning", detail: null };
  }
  if (item.status === "EXPIRED") {
    return {
      label:
        item.paymentProvider === BANK_TRANSFER
          ? `Expiré${e}, virement non reçu`
          : `Expiré${e}`,
      tone: "muted",
      detail: null,
    };
  }
  return null;
}

// --- Créneau payant (tableau de bord) ------------------------------------------

/**
 * Prix d'un type Créneaux tel que l'API le lit : payant seulement si le mode
 * est enregistré (un ancien créneau avec un prix sans mode reste gratuit).
 * Sert au formulaire et à la carte du type.
 */
export function slotPricingSource(type) {
  if (!type?.paymentMode || !(Number(type?.price?.amount) > 0)) {
    return { price: null, paymentMode: null, depositAmount: null };
  }
  return {
    price: type.price,
    paymentMode: type.paymentMode,
    depositAmount: type.depositAmount ?? null,
  };
}

// --- Créneau payant (page publique) -------------------------------------------

/** `payment` d'un type public : null ou sans prix = gratuit. */
export const isPaidSlot = (payment) =>
  Boolean(payment && Number(payment.price?.amount) > 0);

/** Mode effectif d'un créneau payant (null si gratuit). */
export const slotPaymentMode = (payment) =>
  isPaidSlot(payment) ? eventPaymentMode(payment) : null;

/** La réservation passe par un paiement en ligne (ONLINE ou DEPOSIT). */
export const slotNeedsOnlinePayment = (payment) =>
  ["ONLINE", "DEPOSIT"].includes(slotPaymentMode(payment));

/** Montants d'un créneau payant : total, en ligne, sur place (centimes). */
export function slotAmounts(payment) {
  const mode = slotPaymentMode(payment);
  if (!mode) return { mode: null, total: 0, online: 0, onSite: 0 };
  const total = Number(payment.price.amount) || 0;
  const online =
    mode === "ON_SITE"
      ? 0
      : mode === "DEPOSIT"
        ? Number(payment.amountOnline) || eventDepositAmount(payment)
        : total;
  return { mode, total, online, onSite: Math.max(0, total - online) };
}

/** Prix court d'une carte de type : « 40,00 € » ou « 40,00 €, acompte 10 € ». */
export function slotPriceLabel(payment, separator = ", ") {
  if (!isPaidSlot(payment)) return null;
  const short = eventPaymentShortLabel(payment);
  return `${eventPriceLabel(payment.price)}${short ? `${separator}${short}` : ""}`;
}

/** Règle de paiement sous le prix, sur la page du type. */
export function slotPaymentNotice(payment) {
  const { mode, online, onSite } = slotAmounts(payment);
  const currency = payment?.price?.currency;
  if (mode === "ON_SITE") return "Paiement sur place, au rendez-vous";
  if (mode === "DEPOSIT") {
    return `Acompte de ${formatCents(online, currency)} à la réservation, reste ${formatCents(onSite, currency)} sur place`;
  }
  if (mode === "ONLINE") return "Paiement en ligne à la réservation";
  return null;
}

/** Bouton du formulaire de réservation. */
export function slotSubmitLabel(payment) {
  const { mode, online } = slotAmounts(payment);
  const currency = payment?.price?.currency;
  if (mode === "ONLINE") return `Payer ${formatCents(online, currency)}`;
  if (mode === "DEPOSIT")
    return `Payer l'acompte ${formatCents(online, currency)}`;
  return "Confirmer le rendez-vous";
}

/**
 * Rendez-vous non confirmé au retour du paiement → titre, texte et s'il faut
 * proposer de choisir un autre créneau (`restart`).
 */
export function unconfirmedBookingMessage({
  booking,
  paymentStatus: status = null,
  refundStatus = null,
  canceledByPayer = false,
  organizerName = "",
} = {}) {
  const refund = refundStatus || booking?.refundStatus || "NONE";
  const organizer = organizerName || "votre interlocuteur";
  if (refund === "REFUNDED") {
    return {
      title: "Paiement remboursé",
      text: "Votre paiement est arrivé alors que le créneau n'était plus disponible : il vous a été remboursé automatiquement. Aucun rendez-vous n'a été enregistré.",
      restart: true,
    };
  }
  if (refund === "MANUAL") {
    return {
      title: "Paiement reçu, rendez-vous non confirmé",
      text: `Votre paiement a bien été reçu, mais le rendez-vous n'a pas pu être confirmé. Contactez ${organizer} pour être remboursé, en indiquant l'adresse e-mail utilisée.`,
      restart: false,
    };
  }
  if (status === "pending" || booking?.status === "PENDING_PAYMENT") {
    return {
      title: "Paiement en attente de confirmation",
      text: "Vous recevrez la confirmation du rendez-vous par e-mail dès la confirmation du paiement.",
      restart: false,
    };
  }
  if (booking?.status === "CANCELLED") {
    return {
      title: "Rendez-vous annulé",
      text: "Ce rendez-vous a été annulé.",
      restart: true,
    };
  }
  if (canceledByPayer) {
    return {
      title: "Paiement annulé",
      text: "Vous avez annulé le paiement : rien n'a été prélevé, le rendez-vous n'est pas enregistré et le créneau a été libéré.",
      restart: true,
    };
  }
  return {
    title: "Paiement non effectué",
    text: "Le paiement n'a pas abouti : rien n'a été prélevé et le rendez-vous n'est pas enregistré. Vous pouvez choisir un nouveau créneau.",
    restart: true,
  };
}

/** Paramètre `kind` de l'adresse de retour : « slot » ou « event ». */
export function returnKindFromParams(params) {
  const value =
    typeof params?.get === "function" ? params.get("kind") : params?.kind;
  return (Array.isArray(value) ? value[0] : value) === "slot"
    ? "slot"
    : "event";
}
