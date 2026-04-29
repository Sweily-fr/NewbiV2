import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    organization: {
      getFullOrganization: vi.fn(),
    },
    admin: {
      checkRolePermission: vi.fn(() => true),
    },
  },
}));

vi.mock("@/src/lib/auth-client", () => ({
  authClient: authClientMock,
}));

vi.mock("@/src/lib/auth/hooks", () => ({
  useUser: vi.fn(),
}));

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: vi.fn(),
}));

import { usePermissions } from "@/src/hooks/usePermissions";
import { useUser } from "@/src/lib/auth/hooks";
import { useWorkspace } from "@/src/hooks/useWorkspace";

const setup = ({ role = "member", orgId = "org-1", userId = "u-1" } = {}) => {
  useUser.mockReturnValue({
    session: { user: { id: userId } },
    isPending: false,
  });
  useWorkspace.mockReturnValue({
    organization: {
      id: orgId,
      members: [{ userId, role }],
    },
    loading: false,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("usePermissions — owner & admin", () => {
  it.each([["owner"], ["admin"]])("%s has every permission", async (role) => {
    setup({ role });
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await expect(result.current.canCreate("invoices")).resolves.toBe(true);
    await expect(result.current.canDelete("clients")).resolves.toBe(true);
    await expect(result.current.canEdit("kanban")).resolves.toBe(true);
    await expect(result.current.canApprove("expenses")).resolves.toBe(true);
  });

  it("isOwner / isAdmin reflect the role", async () => {
    setup({ role: "owner" });
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.isOwner()).toBe(true);
    expect(result.current.isAdmin()).toBe(false);
  });
});

describe("usePermissions — member", () => {
  beforeEach(() => setup({ role: "member" }));

  it("can create invoices, quotes, clients", async () => {
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(result.current.canCreate("invoices")).resolves.toBe(true);
    await expect(result.current.canCreate("quotes")).resolves.toBe(true);
    await expect(result.current.canCreate("clients")).resolves.toBe(true);
  });

  it("cannot delete invoices/clients", async () => {
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(result.current.canDelete("invoices")).resolves.toBe(false);
    await expect(result.current.canDelete("clients")).resolves.toBe(false);
  });

  it("can view kanban + edit + assign tasks", async () => {
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(
      result.current.hasPermission("kanban", ["view", "edit", "assign"]),
    ).resolves.toBe(true);
  });
});

describe("usePermissions — viewer", () => {
  beforeEach(() => setup({ role: "viewer" }));

  it("can only view things", async () => {
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(result.current.canView("invoices")).resolves.toBe(true);
    await expect(result.current.canCreate("invoices")).resolves.toBe(false);
    await expect(result.current.canEdit("clients")).resolves.toBe(false);
  });
});

describe("usePermissions — accountant", () => {
  beforeEach(() => setup({ role: "accountant" }));

  it("can mark invoices as paid (specific permission)", async () => {
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(
      result.current.hasPermission("invoices", "mark-paid"),
    ).resolves.toBe(true);
  });

  it("can approve expenses but not create them", async () => {
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(result.current.canApprove("expenses")).resolves.toBe(true);
    await expect(result.current.canCreate("expenses")).resolves.toBe(false);
  });

  it("can view auditLog (specific to accountant)", async () => {
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(result.current.canView("auditLog")).resolves.toBe(true);
  });
});

describe("usePermissions — getUserRole & role normalization", () => {
  it("normalizes uppercase role to lowercase", async () => {
    useUser.mockReturnValue({
      session: { user: { id: "u-1" } },
      isPending: false,
    });
    useWorkspace.mockReturnValue({
      organization: {
        id: "org-1",
        members: [{ userId: "u-1", role: "OWNER" }],
      },
      loading: false,
    });

    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.getUserRole()).toBe("owner");
  });

  it("returns null when the user is not in members", async () => {
    useUser.mockReturnValue({
      session: { user: { id: "stranger" } },
      isPending: false,
    });
    useWorkspace.mockReturnValue({
      organization: {
        id: "org-1",
        members: [{ userId: "other", role: "owner" }],
      },
      loading: false,
    });
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.getUserRole()).toBeNull();
  });

  it("hasRole accepts a string or array", async () => {
    setup({ role: "member" });
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.hasRole("member")).toBe(true);
    expect(result.current.hasRole(["admin", "member"])).toBe(true);
    expect(result.current.hasRole(["admin", "owner"])).toBe(false);
  });
});

describe("usePermissions — canEditResource (own vs any)", () => {
  it("member can edit their own resource if the role permission exists", async () => {
    setup({ role: "member" });
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    // member has 'edit' on kanban
    await expect(result.current.canEditResource("kanban", true)).resolves.toBe(
      true,
    );
  });

  it("member cannot edit other people's resources", async () => {
    setup({ role: "member" });
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(result.current.canEditResource("kanban", false)).resolves.toBe(
      false,
    );
  });

  it("admin can edit anyone's resources", async () => {
    setup({ role: "admin" });
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(
      result.current.canEditResource("invoices", false),
    ).resolves.toBe(true);
  });

  it("viewer cannot delete anything", async () => {
    setup({ role: "viewer" });
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(
      result.current.canDeleteResource("invoices", true),
    ).resolves.toBe(false);
  });
});

describe("usePermissions — loading & isReady", () => {
  it("isLoading is true while session is pending", () => {
    useUser.mockReturnValue({ session: null, isPending: true });
    useWorkspace.mockReturnValue({ organization: null, loading: false });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isReady).toBe(false);
  });

  it("hasPermission returns false while not ready", async () => {
    useUser.mockReturnValue({ session: null, isPending: true });
    useWorkspace.mockReturnValue({ organization: null, loading: true });
    const { result } = renderHook(() => usePermissions());
    await expect(
      result.current.hasPermission("invoices", "view"),
    ).resolves.toBe(false);
  });
});

describe("usePermissions — uses pre-loaded members or fetches via authClient", () => {
  it("does not call getFullOrganization when members are already on the org", async () => {
    setup({ role: "member" });
    renderHook(() => usePermissions());
    await waitFor(() =>
      expect(
        authClientMock.organization.getFullOrganization,
      ).not.toHaveBeenCalled(),
    );
  });

  it("calls getFullOrganization when members are missing", async () => {
    useUser.mockReturnValue({
      session: { user: { id: "u-1" } },
      isPending: false,
    });
    useWorkspace.mockReturnValue({
      organization: { id: "org-1" }, // no members
      loading: false,
    });
    authClientMock.organization.getFullOrganization.mockResolvedValue({
      data: {
        id: "org-1",
        members: [{ userId: "u-1", role: "member" }],
      },
    });

    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(
      authClientMock.organization.getFullOrganization,
    ).toHaveBeenCalledWith({ organizationId: "org-1" });
  });
});
