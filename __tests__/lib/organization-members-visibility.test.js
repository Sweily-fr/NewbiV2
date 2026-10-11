// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { organization } from "better-auth/plugins";

/**
 * Visibilité des membres et invitations dans les réponses du plugin
 * organisation de Better Auth : vraie instance Better Auth (adaptateur
 * mémoire), vrais endpoints, vrais hooks du site (auth-hooks.js). Les droits
 * sont lus par getModuleActions dans la même base (fausse collection Mongo
 * adossée au stockage mémoire).
 *
 * Règle (celle de GET /api/organizations/[organizationId]/members) : avec
 * « Voir les membres », réponse complète ; sans, l'identité des autres
 * membres et le rôle du seul super admin, sans dates ni invitations.
 * L'appelant garde toujours sa propre adhésion.
 */

const { store, fakeDb, dbState } = vi.hoisted(() => {
  const store = {
    user: [],
    session: [],
    account: [],
    verification: [],
    organization: [],
    member: [],
    invitation: [],
    organizationRole: [],
  };
  const dbState = { failing: false };
  const matches = (record, filter = {}) =>
    Object.entries(filter).every(([key, cond]) => {
      const value = record[key === "_id" ? "id" : key];
      if (cond && typeof cond === "object" && "$in" in cond) {
        return cond.$in.map(String).includes(String(value));
      }
      return String(value) === String(cond);
    });
  const withMongoId = (record) =>
    record ? { ...record, _id: record.id } : null;
  const fakeDb = {
    collection: (name) => {
      if (dbState.failing) throw new Error("Base indisponible");
      const rows = () => store[name] || [];
      return {
        findOne: async (filter) =>
          withMongoId(rows().find((r) => matches(r, filter))),
        find: (filter) => ({
          toArray: async () =>
            rows()
              .filter((r) => matches(r, filter))
              .map(withMongoId),
        }),
      };
    },
  };
  return { store, fakeDb, dbState };
});

vi.mock("@/src/lib/mongodb", () => ({
  getMongoDb: async () => fakeDb,
  mongoDb: fakeDb,
}));

vi.mock("@/src/lib/auth-utils", () => ({
  sendReactivationEmail: vi.fn(),
}));

import { beforeSignInHook, afterHook } from "@/src/lib/auth-hooks";
import {
  organizationAc,
  organizationRoles,
} from "@/src/lib/organization-roles";

const auth = betterAuth({
  database: memoryAdapter(store),
  secret: "secret-de-test-suffisamment-long-pour-better-auth",
  baseURL: "http://localhost:3000",
  emailAndPassword: { enabled: true },
  advanced: {
    database: { generateId: () => new ObjectId().toHexString() },
  },
  plugins: [
    organization({
      ac: organizationAc,
      roles: organizationRoles,
      dynamicAccessControl: { enabled: true },
      creatorRole: "owner",
      requireEmailVerificationOnInvitation: false,
    }),
  ],
  hooks: { before: beforeSignInHook, after: afterHook },
});

const ROLES_SANS_VOIR = "role_sans_membres";
const ROLE_AVEC_VOIR = "role_avec_membres";
const ROLE_INVITER = "role_inviter";

const people = {};
let orgId;
let invitationId;

async function signUp(key, email) {
  const res = await auth.api.signUpEmail({
    body: { email, password: "MotDePasse-Test-123", name: key },
    asResponse: true,
  });
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const { user } = await res.json();
  people[key] = { id: user.id, email, headers: new Headers({ cookie }) };
}

function addMember(key, role) {
  store.member.push({
    id: new ObjectId().toHexString(),
    organizationId: orgId,
    userId: people[key].id,
    role,
    createdAt: new Date("2026-01-15T10:00:00Z"),
  });
}

async function setActive(key) {
  await auth.api.setActiveOrganization({
    body: { organizationId: orgId },
    headers: people[key].headers,
  });
}

const getFullOrg = (key) =>
  auth.api.getFullOrganization({
    query: { organizationId: orgId },
    headers: people[key].headers,
  });

const memberOf = (list, key) =>
  list.find((m) => String(m.userId) === String(people[key].id));

