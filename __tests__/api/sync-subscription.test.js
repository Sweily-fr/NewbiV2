// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const findOne = vi.fn();
const updateOne = vi.fn();
const insertOne = vi.fn();
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: () => ({ findOne, updateOne, insertOne }) },
}));

let sessionUser = { id: "u1" };
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
  const { POST } = await import(
    "@/app/api/organizations/[organizationId]/sync-subscription/route"
  );
  return POST(new Request("http://localhost/x", { method: "POST" }), {
    params: Promise.resolve({ organizationId: "org-1" }),
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
    sessionUser = { id: "u1" };
    insertOne.mockResolvedValue({});
    updateOne.mockResolvedValue({});
  });

  it("réactive le document existant depuis Stripe (active) + nettoie __devBackup", async () => {
    findOne.mockResolvedValue({ stripeCustomerId: "cus_1", __devBackup: { status: "active" } });
    stripeList.mockResolvedValue({
      data: [sub({ id: "sub_new", status: "active", metadata: { planName: "pro" } })],
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
    expect(updateOne.mock.calls[0][1].$set.stripeSubscriptionId).toBe("sub_active");
  });

  it("pas de customer Stripe → synced:false", async () => {
    findOne.mockResolvedValue(null); // pas de doc
    sessionUser = { id: "u1" }; // pas de stripeCustomerId
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

  it("utilise le stripeCustomerId de l'utilisateur si pas de doc abonnement", async () => {
    findOne.mockResolvedValue(null);
    sessionUser = { id: "u1", stripeCustomerId: "cus_user" };
    stripeList.mockResolvedValue({ data: [sub({ id: "sub_new", status: "active" })] });

    await call();
    expect(stripeList).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_user" }),
    );
    // Pas de doc existant → insertion.
    expect(insertOne).toHaveBeenCalled();
  });
});
