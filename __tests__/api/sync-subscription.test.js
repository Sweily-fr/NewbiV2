// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const findOne = vi.fn();
const updateOne = vi.fn();
const insertOne = vi.fn();
// Abonnement déjà rattaché à un autre espace (recherche par stripeSubscriptionId)
const findByStripeId = vi.fn(async () => null);
const memberFindOne = vi.fn(async () => null);
const storedRoles = vi.fn(async () => []);
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") return { findOne: memberFindOne };
      if (name === "organizationRole") {
        return { find: () => ({ toArray: storedRoles }) };
      }
      return {
        findOne: (q, ...rest) =>
          q?.stripeSubscriptionId
            ? findByStripeId(q, ...rest)
            : findOne(q, ...rest),
        updateOne,
        insertOne,
      };
    },
  },
}));

const USER_ID = "507f1f77bcf86cd799439011";
const ORG_ID = "507f1f77bcf86cd799439022";
let sessionUser = { id: USER_ID };
vi.mock("@/src/lib/security", () => ({
  requireSession: vi.fn(async () => ({ user: sessionUser })),
  requireOrgMembership: vi.fn(async () => true),
  toObjectId: (id) => `oid(${id})`,
  withErrorHandler: (h) => h,
}));

const stripeList = vi.fn();
vi.mock("stripe", () => {
  function Stripe() {
    return { subscriptions: { list: stripeList } };
  }
  return { default: Stripe };
});

// Import paresseux : la route construit `new Stripe()` au chargement du module
// → on l'importe APRÈS l'init des mocks (sinon TDZ sur les vars du factory).
const call = async () => {
  const { POST } =
    await import("@/app/api/organizations/[organizationId]/sync-subscription/route");
  return POST(new Request("http://localhost/x", { method: "POST" }), {
    params: Promise.resolve({ organizationId: ORG_ID }),
  });
};

const sub = (over = {}) => ({
  id: "sub_x",
  status: "active",
  current_period_start: 1000,
  current_period_end: 2000,
  cancel_at_period_end: false,
  created: 100,
  metadata: {},
  ...over,
});

describe("POST /api/organizations/[id]/sync-subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionUser = { id: USER_ID };
    memberFindOne.mockResolvedValue(null);
    storedRoles.mockResolvedValue([]);
    findByStripeId.mockResolvedValue(null);
    insertOne.mockResolvedValue({});
    updateOne.mockResolvedValue({});
  });

  it("réactive le document existant depuis Stripe (active) + nettoie __devBackup", async () => {
    findOne.mockResolvedValue({
      stripeCustomerId: "cus_1",
      __devBackup: { status: "active" },
    });
    stripeList.mockResolvedValue({
      data: [
        sub({ id: "sub_new", status: "active", metadata: { planName: "pro" } }),
      ],
    });

    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ synced: true, status: "active" });

    const [, update] = updateOne.mock.calls[0];
    expect(update.$set.status).toBe("active");
    expect(update.$set.stripeSubscriptionId).toBe("sub_new");
    expect(update.$set.plan).toBe("pro");
    expect(update.$unset).toEqual({ __devBackup: "" });
  });

  it("choisit l'abonnement actif plutôt qu'un canceled plus récent", async () => {
    findOne.mockResolvedValue({ stripeCustomerId: "cus_1" });
    stripeList.mockResolvedValue({
      data: [
        sub({ id: "sub_canceled", status: "canceled", created: 200 }),
        sub({ id: "sub_active", status: "active", created: 100 }),
      ],
    });

    await call();
    expect(updateOne.mock.calls[0][1].$set.stripeSubscriptionId).toBe(
      "sub_active",
    );
  });

  it("pas de customer Stripe → synced:false", async () => {
    findOne.mockResolvedValue(null); // pas de doc
    sessionUser = { id: USER_ID }; // pas de stripeCustomerId
    const res = await call();
    expect(await res.json()).toEqual({ synced: false, reason: "no_customer" });
    expect(updateOne).not.toHaveBeenCalled();
    expect(insertOne).not.toHaveBeenCalled();
  });

  it("aucun abonnement Stripe → synced:false", async () => {
    findOne.mockResolvedValue({ stripeCustomerId: "cus_1" });
    stripeList.mockResolvedValue({ data: [] });
    const res = await call();
    expect(await res.json()).toEqual({
      synced: false,
      reason: "no_stripe_subscription",
    });
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("utilise le stripeCustomerId de l'utilisateur si pas de doc abonnement (droit Gérer)", async () => {
    findOne.mockResolvedValue(null);
    sessionUser = { id: USER_ID, stripeCustomerId: "cus_user" };
    memberFindOne.mockResolvedValue({ role: "owner" });
    stripeList.mockResolvedValue({
      data: [
        sub({
          id: "sub_new",
          status: "active",
          metadata: { referenceId: ORG_ID },
        }),
      ],
    });

    await call();
    expect(stripeList).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_user" }),
    );
    // Pas de doc existant → insertion.
    expect(insertOne).toHaveBeenCalled();
  });
});

