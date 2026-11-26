// Paiement des créneaux et virement (créneaux et événements) : logique pure.
import { describe, it, expect } from "vitest";
import {
  isAwaitingBankTransfer,
  paymentMethodDelay,
  paymentMethodLabel,
  paymentStatus,
  returnKindFromParams,
  slotAmounts,
  slotNeedsOnlinePayment,
  slotPaymentNotice,
  slotPriceLabel,
  slotSubmitLabel,
  unconfirmedBookingMessage,
} from "@/src/utils/booking-payments";
import {
  orderedPaymentMethods,
  pricingFormErrors,
  pricingInputIfChanged,
  pricingToForm,
  registrationPaymentLine,
} from "@/src/utils/booking-events";
import {
  bookingListVariables,
  bookingValidationOutcome,
  buildBookingPayload,
} from "@/src/utils/booking";

const euros = (text) => text.replace(/ | /g, " ");

const PAYANT = (mode, extra = {}) => ({
  price: { amount: 4000, currency: "EUR" },
  paymentMode: mode,
  depositAmount: mode === "DEPOSIT" ? 1000 : null,
  amountOnline: mode === "ONLINE" ? 4000 : mode === "DEPOSIT" ? 1000 : 0,
  amountDueOnSite: mode === "ONLINE" ? 0 : mode === "DEPOSIT" ? 3000 : 4000,
  ...extra,
});

describe("créneau payant, page publique", () => {
  it("gratuit : aucun paiement, bouton habituel", () => {
    expect(slotNeedsOnlinePayment(null)).toBe(false);
    expect(slotPriceLabel(null)).toBeNull();
    expect(slotPaymentNotice(null)).toBeNull();
    expect(slotSubmitLabel(null)).toBe("Confirmer le rendez-vous");
    expect(slotAmounts({ price: { amount: 0 } })).toEqual({
      mode: null,
      total: 0,
      online: 0,
      onSite: 0,
    });
  });

  it("en ligne : tout payé à la réservation", () => {
    const payment = PAYANT("ONLINE");
    expect(slotNeedsOnlinePayment(payment)).toBe(true);
    expect(slotAmounts(payment)).toMatchObject({ online: 4000, onSite: 0 });
    expect(slotPaymentNotice(payment)).toBe(
      "Paiement en ligne à la réservation",
    );
    expect(euros(slotSubmitLabel(payment))).toBe("Payer 40,00 €");
    expect(euros(slotPriceLabel(payment))).toBe("40,00 €");
  });

  it("acompte : acompte en ligne, reste sur place", () => {
    const payment = PAYANT("DEPOSIT");
    expect(slotAmounts(payment)).toMatchObject({ online: 1000, onSite: 3000 });
    expect(euros(slotPaymentNotice(payment))).toBe(
      "Acompte de 10,00 € à la réservation, reste 30,00 € sur place",
    );
    expect(euros(slotSubmitLabel(payment))).toBe("Payer l'acompte 10,00 €");
    expect(euros(slotPriceLabel(payment))).toBe("40,00 €, acompte 10 €");
  });

  it("sur place : confirmé sans paiement en ligne", () => {
    const payment = PAYANT("ON_SITE");
    expect(slotNeedsOnlinePayment(payment)).toBe(false);
    expect(slotAmounts(payment)).toMatchObject({ online: 0, onSite: 4000 });
    expect(slotPaymentNotice(payment)).toBe(
      "Paiement sur place, au rendez-vous",
    );
    expect(slotSubmitLabel(payment)).toBe("Confirmer le rendez-vous");
  });

  it("moyens : virement en dernier, libellés et délais annoncés", () => {
    expect(
      orderedPaymentMethods(["bank_transfer", "paypal", "stripe", "x"]),
    ).toEqual(["stripe", "paypal", "bank_transfer"]);
    expect(paymentMethodLabel("bank_transfer")).toBe("Virement");
    expect(paymentMethodLabel("sumup", ["stripe", "sumup"])).toBe(
      "Carte avec SumUp",
    );
    expect(paymentMethodLabel("sumup", ["sumup"])).toBe("Carte bancaire");
    expect(paymentMethodDelay("bank_transfer", "slot")).toBe(
      "Le créneau est gardé 3 jours. Il est confirmé dès que le virement arrive.",
    );
    expect(paymentMethodDelay("bank_transfer", "event")).toBe(
      "Votre place est gardée 3 jours. Elle est confirmée dès que le virement arrive.",
    );
    expect(paymentMethodDelay("stripe", "slot")).toBe(
      "Rendez-vous confirmé dès le paiement",
    );
  });

  it("corps de la réservation : moyen seulement s'il est choisi", () => {
    const values = { firstName: " Ana ", lastName: "B", email: "A@B.FR" };
    const base = {
      start: "2026-12-01T09:00:00.000Z",
      timezone: "Europe/Paris",
    };
    expect(buildBookingPayload(values, base)).not.toHaveProperty("provider");
    expect(
      buildBookingPayload(values, { ...base, provider: "bank_transfer" })
        .provider,
    ).toBe("bank_transfer");
  });

  it("refus du moyen de paiement : message général", () => {
    expect(
      bookingValidationOutcome({ provider: "Choisissez un moyen de paiement." })
        .message,
    ).toBe("Choisissez un moyen de paiement.");
  });

  it("adresse de retour : kind=slot", () => {
    expect(returnKindFromParams(new URLSearchParams("rt=a&kind=slot"))).toBe(
      "slot",
    );
    expect(returnKindFromParams({ rt: "a" })).toBe("event");
    expect(returnKindFromParams({ kind: ["slot"] })).toBe("slot");
  });
});

