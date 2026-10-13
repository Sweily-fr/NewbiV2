// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Fin d'onboarding (PATCH /api/onboarding/step, step "completed") : l'espace
 * renseigné (raison sociale, SIRET) et qui reçoit l'essai doit être un
 * espace dont l'utilisateur est propriétaire, jamais la première
 * appartenance trouvée (qui peut être l'espace qui l'a invité).
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  userFindOne: vi.fn(),
  userUpdateOne: vi.fn(),
  memberships: vi.fn(async () => []),
  orgUpdateOne: vi.fn(),
  grantTrial: vi.fn(),
  verifySiret: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "user") {
        return { findOne: m.userFindOne, updateOne: m.userUpdateOne };
      }
      if (name === "member") {
        return {
          // Ancien code : première appartenance trouvée
          findOne: async () => (await m.memberships())[0] || null,
          find: () => ({ toArray: m.memberships }),
        };
      }
      if (name === "organization") return { updateOne: m.orgUpdateOne };
      throw new Error(`Collection inattendue : ${name}`);
    },
  },
}));

vi.mock("@/src/lib/feature-flags", () => ({
  isAppTrialEnabled: () => true,
}));

vi.mock("@/src/lib/org-creation", () => ({
  grantAppTrialIfEligible: (...args) => m.grantTrial(...args),
}));

vi.mock("@/src/lib/siret-verification", () => ({
  verifySiret: (...args) => m.verifySiret(...args),
  siretVerificationMessage: () => "SIRET refusé",
  SIRET_VERIFICATION_ERRORS: { SERVICE_UNAVAILABLE: "service_unavailable" },
}));

const userId = "507f1f77bcf86cd799439011";
const ownOrgId = "507f1f77bcf86cd799439022";
const invitingOrgId = "507f1f77bcf86cd799439033";
const secondOwnOrgId = "507f1f77bcf86cd799439044";

const membership = (organizationId, role) => ({
  userId: new ObjectId(userId),
  organizationId: new ObjectId(organizationId),
  role,
});

function signIn(activeOrganizationId = null) {
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "u@x.fr" },
    session: { activeOrganizationId },
  });
}

const completeBody = (extra = {}) => ({
  step: "completed",
  honorDeclarationAccepted: true,
  data: { companyName: "Ma société", siret: "12345678900011" },
  ...extra,
});

const call = async (body) => {
  const { PATCH } = await import("@/app/api/onboarding/step/route");
  return PATCH(
    new Request("http://localhost/api/onboarding/step", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
};

const updatedOrgIds = () =>
  m.orgUpdateOne.mock.calls.map(([filter]) => String(filter._id));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  m.userFindOne.mockResolvedValue({ onboardingStep: "workspace" });
  m.verifySiret.mockResolvedValue({
    ok: true,
    company: {
      siret: "12345678900011",
      siren: "123456789",
      denominationUniteLegale: "MA SOCIETE",
    },
  });
  m.grantTrial.mockResolvedValue(true);
});

