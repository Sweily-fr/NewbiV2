"use client";

import React from "react";
import { useSession } from "@/src/lib/auth-client";
import { useWorkspace } from "@/src/hooks/useWorkspace";

const UniversalPreviewPDFMobile = ({ data, type = "invoice" }) => {
  const { data: session } = useSession();
  const { organization } = useWorkspace();

  const isCreditNote = type === "creditNote";
  const isQuote = type === "quote";

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  };

  // Récupérer les informations de l'entreprise
  const companyInfo = data?.companyInfo || organization || {};
  const client = data?.client || {};

  return (
    <div className="w-full bg-white p-4 text-xs">
      {/* En-tête */}
      <div className="mb-4 pb-3 border-b">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            {companyInfo.logo && (
              <img
                src={companyInfo.logo}
                alt="Logo"
                className="h-8 mb-2 object-contain"
              />
            )}
            <h3 className="font-bold text-sm">{companyInfo.name || "Entreprise"}</h3>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-base">
              {isCreditNote ? "AVOIR" : isQuote ? "DEVIS" : "FACTURE"}
            </h2>
            <p className="text-xs mt-1">N° {data?.number || "---"}</p>
          </div>
        </div>

        {/* Infos entreprise */}
        <div className="text-[10px] text-gray-600 space-y-0.5">
          {companyInfo.address?.street && <p>{companyInfo.address.street}</p>}
          {(companyInfo.address?.postalCode || companyInfo.address?.city) && (
            <p>
              {companyInfo.address?.postalCode} {companyInfo.address?.city}
            </p>
          )}
          {companyInfo.siret && <p>SIRET: {companyInfo.siret}</p>}
        </div>
      </div>

      {/* Client */}
      <div className="mb-4 pb-3 border-b">
        <p className="font-semibold text-[10px] text-gray-500 mb-1">CLIENT</p>
        <p className="font-medium">{client.name || "N/A"}</p>
        {client.address && (
          <div className="text-[10px] text-gray-600 mt-1 space-y-0.5">
            {client.address.street && <p>{client.address.street}</p>}
            {(client.address.postalCode || client.address.city) && (
              <p>
                {client.address.postalCode} {client.address.city}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="mb-4 pb-3 border-b">
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <p className="text-gray-500">Date d'émission</p>
            <p className="font-medium">{formatDate(data?.issueDate)}</p>
          </div>
          {!isCreditNote && (
            <div>
              <p className="text-gray-500">
                {isQuote ? "Valide jusqu'au" : "Date d'échéance"}
              </p>
              <p className="font-medium">
                {formatDate(isQuote ? data?.validUntil : data?.dueDate)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Articles */}
      <div className="mb-4">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-1.5 px-1 font-semibold">Description</th>
              <th className="text-right py-1.5 px-1 font-semibold w-12">Qté</th>
              <th className="text-right py-1.5 px-1 font-semibold w-16">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((item, index) => {
              const quantity = parseFloat(item.quantity) || 0;
              const unitPrice = parseFloat(item.unitPrice) || 0;
              let itemTotal = quantity * unitPrice;

              // Application remise article
              if (item.discount && item.discount > 0) {
                if (item.discountType === "PERCENTAGE" || item.discountType === "percentage") {
                  itemTotal = itemTotal * (1 - Math.min(item.discount, 100) / 100);
                } else {
                  itemTotal = Math.max(0, itemTotal - item.discount);
                }
              }

              return (
                <tr key={index} className="border-b">
                  <td className="py-1.5 px-1">
                    <p className="font-medium">{item.description}</p>
                    {item.details && (
                      <p className="text-[9px] text-gray-500 mt-0.5">{item.details}</p>
                    )}
                  </td>
                  <td className="text-right py-1.5 px-1">{quantity}</td>
                  <td className="text-right py-1.5 px-1 font-medium">
                    {formatCurrency(itemTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="border-t pt-3">
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-gray-600">Total HT</span>
            <span className="font-medium">
              {formatCurrency(data?.finalTotalHT || data?.totalHT || 0)}
            </span>
          </div>
          
          {data?.discount && data.discount > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>
                Remise {data.discountType === "PERCENTAGE" ? `${data.discount}%` : ""}
              </span>
              <span>
                -{formatCurrency(
                  data.discountType === "PERCENTAGE"
                    ? (data.totalHT * data.discount) / 100
                    : data.discount
                )}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">TVA</span>
            <span className="font-medium">
              {formatCurrency(data?.totalVAT || 0)}
            </span>
          </div>

          <div className="flex justify-between pt-2 border-t text-sm font-bold">
            <span>Total TTC</span>
            <span className={isCreditNote ? "text-red-600" : ""}>
              {formatCurrency(data?.finalTotalTTC || data?.totalTTC || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(data?.headerNotes || data?.footerNotes) && (
        <div className="mt-4 pt-3 border-t text-[9px] text-gray-600 space-y-2">
          {data.headerNotes && (
            <div>
              <p className="font-semibold mb-1">Notes :</p>
              <p>{data.headerNotes}</p>
            </div>
          )}
          {data.footerNotes && <p>{data.footerNotes}</p>}
        </div>
      )}

      {/* Coordonnées bancaires */}
      {data?.showBankDetails && data?.bankDetails && (
        <div className="mt-4 pt-3 border-t text-[9px] text-gray-600">
          <p className="font-semibold mb-1">Coordonnées bancaires :</p>
          <div className="space-y-0.5">
            {data.bankDetails.bankName && <p>{data.bankDetails.bankName}</p>}
            {data.bankDetails.iban && <p>IBAN: {data.bankDetails.iban}</p>}
            {data.bankDetails.bic && <p>BIC: {data.bankDetails.bic}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalPreviewPDFMobile;
