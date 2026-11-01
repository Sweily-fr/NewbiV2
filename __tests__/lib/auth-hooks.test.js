import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture the middleware fn passed to createAuthMiddleware so we can invoke it directly
const { capturedMiddlewares, createAuthMiddlewareMock, APIErrorMock } =
  vi.hoisted(() => {
    const capturedMiddlewares = [];
    const createAuthMiddlewareMock = vi.fn((fn) => {
      capturedMiddlewares.push(fn);
      return fn;
    });
    class APIErrorMock extends Error {
      constructor(code, body) {
        super(body?.message || code);
        this.code = code;
        this.body = body;
        this.name = "APIError";
      }
    }
    return { capturedMiddlewares, createAuthMiddlewareMock, APIErrorMock };
  });

vi.mock("better-auth/api", () => ({
  createAuthMiddleware: createAuthMiddlewareMock,
  APIError: APIErrorMock,
}));

const { sendReactivationEmailMock } = vi.hoisted(() => ({
  sendReactivationEmailMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/src/lib/auth-utils", () => ({
  sendReactivationEmail: sendReactivationEmailMock,
}));

const { findOneMock, deleteManyMock, getMongoDbMock } = vi.hoisted(() => {
  const findOneMock = vi.fn();
  const deleteManyMock = vi.fn();
  const getMongoDbMock = vi.fn(async () => ({
    collection: vi.fn((name) => {
      if (name === "user") return { findOne: findOneMock };
      if (name === "member") return { deleteMany: deleteManyMock };
      return {};
    }),
  }));
  return { findOneMock, deleteManyMock, getMongoDbMock };
});

vi.mock("@/src/lib/mongodb", () => ({
  getMongoDb: getMongoDbMock,
  mongoDb: {},
}));

vi.mock("mongodb", () => ({
  ObjectId: vi.fn(function MockObjectId(id) {
    return { _id: id, toString: () => id };
  }),
}));

