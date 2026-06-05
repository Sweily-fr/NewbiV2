import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Le générateur Factur-X est chargé en import dynamique par build-document-pdf
// (uniquement pour les avoirs) → on le mocke.
vi.mock("@/src/utils/facturx-generator", () => ({
  generateFacturXXML: vi.fn(() => "<rsm:CrossIndustryInvoice/>"),
  validateFacturXData: vi.fn(() => ({ isValid: true, errors: [] })),
}));

import { buildDocumentPdfFile } from "@/src/utils/build-document-pdf";
import {
  generateFacturXXML,
  validateFacturXData,
} from "@/src/utils/facturx-generator";

// Réponses fetch factices
const pdfOk = () => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new Uint8Array([37, 80, 68, 70]).buffer, // %PDF
});
const facturxOk = (over = {}) => ({
  ok: true,
  status: 200,
  json: async () => ({ success: true, pdfBase64: btoa("pdfa3"), ...over }),
});

beforeEach(() => {
  vi.clearAllMocks();
  validateFacturXData.mockReturnValue({ isValid: true, errors: [] });
  generateFacturXXML.mockReturnValue("<rsm:CrossIndustryInvoice/>");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildDocumentPdfFile — devis & bons de commande (PDF simple)", () => {
  it("génère un PDF simple pour un devis, sans Factur-X", async () => {
    const fetchMock = vi.fn().mockResolvedValue(pdfOk());
    vi.stubGlobal("fetch", fetchMock);

    const file = await buildDocumentPdfFile(
      { id: "q1", number: "0001" },
      "quote",
    );

    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe("application/pdf");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/quotes/generate-pdf");
    expect(JSON.parse(opts.body)).toEqual({ quoteId: "q1" });
    expect(generateFacturXXML).not.toHaveBeenCalled();
  });

  it("utilise purchaseOrderId et _id en repli pour un bon de commande", async () => {
    const fetchMock = vi.fn().mockResolvedValue(pdfOk());
    vi.stubGlobal("fetch", fetchMock);

    await buildDocumentPdfFile({ _id: "po1" }, "purchaseOrder");

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/purchase-orders/generate-pdf");
    expect(JSON.parse(opts.body)).toEqual({ purchaseOrderId: "po1" });
  });
});

describe("buildDocumentPdfFile — avoirs (Factur-X)", () => {
  it("embarque le XML Factur-X pour un avoir", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(pdfOk()) // /api/credit-notes/generate-pdf
      .mockResolvedValueOnce(facturxOk()); // /api/generate-facturx
    vi.stubGlobal("fetch", fetchMock);

    const file = await buildDocumentPdfFile(
      { id: "cn1", number: "AV-1" },
      "creditNote",
    );

    expect(file).toBeInstanceOf(File);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/credit-notes/generate-pdf");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/generate-facturx");
    expect(generateFacturXXML).toHaveBeenCalledWith(
      expect.any(Object),
      "creditNote",
    );
  });

  it("retombe sur le PDF simple si les données Factur-X sont invalides", async () => {
    validateFacturXData.mockReturnValue({ isValid: false, errors: ["x"] });
    const fetchMock = vi.fn().mockResolvedValue(pdfOk());
    vi.stubGlobal("fetch", fetchMock);

    const file = await buildDocumentPdfFile({ id: "cn2" }, "creditNote");

    expect(file).toBeInstanceOf(File);
    expect(fetchMock).toHaveBeenCalledTimes(1); // pas d'appel generate-facturx
    expect(fetchMock.mock.calls[0][0]).toBe("/api/credit-notes/generate-pdf");
  });
});

describe("buildDocumentPdfFile — robustesse (non bloquant)", () => {
  it("renvoie null si la génération PDF échoue (HTTP non ok)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);
    expect(await buildDocumentPdfFile({ id: "q1" }, "quote")).toBeNull();
  });

  it("renvoie null pour un type de document inconnu", async () => {
    expect(await buildDocumentPdfFile({ id: "x" }, "unknown")).toBeNull();
  });

  it("renvoie null si le document n'a pas d'id", async () => {
    expect(await buildDocumentPdfFile({ number: "1" }, "quote")).toBeNull();
  });
});
