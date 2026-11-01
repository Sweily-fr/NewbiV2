import { describe, it, expect, vi, beforeEach } from "vitest";

// /api/auth/subscription/list : tout membre lit l'abonnement de son espace,
// mais les identifiants Stripe sont réservés à « Voir l'abonnement ».

vi.mock("better-auth/api", () => ({
  createAuthMiddleware: (fn) => fn,
  getSessionFromCtx: vi.fn(async () => null),
  APIError: class extends Error {},
}));
vi.mock("@/src/lib/auth-utils", () => ({ sendReactivationEmail: vi.fn() }));
vi.mock("@/src/lib/mongodb", () => ({ getMongoDb: vi.fn(async () => ({})) }));

const { getModuleActionsMock } = vi.hoisted(() => ({
  getModuleActionsMock: vi.fn(),
}));
vi.mock("@/src/lib/organization-roles", () => ({
  getModuleActions: getModuleActionsMock,
}));

import { afterHook } from "@/src/lib/auth-hooks";

const ORG = "64b000000000000000000001";
const abonnement = {
  id: "s1",
  plan: "pme",
  status: "active",
  referenceId: ORG,
  stripeCustomerId: "cus_123",
  stripeSubscriptionId: "sub_123",
};

function ctx() {
  return {
    path: "/subscription/list",
    query: { referenceId: ORG },
    context: {
      returned: [abonnement],
      session: { user: { id: "u1" }, session: { activeOrganizationId: ORG } },
    },
    json: vi.fn((body) => body),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("afterHook : /subscription/list", () => {
  it("sans « Voir l'abonnement » (Membre, Éditeur) : identifiants Stripe retirés", async () => {
    getModuleActionsMock.mockResolvedValue({ role: "viewer", actions: [] });
    const c = ctx();
    const body = await afterHook(c);
    expect(body).toEqual([
      { id: "s1", plan: "pme", status: "active", referenceId: ORG },
    ]);
  });

  it("avec « Voir l'abonnement » : réponse inchangée", async () => {
    getModuleActionsMock.mockResolvedValue({
      role: "accountant",
      actions: ["view"],
    });
    const c = ctx();
    expect(await afterHook(c)).toBeUndefined();
    expect(c.json).not.toHaveBeenCalled();
  });

  it("droits illisibles : réponse restreinte", async () => {
    getModuleActionsMock.mockRejectedValue(new Error("DB down"));
    const body = await afterHook(ctx());
    expect(body[0]).not.toHaveProperty("stripeCustomerId");
  });
});
