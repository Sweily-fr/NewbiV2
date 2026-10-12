// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * SIRET modifié dans les paramètres de l'espace : vérifié au registre et
 * refusé s'il appartient à un autre espace. Un SIRET inchangé ne déclenche
 * aucun contrôle (espaces existants jamais vérifiés).
 */

const m = vi.hoisted(() => ({ verifySiret: vi.fn() }));

vi.mock("@/src/lib/siret-verification.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, verifySiret: (...args) => m.verifySiret(...args) };
});

import { checkOrganizationSiretUpdate } from "@/src/lib/organization-siret-guard";

const orgId = "507f1f77bcf86cd799439022";
const otherOrgId = "507f1f77bcf86cd799439033";
const userId = "507f1f77bcf86cd799439011";
const SIRET = "12345678900011";

function fakeDb({ currentSiret = "", others = [], membership = null } = {}) {
  const db = {
    orgFindOne: vi.fn(async () => ({ siret: currentSiret })),
    orgFind: vi.fn(() => ({ toArray: async () => others })),
    memberFindOne: vi.fn(async () => membership),
  };
  db.collection = (name) => {
    if (name === "organization") {
      return { findOne: db.orgFindOne, find: db.orgFind };
    }
    if (name === "member") return { findOne: db.memberFindOne };
    throw new Error(`Collection inattendue : ${name}`);
  };
  return db;
}

const check = (mongoDb, siret) =>
  checkOrganizationSiretUpdate({
    mongoDb,
    organizationId: orgId,
    userId,
    siret,
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.verifySiret.mockResolvedValue({
    ok: true,
    company: {
      siret: SIRET,
      siren: "123456789",
      denominationUniteLegale: "STUDIO DUPONT",
      activitePrincipale: "62.01Z",
      dateCreation: "2020-01-01",
    },
  });
});

describe("checkOrganizationSiretUpdate", () => {
  it("ignore une mise à jour qui ne touche pas au SIRET", async () => {
    const db = fakeDb();

    expect(await check(db, undefined)).toEqual({ ok: true, data: null });
    expect(db.orgFindOne).not.toHaveBeenCalled();
  });

  it("ne contrôle pas un SIRET inchangé, même saisi avec des espaces", async () => {
    const db = fakeDb({ currentSiret: "123 456 789 00011" });

    expect(await check(db, SIRET)).toEqual({ ok: true, data: null });
    expect(m.verifySiret).not.toHaveBeenCalled();
  });

  it("retire la preuve de vérification quand le SIRET est vidé", async () => {
    const db = fakeDb({ currentSiret: SIRET });

    expect(await check(db, "")).toEqual({
      ok: true,
      data: { siret: "", siretVerifiedAt: null },
    });
    expect(m.verifySiret).not.toHaveBeenCalled();
  });

  it("enregistre la preuve de vérification d'un nouveau SIRET", async () => {
    const result = await check(fakeDb(), "123 456 789 00011");

    expect(m.verifySiret).toHaveBeenCalledWith(SIRET);
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      siret: SIRET,
      siren: "123456789",
      siretVerificationSource: "recherche-entreprises.api.gouv.fr",
      denominationUniteLegale: "STUDIO DUPONT",
    });
    expect(result.data.siretVerifiedAt).toBeInstanceOf(Date);
  });

  it("refuse un SIRET introuvable ou fermé avec le message du registre", async () => {
    m.verifySiret.mockResolvedValue({ ok: false, reason: "not_found" });

    expect(await check(fakeDb(), SIRET)).toEqual({
      ok: false,
      message: "Ce numéro SIRET est introuvable au registre des entreprises.",
    });

    m.verifySiret.mockResolvedValue({ ok: false, reason: "invalid_format" });
    expect((await check(fakeDb(), "1234")).ok).toBe(false);
  });

  it("refuse le SIRET d'un autre espace dont l'utilisateur n'est pas membre", async () => {
    const db = fakeDb({ others: [{ _id: new ObjectId(otherOrgId) }] });

    const result = await check(db, SIRET);

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/déjà utilisé par un autre espace/);
    expect(m.verifySiret).not.toHaveBeenCalled();
    // L'espace modifié lui-même est exclu de la recherche de doublon.
    const [filter] = db.orgFind.mock.calls[0];
    expect(String(filter._id.$ne)).toBe(orgId);
  });

  it("accepte le SIRET d'un autre espace dont l'utilisateur est membre", async () => {
    const db = fakeDb({
      others: [{ _id: new ObjectId(otherOrgId) }],
      membership: { _id: new ObjectId() },
    });

    expect((await check(db, SIRET)).ok).toBe(true);
    expect(m.verifySiret).toHaveBeenCalled();
  });

  it("enregistre sans preuve quand le registre est injoignable", async () => {
    m.verifySiret.mockResolvedValue({
      ok: false,
      reason: "service_unavailable",
    });

    expect(await check(fakeDb(), SIRET)).toEqual({
      ok: true,
      data: { siret: SIRET, siren: "123456789", siretVerifiedAt: null },
    });
  });
});
