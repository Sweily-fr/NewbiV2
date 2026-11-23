// Carte avec SumUp : option du formulaire de création (compte connecté,
// devise du compte marchand, connexion à renouveler), bouton de la page du
// payeur et retour de la page de paiement SumUp.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import { TransferPaymentOptions } from "@/app/dashboard/outils/transferts-fichiers/components/transfer-payment-options";
import {
  EMPTY_PAYMENT_CONNECTIONS,
  availableTransferPaymentMethods,
  isSumupUsable,
} from "@/src/hooks/usePaymentConnections";
import {
  TransferPaymentPanel,
  normalizePaymentMethods,
  onlineProvidersLabel,
} from "@/app/transfer/[shareLink]/components/transfer-payment-panel";
import { buildPaymentReturnRequest } from "@/app/transfer/return/return-params";

const SUMUP_CONNECTE = {
  available: true,
  connected: true,
  needsReconnect: false,
  businessName: "Studio Lumière",
  email: "studio@exemple.fr",
  merchantCode: "MCODE123",
  currency: "EUR",
};

const connections = (sumup = {}) => ({
  ...EMPTY_PAYMENT_CONNECTIONS,
  sumup: { ...EMPTY_PAYMENT_CONNECTIONS.sumup, ...sumup },
  bankTransfer: { available: true, ibanLast4: "1234", autoDetect: false },
});

const afficherOptions = ({ sumup, currency = "EUR", ...props } = {}) => {
  const onChange = vi.fn();
  const onConnectSumup = vi.fn();
  const c = connections(sumup);
  render(
    <TransferPaymentOptions
      value={{
        isPaymentRequired: true,
        paymentAmount: "25",
        paymentCurrency: currency,
        paymentMethods: ["sumup", "bank_transfer"],
      }}
      onChange={onChange}
      connections={c}
      availableMethods={availableTransferPaymentMethods(c, currency)}
      onConnectStripe={vi.fn()}
      onConnectSumup={onConnectSumup}
      onConnectPaypal={vi.fn()}
      onAddIban={vi.fn()}
      {...props}
    />,
  );
  return { onChange, onConnectSumup };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SumUp dans le formulaire de création", () => {
  it("non configuré par Newbi : aucune ligne SumUp", () => {
    afficherOptions({ sumup: { available: false } });
    expect(screen.queryByLabelText("Carte bancaire (SumUp)")).toBeNull();
  });

  it("compte connecté, même devise : proposé et coché", () => {
    afficherOptions({ sumup: SUMUP_CONNECTE });
    const ligne = screen.getByLabelText("Carte bancaire (SumUp)");
    expect(ligne).not.toBeDisabled();
    expect(ligne).toBeChecked();
    expect(
      screen.getByText("Sur votre compte SumUp Studio Lumière."),
    ).toBeInTheDocument();
  });

  it("autre devise que celle du compte : grisé, devise expliquée", () => {
    afficherOptions({ sumup: SUMUP_CONNECTE, currency: "USD" });
    expect(screen.getByLabelText("Carte bancaire (SumUp)")).toBeDisabled();
    expect(
      screen.getByText("Votre compte SumUp encaisse uniquement en EUR."),
    ).toBeInTheDocument();
  });

  it("connexion expirée : grisé, lien pour reconnecter", () => {
    const { onConnectSumup } = afficherOptions({
      sumup: { ...SUMUP_CONNECTE, needsReconnect: true },
    });
    expect(screen.getByLabelText("Carte bancaire (SumUp)")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Reconnecter" }));
    expect(onConnectSumup).toHaveBeenCalled();
  });

  it("pas encore connecté : lien pour connecter son compte", () => {
    const { onConnectSumup } = afficherOptions({
      sumup: { available: true, connected: false },
    });
    expect(screen.getByLabelText("Carte bancaire (SumUp)")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Connecter" }));
    expect(onConnectSumup).toHaveBeenCalled();
  });

  it("moyens utilisables selon la devise", () => {
    const c = connections(SUMUP_CONNECTE);
    expect(availableTransferPaymentMethods(c, "EUR")).toEqual([
      "sumup",
      "bank_transfer",
    ]);
    expect(availableTransferPaymentMethods(c, "GBP")).toEqual([
      "bank_transfer",
    ]);
    expect(isSumupUsable({ ...SUMUP_CONNECTE, currency: null }, "CHF")).toBe(
      true,
    );
  });
});

describe("SumUp sur la page du payeur", () => {
  const afficherPanneau = (paymentMethods) => {
    const onPay = vi.fn();
    render(
      <TransferPaymentPanel
        amount={25}
        currency="EUR"
        sellerName="Studio Lumière"
        paymentMethods={paymentMethods}
        files={[]}
        onPay={onPay}
      />,
    );
    return { onPay };
  };

  it("seul moyen par carte : « Payer par carte », paiement SumUp lancé", () => {
    const { onPay } = afficherPanneau(["sumup"]);
    fireEvent.click(screen.getByRole("button", { name: "Payer par carte" }));
    expect(onPay).toHaveBeenCalledWith("sumup");
    expect(
      screen.getByText(/Paiement sécurisé sur la page de SumUp\./),
    ).toBeInTheDocument();
  });

  it("avec Stripe : deux boutons distincts", () => {
    const { onPay } = afficherPanneau(["stripe", "sumup", "paypal"]);
    fireEvent.click(
      screen.getByRole("button", { name: "Payer par carte avec SumUp" }),
    );
    expect(onPay).toHaveBeenCalledWith("sumup");
    expect(
      screen.getByRole("button", { name: "Payer par carte" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Paiement sécurisé sur la page de Stripe, SumUp ou PayPal\./,
      ),
    ).toBeInTheDocument();
  });

  it("ordre des moyens et mention des prestataires", () => {
    expect(normalizePaymentMethods(["paypal", "sumup", "stripe"])).toEqual([
      "stripe",
      "sumup",
      "paypal",
    ]);
    expect(onlineProvidersLabel(["paypal"])).toBe("PayPal");
    expect(onlineProvidersLabel(["stripe", "paypal"])).toBe("Stripe ou PayPal");
    expect(onlineProvidersLabel(["bank_transfer"])).toBe("");
  });
});

describe("retour de la page de paiement SumUp", () => {
  it("jeton de retour et prestataire, paramètres de SumUp ignorés", () => {
    expect(
      buildPaymentReturnRequest(
        new URLSearchParams("rt=jeton&provider=sumup&checkout_id=abc"),
      ),
    ).toEqual({
      kind: "confirm",
      canceled: false,
      variables: {
        token: "jeton",
        provider: "sumup",
        sessionId: null,
        orderId: null,
      },
    });
  });
});
