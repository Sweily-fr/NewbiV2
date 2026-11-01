import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Codes de mise en place de la double authentification (collection
 * twoFactorSetupOtp). La collection est simulée en mémoire, avec une pause
 * entre chaque opération comme sur une vraie base : des vérifications
 * envoyées en même temps s'entremêlent.
 */
const db = vi.hoisted(() => {
  const docs = new Map();
  const pause = () => new Promise((r) => setTimeout(r, 0));
  const correspond = (doc, filtre) =>
    Object.entries(filtre).every(([cle, cond]) => {
      if (cle === "$or") return cond.some((f) => correspond(doc, f));
      const valeur = doc[cle];
      if (cond && typeof cond === "object" && !(cond instanceof Date)) {
        if ("$lt" in cond) return valeur !== undefined && valeur < cond.$lt;
        if ("$gte" in cond) return valeur !== undefined && valeur >= cond.$gte;
        if ("$exists" in cond) return (valeur !== undefined) === cond.$exists;
      }
      return valeur === cond;
    });
  const trouver = (filtre) =>
    [...docs.values()].find((d) => correspond(d, filtre)) || null;
  const appliquer = (doc, maj) => {
    if (maj.$set) Object.assign(doc, maj.$set);
    if (maj.$inc)
      for (const [k, v] of Object.entries(maj.$inc)) doc[k] = (doc[k] || 0) + v;
  };
  const collection = {
    updateOne: vi.fn(async (filtre, maj, options = {}) => {
      await pause();
      let doc = trouver(filtre);
      if (!doc && options.upsert) {
        doc = { userId: filtre.userId };
        docs.set(filtre.userId, doc);
      }
      if (doc) appliquer(doc, maj);
      return { acknowledged: true };
    }),
    findOne: vi.fn(async (filtre) => {
      await pause();
      const doc = trouver(filtre);
      return doc ? { ...doc } : null;
    }),
    findOneAndUpdate: vi.fn(async (filtre, maj) => {
      await pause();
      const doc = trouver(filtre);
      if (!doc) return null;
      appliquer(doc, maj);
      return { ...doc };
    }),
    deleteOne: vi.fn(async (filtre) => {
      await pause();
      const doc = trouver(filtre);
      if (doc) docs.delete(doc.userId);
      return { deletedCount: doc ? 1 : 0 };
    }),
  };
  return { docs, collection };
});

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: vi.fn(() => db.collection) },
}));

import {
  setupOtpStore,
  MAX_SETUP_OTP_ATTEMPTS,
} from "@/src/lib/setup-otp-store";

const poser = (champs) =>
  db.docs.set("u", {
    userId: "u",
    otp: "123456",
    attempts: 0,
    expiresAt: new Date(Date.now() + 60_000),
    ...champs,
  });

beforeEach(() => {
  db.docs.clear();
  for (const fn of Object.values(db.collection)) fn.mockClear();
});

describe("setupOtpStore.set", () => {
  it("enregistre le code (en texte), son échéance et un compteur à zéro", async () => {
    const avant = Date.now();
    await setupOtpStore.set("user-1", 123456, 60_000);
    const [filtre, maj, options] = db.collection.updateOne.mock.calls[0];
    expect(filtre).toEqual({ userId: "user-1" });
    expect(maj.$set.otp).toBe("123456");
    expect(maj.$set.attempts).toBe(0);
    expect(maj.$set.expiresAt.getTime()).toBeGreaterThanOrEqual(
      avant + 60_000 - 5,
    );
    expect(options).toEqual({ upsert: true });
  });

  it("un nouveau code remet le compteur à zéro", async () => {
    poser({ attempts: 3 });
    await setupOtpStore.set("u", "654321", 1000);
    expect(db.docs.get("u")).toMatchObject({ otp: "654321", attempts: 0 });
  });
});

describe("setupOtpStore.verify", () => {
  it("aucun code pour l'utilisateur : refusé", async () => {
    expect(await setupOtpStore.verify("u", "123456")).toBe(false);
  });

  it("code expiré : refusé et supprimé", async () => {
    poser({ expiresAt: new Date(Date.now() - 1000) });
    expect(await setupOtpStore.verify("u", "123456")).toBe(false);
    expect(db.docs.has("u")).toBe(false);
  });

  it("bon code : accepté une seule fois", async () => {
    poser();
    expect(await setupOtpStore.verify("u", "123456")).toBe(true);
    expect(await setupOtpStore.verify("u", "123456")).toBe(false);
  });

  it("espaces autour du code et code numérique : comparés comme du texte", async () => {
    poser();
    expect(await setupOtpStore.verify("u", "  123456  ")).toBe(true);
    poser();
    expect(await setupOtpStore.verify("u", 123456)).toBe(true);
  });

  it("mauvais code : refusé, le code reste valable (faute de frappe)", async () => {
    poser();
    expect(await setupOtpStore.verify("u", "999999")).toBe(false);
    expect(db.docs.get("u").attempts).toBe(1);
    expect(await setupOtpStore.verify("u", "123456")).toBe(true);
  });

  it("entrée enregistrée sans compteur (ancienne) : vérifiée normalement", async () => {
    poser({ attempts: undefined });
    expect(await setupOtpStore.verify("u", "123456")).toBe(true);
  });
});

describe("setupOtpStore.verify : limite d'essais", () => {
  it(`le ${MAX_SETUP_OTP_ATTEMPTS}e essai peut encore être le bon`, async () => {
    poser();
    for (let i = 1; i < MAX_SETUP_OTP_ATTEMPTS; i++) {
      expect(await setupOtpStore.verify("u", "000000")).toBe(false);
    }
    expect(await setupOtpStore.verify("u", "123456")).toBe(true);
  });

  it(`${MAX_SETUP_OTP_ATTEMPTS} mauvais codes : le code est invalidé, le bon est ensuite refusé`, async () => {
    poser();
    for (let i = 0; i < MAX_SETUP_OTP_ATTEMPTS; i++) {
      expect(await setupOtpStore.verify("u", "000000")).toBe(false);
    }
    expect(db.docs.has("u")).toBe(false);
    expect(await setupOtpStore.verify("u", "123456")).toBe(false);
  });

  it("6 mauvais codes envoyés en même temps puis le bon : refusé", async () => {
    poser();
    const essais = await Promise.all(
      ["000001", "000002", "000003", "000004", "000005", "000006"].map((c) =>
        setupOtpStore.verify("u", c),
      ),
    );
    expect(essais).toEqual([false, false, false, false, false, false]);
    expect(await setupOtpStore.verify("u", "123456")).toBe(false);
  });

  it("20 essais envoyés en même temps, dont le bon en dernier : au plus 5 comparés, refusé", async () => {
    poser();
    const codes = Array.from({ length: 19 }, (_, i) =>
      String(100000 + i),
    ).concat("123456");
    const essais = await Promise.all(
      codes.map((c) => setupOtpStore.verify("u", c)),
    );
    expect(essais.at(-1)).toBe(false);
    expect(essais.filter(Boolean)).toEqual([]);
  });
});
