/// <reference types="cypress" />

/**
 * Demo live — les 4 étapes de l'onboarding, visite directe par query param.
 * On ne force pas le passage séquentiel : on visite chaque étape directement,
 * ce qui évite les blocages API et permet de voir chaque écran distinctement.
 */

describe("Demo live — onboarding 4 étapes", () => {
  beforeEach(() => {
    cy.loginByApi();
  });

  it("étape 1 — type de compte", () => {
    cy.visit("/onboarding");
    cy.contains("Quel type de compte", { timeout: 20000 }).should("be.visible");
    cy.wait(2000);
    cy.contains("Entreprise").click();
    cy.wait(1500);
  });

  it("étape 2 — taille de l'entreprise", () => {
    cy.visit("/onboarding?step=2");
    cy.contains("Quelle est la taille", { timeout: 20000 }).should(
      "be.visible",
    );
    cy.wait(1500);
    cy.contains("Juste moi").click();
    cy.wait(900);
    cy.contains("2-5 employés").click();
    cy.wait(900);
    cy.contains("6-10 employés").click();
    cy.wait(1500);
  });

  it("étape 3 — recherche 'sweily'", () => {
    cy.visit("/onboarding?step=3");
    cy.contains("Recherchez votre entreprise", { timeout: 20000 }).should(
      "be.visible",
    );
    cy.wait(1200);

    // Tape "sweily" caractère par caractère pour l'effet visuel.
    // La page rend desktop + mobile → 2 inputs avec le même id, on prend le premier.
    cy.get("input#company-search").first().type("sweily", {
      force: true,
      delay: 180,
    });
    cy.wait(3500);
  });

  it("étape 4 — choix du plan + switch Mensuel/Annuel", () => {
    cy.visit("/onboarding?step=4");
    cy.contains(/Freelance|TPE/, { timeout: 20000 }).should("be.visible");
    cy.wait(1500);

    // Bascule Annuel → Mensuel pour voir les prix changer
    cy.contains("button", "Annuel").click();
    cy.wait(1800);

    cy.contains("button", "Mensuel").click();
    cy.wait(1800);
  });
});
