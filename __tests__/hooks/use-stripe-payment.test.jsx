import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

import { useStripePayment } from "@/src/hooks/useStripePayment";
import { CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER } from "@/src/graphql/mutations/stripe";

const wrap = (mocks) =>
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

let originalLocation;

beforeEach(() => {
  vi.clearAllMocks();
  originalLocation = window.location;
  // Make window.location.href writable so we can observe redirects.
  delete window.location;
  window.location = { href: "" };
});

afterEach(() => {
  window.location = originalLocation;
});

describe("useStripePayment", () => {
  it("redirects to Stripe Checkout on success", async () => {
    const mocks = [
      {
        request: {
          query: CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER,
          variables: { transferId: "tr-1" },
        },
        result: {
          data: {
            createPaymentSessionForFileTransfer: {
              success: true,
              sessionUrl: "https://checkout.stripe.com/abc",
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useStripePayment(), {
      wrapper: wrap(mocks),
    });

    await act(async () => {
      await result.current.initiatePayment("tr-1");
    });

    await waitFor(() =>
      expect(window.location.href).toBe("https://checkout.stripe.com/abc"),
    );
  });

  it("toasts an error when transferId is missing", async () => {
    const { result } = renderHook(() => useStripePayment(), {
      wrapper: wrap([]),
    });
    await act(async () => {
      await result.current.initiatePayment(null);
    });
    expect(toastMock.error).toHaveBeenCalledWith("ID de transfert manquant");
  });

  it("toasts the API message when success=false", async () => {
    const mocks = [
      {
        request: {
          query: CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER,
          variables: { transferId: "tr-1" },
        },
        result: {
          data: {
            createPaymentSessionForFileTransfer: {
              success: false,
              message: "Stripe down",
              sessionUrl: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useStripePayment(), {
      wrapper: wrap(mocks),
    });
    await act(async () => {
      await result.current.initiatePayment("tr-1");
    });
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Stripe down"),
    );
  });

  it("toasts when sessionUrl is missing on success=true", async () => {
    const mocks = [
      {
        request: {
          query: CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER,
          variables: { transferId: "tr-1" },
        },
        result: {
          data: {
            createPaymentSessionForFileTransfer: {
              success: true,
              sessionUrl: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useStripePayment(), {
      wrapper: wrap(mocks),
    });
    await act(async () => {
      await result.current.initiatePayment("tr-1");
    });
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("URL de paiement manquante"),
    );
  });

  it("flips isProcessing back to false on completion", async () => {
    const mocks = [
      {
        request: {
          query: CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER,
          variables: { transferId: "tr-1" },
        },
        result: {
          data: {
            createPaymentSessionForFileTransfer: {
              success: false,
              message: "x",
              sessionUrl: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useStripePayment(), {
      wrapper: wrap(mocks),
    });
    await act(async () => {
      await result.current.initiatePayment("tr-1");
    });
    await waitFor(() => expect(result.current.isProcessing).toBe(false));
  });
});
