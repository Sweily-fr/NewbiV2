/**
 * Packs de stockage (+50 Go) : article avec quantité sur l'abonnement Stripe
 * existant de l'espace. Côté serveur seulement.
 *
 * Stripe exige le même intervalle pour tous les articles d'un abonnement :
 * un prix mensuel (STRIPE_STORAGE_PACK_MONTHLY_PRICE_ID, 2,99 € TTC) et un
 * prix annuel (STRIPE_STORAGE_PACK_YEARLY_PRICE_ID, 29,90 € TTC). Sans la
 * variable de l'intervalle de l'abonnement, l'achat de packs est indisponible
 * (seule la montée en gamme est proposée).
 *
 * Le nombre de packs actifs est recopié dans la collection
 * workspace_storage_usage (champ `packs`), que l'API lit pour le quota.
 */
import {
  BYTES_PER_GB,
  normalizeStoragePlan,
  planStorageGb,
  STORAGE_PACK_GB,
} from "@/src/lib/storage-plans";

export const STORAGE_USAGE_COLLECTION = "workspace_storage_usage";

export function storagePackPriceIds() {
  return {
    month: process.env.STRIPE_STORAGE_PACK_MONTHLY_PRICE_ID || null,
    year: process.env.STRIPE_STORAGE_PACK_YEARLY_PRICE_ID || null,
  };
}

export function isStoragePackPrice(priceId) {
  if (!priceId) return false;
  const { month, year } = storagePackPriceIds();
  return priceId === month || priceId === year;
}

/** Prix du pack pour l'intervalle de l'abonnement, null s'il manque. */
export function storagePackPriceFor(interval) {
  const ids = storagePackPriceIds();
  return interval === "year" ? ids.year : ids.month;
}

const itemPriceId = (item) => item?.price?.id || item?.price || null;

/** Article de l'offre : ni siège, ni pack de stockage. */
export function baseItemOf(items = []) {
  return (
    items.find((item) => {
      const priceId = itemPriceId(item);
      return (
        priceId !== process.env.STRIPE_SEAT_PRICE_ID &&
        !isStoragePackPrice(priceId)
      );
    }) || null
  );
}

export function storagePackItemOf(items = []) {
  return items.find((item) => isStoragePackPrice(itemPriceId(item))) || null;
}

