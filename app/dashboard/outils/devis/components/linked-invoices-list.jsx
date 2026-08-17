"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LinkedDocumentRow } from "@/src/components/documents/linked-document-row";

// Fonction utilitaire pour formater les montants
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount || 0);
};

// Section « Factures liées » d'un devis, même style plat que les autres
// sections de sidebar (Totaux, Bons de commande liés...).
const LinkedInvoicesList = ({ quote }) => {
  const router = useRouter();

  const linkedInvoices = quote?.linkedInvoices || [];

  // Ouvre la facture dans la sidebar de la page factures (param ?id=)
  const handleInvoiceClick = (invoiceId) => {
    router.push(`/dashboard/outils/factures?id=${invoiceId}`);
  };

  const totalInvoiced = linkedInvoices.reduce((sum, invoice) => {
    return sum + (invoice.finalTotalTTC || 0);
  }, 0);
  const remainingAmount = (quote?.finalTotalTTC || 0) - totalInvoiced;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
        Factures liées
      </p>

      {linkedInvoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune facture liée à ce devis.
        </p>
      ) : (
        <>
          {/* Résumé financier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal text-muted-foreground">
                Montant total du devis
              </span>
              <span className="text-sm font-normal">
                {formatCurrency(quote.finalTotalTTC || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal text-muted-foreground">
                Déjà facturé
              </span>
              <span className="text-sm font-normal">
                {formatCurrency(totalInvoiced)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-normal text-muted-foreground">
                Reste à facturer
              </span>
              <span className="text-sm font-medium">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>

          {/* Liste des factures */}
          <div className="space-y-1">
            {linkedInvoices.map((invoice) => (
              <LinkedDocumentRow
                key={invoice.id}
                type="invoice"
                document={invoice}
                tag={invoice.isDeposit ? "Acompte" : undefined}
                onClick={() => handleInvoiceClick(invoice.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LinkedInvoicesList;
