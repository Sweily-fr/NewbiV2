import { test, expect } from "@playwright/test";

test.describe("Reactivate account page", () => {
  test.setTimeout(60000);

  test("API endpoint /api/account/reactivate refuse les requêtes invalides", async ({
    page,
  }) => {
    const response = await page.request.post("/api/account/reactivate", {
      data: { token: "" },
      failOnStatusCode: false,
    });
    // 400 / 401 / 404 attendu
    expect([400, 401, 403, 404, 405]).toContain(response.status());
  });
});
