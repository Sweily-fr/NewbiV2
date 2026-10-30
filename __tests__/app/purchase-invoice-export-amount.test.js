import { describe, it, expect } from "vitest";
import { formatExportAmount } from "@/app/dashboard/outils/factures-achat/components/export-dialog";

describe("formatExportAmount (export CSV des factures d'achat)", () => {
  it("facture en euros : le montant seul, comme avant", () => {
    expect(formatExportAmount(400, "EUR")).toBe("400.00");
    expect(formatExportAmount(65.5, undefined)).toBe("65.50");
  });

  it("facture en dollars : la devise est indiquée", () => {
    expect(formatExportAmount(120, "USD")).toBe("120.00 USD");
    expect(formatExportAmount(20, "usd")).toBe("20.00 USD");
  });

  it("montant absent : 0.00", () => {
    expect(formatExportAmount(null, "EUR")).toBe("0.00");
  });
});
