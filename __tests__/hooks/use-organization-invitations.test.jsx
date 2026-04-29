import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const useSessionMock = vi.fn();
const useListOrganizationsMock = vi.fn();
const useActiveOrganizationMock = vi.fn();
const inviteMemberApi = vi.fn();
const removeMemberApi = vi.fn();
const getFullOrganizationApi = vi.fn();
const setActiveApi = vi.fn();

vi.mock("@/src/lib/auth-client", () => ({
  useSession: () => useSessionMock(),
  organization: {
    inviteMember: (...args) => inviteMemberApi(...args),
    removeMember: (...args) => removeMemberApi(...args),
    getFullOrganization: (...args) => getFullOrganizationApi(...args),
    setActive: (...args) => setActiveApi(...args),
  },
  authClient: {
    useListOrganizations: () => useListOrganizationsMock(),
    useActiveOrganization: () => useActiveOrganizationMock(),
  },
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { toast } from "@/src/components/ui/sonner";

beforeEach(() => {
  useSessionMock.mockReset();
  useListOrganizationsMock.mockReset();
  useActiveOrganizationMock.mockReset();
  inviteMemberApi.mockReset();
  removeMemberApi.mockReset();
  getFullOrganizationApi.mockReset();
  setActiveApi.mockReset();
  vi.clearAllMocks();

  // Sensible defaults
  useSessionMock.mockReturnValue({ data: { user: { id: "u-1" } } });
  useListOrganizationsMock.mockReturnValue({ data: [{ id: "org-1" }] });
  useActiveOrganizationMock.mockReturnValue({ data: { id: "org-1" } });

  // Default fetch mock for /api/billing/check-user-limit
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ canInvite: true, isPaid: false }),
      }),
    ),
  );
});

describe("useOrganizationInvitations.inviteMember", () => {
  it("invites successfully and returns success=true", async () => {
    inviteMemberApi.mockResolvedValue({
      data: { invitation: { id: "inv-1" } },
      error: null,
    });

    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.inviteMember({
        email: "alice@example.fr",
        role: "member",
      });
    });

    expect(out.success).toBe(true);
    expect(inviteMemberApi).toHaveBeenCalledWith({
      email: "alice@example.fr",
      role: "member",
      organizationId: "org-1",
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("blocks when limit check fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              canInvite: false,
              reason: "Plan limité à 3 membres",
            }),
        }),
      ),
    );

    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.inviteMember({
        email: "x@x.fr",
        role: "member",
      });
    });

    expect(out.success).toBe(false);
    expect(out.error).toMatch(/limité/);
    expect(inviteMemberApi).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it("blocks when limit-check fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network"))),
    );

    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.inviteMember({ email: "x@x.fr" });
    });

    expect(out.success).toBe(false);
    expect(inviteMemberApi).not.toHaveBeenCalled();
  });

  it("blocks when not authenticated", async () => {
    useSessionMock.mockReturnValue({ data: null });
    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.inviteMember({ email: "x@x.fr" });
    });
    expect(out.success).toBe(false);
    expect(inviteMemberApi).not.toHaveBeenCalled();
  });

  it("propagates Better Auth error", async () => {
    inviteMemberApi.mockResolvedValue({
      data: null,
      error: { message: "Email already invited" },
    });

    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.inviteMember({ email: "x@x.fr" });
    });
    expect(out.success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Email already invited");
  });

  it("supports explicit organizationId parameter", async () => {
    inviteMemberApi.mockResolvedValue({
      data: { invitation: { id: "i" } },
      error: null,
    });

    const { result } = renderHook(() => useOrganizationInvitations());
    await act(async () => {
      await result.current.inviteMember({
        email: "x@x.fr",
        organizationId: "org-explicit",
      });
    });

    expect(inviteMemberApi).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-explicit" }),
    );
  });
});

describe("useOrganizationInvitations.listMembers", () => {
  it("returns members excluding owners", async () => {
    getFullOrganizationApi.mockResolvedValue({
      data: {
        members: [
          { id: "m-1", role: "owner" },
          { id: "m-2", role: "admin" },
          { id: "m-3", role: "member" },
        ],
      },
      error: null,
    });

    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.listMembers();
    });
    expect(out.success).toBe(true);
    expect(out.data).toHaveLength(2);
    expect(out.data.find((m) => m.role === "owner")).toBeUndefined();
  });

  it("returns error when no organization", async () => {
    useListOrganizationsMock.mockReturnValue({ data: [] });
    useActiveOrganizationMock.mockReturnValue({ data: null });

    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.listMembers();
    });
    expect(out.success).toBe(false);
    expect(out.error).toMatch(/Aucune/);
  });

  it("propagates Better Auth error", async () => {
    getFullOrganizationApi.mockResolvedValue({
      data: null,
      error: { message: "Forbidden" },
    });
    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.listMembers();
    });
    expect(out.success).toBe(false);
  });
});

describe("useOrganizationInvitations.listInvitations", () => {
  it("returns invitations from getFullOrganization", async () => {
    getFullOrganizationApi.mockResolvedValue({
      data: {
        invitations: [
          { id: "i-1", email: "a@a.fr" },
          { id: "i-2", email: "b@b.fr" },
        ],
      },
      error: null,
    });

    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.listInvitations();
    });
    expect(out.success).toBe(true);
    expect(out.data).toHaveLength(2);
  });

  it("returns [] when no invitations", async () => {
    getFullOrganizationApi.mockResolvedValue({
      data: { invitations: null },
      error: null,
    });
    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.listInvitations();
    });
    expect(out.data).toEqual([]);
  });
});

describe("useOrganizationInvitations.removeMember", () => {
  it("removes member and triggers seat sync", async () => {
    removeMemberApi.mockResolvedValue({ data: { ok: true }, error: null });
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true }),
        }),
      ),
    );

    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.removeMember("m-1");
    });

    expect(removeMemberApi).toHaveBeenCalledWith({
      memberIdOrEmail: "m-1",
      organizationId: "org-1",
    });
  });

  it("returns success=false when Better Auth errors", async () => {
    removeMemberApi.mockResolvedValue({
      data: null,
      error: { message: "Cannot remove owner" },
    });
    const { result } = renderHook(() => useOrganizationInvitations());

    let out;
    await act(async () => {
      out = await result.current.removeMember("m-1");
    });
    expect(out.success).toBe(false);
  });
});
