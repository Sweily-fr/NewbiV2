import { test as setup } from "@playwright/test";
import { requireEnv } from "./helpers.js";

const authFile = "e2e/.auth/user.json";

/**
 * Global auth setup — logs in once via the Better Auth HTTP API and saves
 * cookies for reuse by all other tests.
 *
 * Going through the API (instead of the UI form) is Playwright's recommended
 * pattern: deterministic, fast, and immune to UI-layer changes like Radix UI
 * updates, React Hook Form timing, or layout changes.
 */
setup("authenticate", async ({ page, context, baseURL }) => {
  // Generous budget: the warmup loop walks 5 routes that each cold-compile in
  // Turbopack on the first hit (up to ~90s each on a busy machine).
  setup.setTimeout(600000);

  const email = requireEnv("TEST_USER_EMAIL");
  const password = requireEnv("TEST_USER_PASSWORD");
  const origin = baseURL || "http://localhost:3000";

  // 1. POST credentials to Better Auth. On success Set-Cookie headers land
  //    in the Playwright context's cookie jar.
  const response = await context.request.post(
    `${origin}/api/auth/sign-in/email`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      data: { email, password },
    },
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Login failed: ${response.status()} ${body.slice(0, 300)}`);
  }

  const cookies = await context.cookies();
  const sessionCookie = cookies.find((c) => c.name.includes("session"));
  if (!sessionCookie) {
    throw new Error(
      `No session cookie set. Got: ${cookies.map((c) => c.name).join(", ")}`,
    );
  }
  console.log(`  ↳ Session cookie acquired: ${sessionCookie.name}`);

  // 2. Navigate once so Next.js + Apollo hydrate with the new cookie, and
  //    handle the "manage devices" multi-session screen if present.
  //    Use `commit` (fastest, skips render) — we only need a navigation to
  //    store state, not wait for the full dashboard to render.
  //    Timeout aligné sur le warmup loop (90s) car sur une DB chargée le
  //    layout dashboard fait des queries Apollo (factures + clients +
  //    company info) qui peuvent dépasser 30s à froid (cf 354 invoices
  //    cumulées en workspace de test, ralentissant getInvoices).
  await page.goto("/dashboard", { waitUntil: "commit", timeout: 90000 });
  // Small grace period for cookies + localStorage to be fully hydrated
  await page.waitForTimeout(1000);

  if (page.url().includes("manage-devices")) {
    const keepBtn = page
      .locator('button:has-text("Garder cette session uniquement")')
      .first();
    const continueBtn = page.locator('button:has-text("Continuer")').first();
    if (await keepBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await keepBtn.click();
      const confirm = page
        .locator('[role="alertdialog"] button:has-text("Confirmer")')
        .first();
      await confirm.waitFor({ state: "visible", timeout: 5000 });
      await confirm.click();
    } else if (
      await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await continueBtn.click();
    }
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20000 });
  }

  // 3. Warm up critical routes so the first navigation in each spec doesn't
  //    pay the on-demand compile cost. Tolerate failures — Turbopack's first
  //    compile of a heavy route can occasionally exceed our budget; better to
  //    let the spec retry it than fail the whole setup.
  const ROUTES_TO_WARMUP = [
    "/dashboard",
    "/dashboard/outils/factures",
    "/dashboard/outils/factures/new",
    "/dashboard/outils/devis",
    "/dashboard/clients",
  ];
  let warmed = 0;
  for (const route of ROUTES_TO_WARMUP) {
    try {
      await page.goto(route, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      warmed++;
    } catch (e) {
      console.log(`  ⚠️ Warmup failed for ${route}: ${e.message}`);
    }
  }
  console.log(`  ↳ Warmed up ${warmed}/${ROUTES_TO_WARMUP.length} routes`);

  // 4. Persist the storage state (cookies + localStorage) for downstream tests.
  await context.storageState({ path: authFile });
});
