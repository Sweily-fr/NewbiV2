import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Hoisted mocks ---------------------------------------------------------
const {
  createAuthClientMock,
  authClientStub,
  apolloClientMock,
  resetOrgIdMock,
  pluginMocks,
} = vi.hoisted(() => {
  const authClientStub = {
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
    updateUser: vi.fn(),
    forgetPassword: vi.fn(),
    resetPassword: vi.fn(),
    useSession: vi.fn(),
    admin: {},
    organization: {},
    twoFactor: {},
    multiSession: {},
  };
  const createAuthClientMock = vi.fn((cfg) => {
    authClientStub.__cfg = cfg;
    return authClientStub;
  });

  const pluginMocks = {
    adminClient: vi.fn((cfg) => ({ name: "admin", cfg })),
    organizationClient: vi.fn((cfg) => ({ name: "organization", cfg })),
    inferOrgAdditionalFields: vi.fn((cfg) => ({ ...cfg, __inferred: true })),
    phoneNumberClient: vi.fn(() => ({ name: "phoneNumber" })),
    twoFactorClient: vi.fn((cfg) => ({ name: "twoFactor", cfg })),
    multiSessionClient: vi.fn(() => ({ name: "multiSession" })),
    stripeClient: vi.fn((cfg) => ({ name: "stripe", cfg })),
  };

  const apolloClientMock = {
    clearStore: vi.fn().mockResolvedValue(undefined),
  };
  const resetOrgIdMock = vi.fn();

  return {
    createAuthClientMock,
    authClientStub,
    apolloClientMock,
    resetOrgIdMock,
    pluginMocks,
  };
});

vi.mock("better-auth/react", () => ({
  createAuthClient: createAuthClientMock,
}));

vi.mock("better-auth/client/plugins", () => ({
  adminClient: pluginMocks.adminClient,
  organizationClient: pluginMocks.organizationClient,
  inferOrgAdditionalFields: pluginMocks.inferOrgAdditionalFields,
  phoneNumberClient: pluginMocks.phoneNumberClient,
  twoFactorClient: pluginMocks.twoFactorClient,
  multiSessionClient: pluginMocks.multiSessionClient,
}));

vi.mock("@better-auth/stripe/client", () => ({
  stripeClient: pluginMocks.stripeClient,
}));

vi.mock("@/src/lib/permissions", () => ({
  ac: { name: "ac" },
  admin: { name: "admin-role" },
  member: { name: "member-role" },
  viewer: { name: "viewer-role" },
  accountant: { name: "accountant-role" },
}));

// Apollo dynamic import target (used by performLogout)
vi.mock("@/src/lib/apolloClient", () => ({
  apolloClient: apolloClientMock,
  resetOrganizationIdForApollo: resetOrgIdMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});

  // Reset window.location for tests that assert redirects
  delete window.location;
  window.location = { href: "" };

  // Clean up any localStorage entries from previous tests
  localStorage.clear();
});

