import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formate le type de contact pour l'export
 * @param {String} type - Type du contact (INDIVIDUAL | COMPANY)
 * @returns {String} - Libellé en français
 */
function formatType(type) {
  if (type === "INDIVIDUAL") return "Particulier";
  if (type === "COMPANY") return "Entreprise";
  return type || "";
}

/**
 * Formate un booléen pour l'export
 * @param {Boolean} value - Valeur à formater
 * @returns {String} - "Oui" ou "Non"
 */
function formatBoolean(value) {
  return value ? "Oui" : "Non";
}

/**
 * Formate un contact pour l'export
 * @param {Object} client - Contact à formater
 * @returns {Object} - Contact formaté (clés = en-têtes FR)
 */
function formatClientForExport(client) {
  const address = client.address || {};

  return {
    // Identification
    Nom: client.name || "",
    Type: formatType(client.type),
    Prénom: client.firstName || "",
    "Nom de famille": client.lastName || "",

    // Contact
    Email: client.email || "",
    Téléphone: client.phone || "",
    Fonction: client.contactFunction || "",
    Service: client.contactDepartment || "",

    // Adresse
    Adresse: address.street || "",
    "Code postal": address.postalCode || "",
    Ville: address.city || "",
    Pays: address.country || "",

    // Informations légales
    SIRET: client.siret || "",
    "N° TVA": client.vatNumber || "",
    International: formatBoolean(client.isInternational),
    Bloqué: formatBoolean(client.isBlocked),
  };
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
function generateFilename(extension, prefix = "Contacts") {
  const date = format(new Date(), "yyyy-MM-dd_HH-mm", { locale: fr });
  return `${prefix}_${date}.${extension}`;
}

/**
 * Exporte les contacts au format CSV
 * @param {Array} clients - Liste des contacts
 * @returns {Object} - Résultat de l'export {success: boolean, error?: string}
 */
export function exportToCSV(clients) {
  if (!clients || clients.length === 0) {
    return { success: false, error: "Aucun contact à exporter" };
  }

  try {
    // Formater les données
    const formattedData = clients.map(formatClientForExport);

    // Créer le CSV
    const headers = Object.keys(formattedData[0]);
    const csvContent = [
      headers.join(";"),
      ...formattedData.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || "";
            // Échapper les guillemets et entourer de guillemets si nécessaire
            if (
              value.toString().includes(";") ||
              value.toString().includes('"')
            ) {
              return `"${value.toString().replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(";"),
      ),
    ].join("\n");

    // Ajouter le BOM UTF-8 pour Excel
    const BOM = "﻿";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // Télécharger le fichier
    downloadBlob(blob, generateFilename("csv"));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Erreur lors de l'export CSV",
    };
  }
}

/**
 * Exporte les contacts au format Excel (HTML table)
 * @param {Array} clients - Liste des contacts
 * @returns {Object} - Résultat de l'export {success: boolean, error?: string}
 */
export function exportToExcel(clients) {
  if (!clients || clients.length === 0) {
    return { success: false, error: "Aucun contact à exporter" };
  }

  try {
    // Formater les données
    const formattedData = clients.map(formatClientForExport);

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
                <x:Name>Contacts</x:Name>
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
                    .join("")}</tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

    // Créer le blob
    const blob = new Blob([htmlContent], {
      type: "application/vnd.ms-excel",
    });

    // Télécharger le fichier
    downloadBlob(blob, generateFilename("xls"));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Erreur lors de l'export Excel",
    };
  }
}
