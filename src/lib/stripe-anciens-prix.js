/**
 * Anciens prix Stripe des offres.
 *
 * Changer le prix d'une offre (variables STRIPE_*_PRICE_ID) ne touche que les
 * nouveaux abonnements : les abonnés d'avant gardent leur prix dans Stripe.
 * Or le module Stripe de Better Auth reconnaît une offre à l'ID de prix de
 * l'abonnement, et quand un abonnement a plusieurs lignes (offre + sièges, ou
 * offre + pack de stockage) dont aucune n'a un prix connu, il IGNORE tout
 * l'événement : renouvellement, impayé ou résiliation ne sont plus notés.
 * C'est arrivé le 25/11/2026, quand Premium et Entreprise ont changé de prix.
 *
 * On ajoute donc à la liste des offres une copie de chaque offre par ancien
 * prix (même nom, mêmes limites). La recherche par nom (paiement, affichage)
 * trouve toujours l'offre actuelle, placée en premier ; la recherche par prix
 * (webhooks) retrouve aussi les anciens.
 *
 * Les anciens prix viennent :
 * - des autres prix récurrents des produits Stripe des offres actuelles
 *   (Premium et Entreprise ont gardé leur produit), lus une fois par heure ;
 * - de la liste ANCIENS_PRIX_CONNUS, pour les prix d'un autre produit.
 */

// Standard est passé de 17,99 € à 18 € le 25/11/2026 : ses anciens prix sont
// listés ici au cas où les nouveaux soient sur un autre produit Stripe.
export const ANCIENS_PRIX_CONNUS = {
  freelance: {
    month: ["price_1SD1sDKC7DkMHAp8XznGd44G"],
    year: ["price_1SD1soKC7DkMHAp82Y3rg0wU"],
  },
};

const DUREE_CACHE_MS = 60 * 60 * 1000;
const DUREE_CACHE_ECHEC_MS = 5 * 60 * 1000;

function vide() {
  return { month: [], year: [] };
}

/**
 * Copies des offres pour chaque ancien prix, à placer APRÈS les offres
 * actuelles. `anciens` : { [nomOffre]: { month: [ids], year: [ids] } }.
 */
export function avecAnciensPrix(plans, anciens) {
  const connus = new Set(
    plans.flatMap((p) => [p.priceId, p.annualDiscountPriceId]).filter(Boolean),
  );
  const copies = [];
  for (const plan of plans) {
    const prix = anciens?.[plan.name] || vide();
    for (const id of new Set(prix.month)) {
      if (!id || connus.has(id)) continue;
      connus.add(id);
      copies.push({ ...plan, priceId: id, annualDiscountPriceId: undefined });
    }
    for (const id of new Set(prix.year)) {
      if (!id || connus.has(id)) continue;
      connus.add(id);
      copies.push({ ...plan, priceId: undefined, annualDiscountPriceId: id });
    }
  }
  return [...plans, ...copies];
}

function fusionner(a, b) {
  const res = {};
  for (const nom of new Set([...Object.keys(a), ...Object.keys(b)])) {
    res[nom] = {
      month: [...(a[nom]?.month || []), ...(b[nom]?.month || [])],
      year: [...(a[nom]?.year || []), ...(b[nom]?.year || [])],
    };
  }
  return res;
}

/**
 * Autres prix récurrents des produits Stripe des offres actuelles, rangés par
 * offre et par rythme. `exclus` : prix qui ne sont jamais une offre (sièges,
 * packs de stockage, crédits), même s'ils partagent un produit.
 */
export async function anciensPrixDesProduits(stripe, plans, exclus = []) {
  const ignorer = new Set([
    ...exclus.filter(Boolean),
    ...plans.flatMap((p) => [p.priceId, p.annualDiscountPriceId]),
  ]);
  const produits = new Map(); // produit -> nom de l'offre
  for (const plan of plans) {
    for (const id of [plan.priceId, plan.annualDiscountPriceId]) {
      if (!id) continue;
      const prix = await stripe.prices.retrieve(id);
      const produit =
        typeof prix.product === "string" ? prix.product : prix.product?.id;
      if (produit && !produits.has(produit)) produits.set(produit, plan.name);
    }
  }
  const res = {};
  for (const [produit, nom] of produits) {
    res[nom] = res[nom] || vide();
    // Sans filtre `active` : les prix archivés restent ceux des anciens abonnés.
    for await (const prix of stripe.prices.list({
      product: produit,
      limit: 100,
    })) {
      if (ignorer.has(prix.id) || !prix.recurring) continue;
      if (prix.recurring.interval === "month") res[nom].month.push(prix.id);
      else if (prix.recurring.interval === "year") res[nom].year.push(prix.id);
    }
  }
  return res;
}

/**
 * Liste des offres pour Better Auth (`subscription.plans` accepte une
 * fonction asynchrone), avec les anciens prix. Lue une fois par heure ; si
 * Stripe ne répond pas, les offres actuelles et ANCIENS_PRIX_CONNUS suffisent.
 */
export function listeOffresAvecAnciensPrix({ stripe, plans, exclus = [] }) {
  let cache = null;
  return async () => {
    if (cache && Date.now() < cache.jusqua) return cache.plans;
    try {
      const lus = await anciensPrixDesProduits(stripe, plans, exclus);
      const resultat = avecAnciensPrix(
        plans,
        fusionner(ANCIENS_PRIX_CONNUS, lus),
      );
      cache = { plans: resultat, jusqua: Date.now() + DUREE_CACHE_MS };
      return resultat;
    } catch (error) {
      console.error(
        "⚠️ [STRIPE] Anciens prix des offres illisibles :",
        error?.message,
      );
      const resultat = avecAnciensPrix(plans, ANCIENS_PRIX_CONNUS);
      cache = { plans: resultat, jusqua: Date.now() + DUREE_CACHE_ECHEC_MS };
      return resultat;
    }
  };
}
