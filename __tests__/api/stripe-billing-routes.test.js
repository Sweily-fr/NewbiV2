// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Routes de facturation Stripe : le client Stripe ou l'abonnement désigné
 * par la requête doit appartenir à l'espace, avec le droit « Voir » (lecture)
 * ou « Gérer » (portail) sur l'abonnement.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  memberFindOne: vi.fn(),
  storedRoles: vi.fn(async () => []),
  subscriptionDocs: vi.fn(async () => []),
  subscriptionFind: vi.fn(),
  subscriptionFindOne: vi.fn(),
  subscriptionUpdateOne: vi.fn(),
  portalCreate: vi.fn(),
  customersRetrieve: vi.fn(),
  listTaxIds: vi.fn(),
  invoicesList: vi.fn(),
  subscriptionsRetrieve: vi.fn(),
  // Clients Stripe des cabinets (comptes gestionnaires)
  managerDocs: vi.fn(async () => []),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") return { findOne: m.memberFindOne };
      if (name === "accountmanagers") {
        return { find: () => ({ toArray: m.managerDocs }) };
      }
      if (name === "organizationRole") {
        return { find: () => ({ toArray: m.storedRoles }) };
      }
      if (name === "subscription") {
        return {
          find: (...args) => {
            m.subscriptionFind(...args);
            return { toArray: m.subscriptionDocs };
          },
          findOne: m.subscriptionFindOne,
          updateOne: m.subscriptionUpdateOne,
        };
      }
      throw new Error(`Collection inattendue : ${name}`);
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("stripe", () => {
  function Stripe() {
    return {
      billingPortal: { sessions: { create: m.portalCreate } },
      customers: { retrieve: m.customersRetrieve, listTaxIds: m.listTaxIds },
      invoices: { list: m.invoicesList },
      subscriptions: { retrieve: m.subscriptionsRetrieve },
    };
  }
  return { default: Stripe };
});

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439022";

function signIn({ activeOrganizationId = orgId } = {}) {
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "u@x.fr" },
    session: { activeOrganizationId },
  });
}

function asRole(role) {
  m.memberFindOne.mockResolvedValue({
    userId: new ObjectId(userId),
    organizationId: new ObjectId(orgId),
    role,
  });
}

function orgCustomers(...ids) {
  m.subscriptionDocs.mockResolvedValue(
    ids.map((stripeCustomerId) => ({ stripeCustomerId })),
  );
}

const jsonRequest = (body, url = "http://localhost/api/x") =>
  new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  m.storedRoles.mockResolvedValue([]);
  m.managerDocs.mockResolvedValue([]);
  m.subscriptionDocs.mockResolvedValue([]);
  m.portalCreate.mockResolvedValue({ url: "https://billing.stripe.com/p/x" });
  m.customersRetrieve.mockResolvedValue({
    id: "cus_org",
    email: "facturation@org.fr",
    name: "Org",
  });
  m.listTaxIds.mockResolvedValue({ data: [] });
  m.invoicesList.mockResolvedValue({ data: [] });
});

describe("POST /api/stripe/billing-portal", () => {
  const call = async (body) => {
    const { POST } = await import("@/app/api/stripe/billing-portal/route");
    return POST(jsonRequest(body));
  };

  it("refuse sans session", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await call({ customerId: "cus_org" });
    expect(res.status).toBe(401);
    expect(m.portalCreate).not.toHaveBeenCalled();
  });

  it("refuse le client Stripe d'un autre espace", async () => {
    signIn();
    asRole("owner");
    orgCustomers("cus_org");
    const res = await call({ customerId: "cus_autre_espace" });
    expect(res.status).toBe(403);
    expect(m.portalCreate).not.toHaveBeenCalled();
  });

  it("refuse un administrateur (abonnement en lecture seule)", async () => {
    signIn();
    asRole("admin");
    orgCustomers("cus_org");
    const res = await call({ customerId: "cus_org" });
    expect(res.status).toBe(403);
    expect(m.portalCreate).not.toHaveBeenCalled();
  });

  it("refuse un non-membre de l'espace", async () => {
    signIn();
    m.memberFindOne.mockResolvedValue(null);
    orgCustomers("cus_org");
    const res = await call({ customerId: "cus_org" });
    expect(res.status).toBe(403);
    expect(m.portalCreate).not.toHaveBeenCalled();
  });

  it("ouvre le portail du client de l'espace pour le super admin", async () => {
    signIn();
    asRole("owner");
    orgCustomers("cus_org");
    const res = await call({ customerId: "cus_org" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://billing.stripe.com/p/x" });
    expect(m.portalCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_org" }),
    );
  });

  it("sans body, prend le client de l'abonnement de l'espace actif", async () => {
    signIn();
    asRole("owner");
    orgCustomers("cus_recent", "cus_ancien");
    const res = await call(undefined);
    expect(res.status).toBe(200);
    expect(m.portalCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_recent" }),
    );
    // Recherche limitée aux abonnements de l'espace actif
    const [query] = m.subscriptionFind.mock.calls[0];
    expect(query.$or).toEqual(expect.arrayContaining([{ referenceId: orgId }]));
  });

  it("n'ouvre jamais le portail du cabinet qui paie l'abonnement de l'espace", async () => {
    signIn();
    asRole("owner");
    orgCustomers("cus_cabinet");
    m.managerDocs.mockResolvedValue([{ stripeCustomerId: "cus_cabinet" }]);
    expect((await call({ customerId: "cus_cabinet" })).status).toBe(403);
    expect((await call({})).status).toBe(400);
    expect(m.portalCreate).not.toHaveBeenCalled();
  });

  it("répond 400 si l'espace n'a pas de client Stripe", async () => {
    signIn();
    asRole("owner");
    orgCustomers();
    const res = await call({});
    expect(res.status).toBe(400);
    expect(m.portalCreate).not.toHaveBeenCalled();
  });

  it("accepte un rôle personnalisé autorisé à gérer l'abonnement", async () => {
    signIn();
    asRole("role_finance");
    m.storedRoles.mockResolvedValueOnce([
      { role: "role_finance", actions: { billing: ["view", "manage"] } },
    ]);
    orgCustomers("cus_org");
    const res = await call({ customerId: "cus_org" });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/stripe/customer", () => {
  const call = async (query) => {
    const { GET } = await import("@/app/api/stripe/customer/route");
    return GET(new Request(`http://localhost/api/stripe/customer?${query}`));
  };

  it("refuse le client Stripe d'un autre espace", async () => {
    signIn();
    asRole("owner");
    orgCustomers("cus_org");
    const res = await call("customerId=cus_autre_espace");
    expect(res.status).toBe(403);
    expect(m.customersRetrieve).not.toHaveBeenCalled();
  });

  it("refuse un rôle sans accès à l'abonnement (Éditeur)", async () => {
    signIn();
    asRole("member");
    orgCustomers("cus_org");
    const res = await call("customerId=cus_org");
    expect(res.status).toBe(403);
    expect(m.customersRetrieve).not.toHaveBeenCalled();
  });

  it("renvoie le client de l'espace à un comptable (droit Voir)", async () => {
    signIn();
    asRole("accountant");
    orgCustomers("cus_org");
    const res = await call("customerId=cus_org");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.customer.id).toBe("cus_org");
    expect(m.customersRetrieve).toHaveBeenCalledWith("cus_org");
  });

  it("espace sans client Stripe : pas de coordonnées, pas d'erreur", async () => {
    signIn();
    asRole("owner");
    orgCustomers();
    const res = await call("");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, customer: null });
  });
});

