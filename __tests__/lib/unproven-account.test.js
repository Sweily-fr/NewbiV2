import { describe, it, expect, vi } from "vitest";
import { ObjectId } from "mongodb";
import {
  revokeUnprovenPassword,
  setPasswordAfterProof,
  validateNewPassword,
} from "@/src/lib/unproven-account";

function fakeDb({ user, credentials = 1, accountMatched = 1 }) {
  const calls = {
    accountUpdates: [],
    sessionDeletes: [],
    userUpdates: [],
    inserts: [],
  };
  const db = {
    calls,
    collection: (name) => {
      if (name === "user") {
        return {
          findOne: vi.fn(async () => user),
          updateOne: vi.fn(async (f, u) => calls.userUpdates.push([f, u])),
        };
      }
      if (name === "account") {
        return {
          countDocuments: vi.fn(async () => credentials),
          updateMany: vi.fn(async (f, u) => {
            calls.accountUpdates.push([f, u]);
            return { matchedCount: accountMatched };
          }),
          insertOne: vi.fn(async (d) => calls.inserts.push(d)),
        };
      }
      if (name === "session") {
        return { deleteMany: vi.fn(async (f) => calls.sessionDeletes.push(f)) };
      }
      throw new Error(name);
    },
  };
  return db;
}

describe("Mot de passe posé avant la preuve de l'adresse", () => {
  const id = new ObjectId();

  it("lien ouvert dans un autre navigateur : mot de passe et sessions retirés", async () => {
    const db = fakeDb({ user: { _id: id, emailVerified: false } });
    const r = await revokeUnprovenPassword({
      mongoDb: db,
      email: "Victime@X.fr",
    });
    expect(r.revoked).toBe(true);
    expect(db.calls.accountUpdates[0][1].$unset).toEqual({ password: "" });
    expect(db.calls.sessionDeletes).toHaveLength(1);
    expect(db.calls.userUpdates[0][1].$set.passwordSetupRequired).toBe(true);
  });

  it("même navigateur que l'inscription : rien ne change", async () => {
    const db = fakeDb({ user: { _id: id, emailVerified: false } });
    const r = await revokeUnprovenPassword({
      mongoDb: db,
      email: "a@x.fr",
      currentUserId: id.toHexString(),
    });
    expect(r.revoked).toBe(false);
    expect(db.calls.accountUpdates).toHaveLength(0);
    expect(db.calls.sessionDeletes).toHaveLength(0);
  });

  it("adresse déjà vérifiée, compte sans mot de passe ou inconnu : rien ne change", async () => {
    for (const db of [
      fakeDb({ user: { _id: id, emailVerified: true } }),
      fakeDb({ user: { _id: id, emailVerified: false }, credentials: 0 }),
      fakeDb({ user: null }),
    ]) {
      expect(
        (await revokeUnprovenPassword({ mongoDb: db, email: "a@x.fr" }))
          .revoked,
      ).toBe(false);
      expect(db.calls.sessionDeletes).toHaveLength(0);
    }
  });

  it("le nouveau mot de passe n'est accepté que pour un compte dont il a été retiré", async () => {
    const sansRetrait = fakeDb({ user: null });
    expect(
      (
        await setPasswordAfterProof({
          mongoDb: sansRetrait,
          userId: id.toHexString(),
          passwordHash: "h",
        })
      ).ok,
    ).toBe(false);
    expect(sansRetrait.calls.accountUpdates).toHaveLength(0);

    const apresRetrait = fakeDb({ user: { _id: id } });
    expect(
      (
        await setPasswordAfterProof({
          mongoDb: apresRetrait,
          userId: id.toHexString(),
          passwordHash: "h",
        })
      ).ok,
    ).toBe(true);
    expect(apresRetrait.calls.accountUpdates[0][1].$set.password).toBe("h");
    expect(apresRetrait.calls.userUpdates[0][1].$unset).toEqual({
      passwordSetupRequired: "",
    });
  });

  it("longueur du mot de passe contrôlée", () => {
    expect(validateNewPassword("court")).toMatch(/au moins/);
    expect(validateNewPassword("x".repeat(129))).toMatch(/au plus/);
    expect(validateNewPassword({})).toBeTruthy();
    expect(validateNewPassword("Assez-long-2026")).toBeNull();
  });
});
