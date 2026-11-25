import { describe, it, expect, vi } from "vitest";

import {
  ANCIENS_PRIX_CONNUS,
  avecAnciensPrix,
  listeOffresAvecAnciensPrix,
} from "@/src/lib/stripe-anciens-prix";

/**
 * Les abonnés d'avant un changement de prix gardent leur ancien prix Stripe.
 * Sans lui dans la liste des offres, le module Stripe de Better Auth ignore
 * les événements d'un abonnement à plusieurs lignes (offre + sièges) :
 * renouvellement, impayé, résiliation (25/11/2026).
 */

const OFFRES = [
  {
    name: "freelance",
    priceId: "price_std_m_18",
    annualDiscountPriceId: "price_std_y_194",
    limits: { users: 1 },
  },
  {
    name: "pme",
    priceId: "price_pme_m_50",
    annualDiscountPriceId: "price_pme_y_540",
    limits: { users: 10 },
  },
];

// Même recherche que resolvePlanItem de @better-auth/stripe 1.7.20
function offreDesLignes(plans, lignes) {
  for (const ligne of lignes) {
    const plan = plans.find(
      (p) =>
        p.priceId === ligne.price.id ||
        p.annualDiscountPriceId === ligne.price.id,
    );
    if (plan) return plan;
  }
  return undefined;
}

function fauxStripe(prixParProduit, produitDuPrix) {
  return {
    prices: {
      retrieve: vi.fn(async (id) => ({ id, product: produitDuPrix[id] })),
      list: vi.fn(({ product }) => {
        const prix = prixParProduit[product] || [];
        return (async function* () {
          yield* prix;
        })();
      }),
    },
  };
}

describe("anciens prix Stripe des offres", () => {
  it("garde les offres actuelles en premier, pour la recherche par nom", () => {
    const plans = avecAnciensPrix(OFFRES, {
      pme: { month: ["price_pme_m_ancien"], year: [] },
    });
    expect(plans.slice(0, 2)).toEqual(OFFRES);
    expect(plans.find((p) => p.name === "pme").priceId).toBe("price_pme_m_50");
  });

  it("reconnaît un abonnement offre + sièges sur un ancien prix", () => {
    const plans = avecAnciensPrix(OFFRES, {
      pme: { month: [], year: ["price_pme_y_ancien"] },
    });
    const lignes = [
      { price: { id: "price_pme_y_ancien" } },
      { price: { id: "price_siege" } },
    ];
    expect(offreDesLignes(OFFRES, lignes)).toBeUndefined();
    const offre = offreDesLignes(plans, lignes);
    expect(offre.name).toBe("pme");
    expect(offre.limits).toEqual({ users: 10 });
  });

  it("ne duplique ni les prix actuels ni un ancien prix listé deux fois", () => {
    const plans = avecAnciensPrix(OFFRES, {
      freelance: {
        month: ["price_std_m_18", "price_std_m_ancien", "price_std_m_ancien"],
        year: [],
      },
    });
    expect(plans).toHaveLength(3);
  });

  it("lit les autres prix des produits Stripe, sans les sièges ni les prix ponctuels", async () => {
    const stripe = fauxStripe(
      {
        prod_premium: [
          { id: "price_pme_m_50", recurring: { interval: "month" } },
          { id: "price_pme_y_540", recurring: { interval: "year" } },
          { id: "price_pme_y_ancien", recurring: { interval: "year" } },
          { id: "price_pme_m_ancien", recurring: { interval: "month" } },
          { id: "price_siege", recurring: { interval: "month" } },
          { id: "price_ponctuel", recurring: null },
        ],
        prod_standard: [
          { id: "price_std_m_18", recurring: { interval: "month" } },
        ],
      },
      {
        price_std_m_18: "prod_standard",
        price_std_y_194: "prod_standard",
        price_pme_m_50: "prod_premium",
        price_pme_y_540: "prod_premium",
      },
    );
    const liste = listeOffresAvecAnciensPrix({
      stripe,
      plans: OFFRES,
      exclus: ["price_siege"],
    });
    const plans = await liste();
    const ids = (nom) =>
      plans
        .slice(2)
        .filter((p) => p.name === nom)
        .map((p) => p.priceId || p.annualDiscountPriceId);

    expect(ids("pme").sort()).toEqual([
      "price_pme_m_ancien",
      "price_pme_y_ancien",
    ]);
    expect(ids("freelance").sort()).toEqual(
      [
        ...ANCIENS_PRIX_CONNUS.freelance.month,
        ...ANCIENS_PRIX_CONNUS.freelance.year,
      ].sort(),
    );
    expect(plans.some((p) => p.priceId === "price_siege")).toBe(false);

    // Lu une fois, puis gardé en mémoire
    await liste();
    expect(stripe.prices.list).toHaveBeenCalledTimes(2);
  });

  it("retombe sur les anciens prix connus si Stripe ne répond pas", async () => {
    const stripe = {
      prices: {
        retrieve: vi.fn(async () => {
          throw new Error("Stripe indisponible");
        }),
      },
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const plans = await listeOffresAvecAnciensPrix({ stripe, plans: OFFRES })();
    expect(plans.slice(0, 2)).toEqual(OFFRES);
    expect(
      offreDesLignes(plans, [
        { price: { id: ANCIENS_PRIX_CONNUS.freelance.month[0] } },
        { price: { id: "price_siege" } },
      ]).name,
    ).toBe("freelance");
  });
});
