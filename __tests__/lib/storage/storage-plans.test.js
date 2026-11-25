import { describe, it, expect } from "vitest";
import {
  BYTES_PER_GB,
  canBuyStoragePacks,
  describeStorageOffer,
  findStorageQuotaError,
  formatStorageBytes,
  normalizeStoragePlan,
  packPriceLabel,
  planStorageGb,
  storageLevel,
} from "@/src/lib/storage-plans";
import { PLAN_FEATURES_SECTIONS, PLANS_DISPLAY } from "@/src/lib/plans-display";

const GB = BYTES_PER_GB;

const offer = {
  neededBytes: 101 * GB,
  currentMonthlyCost: 17.99,
  recommended: "packs",
  packs: {
    additionalPacks: 1,
    totalPacks: 1,
    monthlyCost: 20.98,
    extraMonthlyCost: 2.99,
    billedPrice: 2.99,
    interval: "month",
    addedBytes: 50 * GB,
  },
  upgrade: {
    plan: "pme",
    label: "Premium",
    packs: 0,
    planMonthlyPrice: 50,
    monthlyCost: 50,
    quotaBytes: 500 * GB,
  },
};

describe("Stockage : quotas par organisation", () => {
  it("donne 100 Go, 500 Go et 5 To selon l'offre, quel que soit le nombre d'utilisateurs", () => {
    expect(planStorageGb("freelance")).toBe(100);
    expect(planStorageGb("pme")).toBe(500);
    expect(planStorageGb("pro")).toBe(500);
    expect(planStorageGb("entreprise")).toBe(5000);
    expect(planStorageGb("enterprise")).toBe(5000);
    expect(normalizeStoragePlan(undefined)).toBe("freelance");
  });

  it("ne vend des packs que sur l'offre Entreprise", () => {
    expect(canBuyStoragePacks("freelance")).toBe(false);
    expect(canBuyStoragePacks("pme")).toBe(false);
    expect(canBuyStoragePacks("pro")).toBe(false);
    expect(canBuyStoragePacks("entreprise")).toBe(true);
    expect(canBuyStoragePacks("enterprise")).toBe(true);
    expect(canBuyStoragePacks(undefined)).toBe(false);
  });

  it("affiche 100 Go, 500 Go et 5 To dans la grille des offres, packs sur Entreprise seulement, sans toucher aux prix", () => {
    const row = PLAN_FEATURES_SECTIONS.flatMap((s) => s.features).find(
      (f) => f.name === "Stockage documents",
    );
    expect(row).toMatchObject({
      freelance: "100 Go",
      pme: "500 Go",
      entreprise: "5 To",
    });
    const packs = PLAN_FEATURES_SECTIONS.flatMap((s) => s.features).find(
      (f) => f.name === "Stockage supplémentaire",
    );
    expect(packs.freelance).toBe(false);
    expect(packs.pme).toBe(false);
    expect(packs.entreprise).toMatch(/\+50 Go/);
    expect(
      PLANS_DISPLAY.map((p) => [p.monthlyPrice, p.annualMonthlyPrice]),
    ).toEqual([
      [18, 194 / 12],
      [50, 45],
      [200, 180],
    ]);
  });
});

describe("Stockage : affichage", () => {
  it("écrit les tailles en unités françaises", () => {
    expect(formatStorageBytes(75 * GB)).toBe("75 Go");
    expect(formatStorageBytes(1000 * GB)).toBe("1 To");
    expect(formatStorageBytes(1.25 * GB)).toBe("1,3 Go");
    expect(formatStorageBytes(5_000_000)).toBe("5 Mo");
  });

  it("donne le prix d'un pack selon l'intervalle", () => {
    expect(packPriceLabel("month")).toBe("2,99 € TTC/mois");
    expect(packPriceLabel("year")).toBe("29,90 € TTC/an");
  });

  it("passe en alerte à 80 % et à 100 %", () => {
    expect(storageLevel(59 * GB, 75 * GB)).toBe("ok");
    expect(storageLevel(60 * GB, 75 * GB)).toBe("warning");
    expect(storageLevel(75 * GB, 75 * GB)).toBe("full");
  });
});

describe("Stockage : propositions", () => {
  it("propose un pack et l'offre supérieure avec leurs prix", () => {
    const described = describeStorageOffer(offer, { packsAvailable: true });
    expect(described.packs.title).toBe("Ajouter 1 pack de 50 Go");
    expect(described.packs.price).toBe("2,99 € TTC/mois de plus");
    expect(described.packs.total).toBe("Total : 20,98 € TTC/mois");
    expect(described.upgrade.title).toBe("Passer à l'offre Premium");
    expect(described.upgrade.quota).toBe("500 Go");
    expect(described.upgrade.price).toBe("50,00 € TTC/mois");
    expect(described.recommended).toBe("packs");
  });

  it("Standard et Premium : l'API ne propose que l'offre supérieure, mise en avant", () => {
    const described = describeStorageOffer(
      { ...offer, packs: null, recommended: "upgrade" },
      { packsAvailable: true },
    );
    expect(described.packs).toBeNull();
    expect(described.upgrade.title).toBe("Passer à l'offre Premium");
    expect(described.upgrade.quota).toBe("500 Go");
    expect(described.recommended).toBe("upgrade");
  });

  it("masque les packs quand les prix Stripe manquent : seule la montée en gamme reste", () => {
    const described = describeStorageOffer(offer, { packsAvailable: false });
    expect(described.packs).toBeNull();
    expect(described.recommended).toBe("upgrade");
  });

  it("garde l'offre supérieure mise en avant par l'API", () => {
    const described = describeStorageOffer(
      { ...offer, recommended: "upgrade" },
      { packsAvailable: true },
    );
    expect(described.recommended).toBe("upgrade");
  });

  it("ne propose que des packs sur Entreprise, au prix annuel si l'abonnement l'est", () => {
    const described = describeStorageOffer(
      {
        ...offer,
        upgrade: null,
        packs: { ...offer.packs, additionalPacks: 2, interval: "year" },
      },
      { packsAvailable: true },
    );
    expect(described.upgrade).toBeNull();
    expect(described.packs.title).toBe("Ajouter 2 packs de 50 Go");
    expect(described.packs.price).toBe("59,80 € TTC/an de plus");
  });
});

describe("Stockage : refus d'envoi", () => {
  it("reconnaît le code STORAGE_QUOTA_EXCEEDED dans une erreur Apollo ou un résultat", () => {
    const gqlError = {
      message: "Espace de stockage plein",
      extensions: { code: "STORAGE_QUOTA_EXCEEDED", details: { offer } },
    };
    expect(findStorageQuotaError({ graphQLErrors: [gqlError] })).toBe(gqlError);
    expect(findStorageQuotaError({ errors: [gqlError] })).toBe(gqlError);
    expect(
      findStorageQuotaError({
        graphQLErrors: [{ extensions: { code: "FORBIDDEN" } }],
      }),
    ).toBeNull();
  });
});

describe("Stockage : message du refus", () => {
  it("garde tel quel le message de l'API", async () => {
    const { getErrorMessage } = await import("@/src/utils/errorMessages");
    const message =
      "Espace de stockage plein : 74 Go utilisés sur 75 Go. Ce fichier (2 Go) ne peut pas être enregistré.";
    expect(
      getErrorMessage(
        {
          message,
          graphQLErrors: [
            { message, extensions: { code: "STORAGE_QUOTA_EXCEEDED" } },
          ],
        },
        "upload",
      ),
    ).toBe(message);
  });
});
