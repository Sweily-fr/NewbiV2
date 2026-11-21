// Paiement d'un transfert vu par son propriétaire : état, montant,
// déblocage à la main.
import { describe, it, expect } from "vitest";
import {
  canMarkTransferAsPaid,
  formatTransferAmount,
  transferPaymentState,
} from "@/app/dashboard/outils/transferts-fichiers/utils/transfer-payment";

describe("transferPaymentState", () => {
  it("sans paiement demandé : rien", () => {
    expect(transferPaymentState({ isPaymentRequired: false })).toBeNull();
    expect(transferPaymentState(null)).toBeNull();
  });

  it("payé, en confirmation, en attente", () => {
    expect(
      transferPaymentState({ isPaymentRequired: true, isPaid: true }),
    ).toBe("paid");
    expect(
      transferPaymentState({ isPaymentRequired: true, paymentPending: true }),
    ).toBe("pending");
    expect(transferPaymentState({ paymentAmount: 12 })).toBe("awaiting");
  });
});

describe("canMarkTransferAsPaid", () => {
  it("seulement un transfert payant non payé et encore actif", () => {
    expect(
      canMarkTransferAsPaid({ isPaymentRequired: true, status: "active" }),
    ).toBe(true);
    expect(
      canMarkTransferAsPaid({
        isPaymentRequired: true,
        isPaid: true,
        status: "active",
      }),
    ).toBe(false);
    expect(
      canMarkTransferAsPaid({ isPaymentRequired: true, status: "expired" }),
    ).toBe(false);
    expect(canMarkTransferAsPaid({ status: "active" })).toBe(false);
  });
});

describe("formatTransferAmount", () => {
  it("montant en euros ou dans la devise du transfert", () => {
    expect(formatTransferAmount(25, "EUR")).toMatch(/25,00\s€/);
    expect(formatTransferAmount(19.9, "USD")).toMatch(/19,90/);
    expect(formatTransferAmount("x", "EUR")).toBe("");
  });
});
