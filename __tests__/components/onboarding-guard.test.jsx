import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockPathname = "/dashboard";

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

const mockUseSession = vi.fn();
const mockUseActiveOrganization = vi.fn();

vi.mock("@/src/lib/auth-client", () => ({
  useSession: (...args) => mockUseSession(...args),
}));

vi.mock("@/src/lib/organization-client", () => ({
  useActiveOrganization: (...args) => mockUseActiveOrganization(...args),
}));

vi.mock("lucide-react", () => ({
  LoaderCircle: () => <span data-testid="loader" />,
}));

import OnboardingGuard from "@/src/components/onboarding-guard";

describe("OnboardingGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/dashboard";
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
    // Default fetch mock
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "active" }),
        }),
      ),
    );
  });

  it("shows a loader when session is pending", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true });
    mockUseActiveOrganization.mockReturnValue({
      organization: null,
      loading: false,
    });

    render(
      <OnboardingGuard>
        <div data-testid="child">Protected</div>
      </OnboardingGuard>,
    );

    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("shows a loader when organization is loading", () => {
    mockUseSession.mockReturnValue({
      data: { user: { hasSeenOnboarding: true } },
      isPending: false,
    });
    mockUseActiveOrganization.mockReturnValue({
      organization: null,
      loading: true,
    });

    render(
      <OnboardingGuard>
        <div data-testid="child">Protected</div>
      </OnboardingGuard>,
    );

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders children when not authenticated (middleware handles)", async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    mockUseActiveOrganization.mockReturnValue({
      organization: null,
      loading: false,
    });

    render(
      <OnboardingGuard>
        <div data-testid="child">Public</div>
      </OnboardingGuard>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  it("redirects to /auth/signup when hasSeenOnboarding is false", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { hasSeenOnboarding: false } },
      isPending: false,
    });
    mockUseActiveOrganization.mockReturnValue({
      organization: null,
      loading: false,
    });

    render(
      <OnboardingGuard>
        <div>Body</div>
      </OnboardingGuard>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/signup");
    });
  });

  it("renders children when onboarding is fully complete", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { hasSeenOnboarding: true } },
      isPending: false,
    });
    mockUseActiveOrganization.mockReturnValue({
      organization: { id: "org-1", onboardingCompleted: true },
      loading: false,
    });

    render(
      <OnboardingGuard>
        <div data-testid="child">Dashboard</div>
      </OnboardingGuard>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not redirect when on /auth/signup page already", async () => {
    mockPathname = "/auth/signup";
    mockUseSession.mockReturnValue({
      data: { user: { hasSeenOnboarding: false } },
      isPending: false,
    });
    mockUseActiveOrganization.mockReturnValue({
      organization: null,
      loading: false,
    });

    render(
      <OnboardingGuard>
        <div data-testid="child">Signup</div>
      </OnboardingGuard>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not redirect when on /onboarding page already", async () => {
    mockPathname = "/onboarding/step-1";
    mockUseSession.mockReturnValue({
      data: { user: { hasSeenOnboarding: false } },
      isPending: false,
    });
    mockUseActiveOrganization.mockReturnValue({
      organization: null,
      loading: false,
    });

    render(
      <OnboardingGuard>
        <div data-testid="child">Onboarding</div>
      </OnboardingGuard>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("saves the workspace step in localStorage when no step is set", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { hasSeenOnboarding: false } },
      isPending: false,
    });
    mockUseActiveOrganization.mockReturnValue({
      organization: null,
      loading: false,
    });

    render(
      <OnboardingGuard>
        <div>Body</div>
      </OnboardingGuard>,
    );

    await waitFor(() => {
      expect(window.localStorage.getItem("onboarding_step")).toBe("workspace");
    });
  });
});
