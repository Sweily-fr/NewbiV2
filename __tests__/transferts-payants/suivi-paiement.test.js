// Paiement d'un transfert vu par son propriétaire : état, montant,
// virement annoncé par le client, déblocage à la main.
import { describe, it, expect } from "vitest";
import {
  TRANSFER_PAYMENT_STATE_LABELS,
  canMarkTransferAsPaid,
  formatBankTransferDeclaration,
  formatTransferAmount,
  transferPaymentState,
  transferUnlockEmail,
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

describe("virement annoncé par le client", () => {
  const ANNONCE = {
    isPaymentRequired: true,
    status: "active",
    bankTransferDeclaredAt: "2026-11-21T09:30:00.000Z",
  };

  it("état « declared » tant que le transfert n'est pas payé", () => {
    expect(transferPaymentState(ANNONCE)).toBe("declared");
    expect(transferPaymentState({ ...ANNONCE, paymentPending: true })).toBe(
      "declared",
    );
    expect(transferPaymentState({ ...ANNONCE, isPaid: true })).toBe("paid");
    expect(TRANSFER_PAYMENT_STATE_LABELS.declared).toBe("Virement annoncé");
  });

  it("le propriétaire peut le débloquer", () => {
    expect(canMarkTransferAsPaid(ANNONCE)).toBe(true);
    expect(canMarkTransferAsPaid({ ...ANNONCE, status: "expired" })).toBe(
      false,
    );
  });

  it("phrase du détail : date, heure et adresse laissée", () => {
    const declaredAt = new Date(2026, 10, 21, 14, 32).toISOString();
    expect(
      formatBankTransferDeclaration({
        ...ANNONCE,
        bankTransferDeclaredAt: declaredAt,
        bankTransferDeclaredEmail: "jean@exemple.fr",
      }),
    ).toBe(
      "Votre client a annoncé un virement le 21 novembre 2026 à 14:32 (jean@exemple.fr). Vérifiez votre compte avant de débloquer.",
    );
    expect(
      formatBankTransferDeclaration({
        ...ANNONCE,
        bankTransferDeclaredAt: String(new Date(2026, 10, 3, 9, 5).getTime()),
      }),
    ).toBe(
      "Votre client a annoncé un virement le 3 novembre 2026 à 09:05. Vérifiez votre compte avant de débloquer.",
    );
    expect(formatBankTransferDeclaration({ ...ANNONCE, isPaid: true })).toBe(
      null,
    );
  });

  it("client prévenu par e-mail : adresse du virement, sinon destinataire", () => {
    expect(
      transferUnlockEmail({
        bankTransferDeclaredEmail: "payeur@exemple.fr",
        recipientEmail: "client@exemple.fr",
      }),
    ).toBe("payeur@exemple.fr");
    expect(transferUnlockEmail({ recipientEmail: "client@exemple.fr" })).toBe(
      "client@exemple.fr",
    );
    expect(transferUnlockEmail({ recipientEmail: "" })).toBeNull();
  });
});

describe("formatTransferAmount", () => {
  it("montant en euros ou dans la devise du transfert", () => {
    expect(formatTransferAmount(25, "EUR")).toMatch(/25,00\s€/);
    expect(formatTransferAmount(19.9, "USD")).toMatch(/19,90/);
    expect(formatTransferAmount("x", "EUR")).toBe("");
  });
});
