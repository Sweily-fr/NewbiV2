// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

// Arrivée d'un cabinet (compte gestionnaire) sur le tableau de bord :
// app/dashboard/layout.jsx

const mocks = vi.hoisted(() => ({
  headers: new Headers(),
  session: null,
  db: {},
}));

vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/navigation", () => ({
  redirect: (url) => {
    const error = new Error("NEXT_REDIRECT");
    error.url = url;
    throw error;
  },
}));
vi.mock("react-dom", () => ({ preconnect: () => {} }));
vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: async () => mocks.session } },
}));
vi.mock("@/src/lib/feature-flags", () => ({ isAppTrialEnabled: () => true }));
vi.mock("@/app/dashboard/dashboard-client-layout", () => ({
  default: () => null,
}));

// Base Mongo minimale : égalité de champs, $or, $in et $gte
function matches(doc, filter) {
  return Object.entries(filter).every(([key, cond]) => {
    if (key === "$or") return cond.some((f) => matches(doc, f));
    const value = doc[key];
    if (cond && typeof cond === "object" && !(cond instanceof ObjectId)) {
      if ("$in" in cond)
        return cond.$in.some((c) => String(c) === String(value));
      if ("$gte" in cond) return value >= cond.$gte;
    }
    return String(value) === String(cond);
  });
}
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      const rows = () => (mocks.db[name] ||= []);
      return {
        findOne: async (filter) =>
          rows().find((d) => matches(d, filter)) || null,
        find: (filter) => ({
          toArray: async () => rows().filter((d) => matches(d, filter)),
        }),
        updateMany: async (filter, update) => {
          const hit = rows().filter((d) => matches(d, filter));
          hit.forEach((d) => Object.assign(d, update.$set));
          return { modifiedCount: hit.length };
        },
      };
    },
  },
}));

// Même lecture que src/lib/managed-clients (qui charge Resend et Better Auth)
vi.mock("@/src/lib/managed-clients", () => ({
  findAccountManagerByUserId: async (_db, uid) =>
    (mocks.db.accountmanagers || []).find(
      (m) => String(m.userId) === String(uid),
    ) || null,
}));

const { default: DashboardLayout } = await import("@/app/dashboard/layout");

// Un utilisateur par cas : le layout garde l'accès « full » 60 s en cache
let userId;
const ownOrg = new ObjectId();
const clientOrg = new ObjectId();
const managerId = new ObjectId();
const past = new Date(Date.now() - 86400000);
const future = new Date(Date.now() + 86400000 * 365);

function setup({
  manager = true,
  active = ownOrg,
  ownSubscribed = false,
  pathname = "/dashboard",
  search = "",
}) {
  userId = new ObjectId();
  mocks.headers = new Headers({ "x-pathname": pathname, "x-search": search });
  mocks.session = {
    user: { id: String(userId), email: "cabinet@example.com" },
    session: { activeOrganizationId: String(active) },
  };
  mocks.db = {
    member: [
      { userId, organizationId: ownOrg, role: "owner" },
      { userId, organizationId: clientOrg, role: "accountant" },
    ],
    organization: [
      // Essai du cabinet fini, sans abonnement : lecture seule
      { _id: ownOrg, isTrialActive: true, trialEndDate: past },
      { _id: clientOrg },
    ],
    subscription: [
      // Le client, lui, est abonné
      { referenceId: String(clientOrg), status: "active", periodEnd: future },
      ...(ownSubscribed
        ? [{ referenceId: String(ownOrg), status: "active", periodEnd: future }]
        : []),
    ],
    accountmanagers: manager ? [{ _id: managerId, userId }] : [],
    managedclients: [
      { managerId, organizationId: clientOrg, status: "active" },
    ],
    session: [{ userId, activeOrganizationId: String(active) }],
  };
}

async function land() {
  try {
    await DashboardLayout({ children: null });
    return { rendered: true };
  } catch (error) {
    if (error.message === "NEXT_REDIRECT") return { redirect: error.url };
    throw error;
  }
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("DashboardLayout : arrivée d'un cabinet", () => {
  it("son espace sans abonnement : renvoyé vers l'espace gestionnaire, sans bascule chez un client", async () => {
    setup({});
    expect(await land()).toEqual({
      redirect: "/dashboard/gestionnaire?espace=sans-abonnement",
    });
    // Pas de bascule automatique vers l'espace (abonné) du client
    expect(mocks.db.session[0].activeOrganizationId).toBe(String(ownOrg));
  });

  it("déjà dans l'espace gestionnaire : pas de boucle", async () => {
    setup({ pathname: "/dashboard/gestionnaire" });
    expect(await land()).toEqual({ rendered: true });
    setup({ pathname: "/dashboard/gestionnaire/factures" });
    expect(await land()).toEqual({ rendered: true });
  });

  it("dans le dossier d'un client qu'il suit : il y reste", async () => {
    setup({ active: clientOrg });
    expect(await land()).toEqual({ rendered: true });
    // Client à l'essai fini : toujours chez le client, en lecture seule
    setup({ active: clientOrg });
    mocks.db.subscription = [];
    mocks.db.organization[1] = {
      _id: clientOrg,
      isTrialActive: true,
      trialEndDate: past,
    };
    expect(await land()).toEqual({ rendered: true });
  });

  it("son espace abonné : il y reste", async () => {
    setup({ ownSubscribed: true });
    expect(await land()).toEqual({ rendered: true });
  });

  it("retour de paiement Stripe de son espace : pas renvoyé", async () => {
    setup({ search: "?subscription_success=true" });
    expect(await land()).toEqual({ rendered: true });
  });

  it("préchargement sans page connue : rien", async () => {
    setup({});
    mocks.headers = new Headers();
    expect(await land()).toEqual({ rendered: true });
  });

  it("utilisateur ordinaire : bascule automatique vers son espace abonné, comme avant", async () => {
    setup({ manager: false });
    expect(await land()).toEqual({ rendered: true });
    expect(mocks.db.session[0].activeOrganizationId).toBe(String(clientOrg));
  });
});
