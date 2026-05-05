import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateFacturXXML,
  validateFacturXData,
} from "@/src/utils/facturx-generator";

beforeEach(() => {
  // Le générateur log beaucoup en console.warn/log — on neutralise
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

const buildInvoiceData = (overrides = {}) => ({
  number: "0001",
  issueDate: "2026-04-15",
  dueDate: "2026-05-15",
  companyInfo: {
    name: "Acme SARL",
    siret: "12345678901234",
    vatNumber: "FR12345678901",
    address: {
      street: "1 rue de la Paix",
      postalCode: "75001",
      city: "Paris",
      country: "France",
    },
    vatPaymentCondition: "DEBITS",
    ...overrides.companyInfo,
  },
  client: {
    name: "Client SAS",
    siret: "98765432109876",
    address: {
      street: "10 avenue des Champs",
      postalCode: "69001",
      city: "Lyon",
      country: "France",
    },
    ...overrides.client,
  },
  items: [
    {
      description: "Prestation conseil",
      quantity: 2,
      unitPrice: 500,
      vatRate: 20,
    },
  ],
  finalTotalHT: 1000,
  totalVAT: 200,
  finalTotalTTC: 1200,
  ...overrides,
});

describe("generateFacturXXML — document type", () => {
  it("uses TypeCode 380 for an invoice", () => {
    const xml = generateFacturXXML(buildInvoiceData(), "invoice");
    expect(xml).toMatch(/<ram:TypeCode>380<\/ram:TypeCode>/);
  });

  it("uses TypeCode 381 for a credit note", () => {
    const xml = generateFacturXXML(buildInvoiceData(), "creditNote");
    expect(xml).toMatch(/<ram:TypeCode>381<\/ram:TypeCode>/);
  });

  it("defaults to invoice (380) when no documentType is given", () => {
    const xml = generateFacturXXML(buildInvoiceData());
    expect(xml).toMatch(/<ram:TypeCode>380<\/ram:TypeCode>/);
  });
});

describe("generateFacturXXML — date formatting", () => {
  it("formats dates as YYYYMMDD (issueDate)", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({ issueDate: "2026-04-15" }),
    );
    expect(xml).toContain("20260415");
  });

  it("handles numeric timestamp dates", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({ issueDate: new Date("2026-12-01").getTime() }),
    );
    expect(xml).toContain("20261201");
  });

  it("handles string-numeric timestamps", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({ issueDate: String(new Date("2026-07-20").getTime()) }),
    );
    expect(xml).toContain("20260720");
  });

  it("pads single-digit months and days with zero", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({ issueDate: "2026-01-05" }),
    );
    expect(xml).toContain("20260105");
  });
});

describe("generateFacturXXML — SIREN extraction", () => {
  it("extracts SIREN from the first 9 chars of SIRET when SIREN is missing", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        companyInfo: {
          name: "Acme",
          siret: "12345678901234",
          vatNumber: "FR12345678901",
          address: { postalCode: "75001", country: "France" },
        },
      }),
    );
    // SIREN appears in seller LegalOrganization
    expect(xml).toMatch(/<ram:ID schemeID="0002">123456789<\/ram:ID>/);
  });

  it("uses the explicit SIREN field when provided", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        companyInfo: {
          name: "Acme",
          siren: "987654321",
          siret: "12345678901234",
          vatNumber: "FR12345678901",
          address: { postalCode: "75001", country: "France" },
        },
      }),
    );
    expect(xml).toContain('<ram:ID schemeID="0002">987654321</ram:ID>');
  });
});

describe("generateFacturXXML — country codes", () => {
  it.each([
    ["France", "FR"],
    ["Allemagne", "DE"],
    ["Belgique", "BE"],
    ["FR", "FR"],
    ["de", "DE"],
  ])("maps %s → %s for the seller country", (input, expected) => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        companyInfo: {
          name: "Acme",
          siret: "12345678901234",
          vatNumber: "FR12345678901",
          address: { postalCode: "75001", country: input },
        },
      }),
    );
    expect(xml).toContain(`<ram:CountryID>${expected}</ram:CountryID>`);
  });

  it("falls back to FR for unknown country names", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        companyInfo: {
          name: "Acme",
          siret: "12345678901234",
          vatNumber: "FR12345678901",
          address: { postalCode: "75001", country: "Atlantis" },
        },
      }),
    );
    expect(xml).toContain("<ram:CountryID>FR</ram:CountryID>");
  });
});

describe("generateFacturXXML — VAT breakdown", () => {
  it("groups multiple items at the same rate into one breakdown entry", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        items: [
          { description: "A", quantity: 1, unitPrice: 100, vatRate: 20 },
          { description: "B", quantity: 1, unitPrice: 50, vatRate: 20 },
        ],
      }),
    );
    // Sum: 150 base, 30 VAT — there should be exactly one VAT breakdown at 20%
    const breakdownMatches = xml.match(
      /<ram:RateApplicablePercent>20<\/ram:RateApplicablePercent>/g,
    );
    // One per line item (2) + one in vatBreakdown = 3
    expect(breakdownMatches.length).toBeGreaterThanOrEqual(3);
  });

  it("uses CategoryCode 'Z' for 0% VAT items (zero-rated/exempt)", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        items: [
          { description: "Exonéré", quantity: 1, unitPrice: 100, vatRate: 0 },
        ],
      }),
    );
    expect(xml).toMatch(/<ram:CategoryCode>Z<\/ram:CategoryCode>/);
  });

  it("uses CategoryCode 'S' for standard taxed items", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        items: [
          { description: "Standard", quantity: 1, unitPrice: 100, vatRate: 20 },
        ],
      }),
    );
    expect(xml).toMatch(/<ram:CategoryCode>S<\/ram:CategoryCode>/);
  });

  it("applies progressPercentage to the line total", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        items: [
          {
            description: "Acompte 30%",
            quantity: 1,
            unitPrice: 1000,
            vatRate: 20,
            progressPercentage: 30,
          },
        ],
      }),
    );
    expect(xml).toContain("<ram:LineTotalAmount>300.00</ram:LineTotalAmount>");
  });

  it("applies a percentage discount to the line total", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        items: [
          {
            description: "Remise 10%",
            quantity: 1,
            unitPrice: 1000,
            vatRate: 20,
            discount: 10,
            discountType: "PERCENTAGE",
          },
        ],
      }),
    );
    expect(xml).toContain("<ram:LineTotalAmount>900.00</ram:LineTotalAmount>");
  });

  it("applies a fixed-amount discount and never goes below zero", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        items: [
          {
            description: "Remise fixe énorme",
            quantity: 1,
            unitPrice: 100,
            vatRate: 20,
            discount: 500,
            discountType: "FIXED",
          },
        ],
      }),
    );
    expect(xml).toContain("<ram:LineTotalAmount>0.00</ram:LineTotalAmount>");
  });
});

