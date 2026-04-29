import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/src/components/email-verification-badge-header", () => ({
  EmailVerificationBadgeHeader: () => (
    <div data-testid="email-verification-badge">Badge</div>
  ),
}));

vi.mock("@/src/components/organization-switcher-header", () => ({
  OrganizationSwitcherHeader: () => (
    <div data-testid="org-switcher">OrgSwitcher</div>
  ),
}));

vi.mock("@/src/components/ui/sidebar", () => ({
  SidebarTrigger: ({ className }) => (
    <button data-testid="sidebar-trigger" className={className}>
      Trigger
    </button>
  ),
}));

vi.mock("@/src/components/ui/separator", () => ({
  Separator: (props) => <div data-testid="separator" {...props} />,
}));

const mockUseEmailVerification = vi.fn(() => ({ isVerified: true }));
vi.mock("@/src/hooks/useEmailVerification", () => ({
  useEmailVerification: (...args) => mockUseEmailVerification(...args),
}));

import { SiteHeader } from "@/src/components/site-header";

describe("SiteHeader", () => {
  it("renders within Suspense and shows the org switcher", () => {
    render(<SiteHeader />);
    expect(screen.getByTestId("org-switcher")).toBeInTheDocument();
  });

  it("renders the email verification badge", () => {
    render(<SiteHeader />);
    expect(screen.getByTestId("email-verification-badge")).toBeInTheDocument();
  });

  it("renders the sidebar trigger button", () => {
    render(<SiteHeader />);
    expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
  });

  it("renders a separator", () => {
    render(<SiteHeader />);
    expect(screen.getByTestId("separator")).toBeInTheDocument();
  });

  it("renders inside a header element", () => {
    const { container } = render(<SiteHeader />);
    expect(container.querySelector("header")).toBeTruthy();
  });
});
