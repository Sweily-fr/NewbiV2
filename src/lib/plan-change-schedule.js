import { baseItemOf } from "@/src/lib/storage-packs";

/**
 * Baisse d'offre en fin de période payée (décision du 22/11/2026).
 *
 * Une baisse appliquée tout de suite remboursait au prorata le temps payé
 * restant : un client pouvait passer à l'offre Entreprise en fin de mois,
 * prendre ses crédits de prospection, recevoir ceux du mois suivant, puis
 * redescendre aussitôt avec un avoir. Désormais l'offre payée reste active
 * jusqu'à la fin de sa période ; un calendrier Stripe (subscription
 * schedule) passe ensuite l'abonnement à la nouvelle offre, sans prorata ni
 * remboursement. Le webhook « customer.subscription.updated » recopie alors
 * le plan (métadonnée planName de la phase).
 *
 * Depuis l'API Stripe 2025-08-27.basil (SDK 18.5, client sans apiVersion),
 * les dates de période sont sur les lignes de l'abonnement, plus sur
 * l'abonnement lui-même.
 */

/** Fin de la période payée en cours (secondes Unix), ou null. */
export function subscriptionPeriodEnd(subscription) {
  const items = subscription?.items?.data || [];
  return (
    subscription?.current_period_end ??
    baseItemOf(items)?.current_period_end ??
    items[0]?.current_period_end ??
    null
  );
}

/** Début de la période payée en cours (secondes Unix), ou null. */
export function subscriptionPeriodStart(subscription) {
  const items = subscription?.items?.data || [];
  return (
    subscription?.current_period_start ??
    baseItemOf(items)?.current_period_start ??
    items[0]?.current_period_start ??
    null
  );
}

/** Identifiant du calendrier Stripe rattaché à l'abonnement, ou null. */
export function subscriptionScheduleId(subscription) {
  const schedule = subscription?.schedule;
  if (!schedule) return null;
  return typeof schedule === "string" ? schedule : schedule.id || null;
}

/** Lignes d'abonnement au format des phases d'un calendrier. */
export function phaseItemsOf(items) {
  return (items || []).map((item) => ({
    price: typeof item.price === "string" ? item.price : item.price.id,
    ...(item.quantity != null ? { quantity: item.quantity } : {}),
  }));
}

/**
 * Programme le passage aux lignes `nextItems` à la fin de la période payée.
 * Calendrier existant (changement déjà programmé) réutilisé, sinon créé à
 * partir de l'abonnement. Phase en cours inchangée (mêmes lignes, mêmes
 * métadonnées), puis la nouvelle offre une période, puis le calendrier se
 * retire (« release ») et l'abonnement continue seul sur la nouvelle offre.
 * Renvoie { scheduleId, effectiveAt (Date) }.
 */
export async function scheduleChangeAtPeriodEnd(
  stripe,
  subscription,
  { nextItems, metadata },
) {
  const periodEnd = subscriptionPeriodEnd(subscription);
  if (!periodEnd) {
    throw new Error("Fin de période de l'abonnement introuvable");
  }
  const existingId = subscriptionScheduleId(subscription);
  const schedule = existingId
    ? await stripe.subscriptionSchedules.retrieve(existingId)
    : await stripe.subscriptionSchedules.create({
        from_subscription: subscription.id,
      });

  const currentStart =
    schedule.current_phase?.start_date ??
    schedule.phases?.[0]?.start_date ??
    subscriptionPeriodStart(subscription);

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        items: phaseItemsOf(subscription.items.data),
        start_date: currentStart,
        end_date: periodEnd,
        metadata: { ...(subscription.metadata || {}) },
        proration_behavior: "none",
      },
      {
        items: nextItems,
        iterations: 1,
        metadata,
        proration_behavior: "none",
      },
    ],
  });

  return { scheduleId: schedule.id, effectiveAt: new Date(periodEnd * 1000) };
}

/**
 * Annule un changement programmé : le calendrier est retiré, l'abonnement
 * garde ses lignes actuelles. Sans calendrier : rien à faire (false).
 */
export async function releaseScheduledChange(stripe, subscription) {
  const scheduleId = subscriptionScheduleId(subscription);
  if (!scheduleId) return false;
  await stripe.subscriptionSchedules.release(scheduleId);
  return true;
}

/** Champs du document `subscription` qui décrivent un changement programmé. */
export const SCHEDULED_CHANGE_FIELDS = {
  scheduledPlan: 1,
  scheduledIsAnnual: 1,
  scheduledPlanAt: 1,
  stripeScheduleId: 1,
};

/** Date au format « 15 décembre 2026 ». */
export function formatChangeDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}
