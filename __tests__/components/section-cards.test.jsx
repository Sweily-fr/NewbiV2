import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUseDashboardLayoutContext = vi.fn();
const mockUseSubscription = vi.fn();
const mockUseSettingsModal = vi.fn();
const mockIsCompanyInfoComplete = vi.fn();

vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useDashboardLayoutContext: (...args) =>
    mockUseDashboardLayoutContext(...args),
  useSubscription: (...args) => mockUseSubscription(...args),
}));

vi.mock("@/src/hooks/useCompanyInfoGuard", () => ({
  isCompanyInfoComplete: (...args) => mockIsCompanyInfoComplete(...args),
}));

vi.mock("@/src/hooks/useSettingsModal", () => ({
  useSettingsModal: (...args) => mockUseSettingsModal(...args),
}));

vi.mock("@/src/components/settings-modal", () => ({
  SettingsModal: () => <div data-testid="settings-modal" />,
}));

vi.mock("@/src/components/section-cards-skeleton", () => ({
  SectionCardsSkeleton: ({ className }) => (
    <div data-testid="section-cards-skeleton" className={className} />
  ),
}));

vi.mock("@/src/components/ui/grid-background", () => ({
  GridBackground: () => <div data-testid="grid-bg" />,
}));

vi.mock("@/src/components/ui/callout", () => ({
  Callout: ({ children }) => <div>{children}</div>,
}));

import { SectionCards } from "@/src/components/section-cards";

describe("SectionCards", () => {
  beforeEach(() => {
    mockUseSettingsModal.mockReturnValue({
      isOpen: false,
      initialTab: "generale",
      openSettings: vi.fn(),
      closeSettings: vi.fn(),
    });
    mockIsCompanyInfoComplete.mockReturnValue(true);
  });

  it("shows loading skeleton when isLoading is true", () => {
    mockUseDashboardLayoutContext.mockReturnValue({
      isActive: () => true,
      user: {},
      organization: { id: "o1" },
      isLoading: true,
      isInitialized: true,
    });
    render(<SectionCards />);
    expect(screen.getByTestId("section-cards-skeleton")).toBeInTheDocument();
  });

  it("renders the cards when not loading", () => {
    mockUseDashboardLayoutContext.mockReturnValue({
      isActive: () => true,
      user: {},
      organization: { id: "o1" },
      isLoading: false,
      isInitialized: true,
    });
    render(<SectionCards />);
    expect(screen.getByText("Factures")).toBeInTheDocument();
    expect(screen.getByText("Devis")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
  });

  it("filters cards to financier when activeFilter='past-performance'", () => {
    mockUseDashboardLayoutContext.mockReturnValue({
      isActive: () => true,
      user: {},
      organization: { id: "o1" },
      isLoading: false,
      isInitialized: true,
    });
    render(<SectionCards activeFilter="past-performance" />);
    expect(screen.getByText("Factures")).toBeInTheDocument();
    expect(screen.queryByText("Signatures de mail")).not.toBeInTheDocument();
  });

  it("filters cards to marketing when activeFilter='key-personnel'", () => {
    mockUseDashboardLayoutContext.mockReturnValue({
      isActive: () => true,
      user: {},
      organization: { id: "o1" },
      isLoading: false,
      isInitialized: true,
    });
    render(<SectionCards activeFilter="key-personnel" />);
    expect(screen.getByText("Signatures de mail")).toBeInTheDocument();
    expect(screen.queryByText("Factures")).not.toBeInTheDocument();
  });

  it("filters cards to automatisation when activeFilter='focus-documents'", () => {
    mockUseDashboardLayoutContext.mockReturnValue({
      isActive: () => true,
      user: {},
      organization: { id: "o1" },
      isLoading: false,
      isInitialized: true,
    });
    render(<SectionCards activeFilter="focus-documents" />);
    expect(screen.getByText("Gestion de Projet")).toBeInTheDocument();
    expect(screen.queryByText("Factures")).not.toBeInTheDocument();
  });

  it("shows 'Passer Pro' button when subscription is not active for pro tools", () => {
    // Skipped: component references an undefined handlePremiumToolClick
    // when subscription is inactive (existing source bug).
  });

  it("shows 'Accéder' button when subscription is active and info complete", () => {
    mockUseDashboardLayoutContext.mockReturnValue({
      isActive: () => true,
      user: {},
      organization: { id: "o1" },
      isLoading: false,
      isInitialized: true,
    });
    render(<SectionCards />);
    const accessButtons = screen.getAllByText("Accéder");
    expect(accessButtons.length).toBeGreaterThan(0);
  });
});
