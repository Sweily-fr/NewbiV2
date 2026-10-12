/**
 * Aller-retour avec la vraie librairie xlsx (SheetJS), sans mock : les autres
 * tests la simulent. Couvre nos deux usages, l'export (json_to_sheet puis
 * writeFile côté navigateur) et l'import de clients (parseExcelRaw), pour
 * détecter une régression lors d'une montée de version de SheetJS.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as XLSX from "xlsx";
import { exportAnalyticsExcel } from "@/src/utils/analytics-export";
import { parseExcelRaw } from "@/src/utils/client-import";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// writeFile, dans le navigateur, crée un Blob, l'expose via
// URL.createObjectURL puis clique sur un lien de téléchargement : on capture
// le Blob au passage au lieu de télécharger.
let downloads;
let originalCreateObjectURL;
let originalRevokeObjectURL;

beforeEach(() => {
  downloads = [];
  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn((blob) => {
    downloads.push(blob);
    return `blob:test-${downloads.length}`;
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  vi.restoreAllMocks();
});

async function lastDownloadAsWorkbook() {
  expect(downloads.length).toBeGreaterThan(0);
  const buffer = await downloads.at(-1).arrayBuffer();
  return XLSX.read(new Uint8Array(buffer), { type: "array" });
}

async function lastDownloadAsFile(name) {
  const buffer = await downloads.at(-1).arrayBuffer();
  return new File([buffer], name, { type: XLSX_MIME });
}

describe("xlsx réel : export", () => {
  it("exportAnalyticsExcel produit un classeur lisible avec une feuille par section", async () => {
    await exportAnalyticsExcel(
      {
        kpi: { netRevenueHT: 1234.5, invoiceCount: 3 },
        monthlyRevenue: [{ month: "2026-01", revenueHT: 1000 }],
        revenueByClient: [
          { clientName: "Café Dupré", totalHT: 500, invoiceCount: 1 },
        ],
        revenueByProduct: [],
        expenseByCategory: [],
        statusBreakdown: [],
        paymentMethodStats: [],
        collection: { overdueInvoices: [], monthlyCollection: [] },
      },
      "all",
      "2026-T1",
    );

    const wb = await lastDownloadAsWorkbook();
    expect(wb.SheetNames).toEqual(
      expect.arrayContaining(["KPI", "Evolution mensuelle", "Clients"]),
    );
    const clients = XLSX.utils.sheet_to_json(wb.Sheets.Clients, { header: 1 });
    expect(clients.flat()).toContain("Café Dupré");
    // Section vide : ligne de remplacement plutôt qu'une feuille vide
    const produits = XLSX.utils.sheet_to_json(wb.Sheets.Produits);
    expect(produits).toEqual([{ Info: "Aucune donnee" }]);
  });

  it("export de dépenses relu par l'import : accents, dates texte et montants conservés", async () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Date: "15/10/2026",
        Description: "Déjeuner & réunion",
        Catégorie: "Repas",
        Montant: -42.5,
        Devise: "EUR",
      },
      {
        Date: "01/01/2026",
        Description: "Virement reçu",
        Catégorie: "",
        Montant: 1200,
        Devise: "EUR",
      },
    ]);
    ws["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dépenses");
    XLSX.writeFile(wb, "depenses_test.xlsx");

    const reread = await lastDownloadAsWorkbook();
    expect(reread.SheetNames).toEqual(["Dépenses"]);

    const { headers, rows } = await parseExcelRaw(
      await lastDownloadAsFile("depenses_test.xlsx"),
    );
    expect(headers).toEqual([
      "Date",
      "Description",
      "Catégorie",
      "Montant",
      "Devise",
    ]);
    expect(rows).toEqual([
      ["15/10/2026", "Déjeuner & réunion", "Repas", "-42.5", "EUR"],
      ["01/01/2026", "Virement reçu", "", "1200", "EUR"],
    ]);
  });
});

describe("xlsx réel : import de clients (parseExcelRaw)", () => {
  function clientFile(aoa, name = "clients.xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Clients");
    const data = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    return new File([data], name, { type: XLSX_MIME });
  }

  it("lit la première feuille, complète les cellules vides et convertit les nombres en texte", async () => {
    const { headers, rows } = await parseExcelRaw(
      clientFile([
        ["  Nom  ", "Email", "Code postal", "SIRET", "Ville"],
        ["Société Élan", "contact@elan.fr", 75001, 12345678901234, "Paris"],
        ["Jean Müller", "", 69002, "", "Lyon"],
      ]),
    );
    expect(headers).toEqual(["Nom", "Email", "Code postal", "SIRET", "Ville"]);
    expect(rows).toEqual([
      ["Société Élan", "contact@elan.fr", "75001", "12345678901234", "Paris"],
      ["Jean Müller", "", "69002", "", "Lyon"],
    ]);
  });

  it("refuse un fichier sans ligne de données", async () => {
    await expect(parseExcelRaw(clientFile([["Nom", "Email"]]))).rejects.toThrow(
      "au moins un en-tête et une ligne de données",
    );
  });

  it("refuse un fichier qui n'est pas un classeur", async () => {
    const file = new File(
      [new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2])],
      "faux.xlsx",
      {
        type: XLSX_MIME,
      },
    );
    await expect(parseExcelRaw(file)).rejects.toThrow(
      "Erreur lors de la lecture du fichier Excel.",
    );
  });
});
