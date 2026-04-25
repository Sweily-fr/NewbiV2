/// <reference types="cypress" />

/**
 * Spec "explorer" — login puis PAUSE le test pour que tu voies l'app.
 * Clique "Resume" en haut à droite de Cypress pour continuer, ou ferme la fenêtre.
 */

describe("Exploration manuelle", () => {
  it("se logge et laisse l'app affichée", () => {
    cy.loginByApi();
    cy.visit("/dashboard");
    // Le test va s'arrêter ici — l'app reste visible dans Cypress.
    // Tu peux cliquer partout, inspecter avec DevTools, etc.
    cy.pause();
  });

  it("charge la page clients et attend", () => {
    cy.loginByApi();
    cy.visit("/dashboard/clients");
    cy.pause();
  });

  it("charge la page factures et attend", () => {
    cy.loginByApi();
    cy.visit("/dashboard/outils/factures");
    cy.pause();
  });
});
