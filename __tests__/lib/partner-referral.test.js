import { describe, it, expect, vi } from "vitest";
import { ObjectId } from "mongodb";
import {
  calculateCommissionTier,
  normalizePartnerCode,
  recordPartnerCommission,
  resolvePartnerCode,
} from "@/src/lib/partner-referral";

const partnerId = new ObjectId();
const ownerId = new ObjectId();
const orgId = new ObjectId();
const subId = new ObjectId();

function fakeDb({
  referredBy = "CODEPARTENAIRE",
  existing = null,
  history = [],
} = {}) {
  const inserted = [];
  const users = [
    { _id: partnerId, referralCode: "CODEPARTENAIRE", isPartner: true },
    { _id: ownerId, referredBy },
  ];
  const db = {
    inserted,
    collection: (name) => {
      if (name === "user") {
        return {
          findOne: vi.fn(async (q) => {
            if (q._id)
              return users.find((u) => String(u._id) === String(q._id)) || null;
            return (
              users.find(
                (u) =>
                  u.referralCode === q.referralCode &&
                  u.isPartner === q.isPartner,
              ) || null
            );
          }),
        };
      }
      if (name === "partnercommissions") {
        return {
          findOne: vi.fn(async () => existing),
          find: vi.fn(() => ({ toArray: async () => history })),
          insertOne: vi.fn(async (d) => inserted.push(d)),
        };
      }
      if (name === "subscription") {
        return {
          findOne: vi.fn(async () => ({
            _id: subId,
            referenceId: orgId.toHexString(),
          })),
        };
      }
      if (name === "member") {
        return {
          findOne: vi.fn(async () => ({
            userId: ownerId,
            organizationId: orgId,
            role: "owner",
          })),
        };
      }
      throw new Error(name);
    },
  };
  return db;
}

const facture = { id: "in_1", subscription: "sub_1", amount_paid: 2159 };

describe("Programme partenaire", () => {
  it("code : forme contrôlée", () => {
    expect(normalizePartnerCode(" ABCD1234 ")).toBe("ABCD1234");
    for (const v of [{ $ne: null }, "", "a b", "x", "<script>", null]) {
      expect(normalizePartnerCode(v)).toBeNull();
    }
  });

  it("code gardé seulement s'il est celui d'un partenaire", async () => {
    const db = fakeDb();
    expect(await resolvePartnerCode(db, "CODEPARTENAIRE")).toBe(
      "CODEPARTENAIRE",
    );
    expect(await resolvePartnerCode(db, "INCONNU1")).toBeNull();
  });

  it("paliers identiques à l'API", () => {
    expect(calculateCommissionTier(0).percentage).toBe(20);
    expect(calculateCommissionTier(2000).percentage).toBe(25);
    expect(calculateCommissionTier(6000).percentage).toBe(30);
    expect(calculateCommissionTier(20000).percentage).toBe(50);
  });

  it("paiement d'un filleul : commission confirmée pour son partenaire", async () => {
    const db = fakeDb();
    const r = await recordPartnerCommission({
      mongoDb: db,
      invoice: facture,
      subscription: {
        items: { data: [{ price: { recurring: { interval: "year" } } }] },
      },
    });
    expect(r.status).toBe("created");
    const [c] = db.inserted;
    expect(String(c.partnerId)).toBe(String(partnerId));
    expect(String(c.referralId)).toBe(String(ownerId));
    expect(String(c.subscriptionId)).toBe(String(subId));
    expect(c.paymentAmount).toBe(21.59);
    expect(c.commissionRate).toBe(20);
    expect(c.commissionAmount).toBeCloseTo(4.32, 2);
    expect(c.subscriptionType).toBe("annual");
    expect(c.status).toBe("confirmed");
  });

  it("même facture deux fois, montant nul, client non parrainé : aucune commission", async () => {
    for (const [db, invoice] of [
      [fakeDb({ existing: { _id: 1 } }), facture],
      [fakeDb(), { ...facture, amount_paid: 0 }],
      [fakeDb({ referredBy: null }), facture],
      [fakeDb({ referredBy: "INCONNU1" }), facture],
    ]) {
      await recordPartnerCommission({ mongoDb: db, invoice });
      expect(db.inserted).toHaveLength(0);
    }
  });
});
