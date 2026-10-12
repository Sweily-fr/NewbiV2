// @vitest-environment node
import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
import {
  filterFullOrganization,
  filterInvitations,
  filterMemberList,
  getMembersVisibility,
  memberIdentity,
  visibleRoleOfOtherMember,
} from "@/src/lib/security/members-visibility";

const restricted = {
  userId: "u-moi",
  canViewTeam: false,
  canViewInvitations: false,
};
const full = { userId: "u-moi", canViewTeam: true, canViewInvitations: true };

const member = (userId, role, extra = {}) => ({
  id: `m-${userId}`,
  organizationId: "org-1",
  userId,
  role,
  createdAt: "2026-01-15T10:00:00.000Z",
  user: { id: userId, name: userId, email: `${userId}@test.fr`, image: null },
  ...extra,
});

describe("memberIdentity", () => {
  it("ne garde que l'identité (liste blanche), même si la réponse s'enrichit", () => {
    const identity = memberIdentity(
      member("u-1", "admin", {
        teamId: "t-1",
        user: {
          id: "u-1",
          name: "Un",
          email: "u1@test.fr",
          image: "https://img",
          phoneNumber: "0600000000",
        },
      }),
    );
    expect(identity).toEqual({
      id: "m-u-1",
      organizationId: "org-1",
      userId: "u-1",
      user: {
        id: "u-1",
        name: "Un",
        email: "u1@test.fr",
        image: "https://img",
      },
    });
  });

  it("désigne le super admin, même avec plusieurs rôles", () => {
    expect(memberIdentity(member("u-1", "Owner, admin")).role).toBe("owner");
  });
});

describe("filtres", () => {
  it("rendent la même réponse avec le droit de voir", () => {
    const org = {
      id: "org-1",
      members: [member("u-1", "admin")],
      invitations: [{ id: "i-1" }],
    };
    expect(filterFullOrganization(org, full)).toEqual(org);
    const list = { members: org.members, total: 1 };
    expect(filterMemberList(list, full)).toEqual(list);
    expect(filterInvitations(org.invitations, full)).toBe(org.invitations);
  });

  it("gardent l'adhésion de l'appelant entière", () => {
    const self = member("u-moi", "role_x");
    const org = filterFullOrganization(
      {
        id: "org-1",
        members: [self, member("u-1", "admin")],
        invitations: [{ id: "i-1" }],
      },
      restricted,
    );
    expect(org.members[0]).toEqual(self);
    expect(org.members[1]).not.toHaveProperty("role");
    expect(org.invitations).toEqual([]);
  });

  it("laissent passer les réponses vides ou inattendues", () => {
    expect(filterFullOrganization(null, restricted)).toBeNull();
    expect(filterFullOrganization({ id: "org-1" }, restricted)).toEqual({
      id: "org-1",
    });
    expect(filterMemberList({ total: 0 }, restricted)).toEqual({ total: 0 });
    expect(filterInvitations(undefined, restricted)).toBeUndefined();
  });

  it("rôle d'un autre membre : caché sauf le super admin", () => {
    expect(visibleRoleOfOtherMember("admin", restricted)).toBeNull();
    expect(visibleRoleOfOtherMember("owner,admin", restricted)).toBe("owner");
    expect(visibleRoleOfOtherMember("admin", full)).toBe("admin");
  });
});

describe("getMembersVisibility", () => {
  const userId = new ObjectId().toHexString();
  const organizationId = new ObjectId().toHexString();
  const dbWith = (role, stored = []) => ({
    collection: (name) =>
      name === "member"
        ? {
            findOne: async () =>
              role ? { userId, organizationId, role } : null,
          }
        : { find: () => ({ toArray: async () => stored }) },
  });

  it("tous les rôles prédéfinis voient les membres et les invitations", async () => {
    for (const role of ["owner", "admin", "member", "viewer", "accountant"]) {
      const v = await getMembersVisibility(dbWith(role), {
        userId,
        organizationId,
      });
      expect(v, role).toMatchObject({
        canViewTeam: true,
        canViewInvitations: true,
      });
    }
  });

  it("rôle personnalisé : « Inviter » coche « Voir » ; sans case, rien", async () => {
    const invite = await getMembersVisibility(
      dbWith("role_a", [{ role: "role_a", actions: { team: ["invite"] } }]),
      { userId, organizationId },
    );
    expect(invite).toMatchObject({
      canViewTeam: true,
      canViewInvitations: true,
    });

    const none = await getMembersVisibility(
      dbWith("role_b", [{ role: "role_b", actions: { team: [] } }]),
      { userId, organizationId },
    );
    expect(none).toMatchObject({
      role: "role_b",
      canViewTeam: false,
      canViewInvitations: false,
    });
  });

  it("non-membre : aucun droit", async () => {
    expect(
      await getMembersVisibility(dbWith(null), { userId, organizationId }),
    ).toEqual({
      role: null,
      canViewTeam: false,
      canViewInvitations: false,
    });
  });
});
