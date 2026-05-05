import { describe, it, expect, vi, beforeEach } from "vitest";

const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    organization: {
      getFullOrganization: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      setActive: vi.fn().mockResolvedValue({}),
      getMembers: vi.fn(),
      inviteUser: vi.fn(),
    },
    useActiveOrganization: vi.fn(),
  },
}));

vi.mock("@/src/lib/auth-client", () => ({ authClient: authClientMock }));

import {
  getActiveOrganization,
  updateOrganization,
  getOrganizationMembers,
  inviteToOrganization,
} from "@/src/lib/organization-client";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("getActiveOrganization", () => {
  it("returns the active organization on success", async () => {
    authClientMock.organization.getFullOrganization.mockResolvedValue({
      data: { id: "o-1", name: "Acme" },
      error: null,
    });
    const org = await getActiveOrganization();
    expect(org).toEqual({ id: "o-1", name: "Acme" });
  });

  it("falls back to the first organization when no active one is set", async () => {
    authClientMock.organization.getFullOrganization.mockResolvedValue({
      data: null,
      error: null,
    });
    authClientMock.organization.list.mockResolvedValue({
      data: [{ id: "o-2", name: "First" }],
    });

    const org = await getActiveOrganization();
    expect(org).toEqual({ id: "o-2", name: "First" });
  });

  it("returns null when no organizations exist", async () => {
    authClientMock.organization.getFullOrganization.mockResolvedValue({
      data: null,
      error: null,
    });
    authClientMock.organization.list.mockResolvedValue({ data: [] });

    expect(await getActiveOrganization()).toBeNull();
  });

  it("re-throws when getFullOrganization throws unexpectedly", async () => {
    authClientMock.organization.getFullOrganization.mockRejectedValue(
      new Error("boom"),
    );
    await expect(getActiveOrganization()).rejects.toThrow("boom");
  });
});

describe("updateOrganization", () => {
  it("calls authClient.organization.update with the right payload + setActive", async () => {
    authClientMock.organization.update.mockResolvedValue({
      data: { id: "o-1", companyName: "Acme" },
      error: null,
    });
    const onSuccess = vi.fn();

    const result = await updateOrganization(
      "o-1",
      { companyName: "Acme" },
      { onSuccess },
    );

    expect(authClientMock.organization.update).toHaveBeenCalledWith({
      organizationId: "o-1",
      data: { companyName: "Acme" },
    });
    expect(authClientMock.organization.setActive).toHaveBeenCalledWith({
      organizationId: "o-1",
    });
    expect(onSuccess).toHaveBeenCalledWith({ id: "o-1", companyName: "Acme" });
    expect(result).toEqual({ id: "o-1", companyName: "Acme" });
  });

  it("calls onError and throws when Better Auth returns an error", async () => {
    authClientMock.organization.update.mockResolvedValue({
      data: null,
      error: { message: "Forbidden" },
    });
    const onError = vi.fn();

    await expect(
      updateOrganization("o-1", { x: 1 }, { onError }),
    ).rejects.toThrow("Forbidden");
    expect(onError).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  it("does not crash when setActive throws", async () => {
    authClientMock.organization.update.mockResolvedValue({
      data: { id: "o-1" },
      error: null,
    });
    authClientMock.organization.setActive.mockRejectedValueOnce(
      new Error("nope"),
    );

    const result = await updateOrganization("o-1", { x: 1 });
    expect(result).toEqual({ id: "o-1" });
  });
});

describe("getOrganizationMembers", () => {
  it("returns members from authClient", async () => {
    authClientMock.organization.getMembers.mockResolvedValue({
      data: [{ id: "m-1" }],
    });
    const members = await getOrganizationMembers("o-1");
    expect(members).toEqual([{ id: "m-1" }]);
    expect(authClientMock.organization.getMembers).toHaveBeenCalledWith({
      organizationId: "o-1",
    });
  });

  it("re-throws when getMembers fails", async () => {
    authClientMock.organization.getMembers.mockRejectedValue(
      new Error("denied"),
    );
    await expect(getOrganizationMembers("o-1")).rejects.toThrow("denied");
  });
});

describe("inviteToOrganization", () => {
  it("uses 'member' as the default role", async () => {
    authClientMock.organization.inviteUser.mockResolvedValue({ id: "inv" });
    await inviteToOrganization("o-1", "u@x.fr");
    expect(authClientMock.organization.inviteUser).toHaveBeenCalledWith({
      organizationId: "o-1",
      email: "u@x.fr",
      role: "member",
    });
  });

  it("respects a custom role", async () => {
    authClientMock.organization.inviteUser.mockResolvedValue({ id: "inv" });
    await inviteToOrganization("o-1", "u@x.fr", "admin");
    expect(authClientMock.organization.inviteUser).toHaveBeenCalledWith({
      organizationId: "o-1",
      email: "u@x.fr",
      role: "admin",
    });
  });

  it("re-throws on failure", async () => {
    authClientMock.organization.inviteUser.mockRejectedValue(
      new Error("rate-limited"),
    );
    await expect(inviteToOrganization("o-1", "u@x.fr")).rejects.toThrow(
      "rate-limited",
    );
  });
});
