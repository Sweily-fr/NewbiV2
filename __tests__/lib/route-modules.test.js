import { describe, it, expect } from "vitest";
import {
  actionForPath,
  featureForModule,
  isHiddenForRole,
  moduleForPath,
  pathForModule,
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
  it("rattache la prise de rendez-vous à sa fonctionnalité", () => {
    // Pages Déclaration de TVA et Urssaf retirées le 20/11/2026
    expect(moduleForPath("/dashboard/outils/tva")).toBe(null);
    expect(moduleForPath("/dashboard/outils/urssaf")).toBe(null);
    expect(
      featureForModule(moduleForPath("/dashboard/outils/rendez-vous?type=1")),
    ).toBe("appointments");
  });

  it("rattache les campagnes e-mail, éditeur compris, à leur module et à leur fonctionnalité", () => {
    expect(moduleForPath("/dashboard/outils/campagnes-email")).toBe(
      "emailCampaigns",
    );
    expect(
      featureForModule(
        moduleForPath("/dashboard/outils/campagnes-email/abc/editeur"),
      ),
    ).toBe("emailCampaigns");
    expect(pathForModule("emailCampaigns")).toBe(
      "/dashboard/outils/campagnes-email",
    );
  });

  it("aucune fonctionnalité pour les autres pages", () => {
    expect(featureForModule(moduleForPath("/dashboard/outils/factures"))).toBe(
      null,
    );
    expect(featureForModule(null)).toBe(null);
  });
});

describe("action demandée par une page", () => {
  it("l'éditeur d'une campagne demande « Modifier », sa page « Voir »", () => {
    expect(actionForPath("/dashboard/outils/campagnes-email/abc/editeur")).toBe(
      "edit",
    );
    expect(actionForPath("/dashboard/outils/campagnes-email/abc")).toBe("view");
    expect(actionForPath("/dashboard/outils/factures/abc/editer")).toBe("edit");
    expect(actionForPath("/dashboard/outils/devis/new")).toBe("create");
  });
});