describe("POST /api/organizations/[id]/sync-subscription : pas de contournement de facturation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionUser = { id: USER_ID, stripeCustomerId: "cus_user" };
    memberFindOne.mockResolvedValue(null);
    storedRoles.mockResolvedValue([]);
    findByStripeId.mockResolvedValue(null);
    insertOne.mockResolvedValue({});
    updateOne.mockResolvedValue({});
  });

  it("un simple membre ne recopie pas l'abonnement payé par son client Stripe", async () => {
    findOne.mockResolvedValue(null); // espace sans abonnement
    memberFindOne.mockResolvedValue({ role: "viewer" });
    stripeList.mockResolvedValue({
      data: [sub({ id: "sub_espace_A", metadata: { referenceId: ORG_ID } })],
    });

    const res = await call();
    expect(await res.json()).toEqual({ synced: false, reason: "no_customer" });
    expect(stripeList).not.toHaveBeenCalled();
    expect(insertOne).not.toHaveBeenCalled();
  });

  it("ne recopie pas l'abonnement d'un autre espace (métadonnées)", async () => {
    findOne.mockResolvedValue(null);
    memberFindOne.mockResolvedValue({ role: "owner" });
    stripeList.mockResolvedValue({
      data: [
        sub({
          id: "sub_A",
          metadata: { referenceId: "507f1f77bcf86cd7994390aa" },
        }),
        sub({
          id: "sub_A2",
          metadata: { organizationId: "507f1f77bcf86cd7994390aa" },
        }),
      ],
    });

    const res = await call();
    expect(await res.json()).toEqual({
      synced: false,
      reason: "no_stripe_subscription",
    });
    expect(insertOne).not.toHaveBeenCalled();
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("ignore un ancien abonnement sans métadonnées quand le client est celui de l'utilisateur", async () => {
    findOne.mockResolvedValue(null);
    memberFindOne.mockResolvedValue({ role: "owner" });
    stripeList.mockResolvedValue({ data: [sub({ id: "sub_legacy" })] });

    const res = await call();
    expect((await res.json()).synced).toBe(false);
    expect(insertOne).not.toHaveBeenCalled();
  });

  it("ignore l'abonnement d'un nouvel espace non rattaché à celui-ci", async () => {
    findOne.mockResolvedValue({ stripeCustomerId: "cus_org" });
    stripeList.mockResolvedValue({
      data: [
        sub({
          id: "sub_nouvel_espace",
          metadata: { isNewOrganization: "true", organizationId: ORG_ID },
        }),
      ],
    });

    const res = await call();
    expect((await res.json()).synced).toBe(false);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("ne déplace jamais un abonnement déjà rattaché à un autre espace", async () => {
    findOne.mockResolvedValue({ stripeCustomerId: "cus_org" });
    findByStripeId.mockResolvedValue({
      referenceId: "507f1f77bcf86cd7994390aa",
    });
    stripeList.mockResolvedValue({ data: [sub({ id: "sub_autre" })] });

    const res = await call();
    expect(await res.json()).toEqual({
      synced: false,
      reason: "subscription_of_other_organization",
    });
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("garde l'abonnement d'un espace existant payé via create-org-subscription", async () => {
    findOne.mockResolvedValue(null);
    memberFindOne.mockResolvedValue({ role: "owner" });
    stripeList.mockResolvedValue({
      data: [
        sub({
          id: "sub_ok",
          metadata: { organizationId: ORG_ID, isNewOrganization: "false" },
        }),
      ],
    });

    const res = await call();
    expect(await res.json()).toEqual({ synced: true, status: "active" });
    expect(insertOne.mock.calls[0][0].stripeSubscriptionId).toBe("sub_ok");
  });
});