describe("authClient init", () => {
  it("calls createAuthClient with the correct baseURL and plugin list", async () => {
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "https://newbi.fr";
    vi.resetModules();
    await import("@/src/lib/auth-client");

    expect(createAuthClientMock).toHaveBeenCalledTimes(1);
    const cfg = createAuthClientMock.mock.calls[0][0];
    // baseURL intentionally omitted — Better Auth uses relative "/api/auth" fallback
    // which works on localhost, IP, and production without configuration
    expect(cfg.baseURL).toBeUndefined();
    expect(cfg.sessionOptions.refetchOnWindowFocus).toBe(false);

    const pluginNames = cfg.plugins.map((p) => p.name);
    expect(pluginNames).toEqual(
      expect.arrayContaining([
        "admin",
        "phoneNumber",
        "twoFactor",
        "multiSession",
        "organization",
        "stripe",
      ]),
    );
  });

  it("does not set baseURL (uses Better Auth relative fallback)", async () => {
    delete process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    vi.resetModules();
    await import("@/src/lib/auth-client");
    const cfg = createAuthClientMock.mock.calls[0][0];
    expect(cfg.baseURL).toBeUndefined();
  });

  it("re-exports auth helpers from authClient", async () => {
    vi.resetModules();
    const mod = await import("@/src/lib/auth-client");
    expect(mod.signIn).toBe(authClientStub.signIn);
    expect(mod.signOut).toBe(authClientStub.signOut);
    expect(mod.useSession).toBe(authClientStub.useSession);
    expect(mod.organization).toBe(authClientStub.organization);
  });

  it("twoFactorClient is configured with onTwoFactorRedirect that navigates to /auth/verify-2fa", async () => {
    vi.resetModules();
    await import("@/src/lib/auth-client");

    const tfCfg = pluginMocks.twoFactorClient.mock.calls.at(-1)[0];
    expect(typeof tfCfg.onTwoFactorRedirect).toBe("function");

    tfCfg.onTwoFactorRedirect();
    expect(window.location.href).toBe("/auth/verify-2fa");
  });

  it("organizationClient receives schema with the inferred additional fields", async () => {
    vi.resetModules();
    await import("@/src/lib/auth-client");

    expect(pluginMocks.inferOrgAdditionalFields).toHaveBeenCalled();
    const orgCfg = pluginMocks.organizationClient.mock.calls.at(-1)[0];
    expect(orgCfg.schema.__inferred).toBe(true);
    expect(orgCfg.schema.organization.additionalFields).toMatchObject({
      companyName: { type: "string" },
      isVatSubject: { type: "boolean" },
      trialStartDate: { type: "string" },
    });
  });
});

describe("clearSessionStorage", () => {
  it("removes auth-related keys from localStorage", async () => {
    localStorage.setItem("user-cache", "x");
    localStorage.setItem("active_organization_id", "o1");
    localStorage.setItem("user_role", "admin");
    localStorage.setItem("onboarding_step", "2");
    localStorage.setItem("subscription-foo", "v");
    localStorage.setItem("unrelated", "keep-me");

    vi.resetModules();
    const { clearSessionStorage } = await import("@/src/lib/auth-client");
    clearSessionStorage();

    expect(localStorage.getItem("user-cache")).toBeNull();
    expect(localStorage.getItem("active_organization_id")).toBeNull();
    expect(localStorage.getItem("user_role")).toBeNull();
    expect(localStorage.getItem("onboarding_step")).toBe("2"); // Not cleared (migrated to DB)
    expect(localStorage.getItem("subscription-foo")).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep-me");
  });
});

describe("performLogout", () => {
  it("clears storage, resets Apollo, signs out, and redirects", async () => {
    vi.resetModules();
    const { performLogout } = await import("@/src/lib/auth-client");

    localStorage.setItem("user-cache", "x");
    await performLogout({ redirectTo: "/auth/login" });

    expect(localStorage.getItem("user-cache")).toBeNull();
    expect(resetOrgIdMock).toHaveBeenCalled();
    expect(apolloClientMock.clearStore).toHaveBeenCalled();
    expect(authClientStub.signOut).toHaveBeenCalled();
    expect(window.location.href).toBe("/auth/login");
  });

  it("respects useHardRedirect=false (no window.location change)", async () => {
    vi.resetModules();
    const { performLogout } = await import("@/src/lib/auth-client");

    window.location.href = "before";
    await performLogout({ redirectTo: "/x", useHardRedirect: false });
    expect(window.location.href).toBe("before");
  });

  it("still redirects when signOut throws", async () => {
    vi.resetModules();
    const { performLogout } = await import("@/src/lib/auth-client");

    authClientStub.signOut.mockRejectedValueOnce(new Error("network down"));
    await performLogout({ redirectTo: "/auth/login" });
    expect(window.location.href).toBe("/auth/login");
    expect(console.error).toHaveBeenCalled();
  });
});