beforeAll(async () => {
  await signUp("owner", "owner@test.fr");
  await signUp("restreint", "restreint@test.fr");
  await signUp("viewer", "viewer@test.fr");
  await signUp("editeur", "editeur@test.fr");
  await signUp("admin", "admin@test.fr");
  await signUp("comptable", "comptable@test.fr");
  await signUp("autorise", "autorise@test.fr");
  await signUp("inviteur", "inviteur@test.fr");
  await signUp("invite", "invite@test.fr");

  const org = await auth.api.createOrganization({
    body: { name: "Espace test", slug: "espace-test" },
    headers: people.owner.headers,
  });
  orgId = org.id;

  addMember("restreint", ROLES_SANS_VOIR);
  addMember("viewer", "viewer");
  addMember("editeur", "member");
  addMember("admin", "admin");
  addMember("comptable", "accountant");
  addMember("autorise", ROLE_AVEC_VOIR);
  addMember("inviteur", ROLE_INVITER);

  store.organizationRole.push(
    {
      id: new ObjectId().toHexString(),
      organizationId: orgId,
      role: ROLES_SANS_VOIR,
      name: "Sans membres",
      permission: "{}",
      actions: { team: [], invoices: ["view"] },
    },
    {
      id: new ObjectId().toHexString(),
      organizationId: orgId,
      role: ROLE_AVEC_VOIR,
      name: "Avec membres",
      permission: "{}",
      actions: { team: ["view"] },
    },
    {
      id: new ObjectId().toHexString(),
      organizationId: orgId,
      role: ROLE_INVITER,
      name: "Inviter",
      permission: "{}",
      actions: { team: ["invite"] },
    },
  );

  invitationId = new ObjectId().toHexString();
  store.invitation.push({
    id: invitationId,
    organizationId: orgId,
    email: "invite@test.fr",
    role: "admin",
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    inviterId: people.owner.id,
    createdAt: new Date("2026-02-01T10:00:00Z"),
  });

  for (const key of Object.keys(people)) {
    if (key !== "invite") await setActive(key);
  }

  // Better Auth exige un e-mail vérifié pour lister ses invitations reçues
  store.user.find((u) => u.id === people.invite.id).emailVerified = true;
});