describe("PATCH /api/onboarding/step : espace configuré", () => {
  it("n'écrase pas l'espace qui a invité l'utilisateur", async () => {
    // L'invitation acceptée apparaît en premier et est l'espace actif
    signIn(invitingOrgId);
    m.memberships.mockResolvedValue([
      membership(invitingOrgId, "member"),
      membership(ownOrgId, "owner"),
    ]);

    const res = await call(completeBody());

    expect(res.status).toBe(200);
    expect((await res.json()).organizationId).toBe(ownOrgId);
    expect(updatedOrgIds()).toEqual([ownOrgId]);
    expect(String(m.grantTrial.mock.calls[0][0].organizationId)).toBe(ownOrgId);
  });

  it("refuse si l'utilisateur n'est propriétaire d'aucun espace", async () => {
    signIn(invitingOrgId);
    m.memberships.mockResolvedValue([membership(invitingOrgId, "admin")]);

    const res = await call(completeBody());

    expect(res.status).toBe(403);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
    expect(m.grantTrial).not.toHaveBeenCalled();
    expect(m.userUpdateOne).not.toHaveBeenCalled();
  });

  it("utilise l'espace actif quand l'utilisateur en est propriétaire", async () => {
    signIn(secondOwnOrgId);
    m.memberships.mockResolvedValue([
      membership(ownOrgId, "owner"),
      membership(secondOwnOrgId, "owner"),
    ]);

    const res = await call(completeBody());

    expect(res.status).toBe(200);
    expect(updatedOrgIds()).toEqual([secondOwnOrgId]);
  });

  it("refuse de choisir au hasard entre plusieurs espaces", async () => {
    signIn(null);
    m.memberships.mockResolvedValue([
      membership(ownOrgId, "owner"),
      membership(secondOwnOrgId, "owner"),
    ]);

    const res = await call(completeBody());

    expect(res.status).toBe(409);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });

  it("refuse un espace passé dont l'utilisateur n'est pas propriétaire", async () => {
    signIn(ownOrgId);
    m.memberships.mockResolvedValue([
      membership(ownOrgId, "owner"),
      membership(invitingOrgId, "member"),
    ]);

    const res = await call(completeBody({ organizationId: invitingOrgId }));

    expect(res.status).toBe(403);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });

  it("accepte un espace passé dont l'utilisateur est propriétaire", async () => {
    signIn(null);
    m.memberships.mockResolvedValue([
      membership(ownOrgId, "owner"),
      membership(secondOwnOrgId, "owner"),
    ]);

    const res = await call(completeBody({ organizationId: secondOwnOrgId }));

    expect(res.status).toBe(200);
    expect(updatedOrgIds()).toEqual([secondOwnOrgId]);
  });

  it("parcours standard : l'espace créé à l'inscription", async () => {
    signIn(ownOrgId);
    m.memberships.mockResolvedValue([membership(ownOrgId, "owner")]);

    const res = await call(completeBody());

    expect(res.status).toBe(200);
    expect(updatedOrgIds()).toEqual([ownOrgId]);
    const [, update] = m.userUpdateOne.mock.calls[0];
    expect(update.$set.onboardingStep).toBe("completed");
  });
});

describe("PATCH /api/onboarding/step : inscription sans SIRET", () => {
  beforeEach(() => {
    signIn(ownOrgId);
    m.memberships.mockResolvedValue([membership(ownOrgId, "owner")]);
  });

  it("termine l'inscription avec le nom saisi, sans interroger le registre", async () => {
    const res = await call(
      completeBody({
        data: { companyName: "  Studio Dupont  ", siret: "", siren: "" },
      }),
    );

    expect(res.status).toBe(200);
    expect(m.verifySiret).not.toHaveBeenCalled();

    const [, update] = m.orgUpdateOne.mock.calls[0];
    expect(update.$set.companyName).toBe("Studio Dupont");
    expect(update.$set.name).toBe("Studio Dupont");
    // Le SIRET de l'espace n'est pas touché, et rien ne prétend l'avoir
    // vérifié.
    expect(update.$set).not.toHaveProperty("siret");
    expect(update.$set).not.toHaveProperty("siretVerifiedAt");
    expect(update.$set.professionalUseDeclaration.withSiret).toBe(false);
    // Le texte exact accepté est conservé avec la preuve.
    expect(update.$set.professionalUseDeclaration.statement).toMatch(
      /^En continuant, vous confirmez utiliser Newbi/,
    );
    expect(update.$set.onboardingCompleted).toBe(true);

    expect(m.grantTrial).toHaveBeenCalledTimes(1);
    const [, userUpdate] = m.userUpdateOne.mock.calls[0];
    expect(userUpdate.$set.onboardingStep).toBe("completed");

    expect((await res.json()).company).toEqual({
      siret: null,
      denomination: "Studio Dupont",
    });
  });

  it("refuse sans SIRET ni nom d'entreprise", async () => {
    const res = await call(completeBody({ data: { siret: "" } }));

    expect(res.status).toBe(400);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
    expect(m.grantTrial).not.toHaveBeenCalled();
  });

  it("vérifie toujours au registre un SIRET fourni", async () => {
    m.verifySiret.mockResolvedValue({ ok: false, reason: "not_found" });

    const res = await call(completeBody());

    expect(res.status).toBe(400);
    expect(m.verifySiret).toHaveBeenCalledWith("12345678900011");
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });
});