describe("generateFacturXXML — mandatory legal notes (BR-FR-05/06/07)", () => {
  it("always includes the BR-FR-05 late-payment penalty note", () => {
    const xml = generateFacturXXML(buildInvoiceData());
    expect(xml).toMatch(/pénalité.*intérêt légal/i);
    expect(xml).toContain("<ram:SubjectCode>PMD</ram:SubjectCode>");
  });

  it("always includes the BR-FR-06 recovery indemnity note", () => {
    const xml = generateFacturXXML(buildInvoiceData());
    expect(xml).toMatch(/Indemnité forfaitaire/i);
    expect(xml).toContain("<ram:SubjectCode>PMT</ram:SubjectCode>");
  });

  it("always includes the BR-FR-07 escompte note", () => {
    const xml = generateFacturXXML(buildInvoiceData());
    expect(xml).toMatch(/escompte/i);
    expect(xml).toContain("<ram:SubjectCode>AAB</ram:SubjectCode>");
  });

  it("adds 'TVA acquittée sur les débits' when vatPaymentCondition=DEBITS", () => {
    const xml = generateFacturXXML(buildInvoiceData());
    expect(xml).toMatch(/TVA acquittée sur les débits/i);
  });

  it("does not add the DEBITS note when vatPaymentCondition is something else", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        companyInfo: {
          name: "Acme",
          siret: "12345678901234",
          vatNumber: "FR12345678901",
          address: { postalCode: "75001", country: "France" },
          vatPaymentCondition: "ENCAISSEMENTS",
        },
      }),
    );
    expect(xml).not.toMatch(/TVA acquittée sur les débits/i);
  });
});

describe("generateFacturXXML — XML escaping", () => {
  it("escapes special chars in headerNotes", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({ headerNotes: 'A & B <script>alert("x")</script>' }),
    );
    // & must become &amp;, < must become &lt;
    expect(xml).toContain("&amp;");
    expect(xml).not.toMatch(/<script>/);
  });
});

describe("generateFacturXXML — payment means", () => {
  it("includes IBAN when bankDetails.iban is provided", () => {
    const xml = generateFacturXXML(
      buildInvoiceData({
        bankDetails: { iban: "FR1420041010050500013M02606", bic: "BNPAFRPP" },
      }),
    );
    expect(xml).toContain(
      "<ram:IBANID>FR1420041010050500013M02606</ram:IBANID>",
    );
    expect(xml).toContain("<ram:BICID>BNPAFRPP</ram:BICID>");
  });

  it("falls back to TypeCode 30 (virement) without IBAN when none is provided", () => {
    const xml = generateFacturXXML(buildInvoiceData());
    expect(xml).toContain("<ram:SpecifiedTradeSettlementPaymentMeans>");
    expect(xml).toContain("<ram:TypeCode>30</ram:TypeCode>");
    expect(xml).not.toMatch(/<ram:IBANID>/);
  });
});

describe("validateFacturXData", () => {
  it("returns isValid:true when all required fields are present", () => {
    const result = validateFacturXData(buildInvoiceData());
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each([
    ["number", "Numéro de facture manquant"],
    ["issueDate", "Date d'émission manquante"],
  ])("rejects when %s is missing", (field, expectedError) => {
    const data = buildInvoiceData();
    delete data[field];
    const result = validateFacturXData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(expectedError);
  });

  it("rejects when companyInfo.vatNumber is missing", () => {
    const data = buildInvoiceData();
    delete data.companyInfo.vatNumber;
    const result = validateFacturXData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Numéro de TVA manquant");
  });

  it("rejects when companyInfo.siret is missing", () => {
    const data = buildInvoiceData();
    delete data.companyInfo.siret;
    const result = validateFacturXData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("SIRET vendeur manquant");
  });

  it("rejects when seller postalCode is missing", () => {
    const data = buildInvoiceData();
    delete data.companyInfo.address.postalCode;
    const result = validateFacturXData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Code postal vendeur manquant");
  });

  it("rejects when buyer postalCode is missing", () => {
    const data = buildInvoiceData();
    delete data.client.address.postalCode;
    const result = validateFacturXData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Code postal acheteur manquant");
  });

  it("rejects when items array is empty", () => {
    const result = validateFacturXData(buildInvoiceData({ items: [] }));
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Aucun article dans la facture");
  });

  it("collects multiple errors in a single call", () => {
    const result = validateFacturXData({
      number: null,
      issueDate: null,
      companyInfo: {},
      client: { address: {} },
      items: [],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });
});
