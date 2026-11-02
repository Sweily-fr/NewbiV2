// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  baseItemOf,
  packQuantityFromItems,
  quotaBytesWith,
  setStoragePacks,
  StoragePackError,
  subscriptionInterval,
  syncStoragePacksFromStripe,
} from "@/src/lib/storage-packs";

const GB = 1_000_000_000;
const orgId = "507f1f77bcf86cd799439022";

function fakeDb({ subscription, usage } = {}) {
  const writes = [];
  return {
    writes,
    collection(name) {
      if (name === "subscription") {
        return { findOne: async () => subscription || null };
      }
      if (name === "workspace_storage_usage") {
        return {
          findOne: async () => usage || null,
          updateOne: async (filter, update, options) => {
            writes.push({ filter, update, options });
            return { modifiedCount: 1 };
          },
        };
      }
      throw new Error(`Collection inattendue : ${name}`);
    },
  };
}

function fakeStripe(items) {
  return {
    subscriptions: {
      retrieve: vi.fn(async () => ({ id: "sub_1", items: { data: items } })),
    },
    subscriptionItems: {
      create: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
      del: vi.fn(async () => ({})),
    },
  };
}

const monthlyBase = {
  id: "si_base",
  quantity: 1,
  price: { id: "price_freelance_m", recurring: { interval: "month" } },
};
const yearlyBase = {
  id: "si_base",
  quantity: 1,
  price: { id: "price_freelance_y", recurring: { interval: "year" } },
};
const packItem = (quantity, priceId = "price_pack_m") => ({
  id: "si_pack",
  quantity,
  price: { id: priceId, recurring: { interval: "month" } },
});
const activeSubscription = {
  referenceId: orgId,
  plan: "freelance",
  status: "active",
  stripeSubscriptionId: "sub_1",
};

beforeEach(() => {
  vi.stubEnv("STRIPE_STORAGE_PACK_MONTHLY_PRICE_ID", "price_pack_m");
  vi.stubEnv("STRIPE_STORAGE_PACK_YEARLY_PRICE_ID", "price_pack_y");
  vi.stubEnv("STRIPE_SEAT_PRICE_ID", "price_seat");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Packs de stockage : lecture de l'abonnement Stripe", () => {
  it("distingue l'offre, les sièges et les packs", () => {
    const items = [
      packItem(2),
      { id: "si_seat", quantity: 3, price: { id: "price_seat" } },
      monthlyBase,
    ];
    expect(baseItemOf(items).id).toBe("si_base");
    expect(packQuantityFromItems(items)).toBe(2);
    expect(subscriptionInterval({ items: { data: items } })).toBe("month");
    expect(subscriptionInterval({ items: { data: [yearlyBase] } })).toBe(
      "year",
    );
  });

  it("calcule le quota avec les packs (50 Go chacun)", () => {
    expect(quotaBytesWith("freelance", 0)).toBe(75 * GB);
    expect(quotaBytesWith("pro", 2)).toBe(500 * GB);
    expect(quotaBytesWith("enterprise", 1)).toBe(1050 * GB);
  });
});

