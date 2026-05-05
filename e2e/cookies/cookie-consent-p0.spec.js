/**
 * P0 — Cookie consent compliance (RGPD).
 *
 * Invariant central : aucun script de tracking marketing (GTM, Meta Pixel,
 * Google Analytics) ne doit être chargé tant que l'utilisateur n'a pas donné
 * son consentement marketing explicite. C'est une obligation légale (RGPD
 * art. 7), pas juste une best-practice.
 *
 *   Test 1 — Sans consent en localStorage : aucun script tracking dans le DOM.
 *   Test 2 — Avec consent.marketing=false : aucun script tracking.
 *   Test 3 — Avec consent.marketing=true : GTM + Meta Pixel chargés.
 */
import { test, expect } from "@playwright/test";

const TRACKING_DOMAINS = [
  "googletagmanager.com",
  "google-analytics.com",
  "connect.facebook.net",
  "facebook.com/tr",
];

async function getScriptAndIframeSources(page) {
  return page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll("script"))
      .map((s) => s.src || s.textContent || "")
      .filter(Boolean);
    const iframes = Array.from(document.querySelectorAll("iframe"))
      .map((f) => f.src || "")
      .filter(Boolean);
    return [...scripts, ...iframes];
  });
}

function findTrackingScripts(sources) {
  return sources.filter((s) => TRACKING_DOMAINS.some((d) => s.includes(d)));
}

test.describe("[P0][Cookies] Consent gate sur scripts marketing (RGPD)", () => {
  test("Test 1 — Sans consent en localStorage : aucun script tracking", async ({
    page,
  }) => {
    // S'assurer que localStorage est vide AVANT le 1er render
    await page.addInitScript(() => {
      localStorage.removeItem("cookie_consent");
      localStorage.removeItem("cookie_consent_date");
    });

    await page.goto("/", { waitUntil: "networkidle", timeout: 45000 });

    const sources = await getScriptAndIframeSources(page);
    const tracking = findTrackingScripts(sources);
    expect(
      tracking,
      `RGPD VIOLATION — tracking scripts loaded without consent: ${JSON.stringify(tracking)}`,
    ).toEqual([]);
  });

  test("Test 2 — Consent marketing=false : aucun script tracking", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "cookie_consent",
        JSON.stringify({
          necessary: true,
          analytics: false,
          marketing: false,
        }),
      );
      localStorage.setItem("cookie_consent_date", new Date().toISOString());
    });

    await page.goto("/", { waitUntil: "networkidle", timeout: 45000 });

    const sources = await getScriptAndIframeSources(page);
    const tracking = findTrackingScripts(sources);
    expect(
      tracking,
      `RGPD VIOLATION — tracking scripts loaded with marketing=false: ${JSON.stringify(tracking)}`,
    ).toEqual([]);
  });

  test("Test 3 — Consent marketing=true : GTM + Meta Pixel chargés", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "cookie_consent",
        JSON.stringify({
          necessary: true,
          analytics: true,
          marketing: true,
        }),
      );
      localStorage.setItem("cookie_consent_date", new Date().toISOString());
    });

    await page.goto("/", { waitUntil: "networkidle", timeout: 45000 });

    const sources = await getScriptAndIframeSources(page);
    const tracking = findTrackingScripts(sources);

    // Au moins un script tracking doit être présent
    expect(
      tracking.length,
      `Expected tracking scripts to be loaded with marketing=true. Got 0. All sources: ${JSON.stringify(sources.slice(0, 20))}`,
    ).toBeGreaterThan(0);

    // Vérifications spécifiques : GTM ET Meta Pixel
    const hasGTM = tracking.some((s) => s.includes("googletagmanager.com"));
    const hasMetaPixel = tracking.some(
      (s) =>
        s.includes("connect.facebook.net") || s.includes("facebook.com/tr"),
    );
    expect(hasGTM, "GTM should be loaded with marketing consent").toBe(true);
    expect(
      hasMetaPixel,
      "Meta Pixel should be loaded with marketing consent",
    ).toBe(true);
  });
});
