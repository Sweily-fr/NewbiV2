// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Le secret interne posé sur la page Puppeteer ne doit partir que vers le
 * site lui-même, jamais vers un domaine tiers (GTM, logo ou image d'article
 * hébergés ailleurs) : sinon n'importe qui pouvait le récupérer en mettant
 * l'URL de son serveur comme logo dans l'aperçu de facture.
 */

vi.mock("puppeteer-core", () => ({ default: { launch: vi.fn() } }));
vi.mock("@sparticuz/chromium", () => ({ default: {} }));

const { setInternalSecretForSameOrigin } = await import("@/src/lib/puppeteer");

function fakePage() {
  const listeners = {};
  return {
    setRequestInterception: vi.fn(async () => {}),
    on: (event, cb) => {
      listeners[event] = cb;
    },
    emitRequest(url, headers = {}) {
      const request = {
        url: () => url,
        headers: () => headers,
        continue: vi.fn(async () => {}),
      };
      listeners.request(request);
      return request;
    },
  };
}

describe("setInternalSecretForSameOrigin", () => {
  beforeEach(() => {
    process.env.INTERNAL_API_SECRET = "s3cret";
  });
  afterEach(() => {
    delete process.env.INTERNAL_API_SECRET;
  });

  it("ajoute le secret aux requêtes vers le site", async () => {
    const page = fakePage();
    await setInternalSecretForSameOrigin(page, "https://www.newbi.fr");
    expect(page.setRequestInterception).toHaveBeenCalledWith(true);

    const req = page.emitRequest("https://www.newbi.fr/api/invoices/data/abc");
    expect(req.continue).toHaveBeenCalledWith({
      headers: { "x-internal-secret": "s3cret" },
    });
  });

  it("ne l'envoie jamais à un autre domaine", async () => {
    const page = fakePage();
    await setInternalSecretForSameOrigin(page, "https://www.newbi.fr");

    for (const url of [
      "https://attaquant.tld/logo.png",
      "https://www.googletagmanager.com/gtag/js?id=G-X",
      "https://pub-x.r2.dev/logo.png",
      "https://newbi.fr.attaquant.tld/x",
      "http://www.newbi.fr/api/x",
    ]) {
      const req = page.emitRequest(url, { "x-internal-secret": "s3cret" });
      const [{ headers }] = req.continue.mock.calls[0];
      expect(headers["x-internal-secret"]).toBeUndefined();
    }
  });
});

describe("routes PDF : plus d'en-tête global", () => {
  const routes = [
    "app/api/invoices/generate-pdf/route.js",
    "app/api/invoices/preview-pdf/route.js",
    "app/api/quotes/generate-pdf/route.js",
    "app/api/purchase-orders/generate-pdf/route.js",
    "app/api/delivery-notes/generate-pdf/route.js",
    "app/api/credit-notes/generate-pdf/route.js",
  ];

  it.each(routes)("%s n'utilise plus setExtraHTTPHeaders", (route) => {
    const source = readFileSync(path.resolve(process.cwd(), route), "utf8");
    expect(source).not.toMatch(/setExtraHTTPHeaders/);
    expect(source).toMatch(/setInternalSecretForSameOrigin\(page, baseUrl\)/);
  });
});
