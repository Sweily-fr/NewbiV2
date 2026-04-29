import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockGetSession = vi.fn();
const mockUseSubscription = vi.fn();

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    error: (...args) => mockToastError(...args),
    success: (...args) => mockToastSuccess(...args),
  },
}));

vi.mock("@/src/lib/auth-client", () => ({
  authClient: {
    getSession: (...args) => mockGetSession(...args),
  },
}));

vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useSubscription: (...args) => mockUseSubscription(...args),
}));

import { PricingModal } from "@/src/components/pricing-modal";

describe("PricingModal", () => {
  beforeEach(() => {
    mockToastError.mockClear();
    mockToastSuccess.mockClear();
    mockGetSession.mockReset();
    mockUseSubscription.mockReturnValue({ subscription: null });
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ url: "https://stripe.example/checkout" }),
        }),
      ),
    );
  });

  it("renders the modal title when open", () => {
    render(<PricingModal isOpen={true} onClose={vi.fn()} />);
    expect(
      screen.getByText(/Choisissez le plan qui vous convient/i),
    ).toBeInTheDocument();
  });

  it("does not render content when isOpen is false", () => {
    render(<PricingModal isOpen={false} onClose={vi.fn()} />);
    expect(
      screen.queryByText(/Choisissez le plan qui vous convient/i),
    ).not.toBeInTheDocument();
  });

  it("renders all three plan names", () => {
    render(<PricingModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Freelance")).toBeInTheDocument();
    expect(screen.getByText("TPE")).toBeInTheDocument();
    expect(screen.getByText("Entreprise")).toBeInTheDocument();
  });

  it("renders monthly/annual toggle", () => {
    render(<PricingModal isOpen={true} onClose={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /Mensuel/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Annuel/i })).toBeInTheDocument();
  });

  it("toggles to annual pricing when annual button clicked", () => {
    render(<PricingModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Annuel/i }));
    // Annual price for Freelance is "16,19 €/mois"
    expect(screen.getByText(/16,19 €\/mois/)).toBeInTheDocument();
  });

  it("shows 'Plan actuel' for the current subscription plan", () => {
    mockUseSubscription.mockReturnValue({
      subscription: { plan: "freelance" },
    });
    render(<PricingModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Plan actuel")).toBeInTheDocument();
  });

  it("calls Stripe endpoint when 'Choisir Freelance' clicked with no subscription", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { activeOrganizationId: "org1" } },
    });
    delete window.location;
    window.location = { href: "" };

    render(<PricingModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Choisir Freelance/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/create-org-subscription",
        expect.any(Object),
      );
    });
  });

  it("displays an error toast when no organization is found", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: {} },
    });

    render(<PricingModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Choisir Freelance/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Aucune organisation active trouvée",
      );
    });
  });
});