describe("Packs de stockage : achat et retrait", () => {
  it("ajoute l'article au prix mensuel et recopie le nombre de packs", async () => {
    const db = fakeDb({ subscription: activeSubscription });
    const stripe = fakeStripe([monthlyBase]);
    const result = await setStoragePacks({
      mongoDb: db,
      stripe,
      organizationId: orgId,
      quantity: 2,
    });
    expect(result).toEqual({ quantity: 2, interval: "month" });
    expect(stripe.subscriptionItems.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription: "sub_1",
        price: "price_pack_m",
        quantity: 2,
        proration_behavior: "create_prorations",
      }),
      expect.any(Object),
    );
    expect(db.writes[0].update.$set.packs).toMatchObject({
      quantity: 2,
      interval: "month",
    });
  });

  it("prend le prix annuel pour un abonnement annuel", async () => {
    const stripe = fakeStripe([yearlyBase]);
    await setStoragePacks({
      mongoDb: fakeDb({ subscription: activeSubscription }),
      stripe,
      organizationId: orgId,
      quantity: 1,
    });
    expect(stripe.subscriptionItems.create.mock.calls[0][0].price).toBe(
      "price_pack_y",
    );
  });

  it("est indisponible sans le prix de l'intervalle", async () => {
    vi.stubEnv("STRIPE_STORAGE_PACK_YEARLY_PRICE_ID", "");
    const error = await setStoragePacks({
      mongoDb: fakeDb({ subscription: activeSubscription }),
      stripe: fakeStripe([yearlyBase]),
      organizationId: orgId,
      quantity: 1,
    }).catch((e) => e);
    expect(error).toBeInstanceOf(StoragePackError);
    expect(error.status).toBe(409);
  });

  it("refuse sans abonnement actif", async () => {
    const error = await setStoragePacks({
      mongoDb: fakeDb({ subscription: null }),
      stripe: fakeStripe([monthlyBase]),
      organizationId: orgId,
      quantity: 1,
    }).catch((e) => e);
    expect(error.status).toBe(409);
  });

  it("refuse un retrait qui ferait dépasser le quota", async () => {
    const stripe = fakeStripe([monthlyBase, packItem(2)]);
    const error = await setStoragePacks({
      mongoDb: fakeDb({
        subscription: activeSubscription,
        usage: { totalBytes: 140 * GB, computedAt: new Date() },
      }),
      stripe,
      organizationId: orgId,
      quantity: 1,
    }).catch((e) => e);
    expect(error.status).toBe(409);
    expect(error.message).toMatch(/dépasserait le quota/);
    expect(stripe.subscriptionItems.update).not.toHaveBeenCalled();
  });

  it("retire un pack quand l'espace tient encore", async () => {
    const stripe = fakeStripe([monthlyBase, packItem(2)]);
    await setStoragePacks({
      mongoDb: fakeDb({
        subscription: activeSubscription,
        usage: { totalBytes: 100 * GB, computedAt: new Date() },
      }),
      stripe,
      organizationId: orgId,
      quantity: 1,
    });
    expect(stripe.subscriptionItems.update).toHaveBeenCalledWith(
      "si_pack",
      expect.objectContaining({ quantity: 1 }),
      expect.any(Object),
    );
  });

  it("supprime l'article quand il ne reste aucun pack", async () => {
    const stripe = fakeStripe([monthlyBase, packItem(1)]);
    await setStoragePacks({
      mongoDb: fakeDb({
        subscription: activeSubscription,
        usage: { totalBytes: GB, computedAt: new Date() },
      }),
      stripe,
      organizationId: orgId,
      quantity: 0,
    });
    expect(stripe.subscriptionItems.del).toHaveBeenCalledWith(
      "si_pack",
      expect.objectContaining({ proration_behavior: "create_prorations" }),
    );
  });

  it("refuse un retrait tant que l'espace utilisé n'est pas calculé", async () => {
    const error = await setStoragePacks({
      mongoDb: fakeDb({ subscription: activeSubscription, usage: null }),
      stripe: fakeStripe([monthlyBase, packItem(1)]),
      organizationId: orgId,
      quantity: 0,
    }).catch((e) => e);
    expect(error.status).toBe(409);
  });

  it("refuse un nombre de packs invalide", async () => {
    for (const quantity of [-1, 1.5, "x", 500]) {
      const error = await setStoragePacks({
        mongoDb: fakeDb({ subscription: activeSubscription }),
        stripe: fakeStripe([monthlyBase]),
        organizationId: orgId,
        quantity,
      }).catch((e) => e);
      expect(error.status).toBe(400);
    }
  });
});

describe("Packs de stockage : webhooks Stripe", () => {
  it("recopie le nombre de packs d'un abonnement modifié", async () => {
    const db = fakeDb({ subscription: activeSubscription, usage: {} });
    const result = await syncStoragePacksFromStripe(db, {
      id: "sub_1",
      items: { data: [monthlyBase, packItem(3)] },
    });
    expect(result).toMatchObject({ organizationId: orgId, quantity: 3 });
    expect(db.writes[0].update.$set.packs.quantity).toBe(3);
  });

  it("remet les packs à zéro quand l'abonnement est supprimé", async () => {
    const db = fakeDb({
      subscription: activeSubscription,
      usage: { packs: { quantity: 2 } },
    });
    await syncStoragePacksFromStripe(
      db,
      { id: "sub_1", items: { data: [monthlyBase, packItem(2)] } },
      { deleted: true },
    );
    expect(db.writes[0].update.$set.packs.quantity).toBe(0);
  });

  it("n'écrit rien pour un espace sans pack", async () => {
    const db = fakeDb({ subscription: activeSubscription, usage: null });
    expect(
      await syncStoragePacksFromStripe(db, {
        id: "sub_1",
        items: { data: [monthlyBase] },
      }),
    ).toBeNull();
    expect(db.writes).toHaveLength(0);
  });
});
