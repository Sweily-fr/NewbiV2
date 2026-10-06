import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  annexKeyBelongsTo,
  annexProxyUrl,
  appendAnnexPages,
  formatAnnexSummary,
  getOrganizationAnnex,
  normalizeAnnex,
  serializeOrganizationAnnex,
  toAnnexInput,
  uint8ArrayToBase64,
} from "@/src/utils/document-annex";

const WS = "a".repeat(24);
const KEY = `annexes/${WS}/3f1c2b9a-1d2e-4f5a-8b6c-7d8e9f0a1b2c.pdf`;

async function makePdf(pages, size = [595, 842]) {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pages; i += 1) pdf.addPage(size);
  return pdf.save();
}

describe("document-annex", () => {
  it("ajoute les pages de l'annexe à la fin du PDF", async () => {
    const merged = await appendAnnexPages(
      await makePdf(2),
      await makePdf(3, [612, 792]),
    );
    const result = await PDFDocument.load(merged);
    expect(result.getPageCount()).toBe(5);
    // Les pages d'annexe gardent leur format (ici US Letter)
    expect(result.getPage(4).getSize()).toEqual({ width: 612, height: 792 });
    expect(result.getPage(0).getSize()).toEqual({ width: 595, height: 842 });
  });

  it("normalise l'annexe (document, GraphQL ou JSON de l'organisation)", () => {
    const annex = {
      __typename: "DocumentAnnex",
      key: KEY,
      fileName: "CGV.pdf",
      size: 2048,
      pageCount: 2,
    };
    expect(normalizeAnnex(annex)).toEqual({
      key: KEY,
      fileName: "CGV.pdf",
      size: 2048,
      pageCount: 2,
    });
    expect(normalizeAnnex(JSON.stringify(annex))?.key).toBe(KEY);
    expect(normalizeAnnex({ key: "../autre.pdf" })).toBeNull();
    expect(normalizeAnnex("{oops")).toBeNull();
    expect(toAnnexInput(annex)).toEqual({
      key: KEY,
      fileName: "CGV.pdf",
      size: 2048,
      pageCount: 2,
    });
    expect(toAnnexInput(null)).toBeNull();
  });

  it("lit et enregistre l'annexe par défaut de l'organisation", () => {
    const org = {
      quoteAnnex: serializeOrganizationAnnex({ key: KEY, fileName: "CGV.pdf" }),
    };
    expect(getOrganizationAnnex(org, "quote")?.fileName).toBe("CGV.pdf");
    expect(getOrganizationAnnex(org, "invoice")).toBeNull();
    expect(serializeOrganizationAnnex(null)).toBe("");
  });

  it("contrôle l'organisation de la clé et construit l'URL du proxy", () => {
    expect(annexKeyBelongsTo(KEY, WS)).toBe(true);
    expect(annexKeyBelongsTo(KEY, "b".repeat(24))).toBe(false);
    expect(annexProxyUrl({ key: KEY })).toBe(
      `/api/document-annex/${WS}/3f1c2b9a-1d2e-4f5a-8b6c-7d8e9f0a1b2c.pdf`,
    );
  });

  it("résume l'annexe et encode en base64", () => {
    expect(formatAnnexSummary({ pageCount: 2, size: 1536 })).toBe(
      "2 pages · 2 Ko",
    );
    expect(formatAnnexSummary({ pageCount: 1, size: 1.5 * 1024 * 1024 })).toBe(
      "1 page · 1,5 Mo",
    );
    expect(uint8ArrayToBase64(new Uint8Array([104, 105]))).toBe("aGk=");
  });
});
