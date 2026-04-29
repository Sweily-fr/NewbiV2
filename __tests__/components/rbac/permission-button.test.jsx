import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  usePermissions: vi.fn(),
  useSubscriptionAccess: vi.fn(),
}));

vi.mock("@/src/hooks/usePermissions", () => ({
  usePermissions: (...args) => mocks.usePermissions(...args),
}));

vi.mock("@/src/hooks/useSubscriptionAccess", () => ({
  useSubscriptionAccess: (...args) => mocks.useSubscriptionAccess(...args),
}));

import {
  PermissionButton,
  PermissionMenuItem,
} from "@/src/components/rbac/PermissionButton";

describe("PermissionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useSubscriptionAccess.mockReturnValue({
      isReadOnly: false,
      isOwner: false,
      loading: false,
    });
  });

  it("shows the verifying state while loading permissions", () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      isLoading: true,
      isReady: false,
    });
    render(
      <PermissionButton resource="invoices" action="create">
        Créer
      </PermissionButton>,
    );
    expect(screen.getByText(/Vérification/i)).toBeInTheDocument();
  });

  it("enables the button when permission is granted", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(true),
      hasRole: vi.fn(),
      isLoading: false,
      isReady: true,
    });
    const onClick = vi.fn();
    render(
      <PermissionButton resource="invoices" action="create" onClick={onClick}>
        Créer
      </PermissionButton>,
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Créer/i })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole("button", { name: /Créer/i }));
    expect(onClick).toHaveBeenCalled();
  });

  it("disables the button when permission is denied", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(false),
      hasRole: vi.fn(),
      isLoading: false,
      isReady: true,
    });
    render(
      <PermissionButton resource="invoices" action="delete">
        Supprimer
      </PermissionButton>,
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Supprimer/i })).toBeDisabled();
    });
  });

  it("hides the button when no access and hideIfNoAccess=true", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(false),
      hasRole: vi.fn(),
      isLoading: false,
      isReady: true,
    });
    const { container } = render(
      <PermissionButton resource="x" action="y" hideIfNoAccess>
        Hidden
      </PermissionButton>,
    );
    await waitFor(() => {
      expect(container.querySelector("button")).toBeNull();
    });
  });

  it("disables the button when subscription is read-only", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(true),
      hasRole: vi.fn(),
      isLoading: false,
      isReady: true,
    });
    mocks.useSubscriptionAccess.mockReturnValue({
      isReadOnly: true,
      isOwner: true,
      loading: false,
    });
    render(
      <PermissionButton
        resource="invoices"
        action="create"
        requiresActiveSubscription
      >
        Créer
      </PermissionButton>,
    );
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  it("uses the role check path when roles prop is provided", async () => {
    const hasRole = vi.fn().mockReturnValue(true);
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn(),
      hasRole,
      isLoading: false,
      isReady: true,
    });
    render(<PermissionButton roles="owner">OwnerBtn</PermissionButton>);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /OwnerBtn/i })).toBeEnabled();
    });
    expect(hasRole).toHaveBeenCalledWith("owner");
  });
});

describe("PermissionMenuItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useSubscriptionAccess.mockReturnValue({
      isReadOnly: false,
      isOwner: false,
      loading: false,
    });
  });

  it("calls onClick when access is granted", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(true),
      hasRole: vi.fn(),
      isLoading: false,
      isReady: true,
    });
    const onClick = vi.fn();
    render(
      <PermissionMenuItem resource="x" action="y" onClick={onClick}>
        Item
      </PermissionMenuItem>,
    );
    await waitFor(() => {
      expect(screen.getByText("Item")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Item"));
    expect(onClick).toHaveBeenCalled();
  });

  it.skip("does not call onClick when access is denied", async () => {
    mocks.usePermissions.mockReturnValue({
      hasPermission: vi.fn().mockResolvedValue(false),
      hasRole: vi.fn(),
      isLoading: false,
      isReady: true,
    });
    const onClick = vi.fn();
    render(
      <PermissionMenuItem resource="x" action="y" onClick={onClick}>
        Item
      </PermissionMenuItem>,
    );
    await waitFor(() => {
      expect(screen.getByText("Item").parentElement.className).toContain(
        "opacity-50",
      );
    });
    await userEvent.click(screen.getByText("Item"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