describe("retour d'un créneau non confirmé", () => {
  it("jamais « confirmé » : attente, annulé, remboursé, à rembourser", () => {
    expect(unconfirmedBookingMessage({ paymentStatus: "pending" }).title).toBe(
      "Paiement en attente de confirmation",
    );
    expect(unconfirmedBookingMessage({ canceledByPayer: true }).title).toBe(
      "Paiement annulé",
    );
    expect(
      unconfirmedBookingMessage({ refundStatus: "REFUNDED" }),
    ).toMatchObject({ title: "Paiement remboursé", restart: true });
    const manual = unconfirmedBookingMessage({
      refundStatus: "MANUAL",
      organizerName: "Cabinet Martin",
    });
    expect(manual.restart).toBe(false);
    expect(manual.text).toContain("Contactez Cabinet Martin");
    expect(unconfirmedBookingMessage({}).title).toBe("Paiement non effectué");
  });
});

describe("statut de paiement pour l'organisateur", () => {
  const virement = {
    status: "PENDING_PAYMENT",
    paymentProvider: "bank_transfer",
    amount: 4000,
    currency: "EUR",
    paymentMode: "ONLINE",
    amountOnline: 4000,
    amountDueOnSite: 0,
  };

  it("virement en attente, annoncé ou non", () => {
    expect(isAwaitingBankTransfer(virement)).toBe(true);
    expect(paymentStatus(virement)).toEqual({
      label: "Virement en attente",
      tone: "warning",
      detail: null,
    });
    expect(
      paymentStatus(
        { ...virement, bankTransferDeclaredAt: "2026-11-27T09:30:00.000Z" },
        { timeZone: "Europe/Paris" },
      ).detail,
    ).toBe("Annoncé le 27 nov. 2026, 10:30");
  });

  it("carte en attente, expirés, remboursés, à rembourser", () => {
    expect(
      paymentStatus({ status: "PENDING_PAYMENT", paymentProvider: "stripe" })
        .label,
    ).toBe("En attente de paiement");
    expect(
      paymentStatus(
        { status: "EXPIRED", paymentProvider: "bank_transfer" },
        { feminine: true },
      ).label,
    ).toBe("Expirée, virement non reçu");
    expect(paymentStatus({ status: "EXPIRED" }).label).toBe("Expiré");
    expect(paymentStatus({ status: "EXPIRED", refundFailed: true }).label).toBe(
      "À rembourser à la main",
    );
    expect(paymentStatus({ status: "EXPIRED", refundedAt: "x" }).label).toBe(
      "Remboursé",
    );
    expect(paymentStatus({ status: "CONFIRMED" })).toBeNull();
  });

  it("ligne de paiement : virement en attente, jamais « payé »", () => {
    expect(euros(registrationPaymentLine(virement))).toBe(
      "Virement en attente : 40,00 €",
    );
    expect(
      euros(
        registrationPaymentLine({
          ...virement,
          paymentMode: "DEPOSIT",
          amountOnline: 1000,
          amountDueOnSite: 3000,
        }),
      ),
    ).toBe(
      "Acompte par virement en attente : 10,00 €. Reste à régler sur place : 30,00 €",
    );
    expect(
      euros(registrationPaymentLine({ ...virement, status: "CONFIRMED" })),
    ).toBe("Payé en ligne : 40,00 €");
  });

  it("onglet « En attente de paiement » des réservations", () => {
    expect(bookingListVariables("pending")).toEqual({
      scope: "all",
      status: "PENDING_PAYMENT",
    });
  });
});

