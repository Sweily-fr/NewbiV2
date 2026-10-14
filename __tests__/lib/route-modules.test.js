import { describe, it, expect } from "vitest";
import { isHiddenForRole, moduleForPath } from "@/src/lib/route-modules";

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
