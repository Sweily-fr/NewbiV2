import * as XLSX from "xlsx";
import jsPDF from "jspdf";

// --- Helpers ---

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const STATUS_LABELS = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  OVERDUE: "En retard",
  COMPLETED: "Payee",
  CANCELED: "Annulee",
};

const CATEGORY_LABELS = {
  OFFICE_SUPPLIES: "Fournitures",
  TRAVEL: "Deplacements",
  MEALS: "Repas",
  ACCOMMODATION: "Hebergement",
  SOFTWARE: "Logiciels",
  HARDWARE: "Materiel",
  SERVICES: "Services",
  MARKETING: "Marketing",
  TAXES: "Taxes",
  RENT: "Loyer",
  UTILITIES: "Charges",
  SALARIES: "Salaires",
  INSURANCE: "Assurance",
  MAINTENANCE: "Maintenance",
  TRAINING: "Formation",
  SUBSCRIPTIONS: "Abonnements",
  OTHER: "Autre",
};

const PAYMENT_LABELS = {
  BANK_TRANSFER: "Virement",
  CHECK: "Cheque",
  CASH: "Especes",
  CARD: "Carte",
  CREDIT_CARD: "Carte credit",
  PAYPAL: "PayPal",
  OTHER: "Autre",
};

const CLIENT_TYPE_LABELS = {
  COMPANY: "Entreprise",
  INDIVIDUAL: "Particulier",
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Data builders ---

function buildSyntheseRows(data) {
  const { kpi } = data;
  return [
    { Indicateur: "CA HT net", Valeur: kpi.netRevenueHT },
    { Indicateur: "Depenses HT", Valeur: kpi.totalExpensesHT },
    { Indicateur: "Marge brute", Valeur: kpi.grossMargin },
    { Indicateur: "Taux de marge (%)", Valeur: kpi.grossMarginRate },
    { Indicateur: "Factures emises", Valeur: kpi.invoiceCount },
    { Indicateur: "Panier moyen HT", Valeur: kpi.averageInvoiceHT },
    { Indicateur: "Taux de recouvrement (%)", Valeur: kpi.collectionRate },
    { Indicateur: "DSO (jours)", Valeur: kpi.dso },
    { Indicateur: "Avoirs HT", Valeur: kpi.creditNoteTotalHT },
    { Indicateur: "Nombre de clients", Valeur: kpi.activeClientCount },
    { Indicateur: "Conversion devis (%)", Valeur: kpi.quoteConversionRate },
    { Indicateur: "Concentration top 3 (%)", Valeur: kpi.topClientConcentration },
  ];
}

function buildMonthlyRows(data) {
  return (data.monthlyRevenue || []).map((m) => ({
    Mois: m.month,
    "CA HT": m.revenueHT,
    "CA HT net": m.netRevenueHT,
    "CA TTC": m.revenueTTC,
    TVA: m.revenueVAT,
    "Depenses TTC": m.expenseAmount,
    "Depenses HT": m.expenseAmountHT,
    "TVA depenses": m.expenseVAT,
    "Marge brute": m.grossMargin,
    "Taux marge (%)": m.grossMarginRate,
    "Avoirs HT": m.creditNoteHT,
    "Nb factures": m.invoiceCount,
    "Nb depenses": m.expenseCount,
  }));
}

function buildClientRows(data) {
  return (data.revenueByClient || []).map((c) => ({
    Client: c.clientName,
    Type: CLIENT_TYPE_LABELS[c.clientType] || c.clientType || "",
    "CA HT": c.totalHT,
    "CA TTC": c.totalTTC,
    TVA: c.totalVAT,
    "Nb factures": c.invoiceCount,
    "Panier moyen": c.averageInvoiceHT,
  }));
}

function buildProductRows(data) {
  return (data.revenueByProduct || []).map((p) => ({
    Description: p.description,
    "CA HT": p.totalHT,
    "Quantite vendue": p.totalQuantity,
    "Nb factures": p.invoiceCount,
    "Prix moyen": p.averageUnitPrice,
  }));
}

function buildExpenseRows(data) {
  return (data.expenseByCategory || []).map((e) => ({
    Categorie: CATEGORY_LABELS[e.category] || e.category,
    Montant: e.amount,
    Nombre: e.count,
  }));
}

function buildStatusRows(data) {
  return (data.statusBreakdown || []).map((s) => ({
    Statut: STATUS_LABELS[s.status] || s.status,
    "Montant TTC": s.totalTTC,
    Nombre: s.count,
  }));
}

function buildPaymentRows(data) {
  return (data.paymentMethodStats || []).map((p) => ({
    Methode: PAYMENT_LABELS[p.method] || p.method,
    "Total TTC": p.totalTTC,
    Nombre: p.count,
  }));
}

function buildOverdueRows(data) {
  const invoices = data.collection?.overdueInvoices || [];
  return invoices.map((inv) => ({
    Facture: inv.invoiceNumber,
    Client: inv.clientName,
    "Montant TTC": inv.totalTTC,
    Echeance: inv.dueDate,
    "Jours retard": inv.daysOverdue,
  }));
}

function buildCollectionRows(data) {
  const collection = data.collection?.monthlyCollection || [];
  return collection.map((m) => ({
    Mois: m.month,
    "Facture TTC": m.invoicedTTC,
    "Encaisse TTC": m.collectedTTC,
    "Nb facturees": m.invoicedCount,
    "Nb encaissees": m.collectedCount,
  }));
}

function getSheets(data, tab) {
  const sheets = {};

  if (tab === "all" || tab === "synthese") {
    sheets["KPI"] = buildSyntheseRows(data);
    sheets["Evolution mensuelle"] = buildMonthlyRows(data);
  }
  if (tab === "all" || tab === "rentabilite") {
    sheets["Produits"] = buildProductRows(data);
    sheets["Depenses par categorie"] = buildExpenseRows(data);
  }
  if (tab === "all" || tab === "tresorerie") {
    sheets["Statuts factures"] = buildStatusRows(data);
    sheets["Factures en retard"] = buildOverdueRows(data);
    sheets["Recouvrement mensuel"] = buildCollectionRows(data);
  }
  if (tab === "all" || tab === "commercial") {
    sheets["Clients"] = buildClientRows(data);
  }
  if (tab === "all" || tab === "detail") {
    sheets["Methodes paiement"] = buildPaymentRows(data);
  }

  return sheets;
}

// --- CSV Export ---

export function exportAnalyticsCSV(data, tab, period) {
  const sheets = getSheets(data, tab);
  const lines = [];

  // BOM for Excel UTF-8 compat
  for (const [sheetName, rows] of Object.entries(sheets)) {
    if (lines.length > 0) lines.push(""); // blank separator
    lines.push(sheetName);

    if (rows.length === 0) {
      lines.push("Aucune donnee");
      continue;
    }

    const headers = Object.keys(rows[0]);
    lines.push(headers.join(";"));
    for (const row of rows) {
      lines.push(
        headers
          .map((h) => {
            const val = row[h];
            if (typeof val === "number") return val.toString().replace(".", ",");
            return `"${(val || "").toString().replace(/"/g, '""')}"`;
          })
          .join(";")
      );
    }
  }

  const bom = "\uFEFF";
  const content = bom + lines.join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `analytiques_${period}.csv`);
}

