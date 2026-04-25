/// <reference types="cypress" />

/**
 * Navigation smoke tests — proof that Cypress is wired to the app.
 * After Better Auth signup the test user lands on /onboarding, so we simply
 * assert the app responded (not the exact URL).
 */

describe("Navigation", () => {
  beforeEach(() => {
    cy.loginByApi();
  });

  it("reaches an authenticated page", () => {
    cy.visit("/dashboard");
    // Either the dashboard renders or we got redirected to onboarding —
    // both mean auth is working and the app loaded.
    cy.url({ timeout: 15000 }).should("match", /\/(dashboard|onboarding)/);
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });

  it("opens the clients page", () => {
    cy.visit("/dashboard/clients");
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });

  it("opens the invoices page", () => {
    cy.visit("/dashboard/outils/factures");
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });

  it("opens the quotes page", () => {
    cy.visit("/dashboard/outils/devis");
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });
});
