"use client";

import React from "react";

const UniversalPreviewPDF = ({ data, type = "invoice" }) => {
  if (!data) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-sm border">
        <div className="text-center text-gray-500">
          <p>Aucune donnée disponible pour l'aperçu</p>
        </div>
      </div>
    );
  }

  const isInvoice = type === "invoice";

  // Formatage des devises - identique au PDF
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0,00 €";

    const num = parseFloat(amount);
    if (isNaN(num)) return "0,00 €";

    // Formatage manuel pour correspondre exactement au PDF
    const formatted = num.toFixed(2).replace(".", ",");
    const parts = formatted.split(",");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    return parts.join(",") + " €";
  };

  // Formatage des dates - identique au PDF
  const formatDate = (dateInput) => {
    if (!dateInput) return "";

    let date;
    if (typeof dateInput === "number") {
      date = new Date(dateInput);
    } else if (typeof dateInput === "string" && /^\d+$/.test(dateInput)) {
      date = new Date(parseInt(dateInput, 10));
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return "";

    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return date.toLocaleDateString("fr-FR", options);
  };

  // Formatage des adresses - identique au PDF
  const formatAddress = (address) => {
    if (address && typeof address === "object") {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.postalCode && address.city) {
        parts.push(`${address.postalCode} ${address.city}`);
      }
      if (address.country) parts.push(address.country);
      return parts.join("\n");
    }
    return "";
  };

  // Déterminer le titre du document comme dans le PDF
  const getDocumentTitle = () => {
    if (data.isDepositInvoice) {
      return "Facture d'acompte";
    }
    if (data.status === "DRAFT") {
      return isInvoice ? "Facture" : "Devis";
    }
    return isInvoice ? "Facture" : "Devis";
  };

  return (
    <div className="w-full bg-white shadow-lg relative min-h-[900px] p-6">
      {/* CONTENU PRINCIPAL */}
      <div className="p-6 text-xs">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-3xl font-semibold dark:text-[#0A0A0A]">
            {getDocumentTitle()}
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-blue-600 dark:text-[#0A0A0A]">
              {data.companyInfo?.name || ""}
            </div>
          </div>
        </div>

        {/* INFORMATIONS DOCUMENT */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="space-y-1">
            <div className="flex" style={{ fontSize: "10px" }}>
              <span className="font-semibold w-32 dark:text-[#0A0A0A]">
                Numéro de facture
              </span>
              <span className="dark:text-[#0A0A0A]">
                {data.number || "F-202507-001"}
              </span>
            </div>
            <div className="flex" style={{ fontSize: "10px" }}>
              <span className="font-semibold w-32 dark:text-[#0A0A0A]">
                Date d'émission
              </span>
              <span className="dark:text-[#0A0A0A]">
                {formatDate(data.issueDate || data.date) ||
                  formatDate(new Date())}
              </span>
            </div>
            <div className="flex" style={{ fontSize: "10px" }}>
              <span className="font-semibold w-32 dark:text-[#0A0A0A]">
                Date d'échéance
              </span>
              <span className="dark:text-[#0A0A0A]">
                {formatDate(data.dueDate) ||
                  formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}
              </span>
            </div>
          </div>
          <div></div>
        </div>

        {/* INFORMATIONS ENTREPRISE ET CLIENT */}
        <div className="grid grid-cols-2 gap-6 mb-16">
          {/* Informations entreprise */}
          <div className="space-y-1">
            <div
              className="font-bold mb-2 dark:text-[#0A0A0A]"
              style={{ fontSize: "10px" }}
            >
              {data.companyInfo?.name || "Sweily"}
            </div>
            <div className="space-y-1" style={{ fontSize: "10px" }}>
              {data.companyInfo?.address && (
                <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                  {formatAddress(data.companyInfo.address) ||
                    "229 Rue Saint-Honoré\n75001 Paris, FR"}
                </div>
              )}
              <span className="dark:text-[#0A0A0A]">
                {data.companyInfo?.email && <div>{data.companyInfo.email}</div>}
              </span>
              <span className="dark:text-[#0A0A0A]">
                {data.companyInfo?.siret && <div>{data.companyInfo.siret}</div>}
              </span>
            </div>
          </div>

          {/* Informations client */}
          <div className="space-y-1">
            <div
              className="font-bold mb-2 dark:text-[#0A0A0A]"
              style={{ fontSize: "10px" }}
            >
              {data.client?.name ||
                `${data.client?.firstName || ""} ${data.client?.lastName || ""}`.trim() ||
                "Client"}
            </div>
            <div className="space-y-1" style={{ fontSize: "10px" }}>
              {data.client?.address && (
                <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                  {formatAddress(data.client.address)}
                </div>
              )}
              <span className="dark:text-[#0A0A0A]">
                {data.client?.email && <div>{data.client.email}</div>}
              </span>
              <span className="dark:text-[#0A0A0A]">
                {data.client?.phone && <div>{data.client.phone}</div>}
              </span>
              <span className="dark:text-[#0A0A0A]">
                {data.client?.siret && <div>SIRET: {data.client.siret}</div>}
              </span>
              <span className="dark:text-[#0A0A0A]">
                {data.client?.vatNumber && (
                  <div>TVA: {data.client.vatNumber}</div>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* NOTES D'EN-TÊTE */}
        {data.headerNotes && (
          <div className="mb-4" style={{ fontSize: "10px" }}>
            <div className="whitespace-pre-line dark:text-[#0A0A0A]">
              {data.headerNotes}
            </div>
          </div>
        )}

        {/* TABLEAU DES ARTICLES */}
        <div className="mb-6">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#1d1d1b] text-white">
                <th className="p-2 text-left text-[10px] font-medium">
                  Description
                </th>
                <th className="p-2 text-center text-[10px] font-medium">Qté</th>
                <th className="p-2 text-center text-[10px] font-medium">
                  Prix unitaire
                </th>
                <th className="p-2 text-center text-[10px] font-medium">
                  TVA (%)
                </th>
                <th className="p-2 text-right text-[10px] font-medium">
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-2 dark:text-[#0A0A0A]">
                      <div className="font-medium dark:text-[#0A0A0A]">
                        {item.description || ""}
                      </div>
                      {item.details && (
                        <div className="text-xs text-gray-600 mt-1 dark:text-[#0A0A0A]">
                          {item.details}
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-center dark:text-[#0A0A0A]">
                      {item.quantity} {item.unit || ""}
                    </td>
                    <td className="p-2 text-right dark:text-[#0A0A0A]">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="p-2 text-center dark:text-[#0A0A0A]">
                      {item.vatRate} %
                    </td>
                    <td className="p-2 text-right dark:text-[#0A0A0A]">
                      {formatCurrency(
                        (item.quantity || 0) * (item.unitPrice || 0)
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-gray-200">
                  <td className="p-2 text-center dark:text-[#0A0A0A]">--</td>
                  <td className="p-2 text-center dark:text-[#0A0A0A]">--</td>
                  <td className="p-2 text-center dark:text-[#0A0A0A]">--</td>
                  <td className="p-2 text-center dark:text-[#0A0A0A]">20 %</td>
                  <td className="p-2 text-center dark:text-[#0A0A0A]">
                    0,00 €
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTAUX */}
        <div className="flex justify-end mb-6">
          <div className="w-84 space-y-1 text-xs">
            <div className="flex justify-between py-1 px-3">
              <span className="font-bold text-[10px] dark:text-[#0A0A0A]">
                Total HT
              </span>
              <span className="dark:text-[#0A0A0A] text-[10px]">
                {formatCurrency(data.subtotal || 0)}
              </span>
            </div>
            <div className="flex justify-between py-1 px-3">
              <span className="font-bold text-[10px] dark:text-[#0A0A0A]">
                Montant total de TVA
              </span>
              <span className="dark:text-[#0A0A0A] text-[10px]">
                {formatCurrency(data.totalTax || 0)}
              </span>
            </div>
            <div className="flex justify-between py-2 px-6 bg-[#F3F3F3] font-bold text-sm">
              <span className="-ml-3 text-[10px] font-bold dark:text-[#0A0A0A]">
                Total TTC
              </span>
              <span className="-mr-3 text-[10px] dark:text-[#0A0A0A]">
                {formatCurrency(data.total || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* NOTES ET CONDITIONS */}
        {data.footerNotes && (
          <div className="mb-4 text-xs">
            <div className="whitespace-pre-line dark:text-[#0A0A0A]">
              {data.footerNotes}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER - DÉTAILS BANCAIRES */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#F3F3F3] pt-8 pb-8 pl-14 border-t">
        <div className="mb-3">
          <div className="font-bold text-xs mb-2 dark:text-[#0A0A0A]">
            Détails du paiement
          </div>
          <div className="grid grid-cols-2 gap-3 text-[10px] dark:text-[#0A0A0A]">
            <div>
              <div className="font-medium text-[10px] dark:text-[#0A0A0A]">
                Nom du bénéficiaire
              </div>
              <div>{data.companyInfo?.name || "Sweily"}</div>
            </div>
            <div>
              <div className="font-medium text-[10px] dark:text-[#0A0A0A]">
                BIC
              </div>
              <div>{data.bankDetails?.bic || "QNTOFR21XXX"}</div>
            </div>
            <div>
              <div className="font-medium text-[10px] dark:text-[#0A0A0A]">
                IBAN
              </div>
              <div>
                {data.bankDetails?.iban || "FR7616958000001719566325588"}
              </div>
            </div>
            <div>
              <div className="font-medium text-[10px] dark:text-[#0A0A0A]">
                Référence
              </div>
              <div></div>
            </div>
          </div>
        </div>

        <div className="text-[10px] dark:text-[#0A0A0A] border-t pt-2">
          <div>
            {data.companyInfo?.name || "Sweily"}, SAS au capital de 10 000,00 €
            - 981 576 649 R.C.S. Paris
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalPreviewPDF;
