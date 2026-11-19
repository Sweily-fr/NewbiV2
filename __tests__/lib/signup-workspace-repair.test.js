// @vitest-environment node
//
// Espace d'inscription recréé à l'étape « Votre entreprise » quand il manque
// (19/11/2026) : une seule création, même en cas de double clic, et un
// verrou libéré si la création échoue.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

const create = vi.hoisted(() => vi.fn());
vi.mock("@/src/lib/org-creation.js", () => ({
  createOrganizationWithSubscription: (...args) => create(...args),
}));

import {
  repairMissingSignupWorkspace,
  REPAIR_LOCK_FIELD,
  REPAIR_LOCK_TTL_MS,
} from "@/src/lib/signup-workspace-repair";

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439099";
const now = new Date("2026-11-19T12:00:00Z");

function fakeDb({ claimed = true } = {}) {
  const users = {
    findOneAndUpdate: vi.fn(async () => (claimed ? { _id: userId } : null)),
    updateOne: vi.fn(async () => ({})),
  };
  return { users, mongoDb: { collection: () => users } };
}

beforeEach(() => {
  create.mockReset();
  create.mockResolvedValue({ organizationId: orgId });
});

describe("repairMissingSignupWorkspace", () => {
  it("crée l'espace provisoire au nom de l'utilisateur, sans essai ni fin d'inscription", async () => {
    const { mongoDb } = fakeDb();
    const result = await repairMissingSignupWorkspace({
      mongoDb,
      userId,
      userName: "  Paul Sanssiret ",
      now,
    });

    expect(String(result.organizationId)).toBe(orgId);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        orgData: {
          companyName: "Paul Sanssiret",
          orgName: "Paul Sanssiret",
          orgType: "business",
        },
        appTrialDays: null,
        markOnboardingComplete: false,
      }),
    );
  });

  it("sans nom : « Mon entreprise », comme à l'inscription", async () => {
    const { mongoDb } = fakeDb();
    await repairMissingSignupWorkspace({ mongoDb, userId, now });
    expect(create.mock.calls[0][0].orgData.companyName).toBe("Mon entreprise");
  });

  it("verrou pris par une autre requête : rien n'est créé", async () => {
    const { mongoDb } = fakeDb({ claimed: false });
    const result = await repairMissingSignupWorkspace({ mongoDb, userId, now });
    expect(result).toEqual({ pending: true });
    expect(create).not.toHaveBeenCalled();
  });

  it("le verrou expire : une création interrompue peut être reprise", async () => {
    const { mongoDb, users } = fakeDb();
    await repairMissingSignupWorkspace({ mongoDb, userId, now });
    const [filter, update] = users.findOneAndUpdate.mock.calls[0];
    expect(filter._id).toEqual(new ObjectId(userId));
    expect(filter.$or).toEqual([
      { [REPAIR_LOCK_FIELD]: { $exists: false } },
      {
        [REPAIR_LOCK_FIELD]: {
          $lt: new Date(now.getTime() - REPAIR_LOCK_TTL_MS),
        },
      },
    ]);
    expect(update).toEqual({ $set: { [REPAIR_LOCK_FIELD]: now } });
  });

  it("création en échec : verrou libéré, erreur remontée", async () => {
    const { mongoDb, users } = fakeDb();
    create.mockRejectedValue(new Error("Mongo indisponible"));

    await expect(
      repairMissingSignupWorkspace({ mongoDb, userId, now }),
    ).rejects.toThrow("Mongo indisponible");
    expect(users.updateOne).toHaveBeenCalledWith(
      { _id: new ObjectId(userId) },
      { $unset: { [REPAIR_LOCK_FIELD]: "" } },
    );
  });
});