export function packQuantityFromItems(items = []) {
  return items
    .filter((item) => isStoragePackPrice(itemPriceId(item)))
    .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

/** Intervalle de facturation de l'abonnement (celui de l'offre). */
export function subscriptionInterval(stripeSubscription) {
  const items = stripeSubscription?.items?.data || [];
  const base = baseItemOf(items) || items[0];
  return base?.price?.recurring?.interval === "year" ? "year" : "month";
}

/** Quota de l'espace avec `packs` packs, en octets. */
export function quotaBytesWith(plan, packs) {
  return (
    (planStorageGb(normalizeStoragePlan(plan)) +
      Math.max(0, Number(packs) || 0) * STORAGE_PACK_GB) *
    BYTES_PER_GB
  );
}

/** Recopie le nombre de packs actifs pour l'API (nouvelle collection). */
export async function writeStoragePacks(mongoDb, organizationId, packs) {
  await mongoDb.collection(STORAGE_USAGE_COLLECTION).updateOne(
    { workspaceId: String(organizationId) },
    {
      $set: {
        packs: {
          quantity: Math.max(0, Number(packs.quantity) || 0),
          interval: packs.interval || null,
          updatedAt: new Date(),
        },
      },
      $setOnInsert: { workspaceId: String(organizationId) },
    },
    { upsert: true },
  );
}

/**
 * Webhook Stripe (abonnement modifié ou supprimé) : nombre de packs relu sur
 * l'abonnement (achat ou retrait depuis le portail Stripe compris).
 */
export async function syncStoragePacksFromStripe(
  mongoDb,
  stripeSubscription,
  { deleted = false } = {},
) {
  if (!stripeSubscription?.id) return null;
  const doc = await mongoDb
    .collection("subscription")
    .findOne(
      { stripeSubscriptionId: stripeSubscription.id },
      { projection: { referenceId: 1 } },
    );
  if (!doc?.referenceId) return null;
  const quantity = deleted
    ? 0
    : packQuantityFromItems(stripeSubscription.items?.data || []);
  const existing = await mongoDb
    .collection(STORAGE_USAGE_COLLECTION)
    .findOne(
      { workspaceId: String(doc.referenceId) },
      { projection: { packs: 1 } },
    );
  // Rien à recopier pour un espace sans pack, ni avant ni après
  if (!existing && quantity === 0) return null;
  const packs = {
    quantity,
    interval: subscriptionInterval(stripeSubscription),
  };
  await writeStoragePacks(mongoDb, doc.referenceId, packs);
  return { organizationId: String(doc.referenceId), ...packs };
}

export class StoragePackError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Fixe le nombre total de packs de l'espace sur son abonnement Stripe.
 * Retrait refusé si l'espace dépasserait alors son quota.
 * @returns {Promise<{ quantity: number, interval: string }>}
 */
export async function setStoragePacks({
  mongoDb,
  stripe,
  organizationId,
  quantity,
}) {
  const target = typeof quantity === "number" ? quantity : Number.NaN;
  if (!Number.isInteger(target) || target < 0 || target > 200) {
    throw new StoragePackError(400, "Nombre de packs invalide.");
  }

  const subscription = await mongoDb.collection("subscription").findOne({
    referenceId: String(organizationId),
    status: { $in: ["active", "trialing", "past_due"] },
  });
  if (!subscription?.stripeSubscriptionId) {
    throw new StoragePackError(
      409,
      "Un abonnement actif est nécessaire pour ajouter du stockage.",
    );
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId,
  );
  const interval = subscriptionInterval(stripeSubscription);
  const priceId = storagePackPriceFor(interval);
  if (!priceId) {
    throw new StoragePackError(
      409,
      "L'ajout de stockage n'est pas disponible pour le moment.",
    );
  }

  const items = stripeSubscription.items?.data || [];
  const packItem = storagePackItemOf(items);
  const current = packQuantityFromItems(items);

  if (target < current) {
    const usage = await mongoDb
      .collection(STORAGE_USAGE_COLLECTION)
      .findOne(
        { workspaceId: String(organizationId) },
        { projection: { totalBytes: 1, computedAt: 1 } },
      );
    if (!usage?.computedAt) {
      throw new StoragePackError(
        409,
        "Le calcul de l'espace utilisé est en cours. Réessayez dans un instant.",
      );
    }
    if (usage.totalBytes > quotaBytesWith(subscription.plan, target)) {
      throw new StoragePackError(
        409,
        "Impossible de retirer ce stockage : l'espace utilisé dépasserait le quota. Supprimez d'abord des fichiers.",
      );
    }
  }

  const options = (suffix) => ({
    idempotencyKey: `storage-packs-${organizationId}-${target}-${suffix}-${Date.now()}`,
  });
  if (target === current && packItem?.price?.id === priceId) {
    return { quantity: target, interval };
  }
  if (target === 0) {
    if (packItem) {
      await stripe.subscriptionItems.del(packItem.id, {
        proration_behavior: "create_prorations",
      });
    }
  } else if (!packItem) {
    await stripe.subscriptionItems.create(
      {
        subscription: subscription.stripeSubscriptionId,
        price: priceId,
        quantity: target,
        proration_behavior: "create_prorations",
      },
      options("create"),
    );
  } else {
    await stripe.subscriptionItems.update(
      packItem.id,
      {
        price: priceId,
        quantity: target,
        proration_behavior: "create_prorations",
      },
      options("update"),
    );
  }

  await writeStoragePacks(mongoDb, organizationId, {
    quantity: target,
    interval,
  });
  return { quantity: target, interval };
}
