import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Filtre les devis selon une plage de dates
 * @param {Array} quotes - Liste des devis
 * @param {Object} dateRange - Objet avec from et to (dates)
 * @returns {Array} - Devis filtrés
 */
export function filterQuotesByDateRange(quotes, dateRange) {
  if (!dateRange || (!dateRange.from && !dateRange.to)) {
    return quotes;
  }

  return quotes.filter((quote) => {
    if (!quote.issueDate) {
      return false;
    }

    let quoteDate;
    let timestamp = quote.issueDate;
    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      timestamp = parseInt(timestamp, 10);
    }

    if (typeof timestamp === 'number') {
      const asIs = new Date(timestamp);
      const divided = new Date(timestamp / 1000);
      const multiplied = new Date(timestamp * 1000);

      if (!isNaN(asIs.getTime()) && asIs.getFullYear() >= 2020 && asIs.getFullYear() <= 2100) {
        quoteDate = asIs;
      } else if (!isNaN(divided.getTime()) && divided.getFullYear() >= 2020 && divided.getFullYear() <= 2100) {
        quoteDate = divided;
      } else if (!isNaN(multiplied.getTime()) && multiplied.getFullYear() >= 2020 && multiplied.getFullYear() <= 2100) {
        quoteDate = multiplied;
      } else {
        return false;
      }
    } else if (typeof timestamp === 'string') {
      quoteDate = new Date(timestamp);
    } else {
      quoteDate = new Date(timestamp);
    }

    if (isNaN(quoteDate.getTime())) {
      return false;
    }

    quoteDate.setHours(0, 0, 0, 0);

    if (dateRange.from && !dateRange.to) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      return quoteDate >= fromDate;
    }

    if (!dateRange.from && dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      return quoteDate <= toDate;
    }

    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);

    return quoteDate >= fromDate && quoteDate <= toDate;
  });
}

/**
 * Convertit un timestamp en Date
 */
function convertToDate(dateValue) {
  if (!dateValue) return null;

  let timestamp = dateValue;
  if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
    timestamp = parseInt(timestamp, 10);
  }

  if (typeof timestamp === 'number') {
    const asIs = new Date(timestamp);
    const divided = new Date(timestamp / 1000);
    const multiplied = new Date(timestamp * 1000);

    if (!isNaN(asIs.getTime()) && asIs.getFullYear() >= 2020 && asIs.getFullYear() <= 2100) {
      return asIs;
    } else if (!isNaN(divided.getTime()) && divided.getFullYear() >= 2020 && divided.getFullYear() <= 2100) {
      return divided;
    } else if (!isNaN(multiplied.getTime()) && multiplied.getFullYear() >= 2020 && multiplied.getFullYear() <= 2100) {
      return multiplied;
    }
    return null;
  }

  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formate un devis pour l'export
 */
function formatQuoteForExport(quote) {
  const issueDate = convertToDate(quote.issueDate);
  const validUntil = convertToDate(quote.validUntil);
  const createdAt = convertToDate(quote.createdAt);

  return {
    "Numéro": quote.prefix
      ? `${quote.prefix}${quote.number}`
      : (quote.number || ""),

    "Client": quote.client?.name || "",
    "Email client": quote.client?.email || "",
    "SIRET client": quote.client?.siret || "",
    "N° TVA client": quote.client?.vatNumber || "",
    "Type client": quote.client?.type === "COMPANY" ? "Entreprise" : "Particulier",

    "Date d'émission": issueDate
      ? format(issueDate, "dd/MM/yyyy", { locale: fr })
      : "",
    "Date de validité": validUntil
      ? format(validUntil, "dd/MM/yyyy", { locale: fr })
      : "",
    "Date de création": createdAt
      ? format(createdAt, "dd/MM/yyyy HH:mm", { locale: fr })
      : "",

    "Total HT (€)": formatAmount(quote.finalTotalHT),
    "Total TVA (€)": formatAmount(quote.finalTotalVAT),
    "Total TTC (€)": formatAmount(quote.finalTotalTTC),
    "Remise (%)": quote.discountType === "PERCENTAGE" ? formatAmount(quote.discount) : "",
    "Remise (€)": quote.discountType === "FIXED" ? formatAmount(quote.discount) : "",
    "Montant remise (€)": formatAmount(quote.discountAmount),

    "Statut": getStatusLabel(quote.status),

    "Adresse client": formatAddress(quote.client?.address),
    "Code postal client": quote.client?.address?.postalCode || "",
    "Ville client": quote.client?.address?.city || "",
    "Pays client": quote.client?.address?.country || "",
  };
}

