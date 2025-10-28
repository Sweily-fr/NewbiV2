import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Convertit une valeur en Date valide
 * @param {any} dateValue - Valeur à convertir
 * @returns {Date|null} - Date valide ou null
 */
function convertToDate(dateValue) {
  if (!dateValue) return null;
  
  try {
    // Si c'est déjà une Date
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    
    // Si c'est un timestamp numérique
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Si c'est une string
    if (typeof dateValue === 'string') {
      // Essayer de parser comme timestamp
      if (/^\d+$/.test(dateValue)) {
        const timestamp = parseInt(dateValue, 10);
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
      }
      // Essayer de parser comme date ISO
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  } catch (error) {
    console.warn('Erreur conversion date:', error);
    return null;
  }
}

/**
 * Formate un produit pour l'export
 * @param {Object} product - Produit à formater
 * @returns {Object} - Produit formaté
 */
function formatProductForExport(product) {
  const createdAt = convertToDate(product.createdAt);
  const updatedAt = convertToDate(product.updatedAt);
  
  return {
    // Identification
    "Nom": product.name || "",
    "Référence": product.reference || "",
    "Catégorie": product.category || "",
    
    // Prix et TVA
    "Prix unitaire HT (€)": formatAmount(product.unitPrice),
    "Taux TVA (%)": formatAmount(product.vatRate),
    "Unité": product.unit || "",
    
    // Description
    "Description": product.description || "",
    
    // Dates
    "Date de création": createdAt 
      ? format(createdAt, "dd/MM/yyyy HH:mm", { locale: fr })
      : "",
    "Date de modification": updatedAt 
      ? format(updatedAt, "dd/MM/yyyy HH:mm", { locale: fr })
      : "",
  };
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

/**
 * Génère un nom de fichier pour l'export
 * @param {String} extension - Extension du fichier
 * @param {String} prefix - Préfixe optionnel
 * @returns {String} - Nom du fichier
 */
function generateFilename(extension, prefix = "Catalogue") {
  const date = format(new Date(), "yyyy-MM-dd_HH-mm", { locale: fr });
  return `${prefix}_${date}.${extension}`;
}

/**
 * Exporte les produits au format CSV
 * @param {Array} products - Liste des produits
 * @returns {Object} - Résultat de l'export {success: boolean, error?: string}
 */
export function exportToCSV(products) {
  if (!products || products.length === 0) {
    return { success: false, error: "Aucun produit à exporter" };
  }
  
  try {

  // Formater les données
  const formattedData = products.map(formatProductForExport);

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
  const filename = generateFilename("csv");
  downloadBlob(blob, filename);
  return { success: true };
  } catch (error) {
    return { success: false, error: error.message || "Erreur lors de l'export CSV" };
  }
}

/**
 * Exporte les produits au format Excel (HTML table)
 * @param {Array} products - Liste des produits
 * @returns {Object} - Résultat de l'export {success: boolean, error?: string}
 */
export function exportToExcel(products) {
  if (!products || products.length === 0) {
    return { success: false, error: "Aucun produit à exporter" };
  }
  
  try {

  // Formater les données
  const formattedData = products.map(formatProductForExport);

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
                <x:Name>Catalogue</x:Name>
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
          th { background-color: #5a50ff; color: white; font-weight: bold; }
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
  const filename = generateFilename("xls");
  downloadBlob(blob, filename);
  return { success: true };
  } catch (error) {
    return { success: false, error: error.message || "Erreur lors de l'export Excel" };
  }
}

/**
 * Génère un modèle CSV vide pour l'import
 * @returns {void}
 */
export function downloadCSVTemplate() {
  const headers = [
    "Nom",
    "Référence",
    "Catégorie",
    "Prix unitaire HT (€)",
    "Taux TVA (%)",
    "Unité",
    "Description"
  ];

  // Exemple de données
  const exampleData = [
    {
      "Nom": "Ordinateur portable Dell XPS 13",
      "Référence": "DELL-XPS13-2024",
      "Catégorie": "Matériel informatique",
      "Prix unitaire HT (€)": "1299.00",
      "Taux TVA (%)": "20.00",
      "Unité": "unité",
      "Description": "Ordinateur portable professionnel 13 pouces"
    },
    {
      "Nom": "Consultation développement web",
      "Référence": "CONS-WEB-001",
      "Catégorie": "Services",
      "Prix unitaire HT (€)": "80.00",
      "Taux TVA (%)": "20.00",
      "Unité": "heure",
      "Description": "Consultation et développement web sur mesure"
    },
    {
      "Nom": "Licence Microsoft Office 365",
      "Référence": "MS-OFFICE-365",
      "Catégorie": "Logiciels",
      "Prix unitaire HT (€)": "69.00",
      "Taux TVA (%)": "20.00",
      "Unité": "unité",
      "Description": "Licence annuelle Microsoft Office 365"
    },
    {
      "Nom": "Formation WordPress avancée",
      "Référence": "FORM-WP-ADV",
      "Catégorie": "Formation",
      "Prix unitaire HT (€)": "500.00",
      "Taux TVA (%)": "20.00",
      "Unité": "jour",
      "Description": "Formation WordPress avancée 2 jours"
    },
    {
      "Nom": "Maintenance serveur mensuelle",
      "Référence": "MAINT-SERV-M",
      "Catégorie": "Services",
      "Prix unitaire HT (€)": "300.00",
      "Taux TVA (%)": "20.00",
      "Unité": "mois",
      "Description": "Maintenance et monitoring serveur"
    },
    {
      "Nom": "Caméra de surveillance IP",
      "Référence": "CAM-IP-4K",
      "Catégorie": "Matériel informatique",
      "Prix unitaire HT (€)": "249.00",
      "Taux TVA (%)": "20.00",
      "Unité": "unité",
      "Description": "Caméra IP 4K avec vision nocturne"
    },
    {
      "Nom": "Audit de sécurité informatique",
      "Référence": "AUDIT-SEC-IT",
      "Catégorie": "Services",
      "Prix unitaire HT (€)": "1500.00",
      "Taux TVA (%)": "20.00",
      "Unité": "unité",
      "Description": "Audit complet de sécurité informatique"
    }
  ];

  const csvContent = [
    headers.join(";"),
    ...exampleData.map((row) =>
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
  
  const filename = "Modele_Import_Catalogue.csv";
  downloadBlob(blob, filename);
}

/**
 * Génère un modèle Excel vide pour l'import
 * @returns {void}
 */
export function downloadExcelTemplate() {
  const headers = [
    "Nom",
    "Référence",
    "Catégorie",
    "Prix unitaire HT (€)",
    "Taux TVA (%)",
    "Unité",
    "Description"
  ];

  // Exemple de données
  const exampleData = [
    {
      "Nom": "Ordinateur portable Dell XPS 13",
      "Référence": "DELL-XPS13-2024",
      "Catégorie": "Matériel informatique",
      "Prix unitaire HT (€)": "1299.00",
      "Taux TVA (%)": "20.00",
      "Unité": "unité",
      "Description": "Ordinateur portable professionnel 13 pouces"
    },
    {
      "Nom": "Consultation développement web",
      "Référence": "CONS-WEB-001",
      "Catégorie": "Services",
      "Prix unitaire HT (€)": "80.00",
      "Taux TVA (%)": "20.00",
      "Unité": "heure",
      "Description": "Consultation et développement web sur mesure"
    },
    {
      "Nom": "Licence Microsoft Office 365",
      "Référence": "MS-OFFICE-365",
      "Catégorie": "Logiciels",
      "Prix unitaire HT (€)": "69.00",
      "Taux TVA (%)": "20.00",
      "Unité": "unité",
      "Description": "Licence annuelle Microsoft Office 365"
    },
    {
      "Nom": "Formation WordPress avancée",
      "Référence": "FORM-WP-ADV",
      "Catégorie": "Formation",
      "Prix unitaire HT (€)": "500.00",
      "Taux TVA (%)": "20.00",
      "Unité": "jour",
      "Description": "Formation WordPress avancée 2 jours"
    },
    {
      "Nom": "Maintenance serveur mensuelle",
      "Référence": "MAINT-SERV-M",
      "Catégorie": "Services",
      "Prix unitaire HT (€)": "300.00",
      "Taux TVA (%)": "20.00",
      "Unité": "mois",
      "Description": "Maintenance et monitoring serveur"
    },
    {
      "Nom": "Caméra de surveillance IP",
      "Référence": "CAM-IP-4K",
      "Catégorie": "Matériel informatique",
      "Prix unitaire HT (€)": "249.00",
      "Taux TVA (%)": "20.00",
      "Unité": "unité",
      "Description": "Caméra IP 4K avec vision nocturne"
    },
    {
      "Nom": "Audit de sécurité informatique",
      "Référence": "AUDIT-SEC-IT",
      "Catégorie": "Services",
      "Prix unitaire HT (€)": "1500.00",
      "Taux TVA (%)": "20.00",
      "Unité": "unité",
      "Description": "Audit complet de sécurité informatique"
    }
  ];

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Modèle Import</x:Name>
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
          th { background-color: #5a50ff; color: white; font-weight: bold; }
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
            ${exampleData
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
  
  const filename = "Modele_Import_Catalogue.xls";
  downloadBlob(blob, filename);
}
