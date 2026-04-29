import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  usePermissions: vi.fn(),
}));

vi.mock("@/src/hooks/usePermissions", () => ({
  usePermissions: (...args) => mocks.usePermissions(...args),
}));

import {
  PermissionGate,
  RoleGate,
  OwnerOnly,
  AdminOnly,
} from "@/src/components/rbac/PermissionGate";

describe("PermissionGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when permission is granted", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(true),
      hasRole: vi.fn(),
    });
    render(
      <PermissionGate resource="invoices" action="create">
        <div data-testid="content">Allowed</div>
      </PermissionGate>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  it("renders fallback when permission is denied", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(false),
      hasRole: vi.fn(),
    });
    render(
      <PermissionGate
        resource="invoices"
        action="delete"
        fallback={<div data-testid="fallback">Nope</div>}
      >
        <div data-testid="content">Allowed</div>
      </PermissionGate>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("renders a loading slot while checking", async () => {
    let resolvePerm;
    const promise = new Promise((r) => {
      resolvePerm = r;
    });
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(promise),
      hasRole: vi.fn(),
    });
    render(
      <PermissionGate
        resource="invoices"
        action="create"
        loading={<div data-testid="loading">Checking</div>}
      >
        <div>Content</div>
      </PermissionGate>,
    );
    expect(screen.getByTestId("loading")).toBeInTheDocument();
    resolvePerm(true);
  });

  it("renders children based on roles", async () => {
    const hasRole = vi.fn().mockReturnValue(true);
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn(),
      hasRole,
    });
    render(
      <PermissionGate roles={["owner", "admin"]}>
        <div data-testid="content">Admin only</div>
      </PermissionGate>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
    expect(hasRole).toHaveBeenCalledWith(["owner", "admin"]);
  });

  it("denies on permission check error", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockRejectedValue(new Error("boom")),
      hasRole: vi.fn(),
    });
    render(
      <PermissionGate
        resource="x"
        action="y"
        fallback={<div data-testid="fallback">denied</div>}
      >
        <div>Content</div>
      </PermissionGate>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
    });
  });

  it("renders children when no criteria provided", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
    });
    render(
      <PermissionGate>
        <div data-testid="content">Default allow</div>
      </PermissionGate>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });
});

describe("OwnerOnly / AdminOnly", () => {
  it("OwnerOnly delegates to RoleGate with owner role", async () => {
    const hasRole = vi.fn().mockReturnValue(true);
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn(),
      hasRole,
    });
    render(
      <OwnerOnly>
        <div data-testid="owner">Owner-only</div>
      </OwnerOnly>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("owner")).toBeInTheDocument();
    });
    expect(hasRole).toHaveBeenCalledWith("owner");
  });

  it("AdminOnly delegates with owner+admin", async () => {
    const hasRole = vi.fn().mockReturnValue(false);
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn(),
      hasRole,
    });
    render(
      <AdminOnly fallback={<div data-testid="fb">no</div>}>
        <div>Admin</div>
      </AdminOnly>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("fb")).toBeInTheDocument();
    });
    expect(hasRole).toHaveBeenCalledWith(["owner", "admin"]);
  });
});
