/**
 * En-têtes de sécurité envoyés par le site (next.config.js, src/middleware.js)
 * dans le build de production :
 *   - chaque page HTML (publique, connexion, tableau de bord) : CSP,
 *     X-Frame-Options DENY, HSTS, nosniff, Referrer-Policy ;
 *   - /rdv : intégrable en iframe (pas de X-Frame-Options, frame-ancestors *),
 *     non indexée ;
 *   - proxys de fichiers (/api/document-preview, /api/shared-documents/
 *     preview-file) : nosniff, affichage en iframe du site seulement, jamais
 *     de cache partagé ;
 *   - pages de développement absentes, même demandées en préchargement.
 * Requêtes directes : aucune page n'est rendue dans le navigateur.
 */
import { test, expect } from "../outils.mjs";
import { connecte, SESSION_TOKEN_PARAMETRES } from "../config.mjs";

const PAGES_PUBLIQUES = ["/", "/auth/login", "/auth/signup", "/auth/forget-password", "/faq"];
const PAGES_CONNECTEES = ["/dashboard", "/dashboard/clients", "/dashboard/outils/factures"];

function verifierEntetesPage(entetes, chemin) {
  const csp = entetes["content-security-policy"] || "";
  expect.soft(csp, `${chemin} : Content-Security-Policy absente`).toContain("default-src 'self'");
  expect.soft(csp, `${chemin} : la CSP doit interdire les objets`).toContain("object-src 'none'");
  expect.soft(entetes["x-frame-options"], `${chemin} : X-Frame-Options`).toBe("DENY");
  expect.soft(entetes["strict-transport-security"] || "", `${chemin} : HSTS`).toMatch(/max-age=\d{7,}/);
  expect.soft(entetes["x-content-type-options"], `${chemin} : nosniff`).toBe("nosniff");
  expect.soft(entetes["referrer-policy"], `${chemin} : Referrer-Policy`).toBe("strict-origin-when-cross-origin");
}

test.describe("En-têtes de sécurité : pages publiques", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const chemin of PAGES_PUBLIQUES) {
    test(`${chemin} : CSP, X-Frame-Options DENY, HSTS et nosniff`, async ({ request }) => {
      const reponse = await request.get(chemin, { maxRedirects: 0 });
      expect(reponse.status(), `${chemin} : statut`).toBeLessThan(400);
      verifierEntetesPage(reponse.headers(), chemin);
    });
  }

  test("Page introuvable : mêmes en-têtes", async ({ request }) => {
    const reponse = await request.get("/page-qui-n-existe-pas-e2e");
    expect(reponse.status()).toBe(404);
    verifierEntetesPage(reponse.headers(), "page 404");
  });

  test("Prise de rendez-vous : intégrable en iframe, non indexée, toujours sous CSP", async ({ request }) => {
    const reponse = await request.get("/rdv/page-inexistante-e2e");
    const entetes = reponse.headers();
    expect.soft(entetes["x-frame-options"], "X-Frame-Options présent sur /rdv : l'intégration en iframe casse").toBeUndefined();
    expect.soft(entetes["content-security-policy"] || "").toContain("frame-ancestors *");
    expect.soft(entetes["content-security-policy"] || "").toContain("default-src 'self'");
    expect.soft(entetes["x-robots-tag"] || "").toContain("noindex");
    expect.soft(entetes["x-content-type-options"]).toBe("nosniff");
  });
});

test.describe("En-têtes de sécurité : tableau de bord", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PARAMETRES) });

  for (const chemin of PAGES_CONNECTEES) {
    test(`${chemin} : CSP, X-Frame-Options DENY, HSTS et nosniff`, async ({ request }) => {
      const reponse = await request.get(chemin, { maxRedirects: 0 });
      expect(reponse.status(), `${chemin} : statut`).toBeLessThan(400);
      verifierEntetesPage(reponse.headers(), chemin);
    });
  }
});

test.describe("En-têtes de sécurité : proxys de fichiers", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PARAMETRES) });

  const PROXYS = [
    "/api/document-preview/purchaseInvoice/000000000000000000000000",
    "/api/document-preview/invoice/000000000000000000000000",
    "/api/shared-documents/preview-file/000000000000000000000000?workspaceId=000000000000000000000000",
  ];

  for (const chemin of PROXYS) {
    test(`${chemin.split("?")[0]} : nosniff, iframe du site seulement, jamais de cache partagé`, async ({ request }) => {
      const reponse = await request.get(chemin);
      const entetes = reponse.headers();
      expect.soft(entetes["x-content-type-options"], "nosniff").toBe("nosniff");
      expect.soft(entetes["x-frame-options"], "affichage en iframe hors du site").toBe("SAMEORIGIN");
      expect.soft(entetes["cache-control"] || "", "document servi sous session mis en cache partagé").not.toMatch(/\bpublic\b/);
      expect.soft(entetes["content-type"] || "", "un fichier inconnu ne doit jamais être servi en HTML").not.toMatch(/text\/html|svg/);
    });
  }
});

test.describe("Pages de développement : absentes en production", () => {
  for (const chemin of ["/dashboard/test-rbac", "/dashboard/loaderTest"]) {
    for (const [cas, entetes] of [
      ["navigation", {}],
      ["préchargement (next-router-prefetch)", { "next-router-prefetch": "1", rsc: "1" }],
      ["préchargement (purpose: prefetch)", { purpose: "prefetch" }],
    ]) {
      test(`${chemin}, ${cas} : 404, rien de la page`, async ({ request }) => {
        const reponse = await request.get(chemin, { headers: entetes, maxRedirects: 0 });
        expect(reponse.status(), `${chemin} servie en production (${cas})`).toBe(404);
        const corps = await reponse.text();
        expect(corps).not.toMatch(/Système RBAC|loaderTest/i);
      });
    }
  }
});
