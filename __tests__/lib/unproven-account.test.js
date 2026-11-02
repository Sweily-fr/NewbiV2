import { describe, it, expect, vi } from "vitest";
import { ObjectId } from "mongodb";
import {
  confirmSignupPassword,
  needsOwnershipChoice,
  replaceUnprovenPassword,
  validateNewPassword,
} from "@/src/lib/unproven-account";

function fakeDb({
  user,
  account = { password: "hash-inscription" },
  matched = 1,
}) {
  const calls = { accountUpdates: [], sessionDeletes: [], inserts: [] };
  return {
    calls,
    collection: (name) => {
      if (name === "user") return { findOne: vi.fn(async () => user) };
      if (name === "account") {
        return {
          findOne: vi.fn(async () => account),
          updateMany: vi.fn(async (f, u) => {
            calls.accountUpdates.push([f, u]);
            return { matchedCount: matched };
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
}

const id = new ObjectId();
const nonVerifie = { _id: id, emailVerified: false };
const verifyPassword = vi.fn(
  async ({ hash, password }) =>
    hash === "hash-inscription" && password === "Bon-Mot-2026!",
);

describe("Lien de vérification ouvert ailleurs que dans le navigateur de l'inscription", () => {
  it("compte non vérifié avec mot de passe, autre navigateur : choix demandé", async () => {
    const r = await needsOwnershipChoice({
      mongoDb: fakeDb({ user: nonVerifie }),
      email: "A@x.fr",
    });
    expect(r.required).toBe(true);
  });

  it("même navigateur, adresse déjà vérifiée, compte sans mot de passe (Google), compte inconnu : pas de choix", async () => {
    expect(
      (
        await needsOwnershipChoice({
          mongoDb: fakeDb({ user: nonVerifie }),
          email: "a@x.fr",
          currentUserId: id.toHexString(),
        })
      ).required,
    ).toBe(false);
    expect(
      (
        await needsOwnershipChoice({
          mongoDb: fakeDb({ user: { _id: id, emailVerified: true } }),
          email: "a@x.fr",
        })
      ).required,
    ).toBe(false);
    expect(
      (
        await needsOwnershipChoice({
          mongoDb: fakeDb({ user: nonVerifie, account: null }),
          email: "a@x.fr",
        })
      ).required,
    ).toBe(false);
    expect(
      (
        await needsOwnershipChoice({
          mongoDb: fakeDb({ user: null }),
          email: "a@x.fr",
        })
      ).required,
    ).toBe(false);
  });

  it("« J'ai créé ce compte » : seul le mot de passe de l'inscription est accepté, rien n'est modifié", async () => {
    const db = fakeDb({ user: nonVerifie });
    expect(
      (
        await confirmSignupPassword({
          mongoDb: db,
          email: "a@x.fr",
          password: "Bon-Mot-2026!",
          verifyPassword,
        })
      ).ok,
    ).toBe(true);
    for (const password of ["Mauvais-2026!", "", undefined, { $ne: null }]) {
      expect(
        (
          await confirmSignupPassword({
            mongoDb: db,
            email: "a@x.fr",
            password,
            verifyPassword,
          })
        ).ok,
      ).toBe(false);
    }
    expect(db.calls.accountUpdates).toHaveLength(0);
    expect(db.calls.sessionDeletes).toHaveLength(0);
  });

  it("« J'ai créé ce compte » sur une adresse déjà vérifiée : refusé", async () => {
    const db = fakeDb({ user: { _id: id, emailVerified: true } });
    expect(
      (
        await confirmSignupPassword({
          mongoDb: db,
          email: "a@x.fr",
          password: "Bon-Mot-2026!",
          verifyPassword,
        })
      ).ok,
    ).toBe(false);
  });

  it("« Choisir un mot de passe » : mot de passe remplacé, sessions d'avant fermées", async () => {
    const db = fakeDb({ user: nonVerifie });
    expect(
      (
        await replaceUnprovenPassword({
          mongoDb: db,
          email: "a@x.fr",
          passwordHash: "nouveau",
        })
      ).ok,
    ).toBe(true);
    expect(db.calls.accountUpdates[0][1].$set.password).toBe("nouveau");
    expect(db.calls.sessionDeletes).toHaveLength(1);
  });

  it("« Choisir un mot de passe » sur une adresse déjà vérifiée : rien n'est touché", async () => {
    const db = fakeDb({ user: { _id: id, emailVerified: true } });
    expect(
      (
        await replaceUnprovenPassword({
          mongoDb: db,
          email: "a@x.fr",
          passwordHash: "nouveau",
        })
      ).ok,
    ).toBe(false);
    expect(db.calls.accountUpdates).toHaveLength(0);
    expect(db.calls.sessionDeletes).toHaveLength(0);
  });

  it("longueur du nouveau mot de passe contrôlée", () => {
    expect(validateNewPassword("court")).toMatch(/au moins/);
    expect(validateNewPassword("x".repeat(129))).toMatch(/au plus/);
    expect(validateNewPassword({})).toBeTruthy();
    expect(validateNewPassword("Assez-long-2026")).toBeNull();
  });
});
