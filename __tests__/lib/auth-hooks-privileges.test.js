import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

// Rôles, offre et sessions vus par les hooks Better Auth (auth-hooks.js) :
// pas de rôle plus élevé que le sien, plafonds de l'offre tenus par le
// serveur, autres sessions fermées après un changement de mot de passe.

const { APIErrorMock, getSessionFromCtxMock } = vi.hoisted(() => {
  class APIErrorMock extends Error {
    constructor(code, body) {
      super(body?.message || code);
      this.code = code;
      this.body = body;
      this.name = "APIError";
    }
  }
  return { APIErrorMock, getSessionFromCtxMock: vi.fn() };
});

vi.mock("better-auth/api", () => ({
  createAuthMiddleware: (fn) => fn,
  APIError: APIErrorMock,
  getSessionFromCtx: getSessionFromCtxMock,
  isAPIError: (e) => e instanceof APIErrorMock,
}));

vi.mock("@/src/lib/auth-utils", () => ({
  sendReactivationEmail: vi.fn(),
}));

const { canInviteMemberMock } = vi.hoisted(() => ({
  canInviteMemberMock: vi.fn(),
}));
vi.mock("@/src/services/seatSyncService", () => ({
  seatSyncService: { canInviteMember: canInviteMemberMock },
}));

const { revokeMock } = vi.hoisted(() => ({ revokeMock: vi.fn() }));
vi.mock("@/src/lib/revoke-sessions-after-password", () => ({
  revokeSessionsAfterPasswordChange: revokeMock,
}));

// ── Base en mémoire : un espace, son abonnement, ses membres et rôles ──
const ORG = new ObjectId();
const users = {
  owner: new ObjectId(),
  team: new ObjectId(),
  admin: new ObjectId(),
  viewer: new ObjectId(),
};
const memberIds = {
  admin: new ObjectId(),
  viewer: new ObjectId(),
};
const state = { plan: "pme", members: [], roles: [] };

const same = (a, b) => String(a) === String(b);
const db = {
  collection(name) {
    if (name === "subscription") {
      return {
        findOne: async (q) =>
          same(q.referenceId, ORG) ? { plan: state.plan } : null,
      };
    }
    if (name === "member") {
      return {
        findOne: async (q) =>
          state.members.find((m) => {
            if (q._id && !same(q._id, m._id)) return false;
            if (q.organizationId && !same(q.organizationId, m.organizationId))
              return false;
            if (q.userId?.$in)
              return q.userId.$in.some((u) => same(u, m.userId));
            if (q.userId && !same(q.userId, m.userId)) return false;
            return true;
          }) || null,
      };
    }
    if (name === "organizationRole") {
      return {
        find: (q) => ({
          toArray: async () =>
            state.roles.filter(
              (r) =>
                same(r.organizationId, q.organizationId) &&
                q.role.$in.includes(r.role),
            ),
        }),
      };
    }
    return { findOne: async () => null };
  },
};
vi.mock("@/src/lib/mongodb", () => ({
  getMongoDb: async () => db,
  mongoDb: db,
}));

import { beforeSignInHook, afterHook } from "@/src/lib/auth-hooks";

const sessionOf = (userId) => ({
  user: { id: String(userId) },
  session: { token: `jeton-${userId}`, userId: String(userId) },
});

const invite = (role) =>
  beforeSignInHook({
    path: "/organization/invite-member",
    body: { email: "x@e2e.test", role, organizationId: String(ORG) },
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  state.plan = "pme";
  state.members = [
    {
      _id: new ObjectId(),
      organizationId: ORG,
      userId: users.owner,
      role: "owner",
    },
    {
      _id: new ObjectId(),
      organizationId: ORG,
      userId: users.team,
      role: "role_equipe",
    },
    {
      _id: memberIds.admin,
      organizationId: ORG,
      userId: users.admin,
      role: "admin",
    },
    {
      _id: memberIds.viewer,
      organizationId: ORG,
      userId: users.viewer,
      role: "viewer",
    },
  ];
  // « Gestion d'équipe » : les membres seulement, rien d'autre du compte
  state.roles = [
    {
      organizationId: ORG,
      role: "role_equipe",
      actions: { team: ["view", "invite", "changeRole", "remove"] },
    },
  ];
  canInviteMemberMock.mockResolvedValue({ canInvite: true });
});

