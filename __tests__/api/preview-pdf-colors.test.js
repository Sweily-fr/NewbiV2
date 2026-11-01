// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Aperçu PDF d'une facture non enregistrée (POST /api/invoices/preview-pdf) :
 * les couleurs reprises dans les styles du document rendu par le navigateur
 * du serveur sont des valeurs de couleur, sinon la demande est refusée avant
 * tout rendu.
 */

const m = vi.hoisted(() => ({ launchBrowser: vi.fn() }));

vi.mock("@/src/lib/puppeteer", () => ({
  launchBrowser: (...args) => m.launchBrowser(...args),
  securePdfPage: vi.fn(),
}));
vi.mock("@/src/lib/vectorPdf", () => ({
  VECTOR_PDF_ENABLED: true,
  generateVectorPdf: vi.fn(),
}));
vi.mock("@/src/lib/security", async () => {
  const { apiError } = await vi.importActual("@/src/lib/security/api-error");
  const { withErrorHandler } = await vi.importActual(
    "@/src/lib/security/with-error-handler",
  );
  return {
    apiError,
    withErrorHandler,
    hasInternalSecret: () => false,
    requireSession: vi.fn(async () => ({ user: { id: "u1" } })),
  };
});

import { POST } from "@/app/api/invoices/preview-pdf/route";

const request = (appearance) =>
  new Request("http://localhost/api/invoices/preview-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invoiceData: {
        items: [{ description: "Prestation", quantity: 1, unitPrice: 10 }],
        client: { name: "Client" },
        appearance,
      },
    }),
  });

beforeEach(() => {
  m.launchBrowser.mockReset();
  m.launchBrowser.mockRejectedValue(new Error("rendu non simulé"));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("POST /api/invoices/preview-pdf : couleurs", () => {
  it.each([
    { headerBgColor: "red;background:url(https://exemple.test/x.png)" },
    { headerBgColor: "#000), url(https://exemple.test/x.png" },
    { textColor: "var(--x)" },
    { headerTextColor: 12 },
  ])("refuse %j sans lancer de rendu", async (appearance) => {
    const res = await POST(request(appearance));
    expect(res.status).toBe(400);
    expect(m.launchBrowser).not.toHaveBeenCalled();
  });

  it("des couleurs hexadécimales passent au rendu", async () => {
    await POST(
      request({
        textColor: "#000000",
        headerTextColor: "#FFFFFF",
        headerBgColor: "#5B50FF",
      }),
    );
    expect(m.launchBrowser).toHaveBeenCalledTimes(1);
  });
});
