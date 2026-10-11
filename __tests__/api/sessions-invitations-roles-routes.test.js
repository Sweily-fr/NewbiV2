// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Routes qui agissaient sur la ressource d'un autre compte ou d'un autre
 * espace : révocation de session, liste des sessions, refus d'invitation,
 * vérification de changement de rôle.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  rejectInvitation: vi.fn(),
  sessionFindOne: vi.fn(),
  sessionDeleteOne: vi.fn(),
  sessionFind: vi.fn(async () => []),
  invitationFindOne: vi.fn(),
  invitationUpdateOne: vi.fn(),
  invitationCount: vi.fn(async () => 0),
  memberFindOne: vi.fn(),
  memberFind: vi.fn(async () => []),
  storedRoles: vi.fn(async () => []),
  subscriptionFindOne: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args) => m.getSession(...args),
      rejectInvitation: (...args) => m.rejectInvitation(...args),
    },
  },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/src/lib/auth-utils", () => ({ sendEmail: vi.fn() }));
vi.mock("@/src/lib/email-templates", () => ({ emailTemplates: {} }));
vi.mock("@/src/lib/enforce-session-limit", () => ({
  enforceSessionLimit: async () => ({ revokedCount: 0 }),
}));
vi.mock("@/src/lib/session-revocation-log", () => ({
  logSessionRevocation: vi.fn(),
}));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "session") {
        return {
          findOne: m.sessionFindOne,
          deleteOne: m.sessionDeleteOne,
          deleteMany: vi.fn(),
          find: () => ({ toArray: m.sessionFind }),
        };
      }
      if (name === "invitation") {
        return {
          findOne: m.invitationFindOne,
          updateOne: m.invitationUpdateOne,
          countDocuments: m.invitationCount,
        };
      }
      if (name === "member") {
        return {
          findOne: m.memberFindOne,
          find: () => ({ toArray: m.memberFind }),
        };
      }
      if (name === "organizationRole") {
        return { find: () => ({ toArray: m.storedRoles }) };
      }
      if (name === "subscription") return { findOne: m.subscriptionFindOne };
      if (name === "organization") return { findOne: vi.fn() };
      throw new Error(`Collection inattendue : ${name}`);
    },
  },
}));

const userId = new ObjectId().toString();
const orgId = new ObjectId().toString();

const jsonRequest = (body) =>
  new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "moi@example.com" },
    session: { token: "tok_courant", activeOrganizationId: orgId },
  });
  m.storedRoles.mockResolvedValue([]);
  m.sessionFind.mockResolvedValue([]);
});

describe("POST /api/revoke-session", () => {
  const call = async (body) => {
    const { POST } = await import("@/app/api/revoke-session/route");
    return POST(jsonRequest(body));
  };

  it("ne révoque jamais la session d'un autre compte", async () => {
    // La recherche filtrée sur l'utilisateur ne trouve rien
    m.sessionFindOne.mockImplementation(async (filter) =>
      filter.userId ? null : { _id: "s1", token: "tok_autre", userId: "x" },
    );
    m.sessionDeleteOne.mockResolvedValue({ deletedCount: 1 });

    const res = await call({ sessionToken: "tok_autre" });
    expect(res.status).toBe(404);
    expect(m.sessionDeleteOne).not.toHaveBeenCalled();
  });

  it("révoque une de ses sessions par id, filtrée sur l'utilisateur", async () => {
    const sessionId = new ObjectId().toString();
    m.sessionFindOne.mockResolvedValue({ _id: new ObjectId(sessionId) });
    m.sessionDeleteOne.mockResolvedValue({ deletedCount: 1 });

    const res = await call({ sessionId });
    expect(res.status).toBe(200);
    const [filter] = m.sessionDeleteOne.mock.calls[0];
    expect(String(filter._id)).toBe(sessionId);
    expect(filter.userId.$in.map(String)).toContain(userId);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("userId");
  });
});

describe("GET /api/check-session-limit", () => {
  it("ne renvoie plus les jetons de session au navigateur", async () => {
    m.sessionFind.mockResolvedValue([
      { _id: new ObjectId(), token: "tok_courant", userAgent: "A" },
      { _id: new ObjectId(), token: "tok_autre_appareil", userAgent: "B" },
    ]);
    const { GET } = await import("@/app/api/check-session-limit/route");
    const res = await GET(
      new Request("http://localhost/api/check-session-limit"),
    );
    const text = await res.text();
    expect(text).not.toContain("tok_courant");
    expect(text).not.toContain("tok_autre_appareil");
    const data = JSON.parse(text);
    expect(data.sessions.map((s) => s.isCurrent)).toEqual([true, false]);
  });
});

describe("POST /api/invitations/[id] action reject", () => {
  const invitationId = new ObjectId().toString();
  const call = async () => {
    const { POST } = await import("@/app/api/invitations/[id]/route");
    return POST(jsonRequest({ action: "reject" }), {
      params: Promise.resolve({ id: invitationId }),
    });
  };

  it("refuse l'invitation d'un autre destinataire", async () => {
    m.invitationFindOne.mockResolvedValue({
      email: "autre@example.com",
      status: "pending",
    });
    const res = await call();
    expect(res.status).toBe(403);
    expect(m.invitationUpdateOne).not.toHaveBeenCalled();
    expect(m.rejectInvitation).not.toHaveBeenCalled();
  });

  it("ne réécrit pas une invitation déjà acceptée", async () => {
    m.invitationFindOne.mockResolvedValue({
      email: "Moi@Example.com",
      status: "accepted",
    });
    const res = await call();
    expect(res.status).toBe(200);
    expect(m.invitationUpdateOne).not.toHaveBeenCalled();
  });

  it("marque refusée sa propre invitation expirée", async () => {
    m.invitationFindOne.mockResolvedValue({
      email: "moi@example.com",
      status: "pending",
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await call();
    expect(res.status).toBe(200);
    expect(m.invitationUpdateOne).toHaveBeenCalled();
  });
});

describe("POST /api/billing/check-role-change", () => {
  const call = async () => {
    const { POST } = await import("@/app/api/billing/check-role-change/route");
    return POST(
      jsonRequest({
        organizationId: orgId,
        currentRole: "member",
        newRole: "accountant",
      }),
    );
  };

  it("refuse un utilisateur qui n'est pas membre de l'espace", async () => {
    m.memberFindOne.mockResolvedValue(null);
    m.subscriptionFindOne.mockResolvedValue({ plan: "pme" });
    const res = await call();
    expect(res.status).toBe(403);
    expect(m.subscriptionFindOne).not.toHaveBeenCalled();
    expect((await res.json()).canChange).toBe(false);
  });

  it("refuse un rôle qui ne peut pas changer les rôles", async () => {
    m.memberFindOne.mockResolvedValue({ role: "member" });
    m.subscriptionFindOne.mockResolvedValue({ plan: "pme" });
    const res = await call();
    expect(res.status).toBe(403);
    expect(m.subscriptionFindOne).not.toHaveBeenCalled();
  });

  it("vérifie la limite pour le super admin", async () => {
    m.memberFindOne.mockResolvedValue({ role: "owner" });
    m.subscriptionFindOne.mockResolvedValue({ plan: "pme" });
    const res = await call();
    expect(res.status).toBe(200);
    expect(m.subscriptionFindOne).toHaveBeenCalled();
  });
});