describe("Pas de rôle plus élevé que le sien", () => {
  it("un rôle qui gère les membres ne peut pas inviter un Administrateur", async () => {
    getSessionFromCtxMock.mockResolvedValue(sessionOf(users.team));
    await expect(invite("admin")).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringMatching(/plus de droits que le vôtre/),
    });
  });

  it("il invite toujours un Membre et nomme un Éditeur", async () => {
    getSessionFromCtxMock.mockResolvedValue(sessionOf(users.team));
    await expect(invite("viewer")).resolves.toBeUndefined();
    await expect(
      beforeSignInHook({
        path: "/organization/update-member-role",
        body: {
          memberId: String(memberIds.viewer),
          role: "member",
          organizationId: String(ORG),
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("il ne retire pas un Administrateur, qui a plus de droits que lui", async () => {
    getSessionFromCtxMock.mockResolvedValue(sessionOf(users.team));
    await expect(
      beforeSignInHook({
        path: "/organization/remove-member",
        body: {
          memberIdOrEmail: String(memberIds.admin),
          organizationId: String(ORG),
        },
      }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/modifier ni retirer/),
    });
  });

  it("le super admin invite un Administrateur", async () => {
    getSessionFromCtxMock.mockResolvedValue(sessionOf(users.owner));
    await expect(invite("admin")).resolves.toBeUndefined();
  });
});

describe("Plafonds de l'offre tenus par le serveur", () => {
  it("offre d'entrée : pas d'Administrateur, même par le super admin", async () => {
    state.plan = "freelance";
    getSessionFromCtxMock.mockResolvedValue(sessionOf(users.owner));
    await expect(invite("admin")).rejects.toMatchObject({
      message: expect.stringMatching(/Administrateur n'est pas compris/),
    });
  });

  it("sièges : le refus du calcul de l'interface est appliqué", async () => {
    state.plan = "freelance";
    canInviteMemberMock.mockResolvedValue({
      canInvite: false,
      reason: "Limite de 1 utilisateur(s) supplémentaire(s) atteinte",
    });
    getSessionFromCtxMock.mockResolvedValue(sessionOf(users.owner));
    await expect(invite("member")).rejects.toMatchObject({
      message: expect.stringMatching(/Limite de 1 utilisateur/),
    });
    expect(canInviteMemberMock).toHaveBeenCalledWith(String(ORG), "member");
  });

  it("second espace par /organization/create : refusé", async () => {
    getSessionFromCtxMock.mockResolvedValue(sessionOf(users.owner));
    await expect(
      beforeSignInHook({
        path: "/organization/create",
        body: { name: "Second", slug: "second" },
      }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/propre abonnement/),
    });
  });

  it("premier espace (aucune adhésion) : permis", async () => {
    getSessionFromCtxMock.mockResolvedValue(sessionOf(new ObjectId()));
    await expect(
      beforeSignInHook({
        path: "/organization/create",
        body: { name: "Premier", slug: "premier" },
      }),
    ).resolves.toBeUndefined();
  });
});

describe("Mot de passe changé : les autres sessions sont fermées", () => {
  const changePassword = (returned) =>
    afterHook({ path: "/change-password", context: { returned } });

  it("garde la session courante", async () => {
    getSessionFromCtxMock.mockResolvedValue(sessionOf(users.team));
    await changePassword({ token: null, user: { id: String(users.team) } });
    expect(revokeMock).toHaveBeenCalledWith({
      userId: String(users.team),
      keepToken: `jeton-${users.team}`,
      trigger: "change_password",
    });
  });

  it("garde la nouvelle session quand Better Auth l'a remplacée", async () => {
    getSessionFromCtxMock.mockResolvedValue(sessionOf(users.team));
    await changePassword({ token: "nouveau-jeton" });
    expect(revokeMock).toHaveBeenCalledWith(
      expect.objectContaining({ keepToken: "nouveau-jeton" }),
    );
  });

  it("mot de passe refusé : rien n'est fermé", async () => {
    getSessionFromCtxMock.mockResolvedValue(sessionOf(users.team));
    await changePassword(new APIErrorMock("BAD_REQUEST", { message: "x" }));
    expect(revokeMock).not.toHaveBeenCalled();
  });
});
