// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { getModuleActions } from "@/src/lib/organization-roles";

/**
 * Droits vérifiés par le site sur les pages de documents de vente (lecture
 * des routes PDF) : mêmes règles que le catalogue de l'API
 * (newbi-api/src/config/rolePermissions.js).
 */

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439022";

let member = null;
let storedRoles = [];

const db = {
  collection: (name) => {
    if (name === "member") return { findOne: vi.fn(async () => member) };
    if (name === "organizationRole") {
      return { find: () => ({ toArray: async () => storedRoles }) };
    }
    throw new Error(`Collection inattendue : ${name}`);
  },
};

const actionsOf = async (role, moduleKey, roles = []) => {
  member = role
    ? {
        userId: new ObjectId(userId),
        organizationId: new ObjectId(orgId),
        role,
      }
    : null;
  storedRoles = roles;
  return getModuleActions(db, { userId, organizationId: orgId, moduleKey });
};

beforeEach(() => {
  member = null;
  storedRoles = [];
});

describe("getModuleActions : rôles prédéfinis", () => {
  it("donne « Voir » sur les documents à tous les rôles prédéfinis", async () => {
    for (const role of ["owner", "admin", "member", "viewer", "accountant"]) {
      for (const moduleKey of [
        "invoices",
        "creditNotes",
        "quotes",
        "purchaseOrders",
        "deliveryNotes",
        "team",
      ]) {
        const { actions } = await actionsOf(role, moduleKey);
        expect(actions, `${role} / ${moduleKey}`).toContain("view");
      }
    }
  });

  it("applique les grilles de l'API action par action", async () => {
    expect((await actionsOf("member", "invoices")).actions).toEqual([
      "view",
      "create",
      "edit",
      "send",
      "export",
      "markPaid",
      "recurring",
    ]);
    expect((await actionsOf("viewer", "quotes")).actions).toEqual(["view"]);
    expect((await actionsOf("accountant", "invoices")).actions).toEqual([
      "view",
      "export",
      "markPaid",
    ]);
    expect((await actionsOf("admin", "billing")).actions).toEqual(["view"]);
    expect((await actionsOf("member", "billing")).actions).toEqual([]);
    expect((await actionsOf("viewer", "integrations")).actions).toEqual([]);
  });

  it("refuse un non-membre", async () => {
    expect(await actionsOf(null, "invoices")).toEqual({
      role: null,
      actions: [],
    });
  });
});

describe("getModuleActions : rôles personnalisés et ajustés", () => {
  it("retire « Voir » à un rôle personnalisé dont la page est décochée", async () => {
    const { role, actions } = await actionsOf("role_terrain", "invoices", [
      { role: "role_terrain", actions: { invoices: [], kanban: ["view"] } },
    ]);
    expect(role).toBe("role_terrain");
    expect(actions).toEqual([]);
  });

  it("n'accorde rien à un rôle personnalisé sans grille enregistrée", async () => {
    expect((await actionsOf("role_disparu", "quotes")).actions).toEqual([]);
  });

  it("déduit « Voir » d'une autre action cochée", async () => {
    const { actions } = await actionsOf("role_devis", "quotes", [
      { role: "role_devis", actions: { quotes: ["create"] } },
    ]);
    expect(actions).toEqual(["view", "create"]);
  });

  it("vide les avoirs quand les factures ne sont pas visibles", async () => {
    const { actions } = await actionsOf("role_x", "creditNotes", [
      { role: "role_x", actions: { invoices: [], creditNotes: ["view"] } },
    ]);
    expect(actions).toEqual([]);
  });

  it("complète une page absente d'un rôle prédéfini ajusté par ses droits par défaut", async () => {
    // Grille enregistrée avant l'arrivée des bons de livraison
    const { actions } = await actionsOf("viewer", "deliveryNotes", [
      { role: "viewer", actions: { invoices: ["view"] } },
    ]);
    expect(actions).toEqual(["view"]);
  });

  it("respecte un rôle prédéfini ajusté sans « Voir » sur une page", async () => {
    const { actions } = await actionsOf("member", "purchaseOrders", [
      { role: "member", actions: { purchaseOrders: [] } },
    ]);
    expect(actions).toEqual([]);
  });

  it("convertit les grilles enregistrées par niveaux", async () => {
    expect(
      (
        await actionsOf("role_ancien", "invoices", [
          { role: "role_ancien", levels: { invoices: "read" } },
        ])
      ).actions,
    ).toEqual(["view", "export"]);
    expect(
      (
        await actionsOf("role_ancien", "quotes", [
          { role: "role_ancien", levels: { quotes: "none" } },
        ])
      ).actions,
    ).toEqual([]);
    // Encaissement seul (ancien module invoicePayments) : « Voir » déduit
    expect(
      (
        await actionsOf("role_ancien", "invoices", [
          { role: "role_ancien", levels: { invoicePayments: "write" } },
        ])
      ).actions,
    ).toEqual(["view", "markPaid"]);
    // Page du compte : « supprimer » vaut « écrire »
    expect(
      (
        await actionsOf("role_ancien", "team", [
          { role: "role_ancien", levels: { team: "delete" } },
        ])
      ).actions,
    ).toEqual(["view", "invite", "changeRole", "remove"]);
  });

  it("additionne les actions de plusieurs rôles", async () => {
    const { actions } = await actionsOf("role_a,role_b", "quotes", [
      { role: "role_a", actions: { quotes: [] } },
      { role: "role_b", actions: { quotes: ["view", "export"] } },
    ]);
    expect(actions).toEqual(["view", "export"]);
  });
});
