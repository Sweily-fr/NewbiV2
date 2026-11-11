import { describe, it, expect } from "vitest";
import {
  featureForModule,
  isHiddenForRole,
  moduleForPath,
} from "@/src/lib/route-modules";

describe("pages masquées au Comptable par défaut", () => {
  it("masque les pages tant qu'il n'a rien de plus que ses droits par défaut", () => {
    const actions = {
      purchaseOrders: ["view", "export"],
      fileTransfers: ["view", "create", "edit"],
    };
    expect(isHiddenForRole("accountant", actions, "purchaseOrders")).toBe(true);
    // Page des bons de commande ouverte par URL, transferts fermés
    expect(
      isHiddenForRole("accountant", actions, "purchaseOrders", { page: true }),
    ).toBe(false);
    expect(
      isHiddenForRole("accountant", actions, "fileTransfers", { page: true }),
    ).toBe(true);
  });

  it("retirer un droit ne fait pas apparaître la page", () => {
    expect(
      isHiddenForRole(
        "accountant",
        { fileTransfers: ["view", "create"] },
        "fileTransfers",
        { page: true },
      ),
    ).toBe(true);
  });

  it("une action en plus la fait apparaître, même sans « Modifier »", () => {
    const actions = { purchaseOrders: ["view", "create", "export"] };
    expect(isHiddenForRole("accountant", actions, "purchaseOrders")).toBe(
      false,
    );
  });

  it("ne touche ni les autres rôles ni les autres pages", () => {
    const actions = { purchaseOrders: ["view", "export"], invoices: ["view"] };
    expect(isHiddenForRole("viewer", actions, "purchaseOrders")).toBe(false);
    expect(isHiddenForRole("accountant", actions, "invoices")).toBe(false);
    expect(isHiddenForRole("accountant", null, "purchaseOrders")).toBe(false);
  });

  it("l'accueil n'est rattaché à aucune page filtrée", () => {
    expect(moduleForPath("/dashboard")).toBe(null);
  });
});

describe("pages en accès anticipé", () => {
  it("rattache la TVA et la prise de rendez-vous à leur fonctionnalité", () => {
    expect(featureForModule(moduleForPath("/dashboard/outils/tva"))).toBe(
      "vat",
    );
    expect(
      featureForModule(moduleForPath("/dashboard/outils/rendez-vous?type=1")),
    ).toBe("appointments");
  });

  it("aucune fonctionnalité pour les autres pages", () => {
    expect(featureForModule(moduleForPath("/dashboard/outils/factures"))).toBe(
      null,
    );
    expect(featureForModule(null)).toBe(null);
  });
});
