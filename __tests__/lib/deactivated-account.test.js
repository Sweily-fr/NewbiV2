import { describe, it, expect, vi, beforeEach } from "vitest";

// Compte désactivé : la création de session est refusée quelle que soit la
// voie de connexion (Google, Apple, mobile, lien de vérification…).

const { APIErrorMock } = vi.hoisted(() => {
  class APIErrorMock extends Error {
    constructor(status, body) {
      super(body?.message || status);
      this.status = status;
      this.body = body;
    }
  }
  return { APIErrorMock };
});
vi.mock("better-auth/api", () => ({ APIError: APIErrorMock }));

const { sendReactivationEmailMock } = vi.hoisted(() => ({
  sendReactivationEmailMock: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/src/lib/auth-utils", () => ({
  sendReactivationEmail: sendReactivationEmailMock,
}));

const { findOneMock } = vi.hoisted(() => ({ findOneMock: vi.fn() }));
vi.mock("@/src/lib/mongodb.js", () => ({
  mongoDb: { collection: () => ({ findOne: findOneMock }) },
}));

import {
  assertAccountActiveForSession,
  normalizeEmail,
  DEACTIVATED_ACCOUNT_CODE,
  DEACTIVATED_ACCOUNT_MESSAGE,
} from "@/src/lib/deactivated-account";

const USER_ID = "64b000000000000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("normalizeEmail", () => {
  it("minuscules et espaces retirés, comme Better Auth l'enregistre", () => {
    expect(normalizeEmail("  Lea.Martin@Exemple.FR ")).toBe(
      "lea.martin@exemple.fr",
    );
  });
  it("une valeur qui n'est pas du texte ne devient jamais une requête", () => {
    expect(normalizeEmail({ $ne: null })).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });
});

describe("assertAccountActiveForSession", () => {
  it("compte désactivé : session refusée, code et message explicites, lien de réactivation renvoyé", async () => {
    const user = { _id: USER_ID, email: "u@x.fr", isActive: false };
    findOneMock.mockResolvedValue(user);

    const erreur = await assertAccountActiveForSession({
      userId: USER_ID,
    }).catch((e) => e);

    expect(erreur).toBeInstanceOf(APIErrorMock);
    expect(erreur.status).toBe("FORBIDDEN");
    expect(erreur.body).toEqual({
      message: DEACTIVATED_ACCOUNT_MESSAGE,
      code: DEACTIVATED_ACCOUNT_CODE,
    });
    expect(sendReactivationEmailMock).toHaveBeenCalledWith(user);
  });

  it("l'e-mail de réactivation qui échoue n'ouvre pas la session pour autant", async () => {
    findOneMock.mockResolvedValue({ _id: USER_ID, isActive: false });
    sendReactivationEmailMock.mockRejectedValueOnce(new Error("Resend"));
    await expect(
      assertAccountActiveForSession({ userId: USER_ID }),
    ).rejects.toBeInstanceOf(APIErrorMock);
  });

  it.each([
    ["compte actif", { _id: USER_ID, isActive: true }],
    ["champ absent (comptes anciens)", { _id: USER_ID }],
    ["compte introuvable", null],
  ])("%s : session permise", async (_cas, user) => {
    findOneMock.mockResolvedValue(user);
    await expect(
      assertAccountActiveForSession({ userId: USER_ID }),
    ).resolves.toBeUndefined();
    expect(sendReactivationEmailMock).not.toHaveBeenCalled();
  });

  it("session d'administration (impersonation) : pas de contrôle", async () => {
    await assertAccountActiveForSession({
      userId: USER_ID,
      impersonatedBy: "64b0000000000000000000ff",
    });
    expect(findOneMock).not.toHaveBeenCalled();
  });

  it("base injoignable : la connexion n'est pas bloquée", async () => {
    findOneMock.mockRejectedValue(new Error("DB down"));
    await expect(
      assertAccountActiveForSession({ userId: USER_ID }),
    ).resolves.toBeUndefined();
  });
});