function formatAddress(address) {
  if (!address) return "";
  const parts = [
    address.street,
    address.postalCode,
    address.city,
    address.country
  ].filter(Boolean);
  return parts.join(", ");
}

function formatAmount(amount) {
  if (amount === null || amount === undefined || amount === "") return "0.00";
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0.00";
  return numAmount.toFixed(2);
}

function getStatusLabel(status) {
  const labels = {
    DRAFT: "Brouillon",
    SENT: "Envoyé",
    ACCEPTED: "Accepté",
    CANCELED: "Annulé",
  };
  return labels[status] || status;
}

/**
 * Exporte les devis au format CSV
 */
export function exportToCSV(quotes, dateRange = null) {
  const filteredQuotes = dateRange
    ? filterQuotesByDateRange(quotes, dateRange)
    : quotes;

  if (filteredQuotes.length === 0) {
    const totalQuotes = quotes.length;
    const dateInfo = dateRange?.from && dateRange?.to
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";

    throw new Error(
      `Aucun devis à exporter ${dateInfo}. ${totalQuotes} devis au total dans le système.`
    );
  }

  const formattedData = filteredQuotes.map(formatQuoteForExport);
  const headers = Object.keys(formattedData[0]);
  const csvContent = [
    headers.join(";"),
    ...formattedData.map((row) =>
      headers.map((header) => {
        const value = row[header] || "";
        if (value.toString().includes(";") || value.toString().includes('"')) {
          return `"${value.toString().replace(/"/g, '""')}"`;
        }
        return value;
      }).join(";")
    ),
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = generateFilename("csv", dateRange);
  downloadBlob(blob, filename);
}

/**
 * Exporte les devis au format Excel (HTML table)
 */
export function exportToExcel(quotes, dateRange = null) {
  const filteredQuotes = dateRange
    ? filterQuotesByDateRange(quotes, dateRange)
    : quotes;

  if (filteredQuotes.length === 0) {
    const totalQuotes = quotes.length;
    const dateInfo = dateRange?.from && dateRange?.to
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";

    throw new Error(
      `Aucun devis à exporter ${dateInfo}. ${totalQuotes} devis au total dans le système.`
    );
  }

  const formattedData = filteredQuotes.map(formatQuoteForExport);
  const headers = Object.keys(formattedData[0]);
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Devis</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map((header) => `<th>${header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${formattedData
              .map(
                (row) =>
                  `<tr>${headers
                    .map((header) => `<td>${row[header] || ""}</td>`)
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" });
  const filename = generateFilename("xls", dateRange);
  downloadBlob(blob, filename);
}

/**
 * Exporte les devis au format FEC
 */
export function exportToFEC(quotes, dateRange = null) {
  const filteredQuotes = dateRange
    ? filterQuotesByDateRange(quotes, dateRange)
    : quotes;

  if (filteredQuotes.length === 0) {
    const totalQuotes = quotes.length;
    const dateInfo = dateRange?.from && dateRange?.to
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";

    throw new Error(
      `Aucun devis à exporter ${dateInfo}. ${totalQuotes} devis au total dans le système.`
    );
  }

  const entries = [];
  let ecritureCounter = 1;

  filteredQuotes.forEach((quote) => {
    const issueDate = convertToDate(quote.issueDate);
    const createdAt = convertToDate(quote.createdAt);
    if (!issueDate) return;

    const dateStr = format(issueDate, "yyyyMMdd");
    const validDateStr = createdAt ? format(createdAt, "yyyyMMdd") : dateStr;
    const quoteNumber = sanitizeFECField(quote.prefix ? `${quote.prefix}${quote.number}` : quote.number);
    const clientName = sanitizeFECField(quote.client?.name || "Client inconnu");
    const totalTTC = parseFloat(quote.finalTotalTTC) || 0;

    const ecritureNum = `VTE${String(ecritureCounter).padStart(8, '0')}`;

    entries.push({
      JournalCode: "VTE",
      JournalLib: "Ventes",
      EcritureNum: ecritureNum,
      EcritureDate: dateStr,
      CompteNum: "411000",
      CompteLib: "Clients",
      CompAuxNum: quote.client?.siret || quoteNumber,
      CompAuxLib: clientName,
      PieceRef: quoteNumber,
      PieceDate: dateStr,
      EcritureLib: sanitizeFECField(`Devis ${quoteNumber} - ${clientName}`),
      Debit: formatFECAmount(totalTTC),
      Credit: formatFECAmount(0),
      EcritureLet: "",
      DateLet: "",
      ValidDate: validDateStr,
      Montantdevise: "",
      Idevise: ""
    });

    if (quote.items && quote.items.length > 0) {
      const itemsByVatRate = {};

      quote.items.forEach((item) => {
        const vatRate = item.vatRate || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const itemDiscount = parseFloat(item.discount) || 0;

        let lineHT = quantity * unitPrice;

        if (itemDiscount > 0) {
          if (item.discountType === "PERCENTAGE") {
            lineHT = lineHT * (1 - itemDiscount / 100);
          } else {
            lineHT = lineHT - itemDiscount;
          }
        }

        if (!itemsByVatRate[vatRate]) {
          itemsByVatRate[vatRate] = { totalHT: 0, items: [] };
        }

        itemsByVatRate[vatRate].totalHT += lineHT;
        itemsByVatRate[vatRate].items.push({ description: item.description, amount: lineHT });
      });

      const totalHTBeforeDiscount = Object.values(itemsByVatRate).reduce((sum, group) => sum + group.totalHT, 0);
      const globalDiscountAmount = parseFloat(quote.discountAmount) || 0;

      Object.entries(itemsByVatRate).forEach(([vatRate, group]) => {
        let finalHT = group.totalHT;

        if (globalDiscountAmount > 0 && totalHTBeforeDiscount > 0) {
          const proportion = group.totalHT / totalHTBeforeDiscount;
          finalHT = finalHT - (globalDiscountAmount * proportion);
        }

        if (finalHT > 0) {
          entries.push({
            JournalCode: "VTE",
            JournalLib: "Ventes",
            EcritureNum: ecritureNum,
            EcritureDate: dateStr,
            CompteNum: "706000",
            CompteLib: "Prestations de services",
            CompAuxNum: "",
            CompAuxLib: "",
            PieceRef: quoteNumber,
            PieceDate: dateStr,
            EcritureLib: sanitizeFECField(`${clientName} - TVA ${vatRate}%`),
            Debit: formatFECAmount(0),
            Credit: formatFECAmount(finalHT),
            EcritureLet: "",
            DateLet: "",
            ValidDate: validDateStr,
            Montantdevise: "",
            Idevise: ""
          });

          const vatAmount = finalHT * (parseFloat(vatRate) / 100);
          if (vatAmount > 0) {
            const vatAccount = getVATAccount(parseFloat(vatRate));
            entries.push({
              JournalCode: "VTE",
              JournalLib: "Ventes",
              EcritureNum: ecritureNum,
              EcritureDate: dateStr,
              CompteNum: vatAccount,
              CompteLib: sanitizeFECField(`TVA collectée ${vatRate}%`),
              CompAuxNum: "",
              CompAuxLib: "",
              PieceRef: quoteNumber,
              PieceDate: dateStr,
              EcritureLib: sanitizeFECField(`${clientName} - TVA ${vatRate}%`),
              Debit: formatFECAmount(0),
              Credit: formatFECAmount(vatAmount),
              EcritureLet: "",
              DateLet: "",
              ValidDate: validDateStr,
              Montantdevise: "",
              Idevise: ""
            });
          }
        }
      });
    } else {
      const totalHT = parseFloat(quote.finalTotalHT) || 0;
      const totalTVA = parseFloat(quote.finalTotalVAT) || 0;

      if (totalHT > 0) {
        entries.push({
          JournalCode: "VTE",
          JournalLib: "Ventes",
          EcritureNum: ecritureNum,
          EcritureDate: dateStr,
          CompteNum: "706000",
          CompteLib: "Prestations de services",
          CompAuxNum: "",
          CompAuxLib: "",
          PieceRef: quoteNumber,
          PieceDate: dateStr,
          EcritureLib: sanitizeFECField(`Devis ${quoteNumber} - ${clientName}`),
          Debit: formatFECAmount(0),
          Credit: formatFECAmount(totalHT),
          EcritureLet: "",
          DateLet: "",
          ValidDate: validDateStr,
          Montantdevise: "",
          Idevise: ""
        });
      }

      if (totalTVA > 0) {
        entries.push({
          JournalCode: "VTE",
          JournalLib: "Ventes",
          EcritureNum: ecritureNum,
          EcritureDate: dateStr,
          CompteNum: "445710",
          CompteLib: "TVA collectée",
          CompAuxNum: "",
          CompAuxLib: "",
          PieceRef: quoteNumber,
          PieceDate: dateStr,
          EcritureLib: sanitizeFECField(`Devis ${quoteNumber} - ${clientName}`),
          Debit: formatFECAmount(0),
          Credit: formatFECAmount(totalTVA),
          EcritureLet: "",
          DateLet: "",
          ValidDate: validDateStr,
          Montantdevise: "",
          Idevise: ""
        });
      }
    }

    ecritureCounter++;
  });

  const headers = [
    "JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib",
    "CompAuxNum", "CompAuxLib", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
    "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise"
  ];

  const fecContent = entries.map(entry =>
    headers.map(h => entry[h] || "").join("|")
  ).join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + fecContent], { type: "text/plain;charset=utf-8;" });
  const filename = generateFilename("txt", dateRange, "FEC");
  downloadBlob(blob, filename);
}

function sanitizeFECField(value, maxLength = 255) {
  if (!value) return "";
  return String(value)
    .replace(/[\r\n\t]/g, " ")
    .replace(/\|/g, "-")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .substring(0, maxLength)
    .trim();
}

function formatFECAmount(amount) {
  if (!amount || amount === 0) return "0.00";
  return amount.toFixed(2);
}

function getVATAccount(vatRate) {
  if (vatRate === 20) return "445710";
  if (vatRate === 10) return "445711";
  if (vatRate === 5.5) return "445712";
  if (vatRate === 2.1) return "445713";
  if (vatRate === 0) return "445714";
  return "445710";
}

function sanitizeSageField(value) {
  if (!value) return "";
  return String(value)
    .replace(/[\r\n\t]/g, " ")
    .replace(/;/g, ",")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .substring(0, 100)
    .trim();
}

/**
 * Exporte les devis au format Sage Compta
 */
export function exportToSage(quotes, dateRange = null) {
  const filteredQuotes = dateRange
    ? filterQuotesByDateRange(quotes, dateRange)
    : quotes;

  if (filteredQuotes.length === 0) {
    const totalQuotes = quotes.length;
    const dateInfo = dateRange?.from && dateRange?.to
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";

    throw new Error(
      `Aucun devis à exporter ${dateInfo}. ${totalQuotes} devis au total dans le système.`
    );
  }

  const entries = [];

  filteredQuotes.forEach((quote) => {
    const issueDate = convertToDate(quote.issueDate);
    if (!issueDate) return;

    const dateStr = format(issueDate, "ddMMyyyy");
    const quoteNumber = sanitizeSageField(quote.prefix ? `${quote.prefix}${quote.number}` : quote.number);
    const clientName = sanitizeSageField(quote.client?.name || "Client inconnu");
    const clientCode = sanitizeSageField(quote.client?.siret || quoteNumber);
    const totalTTC = parseFloat(quote.finalTotalTTC) || 0;

    entries.push([
      "VTE", dateStr, "411000", clientCode,
      sanitizeSageField(`${clientName} - ${quoteNumber}`),
      formatFECAmount(totalTTC), formatFECAmount(0), "", quoteNumber
    ].join(";"));

    if (quote.items && quote.items.length > 0) {
      const itemsByVatRate = {};

      quote.items.forEach((item) => {
        const vatRate = item.vatRate || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const itemDiscount = parseFloat(item.discount) || 0;

        let lineHT = quantity * unitPrice;
        if (itemDiscount > 0) {
          if (item.discountType === "PERCENTAGE") {
            lineHT = lineHT * (1 - itemDiscount / 100);
          } else {
            lineHT = lineHT - itemDiscount;
          }
        }

        if (!itemsByVatRate[vatRate]) itemsByVatRate[vatRate] = 0;
        itemsByVatRate[vatRate] += lineHT;
      });

      const totalHTBeforeDiscount = Object.values(itemsByVatRate).reduce((sum, ht) => sum + ht, 0);
      const globalDiscountAmount = parseFloat(quote.discountAmount) || 0;

      Object.entries(itemsByVatRate).forEach(([vatRate, htAmount]) => {
        let finalHT = htAmount;
        if (globalDiscountAmount > 0 && totalHTBeforeDiscount > 0) {
          const proportion = htAmount / totalHTBeforeDiscount;
          finalHT = finalHT - (globalDiscountAmount * proportion);
        }

        if (finalHT > 0) {
          entries.push([
            "VTE", dateStr, "706000", "",
            sanitizeSageField(`${clientName} - TVA ${vatRate}%`),
            formatFECAmount(0), formatFECAmount(finalHT), "", quoteNumber
          ].join(";"));

          const vatAmount = finalHT * (parseFloat(vatRate) / 100);
          if (vatAmount > 0) {
            const vatAccount = getVATAccount(parseFloat(vatRate));
            entries.push([
              "VTE", dateStr, vatAccount, "",
              sanitizeSageField(`TVA ${vatRate}% - ${quoteNumber}`),
              formatFECAmount(0), formatFECAmount(vatAmount), "", quoteNumber
            ].join(";"));
          }
        }
      });
    } else {
      const totalHT = parseFloat(quote.finalTotalHT) || 0;
      const totalTVA = parseFloat(quote.finalTotalVAT) || 0;

      if (totalHT > 0) {
        entries.push([
          "VTE", dateStr, "706000", "",
          sanitizeSageField(`Prestation - ${quoteNumber}`),
          formatFECAmount(0), formatFECAmount(totalHT), "", quoteNumber
        ].join(";"));
      }

      if (totalTVA > 0) {
        entries.push([
          "VTE", dateStr, "445710", "",
          sanitizeSageField(`TVA - ${quoteNumber}`),
          formatFECAmount(0), formatFECAmount(totalTVA), "", quoteNumber
        ].join(";"));
      }
    }
  });

  const headers = "Journal;Date;Compte;CompteAux;Libellé;Débit;Crédit;Lettrage;Pièce";
  const sageContent = [headers, ...entries].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + sageContent], { type: "text/plain;charset=utf-8;" });
  const filename = generateFilename("txt", dateRange, "Sage");
  downloadBlob(blob, filename);
}