describe("GET /api/stripe/invoices", () => {
  const call = async (query) => {
    const { GET } = await import("@/app/api/stripe/invoices/route");
    return GET(new Request(`http://localhost/api/stripe/invoices?${query}`));
  };

  it("refuse le client Stripe d'un autre espace", async () => {
    signIn();
    asRole("owner");
    orgCustomers("cus_org");
    const res = await call("customerId=cus_autre_espace");
    expect(res.status).toBe(403);
    expect(m.invoicesList).not.toHaveBeenCalled();
  });

  it("refuse un membre sans droit sur l'abonnement", async () => {
    signIn();
    asRole("viewer");
    orgCustomers("cus_org");
    const res = await call("customerId=cus_org");
    expect(res.status).toBe(403);
    expect(m.invoicesList).not.toHaveBeenCalled();
  });

  it("liste les factures du client de l'espace", async () => {
    signIn();
    asRole("admin");
    orgCustomers("cus_org");
    const res = await call("customerId=cus_org");
    expect(res.status).toBe(200);
    expect(m.invoicesList).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_org" }),
    );
  });
});

describe("POST /api/sync-subscription-status", () => {
  const call = async (body) => {
    const { POST } = await import("@/app/api/sync-subscription-status/route");
    return POST(jsonRequest(body));
  };

  const stripeSub = {
    status: "active",
    cancel_at_period_end: true,
    current_period_end: 2000,
    current_period_start: 1000,
  };

  it("refuse sans session", async () => {
    m.getSession.mockResolvedValue(null);
    const res = await call({ stripeSubscriptionId: "sub_1" });
    expect(res.status).toBe(401);
  });

  it("refuse l'abonnement d'un autre espace sans appeler Stripe", async () => {
    signIn();
    asRole("owner");
    m.subscriptionFindOne.mockResolvedValue(null);
    const res = await call({
      stripeSubscriptionId: "sub_autre_espace",
      organizationId: orgId,
    });
    expect(res.status).toBe(404);
    expect(m.subscriptionsRetrieve).not.toHaveBeenCalled();
    expect(m.subscriptionUpdateOne).not.toHaveBeenCalled();
    const [query] = m.subscriptionFindOne.mock.calls[0];
    expect(query.stripeSubscriptionId).toBe("sub_autre_espace");
    expect(query.$or).toEqual(expect.arrayContaining([{ referenceId: orgId }]));
  });

  it("refuse un membre sans droit sur l'abonnement", async () => {
    signIn();
    asRole("member");
    m.subscriptionFindOne.mockResolvedValue({ _id: "doc1" });
    const res = await call({ stripeSubscriptionId: "sub_1" });
    expect(res.status).toBe(403);
    expect(m.subscriptionsRetrieve).not.toHaveBeenCalled();
  });

  it("synchronise l'abonnement de l'espace", async () => {
    signIn();
    asRole("owner");
    m.subscriptionFindOne.mockResolvedValue({ _id: "doc1" });
    m.subscriptionsRetrieve.mockResolvedValue(stripeSub);
    m.subscriptionUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    const res = await call({
      stripeSubscriptionId: "sub_1",
      organizationId: orgId,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.cancelAtPeriodEnd).toBe(true);
    const [filter, update] = m.subscriptionUpdateOne.mock.calls[0];
    expect(filter).toEqual({ _id: "doc1" });
    expect(update.$set.status).toBe("active");
  });
});
