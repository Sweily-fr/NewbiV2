// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { handleProspectCreditsRefund } from "@/src/lib/prospect-credits";

/**
 * Achat de crédits de prospection remboursé (en entier) ou contesté par la
 * banque du client : les crédits sortent du solde, une seule fois ; un
 * remboursement partiel ne retire rien ; les autres paiements sont ignorés.
 */

const achat = {
  _id: new ObjectId(),
  credits: 100,
  status: "paid",
  stripePaymentIntentId: "pi_credits",
};

let findOne;
let updateOne;
const mongoDb = {
  collection: (name) => {
    expect(name).toBe("prospect_credit_purchases");
    return { findOne, updateOne };
  },
};

const remboursement = (object, type = "charge.refunded") =>
  handleProspectCreditsRefund(mongoDb, { type, data: { object } });

beforeEach(() => {
  findOne = vi.fn(async ({ stripePaymentIntentId }) =>
    stripePaymentIntentId === "pi_credits" ? { ...achat } : null,
  );
  updateOne = vi.fn(async () => ({ modifiedCount: 1 }));
});

describe("handleProspectCreditsRefund", () => {
  it("remboursement complet : l'achat passe en « refunded », crédits retirés", async () => {
    const res = await remboursement({
      payment_intent: "pi_credits",
      amount: 3000,
      amount_refunded: 3000,
    });
    expect(res).toEqual({ credits: 100, refunded: true, partial: false });
    const [filtre, maj] = updateOne.mock.calls[0];
    expect(filtre).toEqual({ _id: achat._id, status: { $ne: "refunded" } });
    expect(maj.$set.status).toBe("refunded");
  });

  it("contestation bancaire : crédits retirés aussitôt", async () => {
    const res = await remboursement(
      { payment_intent: "pi_credits", amount: 3000 },
      "charge.dispute.created",
    );
    expect(res).toMatchObject({ refunded: true });
    expect(updateOne).toHaveBeenCalledTimes(1);
  });

  it("remboursement partiel : rien de retiré, signalé", async () => {
    const res = await remboursement({
      payment_intent: { id: "pi_credits" },
      amount: 3000,
      amount_refunded: 1000,
    });
    expect(res).toEqual({ credits: 100, refunded: false, partial: true });
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("déjà remboursé : pas de seconde écriture", async () => {
    findOne.mockResolvedValueOnce({ ...achat, status: "refunded" });
    const res = await remboursement({
      payment_intent: "pi_credits",
      amount: 3000,
      amount_refunded: 3000,
    });
    expect(res).toMatchObject({ refunded: true });
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("ignore les autres paiements (abonnements…)", async () => {
    expect(
      await remboursement({
        payment_intent: "pi_abonnement",
        amount: 4899,
        amount_refunded: 4899,
      }),
    ).toBeNull();
    expect(await remboursement({ amount: 10, amount_refunded: 10 })).toBeNull();
    expect(updateOne).not.toHaveBeenCalled();
  });
});
