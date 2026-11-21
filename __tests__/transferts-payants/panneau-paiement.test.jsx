// Page publique d'un transfert payant : montant, fichiers verrouillés,
// un bouton par moyen proposé, coordonnées du virement, attente de
// confirmation.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import {
  TransferPaymentPanel,
  normalizePaymentMethods,
} from "@/app/transfer/[shareLink]/components/transfer-payment-panel";

const VIREMENT = {
  holder: "Studio Lumière",
  iban: "FR7630006000011234567890189",
  bic: "AGRIFRPP",
  bankName: "Crédit Agricole",
  reference: "NB-7K2Q9X",
};

const afficher = (props = {}) => {
  const onPay = vi.fn();
  render(
    <TransferPaymentPanel
      amount={25}
      currency="EUR"
      sellerName="Studio Lumière"
      paymentMethods={["stripe", "paypal", "bank_transfer"]}
      bankTransferDetails={VIREMENT}
      expiryLabel="28 novembre 2026"
      files={[
        { id: "f1", originalName: "photo-1.jpg", size: 2048 },
        { id: "f2", originalName: "photo-2.jpg", size: 4096 },
      ]}
      onPay={onPay}
      {...props}
    />,
  );
  return { onPay };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("normalizePaymentMethods", () => {
  it("transfert antérieur sans liste : carte", () => {
    expect(normalizePaymentMethods(null)).toEqual(["stripe"]);
    expect(normalizePaymentMethods([])).toEqual(["stripe"]);
  });

  it("ordre fixe et moyens inconnus ignorés", () => {
    expect(
      normalizePaymentMethods(["bank_transfer", "inconnu", "stripe"]),
    ).toEqual(["stripe", "bank_transfer"]);
  });
});

describe("TransferPaymentPanel", () => {
  it("montant, vendeur et fichiers verrouillés sans téléchargement", () => {
    afficher();
    expect(screen.getByText(/25,00/)).toBeInTheDocument();
    expect(screen.getByText("Studio Lumière")).toBeInTheDocument();
    expect(screen.getByText("photo-1.jpg")).toBeInTheDocument();
    expect(screen.getByText("photo-2.jpg")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Télécharger/ })).toBeNull();
  });

  it("un bouton par moyen proposé, qui lance le bon prestataire", () => {
    const { onPay } = afficher();
    fireEvent.click(screen.getByRole("button", { name: /Payer par carte/ }));
    fireEvent.click(screen.getByRole("button", { name: "Payer avec PayPal" }));
    expect(onPay).toHaveBeenNthCalledWith(1, "stripe");
    expect(onPay).toHaveBeenNthCalledWith(2, "paypal");
  });

  it("virement : IBAN, BIC, référence et phrase de déblocage", () => {
    afficher();
    expect(screen.queryByText("NB-7K2Q9X")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Payer par virement/ }));
    expect(
      screen.getByText("FR76 3000 6000 0112 3456 7890 189"),
    ).toBeInTheDocument();
    expect(screen.getByText("AGRIFRPP")).toBeInTheDocument();
    expect(screen.getByText("NB-7K2Q9X")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Les fichiers seront disponibles dès que Studio Lumière aura confirmé la réception du virement/,
      ),
    ).toBeInTheDocument();
  });

  it("virement seul : coordonnées affichées d'emblée", () => {
    afficher({ paymentMethods: ["bank_transfer"] });
    expect(screen.getByText("NB-7K2Q9X")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Payer par carte/ }),
    ).toBeNull();
  });

  it("paiement en cours de confirmation : plus de bouton de paiement", () => {
    afficher({ pending: true });
    expect(
      screen.getByText("Paiement en cours de confirmation"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Payer/ })).toBeNull();
  });

  it("redirection en cours : boutons désactivés", () => {
    afficher({ processingProvider: "stripe" });
    expect(screen.getByText("Redirection…")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Payer avec PayPal" }),
    ).toBeDisabled();
  });

  it("transfert antérieur sans moyens listés : paiement par carte", () => {
    afficher({ paymentMethods: null, bankTransferDetails: null });
    expect(
      screen.getByRole("button", { name: /Payer par carte/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /virement/ })).toBeNull();
  });
});
