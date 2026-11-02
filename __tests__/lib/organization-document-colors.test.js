// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Couleurs par défaut des documents enregistrées dans l'espace : reprises
 * dans les nouveaux documents puis dans les styles du PDF, elles doivent
 * être des valeurs de couleur. Une couleur inchangée n'est pas contrôlée.
 */

import {
  isSafeDocumentColor,
  checkOrganizationColorsUpdate,
} from "@/src/lib/organization-document-colors";

const orgId = "507f1f77bcf86cd799439022";
const INVALID = "red;background:url(https://exemple.test/x.png)";

function fakeDb(current = {}) {
  const findOne = vi.fn(async () => current);
  return {
    findOne,
    collection: (name) => {
      if (name !== "organization") {
        throw new Error(`Collection inattendue : ${name}`);
      }
      return { findOne };
    },
  };
}

describe("isSafeDocumentColor", () => {
  it.each([
    "#1d1d1b",
    "#5B50FF",
    "#fff",
    "rgb(0, 0, 0)",
    "hsl(240, 100%, 50%)",
    "black",
    "",
    null,
    undefined,
  ])("accepte %j", (value) => {
    expect(isSafeDocumentColor(value)).toBe(true);
  });

  it.each([
    INVALID,
    "url(https://exemple.test/x.png)",
    "#000;color:red",
    "var(--x)",
    "rgb(0,0,0) !important",
    "#12345",
    42,
  ])("refuse %j", (value) => {
    expect(isSafeDocumentColor(value)).toBe(false);
  });
});

describe("checkOrganizationColorsUpdate", () => {
  it("accepte des couleurs hexadécimales sans lire la base", async () => {
    const db = fakeDb();
    const result = await checkOrganizationColorsUpdate({
      mongoDb: db,
      organizationId: orgId,
      data: {
        documentTextColor: "#000000",
        invoiceHeaderBgColor: "#5B50FF",
        quoteHeaderTextColor: "#FFFFFF",
      },
    });
    expect(result).toEqual({ ok: true });
    expect(db.findOne).not.toHaveBeenCalled();
  });

  it.each([
    "documentTextColor",
    "documentHeaderTextColor",
    "documentHeaderBgColor",
    "quoteHeaderBgColor",
    "invoiceTextColor",
    "purchaseOrderHeaderBgColor",
  ])("refuse une valeur qui n'est pas une couleur dans %s", async (field) => {
    const result = await checkOrganizationColorsUpdate({
      mongoDb: fakeDb({ [field]: "#000000" }),
      organizationId: orgId,
      data: { [field]: INVALID },
    });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Couleur du document invalide/);
  });

  it("accepte une couleur enregistrée renvoyée sans changement", async () => {
    const result = await checkOrganizationColorsUpdate({
      mongoDb: fakeDb({ documentHeaderBgColor: "ancienne valeur" }),
      organizationId: orgId,
      data: { documentHeaderBgColor: "ancienne valeur", siret: "x" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("ignore les autres champs de l'espace", async () => {
    const db = fakeDb();
    const result = await checkOrganizationColorsUpdate({
      mongoDb: db,
      organizationId: orgId,
      data: { name: INVALID, companyName: INVALID },
    });
    expect(result).toEqual({ ok: true });
    expect(db.findOne).not.toHaveBeenCalled();
  });
});

describe("mise à jour d'un espace (Better Auth)", () => {
  it("le contrôle des couleurs est branché sur beforeUpdateOrganization", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../../src/lib/auth-plugins.js"),
      "utf8",
    );
    const hook = source.slice(
      source.indexOf("beforeUpdateOrganization"),
      source.indexOf("afterAddMember"),
    );
    expect(hook).toMatch(/checkOrganizationColorsUpdate\(/);
    expect(hook).toMatch(/DOCUMENT_COLOR_REJECTED/);
  });
});
