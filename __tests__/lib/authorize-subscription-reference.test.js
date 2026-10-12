// @vitest-environment node
//
// Régression : la résiliation d'abonnement échouait car `authorizeReference`
// du plugin Stripe utilisait `auth.options.database.findFirst` — or
// `auth.options.database` est la *factory* d'adaptateur Better Auth (une
// fonction) et l'adaptateur n'expose pas `findFirst` (c'est `findOne`). La
// condition était toujours fausse → `return false` → toute action d'abonnement
// (cancel/upgrade/restore) était refusée. La fonction interroge désormais
// MongoDB directement.
import { describe, it, expect, afterEach, vi } from "vitest";
import { ObjectId } from "mongodb";

// Clés factices nécessaires car l'import du module instancie Stripe/Resend.
process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_dummy";
process.env.RESEND_API_KEY ||= "re_dummy";

// Mock MongoDB (même approche que require-org-membership.test.js).
const mockFindOne = vi.fn();
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({ findOne: mockFindOne }),
  },
}));

// Droits de la page Facturation (rôle prédéfini ou personnalisé)
const mockGetModuleActions = vi.fn();
vi.mock("@/src/lib/organization-roles", async (importOriginal) => ({
  ...(await importOriginal()),
  getModuleActions: (...args) => mockGetModuleActions(...args),
}));

const { authorizeSubscriptionReference } =
  await import("@/src/lib/auth-plugins");

const orgId = new ObjectId().toString();
const userId = new ObjectId().toString();

afterEach(() => {
  mockFindOne.mockReset();
  mockGetModuleActions.mockReset();
});

describe("authorizeSubscriptionReference", () => {
  it("autorise un owner à résilier (cancel-subscription)", async () => {
    mockFindOne.mockResolvedValue({ role: "owner" });
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "cancel-subscription",
    });
    expect(ok).toBe(true);
  });

  it("autorise un owner à changer de plan (upgrade-subscription)", async () => {
    mockFindOne.mockResolvedValue({ role: "owner" });
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "upgrade-subscription",
    });
    expect(ok).toBe(true);
  });

  it("refuse un membre non-owner", async () => {
    mockFindOne.mockResolvedValue({ role: "member" });
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "cancel-subscription",
    });
    expect(ok).toBe(false);
  });

  it("refuse quand aucun membre ne correspond", async () => {
    mockFindOne.mockResolvedValue(null);
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "cancel-subscription",
    });
    expect(ok).toBe(false);
  });

  it("interroge la collection member avec les ObjectId coercés", async () => {
    mockFindOne.mockResolvedValue({ role: "owner" });
    await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "cancel-subscription",
    });
    const query = mockFindOne.mock.calls[0][0];
    // L'ObjectId hex doit être proposé sous forme ObjectId ET string.
    expect(query.organizationId.$in).toEqual(
      expect.arrayContaining([new ObjectId(orgId), orgId]),
    );
    expect(query.userId.$in).toEqual(
      expect.arrayContaining([new ObjectId(userId), userId]),
    );
    expect(query.organizationId.$in[0]).toBeInstanceOf(ObjectId);
  });

  it("rôle insensible à la casse (OWNER)", async () => {
    mockFindOne.mockResolvedValue({ role: "OWNER" });
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "restore-subscription",
    });
    expect(ok).toBe(true);
  });

  // Régression sécurité : « billing-portal » et « list-subscription »
  // passaient sans contrôle. N'importe quel compte connecté ouvrait le portail
  // Stripe (factures, carte, résiliation) ou lisait l'abonnement d'un autre
  // espace en passant son id en referenceId.
  it("refuse la liste des abonnements à un non-membre", async () => {
    mockFindOne.mockResolvedValue(null);
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "list-subscription",
    });
    expect(ok).toBe(false);
  });

  it("autorise la liste des abonnements à tout membre", async () => {
    mockFindOne.mockResolvedValue({ role: "viewer" });
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "list-subscription",
    });
    expect(ok).toBe(true);
  });

  it("refuse le portail de facturation à un non-membre", async () => {
    mockFindOne.mockResolvedValue(null);
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "billing-portal",
    });
    expect(ok).toBe(false);
    expect(mockGetModuleActions).not.toHaveBeenCalled();
  });

  it("refuse le portail de facturation sans le droit « Gérer » la facturation", async () => {
    mockFindOne.mockResolvedValue({ role: "accountant" });
    mockGetModuleActions.mockResolvedValue({
      role: "accountant",
      actions: ["view"],
    });
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "billing-portal",
    });
    expect(ok).toBe(false);
  });

  it("autorise le portail de facturation avec le droit « Gérer »", async () => {
    mockFindOne.mockResolvedValue({ role: "owner" });
    mockGetModuleActions.mockResolvedValue({
      role: "owner",
      actions: ["view", "manage"],
    });
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "billing-portal",
    });
    expect(ok).toBe(true);
  });

  it("refuse une action inconnue, même à un owner", async () => {
    mockFindOne.mockResolvedValue({ role: "owner" });
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "action-future",
    });
    expect(ok).toBe(false);
  });

  it("refuse un referenceId objet (opérateur Mongo)", async () => {
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: { $ne: null },
      action: "list-subscription",
    });
    expect(ok).toBe(false);
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it("renvoie false si la requête DB échoue (sécurité par défaut)", async () => {
    mockFindOne.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ok = await authorizeSubscriptionReference({
      user: { id: userId },
      referenceId: orgId,
      action: "cancel-subscription",
    });
    expect(ok).toBe(false);
    console.error.mockRestore();
  });
});
