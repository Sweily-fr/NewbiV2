// Option « Demander un paiement » d'un nouveau transfert : montant,
// moyens disponibles, incompatibilité avec le filigrane, liens pour
// connecter un moyen manquant.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  TransferPaymentOptions,
  getTransferPaymentError,
  parsePaymentAmount,
} from "@/app/dashboard/outils/transferts-fichiers/components/transfer-payment-options";
import {
  EMPTY_PAYMENT_CONNECTIONS,
  availableTransferPaymentMethods,
} from "@/src/hooks/usePaymentConnections";

const connections = (overrides = {}) => ({
  stripe: { ...EMPTY_PAYMENT_CONNECTIONS.stripe, ...overrides.stripe },
  paypal: { ...EMPTY_PAYMENT_CONNECTIONS.paypal, ...overrides.paypal },
  bankTransfer: {
    ...EMPTY_PAYMENT_CONNECTIONS.bankTransfer,
    ...overrides.bankTransfer,
  },
});

const TOUT_CONNECTE = connections({
  stripe: {
    connected: true,
    ready: true,
    oauthAvailable: true,
    chargesEnabled: true,
    displayName: "Studio Lumière",
  },
  paypal: { available: true, connected: true, email: "pay@studio.fr" },
  bankTransfer: { available: true, ibanLast4: "1234" },
});

const afficher = (props = {}) => {
  const onChange = vi.fn();
  const value = {
    isPaymentRequired: false,
    paymentAmount: 0,
    paymentCurrency: "EUR",
    paymentMethods: [],
    ...props.value,
  };
  const c = props.connections || TOUT_CONNECTE;
  render(
    <TransferPaymentOptions
      value={value}
      onChange={onChange}
      connections={c}
      availableMethods={availableTransferPaymentMethods(c)}
      onConnectStripe={vi.fn()}
      onConnectPaypal={vi.fn()}
      onAddIban={vi.fn()}
      {...props}
    />,
  );
  return { onChange };
};

describe("parsePaymentAmount / getTransferPaymentError", () => {
  it("lit la virgule et le point, refuse le reste", () => {
    expect(parsePaymentAmount("12,5")).toBe(12.5);
    expect(parsePaymentAmount("12.50")).toBe(12.5);
    expect(parsePaymentAmount("")).toBeNaN();
    expect(parsePaymentAmount("1,234")).toBeNaN();
    expect(parsePaymentAmount("abc")).toBeNaN();
  });

  it("montant entre 0,50 et 100 000 et au moins un moyen disponible", () => {
    const ok = {
      isPaymentRequired: true,
      paymentAmount: "25",
      paymentMethods: ["stripe"],
    };
    expect(getTransferPaymentError(ok, ["stripe"])).toBeNull();
    expect(
      getTransferPaymentError({ ...ok, paymentAmount: "0.4" }, ["stripe"]),
    ).toMatch(/0,50/);
    expect(
      getTransferPaymentError({ ...ok, paymentAmount: "100000.01" }, [
        "stripe",
      ]),
    ).toMatch(/100 000/);
    // Moyen coché mais plus disponible (déconnecté entre-temps)
    expect(getTransferPaymentError(ok, ["paypal"])).toMatch(/moyen/);
    // Pas de paiement demandé : rien à vérifier
    expect(
      getTransferPaymentError({ isPaymentRequired: false }, []),
    ).toBeNull();
  });
});

describe("availableTransferPaymentMethods", () => {
  it("compte Stripe du client prêt, PayPal ouvert et connecté, IBAN", () => {
    expect(availableTransferPaymentMethods(TOUT_CONNECTE)).toEqual([
      "stripe",
      "paypal",
      "bank_transfer",
    ]);
  });

  it("ancien compte Stripe et PayPal fermé : aucun moyen en ligne", () => {
    expect(
      availableTransferPaymentMethods(
        connections({
          stripe: { connected: true, legacy: true, chargesEnabled: true },
          paypal: { available: false, connected: true },
        }),
      ),
    ).toEqual([]);
  });
});

