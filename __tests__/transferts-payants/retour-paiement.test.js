// Retour de la page de paiement d'un transfert : lecture des adresses
// construites par l'API (Stripe, PayPal, ancien format) et paramètre
// « payment » de la page du transfert.
import { describe, it, expect } from "vitest";
import {
  buildPaymentReturnRequest,
  paymentResultParam,
} from "@/app/transfer/return/return-params";

const params = (query) => new URLSearchParams(query);

describe("buildPaymentReturnRequest", () => {
  it("Stripe : jeton de retour et identifiant de session", () => {
    expect(
      buildPaymentReturnRequest(
        params("rt=jeton&provider=stripe&session_id=cs_test_1"),
      ),
    ).toEqual({
      kind: "confirm",
      canceled: false,
      variables: {
        token: "jeton",
        provider: "stripe",
        sessionId: "cs_test_1",
        orderId: null,
      },
    });
  });

  it("PayPal : l'identifiant de commande arrive dans « token »", () => {
    expect(
      buildPaymentReturnRequest(
        params("rt=jeton&provider=paypal&token=5O190127TN364715T&PayerID=X"),
      ),
    ).toEqual({
      kind: "confirm",
      canceled: false,
      variables: {
        token: "jeton",
        provider: "paypal",
        sessionId: null,
        orderId: "5O190127TN364715T",
      },
    });
  });

  it("annulation sur la page de paiement", () => {
    const request = buildPaymentReturnRequest(
      params("rt=jeton&provider=paypal&canceled=1&token=COMMANDE"),
    );
    expect(request.canceled).toBe(true);
    expect(request.variables.orderId).toBe("COMMANDE");
  });

  it("prestataire inconnu : Stripe, sans prendre « token » pour une commande", () => {
    const request = buildPaymentReturnRequest(
      params("rt=jeton&provider=autre&token=x"),
    );
    expect(request.variables.provider).toBe("stripe");
    expect(request.variables.orderId).toBeNull();
  });

  it("ancien format : jeton à usage unique et statut", () => {
    expect(
      buildPaymentReturnRequest(params("token=ancien&status=cancel")),
    ).toEqual({
      kind: "legacy",
      canceled: true,
      variables: { token: "ancien" },
    });
    expect(
      buildPaymentReturnRequest(params("token=ancien&status=success")).canceled,
    ).toBe(false);
  });

  it("adresse incomplète : rien à vérifier", () => {
    expect(buildPaymentReturnRequest(params(""))).toBeNull();
    expect(buildPaymentReturnRequest(params("rt=&token="))).toBeNull();
  });
});

describe("paymentResultParam", () => {
  it("suit le statut renvoyé par l'API", () => {
    expect(paymentResultParam("paid")).toBe("paid");
    expect(paymentResultParam("pending")).toBe("pending");
    expect(paymentResultParam("unpaid")).toBe("unpaid");
    expect(paymentResultParam(undefined)).toBe("unpaid");
  });

  it("non payé après une annulation : annulé", () => {
    expect(paymentResultParam("unpaid", true)).toBe("canceled");
    // Payé malgré tout (paiement terminé dans un autre onglet)
    expect(paymentResultParam("paid", true)).toBe("paid");
  });
});
