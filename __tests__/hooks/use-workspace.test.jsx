import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";

const {
  useSessionMock,
  useListOrganizationsMock,
  useActiveOrganizationMock,
  getFullOrganizationMock,
  setOrganizationIdForApolloMock,
  resetOrganizationIdForApolloMock,
  clearStoreMock,
} = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
  useListOrganizationsMock: vi.fn(),
  useActiveOrganizationMock: vi.fn(),
  getFullOrganizationMock: vi.fn(),
  setOrganizationIdForApolloMock: vi.fn(),
  resetOrganizationIdForApolloMock: vi.fn(),
  clearStoreMock: vi.fn(),
}));

vi.mock("@/src/lib/auth-client", () => ({
  useSession: () => useSessionMock(),
  authClient: {
    useListOrganizations: () => useListOrganizationsMock(),
    useActiveOrganization: () => useActiveOrganizationMock(),
    organization: {
      getFullOrganization: (...args) => getFullOrganizationMock(...args),
    },
  },
}));

vi.mock("@/src/lib/apolloClient", () => ({
  setOrganizationIdForApollo: setOrganizationIdForApolloMock,
  resetOrganizationIdForApollo: resetOrganizationIdForApolloMock,
  apolloClient: { clearStore: clearStoreMock },
}));

import { useWorkspace, useRequiredWorkspace } from "@/src/hooks/useWorkspace";

beforeEach(() => {
  useSessionMock.mockReset();
  useListOrganizationsMock.mockReset();
  useActiveOrganizationMock.mockReset();
  getFullOrganizationMock.mockReset();
  setOrganizationIdForApolloMock.mockClear();
  resetOrganizationIdForApolloMock.mockClear();
  clearStoreMock.mockClear();
  if (typeof localStorage !== "undefined") localStorage.clear();
});

describe("useWorkspace", () => {
  it("returns null workspaceId when no active organization", () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "u-1" }, session: { activeOrganizationId: null } },
      isPending: false,
    });
    useListOrganizationsMock.mockReturnValue({
      data: [],
      isPending: false,
    });
    useActiveOrganizationMock.mockReturnValue({
      data: null,
      isPending: false,
    });

    const { result } = renderHook(() => useWorkspace());
    expect(result.current.workspaceId).toBeNull();
    expect(result.current.organization).toBeNull();
    expect(result.current.organizations).toEqual([]);
  });

  it("returns workspaceId when activeOrganization matches session", async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: { id: "u-1" },
        session: { activeOrganizationId: "org-1" },
      },
      isPending: false,
    });
    useListOrganizationsMock.mockReturnValue({
      data: [{ id: "org-1", name: "Org 1" }],
      isPending: false,
    });
    useActiveOrganizationMock.mockReturnValue({
      data: {
        id: "org-1",
        name: "Org 1",
        members: [{ userId: "u-1", role: "owner" }],
      },
      isPending: false,
    });

    const { result } = renderHook(() => useWorkspace());
    await waitFor(() => expect(result.current.workspaceId).toBe("org-1"));
    expect(result.current.organization?.name).toBe("Org 1");
    expect(result.current.organizations).toHaveLength(1);
  });

  it("stores user_role in localStorage when member found", async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: { id: "u-1" },
        session: { activeOrganizationId: "org-1" },
      },
      isPending: false,
    });
    useListOrganizationsMock.mockReturnValue({ data: [], isPending: false });
    useActiveOrganizationMock.mockReturnValue({
      data: {
        id: "org-1",
        members: [{ userId: "u-1", role: "ADMIN" }],
      },
      isPending: false,
    });

    renderHook(() => useWorkspace());
    await waitFor(() => {
      expect(localStorage.getItem("user_role")).toBe("admin");
    });
  });

  it("loading flag reflects underlying hooks", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: true });
    useListOrganizationsMock.mockReturnValue({
      data: null,
      isPending: false,
    });
    useActiveOrganizationMock.mockReturnValue({
      data: null,
      isPending: false,
    });

    const { result } = renderHook(() => useWorkspace());
    expect(result.current.loading).toBe(true);
  });

  it("triggers reset when user changes between renders", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "u-1" }, session: {} },
      isPending: false,
    });
    useListOrganizationsMock.mockReturnValue({ data: [], isPending: false });
    useActiveOrganizationMock.mockReturnValue({ data: null, isPending: false });

    const { rerender } = renderHook(() => useWorkspace());

    // Switch to another user
    useSessionMock.mockReturnValue({
      data: { user: { id: "u-2" }, session: {} },
      isPending: false,
    });
    rerender();

    await waitFor(() => {
      expect(resetOrganizationIdForApolloMock).toHaveBeenCalled();
      expect(clearStoreMock).toHaveBeenCalled();
    });
  });

  it("fetches full organization when members are missing", async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: { id: "u-1" },
        session: { activeOrganizationId: "org-1" },
      },
      isPending: false,
    });
    useListOrganizationsMock.mockReturnValue({ data: [], isPending: false });
    useActiveOrganizationMock.mockReturnValue({
      data: { id: "org-1", name: "Org 1" }, // no members
      isPending: false,
    });
    getFullOrganizationMock.mockResolvedValue({
      data: {
        id: "org-1",
        name: "Org 1",
        members: [{ userId: "u-1", role: "owner" }],
      },
    });

    renderHook(() => useWorkspace());
    await waitFor(() => {
      expect(getFullOrganizationMock).toHaveBeenCalledWith({
        organizationId: "org-1",
      });
    });
  });
});

describe("useRequiredWorkspace", () => {
  it("returns error when no workspace selected", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    useListOrganizationsMock.mockReturnValue({ data: [], isPending: false });
    useActiveOrganizationMock.mockReturnValue({ data: null, isPending: false });

    const { result } = renderHook(() => useRequiredWorkspace());
    expect(result.current.workspaceId).toBeNull();
    expect(result.current.error).toBe("Aucun workspace sélectionné");
  });

  it("returns no error when workspace is loaded", async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: { id: "u-1" },
        session: { activeOrganizationId: "org-1" },
      },
      isPending: false,
    });
    useListOrganizationsMock.mockReturnValue({ data: [], isPending: false });
    useActiveOrganizationMock.mockReturnValue({
      data: { id: "org-1", members: [] },
      isPending: false,
    });

    const { result } = renderHook(() => useRequiredWorkspace());
    await waitFor(() => expect(result.current.workspaceId).toBe("org-1"));
    expect(result.current.error).toBeNull();
  });

  it("returns no error while still loading", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: true });
    useListOrganizationsMock.mockReturnValue({ data: null, isPending: false });
    useActiveOrganizationMock.mockReturnValue({
      data: null,
      isPending: false,
    });

    const { result } = renderHook(() => useRequiredWorkspace());
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
  });
});
