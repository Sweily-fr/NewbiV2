// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";
import { grantAppTrialIfEligible } from "@/src/lib/org-creation";

/**
 * Décision #16 : un seul essai de l'application par utilisateur. L'essai est
 * refusé dès qu'UNE des autres organisations de l'utilisateur l'a consommé,
 * quel que soit l'ordre de ses adhésions, et n'est jamais accordé quand
 * ENABLE_APP_TRIAL est désactivé.
 */

// ─── Petite base en mémoire (égalité, $ne, $in) ──────────────────────────────

const same = (a, b) =>
  a instanceof ObjectId || b instanceof ObjectId
    ? String(a) === String(b)
    : a === b;

function matches(doc, filter) {
  return Object.entries(filter).every(([key, cond]) => {
    const value = doc[key];
    if (cond && typeof cond === "object" && !(cond instanceof ObjectId)) {
      if ("$ne" in cond) return !same(value, cond.$ne);
      if ("$in" in cond) return cond.$in.some((c) => same(value, c));
    }
    return same(value, cond);
  });
}

function fakeDb({ members = [], organizations = [] }) {
  const data = { member: members, organization: organizations };
  const updates = [];
  return {
    updates,
    collection: (name) => ({
      findOne: async (filter) =>
        data[name].find((doc) => matches(doc, filter)) || null,
      find: (filter) => ({
        toArray: async () => data[name].filter((doc) => matches(doc, filter)),
      }),
      updateOne: async (filter, update) => {
        updates.push({ name, filter, update });
        return { matchedCount: 1, modifiedCount: 1 };
      },
    }),
  };
}

const userId = "507f1f77bcf86cd799439011";
const newOrgId = new ObjectId();
const org = (hasUsedTrial = false) => ({ _id: new ObjectId(), hasUsedTrial });
const membership = (organizationId, uid = new ObjectId(userId)) => ({
  userId: uid,
  organizationId,
});

const trialGranted = (db) =>
  db.updates.some(
    (u) =>
      u.name === "organization" &&
      String(u.filter._id) === String(newOrgId) &&
      u.update.$set?.isTrialActive === true,
  );

beforeEach(() => {
  vi.stubEnv("ENABLE_APP_TRIAL", "true");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("grantAppTrialIfEligible", () => {
  it("accorde l'essai à la première organisation de l'utilisateur", async () => {
    const db = fakeDb({
      members: [membership(newOrgId)],
      organizations: [{ _id: newOrgId }],
    });
    await expect(
      grantAppTrialIfEligible({
        mongoDb: db,
        userId,
        organizationId: newOrgId,
      }),
    ).resolves.toBe(true);
    expect(trialGranted(db)).toBe(true);
  });

  it("refuse si l'essai a été consommé sur une autre adhésion que la première", async () => {
    // Trois autres organisations : seule la dernière a consommé l'essai
    const first = org(false);
    const second = org(false);
    const third = org(true);
    const db = fakeDb({
      members: [
        membership(first._id),
        membership(second._id),
        membership(third._id),
        membership(newOrgId),
      ],
      organizations: [first, second, third, { _id: newOrgId }],
    });

    await expect(
      grantAppTrialIfEligible({
        mongoDb: db,
        userId,
        organizationId: newOrgId,
      }),
    ).resolves.toBe(false);
    expect(trialGranted(db)).toBe(false);
  });

  it("repère aussi une adhésion enregistrée avec un userId en chaîne", async () => {
    const used = org(true);
    const db = fakeDb({
      members: [
        membership(org(false)._id),
        membership(used._id, userId),
        membership(newOrgId),
      ],
      organizations: [used, { _id: newOrgId }],
    });

    await expect(
      grantAppTrialIfEligible({
        mongoDb: db,
        userId,
        organizationId: newOrgId,
      }),
    ).resolves.toBe(false);
  });

  it("accorde l'essai si aucune autre organisation ne l'a consommé", async () => {
    const others = [org(false), org(false)];
    const db = fakeDb({
      members: [...others.map((o) => membership(o._id)), membership(newOrgId)],
      organizations: [...others, { _id: newOrgId }],
    });

    await expect(
      grantAppTrialIfEligible({
        mongoDb: db,
        userId,
        organizationId: newOrgId,
      }),
    ).resolves.toBe(true);
  });

  it("n'accorde rien quand ENABLE_APP_TRIAL est désactivé", async () => {
    vi.stubEnv("ENABLE_APP_TRIAL", "false");
    const db = fakeDb({
      members: [membership(newOrgId)],
      organizations: [{ _id: newOrgId }],
    });

    await expect(
      grantAppTrialIfEligible({
        mongoDb: db,
        userId,
        organizationId: newOrgId,
      }),
    ).resolves.toBe(false);
    expect(db.updates).toEqual([]);
  });
});