describe("TransferPaymentOptions", () => {
  it("activer le paiement propose d'office tous les moyens disponibles", () => {
    const { onChange } = afficher();
    fireEvent.click(
      screen.getByRole("switch", { name: "Demander un paiement" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      isPaymentRequired: true,
      paymentMethods: ["stripe", "paypal", "bank_transfer"],
    });
  });

  it("indisponible avec le filigrane", () => {
    afficher({ watermarkEnabled: true });
    expect(
      screen.getByRole("switch", { name: "Demander un paiement" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Non disponible avec le filigrane/),
    ).toBeInTheDocument();
  });

  it("sans commission Newbi, et sans mention de frais Stripe chiffrés", () => {
    afficher({
      value: {
        isPaymentRequired: true,
        paymentAmount: "25",
        paymentMethods: ["stripe"],
      },
    });
    expect(
      screen.getByText(/Newbi ne prend\s+aucune commission/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/2[.,]9/)).toBeNull();
  });

  it("moyens manquants : cases désactivées et liens pour les connecter", () => {
    const onConnectStripe = vi.fn();
    const onConnectPaypal = vi.fn();
    const onAddIban = vi.fn();
    afficher({
      value: { isPaymentRequired: true, paymentAmount: "25" },
      connections: connections({
        stripe: { oauthAvailable: true },
        paypal: { available: true },
      }),
      onConnectStripe,
      onConnectPaypal,
      onAddIban,
    });
    expect(
      screen.getByRole("checkbox", { name: "Carte bancaire (Stripe)" }),
    ).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "PayPal" })).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Virement bancaire" }),
    ).toBeDisabled();
    const connecter = screen.getAllByRole("button", { name: "Connecter" });
    fireEvent.click(connecter[0]);
    fireEvent.click(connecter[1]);
    fireEvent.click(screen.getByRole("button", { name: "Ajouter votre IBAN" }));
    expect(onConnectStripe).toHaveBeenCalledTimes(1);
    expect(onConnectPaypal).toHaveBeenCalledTimes(1);
    expect(onAddIban).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("Choisissez au moins un moyen de paiement."),
    ).toBeInTheDocument();
  });

  it("ancien compte Stripe : invitation à reconnecter son propre compte", () => {
    afficher({
      value: { isPaymentRequired: true, paymentAmount: "25" },
      connections: connections({
        stripe: { connected: true, legacy: true, oauthAvailable: true },
      }),
    });
    expect(
      screen.getByText(/Reconnectez votre propre compte Stripe/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reconnecter" }),
    ).toBeInTheDocument();
  });

  it("PayPal fermé à l'espace : la ligne PayPal n'apparaît pas", () => {
    afficher({
      value: { isPaymentRequired: true, paymentAmount: "25" },
      connections: connections({ stripe: { oauthAvailable: true } }),
    });
    expect(screen.queryByRole("checkbox", { name: "PayPal" })).toBeNull();
  });

  it("rôle sans « Gérer les applications » : pas de lien de connexion", () => {
    afficher({
      value: { isPaymentRequired: true, paymentAmount: "25" },
      connections: connections({
        stripe: { oauthAvailable: true },
        paypal: { available: true },
      }),
      canManageConnections: false,
    });
    expect(screen.queryByRole("button", { name: "Connecter" })).toBeNull();
    expect(
      screen.getAllByText(/Demandez à un administrateur/).length,
    ).toBeGreaterThan(0);
  });

  it("décocher un moyen le retire des moyens proposés", () => {
    const { onChange } = afficher({
      value: {
        isPaymentRequired: true,
        paymentAmount: "25",
        paymentMethods: ["stripe", "bank_transfer"],
      },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Virement bancaire" }),
    );
    expect(onChange).toHaveBeenCalledWith({ paymentMethods: ["stripe"] });
  });
});
