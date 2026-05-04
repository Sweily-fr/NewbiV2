import { test, expect } from "../fixtures/auth.fixture.js";

test.describe("OCR Test page", () => {
  test.setTimeout(90000);

  test("Page OCR test se charge avec son titre", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/outils/ocr-test", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    const heading = page
      .locator("h1:has-text('Test OCR')")
      .or(page.locator("text=/OCR/i"))
      .first();
    await expect(heading).toBeVisible({ timeout: 30000 });
  });

  test("Zone d'upload de fichier visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/outils/ocr-test", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // Wait for the OCR test page heading first so we know the client
    // component has hydrated and rendered.
    await expect(
      page.getByRole("heading", { name: /Test OCR/i }).first(),
    ).toBeVisible({ timeout: 30000 });

    // The file input is intentionally hidden (className="hidden"); check it's
    // attached to the DOM rather than visible.
    const fileInputCount = await page
      .locator('input[type="file"]')
      .count()
      .catch(() => 0);
    const hasDropzone = await page
      .getByText(/Gliss(er|ez)|Dépos|Sélectionn|Choisir un fichier/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(fileInputCount > 0 || hasDropzone).toBeTruthy();
  });

  test("Page contient des informations sur le test OCR", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/outils/ocr-test", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    const bodyText = await page.textContent("body");
    expect(bodyText.length).toBeGreaterThan(100);
    // Le mot OCR doit apparaître quelque part
    expect(bodyText.toLowerCase()).toContain("ocr");
  });
});
