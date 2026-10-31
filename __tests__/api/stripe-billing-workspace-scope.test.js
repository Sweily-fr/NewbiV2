// @vitest-environment node
//
// Factures et portail Stripe d'un espace : limités à cet espace.
//
// Un client Stripe est celui d'un utilisateur et peut payer plusieurs
// espaces. Les factures renvoyées pour un espace sont celles de ses propres
// abonnements, et le portail Stripe (qui couvre tout le client) ne s'ouvre
// qu'au payeur quand ce client règle aussi d'autres espaces.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { createMemoryMongo } from "../helpers/memory-mongo";

process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_dummy";
process.env.RESEND_API_KEY ||= "re_dummy";

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  invoicesList: vi.fn(),
  portalCreate: vi.fn(),
  subscriptionsList: vi.fn(),
  db: null,
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: (name) => m.db.collection(name) },
  getMongoDb: async () => ({ collection: (name) => m.db.collection(name) }),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("stripe", () => {
  function Stripe() {
    return {
      invoices: { list: (...args) => m.invoicesList(...args) },
      billingPortal: {
        sessions: { create: (...args) => m.portalCreate(...args) },
      },
      subscriptions: { list: (...args) => m.subscriptionsList(...args) },
    };
  }
  return { default: Stripe };
});

const payer = new ObjectId(); // dirigeant, paie A et B
const accountant = new ObjectId(); // cabinet entré en Comptable dans A
const manager = new ObjectId(); // rôle personnalisé « Gérer l'abonnement » sur A
const orgA = new ObjectId();
const orgB = new ObjectId();
const ROLE_FINANCE = "role_finance";

const insertAll = async (name, docs) => {
  for (const doc of docs) await m.db.collection(name).insertOne(doc);
};

async function seed({ payerPaysB = true } = {}) {
  m.db = createMemoryMongo();
  await insertAll("user", [
    { _id: payer, email: "dirigeant@a.fr", stripeCustomerId: "cus_payer" },
    { _id: accountant, email: "cabinet@compta.fr", stripeCustomerId: "" },
    { _id: manager, email: "finance@a.fr", stripeCustomerId: "" },
  ]);
  await insertAll("member", [
    { organizationId: orgA, userId: payer, role: "owner" },
    { organizationId: orgA, userId: accountant, role: "accountant" },
    { organizationId: orgA, userId: manager, role: ROLE_FINANCE },
    { organizationId: orgB, userId: payer, role: "owner" },
  ]);
  await m.db.collection("organizationRole").insertOne({
    organizationId: orgA,
    role: ROLE_FINANCE,
    actions: { billing: ["view", "manage"] },
  });
  await m.db.collection("subscription").insertOne({
    referenceId: String(orgA),
    stripeCustomerId: "cus_payer",
    stripeSubscriptionId: "sub_A",
    status: "active",
    updatedAt: new Date(),
  });
  // Ancien abonnement de A, archivé lors d'un changement de payeur
  await m.db.collection("subscription").insertOne({
    referenceId: `replaced:${orgA}:sub_A_ancien`,
    replacedOrganizationId: String(orgA),
    stripeCustomerId: "cus_payer",
    stripeSubscriptionId: "sub_A_ancien",
    status: "canceled",
    updatedAt: new Date(0),
  });
  if (payerPaysB) {
    await m.db.collection("subscription").insertOne({
      referenceId: String(orgB),
      stripeCustomerId: "cus_payer",
      stripeSubscriptionId: "sub_B",
      status: "active",
      updatedAt: new Date(),
    });
  }
}

const signInAs = (userId, extra = {}) =>
  m.getSession.mockResolvedValue({
    user: { id: String(userId), email: "x@x.fr", ...extra },
    session: { activeOrganizationId: String(orgA) },
  });

const invoice = (id, subscription) => ({
  id,
  number: id,
  status: "paid",
  created: 1_700_000_000,
  subscription,
  lines: { data: [] },
});

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  m.invoicesList.mockReset();
  m.portalCreate.mockReset();
  m.portalCreate.mockResolvedValue({ url: "https://billing.stripe.com/p/x" });
  m.subscriptionsList.mockReset();
  m.subscriptionsList.mockResolvedValue({ data: [] });
});

const getInvoices = async () => {
  const { GET } = await import("@/app/api/stripe/invoices/route");
  return GET(
    new Request(
      `http://localhost/api/stripe/invoices?organizationId=${String(orgA)}`,
    ),
  );
};

