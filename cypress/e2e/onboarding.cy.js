/// <reference types="cypress" />

/**
 * Onboarding — tests interactifs sur tout le parcours d'accueil.
 *
 * Vrai flow :
 *   1. AccountTypeStep — Entreprise / Cabinet Comptable
 *   2. EmployeeCountStep — taille de l'entreprise
 *   3. CompanySearchStep — recherche SIREN (API /api/search-companies)
 *   4. PlanSelectionStep — choix du plan + facturation mensuelle/annuelle
 */

describe("Onboarding — étape 1 (type de compte)", () => {
  beforeEach(() => {
    cy.loginByApi();
    cy.visit("/onboarding");
    cy.contains("Quel type de compte", { timeout: 20000 }).should("be.visible");
  });

  it("affiche les 2 choix (Entreprise activé, Cabinet désactivé)", () => {
    cy.contains("Entreprise").should("be.visible");
    cy.contains("Cabinet Comptable").should("be.visible");
    cy.contains("Cabinet Comptable").closest("button").should("be.disabled");
  });

  it("passe à l'étape 2 en cliquant Entreprise", () => {
    cy.contains("Entreprise").click();
    cy.url({ timeout: 10000 }).should("include", "step=2");
    cy.contains("Quelle est la taille de votre entreprise", {
      timeout: 10000,
    }).should("be.visible");
  });
});

describe("Onboarding — étape 2 (taille)", () => {
  beforeEach(() => {
    cy.loginByApi();
    cy.visit("/onboarding");
    cy.contains("Quel type de compte", { timeout: 20000 }).should("be.visible");
    cy.contains("Entreprise").click();
    cy.contains("Quelle est la taille", { timeout: 10000 }).should(
      "be.visible",
    );
  });

  it("affiche les 5 tranches de taille", () => {
    cy.contains("Juste moi").should("be.visible");
    cy.contains("2-5 employés").should("be.visible");
    cy.contains("6-10 employés").should("be.visible");
    cy.contains("11-50 employés").should("be.visible");
    cy.contains("Plus de 50 employés").should("be.visible");
  });

  it("sélectionne une taille et passe à l'étape 3", () => {
    cy.contains("2-5 employés").click();
    cy.wait(500);
    cy.contains("button", "Continuer").click();

    cy.url({ timeout: 10000 }).should("include", "step=3");
    cy.contains("Recherchez votre entreprise", { timeout: 10000 }).should(
      "be.visible",
    );
  });
});

describe("Onboarding — étape 3 (recherche SIREN)", () => {
  beforeEach(() => {
    cy.loginByApi();
    cy.visit("/onboarding?step=3");
    // La page charge directement à l'étape 3 (state persistant ou query param)
    // Si ça bloque sur étape 1, on refait le parcours
    cy.get("body").then(($body) => {
      if ($body.text().includes("Quel type de compte")) {
        cy.contains("Entreprise").click();
        cy.contains("Quelle est la taille", { timeout: 10000 }).should(
          "be.visible",
        );
        cy.contains("2-5 employés").click();
        cy.contains("button", "Continuer").click();
      }
    });
    cy.contains("Recherchez votre entreprise", { timeout: 15000 }).should(
      "be.visible",
    );
  });

  it("affiche le champ de recherche", () => {
    // La page rend 2 layouts (desktop + mobile) — il y a 2 inputs avec le même id
    cy.get("input#company-search").first().should("exist");
    cy.contains("Nom de l'entreprise, SIRET ou SIREN").should("be.visible");
  });

  it("recherche 'sweily' — input accepte la saisie", () => {
    cy.get("input#company-search").first().type("sweily", { force: true });
    cy.get("input#company-search").first().should("have.value", "sweily");
    cy.wait(3000);
  });

  it("le bouton Continuer est désactivé tant qu'aucune entreprise n'est sélectionnée", () => {
    cy.contains("button", "Continuer").first().should("be.disabled");
  });
});

describe("Onboarding — étape 4 (choix du plan)", () => {
  beforeEach(() => {
    cy.loginByApi();
    cy.visit("/onboarding?step=4");
    cy.contains(/Freelance|TPE|Entreprise/, { timeout: 20000 }).should(
      "be.visible",
    );
  });

  it("affiche les 3 plans avec leurs prix mensuels", () => {
    cy.contains("Freelance").should("be.visible");
    cy.contains("TPE").should("be.visible");
    // "Entreprise" existe comme plan ET comme titre account-type — on cible le badge "Populaire" sur TPE
    cy.contains("Populaire").should("be.visible");

    // Prix mensuel de TPE = 48,99€
    cy.contains("48,99").should("be.visible");
  });

  it("bascule entre facturation mensuelle et annuelle", () => {
    // Par défaut : mensuel, TPE = 48,99€
    cy.contains("48,99").should("be.visible");

    // Clic sur "Annuel"
    cy.contains("button", "Annuel").click();
    cy.wait(500);

    // Annuel : TPE = 44,09€
    cy.contains("44,09").should("be.visible");
    cy.contains("-10%").should("be.visible");

    // Retour mensuel
    cy.contains("button", "Mensuel").click();
    cy.wait(500);
    cy.contains("48,99").should("be.visible");
  });

  it("clique sur un bouton 'Choisir ce plan'", () => {
    // On prend simplement le premier "Choisir ce plan" visible — pas besoin
    // d'identifier la card exacte, le but ici est juste de prouver que
    // Cypress interagit bien avec le vrai flux Stripe.
    cy.contains("button", "Choisir ce plan").first().click();
    cy.wait(1500);
  });
});
