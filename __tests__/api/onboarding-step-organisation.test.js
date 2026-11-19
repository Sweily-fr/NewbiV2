// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Étape entreprise (PATCH /api/onboarding/step, workspace → plan) : l'espace
 * renseigné (raison sociale, SIRET, déclaration d'usage professionnel) doit
 * être un espace dont l'utilisateur est propriétaire, jamais la première
 * appartenance trouvée (qui peut être l'espace qui l'a invité).
 *
 * Depuis le 18/11/2026, l'inscription se termine au paiement Stripe (offre +
 * carte, essai de 7 jours) : cette étape n'accorde aucun essai et ne termine
 * pas l'inscription.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  userFindOne: vi.fn(),
  userUpdateOne: vi.fn(),
  memberships: vi.fn(async () => []),
  orgUpdateOne: vi.fn(),
  grantTrial: vi.fn(),
  verifySiret: vi.fn(),
  orgsWithSiret: vi.fn(async () => []),
  memberFindOne: vi.fn(),
  repair: vi.fn(),
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
          findOne: (query) => m.memberFindOne(query),
          find: () => ({ toArray: m.memberships }),
        };
      }
      if (name === "organization") {
        return {
          updateOne: m.orgUpdateOne,
          find: () => ({ toArray: m.orgsWithSiret }),
        };
      }
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

vi.mock("@/src/lib/signup-workspace-repair", () => ({
  repairMissingSignupWorkspace: (...args) => m.repair(...args),
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
  step: "plan",
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
  m.orgsWithSiret.mockResolvedValue([]);
  m.memberFindOne.mockImplementation(
    async () => (await m.memberships())[0] || null,
  );
});

describe("PATCH /api/onboarding/step : espace d'inscription manquant", () => {
  // Constaté le 19/11/2026 : sans espace, l'étape répondait « Aucune
  // organisation rattachée : recommencez l'inscription », une impasse.
  const repairedOrgId = "507f1f77bcf86cd799439055";

  it("recrée l'espace provisoire puis y enregistre l'entreprise", async () => {
    m.getSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr", name: "Paul Sanssiret" },
      session: { activeOrganizationId: null },
    });
    m.memberships.mockResolvedValue([]);
    m.repair.mockResolvedValue({ organizationId: new ObjectId(repairedOrgId) });

    const res = await call(completeBody());

    expect(res.status).toBe(200);
    expect(m.repair).toHaveBeenCalledWith(
      expect.objectContaining({ userId, userName: "Paul Sanssiret" }),
    );
    expect(updatedOrgIds()).toEqual([repairedOrgId]);
    expect((await res.json()).step).toBe("plan");
  });

  it("création déjà en cours (double clic) : 409, rien d'écrit", async () => {
    signIn();
    m.memberships.mockResolvedValue([]);
    m.repair.mockResolvedValue({ pending: true });

    const res = await call(completeBody());

    expect(res.status).toBe(409);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
    expect(m.userUpdateOne).not.toHaveBeenCalled();
  });

  it("espace demandé sans en être membre : refus, aucun espace créé", async () => {
    signIn();
    m.memberships.mockResolvedValue([]);

    const res = await call(completeBody({ organizationId: ownOrgId }));

    expect(res.status).toBe(403);
    expect(m.repair).not.toHaveBeenCalled();
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });
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
    expect(updatedOrgIds()).toEqual([ownOrgId]);
    expect(m.grantTrial).not.toHaveBeenCalled();
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
    // Étape suivante : le choix de l'offre, pas la fin de l'inscription
    expect(update.$set.onboardingStep).toBe("plan");
    const [, orgUpdate] = m.orgUpdateOne.mock.calls[0];
    expect(orgUpdate.$set).not.toHaveProperty("onboardingCompleted");
    expect(m.grantTrial).not.toHaveBeenCalled();
  });

  it("refuse l'ancienne fin d'inscription sans carte (onglet resté ouvert)", async () => {
    signIn(ownOrgId);
    m.memberships.mockResolvedValue([membership(ownOrgId, "owner")]);

    const res = await call(completeBody({ step: "completed" }));

    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/Rechargez la page/);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
    expect(m.userUpdateOne).not.toHaveBeenCalled();
    expect(m.grantTrial).not.toHaveBeenCalled();
  });

  it("exige la déclaration d'usage professionnel pour passer à l'offre", async () => {
    signIn(ownOrgId);
    m.memberships.mockResolvedValue([membership(ownOrgId, "owner")]);

    const res = await call(completeBody({ honorDeclarationAccepted: false }));

    expect(res.status).toBe(400);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
    expect(m.userUpdateOne).not.toHaveBeenCalled();
  });

  it("revenir de l'offre au récapitulatif ne réécrit pas l'entreprise", async () => {
    signIn(ownOrgId);
    m.memberships.mockResolvedValue([membership(ownOrgId, "owner")]);
    m.userFindOne.mockResolvedValue({ onboardingStep: "recap" });

    const res = await call({ step: "plan" });

    expect(res.status).toBe(200);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/onboarding/step : inscription sans SIRET", () => {
  beforeEach(() => {
    signIn(ownOrgId);
    m.memberships.mockResolvedValue([membership(ownOrgId, "owner")]);
  });

  it("enregistre l'entreprise avec le nom saisi, sans interroger le registre", async () => {
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
    expect(update.$set).not.toHaveProperty("onboardingCompleted");

    expect(m.grantTrial).not.toHaveBeenCalled();
    const [, userUpdate] = m.userUpdateOne.mock.calls[0];
    expect(userUpdate.$set.onboardingStep).toBe("plan");
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

describe("PATCH /api/onboarding/step : SIRET d'un autre espace", () => {
  const otherOrgId = "507f1f77bcf86cd799439055";

  it("SIRET déjà porté par un espace dont l'utilisateur n'est pas membre : refus 409, rien d'écrit", async () => {
    signIn(ownOrgId);
    m.memberships.mockResolvedValue([membership(ownOrgId, "owner")]);
    m.orgsWithSiret.mockResolvedValue([{ _id: new ObjectId(otherOrgId) }]);
    m.memberFindOne.mockResolvedValue(null);

    const res = await call(completeBody());

    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(
      /déjà utilisé par un autre espace/,
    );
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
    expect(m.userUpdateOne).not.toHaveBeenCalled();
    expect(m.grantTrial).not.toHaveBeenCalled();
    expect(m.verifySiret).not.toHaveBeenCalled();
  });

  it("SIRET d'un espace dont il est déjà membre (reprise) : accepté", async () => {
    signIn(ownOrgId);
    m.memberships.mockResolvedValue([membership(ownOrgId, "owner")]);
    m.orgsWithSiret.mockResolvedValue([{ _id: new ObjectId(otherOrgId) }]);
    m.memberFindOne.mockResolvedValue(membership(otherOrgId, "member"));

    const res = await call(completeBody());

    expect(res.status).toBe(200);
  });
});
