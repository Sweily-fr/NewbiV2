import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Hoisted mocks ---------------------------------------------------------
const { authClientMock, performLogoutMock } = vi.hoisted(() => {
  return {
    authClientMock: {
      signIn: {
        email: vi.fn(),
        social: vi.fn(),
      },
      signUp: {
        email: vi.fn(),
      },
      getSession: vi.fn(),
      updateUser: vi.fn(),
      sendVerificationEmail: vi.fn(),
      getAccessToken: vi.fn(),
    },
    performLogoutMock: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/src/lib/auth-client", () => ({
  authClient: authClientMock,
  performLogout: performLogoutMock,
}));

import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  verifyEmail,
  signInGoogle,
  signInGithub,
  getGoogleAccessToken,
  getGoogleUserProfile,
} from "@/src/lib/auth/api";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  // Reset every mock fn
  authClientMock.signIn.email.mockReset();
  authClientMock.signIn.social.mockReset();
  authClientMock.signUp.email.mockReset();
  authClientMock.getSession.mockReset();
  authClientMock.updateUser.mockReset();
  authClientMock.sendVerificationEmail.mockReset();
  authClientMock.getAccessToken.mockReset();
});

describe("loginUser", () => {
  it("returns data on successful login", async () => {
    authClientMock.signIn.email.mockResolvedValue({
      data: { user: { id: "u-1" } },
      error: null,
    });
    const out = await loginUser({ email: "u@x.fr", password: "secret" }, true);
    expect(out).toEqual({ user: { id: "u-1" } });
    expect(authClientMock.signIn.email).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "u@x.fr",
        password: "secret",
        rememberMe: true,
      }),
      expect.any(Object),
    );
  });

  it("defaults rememberMe to false when omitted", async () => {
    authClientMock.signIn.email.mockResolvedValue({
      data: {},
      error: null,
    });
    await loginUser({ email: "u@x.fr", password: "p" });
    expect(authClientMock.signIn.email.mock.calls[0][0].rememberMe).toBe(false);
  });

  it("throws when login returns an error object", async () => {
    authClientMock.signIn.email.mockResolvedValue({
      data: null,
      error: { message: "Invalid credentials" },
    });
    await expect(
      loginUser({ email: "u@x.fr", password: "bad" }),
    ).rejects.toThrow(/Invalid credentials/);
  });

  it("throws default message when error has no message", async () => {
    authClientMock.signIn.email.mockResolvedValue({
      data: null,
      error: {},
    });
    await expect(
      loginUser({ email: "u@x.fr", password: "bad" }),
    ).rejects.toThrow(/Erreur de connexion/);
  });

  it("throws when signIn rejects", async () => {
    authClientMock.signIn.email.mockRejectedValue(new Error("Network error"));
    await expect(loginUser({ email: "u@x.fr", password: "p" })).rejects.toThrow(
      /Network error/,
    );
  });
});

describe("registerUser", () => {
  it("returns data on success", async () => {
    authClientMock.signUp.email.mockResolvedValue({
      data: { user: { id: "u-2" } },
      error: null,
    });
    const out = await registerUser({
      email: "u@x.fr",
      password: "p",
      name: "User",
    });
    expect(out).toEqual({ user: { id: "u-2" } });
    expect(authClientMock.signUp.email).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "u@x.fr",
        password: "p",
        name: "User",
        callbackURL: "/dashboard",
      }),
    );
  });

  it("defaults name to empty string when missing", async () => {
    authClientMock.signUp.email.mockResolvedValue({
      data: {},
      error: null,
    });
    await registerUser({ email: "u@x.fr", password: "p" });
    expect(authClientMock.signUp.email.mock.calls[0][0].name).toBe("");
  });

  it("translates email-exists error", async () => {
    authClientMock.signUp.email.mockResolvedValue({
      data: null,
      error: { message: "Email already exists" },
    });
    await expect(
      registerUser({ email: "u@x.fr", password: "p" }),
    ).rejects.toThrow(/déjà utilisé/);
  });

  it("translates generic 'already' error", async () => {
    authClientMock.signUp.email.mockResolvedValue({
      data: null,
      error: { message: "User already registered" },
    });
    await expect(
      registerUser({ email: "u@x.fr", password: "p" }),
    ).rejects.toThrow(/déjà utilisé/);
  });

  it("propagates other errors", async () => {
    authClientMock.signUp.email.mockResolvedValue({
      data: null,
      error: { message: "Password too weak" },
    });
    await expect(
      registerUser({ email: "u@x.fr", password: "p" }),
    ).rejects.toThrow(/Password too weak/);
  });
});

describe("logoutUser", () => {
  it("calls performLogout and returns true", async () => {
    const out = await logoutUser();
    expect(performLogoutMock).toHaveBeenCalled();
    expect(out).toBe(true);
  });
});

