const { defineConfig } = require("cypress");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env" });

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.js",
    fixturesFolder: "cypress/fixtures",
    videosFolder: "cypress/videos",
    screenshotsFolder: "cypress/screenshots",
    downloadsFolder: "cypress/downloads",
    viewportWidth: 1400,
    viewportHeight: 900,
    defaultCommandTimeout: 15000,
    requestTimeout: 30000,
    pageLoadTimeout: 120000,
    responseTimeout: 60000,
    video: false,
    env: {
      TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
      TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD,
    },
    async setupNodeEvents(on, config) {
      // Expose the seed helper as a Cypress task. Specs call cy.task("seedDb")
      // to ensure the test user, organization, and subscription exist.
      on("task", {
        async seedDb() {
          const { seedDatabase } = await import("./e2e/seed/run-seed.mjs");
          await seedDatabase({
            email: process.env.TEST_USER_EMAIL,
            password: process.env.TEST_USER_PASSWORD,
            baseUrl: config.baseUrl,
          });
          return null;
        },
      });

      return config;
    },
  },
});
