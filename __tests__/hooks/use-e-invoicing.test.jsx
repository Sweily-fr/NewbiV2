import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

// useRequiredWorkspace is consumed by every hook in this file. Mock to a stable value.
vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1" }),
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));

import {
  useEInvoicingSettings,
  useEInvoicingStats,
  useToggleEInvoicing,
  useTestSuperPdpConnection,
  useResendInvoice,
  useCheckRecipient,
} from "@/src/hooks/useEInvoicing";

import {
  GET_EINVOICING_SETTINGS,
  GET_EINVOICING_STATS,
  ENABLE_EINVOICING,
  DISABLE_EINVOICING,
  TEST_SUPERPDP_CONNECTION,
  RESEND_INVOICE_TO_SUPERPDP,
  CHECK_RECIPIENT_EINVOICING,
} from "@/src/graphql/eInvoicingQueries";

import { toast } from "@/src/components/ui/sonner";

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
});

describe("useEInvoicingSettings", () => {
  it("returns query data when present", async () => {
    const mocks = [
      {
        request: {
          query: GET_EINVOICING_SETTINGS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            eInvoicingSettings: {
              eInvoicingEnabled: true,
              superPdpConfigured: true,
              superPdpWebhookConfigured: true,
              superPdpClientId: "cid",
              superPdpEnvironment: "production",
              eInvoicingActivatedAt: "2026-04-15T00:00:00Z",
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useEInvoicingSettings(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings.eInvoicingEnabled).toBe(true);
    expect(result.current.settings.superPdpEnvironment).toBe("production");
  });

  it("returns sensible defaults when no data yet", () => {
    const { result } = renderHook(() => useEInvoicingSettings(), {
      wrapper: wrap([]),
    });
    expect(result.current.settings.eInvoicingEnabled).toBe(false);
    expect(result.current.settings.superPdpEnvironment).toBe("sandbox");
  });
});

describe("useEInvoicingStats", () => {
  it("returns stats from the query", async () => {
    const mocks = [
      {
        request: {
          query: GET_EINVOICING_STATS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            eInvoicingStats: {
              totalSent: 12,
              totalFailed: 1,
              totalPending: 0,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useEInvoicingStats(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats?.totalSent).toBe(12);
  });
});

describe("useToggleEInvoicing.enable", () => {
  it("returns success=true and toasts on connection verified", async () => {
    const mocks = [
      {
        request: {
          query: ENABLE_EINVOICING,
          variables: { workspaceId: "ws-1", environment: "sandbox" },
        },
        result: {
          data: {
            enableEInvoicing: {
              success: true,
              connectionVerified: true,
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useToggleEInvoicing(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.enable("sandbox");
    });
    expect(out.success).toBe(true);
    expect(out.connectionVerified).toBe(true);
    expect(toast.success).toHaveBeenCalled();
  });

  it("warns when connection NOT verified", async () => {
    const mocks = [
      {
        request: {
          query: ENABLE_EINVOICING,
          variables: { workspaceId: "ws-1", environment: "sandbox" },
        },
        result: {
          data: {
            enableEInvoicing: {
              success: true,
              connectionVerified: false,
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useToggleEInvoicing(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.enable("sandbox");
    });
    expect(out.success).toBe(true);
    expect(toast.warning).toHaveBeenCalled();
  });

  it("returns success=false on backend error", async () => {
    const mocks = [
      {
        request: {
          query: ENABLE_EINVOICING,
          variables: { workspaceId: "ws-1", environment: "sandbox" },
        },
        result: {
          data: {
            enableEInvoicing: {
              success: false,
              connectionVerified: false,
              message: "Bad creds",
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useToggleEInvoicing(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.enable("sandbox");
    });
    expect(out.success).toBe(false);
    expect(out.error).toBe("Bad creds");
    expect(toast.error).toHaveBeenCalled();
  });
});

describe("useToggleEInvoicing.disable", () => {
  it("returns success=true on disable success", async () => {
    const mocks = [
      {
        request: {
          query: DISABLE_EINVOICING,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            disableEInvoicing: { success: true, message: null },
          },
        },
      },
    ];
    const { result } = renderHook(() => useToggleEInvoicing(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.disable();
    });
    expect(out.success).toBe(true);
    expect(toast.success).toHaveBeenCalled();
  });
});

describe("useTestSuperPdpConnection.testConnection", () => {
  it("returns profile on success", async () => {
    const mocks = [
      {
        request: {
          query: TEST_SUPERPDP_CONNECTION,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            testSuperPdpConnection: {
              success: true,
              profile: { siret: "12345678901234" },
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useTestSuperPdpConnection(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.testConnection();
    });
    expect(out.success).toBe(true);
    expect(out.profile.siret).toBe("12345678901234");
  });

  it("returns success=false on failure", async () => {
    const mocks = [
      {
        request: {
          query: TEST_SUPERPDP_CONNECTION,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            testSuperPdpConnection: {
              success: false,
              profile: null,
              message: "Bad credentials",
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useTestSuperPdpConnection(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.testConnection();
    });
    expect(out.success).toBe(false);
    expect(out.error).toBe("Bad credentials");
  });
});

describe("useResendInvoice.resend", () => {
  it("returns success+id on resend success", async () => {
    const mocks = [
      {
        request: {
          query: RESEND_INVOICE_TO_SUPERPDP,
          variables: { workspaceId: "ws-1", invoiceId: "inv-1" },
        },
        result: {
          data: {
            resendInvoiceToSuperPdp: {
              success: true,
              superPdpInvoiceId: "sp-123",
              status: "SENT",
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useResendInvoice(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.resend("inv-1");
    });
    expect(out.success).toBe(true);
    expect(out.superPdpInvoiceId).toBe("sp-123");
    expect(out.status).toBe("SENT");
  });
});

describe("useCheckRecipient.checkRecipient", () => {
  it("toasts success when recipient can receive", async () => {
    const mocks = [
      {
        request: {
          query: CHECK_RECIPIENT_EINVOICING,
          variables: { workspaceId: "ws-1", siret: "12345678901234" },
        },
        result: {
          data: {
            checkRecipientEInvoicing: {
              success: true,
              canReceiveEInvoices: true,
              pdpName: "Pdp 1",
              error: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useCheckRecipient(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.checkRecipient("12345678901234");
    });
    expect(out.success).toBe(true);
    expect(toast.success).toHaveBeenCalled();
  });

  it("toasts warning when recipient cannot receive", async () => {
    const mocks = [
      {
        request: {
          query: CHECK_RECIPIENT_EINVOICING,
          variables: { workspaceId: "ws-1", siret: "12345678901234" },
        },
        result: {
          data: {
            checkRecipientEInvoicing: {
              success: true,
              canReceiveEInvoices: false,
              pdpName: null,
              error: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useCheckRecipient(), {
      wrapper: wrap(mocks),
    });

    await act(async () => {
      await result.current.checkRecipient("12345678901234");
    });
    expect(toast.warning).toHaveBeenCalled();
  });
});
