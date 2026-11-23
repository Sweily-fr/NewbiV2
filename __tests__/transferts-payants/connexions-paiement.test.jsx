// Moyens d'encaissement de l'espace : lecture avec SumUp, et repli sans SumUp
// quand l'API n'est pas encore à jour (site mis en ligne avant elle) pour
// garder Stripe, PayPal et le virement.
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "w1" }),
}));

import {
  GET_PAYMENT_CONNECTIONS,
  GET_PAYMENT_CONNECTIONS_LEGACY,
} from "@/src/graphql/mutations/stripe";
import { usePaymentConnections } from "@/src/hooks/usePaymentConnections";

const STRIPE = {
  connected: true,
  ready: true,
  legacy: false,
  oauthAvailable: true,
  chargesEnabled: true,
  displayName: "Studio Lumière",
  accountEmail: null,
};
const PAYPAL = { available: false, connected: false, email: null };
const VIREMENT = { available: true, ibanLast4: "1234", autoDetect: false };
const SUMUP = {
  available: true,
  connected: true,
  needsReconnect: false,
  businessName: "Studio Lumière",
  email: "studio@exemple.fr",
  merchantCode: "MCODE123",
  currency: "EUR",
};

const wrapper = (mocks) =>
  function ApolloWrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

describe("usePaymentConnections", () => {
  it("API à jour : SumUp lu avec les autres moyens", async () => {
    const mocks = [
      {
        request: { query: GET_PAYMENT_CONNECTIONS },
        result: {
          data: {
            paymentConnections: {
              stripe: STRIPE,
              paypal: PAYPAL,
              sumup: SUMUP,
              bankTransfer: VIREMENT,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => usePaymentConnections(), {
      wrapper: wrapper(mocks),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.connections.sumup).toMatchObject({
      connected: true,
      currency: "EUR",
    });
    expect(result.current.availableMethods).toEqual([
      "stripe",
      "sumup",
      "bank_transfer",
    ]);
  });

  it("API sans SumUp : relue sans SumUp, Stripe et virement gardés", async () => {
    const mocks = [
      {
        request: { query: GET_PAYMENT_CONNECTIONS },
        result: {
          errors: [
            new GraphQLError(
              'Cannot query field "sumup" on type "PaymentConnections".',
            ),
          ],
        },
      },
      {
        request: { query: GET_PAYMENT_CONNECTIONS_LEGACY },
        result: {
          data: {
            paymentConnections: {
              stripe: STRIPE,
              paypal: PAYPAL,
              bankTransfer: VIREMENT,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => usePaymentConnections(), {
      wrapper: wrapper(mocks),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.connections.stripe.ready).toBe(true);
    expect(result.current.connections.sumup.connected).toBe(false);
    expect(result.current.availableMethods).toEqual([
      "stripe",
      "bank_transfer",
    ]);
  });
});