const openPortal = async () => {
  const { POST } = await import("@/app/api/stripe/billing-portal/route");
  return POST(
    new Request("http://localhost/api/stripe/billing-portal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId: String(orgA) }),
    }),
  );
};

describe("GET /api/stripe/invoices", () => {
  it("ne renvoie que les factures des abonnements de l'espace", async () => {
    await seed();
    signInAs(accountant);
    m.invoicesList.mockResolvedValue({
      data: [
        invoice("in_A", "sub_A"),
        invoice("in_A_ancien", {
          id: "sub_A_ancien",
          metadata: { organizationId: String(orgA) },
        }),
        invoice("in_B", "sub_B"),
        invoice("in_B_developpe", {
          id: "sub_B",
          metadata: {
            orgName: "Espace B",
            organizationId: String(orgB),
            referenceId: String(orgB),
          },
        }),
        invoice("in_sans_abonnement", null),
      ],
    });
    const res = await getInvoices();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invoices.map((i) => i.id).sort()).toEqual([
      "in_A",
      "in_A_ancien",
    ]);
    // Identifiant de l'abonnement seulement, jamais ses métadonnées
    for (const item of body.invoices) {
      expect(typeof item.subscription_id).toBe("string");
    }
    expect(JSON.stringify(body)).not.toContain("Espace B");
  });

  it("garde une facture dont l'abonnement, absent des documents, est celui de l'espace", async () => {
    await seed();
    signInAs(accountant);
    m.invoicesList.mockResolvedValue({
      data: [
        invoice("in_orphelin", {
          id: "sub_orphelin",
          metadata: { referenceId: String(orgA) },
        }),
        invoice("in_nouvel_espace", {
          id: "sub_nouvel_espace",
          metadata: {
            organizationId: String(orgA),
            isNewOrganization: "true",
          },
        }),
      ],
    });
    const body = await (await getInvoices()).json();
    expect(body.invoices.map((i) => i.id)).toEqual(["in_orphelin"]);
  });

  it("client qui ne paie que cet espace : factures sans abonnement gardées", async () => {
    await seed({ payerPaysB: false });
    signInAs(accountant);
    m.invoicesList.mockResolvedValue({
      data: [invoice("in_A", "sub_A"), invoice("in_manuelle", null)],
    });
    const body = await (await getInvoices()).json();
    expect(body.invoices.map((i) => i.id).sort()).toEqual([
      "in_A",
      "in_manuelle",
    ]);
  });
});

describe("POST /api/stripe/billing-portal", () => {
  it("client qui règle d'autres espaces : refusé à un membre qui n'est pas le payeur", async () => {
    await seed();
    signInAs(manager);
    const res = await openPortal();
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/autres espaces/);
    expect(m.portalCreate).not.toHaveBeenCalled();
  });

  it("ouvert au payeur", async () => {
    await seed();
    signInAs(payer, { stripeCustomerId: "cus_payer" });
    const res = await openPortal();
    expect(res.status).toBe(200);
    expect(m.portalCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_payer" }),
    );
  });

  it("payeur reconnu d'après son compte quand la session ne porte pas le client", async () => {
    await seed();
    signInAs(payer);
    expect((await openPortal()).status).toBe(200);
  });

  it("client qui ne paie que cet espace : ouvert au membre qui gère l'abonnement", async () => {
    await seed({ payerPaysB: false });
    signInAs(manager);
    expect((await openPortal()).status).toBe(200);
  });

  it("abonnement d'un autre espace connu de Stripe seulement : refusé au non-payeur", async () => {
    await seed({ payerPaysB: false });
    m.subscriptionsList.mockResolvedValue({
      data: [
        {
          id: "sub_B_orphelin",
          status: "active",
          metadata: { referenceId: String(orgB) },
        },
      ],
    });
    signInAs(manager);
    expect((await openPortal()).status).toBe(403);
    expect(m.portalCreate).not.toHaveBeenCalled();
  });
});

describe("portail Better Auth (/subscription/billing-portal)", () => {
  it("même règle que la route du site", async () => {
    const { authorizeSubscriptionReference } =
      await import("@/src/lib/auth-plugins");
    await seed();
    const check = (userId, extra = {}) =>
      authorizeSubscriptionReference({
        user: { id: String(userId), ...extra },
        referenceId: String(orgA),
        action: "billing-portal",
      });
    expect(await check(manager)).toBe(false);
    expect(await check(payer, { stripeCustomerId: "cus_payer" })).toBe(true);

    await seed({ payerPaysB: false });
    expect(await check(manager)).toBe(true);
  });
});
