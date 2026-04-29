import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockPathname = "/dashboard/factures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseSubscription = vi.fn();

vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useSubscription: (...args) => mockUseSubscription(...args),
}));

vi.mock("lucide-react", () => ({
  Loader2: () => <span data-testid="loader" />,
}));

import { ProRouteGuard } from "@/src/components/pro-route-guard";

describe("ProRouteGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/dashboard/factures";
  });

  it("shows a loader while subscription is loading", () => {
    mockUseSubscription.mockReturnValue({
      isActive: () => false,
      loading: true,
      hasInitialized: false,
    });

    render(
      <ProRouteGuard pageName="Factures">
        <div data-testid="child">Content</div>
      </ProRouteGuard>,
    );

    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("shows children once initialized and subscription is active", async () => {
    mockUseSubscription.mockReturnValue({
      isActive: () => true,
      loading: false,
      hasInitialized: true,
    });

    render(
      <ProRouteGuard pageName="Factures">
        <div data-testid="child">Content</div>
      </ProRouteGuard>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  it("renders children for read-only pages even with inactive subscription", async () => {
    mockPathname = "/dashboard/factures";
    mockUseSubscription.mockReturnValue({
      isActive: () => false,
      loading: false,
      hasInitialized: true,
    });

    render(
      <ProRouteGuard pageName="Factures">
        <div data-testid="child">Read-only content</div>
      </ProRouteGuard>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard for /new pages with inactive subscription", async () => {
    mockPathname = "/dashboard/factures/new";
    mockUseSubscription.mockReturnValue({
      isActive: () => false,
      loading: false,
      hasInitialized: true,
    });

    render(
      <ProRouteGuard pageName="Factures">
        <div data-testid="child">New invoice</div>
      </ProRouteGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("redirects to /dashboard for /editer pages with inactive subscription", async () => {
    mockPathname = "/dashboard/devis/editer/123";
    mockUseSubscription.mockReturnValue({
      isActive: () => false,
      loading: false,
      hasInitialized: true,
    });

    render(
      <ProRouteGuard pageName="Devis">
        <div data-testid="child">Edit quote</div>
      </ProRouteGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("does not redirect on write pages when subscription is active", async () => {
    mockPathname = "/dashboard/factures/new";
    mockUseSubscription.mockReturnValue({
      isActive: () => true,
      loading: false,
      hasInitialized: true,
    });

    render(
      <ProRouteGuard pageName="Factures">
        <div data-testid="child">New invoice</div>
      </ProRouteGuard>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("uses requirePaidSubscription flag when calling isActive", async () => {
    const isActiveSpy = vi.fn(() => true);
    mockUseSubscription.mockReturnValue({
      isActive: isActiveSpy,
      loading: false,
      hasInitialized: true,
    });

    render(
      <ProRouteGuard pageName="Factures" requirePaidSubscription>
        <div data-testid="child">Content</div>
      </ProRouteGuard>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(isActiveSpy).toHaveBeenCalledWith(true);
  });

  it("only redirects once even on multiple effect runs", async () => {
    mockPathname = "/dashboard/factures/nouveau";
    mockUseSubscription.mockReturnValue({
      isActive: () => false,
      loading: false,
      hasInitialized: true,
    });

    const { rerender } = render(
      <ProRouteGuard pageName="Factures">
        <div>Body</div>
      </ProRouteGuard>,
    );

    rerender(
      <ProRouteGuard pageName="Factures">
        <div>Body 2</div>
      </ProRouteGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
    expect(mockReplace.mock.calls.length).toBe(1);
  });
});