// --- Excel Export ---

export function exportAnalyticsExcel(data, tab, period) {
  const sheets = getSheets(data, tab);
  const wb = XLSX.utils.book_new();

  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Info: "Aucune donnee" }]);
    // Truncate sheet name to 31 chars (Excel limit)
    const sheetName = name.length > 31 ? name.substring(0, 31) : name;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  XLSX.writeFile(wb, `analytiques_${period}.xlsx`);
}

// --- PDF Export ---

export function exportAnalyticsPDF(data, tab, period) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const sheets = getSheets(data, tab);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  pdf.setFontSize(16);
  pdf.text("Analytiques financieres", margin, y);
  y += 6;
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Periode : ${period.replace(/_/g, " ")}`, margin, y);
  pdf.setTextColor(0);
  y += 10;

  let isFirstSheet = true;

  for (const [sheetName, rows] of Object.entries(sheets)) {
    if (!isFirstSheet) {
      pdf.addPage();
      y = 20;
    }
    isFirstSheet = false;

    pdf.setFontSize(13);
    pdf.text(sheetName, margin, y);
    y += 8;

    if (rows.length === 0) {
      pdf.setFontSize(10);
      pdf.text("Aucune donnee", margin, y);
      y += 8;
      continue;
    }

    const headers = Object.keys(rows[0]);
    const colCount = headers.length;
    const colWidth = Math.min(
      (pageWidth - margin * 2) / colCount,
      50
    );

    // Header row
    pdf.setFontSize(8);
    pdf.setFont(undefined, "bold");
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y - 4, colCount * colWidth, 6, "F");
    headers.forEach((h, i) => {
      pdf.text(h, margin + i * colWidth + 2, y);
    });
    pdf.setFont(undefined, "normal");
    y += 6;

    // Data rows
    for (const row of rows) {
      if (y > pdf.internal.pageSize.getHeight() - 15) {
        pdf.addPage();
        y = 20;
        // Re-print header
        pdf.setFont(undefined, "bold");
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, y - 4, colCount * colWidth, 6, "F");
        headers.forEach((h, i) => {
          pdf.text(h, margin + i * colWidth + 2, y);
        });
        pdf.setFont(undefined, "normal");
        y += 6;
      }

      headers.forEach((h, i) => {
        const val = row[h];
        let display;
        if (typeof val === "number") {
          display = new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(val);
        } else {
          display = (val || "").toString();
        }
        // Truncate to fit column
        if (display.length > Math.floor(colWidth / 2)) {
          display = display.substring(0, Math.floor(colWidth / 2) - 1) + "...";
        }
        pdf.text(display, margin + i * colWidth + 2, y);
      });
      y += 5;
    }
  }

  pdf.save(`analytiques_${period}.pdf`);
}
