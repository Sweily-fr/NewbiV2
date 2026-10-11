// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Page Puppeteer qui rend un document (routes generate-pdf et preview-pdf) :
 *
 * - le secret interne ne doit partir que vers le site lui-même, jamais vers
 *   un domaine tiers (GTM, logo ou image d'article hébergés ailleurs) :
 *   sinon n'importe qui pouvait le récupérer en mettant l'URL de son serveur
 *   comme logo dans l'aperçu de facture ;
 * - Chromium ne doit aller chercher que le site, les images publiques R2,
 *   `data:` et `blob:` : une URL d'image choisie par l'utilisateur (aperçu
 *   envoyé par l'app mobile, logo) ne doit plus faire partir de requête du
 *   serveur vers un hôte arbitraire, le réseau interne ou les métadonnées.
 */

vi.mock("puppeteer-core", () => ({ default: { launch: vi.fn() } }));
vi.mock("@sparticuz/chromium", () => ({ default: {} }));

const { securePdfPage, classifyPdfPageRequest, isPrivateHost } =
  await import("@/src/lib/puppeteer");

function fakePage() {
  const listeners = {};
  return {
    setRequestInterception: vi.fn(async () => {}),
    on: (event, cb) => {
      listeners[event] = cb;
    },
    emitRequest(url, { headers = {}, resourceType = "image" } = {}) {
      const request = {
        url: () => url,
        headers: () => headers,
        resourceType: () => resourceType,
        continue: vi.fn(async () => {}),
        abort: vi.fn(async () => {}),
      };
      listeners.request(request);
      return request;
    },
  };
}

const SITE = "https://www.newbi.fr";

beforeEach(() => {
  process.env.INTERNAL_API_SECRET = "s3cret";
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.INTERNAL_API_SECRET;
  delete process.env.COMPANY_IMAGE_URL;
  delete process.env.PDF_ALLOWED_IMAGE_ORIGINS;
  vi.restoreAllMocks();
});

describe("securePdfPage : secret interne", () => {
  it("ajoute le secret aux requêtes vers le site", async () => {
    const page = fakePage();
    await securePdfPage(page, SITE);
    expect(page.setRequestInterception).toHaveBeenCalledWith(true);

    const req = page.emitRequest(`${SITE}/api/invoices/data/abc`, {
      resourceType: "fetch",
    });
    expect(req.continue).toHaveBeenCalledWith({
      headers: { "x-internal-secret": "s3cret" },
    });
    expect(req.abort).not.toHaveBeenCalled();
  });

  it("ne l'envoie jamais à une image R2 autorisée", async () => {
    const page = fakePage();
    await securePdfPage(page, SITE);

    const req = page.emitRequest("https://pub-x.r2.dev/org/logo.png?v=2", {
      headers: { "x-internal-secret": "s3cret", accept: "image/*" },
    });
    expect(req.continue).toHaveBeenCalledWith({
      headers: { accept: "image/*" },
    });
  });
});

describe("securePdfPage : requêtes sortantes", () => {
  it("laisse passer le logo et les images produits hébergés sur R2", async () => {
    const page = fakePage();
    await securePdfPage(page, SITE);

    for (const url of [
      "https://pub-35f50e2bf3c94000bfdeb4c748a9902c.r2.dev/68cad81bb22506f4c701424d/logo.png?v=2",
      "https://pub-882cca85c9de481c8f8cc6c1ff0ab56e.r2.dev/68cad81bb22506f4c701424d/products/a.webp",
    ]) {
      const req = page.emitRequest(url);
      expect(req.continue, url).toHaveBeenCalled();
      expect(req.abort, url).not.toHaveBeenCalled();
    }
  });

  it("bloque tout autre hôte, avant tout envoi", async () => {
    const page = fakePage();
    await securePdfPage(page, SITE);

    for (const url of [
      "https://attaquant.tld/logo.png",
      "https://www.googletagmanager.com/gtag/js?id=G-X",
      "https://newbi.fr.attaquant.tld/x.png",
      "https://r2.dev.attaquant.tld/x.png",
      "https://pub-x.r2.dev.attaquant.tld/x.png",
      "http://www.newbi.fr/api/x",
      "http://pub-x.r2.dev/logo.png",
      "https://pub-x.r2.dev:8443/logo.png",
      "ftp://pub-x.r2.dev/logo.png",
      "file:///etc/passwd",
      "pas une url",
    ]) {
      const req = page.emitRequest(url);
      expect(req.abort, url).toHaveBeenCalledWith("blockedbyclient");
      expect(req.continue, url).not.toHaveBeenCalled();
    }
  });

  it("bloque toujours le réseau interne, la boucle locale et les métadonnées", async () => {
    const page = fakePage();
    await securePdfPage(page, "http://localhost:3000");

    for (const url of [
      "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
      "http://metadata.google.internal/computeMetadata/v1/",
      "http://127.0.0.1:4000/graphql",
      "http://localhost:4000/graphql",
      "http://2130706433/",
      "http://10.0.0.12/",
      "http://192.168.1.1/",
      "http://172.20.0.1/",
      "http://[::1]:3000/",
      "https://[fd00::1]/x.png",
      "https://[::ffff:127.0.0.1]/x.png",
    ]) {
      const req = page.emitRequest(url);
      expect(req.abort, url).toHaveBeenCalledWith("blockedbyclient");
      expect(req.continue, url).not.toHaveBeenCalled();
    }

    // Le site lui-même (même origine) reste servi en local
    const self = page.emitRequest("http://localhost:3000/_next/static/x.js", {
      resourceType: "script",
    });
    expect(self.continue).toHaveBeenCalled();
  });

  it("n'accepte de R2 que des images (ni script ni page)", async () => {
    const page = fakePage();
    await securePdfPage(page, SITE);

    for (const resourceType of ["script", "stylesheet", "document", "font"]) {
      const req = page.emitRequest("https://pub-x.r2.dev/x.js", {
        resourceType,
      });
      expect(req.abort, resourceType).toHaveBeenCalled();
    }
    // Relecture d'une image par fetch (ancien pipeline de capture)
    const refetch = page.emitRequest("https://pub-x.r2.dev/logo.png", {
      resourceType: "fetch",
    });
    expect(refetch.continue).toHaveBeenCalled();
  });

  it("laisse passer data: et blob:", async () => {
    const page = fakePage();
    await securePdfPage(page, SITE);

    for (const url of [
      "data:image/png;base64,iVBORw0KGgo=",
      `blob:${SITE}/0b0c6c4e-8f4c-4b55-9a6e-2c3f1f0e1a2b`,
    ]) {
      const req = page.emitRequest(url);
      expect(req.continue, url).toHaveBeenCalled();
      const [{ headers }] = req.continue.mock.calls[0];
      expect(headers["x-internal-secret"]).toBeUndefined();
    }
  });

  it("accepte un domaine d'images configuré (bucket en domaine personnalisé)", async () => {
    process.env.COMPANY_IMAGE_URL = "https://images.newbi.fr";
    process.env.PDF_ALLOWED_IMAGE_ORIGINS =
      "https://cdn.newbi.fr, http://10.0.0.5, pas-une-url";
    const page = fakePage();
    await securePdfPage(page, SITE);

    expect(
      page.emitRequest("https://images.newbi.fr/org/logo.png").continue,
    ).toHaveBeenCalled();
    expect(
      page.emitRequest("https://cdn.newbi.fr/org/products/a.webp").continue,
    ).toHaveBeenCalled();
    // Une origine privée ou en http n'est jamais ajoutée
    expect(
      page.emitRequest("http://10.0.0.5/logo.png").abort,
    ).toHaveBeenCalled();
  });
});

describe("classifyPdfPageRequest / isPrivateHost", () => {
  it("classe chaque requête", () => {
    expect(
      classifyPdfPageRequest(`${SITE}/pdf-generator/x`, "document", SITE),
    ).toBe("site");
    expect(
      classifyPdfPageRequest("https://pub-a.r2.dev/l.png", "image", SITE),
    ).toBe("external");
    expect(
      classifyPdfPageRequest("data:image/png;base64,AA==", "image", SITE),
    ).toBe("inline");
    expect(
      classifyPdfPageRequest(
        "https://user:pw@pub-a.r2.dev/l.png",
        "image",
        SITE,
      ),
    ).toBeNull();
    expect(
      classifyPdfPageRequest("https://example.com/l.png", "image", SITE),
    ).toBeNull();
  });

  it("reconnaît les adresses privées", () => {
    for (const host of [
      "localhost",
      "api.localhost",
      "127.0.0.1",
      "0.0.0.0",
      "10.1.2.3",
      "100.64.0.1",
      "169.254.169.254",
      "172.31.255.255",
      "192.168.0.10",
      "[::1]",
      "fe80::1",
      "metadata.google.internal",
    ]) {
      expect(isPrivateHost(host), host).toBe(true);
    }
    for (const host of [
      "pub-x.r2.dev",
      "8.8.8.8",
      "172.32.0.1",
      "www.newbi.fr",
    ]) {
      expect(isPrivateHost(host), host).toBe(false);
    }
  });
});

describe("routes PDF : filtre appliqué partout", () => {
  const routes = [
    "app/api/invoices/generate-pdf/route.js",
    "app/api/invoices/preview-pdf/route.js",
    "app/api/quotes/generate-pdf/route.js",
    "app/api/purchase-orders/generate-pdf/route.js",
    "app/api/delivery-notes/generate-pdf/route.js",
    "app/api/credit-notes/generate-pdf/route.js",
  ];

  it.each(routes)("%s protège la page avant de la charger", (route) => {
    const source = readFileSync(path.resolve(process.cwd(), route), "utf8");
    expect(source).not.toMatch(/setExtraHTTPHeaders/);
    const protect = source.indexOf("await securePdfPage(page, baseUrl)");
    expect(protect).toBeGreaterThan(-1);
    expect(source.indexOf("page.goto(")).toBeGreaterThan(protect);
  });
});