beforeEach(() => {
  dbState.failing = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("rôle sans « Voir les membres »", () => {
  it("get-full-organization : identité des autres membres, sans rôles, dates ni invitations", async () => {
    const org = await getFullOrg("restreint");

    expect(org.id).toBe(orgId);
    expect(org.name).toBe("Espace test");
    expect(org.members).toHaveLength(8);
    expect(org.invitations).toEqual([]);

    const editeur = memberOf(org.members, "editeur");
    expect(Object.keys(editeur).sort()).toEqual([
      "id",
      "organizationId",
      "user",
      "userId",
    ]);
    expect(editeur.organizationId).toBe(orgId);
    expect(editeur.user).toMatchObject({
      id: people.editeur.id,
      name: "editeur",
      email: "editeur@test.fr",
    });
    for (const field of Object.keys(editeur.user)) {
      expect(["id", "name", "email", "image"]).toContain(field);
    }
    for (const key of ["viewer", "admin", "comptable", "autorise"]) {
      expect(memberOf(org.members, key)).not.toHaveProperty("role");
      expect(memberOf(org.members, key)).not.toHaveProperty("createdAt");
    }
  });

  it("get-full-organization : désigne le super admin et garde sa propre adhésion", async () => {
    const org = await getFullOrg("restreint");

    const owner = memberOf(org.members, "owner");
    expect(owner.role).toBe("owner");
    expect(owner).not.toHaveProperty("createdAt");
    expect(owner.user.email).toBe("owner@test.fr");

    const self = memberOf(org.members, "restreint");
    expect(self.role).toBe(ROLES_SANS_VOIR);
    expect(self.createdAt).toBeDefined();
  });

  it("get-full-organization par HTTP (client Better Auth web et mobile) : même filtre", async () => {
    const res = await auth.handler(
      new Request(
        `http://localhost:3000/api/auth/organization/get-full-organization?organizationId=${orgId}`,
        { headers: people.restreint.headers },
      ),
    );
    expect(res.status).toBe(200);
    const org = await res.json();
    expect(org.invitations).toEqual([]);
    expect(memberOf(org.members, "admin")).not.toHaveProperty("role");
    expect(memberOf(org.members, "owner").role).toBe("owner");
    expect(memberOf(org.members, "restreint").role).toBe(ROLES_SANS_VOIR);
  });

  it("get-full-organization sans organizationId (organisation active, useActiveOrganization)", async () => {
    const org = await auth.api.getFullOrganization({
      headers: people.restreint.headers,
    });
    expect(org.id).toBe(orgId);
    expect(org.invitations).toEqual([]);
    expect(memberOf(org.members, "editeur")).not.toHaveProperty("role");
  });

  it("list-members : même filtre, total inchangé", async () => {
    const result = await auth.api.listMembers({
      query: { organizationId: orgId },
      headers: people.restreint.headers,
    });
    expect(result.total).toBe(8);
    expect(memberOf(result.members, "admin")).not.toHaveProperty("role");
    expect(memberOf(result.members, "admin")).not.toHaveProperty("createdAt");
    expect(memberOf(result.members, "admin").user.email).toBe("admin@test.fr");
    expect(memberOf(result.members, "owner").role).toBe("owner");
    expect(memberOf(result.members, "restreint").role).toBe(ROLES_SANS_VOIR);
  });

  it("list-members : tri ou filtre sur le rôle refusé (il révélerait les rôles)", async () => {
    await expect(
      auth.api.listMembers({
        query: {
          organizationId: orgId,
          filterField: "role",
          filterValue: "admin",
        },
        headers: people.restreint.headers,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });

    await expect(
      auth.api.listMembers({
        query: { organizationId: orgId, sortBy: "role" },
        headers: people.restreint.headers,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("list-members : filtre sur l'identité accepté", async () => {
    const result = await auth.api.listMembers({
      query: {
        organizationId: orgId,
        filterField: "userId",
        filterValue: people.editeur.id,
      },
      headers: people.restreint.headers,
    });
    expect(result.members).toHaveLength(1);
    expect(result.members[0]).not.toHaveProperty("role");
  });

  it("list-invitations : aucune invitation", async () => {
    const invitations = await auth.api.listInvitations({
      query: { organizationId: orgId },
      headers: people.restreint.headers,
    });
    expect(invitations).toEqual([]);
  });

  it("get-active-member-role : son propre rôle toujours visible", async () => {
    const result = await auth.api.getActiveMemberRole({
      headers: people.restreint.headers,
    });
    expect(result).toEqual({ role: ROLES_SANS_VOIR });

    const self = await auth.api.getActiveMemberRole({
      query: { userId: people.restreint.id },
      headers: people.restreint.headers,
    });
    expect(self).toEqual({ role: ROLES_SANS_VOIR });
  });

  it("get-active-member-role : rôle d'un autre membre refusé, sauf le super admin", async () => {
    await expect(
      auth.api.getActiveMemberRole({
        query: { userId: people.admin.id, organizationId: orgId },
        headers: people.restreint.headers,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });

    const owner = await auth.api.getActiveMemberRole({
      query: { userId: people.owner.id, organizationId: orgId },
      headers: people.restreint.headers,
    });
    expect(owner).toEqual({ role: "owner" });
  });

  it("get-active-member : sa propre adhésion complète", async () => {
    const member = await auth.api.getActiveMember({
      headers: people.restreint.headers,
    });
    expect(member.userId).toBe(people.restreint.id);
    expect(member.role).toBe(ROLES_SANS_VOIR);
  });

  it("droits illisibles (base indisponible) : réponse restreinte, sa propre adhésion gardée", async () => {
    dbState.failing = true;
    const org = await getFullOrg("autorise");
    expect(org.invitations).toEqual([]);
    expect(memberOf(org.members, "admin")).not.toHaveProperty("role");
    expect(memberOf(org.members, "autorise").role).toBe(ROLE_AVEC_VOIR);
  });

  it("super admin cumulant plusieurs rôles : désigné « owner » seulement", async () => {
    const owner = store.member.find((m) => m.userId === people.owner.id);
    owner.role = "owner,admin";
    try {
      const org = await getFullOrg("restreint");
      expect(memberOf(org.members, "owner").role).toBe("owner");
    } finally {
      owner.role = "owner";
    }
  });
});

describe("rôle autorisé : réponse inchangée", () => {
  it("get-full-organization identique à celle du super admin pour les rôles prédéfinis et personnalisés", async () => {
    const reference = await getFullOrg("owner");
    expect(reference.invitations).toHaveLength(1);
    expect(memberOf(reference.members, "admin").role).toBe("admin");
    expect(memberOf(reference.members, "admin").createdAt).toBeDefined();

    for (const key of [
      "viewer",
      "editeur",
      "admin",
      "comptable",
      "autorise",
      "inviteur",
    ]) {
      expect(await getFullOrg(key), key).toEqual(reference);
    }
  });

  it("list-members, list-invitations et tri par rôle inchangés", async () => {
    const reference = await auth.api.listMembers({
      query: { organizationId: orgId, sortBy: "role" },
      headers: people.owner.headers,
    });
    const viewer = await auth.api.listMembers({
      query: { organizationId: orgId, sortBy: "role" },
      headers: people.viewer.headers,
    });
    expect(viewer).toEqual(reference);
    expect(memberOf(viewer.members, "editeur").role).toBe("member");

    const invitations = await auth.api.listInvitations({
      query: { organizationId: orgId },
      headers: people.autorise.headers,
    });
    expect(invitations).toHaveLength(1);
    expect(invitations[0].email).toBe("invite@test.fr");
  });

  it("get-active-member-role d'un autre membre inchangé", async () => {
    const result = await auth.api.getActiveMemberRole({
      query: { userId: people.admin.id, organizationId: orgId },
      headers: people.comptable.headers,
    });
    expect(result).toEqual({ role: "admin" });
  });
});

describe("invité (pas encore membre)", () => {
  it("voit toujours SON invitation", async () => {
    const invitation = await auth.api.getInvitation({
      query: { id: invitationId },
      headers: people.invite.headers,
    });
    expect(invitation.id).toBe(invitationId);
    expect(invitation.role).toBe("admin");
    expect(invitation.organizationName).toBe("Espace test");

    const received = await auth.api.listUserInvitations({
      headers: people.invite.headers,
    });
    expect(received.map((i) => i.id)).toEqual([invitationId]);
  });

  it("ne lit pas l'espace avant d'avoir accepté", async () => {
    await expect(
      auth.api.getFullOrganization({
        query: { organizationId: orgId },
        headers: people.invite.headers,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