describe("getCurrentUser", () => {
  it("returns user from session", async () => {
    authClientMock.getSession.mockResolvedValue({
      data: { user: { id: "u-3", email: "u@x.fr" } },
      error: null,
    });
    const out = await getCurrentUser();
    expect(out).toEqual({ id: "u-3", email: "u@x.fr" });
  });

  it("returns null when error is present", async () => {
    authClientMock.getSession.mockResolvedValue({
      data: null,
      error: { message: "Not authenticated" },
    });
    expect(await getCurrentUser()).toBeNull();
  });

  it("returns null when no user in data", async () => {
    authClientMock.getSession.mockResolvedValue({
      data: {},
      error: null,
    });
    expect(await getCurrentUser()).toBeNull();
  });

  it("returns null on rejection", async () => {
    authClientMock.getSession.mockRejectedValue(new Error("boom"));
    expect(await getCurrentUser()).toBeNull();
  });
});

describe("updateUserProfile", () => {
  it("returns data on success", async () => {
    authClientMock.updateUser.mockResolvedValue({
      data: { id: "u-1", name: "Updated" },
      error: null,
    });
    const out = await updateUserProfile({ name: "Updated" });
    expect(out).toEqual({ id: "u-1", name: "Updated" });
    expect(authClientMock.updateUser).toHaveBeenCalledWith({ name: "Updated" });
  });

  it("throws when error is returned", async () => {
    authClientMock.updateUser.mockResolvedValue({
      data: null,
      error: { message: "Validation failed" },
    });
    await expect(updateUserProfile({ name: "x" })).rejects.toThrow(
      /Validation failed/,
    );
  });

  it("throws on rejection", async () => {
    authClientMock.updateUser.mockRejectedValue(new Error("Net err"));
    await expect(updateUserProfile({ name: "x" })).rejects.toThrow(/Net err/);
  });
});

describe("verifyEmail", () => {
  it("calls sendVerificationEmail with email and callback URL", async () => {
    authClientMock.sendVerificationEmail.mockResolvedValue({});
    await verifyEmail("u@x.fr");
    expect(authClientMock.sendVerificationEmail).toHaveBeenCalledWith({
      email: "u@x.fr",
      callbackURL: "/dashboard",
    });
  });

  it("throws on rejection", async () => {
    authClientMock.sendVerificationEmail.mockRejectedValue(
      new Error("SMTP down"),
    );
    await expect(verifyEmail("u@x.fr")).rejects.toThrow(/SMTP down/);
  });
});

describe("signInGoogle / signInGithub", () => {
  it("signInGoogle: calls social provider google", async () => {
    authClientMock.signIn.social.mockResolvedValue({ ok: true });
    const out = await signInGoogle();
    expect(out).toEqual({ ok: true });
    expect(authClientMock.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/dashboard",
    });
  });

  it("signInGoogle: rethrows error", async () => {
    authClientMock.signIn.social.mockRejectedValue(new Error("Google down"));
    await expect(signInGoogle()).rejects.toThrow(/Google down/);
  });

  it("signInGithub: calls social provider github", async () => {
    authClientMock.signIn.social.mockResolvedValue({ ok: true });
    const out = await signInGithub();
    expect(out).toEqual({ ok: true });
    expect(authClientMock.signIn.social).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/dashboard",
    });
  });

  it("signInGithub: rethrows error", async () => {
    authClientMock.signIn.social.mockRejectedValue(new Error("GH down"));
    await expect(signInGithub()).rejects.toThrow(/GH down/);
  });
});

describe("getGoogleAccessToken", () => {
  it("returns the access token wrapped", async () => {
    authClientMock.getAccessToken.mockResolvedValue({
      accessToken: "tok-1",
    });
    const out = await getGoogleAccessToken("acc-1");
    expect(out).toEqual({ accessToken: "tok-1" });
    expect(authClientMock.getAccessToken).toHaveBeenCalledWith({
      providerId: "google",
      accountId: "acc-1",
    });
  });

  it("throws on rejection", async () => {
    authClientMock.getAccessToken.mockRejectedValue(new Error("denied"));
    await expect(getGoogleAccessToken()).rejects.toThrow(/denied/);
  });
});

describe("getGoogleUserProfile", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns parsed profile JSON when fetch succeeds", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ email: "u@x.fr", name: "User" }),
    });
    const out = await getGoogleUserProfile("tok-1");
    expect(out).toEqual({ email: "u@x.fr", name: "User" });
    expect(fetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      expect.objectContaining({
        headers: { Authorization: "Bearer tok-1" },
      }),
    );
  });

  it("throws when response not ok", async () => {
    fetch.mockResolvedValue({ ok: false, status: 401 });
    await expect(getGoogleUserProfile("bad-tok")).rejects.toThrow(
      /Erreur API Google/,
    );
  });

  it("throws when fetch itself rejects", async () => {
    fetch.mockRejectedValue(new Error("DNS"));
    await expect(getGoogleUserProfile("tok")).rejects.toThrow(/DNS/);
  });
});
