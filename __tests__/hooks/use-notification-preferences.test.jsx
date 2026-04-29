import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

import { useNotificationPreferences } from "@/src/hooks/useNotificationPreferences";
import { GET_NOTIFICATION_PREFERENCES } from "@/src/graphql/queries/notificationPreferences";
import { UPDATE_NOTIFICATION_PREFERENCES } from "@/src/graphql/mutations/notificationPreferences";

const wrap = (mocks) =>
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useNotificationPreferences", () => {
  it("returns the user's preferences from the query", async () => {
    const prefs = { invoiceReminders: { email: true, push: false } };
    const mocks = [
      {
        request: { query: GET_NOTIFICATION_PREFERENCES },
        result: { data: { getNotificationPreferences: prefs } },
      },
    ];

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.preferences).toEqual(prefs);
  });

  it("returns null preferences when there is no data", () => {
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: wrap([]),
    });
    expect(result.current.preferences).toBeNull();
  });

  it("updatePreference calls the mutation with a nested input shape", async () => {
    const initialPrefs = { invoiceReminders: { email: true, push: false } };
    const mocks = [
      {
        request: { query: GET_NOTIFICATION_PREFERENCES },
        result: { data: { getNotificationPreferences: initialPrefs } },
      },
      {
        request: {
          query: UPDATE_NOTIFICATION_PREFERENCES,
          variables: { input: { invoiceReminders: { email: false } } },
        },
        result: {
          data: {
            updateNotificationPreferences: {
              success: true,
              message: "Préférences enregistrées",
            },
          },
        },
      },
      // refetch after success
      {
        request: { query: GET_NOTIFICATION_PREFERENCES },
        result: {
          data: {
            getNotificationPreferences: {
              invoiceReminders: { email: false, push: false },
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updatePreference("invoiceReminders", "email", false);
    });

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Préférences enregistrées",
      ),
    );
  });

  it("toasts an error when the mutation returns success=false", async () => {
    const initialPrefs = { invoiceReminders: { email: true } };
    const mocks = [
      {
        request: { query: GET_NOTIFICATION_PREFERENCES },
        result: { data: { getNotificationPreferences: initialPrefs } },
      },
      {
        request: {
          query: UPDATE_NOTIFICATION_PREFERENCES,
          variables: { input: { invoiceReminders: { email: false } } },
        },
        result: {
          data: {
            updateNotificationPreferences: {
              success: false,
              message: "Validation échouée",
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updatePreference("invoiceReminders", "email", false);
    });

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Validation échouée"),
    );
  });

  it("updateAllPreferences forwards the full input to the mutation", async () => {
    const initialPrefs = {};
    const newPrefs = {
      invoiceReminders: { email: true, push: false },
      paymentReceived: { email: true, push: true },
    };
    const mocks = [
      {
        request: { query: GET_NOTIFICATION_PREFERENCES },
        result: { data: { getNotificationPreferences: initialPrefs } },
      },
      {
        request: {
          query: UPDATE_NOTIFICATION_PREFERENCES,
          variables: { input: newPrefs },
        },
        result: {
          data: {
            updateNotificationPreferences: {
              success: true,
              message: "OK",
            },
          },
        },
      },
      {
        request: { query: GET_NOTIFICATION_PREFERENCES },
        result: { data: { getNotificationPreferences: newPrefs } },
      },
    ];

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateAllPreferences(newPrefs);
    });
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
  });
});
