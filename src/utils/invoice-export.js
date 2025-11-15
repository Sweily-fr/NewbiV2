import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Filtre les factures selon une plage de dates
 * @param {Array} invoices - Liste des factures
 * @param {Object} dateRange - Objet avec from et to (dates)
 * @returns {Array} - Factures filtrées
 */
export function filterInvoicesByDateRange(invoices, dateRange) {
  // Si pas de plage de dates (null ou undefined), retourner toutes les factures
  if (!dateRange || (!dateRange.from && !dateRange.to)) {
    return invoices;
  }

  return invoices.filter((invoice) => {
    // Vérifier que la facture a une date d'émission
    if (!invoice.issueDate) {
      return false;
    }

    // Convertir le timestamp ou la string en Date
    let invoiceDate;
    
    // Convertir en nombre si c'est une string numérique
    let timestamp = invoice.issueDate;
    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      timestamp = parseInt(timestamp, 10);
    }
    
    if (typeof timestamp === 'number') {
      // Essayer différentes conversions et choisir celle qui donne une date valide
      const asIs = new Date(timestamp);
      const divided = new Date(timestamp / 1000);
      const multiplied = new Date(timestamp * 1000);
      
      // Vérifier quelle conversion donne une date valide et raisonnable (entre 2020 et 2100)
      if (!isNaN(asIs.getTime()) && asIs.getFullYear() >= 2020 && asIs.getFullYear() <= 2100) {
        invoiceDate = asIs;
      } else if (!isNaN(divided.getTime()) && divided.getFullYear() >= 2020 && divided.getFullYear() <= 2100) {
        invoiceDate = divided;
      } else if (!isNaN(multiplied.getTime()) && multiplied.getFullYear() >= 2020 && multiplied.getFullYear() <= 2100) {
        invoiceDate = multiplied;
      } else {
        // Aucune conversion ne fonctionne
        console.warn(`Date invalide pour la facture:`, invoice.number, invoice.issueDate);
        return false;
      }
    } else if (typeof timestamp === 'string') {
      // Si c'est une string ISO (format date)
      invoiceDate = new Date(timestamp);
    } else {
      // Si c'est déjà un objet Date
      invoiceDate = new Date(timestamp);
    }
    
    // Vérifier que la date est valide
    if (isNaN(invoiceDate.getTime())) {
      console.warn(`Date invalide pour la facture:`, invoice.number, invoice.issueDate);
      return false;
    }
    
    // Normaliser la date de la facture (début de journée)
    invoiceDate.setHours(0, 0, 0, 0);

    // Si seulement une date de début
    if (dateRange.from && !dateRange.to) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      return invoiceDate >= fromDate;
    }

    // Si seulement une date de fin
    if (!dateRange.from && dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      return invoiceDate <= toDate;
    }

    // Si les deux dates sont définies
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);

    return invoiceDate >= fromDate && invoiceDate <= toDate;
  });
}

/**
 * Convertit un timestamp (secondes ou millisecondes) en Date
 * @param {Number|String|Date} dateValue - Valeur de date
 * @returns {Date|null} - Date convertie ou null si invalide
 */
