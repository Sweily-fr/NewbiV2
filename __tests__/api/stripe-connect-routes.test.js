// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Routes Stripe Connect : session obligatoire et droit « Gérer » sur les
 * applications de l'espace ; le compte lu ou rafraîchi est celui de
 * l'espace, jamais celui désigné par un `userId` ou un `accountId` du client.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  memberFindOne: vi.fn(),
  storedRoles: vi.fn(async () => []),
  connectFindOne: vi.fn(),
  connectUpdateOne: vi.fn(),
  accountsRetrieve: vi.fn(),
  accountsCreate: vi.fn(),
  accountLinksCreate: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") return { findOne: m.memberFindOne };
      if (name === "organizationRole") {
        return { find: () => ({ toArray: m.storedRoles }) };
      }
      if (name === "stripeconnectaccounts") {
        return { findOne: m.connectFindOne, updateOne: m.connectUpdateOne };
      }
      throw new Error(`Collection inattendue : ${name}`);
    },
  },
}));

vi.mock("stripe", () => {
  function Stripe() {
    return {
      accounts: { retrieve: m.accountsRetrieve, create: m.accountsCreate },
      accountLinks: { create: m.accountLinksCreate },
    };
  }
  return { default: Stripe };
});

const userId = "507f1f77bcf86cd799439011";
const otherUserId = "507f1f77bcf86cd799439099";
const orgId = "507f1f77bcf86cd799439022";

function signIn() {
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "u@x.fr" },
    session: { activeOrganizationId: orgId },
  });
}

function asRole(role) {
  m.memberFindOne.mockResolvedValue({
    userId: new ObjectId(userId),
    organizationId: new ObjectId(orgId),
    role,
  });
}

const jsonRequest = (body) =>
  new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const orgAccount = {
  _id: "doc1",
  accountId: "acct_org",
  organizationId: orgId,
  isOnboarded: true,
  chargesEnabled: true,
  payoutsEnabled: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  m.storedRoles.mockResolvedValue([]);
  m.connectFindOne.mockResolvedValue(null);
  m.accountsRetrieve.mockResolvedValue({
    id: "acct_org",
    details_submitted: true,
    charges_enabled: true,
    payouts_enabled: true,
  });
  m.accountsCreate.mockResolvedValue({ id: "acct_new" });
  m.accountLinksCreate.mockResolvedValue({
    url: "https://connect.stripe.com/x",
  });
});

describe("GET /api/stripe/connect/account", () => {
  const call = async (query = "") => {
    const { GET } = await import("@/app/api/stripe/connect/account/route");
    return GET(
      new Request(`http://localhost/api/stripe/connect/account?${query}`),
    );
  };

  it("refuse sans session", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await call(`userId=${otherUserId}`);
    expect(res.status).toBe(401);
    expect(m.connectFindOne).not.toHaveBeenCalled();
  });

  it("refuse un rôle sans droit de gérer les applications", async () => {
    signIn();
    asRole("member");
    const res = await call();
    expect(res.status).toBe(403);
    expect(m.connectFindOne).not.toHaveBeenCalled();
  });

  it("ignore le userId de la requête et lit le compte de l'espace", async () => {
    signIn();
    asRole("admin");
    m.connectFindOne.mockResolvedValueOnce(orgAccount);
    const res = await call(`userId=${otherUserId}`);
    expect(res.status).toBe(200);
    expect((await res.json()).accountId).toBe("acct_org");
    const [query] = m.connectFindOne.mock.calls[0];
    expect(query).toEqual({ organizationId: orgId });
    // Jamais de recherche sur l'utilisateur passé en paramètre
    for (const [q] of m.connectFindOne.mock.calls) {
      expect(String(q.userId || "")).not.toBe(otherUserId);
    }
  });

  it("retombe sur l'ancien compte personnel non rattaché à un espace", async () => {
    signIn();
    asRole("owner");
    m.connectFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...orgAccount, organizationId: undefined });
    const res = await call();
    expect(res.status).toBe(200);
    const [legacyQuery] = m.connectFindOne.mock.calls[1];
    expect(String(legacyQuery.userId)).toBe(userId);
    expect(legacyQuery.organizationId).toEqual({ $in: [null, ""] });
  });
});

describe("POST /api/stripe/connect/status", () => {
  const call = async (body) => {
    const { POST } = await import("@/app/api/stripe/connect/status/route");
    return POST(jsonRequest(body));
  };

  it("refuse sans session", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await call({ accountId: "acct_org" });
    expect(res.status).toBe(401);
    expect(m.accountsRetrieve).not.toHaveBeenCalled();
    expect(m.connectUpdateOne).not.toHaveBeenCalled();
  });

  it("refuse le compte d'un autre espace sans appeler Stripe", async () => {
    signIn();
    asRole("owner");
    const res = await call({ accountId: "acct_autre", organizationId: orgId });
    expect(res.status).toBe(404);
    expect(m.accountsRetrieve).not.toHaveBeenCalled();
    expect(m.connectUpdateOne).not.toHaveBeenCalled();
  });

  it("refuse un rôle sans droit de gérer les applications", async () => {
    signIn();
    asRole("accountant");
    m.connectFindOne.mockResolvedValue(orgAccount);
    const res = await call({ accountId: "acct_org" });
    expect(res.status).toBe(403);
    expect(m.accountsRetrieve).not.toHaveBeenCalled();
  });

  it("rafraîchit le compte de l'espace", async () => {
    signIn();
    asRole("owner");
    m.connectFindOne.mockResolvedValueOnce(orgAccount);
    const res = await call({ accountId: "acct_org", organizationId: orgId });
    expect(res.status).toBe(200);
    expect((await res.json()).accountStatus).toBe("active");
    expect(m.connectFindOne.mock.calls[0][0]).toEqual({
      accountId: "acct_org",
      organizationId: orgId,
    });
    const [filter, update] = m.connectUpdateOne.mock.calls[0];
    expect(filter).toEqual({ _id: "doc1" });
    expect(update.$set.payoutsEnabled).toBe(true);
  });
});

describe("Routes Connect retirées (onboard, disconnect)", () => {
  const onboard = async (body) => {
    const { POST } = await import("@/app/api/stripe/connect/onboard/route");
    return POST(jsonRequest(body));
  };
  const disconnect = async (body) => {
    const { POST } = await import("@/app/api/stripe/connect/disconnect/route");
    return POST(jsonRequest(body));
  };

  it("onboard refuse sans session et ne crée aucun compte Stripe", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await onboard({ userId: otherUserId, email: "x@y.fr" });
    expect(res.status).toBe(401);
    expect(m.accountsCreate).not.toHaveBeenCalled();
  });

  it("onboard refuse un rôle sans droit de gérer les applications", async () => {
    signIn();
    asRole("member");
    const res = await onboard({ userId, email: "u@x.fr" });
    expect(res.status).toBe(403);
    expect(m.accountsCreate).not.toHaveBeenCalled();
  });

  it("onboard répond 410 sans créer de compte, même avec le droit", async () => {
    signIn();
    asRole("owner");
    const res = await onboard({ userId, email: "u@x.fr" });
    expect(res.status).toBe(410);
    expect(m.accountsCreate).not.toHaveBeenCalled();
    expect(m.accountLinksCreate).not.toHaveBeenCalled();
  });

  it("disconnect refuse sans session", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await disconnect({ userId: otherUserId });
    expect(res.status).toBe(401);
  });

  it("disconnect ne renvoie plus de faux succès", async () => {
    signIn();
    asRole("owner");
    const res = await disconnect({ userId });
    expect(res.status).toBe(410);
  });
});
