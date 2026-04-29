import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

const { authClientMock, subscriptionMock } = vi.hoisted(() => ({
  authClientMock: { useSession: vi.fn() },
  subscriptionMock: { subscription: null, isActive: () => true },
}));

vi.mock("@/src/lib/auth-client", () => ({
  authClient: authClientMock,
}));

vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useSubscription: () => subscriptionMock,
}));

import { useStripeInvoices } from "@/src/hooks/useStripeInvoices";

beforeEach(() => {
  vi.clearAllMocks();
  authClientMock.useSession.mockReturnValue({
    data: { user: { id: "u-1" } },
  });
  subscriptionMock.subscription = { stripeCustomerId: "cus_123" };
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
  vi.stubGlobal("open", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const mockInvoicesResponse = (invoices) => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, invoices }),
  });
};

describe("useStripeInvoices — auto-fetch on mount", () => {
  it("formats Stripe invoices into the UI shape on success", async () => {
    mockInvoicesResponse([
      {
        id: "in_1",
        number: "F-001",
        created: 1700000000,
        status: "paid",
        amount_paid: 12500,
        amount_due: 12500,
        subtotal: 10000,
        tax: 2500,
        currency: "eur",
        period_start: 1700000000,
        period_end: 1702592000,
        description: "Abonnement",
        hosted_invoice_url: "https://stripe/x",
        invoice_pdf: "https://stripe/x.pdf",
      },
    ]);

    const { result } = renderHook(() => useStripeInvoices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.invoices).toHaveLength(1);
    const inv = result.current.invoices[0];
    expect(inv.amount).toMatch(/125\.00/);
    expect(inv.type).toBe("Payée");
    expect(inv.currency).toBe("EUR");
    expect(inv.amountPaid).toBe(125);
  });

  it("does not call fetch when there is no session", async () => {
    authClientMock.useSession.mockReturnValue({ data: null });
    renderHook(() => useStripeInvoices());
    // give the effect a tick
    await act(async () => {});
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not call fetch when there is no Stripe customer ID", async () => {
    subscriptionMock.subscription = null;
    renderHook(() => useStripeInvoices());
    await act(async () => {});
    expect(fetch).not.toHaveBeenCalled();
  });

  it("toasts on HTTP error", async () => {
    fetch.mockResolvedValue({ ok: false, status: 500, statusText: "Boom" });
    renderHook(() => useStripeInvoices());
    await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
  });

  it("maps statuses to French labels", async () => {
    mockInvoicesResponse([
      {
        id: "1",
        created: 0,
        status: "open",
        amount_paid: 0,
        amount_due: 0,
        subtotal: 0,
        tax: 0,
      },
      {
        id: "2",
        created: 0,
        status: "draft",
        amount_paid: 0,
        amount_due: 0,
        subtotal: 0,
        tax: 0,
      },
      {
        id: "3",
        created: 0,
        status: "void",
        amount_paid: 0,
        amount_due: 0,
        subtotal: 0,
        tax: 0,
      },
      {
        id: "4",
        created: 0,
        status: "uncollectible",
        amount_paid: 0,
        amount_due: 0,
        subtotal: 0,
        tax: 0,
      },
      {
        id: "5",
        created: 0,
        status: "weird",
        amount_paid: 0,
        amount_due: 0,
        subtotal: 0,
        tax: 0,
      },
    ]);
    const { result } = renderHook(() => useStripeInvoices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.invoices.map((i) => i.type)).toEqual([
      "En attente",
      "Brouillon",
      "Annulée",
      "Irrécupérable",
      "Inconnue",
    ]);
  });
});

describe("useStripeInvoices — downloadInvoice / viewInvoice", () => {
  const setup = async () => {
    mockInvoicesResponse([
      {
        id: "in_1",
        number: "001",
        created: 0,
        status: "paid",
        amount_paid: 1000,
        amount_due: 1000,
        subtotal: 1000,
        tax: 0,
        invoice_pdf: "https://pdf.example",
        hosted_invoice_url: "https://hosted.example",
      },
    ]);
    const hook = renderHook(() => useStripeInvoices());
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    return hook;
  };

  it("downloadInvoice opens the PDF when present", async () => {
    const { result } = await setup();
    await act(async () => result.current.downloadInvoice("in_1"));
    expect(open).toHaveBeenCalledWith("https://pdf.example", "_blank");
  });

  it("downloadInvoice toasts when invoice not found", async () => {
    const { result } = await setup();
    toastMock.error.mockClear();
    await act(async () => result.current.downloadInvoice("missing"));
    expect(toastMock.error).toHaveBeenCalled();
  });

  it("viewInvoice opens the hosted page when present", async () => {
    const { result } = await setup();
    await act(async () => result.current.viewInvoice("in_1"));
    expect(open).toHaveBeenCalledWith("https://hosted.example", "_blank");
  });
});
