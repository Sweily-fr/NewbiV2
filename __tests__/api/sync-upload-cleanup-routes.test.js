// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Routes auparavant sans authentification ou sans contrôle d'identité :
 * synchro d'abonnement, upload d'image, nettoyage des fichiers temporaires.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  memberFindOne: vi.fn(),
  subscriptionDocs: vi.fn(async () => []),
  subscriptionsList: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") return { findOne: m.memberFindOne };
      if (name === "subscription") {
        return { find: () => ({ toArray: m.subscriptionDocs }) };
      }
      throw new Error(`Collection inattendue : ${name}`);
    },
  },
}));

vi.mock("stripe", () => {
  function Stripe() {
    return { subscriptions: { list: m.subscriptionsList } };
  }
  return { default: Stripe };
});

const userId = "507f1f77bcf86cd799439011";
const otherUserId = "507f1f77bcf86cd799439099";
const orgId = "507f1f77bcf86cd799439022";
const COOKIE = "better-auth.session_token=abc";

function signIn() {
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "u@x.fr" },
    session: { activeOrganizationId: orgId },
  });
}

const jsonRequest = (body) =>
  new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: COOKIE },
    body: JSON.stringify(body),
  });

let realFetch;
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  m.subscriptionDocs.mockResolvedValue([]);
  realFetch = global.fetch;
  global.fetch = m.fetch;
});
afterEach(() => {
  global.fetch = realFetch;
});

describe("POST /api/auth/subscription/sync", () => {
  const call = async (body) => {
    const { POST } = await import("@/app/api/auth/subscription/sync/route");
    return POST(jsonRequest(body));
  };

  it("refuse sans session et n'interroge pas Stripe", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await call({ referenceId: orgId });
    expect(res.status).toBe(401);
    expect(m.subscriptionsList).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur qui n'est pas membre de l'espace", async () => {
    signIn();
    m.memberFindOne.mockResolvedValue(null);
    const res = await call({ referenceId: orgId });
    expect(res.status).toBe(403);
    expect(m.subscriptionsList).not.toHaveBeenCalled();
  });

  it("ne regarde que les abonnements des clients de l'espace", async () => {
    signIn();
    m.memberFindOne.mockResolvedValue({
      userId: new ObjectId(userId),
      organizationId: new ObjectId(orgId),
      role: "member",
    });
    m.subscriptionDocs.mockResolvedValue([{ stripeCustomerId: "cus_org" }]);
    m.subscriptionsList.mockResolvedValue({
      data: [
        { id: "sub_1", metadata: { referenceId: orgId } },
        { id: "sub_2", metadata: { referenceId: "autre-espace" } },
      ],
    });
    const res = await call({ referenceId: orgId });
    expect(res.status).toBe(200);
    expect((await res.json()).syncCount).toBe(1);
    // Jamais de liste globale des abonnements de la plateforme
    for (const [params] of m.subscriptionsList.mock.calls) {
      expect(params.customer).toBe("cus_org");
    }
  });
});

/** Octets d'un PNG (signature) complétés jusqu'à `size`. */
const pngBytes = (size) => {
  const bytes = new Uint8Array(size);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return bytes;
};

describe("POST /api/upload-image", () => {
  const call = async ({
    type = "image/png",
    size = 1024,
    extra = {},
    bytes = pngBytes(size),
  } = {}) => {
    const formData = new FormData();
    formData.append("file", new File([bytes], "logo.png", { type }));
    for (const [k, v] of Object.entries(extra)) formData.append(k, v);
    const { POST } = await import("@/app/api/upload-image/route");
    return POST(
      new Request("http://localhost/api/upload-image", {
        method: "POST",
        headers: { cookie: COOKIE },
        body: formData,
      }),
    );
  };

  it("refuse sans session et n'envoie rien", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await call();
    expect(res.status).toBe(401);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it("refuse un SVG", async () => {
    signIn();
    const res = await call({ type: "image/svg+xml" });
    expect(res.status).toBe(400);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it("refuse un contenu qui n'est pas celui du type annoncé", async () => {
    signIn();
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
    );
    const res = await call({ type: "image/png", bytes: svg });
    expect(res.status).toBe(400);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it("refuse une image de plus de 5 Mo", async () => {
    signIn();
    const res = await call({ size: 5 * 1024 * 1024 + 1 });
    expect(res.status).toBe(400);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it("refuse une couleur ou un type de logo invalides", async () => {
    signIn();
    expect((await call({ extra: { color: "red" } })).status).toBe(400);
    expect((await call({ extra: { logoType: "../x" } })).status).toBe(400);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it("transmet le cookie de session à l'API configurée", async () => {
    signIn();
    m.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          uploadSocialLogo: {
            success: true,
            url: "https://cdn/x.png",
            key: "k",
          },
        },
      }),
    });
    const res = await call();
    expect(res.status).toBe(200);
    const [, init] = m.fetch.mock.calls[0];
    expect(init.headers.Cookie).toBe(COOKIE);
    expect(init.headers["x-organization-id"]).toBe(orgId);
  });
});

describe("POST /api/cloudflare/cleanup-temp", () => {
  const call = async (body) => {
    const { POST } = await import("@/app/api/cloudflare/cleanup-temp/route");
    return POST(jsonRequest(body));
  };

  const okResponse = {
    ok: true,
    json: async () => ({
      data: {
        cleanupTemporaryFiles: {
          success: true,
          deletedCount: 2,
          message: "ok",
        },
      },
    }),
  };

  it("refuse sans session", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await call({ userId });
    expect(res.status).toBe(401);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it("refuse de nettoyer les fichiers d'un autre utilisateur", async () => {
    signIn();
    const res = await call({ userId: otherUserId });
    expect(res.status).toBe(403);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it("nettoie les fichiers de l'utilisateur de la session", async () => {
    signIn();
    m.fetch.mockResolvedValue(okResponse);
    const res = await call({ newSignatureId: "sig1" });
    expect(res.status).toBe(200);
    expect((await res.json()).deletedCount).toBe(2);
    const [, init] = m.fetch.mock.calls[0];
    const sent = JSON.parse(init.body);
    expect(sent.variables.userId).toBe(userId);
    expect(init.headers.Cookie).toBe(COOKIE);
  });
});
