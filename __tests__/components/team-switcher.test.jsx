import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mockUseSubscription = vi.fn();
const mockUseActiveOrganization = vi.fn();
const mockUseSidebar = vi.fn(() => ({ isMobile: false, state: "expanded" }));
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("@/src/lib/auth-client", () => ({
  authClient: {
    useActiveOrganization: (...args) => mockUseActiveOrganization(...args),
    organization: {
      setActive: vi.fn(),
      update: vi.fn(),
    },
  },
  performLogout: vi.fn(),
}));

vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useSubscription: (...args) => mockUseSubscription(...args),
}));

vi.mock("@/src/components/ui/sidebar", () => ({
  SidebarMenu: ({ children }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }) => <div>{children}</div>,
  SidebarMenuButton: ({ children, disabled, ...rest }) => (
    <button disabled={disabled} {...rest}>
      {children}
    </button>
  ),
  useSidebar: (...args) => mockUseSidebar(...args),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    error: (...args) => mockToastError(...args),
    success: (...args) => mockToastSuccess(...args),
  },
}));

vi.mock("@/src/lib/apolloClient", () => ({
  apolloClient: {
    clearStore: vi.fn(),
  },
}));

vi.mock("@/src/components/invite-member-modal", () => ({
  InviteMemberModal: () => <div data-testid="invite-modal" />,
}));

vi.mock("@/src/components/settings-modal", () => ({
  SettingsModal: () => <div data-testid="settings-modal" />,
}));

vi.mock("@/src/components/rename-organization-modal", () => ({
  RenameOrganizationModal: () => <div data-testid="rename-modal" />,
}));

vi.mock("@/src/components/icons", () => ({
  PeopleIcon: () => <span />,
  SettingIcon: () => <span />,
  ProfileAddIcon: () => <span />,
}));

import { TeamSwitcher } from "@/src/components/team-switcher";

describe("TeamSwitcher", () => {
  beforeEach(() => {
    mockUseSubscription.mockReturnValue({
      isActive: () => true,
      refreshSubscription: vi.fn(),
    });
    mockUseActiveOrganization.mockReturnValue({
      data: null,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseSidebar.mockReturnValue({ isMobile: false, state: "expanded" });

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: () =>
            Promise.resolve({
              organizations: [
                { id: "org1", name: "My Org", customColor: "#5b4fff" },
              ],
            }),
        }),
      ),
    );
  });

  it("renders the loader while organizations are loading", () => {
    render(<TeamSwitcher />);
    // Loader state shows '...' as truncated name
    expect(screen.getByAltText(/NewBi Logo/i)).toBeInTheDocument();
  });

  it("renders the organization name once loaded", async () => {
    render(<TeamSwitcher />);
    await waitFor(() => {
      expect(screen.getByText("My Org")).toBeInTheDocument();
    });
  });

  it("renders the espace count text", async () => {
    render(<TeamSwitcher />);
    await waitFor(() => {
      expect(screen.getByText(/1 espace/)).toBeInTheDocument();
    });
  });

  it("shows 'Aucune organisation' when no orgs are returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ organizations: [] }),
        }),
      ),
    );
    render(<TeamSwitcher />);
    await waitFor(() => {
      expect(screen.getByText("Aucune organisation")).toBeInTheDocument();
    });
  });

  it("handles 401 status without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: () => Promise.resolve({}),
        }),
      ),
    );
    render(<TeamSwitcher />);
    await waitFor(() => {
      expect(screen.getByText("Aucune organisation")).toBeInTheDocument();
    });
  });

  it("uses sortedOrganizations[0] when no active org", async () => {
    render(<TeamSwitcher />);
    await waitFor(() => {
      expect(screen.getByText("My Org")).toBeInTheDocument();
    });
  });
});
