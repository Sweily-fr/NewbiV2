import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Filtre les bons de commande selon une plage de dates
 */
export function filterPurchaseOrdersByDateRange(purchaseOrders, dateRange) {
  if (!dateRange || (!dateRange.from && !dateRange.to)) {
    return purchaseOrders;
  }

  return purchaseOrders.filter((po) => {
    if (!po.issueDate) {
      return false;
    }

    let poDate;
    let timestamp = po.issueDate;
    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      timestamp = parseInt(timestamp, 10);
    }

    if (typeof timestamp === 'number') {
      const asIs = new Date(timestamp);
      const divided = new Date(timestamp / 1000);
      const multiplied = new Date(timestamp * 1000);

      if (!isNaN(asIs.getTime()) && asIs.getFullYear() >= 2020 && asIs.getFullYear() <= 2100) {
        poDate = asIs;
      } else if (!isNaN(divided.getTime()) && divided.getFullYear() >= 2020 && divided.getFullYear() <= 2100) {
        poDate = divided;
      } else if (!isNaN(multiplied.getTime()) && multiplied.getFullYear() >= 2020 && multiplied.getFullYear() <= 2100) {
        poDate = multiplied;
      } else {
        return false;
      }
    } else if (typeof timestamp === 'string') {
      poDate = new Date(timestamp);
    } else {
      poDate = new Date(timestamp);
    }

    if (isNaN(poDate.getTime())) {
      return false;
    }

    poDate.setHours(0, 0, 0, 0);

    if (dateRange.from && !dateRange.to) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      return poDate >= fromDate;
    }

    if (!dateRange.from && dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      return poDate <= toDate;
    }

    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);

    return poDate >= fromDate && poDate <= toDate;
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
 * Formate un bon de commande pour l'export
 */
function formatPurchaseOrderForExport(po) {
  const issueDate = convertToDate(po.issueDate);
  const deliveryDate = convertToDate(po.deliveryDate);
  const createdAt = convertToDate(po.createdAt);

  return {
    "Numéro": po.prefix
      ? `${po.prefix}${po.number}`
      : (po.number || ""),

    "Client": po.client?.name || "",
    "Email client": po.client?.email || "",
    "SIRET client": po.client?.siret || "",
    "N° TVA client": po.client?.vatNumber || "",
    "Type client": po.client?.type === "COMPANY" ? "Entreprise" : "Particulier",

    "Date d'émission": issueDate
      ? format(issueDate, "dd/MM/yyyy", { locale: fr })
      : "",
    "Date de livraison": deliveryDate
      ? format(deliveryDate, "dd/MM/yyyy", { locale: fr })
      : "",
    "Date de création": createdAt
      ? format(createdAt, "dd/MM/yyyy HH:mm", { locale: fr })
      : "",

    "Total HT (€)": formatAmount(po.finalTotalHT),
    "Total TVA (€)": formatAmount(po.finalTotalVAT),
    "Total TTC (€)": formatAmount(po.finalTotalTTC),
    "Remise (%)": po.discountType === "PERCENTAGE" ? formatAmount(po.discount) : "",
    "Remise (€)": po.discountType === "FIXED" ? formatAmount(po.discount) : "",
    "Montant remise (€)": formatAmount(po.discountAmount),

    "Statut": getStatusLabel(po.status),

    "Adresse client": formatAddress(po.client?.address),
    "Code postal client": po.client?.address?.postalCode || "",
    "Ville client": po.client?.address?.city || "",
    "Pays client": po.client?.address?.country || "",
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
    CONFIRMED: "Confirmé",
    IN_PROGRESS: "En cours",
    DELIVERED: "Livré",
    CANCELED: "Annulé",
  };
  return labels[status] || status;
}

/**
 * Exporte les bons de commande au format CSV
 */
