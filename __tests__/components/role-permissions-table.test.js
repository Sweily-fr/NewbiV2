import { describe, it, expect } from "vitest";
import {
  groupState,
  toggledLevel,
} from "@/src/components/settings/role-permissions-table";

const page = { key: "invoices", levels: ["none", "read", "write", "delete"] };
const account = { key: "team", levels: ["none", "read", "write"] };
const feature = { key: "invoicePayments", levels: ["none", "write"] };

describe("cases cumulatives du tableau des droits", () => {
  it("cocher Supprimer donne aussi Voir et Modifier", () => {
    expect(toggledLevel(page, "none", "delete", true)).toBe("delete");
  });

  it("cocher Voir sur une page en Modifier ne change rien", () => {
    expect(toggledLevel(page, "write", "read", true)).toBe("write");
  });

  it("décocher Voir retire tout l'accès (page masquée)", () => {
    expect(toggledLevel(page, "delete", "read", false)).toBe("none");
  });

  it("décocher Modifier garde la lecture", () => {
    expect(toggledLevel(page, "delete", "write", false)).toBe("read");
  });

  it("décocher Supprimer garde Modifier", () => {
    expect(toggledLevel(page, "delete", "delete", false)).toBe("write");
  });

  it("fonctionnalité oui / non : décocher revient à aucun", () => {
    expect(toggledLevel(feature, "none", "write", true)).toBe("write");
    expect(toggledLevel(feature, "write", "write", false)).toBe("none");
  });

  it("module du compte : Gérer puis lecture", () => {
    expect(toggledLevel(account, "write", "write", false)).toBe("read");
  });
});

describe("case d'une section", () => {
  it("cochée, partielle ou vide selon les lignes", () => {
    const modules = [page, account];
    expect(
      groupState(modules, { invoices: "read", team: "read" }, "read"),
    ).toBe(true);
    expect(
      groupState(modules, { invoices: "write", team: "read" }, "write"),
    ).toBe("indeterminate");
    expect(
      groupState(modules, { invoices: "none", team: "none" }, "read"),
    ).toBe(false);
  });

  it("sans ligne concernée par la colonne : pas de case", () => {
    expect(groupState([account], { team: "write" }, "delete")).toBe(null);
  });
});
