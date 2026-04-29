import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  usePermissions: vi.fn(),
  push: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/src/hooks/usePermissions", () => ({
  usePermissions: (...args) => mocks.usePermissions(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    error: (...args) => mocks.toastError(...args),
    success: vi.fn(),
  },
}));

import {
  RBACRouteGuard,
  RoleRouteGuard,
  OwnerRouteGuard,
  AdminRouteGuard,
} from "@/src/components/rbac/RBACRouteGuard";

describe("RBACRouteGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the loading state while permissions are loading", () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn(),
      isLoading: true,
      isReady: false,
    });
    render(
      <RBACRouteGuard resource="invoices" action="create">
        <div data-testid="content">Protected</div>
      </RBACRouteGuard>,
    );
    expect(
      screen.getByText(/Vérification des permissions/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("renders the children when access is granted", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(true),
      isLoading: false,
      isReady: true,
    });
    render(
      <RBACRouteGuard resource="invoices" action="create">
        <div data-testid="content">Protected</div>
      </RBACRouteGuard>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  it("redirects when access is denied", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(false),
      isLoading: false,
      isReady: true,
    });
    render(
      <RBACRouteGuard
        resource="invoices"
        action="delete"
        fallbackUrl="/dashboard"
      >
        <div>Protected</div>
      </RBACRouteGuard>,
    );
    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays a toast when access is denied and showToast is true", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(false),
      isLoading: false,
      isReady: true,
    });
    render(
      <RBACRouteGuard resource="x" action="y" toastMessage="No access">
        <div>Protected</div>
      </RBACRouteGuard>,
    );
    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("No access");
    });
  });

  it("uses a custom loading component if provided", () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn(),
      isLoading: true,
      isReady: false,
    });
    render(
      <RBACRouteGuard
        resource="x"
        action="y"
        loadingComponent={<div data-testid="custom-loader">loading...</div>}
      >
        <div>Protected</div>
      </RBACRouteGuard>,
    );
    expect(screen.getByTestId("custom-loader")).toBeInTheDocument();
  });
});

describe("RoleRouteGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading until user role is resolved", () => {
    mocks.usePermissions.mockReturnValue({
      getUserRole: () => null,
    });
    const { container } = render(
      <RoleRouteGuard roles="owner">
        <div data-testid="content">x</div>
      </RoleRouteGuard>,
    );
    // loading svg is rendered
    expect(container.querySelector(".animate-spin")).toBeTruthy();
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("renders children when role matches", async () => {
    mocks.usePermissions.mockReturnValue({
      getUserRole: () => "owner",
    });
    render(
      <RoleRouteGuard roles={["owner", "admin"]}>
        <div data-testid="content">ok</div>
      </RoleRouteGuard>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  it("redirects when role does not match", async () => {
    mocks.usePermissions.mockReturnValue({
      getUserRole: () => "viewer",
    });
    render(
      <RoleRouteGuard roles="owner" fallbackUrl="/somewhere">
        <div>x</div>
      </RoleRouteGuard>,
    );
    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/somewhere");
    });
  });
});

describe("OwnerRouteGuard / AdminRouteGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("OwnerRouteGuard redirects when not owner", async () => {
    mocks.usePermissions.mockReturnValue({
      getUserRole: () => "member",
    });
    render(
      <OwnerRouteGuard fallbackUrl="/x">
        <div>x</div>
      </OwnerRouteGuard>,
    );
    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/x");
    });
  });

  it("AdminRouteGuard allows admin", async () => {
    mocks.usePermissions.mockReturnValue({
      getUserRole: () => "admin",
    });
    render(
      <AdminRouteGuard>
        <div data-testid="content">ok</div>
      </AdminRouteGuard>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });
});
