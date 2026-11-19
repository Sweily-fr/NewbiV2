// @vitest-environment node
//
// /api/document-preview : un fichier qui ne peut pas être servi affichait la
// réponse JSON brute dans l'iframe d'aperçu ({"error":"Aucun fichier
// disponible"}, signalé le 19/11/2026). Une iframe reçoit maintenant une page
// lisible ; les appels fetch() gardent le JSON.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  previewErrorMessage,
  wantsPreviewPage,
} from "@/src/lib/preview-error-page";

const ID = "650000000000000000000001";
const FILE_ID = "650000000000000000000002";
const fetchMock = vi.fn();
let realFetch;

const IFRAME = { "sec-fetch-dest": "iframe", accept: "text/html,*/*" };
const FETCH = { "sec-fetch-dest": "empty", accept: "*/*" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  realFetch = global.fetch;
  global.fetch = fetchMock;
});
afterEach(() => {
  global.fetch = realFetch;
});

const missingFile = () =>
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ error: "Aucun fichier disponible" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    }),
  );

const call = async (
  type,
  headers,
  { query = "", cookie = "better-auth.session_token=abc" } = {},
) => {
  const { GET } = await import("@/app/api/document-preview/[type]/[id]/route");
  return GET(
    new NextRequest(
      `http://localhost/api/document-preview/${type}/${ID}${query}`,
      { headers: { ...headers, ...(cookie ? { cookie } : {}) } },
    ),
    { params: Promise.resolve({ type, id: ID }) },
  );
};

describe("aperçu d'un fichier indisponible", () => {
  it("iframe : page lisible au lieu du JSON brut (justificatif effacé)", async () => {
    missingFile();
    const res = await call("purchaseInvoice", IFRAME, {
      query: `?fileId=${FILE_ID}`,
    });

    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const html = await res.text();
    expect(html).toContain("Ce fichier n&#39;est plus disponible");
    expect(html).toContain("déposer de nouveau le justificatif");
    expect(html).not.toContain('{"error"');
    expect(html).not.toContain("Aucun fichier disponible");
  });

  it("appel fetch() : JSON inchangé", async () => {
    missingFile();
    const res = await call("purchaseInvoice", FETCH);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Aucun fichier disponible" });
  });

  it("navigateur sans Sec-Fetch-Dest : la navigation (text/html) reçoit la page", async () => {
    missingFile();
    const res = await call("invoice", { accept: "text/html" });
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("Il a peut-être été supprimé.");
  });

  it("iframe sans session : page « session expirée », sans appel à l'API", async () => {
    const res = await call("invoice", IFRAME, { cookie: null });
    expect(res.status).toBe(401);
    expect(await res.text()).toContain("Votre session a expiré");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("iframe et API injoignable : page « réessayez »", async () => {
    fetchMock.mockRejectedValue(new Error("timeout"));
    const res = await call("transaction", IFRAME);
    expect(res.status).toBe(500);
    expect(await res.text()).toContain("Le fichier n&#39;a pas pu être chargé");
  });

  it("fichier servi : réponse inchangée", async () => {
    fetchMock.mockResolvedValue(
      new Response("%PDF-1.7", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }),
    );
    const res = await call("purchaseInvoice", IFRAME);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("%PDF-1.7");
  });
});

describe("messages", () => {
  it("aucun tiret long dans les textes affichés", () => {
    for (const status of [400, 401, 403, 404, 500, 502]) {
      for (const type of ["invoice", "purchaseInvoice"]) {
        const { title, detail } = previewErrorMessage(status, type);
        expect(`${title} ${detail}`).not.toMatch(/—/);
      }
    }
  });

  it("navigation ou lecture en JavaScript", () => {
    const req = (headers) => new Request("http://localhost/", { headers });
    expect(wantsPreviewPage(req({ "sec-fetch-dest": "iframe" }))).toBe(true);
    expect(wantsPreviewPage(req({ "sec-fetch-dest": "document" }))).toBe(true);
    expect(wantsPreviewPage(req({ "sec-fetch-dest": "empty" }))).toBe(false);
    expect(wantsPreviewPage(req({ "sec-fetch-dest": "image" }))).toBe(false);
    expect(wantsPreviewPage(req({ accept: "*/*" }))).toBe(false);
  });
});
