import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import {
  MY_STRIPE_CONNECT_ACCOUNT,
  CREATE_STRIPE_CONNECT_ACCOUNT,
  GENERATE_STRIPE_ONBOARDING_LINK,
  DISCONNECT_STRIPE_ACCOUNT,
} from "@/src/graphql/mutations/stripe";

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
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  originalLocation = window.location;
  delete window.location;
  window.location = { href: "", origin: "https://app.newbi.fr" };
});

afterEach(() => {
  window.location = originalLocation;
  vi.restoreAllMocks();
});

describe("useStripeConnect — initial state", () => {
  it("returns disconnected when no Stripe account exists", async () => {
    const mocks = [
      {
        request: { query: MY_STRIPE_CONNECT_ACCOUNT },
        result: { data: { myStripeConnectAccount: null } },
      },
    ];
    const { result } = renderHook(() => useStripeConnect("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isOnboarded).toBe(false);
    expect(result.current.canReceivePayments).toBe(false);
    expect(result.current.accountStatus).toBe("not_connected");
  });

  it("returns connected+onboarded when account is fully set up", async () => {
    const mocks = [
      {
        request: { query: MY_STRIPE_CONNECT_ACCOUNT },
        result: {
          data: {
            myStripeConnectAccount: {
              accountId: "acct_123",
              isOnboarded: true,
              chargesEnabled: true,
              accountStatus: "active",
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useStripeConnect("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isOnboarded).toBe(true);
    expect(result.current.canReceivePayments).toBe(true);
    expect(result.current.accountStatus).toBe("active");
  });

  it("skips the query when no organizationId", async () => {
    const { result } = renderHook(() => useStripeConnect(null), {
      wrapper: wrap([]),
    });
    expect(result.current.isConnected).toBe(false);
  });
});

describe("useStripeConnect — connectStripe", () => {
  it("creates a new Stripe account and redirects to onboarding", async () => {
    const mocks = [
      {
        request: { query: MY_STRIPE_CONNECT_ACCOUNT },
        result: { data: { myStripeConnectAccount: null } },
      },
      {
        request: { query: CREATE_STRIPE_CONNECT_ACCOUNT },
        result: {
          data: {
            createStripeConnectAccount: {
              success: true,
              accountId: "acct_new",
            },
          },
        },
      },
      {
        request: {
          query: GENERATE_STRIPE_ONBOARDING_LINK,
          variables: {
            accountId: "acct_new",
            returnUrl:
              "https://app.newbi.fr/dashboard?stripe_step1_complete=true",
          },
        },
        result: {
          data: {
            generateStripeOnboardingLink: {
              success: true,
              url: "https://connect.stripe.com/onboarding/acct_new",
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useStripeConnect("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.connectStripe();
    });

    await waitFor(() =>
      expect(window.location.href).toBe(
        "https://connect.stripe.com/onboarding/acct_new",
      ),
    );
  });

  it("uses the existing accountId without re-creating", async () => {
    const mocks = [
      {
        request: { query: MY_STRIPE_CONNECT_ACCOUNT },
        result: {
          data: {
            myStripeConnectAccount: {
              accountId: "acct_existing",
              isOnboarded: false,
              chargesEnabled: false,
              accountStatus: "pending",
            },
          },
        },
      },
      {
        request: {
          query: GENERATE_STRIPE_ONBOARDING_LINK,
          variables: {
            accountId: "acct_existing",
            returnUrl:
              "https://app.newbi.fr/dashboard?stripe_step1_complete=true",
          },
        },
        result: {
          data: {
            generateStripeOnboardingLink: {
              success: true,
              url: "https://connect.stripe.com/onboarding/acct_existing",
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useStripeConnect("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.connectStripe();
    });

    await waitFor(() =>
      expect(window.location.href).toContain("acct_existing"),
    );
  });

  it("captures error message when account creation fails", async () => {
    const mocks = [
      {
        request: { query: MY_STRIPE_CONNECT_ACCOUNT },
        result: { data: { myStripeConnectAccount: null } },
      },
      {
        request: { query: CREATE_STRIPE_CONNECT_ACCOUNT },
        result: {
          data: {
            createStripeConnectAccount: {
              success: false,
              message: "Compte limité par Stripe",
              accountId: null,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useStripeConnect("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.connectStripe();
    });

    await waitFor(() =>
      expect(result.current.error).toBe("Compte limité par Stripe"),
    );
  });
});

describe("useStripeConnect — disconnectStripe", () => {
  it("rejects when no Stripe account exists", async () => {
    const mocks = [
      {
        request: { query: MY_STRIPE_CONNECT_ACCOUNT },
        result: { data: { myStripeConnectAccount: null } },
      },
    ];

    const { result } = renderHook(() => useStripeConnect("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.disconnectStripe();
    });

    expect(result.current.error).toMatch(/Aucun compte/i);
  });

  it("calls the disconnect mutation when an account exists", async () => {
    const mocks = [
      {
        request: { query: MY_STRIPE_CONNECT_ACCOUNT },
        result: {
          data: {
            myStripeConnectAccount: {
              accountId: "acct_123",
              isOnboarded: true,
              chargesEnabled: true,
              accountStatus: "active",
            },
          },
        },
      },
      {
        request: { query: DISCONNECT_STRIPE_ACCOUNT },
        result: {
          data: { disconnectStripe: { success: true, message: "OK" } },
        },
      },
      // refetch
      {
        request: { query: MY_STRIPE_CONNECT_ACCOUNT },
        result: { data: { myStripeConnectAccount: null } },
      },
    ];

    const { result } = renderHook(() => useStripeConnect("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    await act(async () => {
      await result.current.disconnectStripe();
    });
    expect(result.current.error).toBeNull();
  });
});

describe("useStripeConnect — clearError", () => {
  it("resets the error to null", async () => {
    const mocks = [
      {
        request: { query: MY_STRIPE_CONNECT_ACCOUNT },
        result: { data: { myStripeConnectAccount: null } },
      },
    ];
    const { result } = renderHook(() => useStripeConnect("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Force an error state via disconnect
    await act(async () => {
      await result.current.disconnectStripe();
    });
    expect(result.current.error).toBeTruthy();

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
