import { describe, it, expect } from "vitest";
import {
  groupCheckState,
  pageSummary,
  setModulesAll,
  toggleAction,
} from "@/src/components/settings/role-permissions-table";

const action = (key) => ({ key, label: key });
const catalog = {
  groups: [{ key: "sales", label: "Ventes" }],
  modules: [
    {
      key: "invoices",
      group: "sales",
      actions: ["view", "create", "edit", "delete", "send"].map(action),
    },
    {
      key: "creditNotes",
      group: "sales",
      parent: "invoices",
      actions: ["view", "create"].map(action),
    },
  ],
};

describe("cases indépendantes de l'éditeur de rôle", () => {
  it("cocher une action ajoute Voir, sans cocher les autres", () => {
    const grid = toggleAction(catalog, {}, "invoices", "send", true);
    expect(grid.invoices).toEqual(["view", "send"]);
  });

  it("créer sans modifier reste possible", () => {
    let grid = toggleAction(catalog, {}, "invoices", "create", true);
    grid = toggleAction(catalog, grid, "invoices", "edit", false);
    expect(grid.invoices).toEqual(["view", "create"]);
  });

  it("décocher Voir retire tout, parties de la page comprises", () => {
    const grid = toggleAction(
      catalog,
      { invoices: ["view", "create"], creditNotes: ["view", "create"] },
      "invoices",
      "view",
      false,
    );
    expect(grid.invoices).toEqual([]);
    expect(grid.creditNotes).toEqual([]);
  });

  it("une action d'une partie de page ouvre la page parente", () => {
    const grid = toggleAction(catalog, {}, "creditNotes", "create", true);
    expect(grid.creditNotes).toEqual(["view", "create"]);
    expect(grid.invoices).toEqual(["view"]);
  });

  it("case « tout » d'une page : toutes les actions ou aucune", () => {
    const all = setModulesAll(catalog, {}, ["invoices", "creditNotes"], true);
    expect(all.invoices).toHaveLength(5);
    expect(groupCheckState(catalog, all, ["invoices", "creditNotes"])).toBe(
      true,
    );
    const none = setModulesAll(catalog, all, ["invoices"], false);
    expect(groupCheckState(catalog, none, ["invoices", "creditNotes"])).toBe(
      "indeterminate",
    );
  });

  it("résumé de la ligne repliée", () => {
    expect(pageSummary(catalog, {}, "invoices")).toBe("Aucun accès");
    expect(pageSummary(catalog, { invoices: ["view"] }, "invoices")).toBe(
      "Lecture seule",
    );
    expect(
      pageSummary(catalog, { invoices: ["view", "create"] }, "invoices"),
    ).toBe("2 droits sur 7");
  });
});