function convertToDate(dateValue) {
  if (!dateValue) return null;
  
  // Convertir en nombre si c'est une string numérique
  let timestamp = dateValue;
  if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
    timestamp = parseInt(timestamp, 10);
  }
  
  if (typeof timestamp === 'number') {
    // Essayer différentes conversions et choisir celle qui donne une date valide
    const asIs = new Date(timestamp);
    const divided = new Date(timestamp / 1000);
    const multiplied = new Date(timestamp * 1000);
    
    // Vérifier quelle conversion donne une date valide et raisonnable (entre 2020 et 2100)
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
 * Formate une facture pour l'export
 * @param {Object} invoice - Facture à formater
 * @returns {Object} - Facture formatée
 */
function formatInvoiceForExport(invoice) {
  const issueDate = convertToDate(invoice.issueDate);
  const dueDate = convertToDate(invoice.dueDate);
  const createdAt = convertToDate(invoice.createdAt);
  
  return {
    // Identification
    "Numéro": invoice.prefix 
      ? `${invoice.prefix}${invoice.number}` 
      : (invoice.number || ""),
    "N° Bon de commande": invoice.purchaseOrderNumber || "",
    
    // Client
    "Client": invoice.client?.name || "",
    "Email client": invoice.client?.email || "",
    "SIRET client": invoice.client?.siret || "",
    "N° TVA client": invoice.client?.vatNumber || "",
    "Type client": invoice.client?.type === "COMPANY" ? "Entreprise" : "Particulier",
    
    // Dates
    "Date d'émission": issueDate 
      ? format(issueDate, "dd/MM/yyyy", { locale: fr })
      : "",
    "Date d'échéance": dueDate 
      ? format(dueDate, "dd/MM/yyyy", { locale: fr })
      : "",
    "Date de création": createdAt 
      ? format(createdAt, "dd/MM/yyyy HH:mm", { locale: fr })
      : "",
    
    // Montants
    "Total HT (€)": formatAmount(invoice.finalTotalHT),
    "Total TVA (€)": formatAmount(invoice.finalTotalVAT),
    "Total TTC (€)": formatAmount(invoice.finalTotalTTC),
    "Remise (%)": invoice.discountType === "PERCENTAGE" ? formatAmount(invoice.discount) : "",
    "Remise (€)": invoice.discountType === "FIXED" ? formatAmount(invoice.discount) : "",
    "Montant remise (€)": formatAmount(invoice.discountAmount),
    
    // Statut et paiement
    "Statut": getStatusLabel(invoice.status),
    "Type": invoice.isDeposit ? "Acompte" : "Facture complète",
    "Stripe ID": invoice.stripeInvoiceId || "",
    
    // Informations comptables
    "Adresse client": formatAddress(invoice.client?.address),
    "Code postal client": invoice.client?.address?.postalCode || "",
    "Ville client": invoice.client?.address?.city || "",
    "Pays client": invoice.client?.address?.country || "",
  };
}

/**
 * Formate une adresse complète
 * @param {Object} address - Adresse à formater
 * @returns {String} - Adresse formatée
 */
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

/**
 * Formate un montant pour l'export
 * @param {Number|String} amount - Montant à formater
 * @returns {String} - Montant formaté
 */
function formatAmount(amount) {
  if (amount === null || amount === undefined || amount === "") return "0.00";
  
  // Convertir en nombre si c'est une string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Vérifier que c'est un nombre valide
  if (isNaN(numAmount)) return "0.00";
  
  return numAmount.toFixed(2);
}

/**
 * Retourne le libellé du statut
 * @param {String} status - Statut de la facture
 * @returns {String} - Libellé du statut
 */
function getStatusLabel(status) {
  const labels = {
    DRAFT: "Brouillon",
    PENDING: "En attente",
    COMPLETED: "Payée",
    OVERDUE: "En retard",
    CANCELED: "Annulée",
  };
  return labels[status] || status;
}

/**
 * Exporte les factures au format CSV
 * @param {Array} invoices - Liste des factures
 * @param {Object} dateRange - Plage de dates (optionnel)
 */
export function exportToCSV(invoices, dateRange = null) {
  // Filtrer par date si nécessaire
  const filteredInvoices = dateRange 
    ? filterInvoicesByDateRange(invoices, dateRange)
    : invoices;

  if (filteredInvoices.length === 0) {
    // Message d'erreur plus détaillé
    const totalInvoices = invoices.length;
    const dateInfo = dateRange?.from && dateRange?.to 
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";
    
    throw new Error(
      `Aucune facture à exporter ${dateInfo}. ${totalInvoices} facture(s) au total dans le système.`
    );
  }

  // Formater les données
  const formattedData = filteredInvoices.map(formatInvoiceForExport);

  // Créer le CSV
  const headers = Object.keys(formattedData[0]);
  const csvContent = [
    headers.join(";"),
    ...formattedData.map((row) =>
      headers.map((header) => {
        const value = row[header] || "";
        // Échapper les guillemets et entourer de guillemets si nécessaire
        if (value.toString().includes(";") || value.toString().includes('"')) {
          return `"${value.toString().replace(/"/g, '""')}"`;
        }
        return value;
      }).join(";")
    ),
  ].join("\n");

  // Ajouter le BOM UTF-8 pour Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Télécharger le fichier
  const filename = generateFilename("csv", dateRange);
  downloadBlob(blob, filename);
}

/**
 * Exporte les factures au format Excel (HTML table)
 * @param {Array} invoices - Liste des factures
 * @param {Object} dateRange - Plage de dates (optionnel)
 */
export function exportToExcel(invoices, dateRange = null) {
  // Filtrer par date si nécessaire
  const filteredInvoices = dateRange 
    ? filterInvoicesByDateRange(invoices, dateRange)
    : invoices;

  if (filteredInvoices.length === 0) {
    // Message d'erreur plus détaillé
    const totalInvoices = invoices.length;
    const dateInfo = dateRange?.from && dateRange?.to 
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";
    
    throw new Error(
      `Aucune facture à exporter ${dateInfo}. ${totalInvoices} facture(s) au total dans le système.`
    );
  }

  // Formater les données
  const formattedData = filteredInvoices.map(formatInvoiceForExport);

  // Créer le tableau HTML
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
                <x:Name>Factures</x:Name>
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

  // Créer le blob
  const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" });
  
  // Télécharger le fichier
  const filename = generateFilename("xls", dateRange);
  downloadBlob(blob, filename);
}

/**
 * Exporte les factures au format FEC (Fichier des Écritures Comptables)
 * Format légal obligatoire pour l'administration fiscale française
 * Version conforme avec détail des lignes de facture
 * @param {Array} invoices - Liste des factures
 * @param {Object} dateRange - Plage de dates (optionnel)
 */
export function exportToFEC(invoices, dateRange = null) {
  // Filtrer par date si nécessaire
  const filteredInvoices = dateRange 
    ? filterInvoicesByDateRange(invoices, dateRange)
    : invoices;

  if (filteredInvoices.length === 0) {
    const totalInvoices = invoices.length;
    const dateInfo = dateRange?.from && dateRange?.to 
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";
    
    throw new Error(
      `Aucune facture à exporter ${dateInfo}. ${totalInvoices} facture(s) au total dans le système.`
    );
  }

  // Générer les écritures comptables avec numérotation séquentielle
  const entries = [];
  let ecritureCounter = 1;
  
  filteredInvoices.forEach((invoice) => {
    const issueDate = convertToDate(invoice.issueDate);
    const createdAt = convertToDate(invoice.createdAt);
    if (!issueDate) return;
    
    const dateStr = format(issueDate, "yyyyMMdd");
    const validDateStr = createdAt ? format(createdAt, "yyyyMMdd") : dateStr;
    const invoiceNumber = sanitizeFECField(invoice.prefix ? `${invoice.prefix}${invoice.number}` : invoice.number);
    const clientName = sanitizeFECField(invoice.client?.name || "Client inconnu");
    const totalTTC = parseFloat(invoice.finalTotalTTC) || 0;
    
    // Numéro d'écriture unique et séquentiel
    const ecritureNum = `VTE${String(ecritureCounter).padStart(8, '0')}`;
    
    // Ligne 1 : Débit client (compte 411)
    entries.push({
      JournalCode: "VTE",
      JournalLib: "Ventes",
      EcritureNum: ecritureNum,
      EcritureDate: dateStr,
      CompteNum: "411000",
      CompteLib: "Clients",
      CompAuxNum: invoice.client?.siret || invoiceNumber,
      CompAuxLib: clientName,
      PieceRef: invoiceNumber,
      PieceDate: dateStr,
      EcritureLib: sanitizeFECField(`Facture ${invoiceNumber} - ${clientName}`),
      Debit: formatFECAmount(totalTTC),
      Credit: formatFECAmount(0),
      EcritureLet: "",
      DateLet: "",
      ValidDate: validDateStr,
      Montantdevise: "",
      Idevise: ""
    });
    
    // Traiter les lignes de facture pour ventilation par compte et TVA
    if (invoice.items && invoice.items.length > 0) {
      // Grouper les lignes par taux de TVA
      const itemsByVatRate = {};
      
      invoice.items.forEach((item) => {
        const vatRate = item.vatRate || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const itemDiscount = parseFloat(item.discount) || 0;
        
        // Calculer le montant HT de la ligne
        let lineHT = quantity * unitPrice;
        
        // Appliquer la remise de ligne
        if (itemDiscount > 0) {
          if (item.discountType === "PERCENTAGE") {
            lineHT = lineHT * (1 - itemDiscount / 100);
          } else {
            lineHT = lineHT - itemDiscount;
          }
        }
        
        // Grouper par taux de TVA
        if (!itemsByVatRate[vatRate]) {
          itemsByVatRate[vatRate] = {
            totalHT: 0,
            items: []
          };
        }
        
        itemsByVatRate[vatRate].totalHT += lineHT;
        itemsByVatRate[vatRate].items.push({
          description: item.description,
          amount: lineHT
        });
      });
      
      // Appliquer la remise globale proportionnellement
      const totalHTBeforeDiscount = Object.values(itemsByVatRate).reduce((sum, group) => sum + group.totalHT, 0);
      const globalDiscountAmount = parseFloat(invoice.discountAmount) || 0;
      
      // Créer les lignes de crédit ventes par taux de TVA
      Object.entries(itemsByVatRate).forEach(([vatRate, group]) => {
        let finalHT = group.totalHT;
        
        // Appliquer la remise globale proportionnellement
        if (globalDiscountAmount > 0 && totalHTBeforeDiscount > 0) {
          const proportion = group.totalHT / totalHTBeforeDiscount;
          finalHT = finalHT - (globalDiscountAmount * proportion);
        }
        
        if (finalHT > 0) {
          // Ligne crédit ventes (compte 706)
          entries.push({
            JournalCode: "VTE",
            JournalLib: "Ventes",
            EcritureNum: ecritureNum,
            EcritureDate: dateStr,
            CompteNum: "706000",
            CompteLib: "Prestations de services",
            CompAuxNum: "",
            CompAuxLib: "",
            PieceRef: invoiceNumber,
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
          
          // Ligne crédit TVA (compte 44571x selon le taux)
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
              PieceRef: invoiceNumber,
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
      // Pas de détail des lignes : utiliser les totaux globaux
      const totalHT = parseFloat(invoice.finalTotalHT) || 0;
      const totalTVA = parseFloat(invoice.finalTotalVAT) || 0;
      
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
          PieceRef: invoiceNumber,
          PieceDate: dateStr,
          EcritureLib: sanitizeFECField(`Facture ${invoiceNumber} - ${clientName}`),
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
          PieceRef: invoiceNumber,
          PieceDate: dateStr,
          EcritureLib: sanitizeFECField(`Facture ${invoiceNumber} - ${clientName}`),
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

  // Créer le contenu FEC
  // IMPORTANT : Le FEC ne doit PAS avoir de ligne d'en-tête selon la norme
  const headers = [
    "JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib",
    "CompAuxNum", "CompAuxLib", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
    "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise"
  ];
  
  // Générer les lignes sans en-tête
  const fecContent = entries.map(entry => 
    headers.map(h => entry[h] || "").join("|")
  ).join("\n");

  // Ajouter le BOM UTF-8
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + fecContent], { type: "text/plain;charset=utf-8;" });
  
  // Télécharger le fichier
  const filename = generateFilename("txt", dateRange, "FEC");
  downloadBlob(blob, filename);
}

/**
 * Nettoie un champ pour le format FEC
 * Supprime les caractères interdits et limite la longueur
 * @param {String} value - Valeur à nettoyer
 * @param {Number} maxLength - Longueur maximale (optionnel)
 * @returns {String} - Valeur nettoyée
 */
function sanitizeFECField(value, maxLength = 255) {
  if (!value) return "";
  
  return String(value)
    // Supprimer les retours à la ligne et tabulations
    .replace(/[\r\n\t]/g, " ")
    // Supprimer les pipes (séparateur FEC)
    .replace(/\|/g, "-")
    // Supprimer les caractères de contrôle
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Limiter la longueur
    .substring(0, maxLength)
    // Trim
    .trim();
}

/**
 * Formate un montant pour le FEC
 * @param {Number} amount - Montant
 * @returns {String} - Montant formaté
 */
function formatFECAmount(amount) {
  if (!amount || amount === 0) return "0.00";
  // Gérer les montants négatifs (pour les avoirs)
  return amount.toFixed(2);
}

/**
 * Retourne le compte de TVA selon le taux
 * @param {Number} vatRate - Taux de TVA
 * @returns {String} - Numéro de compte
 */
function getVATAccount(vatRate) {
  // Comptes de TVA collectée selon les taux français
  if (vatRate === 20) return "445710"; // TVA 20% (taux normal)
  if (vatRate === 10) return "445711"; // TVA 10% (taux intermédiaire)
  if (vatRate === 5.5) return "445712"; // TVA 5,5% (taux réduit)
  if (vatRate === 2.1) return "445713"; // TVA 2,1% (taux super réduit)
  if (vatRate === 0) return "445714"; // TVA 0% (exonéré)
  return "445710"; // Par défaut : taux normal
}

/**
 * Nettoie un champ pour le format Sage
 * Supprime les point-virgules et caractères problématiques
 * @param {String} value - Valeur à nettoyer
 * @returns {String} - Valeur nettoyée
 */
function sanitizeSageField(value) {
  if (!value) return "";
  
  return String(value)
    // Supprimer les retours à la ligne et tabulations
    .replace(/[\r\n\t]/g, " ")
    // Supprimer les point-virgules (séparateur Sage)
    .replace(/;/g, ",")
    // Supprimer les caractères de contrôle
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Limiter la longueur
    .substring(0, 100)
    // Trim
    .trim();
}

/**
 * Exporte les factures au format Sage Compta
 * Format étendu avec compte auxiliaire et détail des lignes
 * @param {Array} invoices - Liste des factures
 * @param {Object} dateRange - Plage de dates (optionnel)
 */
export function exportToSage(invoices, dateRange = null) {
  // Filtrer par date si nécessaire
  const filteredInvoices = dateRange 
    ? filterInvoicesByDateRange(invoices, dateRange)
    : invoices;

  if (filteredInvoices.length === 0) {
    const totalInvoices = invoices.length;
    const dateInfo = dateRange?.from && dateRange?.to 
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";
    
    throw new Error(
      `Aucune facture à exporter ${dateInfo}. ${totalInvoices} facture(s) au total dans le système.`
    );
  }

  // Générer les écritures pour Sage
  const entries = [];
  
  filteredInvoices.forEach((invoice) => {
    const issueDate = convertToDate(invoice.issueDate);
    if (!issueDate) return;
    
    const dateStr = format(issueDate, "ddMMyyyy");
    const invoiceNumber = sanitizeSageField(invoice.prefix ? `${invoice.prefix}${invoice.number}` : invoice.number);
    const clientName = sanitizeSageField(invoice.client?.name || "Client inconnu");
    const clientCode = sanitizeSageField(invoice.client?.siret || invoiceNumber);
    const totalTTC = parseFloat(invoice.finalTotalTTC) || 0;
    
    // Format Sage étendu : Journal;Date;Compte;CompteAux;Libellé;Débit;Crédit;Lettrage;Pièce
    
    // Ligne 1 : Débit client avec compte auxiliaire
    entries.push([
      "VTE",
      dateStr,
      "411000",
      clientCode,
      sanitizeSageField(`${clientName} - ${invoiceNumber}`),
      formatFECAmount(totalTTC),
      formatFECAmount(0),
      "",
      invoiceNumber
    ].join(";"));
    
    // Traiter les lignes de facture pour ventilation par TVA
    if (invoice.items && invoice.items.length > 0) {
      // Grouper les lignes par taux de TVA
      const itemsByVatRate = {};
      
      invoice.items.forEach((item) => {
        const vatRate = item.vatRate || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const itemDiscount = parseFloat(item.discount) || 0;
        
        // Calculer le montant HT de la ligne
        let lineHT = quantity * unitPrice;
        
        // Appliquer la remise de ligne
        if (itemDiscount > 0) {
          if (item.discountType === "PERCENTAGE") {
            lineHT = lineHT * (1 - itemDiscount / 100);
          } else {
            lineHT = lineHT - itemDiscount;
          }
        }
        
        // Grouper par taux de TVA
        if (!itemsByVatRate[vatRate]) {
          itemsByVatRate[vatRate] = 0;
        }
        itemsByVatRate[vatRate] += lineHT;
      });
      
      // Appliquer la remise globale proportionnellement
      const totalHTBeforeDiscount = Object.values(itemsByVatRate).reduce((sum, ht) => sum + ht, 0);
      const globalDiscountAmount = parseFloat(invoice.discountAmount) || 0;
      
      // Créer les lignes de crédit ventes par taux de TVA
      Object.entries(itemsByVatRate).forEach(([vatRate, htAmount]) => {
        let finalHT = htAmount;
        
        // Appliquer la remise globale proportionnellement
        if (globalDiscountAmount > 0 && totalHTBeforeDiscount > 0) {
          const proportion = htAmount / totalHTBeforeDiscount;
          finalHT = finalHT - (globalDiscountAmount * proportion);
        }
        
        if (finalHT > 0) {
          // Ligne crédit ventes
          entries.push([
            "VTE",
            dateStr,
            "706000",
            "",
            sanitizeSageField(`${clientName} - TVA ${vatRate}%`),
            formatFECAmount(0),
            formatFECAmount(finalHT),
            "",
            invoiceNumber
          ].join(";"));
          
          // Ligne crédit TVA
          const vatAmount = finalHT * (parseFloat(vatRate) / 100);
          if (vatAmount > 0) {
            const vatAccount = getVATAccount(parseFloat(vatRate));
            entries.push([
              "VTE",
              dateStr,
              vatAccount,
              "",
              sanitizeSageField(`TVA ${vatRate}% - ${invoiceNumber}`),
              formatFECAmount(0),
              formatFECAmount(vatAmount),
              "",
              invoiceNumber
            ].join(";"));
          }
        }
      });
    } else {
      // Pas de détail des lignes : utiliser les totaux globaux
      const totalHT = parseFloat(invoice.finalTotalHT) || 0;
      const totalTVA = parseFloat(invoice.finalTotalVAT) || 0;
      
      if (totalHT > 0) {
        entries.push([
          "VTE",
          dateStr,
          "706000",
          "",
          sanitizeSageField(`Prestation - ${invoiceNumber}`),
          formatFECAmount(0),
          formatFECAmount(totalHT),
          "",
          invoiceNumber
        ].join(";"));
      }
      
      if (totalTVA > 0) {
        entries.push([
          "VTE",
          dateStr,
          "445710",
          "",
          sanitizeSageField(`TVA - ${invoiceNumber}`),
          formatFECAmount(0),
          formatFECAmount(totalTVA),
          "",
          invoiceNumber
        ].join(";"));
      }
    }
  });

  // En-tête Sage étendu
  const headers = "Journal;Date;Compte;CompteAux;Libellé;Débit;Crédit;Lettrage;Pièce";
  const sageContent = [headers, ...entries].join("\n");

  // Encodage UTF-8 avec BOM pour compatibilité Sage
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + sageContent], { type: "text/plain;charset=utf-8;" });
  
  const filename = generateFilename("txt", dateRange, "Sage");
  downloadBlob(blob, filename);
}

/**
 * Nettoie un champ pour le format Cegid
 * Supprime les point-virgules et caractères problématiques
 * @param {String} value - Valeur à nettoyer
 * @returns {String} - Valeur nettoyée
 */
function sanitizeCegidField(value) {
  if (!value) return "";
  
  return String(value)
    // Supprimer les retours à la ligne et tabulations
    .replace(/[\r\n\t]/g, " ")
    // Supprimer les point-virgules (séparateur Cegid)
    .replace(/;/g, ",")
    // Supprimer les guillemets doubles
    .replace(/"/g, "'")
    // Supprimer les caractères de contrôle
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Limiter la longueur
    .substring(0, 100)
    // Trim
    .trim();
}

/**
 * Exporte les factures au format Cegid Expert
 * Format étendu avec détail des lignes et multi-TVA
 * @param {Array} invoices - Liste des factures
 * @param {Object} dateRange - Plage de dates (optionnel)
 */
export function exportToCegid(invoices, dateRange = null) {
  // Filtrer par date si nécessaire
  const filteredInvoices = dateRange 
    ? filterInvoicesByDateRange(invoices, dateRange)
    : invoices;

  if (filteredInvoices.length === 0) {
    const totalInvoices = invoices.length;
    const dateInfo = dateRange?.from && dateRange?.to 
      ? `du ${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: fr })}`
      : "pour cette période";
    
    throw new Error(
      `Aucune facture à exporter ${dateInfo}. ${totalInvoices} facture(s) au total dans le système.`
    );
  }

  // Générer les écritures pour Cegid
  const entries = [];
  
  filteredInvoices.forEach((invoice) => {
    const issueDate = convertToDate(invoice.issueDate);
    if (!issueDate) return;
    
    const dateStr = format(issueDate, "dd/MM/yyyy");
    const invoiceNumber = sanitizeCegidField(invoice.prefix ? `${invoice.prefix}${invoice.number}` : invoice.number);
    const clientName = sanitizeCegidField(invoice.client?.name || "Client inconnu");
    const clientCode = sanitizeCegidField(invoice.client?.siret || "");
    const totalTTC = parseFloat(invoice.finalTotalTTC) || 0;
    
    // Format Cegid : CodeJournal;Date;NumPiece;CompteGeneral;CompteAuxiliaire;Libelle;Debit;Credit;Devise
    
    // Ligne 1 : Débit client avec compte auxiliaire
    entries.push([
      "VTE",
      dateStr,
      invoiceNumber,
      "411000",
      clientCode,
      sanitizeCegidField(`${clientName} - ${invoiceNumber}`),
      formatFECAmount(totalTTC),
      formatFECAmount(0),
      "EUR"
    ].join(";"));
    
    // Traiter les lignes de facture pour ventilation par TVA
    if (invoice.items && invoice.items.length > 0) {
      // Grouper les lignes par taux de TVA
      const itemsByVatRate = {};
      
      invoice.items.forEach((item) => {
        const vatRate = item.vatRate || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const itemDiscount = parseFloat(item.discount) || 0;
        
        // Calculer le montant HT de la ligne
        let lineHT = quantity * unitPrice;
        
        // Appliquer la remise de ligne
        if (itemDiscount > 0) {
          if (item.discountType === "PERCENTAGE") {
            lineHT = lineHT * (1 - itemDiscount / 100);
          } else {
            lineHT = lineHT - itemDiscount;
          }
        }
        
        // Grouper par taux de TVA
        if (!itemsByVatRate[vatRate]) {
          itemsByVatRate[vatRate] = 0;
        }
        itemsByVatRate[vatRate] += lineHT;
      });
      
      // Appliquer la remise globale proportionnellement
      const totalHTBeforeDiscount = Object.values(itemsByVatRate).reduce((sum, ht) => sum + ht, 0);
      const globalDiscountAmount = parseFloat(invoice.discountAmount) || 0;
      
      // Créer les lignes de crédit ventes par taux de TVA
      Object.entries(itemsByVatRate).forEach(([vatRate, htAmount]) => {
        let finalHT = htAmount;
        
        // Appliquer la remise globale proportionnellement
        if (globalDiscountAmount > 0 && totalHTBeforeDiscount > 0) {
          const proportion = htAmount / totalHTBeforeDiscount;
          finalHT = finalHT - (globalDiscountAmount * proportion);
        }
        
        if (finalHT > 0) {
          // Ligne crédit ventes
          entries.push([
            "VTE",
            dateStr,
            invoiceNumber,
            "706000",
            "",
            sanitizeCegidField(`${clientName} - TVA ${vatRate}%`),
            formatFECAmount(0),
            formatFECAmount(finalHT),
            "EUR"
          ].join(";"));
          
          // Ligne crédit TVA
          const vatAmount = finalHT * (parseFloat(vatRate) / 100);
          if (vatAmount > 0) {
            const vatAccount = getVATAccount(parseFloat(vatRate));
            entries.push([
              "VTE",
              dateStr,
              invoiceNumber,
              vatAccount,
              "",
              sanitizeCegidField(`TVA ${vatRate}% - ${invoiceNumber}`),
              formatFECAmount(0),
              formatFECAmount(vatAmount),
              "EUR"
            ].join(";"));
          }
        }
      });
    } else {
      // Pas de détail des lignes : utiliser les totaux globaux
      const totalHT = parseFloat(invoice.finalTotalHT) || 0;
      const totalTVA = parseFloat(invoice.finalTotalVAT) || 0;
      
      if (totalHT > 0) {
        entries.push([
          "VTE",
          dateStr,
          invoiceNumber,
          "706000",
          "",
          sanitizeCegidField(`Prestation - ${invoiceNumber}`),
          formatFECAmount(0),
          formatFECAmount(totalHT),
          "EUR"
        ].join(";"));
      }
      
      if (totalTVA > 0) {
        entries.push([
          "VTE",
          dateStr,
          invoiceNumber,
          "445710",
          "",
          sanitizeCegidField(`TVA - ${invoiceNumber}`),
          formatFECAmount(0),
          formatFECAmount(totalTVA),
          "EUR"
        ].join(";"));
      }
    }
  });

  // En-tête Cegid
  const headers = "CodeJournal;Date;NumPiece;CompteGeneral;CompteAuxiliaire;Libelle;Debit;Credit;Devise";
  const cegidContent = [headers, ...entries].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + cegidContent], { type: "text/csv;charset=utf-8;" });
  
  const filename = generateFilename("csv", dateRange, "Cegid");
  downloadBlob(blob, filename);
}

/**
 * Génère un nom de fichier pour l'export
 * @param {String} extension - Extension du fichier
 * @param {Object} dateRange - Plage de dates (optionnel)
 * @param {String} prefix - Préfixe du fichier (optionnel)
 * @returns {String} - Nom du fichier
 */
function generateFilename(extension, dateRange, prefix = "factures") {
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  
  if (dateRange?.from && dateRange?.to) {
    const fromStr = format(new Date(dateRange.from), "yyyy-MM-dd");
    const toStr = format(new Date(dateRange.to), "yyyy-MM-dd");
    return `${prefix}_${fromStr}_au_${toStr}.${extension}`;
  }
  
  return `${prefix}_export_${timestamp}.${extension}`;
}

/**
 * Télécharge un blob
 * @param {Blob} blob - Blob à télécharger
 * @param {String} filename - Nom du fichier
 */
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
