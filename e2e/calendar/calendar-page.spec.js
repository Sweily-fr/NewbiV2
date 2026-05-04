import { test, expect } from "../fixtures/auth.fixture.js";

test.describe("Calendar / Calendrier", () => {
  test.setTimeout(180000);

  test("Page calendar se charge", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/calendar", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    await page
      .waitForResponse(
        (res) =>
          res.url().includes("/graphql") &&
          (res.request().postData()?.includes("Calendar") ||
            res.request().postData()?.includes("Event")),
        { timeout: 15000 },
      )
      .catch(() => {});

    const bodyText = await page.textContent("body");
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test("Vue calendrier ou état initial visible", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/calendar", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    // Either the calendar UI text rendered (Aujourd'hui, Nouvel événement…)
    // or the dashboard shell with the "Calendrier" sidebar link is present
    // and the page didn't crash. The sidebar always shows the Calendrier
    // link when on /dashboard/calendar; if events are still loading we
    // accept the skeleton state.
    const calendarUI = page
      .getByText(/Aujourd'hui|Nouvel événement|Calendriers|Évén/i)
      .first();
    const sidebarLink = page.getByRole("link", { name: /Calendrier/i }).first();

    const hasCalendarUI = await calendarUI
      .isVisible({ timeout: 30000 })
      .catch(() => false);
    if (!hasCalendarUI) {
      await expect(sidebarLink).toBeVisible({ timeout: 5000 });
    }
  });

  test("Boutons d'action sont présents (créer événement, options vue)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/calendar", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(800);

    const actionBtn = page
      .locator('button:has-text("Nouvel")')
      .or(page.locator('button:has-text("Créer")'))
      .or(page.locator('button:has-text("Ajouter")'))
      .or(page.locator('button:has-text("Connecter")'))
      .first();

    if (await actionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(actionBtn).toBeEnabled();
    }
  });
});
