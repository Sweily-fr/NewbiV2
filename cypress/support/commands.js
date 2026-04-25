/// <reference types="cypress" />

/**
 * cy.loginByApi()
 *
 * Authenticate via the Better Auth HTTP endpoint. The session cookie is
 * stored in Cypress' cookie jar for the rest of the test.
 *
 * We deliberately skip cy.session() here — keeping the login explicit and
 * deterministic makes it easier to see what's happening in the Cypress UI.
 */
Cypress.Commands.add("loginByApi", (email, password) => {
  const user = email || Cypress.env("TEST_USER_EMAIL");
  const pwd = password || Cypress.env("TEST_USER_PASSWORD");

  if (!user || !pwd) {
    throw new Error(
      "Missing TEST_USER_EMAIL / TEST_USER_PASSWORD — set them in .env.test",
    );
  }

  // Ensure the test user + organization + subscription exist in MongoDB.
  // Idempotent: safe to call from every test. Uses the Node-side seedDb task.
  cy.task("seedDb");

  cy.request({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: {
      "Content-Type": "application/json",
      Origin: Cypress.config("baseUrl"),
    },
    body: { email: user, password: pwd },
    failOnStatusCode: true,
  }).then((response) => {
    expect(response.status).to.eq(200);
  });
});

/**
 * cy.waitForGraphQL(operationName) — resolve once a GraphQL request matching
 * the given operationName completes.
 */
Cypress.Commands.add(
  "waitForGraphQL",
  (operationName, { timeout = 10000 } = {}) => {
    cy.intercept("POST", "**/graphql", (req) => {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const op = Array.isArray(body)
        ? body.find((q) => q.operationName === operationName)
        : body?.operationName === operationName
          ? body
          : null;
      if (op) {
        req.alias = `gql_${operationName}`;
      }
    });
    cy.wait(`@gql_${operationName}`, { timeout });
  },
);
