"use client";

import React from "react";
import { useSession } from "@/src/lib/auth-client";
import { useWorkspace } from "@/src/hooks/useWorkspace";

const UniversalPreviewPDF = ({ data, type = "invoice" }) => {
  const { data: session } = useSession();
  const { organization } = useWorkspace();
  
  // Calcul des totaux basé sur les articles
  const calculateTotals = (items = []) => {
    let subtotal = 0;
    let totalTax = 0;
    const taxesByRate = {}; // Pour stocker les totaux de TVA par taux
    
    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      
      // Récupérer le taux de TVA, avec une valeur par défaut de 20% si non spécifié
      // Si vatRate est défini à 0, on le garde à 0, sinon on prend la valeur ou 20% par défaut
      const vatRate = item.vatRate !== undefined ? parseFloat(item.vatRate) : 20;
      
      // Calcul du montant HT de l'article (quantité * prix unitaire)
      const itemSubtotal = quantity * unitPrice;
      
      // Calcul de la TVA pour cet article (uniquement si le taux est supérieur à 0)
      const itemTax = vatRate > 0 ? itemSubtotal * (vatRate / 100) : 0;
      
      subtotal += itemSubtotal;
      totalTax += itemTax;
      
      // On n'ajoute la TVA au détail que si le taux est supérieur à 0
      if (vatRate > 0) {
        if (!taxesByRate[vatRate]) {
          taxesByRate[vatRate] = 0;
        }
        taxesByRate[vatRate] += itemTax;
      }
    });
    
    const total = subtotal + totalTax;
    
    console.log('Calcul des totaux:', { subtotal, totalTax, total, taxesByRate });
    
    const taxDetails = Object.entries(taxesByRate)
      .sort(([rateA], [rateB]) => parseFloat(rateB) - parseFloat(rateA))
      .map(([rate, amount]) => ({
        rate: parseFloat(rate),
        amount: Number(amount.toFixed(2))
      }));
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      total: Number(total.toFixed(2)),
      taxDetails
    };
  };
  
  // Utiliser les totaux calculés ou ceux fournis dans les données
  const { subtotal, totalTax, total, taxDetails = [] } = data.items?.length > 0 
    ? calculateTotals(data.items) 
    : { 
        subtotal: data.subtotal || 0, 
        totalTax: data.totalTax || 0, 
        total: data.total || 0,
        taxDetails: []
      };

  // Utiliser le logo depuis les données ou depuis l'organisation comme fallback
  const companyLogo = data.companyInfo?.logo || organization?.logo;

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

  // Fonction utilitaire pour convertir hex en rgba avec opacité
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

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
      return isInvoice ? "Facture proforma" : "Devis";
    }
    return isInvoice ? "Facture" : "Devis";
  };

  console.log(data.companyInfo, "companyInfo");
  console.log("Logo sources:", {
    fromData: data.companyInfo?.logo,
    fromOrganization: organization?.logo,
    finalLogo: companyLogo,
  });
  return (
    <div
      className="w-full bg-white shadow-lg relative min-h-[900px] p-6"
      style={{ color: data.appearance?.textColor }}
    >
      {/* CONTENU PRINCIPAL */}
      <div className="p-6 text-xs">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          {/* Logo à gauche */}
          <div className="flex-shrink-0">
            {companyLogo && (
              <img
                src={companyLogo}
                alt="Logo entreprise"
                className="h-20 w-auto object-contain"
                style={{ maxWidth: "150px" }}
              />
            )}
          </div>
          
          {/* Titre et informations de facture à droite */}
          <div className="text-right mb-6">
            <div className="text-3xl font-medium dark:text-[#0A0A0A] mb-2">
              {getDocumentTitle()}
            </div>
            <div className="space-y-1">
              <div className="flex justify-end" style={{ fontSize: "10px" }}>
                <span className="font-medium w-38 dark:text-[#0A0A0A] mr-2">
                  Numéro de facture:
                </span>
                <span className="dark:text-[#0A0A0A]">
                  {data.prefix && data.number
                    ? `${data.prefix}-${data.number}`
                    : data.number || "F-202507-001"}
                </span>
              </div>
              <div className="flex justify-end" style={{ fontSize: "10px" }}>
                <span className="font-medium w-38 dark:text-[#0A0A0A] mr-2">
                  Date d'émission:
                </span>
                <span className="dark:text-[#0A0A0A]">
                  {formatDate(data.issueDate || data.date) ||
                    formatDate(new Date())}
                </span>
              </div>
              {data.executionDate && (
              <div className="flex justify-end" style={{ fontSize: "10px" }}>
                <span className="font-medium w-38 dark:text-[#0A0A0A] mr-2">
                  Date d'exécution:
                </span>
                <span className="dark:text-[#0A0A0A]">
                  {formatDate(data.executionDate)}
                </span>
              </div>
            )}
            <div className="flex justify-end" style={{ fontSize: "10px" }}>
              <span className="font-medium w-38 dark:text-[#0A0A0A] mr-2">
                Date d'échéance:
              </span>
              <span className="dark:text-[#0A0A0A]">
                {formatDate(data.dueDate) ||
                  formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}
              </span>
            </div>
            {data.purchaseOrderNumber && (
              <div className="flex justify-end" style={{ fontSize: "10px" }}>
                <span className="font-medium w-38 dark:text-[#0A0A0A] mr-2">
                  Référence devis:
                </span>
                <span className="dark:text-[#0A0A0A]">
                  {data.purchaseOrderNumber}
                </span>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* INFORMATIONS ENTREPRISE ET CLIENT */}
        <div className="grid grid-cols-3 mb-6">
          {/* Informations entreprise */}
          <div>
            <div
              className="font-medium mb-2 dark:text-[#0A0A0A]"
              style={{ fontSize: "10px" }}
            >
              {data.companyInfo?.name || "Sweily"}
            </div>
            <div className="font-normal" style={{ fontSize: "10px" }}>
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

          {/* Informations client - Afficher seulement si des données client existent */}
          {(data.client?.name ||
            data.client?.firstName ||
            data.client?.lastName ||
            data.client?.address ||
            data.client?.email ||
            data.client?.phone ||
            data.client?.siret ||
            data.client?.vatNumber) && (
            <div>
              <div
                className="font-medium mb-2 dark:text-[#0A0A0A]"
                style={{ fontSize: "10px" }}
              >
                {data.client?.name ||
                  `${data.client?.firstName || ""} ${data.client?.lastName || ""}`.trim() ||
                  "Client"}
              </div>
              <div className="font-normal" style={{ fontSize: "10px" }}>
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
          )}

          {/* Adresse de livraison - Afficher seulement si différente de l'adresse de facturation */}
          {data.client?.hasDifferentShippingAddress && data.client?.shippingAddress && (
            <div>
              <div
                className="font-medium mb-2 dark:text-[#0A0A0A]"
                style={{ fontSize: "10px" }}
              >
                Adresse de livraison
              </div>
              <div className="font-normal" style={{ fontSize: "10px" }}>
                <div className="whitespace-pre-line dark:text-[#0A0A0A]">
                  {formatAddress(data.client.shippingAddress) ||
                    "Aucune adresse de livraison spécifiée"}
                </div>
              </div>
            </div>
          )}
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
              <tr style={{ backgroundColor: data.appearance?.headerBgColor }}>
                <th
                  className="py-2 px-2 text-left text-[10px] font-medium"
                  style={{
                    color: data.appearance?.headerTextColor,
                    width: "46%",
                  }}
                >
                  Description
                </th>
                <th
                  className="py-1 px-2 text-right text-[10px] font-medium"
                  style={{
                    color: data.appearance?.headerTextColor,
                    width: "12%",
                  }}
                >
                  Qté
                </th>
                <th
                  className="py-1 px-2 text-right text-[10px] font-medium"
                  style={{
                    color: data.appearance?.headerTextColor,
                    width: "15%",
                  }}
                >
                  Prix unitaire
                </th>
                <th
                  className="py-1 px-2 text-right text-[10px] font-medium"
                  style={{
                    color: data.appearance?.headerTextColor,
                    width: "10%",
                  }}
                >
                  TVA (%)
                </th>
                <th
                  className="py-1 px-2 text-right text-[10px] font-medium"
                  style={{
                    color: data.appearance?.headerTextColor,
                    width: "17%",
                  }}
                >
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {data.items && data.items.length > 0 ? (
                data.items.map((item, index) => (
                  <tr key={index} className="border-b border-[#CCCCCC]">
                    <td
                      className="py-3 px-2 dark:text-[#0A0A0A]"
                      style={{ width: "46%" }}
                    >
                      <div className="font-normal dark:text-[#0A0A0A]">
                        {item.description || ""}
                      </div>
                      {item.details && (
                        <div className="text-xs text-gray-600 mt-1 dark:text-[#0A0A0A]">
                          {item.details}
                        </div>
                      )}
                    </td>
                    <td
                      className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                      style={{ width: "12%", whiteSpace: "nowrap" }}
                    >
                      {item.quantity} {item.unit || ""}
                    </td>
                    <td
                      className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                      style={{ width: "15%" }}
                    >
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td
                      className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                      style={{ width: "10%" }}
                    >
                      {item.vatRate} %
                    </td>
                    <td
                      className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                      style={{ width: "17%" }}
                    >
                      {formatCurrency(
                        (item.quantity || 0) * (item.unitPrice || 0)
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-[#CCCCCC]">
                  <td
                    className="py-3 px-2 text-center dark:text-[#0A0A0A]"
                    style={{ width: "46%" }}
                  >
                    --
                  </td>
                  <td
                    className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                    style={{ width: "12%" }}
                  ></td>
                  <td
                    className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                    style={{ width: "15%" }}
                  >
                    --
                  </td>
                  <td
                    className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                    style={{ width: "10%", fontSize: "10px" }}
                  >
                    20 %
                  </td>
                  <td
                    className="py-3 px-2 text-right dark:text-[#0A0A0A]"
                    style={{ width: "17%", fontSize: "10px" }}
                  >
                    0,00 €
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTAUX */}
        <div className="flex justify-end mb-6">
          <div className="w-72 space-y-1 text-xs">
            <div className="flex justify-between py-1 px-3">
              <span className="font-medium text-[10px] dark:text-[#0A0A0A]">
                Total HT
              </span>
              <span className="dark:text-[#0A0A0A] text-[10px]">
                {formatCurrency(subtotal)}
              </span>
            </div>
            {/* Détail des TVA par taux */}
            {taxDetails.length > 0 ? (
              taxDetails.map((tax, index) => (
                <div key={`tax-${index}`} className="flex justify-between py-1 px-3">
                  <span className="text-[10px] dark:text-[#0A0A0A]">
                    TVA {tax.rate}%
                  </span>
                  <span className="dark:text-[#0A0A0A] text-[10px]">
                    {formatCurrency(tax.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex justify-between py-1 px-3">
                <span className="font-medium text-[10px] dark:text-[#0A0A0A]">
                  Montant total de TVA
                </span>
                <span className="dark:text-[#0A0A0A] text-[10px]">
                  {formatCurrency(totalTax)}
                </span>
              </div>
            )}
            {totalTax > 0 && (
              <div className="flex justify-between py-1 px-3">
                <span className="font-medium text-[10px] dark:text-[#0A0A0A]">
                  Total TVA
                </span>
                <span className="dark:text-[#0A0A0A] text-[10px]">
                  {formatCurrency(totalTax)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 px-6 bg-[#F3F3F3] font-medium text-sm">
              <span className="-ml-3 text-[10px] font-medium dark:text-[#0A0A0A]">
                Total TTC
              </span>
              <span className="-mr-3 text-[10px] dark:text-[#0A0A0A]">
                {formatCurrency(total)}
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
      <div className="absolute bottom-0 left-0 right-0 bg-[#F3F3F3] pt-8 pb-8 pl-14">
        <div className="mb-3">
          <div className="font-medium text-xs mb-2 dark:text-[#0A0A0A]">
            Détails du paiement
          </div>
          <div className="flex flex-col gap-1 mt-2 text-[10px] dark:text-[#0A0A0A]">
            <div className="flex">
              <span className="font-medium w-32">Nom du bénéficiaire</span>
              <span className="font-normal">
                {data.companyInfo?.name || "Sweily"}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">BIC</span>
              <span className="font-normal">
                {data.bankDetails?.bic ||
                  data.companyInfo?.bankDetails?.bic ||
                  ""}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">IBAN</span>
              <span className="font-normal">
                {data.bankDetails?.iban ||
                  data.companyInfo?.bankDetails?.iban ||
                  ""}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Référence</span>
              <span className="font-normal">
                {data.prefix && data.number
                  ? `${data.prefix}-${data.number}`
                  : data.number || "F-202507-001"}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[10px] dark:text-[#0A0A0A] border-t pt-2">
          <div>
            {data.companyInfo?.name || "Sweily"}
            {data.companyInfo?.legalForm && `, ${data.companyInfo.legalForm}`}
            {data.companyInfo?.capitalSocial &&
              ` au capital de ${data.companyInfo.capitalSocial}`}
            {data.companyInfo?.rcs && ` - ${data.companyInfo.rcs}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalPreviewPDF;
