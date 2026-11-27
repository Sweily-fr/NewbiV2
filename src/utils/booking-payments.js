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

/** Garde d'un virement : 3 jours au plus, jusqu'au début au plus tard. */
export const BANK_TRANSFER_HOLD_MS = 3 * 24 * 60 * 60 * 1000;

/** Fin de la garde d'un virement : min(maintenant + 3 jours, début). */
export function bankTransferDueAt(startAt, now = new Date()) {
  const hold = new Date(now).getTime() + BANK_TRANSFER_HOLD_MS;
  const start = startAt ? Date.parse(startAt) : NaN;
  return new Date(Number.isFinite(start) ? Math.min(hold, start) : hold);
}

/** Début à moins de 3 jours : virement instantané conseillé. */
export function instantTransferAdvised(startAt, now = new Date()) {
  const start = startAt ? Date.parse(startAt) : NaN;
  return (
    Number.isFinite(start) &&
    start - new Date(now).getTime() < BANK_TRANSFER_HOLD_MS
  );
}

/**
 * Délai annoncé sous chaque moyen, avant le choix. `kind` : « slot »
 * (créneau) ou « event ». Virement : `startAt` (début du créneau ou de
 * l'événement) donne la fin de la garde, min(3 jours, début), et le
 * conseil du virement instantané quand le début est proche.
 */
export function paymentMethodDelay(
  method,
  kind = "event",
  { startAt = null, now = new Date(), timeZone = DEFAULT_TIME_ZONE } = {},
) {
  if (method === BANK_TRANSFER) {
    const slot = kind === "slot";
    const kept = slot ? "Le créneau est gardé" : "Votre place est gardée";
    const until = startAt
      ? `jusqu'au ${shortDateTimeLabel(bankTransferDueAt(startAt, now).toISOString(), timeZone)}`
      : slot
        ? "jusqu'à 3 jours, au plus tard jusqu'au début du rendez-vous"
        : "jusqu'à 3 jours, au plus tard jusqu'au début de l'événement";
    const confirmed = slot
      ? "Il est confirmé dès que le virement arrive."
      : "Elle est confirmée dès que le virement arrive.";
    const advice =
      startAt && instantTransferAdvised(startAt, now)
        ? ` ${slot ? "Le rendez-vous" : "L'événement"} approche : faites de préférence un virement instantané.`
        : "";
    return `${kept} ${until}. ${confirmed}${advice}`;
  }
  return kind === "slot"
    ? "Rendez-vous confirmé dès le paiement"
    : "Billets envoyés dès le paiement";
}

/**
 * Moyens réellement proposés : ceux que l'API renvoie (moyens choisis par
 * l'organisateur et prêts). Le virement n'a plus de délai minimum ; une
 * ancienne réponse qui le dit indisponible (`false`) est encore respectée.
 */
export function offeredPaymentMethods(methods, bankTransferAvailable) {
  return (methods || []).filter(
    (method) => method !== BANK_TRANSFER || bankTransferAvailable !== false,
  );
}

/**
 * Paiement en ligne impossible (aucun moyen prêt) : message à la place du
 * bouton, avec le nom de l'organisateur s'il est connu.
 */
export function noPaymentMethodMessage(organizerName = "") {
  const who = String(organizerName || "").trim();
  return `Paiement en ligne indisponible pour le moment. Contactez ${who || "l'organisateur"} pour réserver.`;
}

/** Ordre d'affichage des moyens choisis par l'organisateur. */
export const APPOINTMENT_PAYMENT_METHODS = [
  "stripe",
  "paypal",
  "sumup",
  BANK_TRANSFER,
];

/**
 * Moyens cochés dans le tiroir d'un type payant : le choix enregistré, ou
 * (choix absent : `null`) tous les moyens prêts de l'espace.
 */
export function chosenPaymentMethods(value, usable = []) {
  return Array.isArray(value) ? value : [...usable];
}

/** Choix enregistré d'un type → champ du formulaire (null = tous). */
export const paymentMethodsToForm = (type) =>
  Array.isArray(type?.paymentMethods) ? [...type.paymentMethods] : null;

/**
 * Erreur du choix des moyens d'un type payant en ligne ou en acompte : au
 * moins un moyen choisi ET prêt (null si bon, ou si les moyens prêts ne
 * sont pas encore connus, ou si aucun n'est prêt : message à part).
 */
export function paymentMethodsFormError(form, usable = [], loaded = false) {
  if (!loaded || usable.length === 0) return null;
  if (form.paymentMode === "ON_SITE") return null;
  const chosen = chosenPaymentMethods(form.paymentMethods, usable);
  return chosen.some((method) => usable.includes(method))
    ? null
    : "Choisissez au moins un moyen de paiement.";
}

/**
 * Moyens à envoyer à l'API : seulement si l'organisateur a choisi et que
 * le choix diffère de celui enregistré (`initial`, null = tous), jamais
 * pour un type gratuit (rien n'est réécrit sans modification réelle).
 */
export function paymentMethodsInputIfChanged(
  form,
  initial,
  { paid = true } = {},
) {
  if (!paid || !Array.isArray(form.paymentMethods)) return {};
  const next = APPOINTMENT_PAYMENT_METHODS.filter((method) =>
    form.paymentMethods.includes(method),
  );
  const before = Array.isArray(initial)
    ? APPOINTMENT_PAYMENT_METHODS.filter((method) => initial.includes(method))
    : null;
  if (before && before.join() === next.join()) return {};
  return { paymentMethods: next };
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
  // Virement repéré après la garde ou le début : l'organisateur décide
  if (item.bankTransferReceivedAt && !item.paidAt) {
    return {
      label: "Virement reçu, à valider",
      tone: "danger",
      detail: `Reçu le ${shortDateTimeLabel(item.bankTransferReceivedAt, timeZone)}`,
    };
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
      text: "Votre paiement est arrivé trop tard (créneau repris entre-temps ou rendez-vous déjà commencé) : il vous a été remboursé automatiquement. Aucun rendez-vous n'a été enregistré.",
      restart: true,
    };
  }
  if (refund === "MANUAL") {
    return {
      title: "Paiement reçu, rendez-vous non confirmé",
      text: `Votre paiement a bien été reçu, mais trop tard : le rendez-vous n'a pas pu être confirmé. ${capitalize(organizer)} va vous rembourser ; contactez-le si besoin, en indiquant l'adresse e-mail utilisée.`,
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

const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

/** Paramètre `kind` de l'adresse de retour : « slot » ou « event ». */
export function returnKindFromParams(params) {
  const value =
    typeof params?.get === "function" ? params.get("kind") : params?.kind;
  return (Array.isArray(value) ? value[0] : value) === "slot"
    ? "slot"
    : "event";
}
