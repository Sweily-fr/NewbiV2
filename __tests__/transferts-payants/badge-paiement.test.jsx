// Badge du paiement dans la liste des transferts : virement annoncé par le
// client à la place de l'attente de paiement.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransferPaymentBadge } from "@/app/dashboard/outils/transferts-fichiers/components/transfer-payment-badge";

const TRANSFERT = {
  isPaymentRequired: true,
  paymentAmount: 25,
  paymentCurrency: "EUR",
  status: "active",
};

describe("TransferPaymentBadge", () => {
  it("en attente de paiement", () => {
    render(<TransferPaymentBadge transfer={TRANSFERT} />);
    expect(screen.getByText(/^En attente de paiement · 25,00/)).toBeVisible();
  });

  it("virement annoncé par le client : « Virement annoncé »", () => {
    render(
      <TransferPaymentBadge
        transfer={{
          ...TRANSFERT,
          bankTransferDeclaredAt: "2026-11-21T09:30:00.000Z",
        }}
      />,
    );
    expect(screen.getByText(/^Virement annoncé · 25,00/)).toBeVisible();
    expect(screen.queryByText(/En attente de paiement/)).toBeNull();
  });

  it("payé : le virement annoncé ne compte plus", () => {
    render(
      <TransferPaymentBadge
        transfer={{
          ...TRANSFERT,
          isPaid: true,
          paidAmount: 25,
          bankTransferDeclaredAt: "2026-11-21T09:30:00.000Z",
        }}
      />,
    );
    expect(screen.getByText(/^Payé · 25,00/)).toBeVisible();
  });

  it("sans paiement demandé : rien", () => {
    const { container } = render(
      <TransferPaymentBadge transfer={{ paymentAmount: 0 }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
