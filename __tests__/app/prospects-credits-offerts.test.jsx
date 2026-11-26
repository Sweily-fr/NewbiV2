import { describe, it, expect } from "vitest";
import {
  describeProspectQuota,
  splitNonExpiringCredits,
} from "@/app/dashboard/clients/components/generate-prospects-dialog";

/**
 * Crédits de prospection offerts par Newbi (geste commercial depuis le
 * back-office) : comptés dans le solde, jamais affichés comme achetés.
 */
const quota = (extra = {}) => ({
  plan: "entreprise",
  monthlyCredits: 100,
  monthlyRemaining: 0,
  purchasedRemaining: 0,
  offeredRemaining: 0,
  available: 0,
  nextPlan: null,
  ...extra,
});

describe("crédits sans expiration", () => {
  it("sépare les achetés des offerts", () => {
    expect(
      splitNonExpiringCredits({ purchasedRemaining: 45, offeredRemaining: 20 }),
    ).toEqual({ total: 45, bought: 25, offered: 20 });
    // API d'avant le champ : tout est compté comme acheté
    expect(splitNonExpiringCredits({ purchasedRemaining: 5 })).toEqual({
      total: 5,
      bought: 5,
      offered: 0,
    });
    // Jamais plus d'offerts que de crédits sans expiration
    expect(
      splitNonExpiringCredits({ purchasedRemaining: 3, offeredRemaining: 9 }),
    ).toEqual({ total: 3, bought: 0, offered: 3 });
  });
});

describe("en-tête de la fenêtre", () => {
  it("crédits achetés seuls : inchangé", () => {
    expect(
      describeProspectQuota(quota({ purchasedRemaining: 5, available: 5 })),
    ).toBe("5 crédits achetés disponibles");
  });

  it("crédits offerts seuls : jamais « achetés »", () => {
    const text = describeProspectQuota(
      quota({ purchasedRemaining: 10, offeredRemaining: 10, available: 10 }),
    );
    expect(text).toBe("10 crédits offerts par Newbi disponibles");
    expect(text).not.toMatch(/achet/);
  });

  it("crédits du mois, achetés et offerts", () => {
    expect(
      describeProspectQuota(
        quota({
          monthlyRemaining: 20,
          purchasedRemaining: 15,
          offeredRemaining: 10,
          available: 35,
        }),
      ),
    ).toBe("35 crédits disponibles, dont 5 achetés et 10 offerts par Newbi");
    expect(
      describeProspectQuota(
        quota({
          monthlyRemaining: 20,
          purchasedRemaining: 1,
          offeredRemaining: 1,
          available: 21,
        }),
      ),
    ).toBe("21 crédits disponibles, dont 1 offert par Newbi");
  });
});
