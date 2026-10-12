// @vitest-environment node
//
// Espace gestionnaire : factures, devis et bons de commande de tous les
// dossiers clients. Un document n'est listé que pour un client actif du
// gestionnaire, dont il est encore membre, avec « Voir » sur ce type.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

// Droits par espace : { orgId: ["view", ...] }
const rights = vi.hoisted(() => ({ byOrg: {} }));
vi.mock("@/src/lib/organization-roles", () => ({
  getModuleActions: async (_db, { organizationId }) => ({
    role: "accountant",
    actions: rights.byOrg[String(organizationId)] || [],
  }),
}));

const { listManagedDocuments } = await import("@/src/lib/managed-documents");

// Base simulée : égalité, $in, $lt, $or, $and, expressions régulières
function makeDb() {
  const data = {};
  const same = (a, b) => String(a) === String(b);
  const test = (value, cond) => {
    if (cond instanceof RegExp)
      return typeof value === "string" && cond.test(value);
    if (
      cond &&
      typeof cond === "object" &&
      !(cond instanceof ObjectId) &&
      !(cond instanceof Date)
    ) {
      if ("$in" in cond) return cond.$in.some((c) => same(c, value));
      if ("$lt" in cond) return value != null && value < cond.$lt;
    }
    return same(value, cond);
  };
  const get = (doc, path) => path.split(".").reduce((v, k) => v?.[k], doc);
  const matches = (doc, filter = {}) =>
    Object.entries(filter).every(([key, cond]) => {
      if (key === "$or") return cond.some((f) => matches(doc, f));
      if (key === "$and") return cond.every((f) => matches(doc, f));
      return test(get(doc, key), cond);
    });
  const collection = (name) => {
    data[name] ||= [];
    const rows = data[name];
    return {
      async insertOne(doc) {
        rows.push({ _id: doc._id || new ObjectId(), ...doc });
      },
      async countDocuments(filter) {
        return rows.filter((d) => matches(d, filter)).length;
      },
      find(filter) {
        let result = rows.filter((d) => matches(d, filter));
        const cursor = {
          sort: () => cursor,
          skip: (n) => {
            result = result.slice(n);
            return cursor;
          },
          limit: (n) => {
            result = result.slice(0, n);
            return cursor;
          },
          toArray: async () => result,
        };
        return cursor;
      },
    };
  };
  return { collection, data };
}

const userId = new ObjectId();
const managerId = new ObjectId();
const orgA = new ObjectId(); // client actif, membre, droit Voir
const orgB = new ObjectId(); // client actif, membre, droit Voir
const orgEnded = new ObjectId(); // lien terminé
const orgLeft = new ObjectId(); // le gestionnaire n'y est plus membre
const orgNoView = new ObjectId(); // le client a retiré « Voir » factures
const orgOther = new ObjectId(); // client d'un autre gestionnaire
let db;

const list = (params = {}) =>
  listManagedDocuments(db, { managerId, userId, kind: "invoices", ...params });

beforeEach(async () => {
  db = makeDb();
  const ago = (days) => new Date(Date.now() - days * 86400000);
  for (const [org, status] of [
    [orgA, "active"],
    [orgB, "active"],
    [orgEnded, "ended"],
    [orgLeft, "active"],
    [orgNoView, "active"],
  ]) {
    await db
      .collection("managedclients")
      .insertOne({ managerId, organizationId: org, status });
  }
  await db.collection("managedclients").insertOne({
    managerId: new ObjectId(),
    organizationId: orgOther,
    status: "active",
  });
  for (const org of [orgA, orgB, orgEnded, orgNoView, orgOther]) {
    await db
      .collection("member")
      .insertOne({ userId, organizationId: org, role: "accountant" });
  }
  rights.byOrg = {
    [orgA]: ["view"],
    [orgB]: ["view"],
    [orgEnded]: ["view"],
    [orgLeft]: ["view"],
    [orgOther]: ["view"],
    [orgNoView]: [],
  };
  for (const [org, name] of [
    [orgA, "Garage"],
    [orgB, "Boulangerie"],
    [orgEnded, "Ancien"],
    [orgLeft, "Parti"],
    [orgNoView, "Sans droit"],
    [orgOther, "Autre cabinet"],
  ]) {
    await db.collection("organization").insertOne({ _id: org, name });
  }
  const invoice = (org, extra) =>
    db.collection("invoices").insertOne({
      workspaceId: org,
      prefix: "F-202610",
      issueDate: ago(5),
      createdAt: ago(5),
      finalTotalTTC: 100,
      client: { name: "Client" },
      ...extra,
    });
  await invoice(orgA, {
    number: "0001",
    status: "PENDING",
    dueDate: ago(3),
    client: { name: "Transports Durand" },
  });
  await invoice(orgA, {
    number: "0002",
    status: "COMPLETED",
    dueDate: ago(-10),
  });
  await invoice(orgB, { number: "0003", status: "PENDING", dueDate: ago(-20) });
  await invoice(orgB, {
    number: "DRAFT-1",
    status: "DRAFT",
    client: { type: "INDIVIDUAL", firstName: "Lucie", lastName: "Bernard" },
  });
  for (const org of [orgEnded, orgLeft, orgNoView, orgOther]) {
    await invoice(org, { number: "9999", status: "PENDING", dueDate: ago(1) });
  }
});

describe("listManagedDocuments", () => {
  it("ne liste que les dossiers actifs, dont il est membre, avec le droit Voir", async () => {
    const result = await list();
    expect(result.organizations.map((o) => o.name)).toEqual([
      "Boulangerie",
      "Garage",
    ]);
    expect(result.total).toBe(4);
    expect(
      result.rows.every((r) =>
        [String(orgA), String(orgB)].includes(r.organizationId),
      ),
    ).toBe(true);
    expect(result.rows.some((r) => r.reference === "F-202610-9999")).toBe(
      false,
    );
  });

  it("refuse un dossier demandé hors de son périmètre", async () => {
    const result = await list({ organizationId: String(orgOther) });
    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("filtre sur un dossier", async () => {
    const result = await list({ organizationId: String(orgB) });
    expect(result.total).toBe(2);
    expect(result.rows.every((r) => r.organizationName === "Boulangerie")).toBe(
      true,
    );
  });

  it("calcule le retard et le compte dans son onglet", async () => {
    const result = await list({ status: "overdue" });
    expect(result.rows.map((r) => r.reference)).toEqual(["F-202610-0001"]);
    expect(result.rows[0].status).toBe("OVERDUE");
    expect(result.statusCounts).toMatchObject({
      all: 4,
      DRAFT: 1,
      PENDING: 2,
      overdue: 1,
      COMPLETED: 1,
    });
  });

  it("cherche par destinataire, et formate brouillon et particulier", async () => {
    const result = await list({ q: "durand" });
    expect(result.rows.map((r) => r.clientName)).toEqual(["Transports Durand"]);

    const drafts = await list({ status: "DRAFT" });
    expect(drafts.rows[0]).toMatchObject({
      reference: null,
      clientName: "Lucie Bernard",
    });
  });

  it("ignore un onglet inconnu et une recherche qui ressemble à une expression", async () => {
    expect((await list({ status: "$where" })).total).toBe(4);
    expect((await list({ q: ".*" })).total).toBe(0);
  });
});