function sanitizeCegidField(value) {
  if (!value) return "";
  return String(value)
    .replace(/[\r\n\t]/g, " ")
    .replace(/;/g, ",")
    .replace(/"/g, "'")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .substring(0, 100)
    .trim();
}

/**
 * Exporte les devis au format Cegid Expert
 */
export function exportToCegid(quotes, dateRange = null) {
  const filteredQuotes = dateRange
    ? filterQuotesByDateRange(quotes, dateRange)
    : quotes;

  if (filteredQuotes.length === 0) {
    const totalQuotes = quotes.length;
    const dateInfo = dateRange?.from && dateRange?.to
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";

    throw new Error(
      `Aucun devis à exporter ${dateInfo}. ${totalQuotes} devis au total dans le système.`
    );
  }

  const entries = [];

  filteredQuotes.forEach((quote) => {
    const issueDate = convertToDate(quote.issueDate);
    if (!issueDate) return;

    const dateStr = format(issueDate, "dd/MM/yyyy");
    const quoteNumber = sanitizeCegidField(quote.prefix ? `${quote.prefix}${quote.number}` : quote.number);
    const clientName = sanitizeCegidField(quote.client?.name || "Client inconnu");
    const clientCode = sanitizeCegidField(quote.client?.siret || "");
    const totalTTC = parseFloat(quote.finalTotalTTC) || 0;

    entries.push([
      "VTE", dateStr, quoteNumber, "411000", clientCode,
      sanitizeCegidField(`${clientName} - ${quoteNumber}`),
      formatFECAmount(totalTTC), formatFECAmount(0), "EUR"
    ].join(";"));

    if (quote.items && quote.items.length > 0) {
      const itemsByVatRate = {};

      quote.items.forEach((item) => {
        const vatRate = item.vatRate || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const itemDiscount = parseFloat(item.discount) || 0;

        let lineHT = quantity * unitPrice;
        if (itemDiscount > 0) {
          if (item.discountType === "PERCENTAGE") {
            lineHT = lineHT * (1 - itemDiscount / 100);
          } else {
            lineHT = lineHT - itemDiscount;
          }
        }

        if (!itemsByVatRate[vatRate]) itemsByVatRate[vatRate] = 0;
        itemsByVatRate[vatRate] += lineHT;
      });

      const totalHTBeforeDiscount = Object.values(itemsByVatRate).reduce((sum, ht) => sum + ht, 0);
      const globalDiscountAmount = parseFloat(quote.discountAmount) || 0;

      Object.entries(itemsByVatRate).forEach(([vatRate, htAmount]) => {
        let finalHT = htAmount;
        if (globalDiscountAmount > 0 && totalHTBeforeDiscount > 0) {
          const proportion = htAmount / totalHTBeforeDiscount;
          finalHT = finalHT - (globalDiscountAmount * proportion);
        }

        if (finalHT > 0) {
          entries.push([
            "VTE", dateStr, quoteNumber, "706000", "",
            sanitizeCegidField(`${clientName} - TVA ${vatRate}%`),
            formatFECAmount(0), formatFECAmount(finalHT), "EUR"
          ].join(";"));

          const vatAmount = finalHT * (parseFloat(vatRate) / 100);
          if (vatAmount > 0) {
            const vatAccount = getVATAccount(parseFloat(vatRate));
            entries.push([
              "VTE", dateStr, quoteNumber, vatAccount, "",
              sanitizeCegidField(`TVA ${vatRate}% - ${quoteNumber}`),
              formatFECAmount(0), formatFECAmount(vatAmount), "EUR"
            ].join(";"));
          }
        }
      });
    } else {
      const totalHT = parseFloat(quote.finalTotalHT) || 0;
      const totalTVA = parseFloat(quote.finalTotalVAT) || 0;

      if (totalHT > 0) {
        entries.push([
          "VTE", dateStr, quoteNumber, "706000", "",
          sanitizeCegidField(`Prestation - ${quoteNumber}`),
          formatFECAmount(0), formatFECAmount(totalHT), "EUR"
        ].join(";"));
      }

      if (totalTVA > 0) {
        entries.push([
          "VTE", dateStr, quoteNumber, "445710", "",
          sanitizeCegidField(`TVA - ${quoteNumber}`),
          formatFECAmount(0), formatFECAmount(totalTVA), "EUR"
        ].join(";"));
      }
    }
  });

  const headers = "CodeJournal;Date;NumPiece;CompteGeneral;CompteAuxiliaire;Libelle;Debit;Credit;Devise";
  const cegidContent = [headers, ...entries].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + cegidContent], { type: "text/csv;charset=utf-8;" });
  const filename = generateFilename("csv", dateRange, "Cegid");
  downloadBlob(blob, filename);
}

function generateFilename(extension, dateRange, prefix = "devis") {
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");

  if (dateRange?.from && dateRange?.to) {
    const fromStr = format(new Date(dateRange.from), "yyyy-MM-dd");
    const toStr = format(new Date(dateRange.to), "yyyy-MM-dd");
    return `${prefix}_${fromStr}_au_${toStr}.${extension}`;
  }

  return `${prefix}_export_${timestamp}.${extension}`;
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
