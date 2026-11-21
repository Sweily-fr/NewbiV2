// Page de retour du paiement : le paiement est vérifié par l'API, puis le
// destinataire revient sur le transfert avec le résultat.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import {
  CONFIRM_TRANSFER_PAYMENT,
  CONSUME_PAYMENT_RETURN_TOKEN,
} from "@/src/graphql/mutations/stripe";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  query: "",
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

import TransferReturnPage from "@/app/transfer/return/page";

const confirmation = (variables, result) => ({
  request: { query: CONFIRM_TRANSFER_PAYMENT, variables },
  result: {
    data: {
      confirmTransferPayment: {
        __typename: "TransferPaymentConfirmation",
        success: true,
        message: null,
        shareLink: "lien",
        accessKey: "cle",
        status: "paid",
        ...result,
      },
    },
  },
});

const afficher = (query, mocks) => {
  navigation.query = query;
  return render(
    <MockedProvider mocks={mocks}>
      <TransferReturnPage />
    </MockedProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Page de retour du paiement", () => {
  it("Stripe payé : retour au transfert avec payment=paid", async () => {
    afficher("rt=jeton&provider=stripe&session_id=cs_1", [
      confirmation(
        {
          token: "jeton",
          provider: "stripe",
          sessionId: "cs_1",
          orderId: null,
        },
        {},
      ),
    ]);
    expect(screen.getByText("Vérification du paiement…")).toBeInTheDocument();
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/transfer/lien?key=cle&payment=paid",
      ),
    );
  });

  it("PayPal annulé : payment=canceled", async () => {
    afficher("rt=jeton&provider=paypal&canceled=1&token=COMMANDE", [
      confirmation(
        {
          token: "jeton",
          provider: "paypal",
          sessionId: null,
          orderId: "COMMANDE",
        },
        { status: "unpaid" },
      ),
    ]);
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/transfer/lien?key=cle&payment=canceled",
      ),
    );
  });

  it("jeton refusé : message, aucune redirection", async () => {
    afficher("rt=perime&provider=stripe&session_id=cs_1", [
      confirmation(
        {
          token: "perime",
          provider: "stripe",
          sessionId: "cs_1",
          orderId: null,
        },
        {
          success: false,
          shareLink: null,
          accessKey: null,
          status: null,
          message: "Ce lien de retour a expiré.",
        },
      ),
    ]);
    expect(
      await screen.findByText("Ce lien de retour a expiré."),
    ).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("ancien format : jeton à usage unique, paiement à confirmer", async () => {
    afficher("token=ancien&status=success", [
      {
        request: {
          query: CONSUME_PAYMENT_RETURN_TOKEN,
          variables: { token: "ancien" },
        },
        result: {
          data: {
            consumePaymentReturnToken: {
              __typename: "PaymentReturnTokenResponse",
              success: true,
              message: null,
              shareLink: "lien",
              accessKey: "cle",
              paymentStatus: "pending",
            },
          },
        },
      },
    ]);
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/transfer/lien?key=cle&payment=pending",
      ),
    );
  });

  it("adresse incomplète : message", () => {
    afficher("", []);
    expect(
      screen.getByText("Ce lien de retour est incomplet."),
    ).toBeInTheDocument();
  });
});