import { beforeSignInHook, afterHook } from "@/src/lib/auth-hooks";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("beforeSignInHook", () => {
  it("is registered via createAuthMiddleware", () => {
    // createAuthMiddlewareMock's call history is wiped by the
    // vi.clearAllMocks() in beforeEach (it only ran once, at import time,
    // before any test executed) — capturedMiddlewares is a plain array
    // unaffected by clearAllMocks, so it still reflects the import-time call.
    expect(capturedMiddlewares.length).toBeGreaterThan(0);
    expect(typeof beforeSignInHook).toBe("function");
  });

  it("returns early for non sign-in/email paths", async () => {
    await beforeSignInHook({ path: "/sign-up/email", body: {} });
    expect(getMongoDbMock).not.toHaveBeenCalled();
  });

  it("returns early when email is missing", async () => {
    await beforeSignInHook({ path: "/sign-in/email", body: {} });
    expect(getMongoDbMock).not.toHaveBeenCalled();
  });

  it("does nothing when user is active", async () => {
    findOneMock.mockResolvedValue({ email: "u@x.fr", isActive: true });
    await beforeSignInHook({
      path: "/sign-in/email",
      body: { email: "u@x.fr" },
    });
    expect(sendReactivationEmailMock).not.toHaveBeenCalled();
  });

  it("does nothing when user is not found", async () => {
    findOneMock.mockResolvedValue(null);
    await beforeSignInHook({
      path: "/sign-in/email",
      body: { email: "missing@x.fr" },
    });
    expect(sendReactivationEmailMock).not.toHaveBeenCalled();
  });

  it("sends reactivation email and throws APIError when user is inactive", async () => {
    const user = { email: "u@x.fr", isActive: false };
    findOneMock.mockResolvedValue(user);

    await expect(
      beforeSignInHook({
        path: "/sign-in/email",
        body: { email: "u@x.fr" },
      }),
    ).rejects.toBeInstanceOf(APIErrorMock);

    expect(sendReactivationEmailMock).toHaveBeenCalledWith(user);
  });

  it("compte désactivé saisi en majuscules et avec des espaces : cherché en minuscules, refusé", async () => {
    const user = { email: "u@x.fr", isActive: false };
    findOneMock.mockResolvedValue(user);

    await expect(
      beforeSignInHook({
        path: "/sign-in/email",
        body: { email: "  U@X.FR " },
      }),
    ).rejects.toBeInstanceOf(APIErrorMock);

    expect(findOneMock).toHaveBeenCalledWith({ email: "u@x.fr" });
    expect(sendReactivationEmailMock).toHaveBeenCalledWith(user);
  });

  it("adresse envoyée comme un objet (opérateur MongoDB) : refusée sans lecture ni e-mail", async () => {
    await expect(
      beforeSignInHook({
        path: "/sign-in/email",
        body: { email: { $regex: "^a" }, password: "x" },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(findOneMock).not.toHaveBeenCalled();
    expect(sendReactivationEmailMock).not.toHaveBeenCalled();
  });

  it("swallows non-APIError exceptions (logs but does not block sign-in)", async () => {
    findOneMock.mockRejectedValue(new Error("DB down"));
    await expect(
      beforeSignInHook({
        path: "/sign-in/email",
        body: { email: "u@x.fr" },
      }),
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});

describe("afterHook", () => {
  const USER_ID = "665f1f77bcf86cd799439011";

  it("deletes orphan members on /admin/remove-user once the user is gone", async () => {
    deleteManyMock.mockResolvedValue({ deletedCount: 2 });
    findOneMock.mockResolvedValue(null);
    await afterHook({
      path: "/admin/remove-user",
      body: { userId: USER_ID },
      context: { returned: { success: true } },
    });

    expect(deleteManyMock).toHaveBeenCalledTimes(1);
    const filter = deleteManyMock.mock.calls[0][0];
    expect(filter.$or).toBeDefined();
    expect(filter.$or[1]).toEqual({ userId: USER_ID });
  });

  it("/admin/remove-user refusée (droits) : aucun membre supprimé", async () => {
    const refus = new APIErrorMock("FORBIDDEN", { message: "not allowed" });
    for (const returned of [refus, undefined, null, { success: false }]) {
      await afterHook({
        path: "/admin/remove-user",
        body: { userId: USER_ID },
        context: { returned },
      });
    }
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("/admin/remove-user : compte toujours présent, aucun membre supprimé", async () => {
    findOneMock.mockResolvedValue({ _id: USER_ID });
    await afterHook({
      path: "/admin/remove-user",
      body: { userId: USER_ID },
      context: { returned: { success: true } },
    });
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("/admin/remove-user : identifiant qui n'en est pas un, aucun membre supprimé", async () => {
    for (const userId of [{ $ne: null }, "user-123", ["x"]]) {
      await afterHook({
        path: "/admin/remove-user",
        body: { userId },
        context: { returned: { success: true } },
      });
    }
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("on /admin/remove-user without userId, does nothing and returns", async () => {
    await afterHook({
      path: "/admin/remove-user",
      body: {},
      context: {},
    });
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("returns early when path is not a callback", async () => {
    const findMany = vi.fn();
    await afterHook({
      path: "/some/other/path",
      context: { adapter: { findMany }, newSession: null },
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("OAuth callback: queries memberships when session exists", async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: "m1" }]);
    await afterHook({
      path: "/callback/google",
      context: {
        adapter: { findMany },
        newSession: {
          user: { email: "u@x.fr" },
          session: { userId: "user-1" },
        },
      },
    });

    expect(findMany).toHaveBeenCalledWith({
      model: "member",
      where: [{ field: "userId", value: "user-1" }],
    });
  });

  it("OAuth callback: handles zero memberships without throwing", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await expect(
      afterHook({
        path: "/callback/github",
        context: {
          adapter: { findMany },
          newSession: {
            user: { email: "u@x.fr" },
            session: { userId: "user-1" },
          },
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("OAuth callback: swallows adapter errors", async () => {
    const findMany = vi.fn().mockRejectedValue(new Error("oops"));
    await expect(
      afterHook({
        path: "/callback/google",
        context: {
          adapter: { findMany },
          newSession: {
            user: { email: "u@x.fr" },
            session: { userId: "user-1" },
          },
        },
      }),
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("OAuth callback: returns early when newSession is missing", async () => {
    const findMany = vi.fn();
    await afterHook({
      path: "/callback/google",
      context: { adapter: { findMany }, newSession: null },
    });
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("beforeSignInHook : proxy d'autorisation de l'application mobile", () => {
  it("adresse d'un autre domaine : refusée avant toute redirection", async () => {
    await expect(
      beforeSignInHook({
        path: "/expo-authorization-proxy",
        query: {
          authorizationURL: "https://exemple.invalid/",
          oauthState: "x",
        },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("adresse de Google (connexion de l'application) : laissée passer", async () => {
    await expect(
      beforeSignInHook({
        path: "/expo-authorization-proxy",
        query: {
          authorizationURL:
            "https://accounts.google.com/o/oauth2/v2/auth?state=abc",
        },
      }),
    ).resolves.toBeUndefined();
  });
});
