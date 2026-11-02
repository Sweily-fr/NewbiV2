/**
 * Stockage des espaces : affichage côté site (tailles, packs, propositions).
 *
 * Le quota et l'espace utilisé sont calculés par l'API (requête
 * workspaceStorage) ; ce module ne fait que les présenter. Les réglages
 * (quota par offre, pack de 50 Go, prix) sont le miroir de
 * newbi-api/src/services/storage/storageConfig.js : les deux doivent bouger
 * ensemble. Pas d'import serveur ici (consommé par des composants client).
 */
import { PLAN_LIMITS } from "@/src/lib/plan-limits";
import { getPlanDisplay } from "@/src/lib/plans-display";

export const BYTES_PER_GB = 1_000_000_000;
export const STORAGE_PACK_GB = 50;
export const STORAGE_PACK_PRICES = { month: 2.99, year: 29.9 };
export const STORAGE_QUOTA_EXCEEDED = "STORAGE_QUOTA_EXCEEDED";

// Événement émis quand un envoi est refusé faute de place (detail : details
// de l'erreur GraphQL), écouté par la fenêtre de proposition
export const STORAGE_QUOTA_EVENT = "newbi:storage-quota-exceeded";

/** Quota de l'offre, en Go (75 / 400 / 1 000). */
export function planStorageGb(planKey) {
  const key = normalizeStoragePlan(planKey);
  return PLAN_LIMITS[key]?.storage ?? PLAN_LIMITS.freelance.storage;
}

/** « pro » et « pme » = TPE ; « enterprise » et « entreprise » = Entreprise. */
export function normalizeStoragePlan(plan) {
  const value = String(plan || "").toLowerCase();
  if (value === "pro" || value === "pme" || value === "tpe") return "pme";
  if (value === "entreprise" || value === "enterprise") return "entreprise";
  return "freelance";
}

/** « 1,5 Go », « 400 Go », « 1 To », « 12 Mo ». */
export function formatStorageBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  const fmt = (n) => {
    const rounded = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
    return String(rounded).replace(".", ",");
  };
  if (value >= 1000 * BYTES_PER_GB) {
    return `${fmt(value / (1000 * BYTES_PER_GB))} To`;
  }
  if (value >= BYTES_PER_GB) return `${fmt(value / BYTES_PER_GB)} Go`;
  if (value >= 1_000_000) return `${fmt(value / 1_000_000)} Mo`;
  if (value >= 1000) return `${fmt(value / 1000)} Ko`;
  if (value === 0) return "0 Go";
  return `${Math.round(value)} octets`;
}

export function formatEuros(amount) {
  return `${Number(amount || 0)
    .toFixed(2)
    .replace(".", ",")} €`;
}

/** « 2,99 € TTC/mois » ou « 29,90 € TTC/an ». */
export function packPriceLabel(interval) {
  return interval === "year"
    ? `${formatEuros(STORAGE_PACK_PRICES.year)} TTC/an`
    : `${formatEuros(STORAGE_PACK_PRICES.month)} TTC/mois`;
}

/**
 * Textes de la proposition affichée quand l'espace manque de place.
 * @param {object} offer proposition calculée par l'API (StorageOffer)
 * @param {{ packsAvailable: boolean, interval?: string }} options packs
 *   masqués quand les prix Stripe ne sont pas configurés
 * @returns {{ packs: object|null, upgrade: object|null, recommended: string|null }}
 */
export function describeStorageOffer(offer, { packsAvailable, interval } = {}) {
  if (!offer) return { packs: null, upgrade: null, recommended: null };
  const billing = offer.packs?.interval || interval || "month";
  const packs =
    packsAvailable && offer.packs
      ? {
          quantity: offer.packs.additionalPacks,
          totalPacks: offer.packs.totalPacks,
          title:
            offer.packs.additionalPacks > 1
              ? `Ajouter ${offer.packs.additionalPacks} packs de ${STORAGE_PACK_GB} Go`
              : `Ajouter 1 pack de ${STORAGE_PACK_GB} Go`,
          price:
            billing === "year"
              ? `${formatEuros(offer.packs.additionalPacks * STORAGE_PACK_PRICES.year)} TTC/an de plus`
              : `${formatEuros(offer.packs.extraMonthlyCost)} TTC/mois de plus`,
          total: `Total : ${formatEuros(offer.packs.monthlyCost)} TTC/mois`,
        }
      : null;

  const upgrade = offer.upgrade
    ? {
        plan: offer.upgrade.plan,
        label: offer.upgrade.label,
        title: `Passer à l'offre ${offer.upgrade.label}`,
        quota: formatStorageBytes(offer.upgrade.quotaBytes),
        price: `${formatEuros(offer.upgrade.monthlyCost)} TTC/mois`,
        detail:
          offer.upgrade.packs > 0
            ? `${getPlanDisplay(offer.upgrade.plan)?.displayName || offer.upgrade.label} et ${offer.upgrade.packs} pack${offer.upgrade.packs > 1 ? "s" : ""} de ${STORAGE_PACK_GB} Go`
            : null,
      }
    : null;

  let recommended = offer.recommended || null;
  if (!packs && upgrade) recommended = "upgrade";
  if (packs && !upgrade) recommended = "packs";
  if (!packs && !upgrade) recommended = null;
  return { packs, upgrade, recommended };
}

/** Niveau d'alerte : ok, warning (80 %), full (100 %). */
export function storageLevel(usedBytes, quotaBytes) {
  if (!quotaBytes) return "ok";
  const ratio = usedBytes / quotaBytes;
  if (ratio >= 1) return "full";
  if (ratio >= 0.8) return "warning";
  return "ok";
}

/** Erreur GraphQL de refus faute de stockage, ou null. */
export function findStorageQuotaError(error) {
  const list = [
    ...(error?.graphQLErrors || []),
    ...(error?.errors || []),
    ...(Array.isArray(error) ? error : []),
    ...(error?.cause?.graphQLErrors || []),
  ];
  return (
    list.find(
      (e) =>
        e?.extensions?.code === STORAGE_QUOTA_EXCEEDED ||
        e?.extensions?.exception?.code === STORAGE_QUOTA_EXCEEDED,
    ) || null
  );
}