describe("prix d'un type Créneaux (tiroir)", () => {
  it("créneau existant sans prix : formulaire gratuit", () => {
    expect(pricingToForm({ price: null })).toEqual({
      priceText: "",
      paymentMode: "ONLINE",
      depositText: "",
    });
    expect(pricingToForm(PAYANT("DEPOSIT"))).toEqual({
      priceText: "40",
      paymentMode: "DEPOSIT",
      depositText: "10",
    });
  });

  it("validation sans « par place » pour un créneau", () => {
    expect(
      pricingFormErrors(
        { priceText: "40", paymentMode: "DEPOSIT", depositText: "40" },
        { perSeat: false },
      ).deposit,
    ).toBe("L'acompte doit être inférieur au prix");
    expect(
      pricingFormErrors({ priceText: "0,2" }, { perSeat: false }).price,
    ).toBe("0,50 € minimum, ou laissez vide pour un rendez-vous gratuit");
    expect(pricingFormErrors({ priceText: "" }, { perSeat: false })).toEqual(
      {},
    );
  });

  it("prix, mode et acompte envoyés seulement s'ils changent", () => {
    const gratuit = { priceText: "", paymentMode: "ONLINE", depositText: "" };
    // Créneau gratuit existant ou nouveau, laissé gratuit : rien d'écrit
    expect(pricingInputIfChanged(gratuit, { price: null })).toEqual({});
    expect(pricingInputIfChanged(gratuit, null)).toEqual({});
    // Rendu payant
    expect(
      pricingInputIfChanged(
        { priceText: "40", paymentMode: "ON_SITE", depositText: "" },
        { price: null },
      ),
    ).toEqual({
      price: { amount: 4000, currency: "EUR" },
      paymentMode: "ON_SITE",
      depositAmount: null,
    });
    // Inchangé
    expect(
      pricingInputIfChanged(
        pricingToForm(PAYANT("DEPOSIT")),
        PAYANT("DEPOSIT"),
      ),
    ).toEqual({});
    // Acompte changé : les trois ensemble
    expect(
      pricingInputIfChanged(
        { priceText: "40", paymentMode: "DEPOSIT", depositText: "15" },
        PAYANT("DEPOSIT"),
      ),
    ).toEqual({
      price: { amount: 4000, currency: "EUR" },
      paymentMode: "DEPOSIT",
      depositAmount: 1500,
    });
    // Repassé gratuit : effacement explicite
    expect(pricingInputIfChanged(gratuit, PAYANT("ONLINE"))).toEqual({
      price: null,
      paymentMode: null,
      depositAmount: null,
    });
  });
});