export function exportToCSV(purchaseOrders, dateRange = null) {
  const filtered = dateRange
    ? filterPurchaseOrdersByDateRange(purchaseOrders, dateRange)
    : purchaseOrders;

  if (filtered.length === 0) {
    const total = purchaseOrders.length;
    const dateInfo = dateRange?.from && dateRange?.to
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";

    throw new Error(
      `Aucun bon de commande à exporter ${dateInfo}. ${total} bon(s) de commande au total dans le système.`
    );
  }

  const formattedData = filtered.map(formatPurchaseOrderForExport);
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
 * Exporte les bons de commande au format Excel (HTML table)
 */
export function exportToExcel(purchaseOrders, dateRange = null) {
  const filtered = dateRange
    ? filterPurchaseOrdersByDateRange(purchaseOrders, dateRange)
    : purchaseOrders;

  if (filtered.length === 0) {
    const total = purchaseOrders.length;
    const dateInfo = dateRange?.from && dateRange?.to
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";

    throw new Error(
      `Aucun bon de commande à exporter ${dateInfo}. ${total} bon(s) de commande au total dans le système.`
    );
  }

  const formattedData = filtered.map(formatPurchaseOrderForExport);
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
                <x:Name>Bons de commande</x:Name>
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
 * Exporte les bons de commande au format FEC
 */
export function exportToFEC(purchaseOrders, dateRange = null) {
  const filtered = dateRange
    ? filterPurchaseOrdersByDateRange(purchaseOrders, dateRange)
    : purchaseOrders;

  if (filtered.length === 0) {
    const total = purchaseOrders.length;
    const dateInfo = dateRange?.from && dateRange?.to
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";

    throw new Error(
      `Aucun bon de commande à exporter ${dateInfo}. ${total} bon(s) de commande au total dans le système.`
    );
  }

  const entries = [];
  let ecritureCounter = 1;

  filtered.forEach((po) => {
    const issueDate = convertToDate(po.issueDate);
    const createdAt = convertToDate(po.createdAt);
    if (!issueDate) return;

    const dateStr = format(issueDate, "yyyyMMdd");
    const validDateStr = createdAt ? format(createdAt, "yyyyMMdd") : dateStr;
    const poNumber = sanitizeFECField(po.prefix ? `${po.prefix}${po.number}` : po.number);
    const clientName = sanitizeFECField(po.client?.name || "Client inconnu");
    const totalTTC = parseFloat(po.finalTotalTTC) || 0;

    const ecritureNum = `VTE${String(ecritureCounter).padStart(8, '0')}`;

    entries.push({
      JournalCode: "VTE",
      JournalLib: "Ventes",
      EcritureNum: ecritureNum,
      EcritureDate: dateStr,
      CompteNum: "411000",
      CompteLib: "Clients",
      CompAuxNum: po.client?.siret || poNumber,
      CompAuxLib: clientName,
      PieceRef: poNumber,
      PieceDate: dateStr,
      EcritureLib: sanitizeFECField(`BC ${poNumber} - ${clientName}`),
      Debit: formatFECAmount(totalTTC),
      Credit: formatFECAmount(0),
      EcritureLet: "",
      DateLet: "",
      ValidDate: validDateStr,
      Montantdevise: "",
      Idevise: ""
    });

    if (po.items && po.items.length > 0) {
      const itemsByVatRate = {};

      po.items.forEach((item) => {
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
      const globalDiscountAmount = parseFloat(po.discountAmount) || 0;

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
            PieceRef: poNumber,
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
              PieceRef: poNumber,
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
      const totalHT = parseFloat(po.finalTotalHT) || 0;
      const totalTVA = parseFloat(po.finalTotalVAT) || 0;

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
          PieceRef: poNumber,
          PieceDate: dateStr,
          EcritureLib: sanitizeFECField(`BC ${poNumber} - ${clientName}`),
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
          PieceRef: poNumber,
          PieceDate: dateStr,
          EcritureLib: sanitizeFECField(`BC ${poNumber} - ${clientName}`),
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
 * Exporte les bons de commande au format Sage Compta
 */
export function exportToSage(purchaseOrders, dateRange = null) {
  const filtered = dateRange
    ? filterPurchaseOrdersByDateRange(purchaseOrders, dateRange)
    : purchaseOrders;

  if (filtered.length === 0) {
    const total = purchaseOrders.length;
    const dateInfo = dateRange?.from && dateRange?.to
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";

    throw new Error(
      `Aucun bon de commande à exporter ${dateInfo}. ${total} bon(s) de commande au total dans le système.`
    );
  }

  const entries = [];

  filtered.forEach((po) => {
    const issueDate = convertToDate(po.issueDate);
    if (!issueDate) return;

    const dateStr = format(issueDate, "ddMMyyyy");
    const poNumber = sanitizeSageField(po.prefix ? `${po.prefix}${po.number}` : po.number);
    const clientName = sanitizeSageField(po.client?.name || "Client inconnu");
    const clientCode = sanitizeSageField(po.client?.siret || poNumber);
    const totalTTC = parseFloat(po.finalTotalTTC) || 0;

    entries.push([
      "VTE", dateStr, "411000", clientCode,
      sanitizeSageField(`${clientName} - ${poNumber}`),
      formatFECAmount(totalTTC), formatFECAmount(0), "", poNumber
    ].join(";"));

    if (po.items && po.items.length > 0) {
      const itemsByVatRate = {};

      po.items.forEach((item) => {
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
      const globalDiscountAmount = parseFloat(po.discountAmount) || 0;

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
            formatFECAmount(0), formatFECAmount(finalHT), "", poNumber
          ].join(";"));

          const vatAmount = finalHT * (parseFloat(vatRate) / 100);
          if (vatAmount > 0) {
            const vatAccount = getVATAccount(parseFloat(vatRate));
            entries.push([
              "VTE", dateStr, vatAccount, "",
              sanitizeSageField(`TVA ${vatRate}% - ${poNumber}`),
              formatFECAmount(0), formatFECAmount(vatAmount), "", poNumber
            ].join(";"));
          }
        }
      });
    } else {
      const totalHT = parseFloat(po.finalTotalHT) || 0;
      const totalTVA = parseFloat(po.finalTotalVAT) || 0;

      if (totalHT > 0) {
        entries.push([
          "VTE", dateStr, "706000", "",
          sanitizeSageField(`Prestation - ${poNumber}`),
          formatFECAmount(0), formatFECAmount(totalHT), "", poNumber
        ].join(";"));
      }

      if (totalTVA > 0) {
        entries.push([
          "VTE", dateStr, "445710", "",
          sanitizeSageField(`TVA - ${poNumber}`),
          formatFECAmount(0), formatFECAmount(totalTVA), "", poNumber
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
 * Exporte les bons de commande au format Cegid Expert
 */
export function exportToCegid(purchaseOrders, dateRange = null) {
  const filtered = dateRange
    ? filterPurchaseOrdersByDateRange(purchaseOrders, dateRange)
    : purchaseOrders;

  if (filtered.length === 0) {
    const total = purchaseOrders.length;
    const dateInfo = dateRange?.from && dateRange?.to
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";

    throw new Error(
      `Aucun bon de commande à exporter ${dateInfo}. ${total} bon(s) de commande au total dans le système.`
    );
  }

  const entries = [];

  filtered.forEach((po) => {
    const issueDate = convertToDate(po.issueDate);
    if (!issueDate) return;

    const dateStr = format(issueDate, "dd/MM/yyyy");
    const poNumber = sanitizeCegidField(po.prefix ? `${po.prefix}${po.number}` : po.number);
    const clientName = sanitizeCegidField(po.client?.name || "Client inconnu");
    const clientCode = sanitizeCegidField(po.client?.siret || "");
    const totalTTC = parseFloat(po.finalTotalTTC) || 0;

    entries.push([
      "VTE", dateStr, poNumber, "411000", clientCode,
      sanitizeCegidField(`${clientName} - ${poNumber}`),
      formatFECAmount(totalTTC), formatFECAmount(0), "EUR"
    ].join(";"));

    if (po.items && po.items.length > 0) {
      const itemsByVatRate = {};

      po.items.forEach((item) => {
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
      const globalDiscountAmount = parseFloat(po.discountAmount) || 0;

      Object.entries(itemsByVatRate).forEach(([vatRate, htAmount]) => {
        let finalHT = htAmount;
        if (globalDiscountAmount > 0 && totalHTBeforeDiscount > 0) {
          const proportion = htAmount / totalHTBeforeDiscount;
          finalHT = finalHT - (globalDiscountAmount * proportion);
        }

        if (finalHT > 0) {
          entries.push([
            "VTE", dateStr, poNumber, "706000", "",
            sanitizeCegidField(`${clientName} - TVA ${vatRate}%`),
            formatFECAmount(0), formatFECAmount(finalHT), "EUR"
          ].join(";"));

          const vatAmount = finalHT * (parseFloat(vatRate) / 100);
          if (vatAmount > 0) {
            const vatAccount = getVATAccount(parseFloat(vatRate));
            entries.push([
              "VTE", dateStr, poNumber, vatAccount, "",
              sanitizeCegidField(`TVA ${vatRate}% - ${poNumber}`),
              formatFECAmount(0), formatFECAmount(vatAmount), "EUR"
            ].join(";"));
          }
        }
      });
    } else {
      const totalHT = parseFloat(po.finalTotalHT) || 0;
      const totalTVA = parseFloat(po.finalTotalVAT) || 0;

      if (totalHT > 0) {
        entries.push([
          "VTE", dateStr, poNumber, "706000", "",
          sanitizeCegidField(`Prestation - ${poNumber}`),
          formatFECAmount(0), formatFECAmount(totalHT), "EUR"
        ].join(";"));
      }

      if (totalTVA > 0) {
        entries.push([
          "VTE", dateStr, poNumber, "445710", "",
          sanitizeCegidField(`TVA - ${poNumber}`),
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

function generateFilename(extension, dateRange, prefix = "bons-commande") {
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
