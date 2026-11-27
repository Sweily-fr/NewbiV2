// Tiroir d'un type payant : liste des moyens partagée avec les transferts.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaymentMethodsChecklist } from "@/src/components/payments/payment-methods-checklist";
import { EMPTY_PAYMENT_CONNECTIONS } from "@/src/hooks/usePaymentConnections";

const connections = {
  ...EMPTY_PAYMENT_CONNECTIONS,
  stripe: {
    ...EMPTY_PAYMENT_CONNECTIONS.stripe,
    connected: true,
    ready: true,
    oauthAvailable: true,
    displayName: "Cabinet Martin",
  },
  bankTransfer: { available: false, ibanLast4: null, autoDetect: false },
};

describe("PaymentMethodsChecklist", () => {
  it("rendez-vous : les 4 moyens et leur état, IBAN à renseigner", () => {
    const onToggle = vi.fn();
    const onAddIban = vi.fn();
    render(
      <PaymentMethodsChecklist
        idPrefix="type-payment"
        connections={connections}
        availableMethods={["stripe"]}
        selected={["stripe"]}
        onToggle={onToggle}
        onAddIban={onAddIban}
        addIbanLabel="Renseigner l'IBAN"
        showUnavailableProviders
      />,
    );
    expect(
      screen.getByText("Sur votre compte Stripe Cabinet Martin."),
    ).toBeTruthy();
    // SumUp et PayPal non ouverts à l'espace : listés, « Bientôt disponible »
    expect(
      screen.getAllByText("Bientôt disponible pour votre espace."),
    ).toHaveLength(2);
    expect(screen.getByLabelText("Carte bancaire (SumUp)").disabled).toBe(true);
    expect(screen.getByLabelText("PayPal").disabled).toBe(true);
    expect(screen.getByLabelText("Virement bancaire").disabled).toBe(true);
    fireEvent.click(screen.getByText("Renseigner l'IBAN"));
    expect(onAddIban).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Carte bancaire (Stripe)"));
    expect(onToggle).toHaveBeenCalledWith("stripe", false);
  });

  it("transferts : SumUp et PayPal non ouverts restent masqués", () => {
    render(
      <PaymentMethodsChecklist
        idPrefix="transfer-payment"
        connections={connections}
        availableMethods={["stripe"]}
        selected={["stripe"]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("PayPal")).toBeNull();
    expect(screen.queryByLabelText("Carte bancaire (SumUp)")).toBeNull();
    expect(
      screen.getByText("Ajoutez l'IBAN de votre entreprise."),
    ).toBeTruthy();
  });

  it("sans le droit de connecter : demander à un administrateur", () => {
    render(
      <PaymentMethodsChecklist
        idPrefix="type-payment"
        connections={{
          ...connections,
          stripe: { ...EMPTY_PAYMENT_CONNECTIONS.stripe, oauthAvailable: true },
          paypal: { available: true, connected: false, email: null },
        }}
        availableMethods={[]}
        selected={[]}
        onToggle={vi.fn()}
        canManageConnections={false}
        showUnavailableProviders
      />,
    );
    expect(
      screen.getAllByText(
        "Demandez à un administrateur de l'espace de le connecter.",
      ),
    ).toHaveLength(2);
  });
});
