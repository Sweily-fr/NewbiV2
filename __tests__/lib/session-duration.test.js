import { describe, it, expect, vi } from "vitest";
import { ObjectId } from "mongodb";
import {
  capNewSessionExpiry,
  capSessionRenewal,
  readSessionDurationDays,
} from "@/src/lib/session-duration";

const DAY = 24 * 60 * 60 * 1000;
const ORG = new ObjectId().toHexString();

function fakeDb(sessionDuration) {
  const deleteOne = vi.fn(async () => ({ deletedCount: 1 }));
  return {
    deleteOne,
    collection: (name) =>
      name === "organization"
        ? {
            findOne: async () =>
              sessionDuration === undefined
                ? { sessionSettings: {} }
                : { sessionSettings: { sessionDuration } },
          }
        : { deleteOne },
  };
}

const contexte = (session) => ({ context: { session: { session } } });

describe("Durée de session de l'espace", () => {
  it("lit seulement une durée autorisée", async () => {
    expect(await readSessionDurationDays(ORG, fakeDb(7))).toBe(7);
    expect(await readSessionDurationDays(ORG, fakeDb(90))).toBe(90);
    expect(await readSessionDurationDays(ORG, fakeDb(undefined))).toBeNull();
    expect(await readSessionDurationDays(ORG, fakeDb(365))).toBeNull();
    expect(await readSessionDurationDays("pas-un-id", fakeDb(7))).toBeNull();
    expect(await readSessionDurationDays(null, fakeDb(7))).toBeNull();
  });

  it("création : échéance ramenée à 7 jours", async () => {
    const createdAt = new Date();
    const session = {
      activeOrganizationId: ORG,
      createdAt,
      expiresAt: new Date(createdAt.getTime() + 30 * DAY),
    };
    const r = await capNewSessionExpiry(session, { mongoDb: fakeDb(7) });
    expect(r.expiresAt.getTime()).toBe(createdAt.getTime() + 7 * DAY);
  });

  it("création sans réglage : échéance de Better Auth inchangée", async () => {
    const session = {
      activeOrganizationId: ORG,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * DAY),
    };
    expect(
      await capNewSessionExpiry(session, { mongoDb: fakeDb(undefined) }),
    ).toBe(session);
  });

  it("renouvellement : jamais au-delà de connexion + durée", async () => {
    const createdAt = new Date(Date.now() - 2 * DAY);
    const db = fakeDb(7);
    const r = await capSessionRenewal(
      { expiresAt: new Date(Date.now() + 30 * DAY), updatedAt: new Date() },
      contexte({ token: "t", createdAt, activeOrganizationId: ORG }),
      { mongoDb: db },
    );
    expect(r.data.expiresAt.getTime()).toBe(createdAt.getTime() + 7 * DAY);
    expect(db.deleteOne).not.toHaveBeenCalled();
  });

  it("renouvellement d'une session plus vieille que la durée : fermée", async () => {
    const db = fakeDb(7);
    const r = await capSessionRenewal(
      { expiresAt: new Date(Date.now() + 30 * DAY) },
      contexte({
        token: "vieille",
        createdAt: new Date(Date.now() - 8 * DAY),
        activeOrganizationId: ORG,
      }),
      { mongoDb: db },
    );
    expect(r).toBe(false);
    expect(db.deleteOne).toHaveBeenCalledWith({ token: "vieille" });
  });

  it("autre mise à jour (changement d'espace) ou sans session connue : rien", async () => {
    const db = fakeDb(7);
    expect(
      await capSessionRenewal(
        { activeOrganizationId: ORG },
        contexte({ token: "t", createdAt: new Date(0) }),
        { mongoDb: db },
      ),
    ).toBeUndefined();
    expect(
      await capSessionRenewal({ expiresAt: new Date() }, null, { mongoDb: db }),
    ).toBeUndefined();
    expect(db.deleteOne).not.toHaveBeenCalled();
  });
});
