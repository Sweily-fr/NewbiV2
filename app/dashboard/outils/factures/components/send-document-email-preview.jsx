"use client";

import { useMemo } from "react";
import { Paperclip } from "lucide-react";

const DOCUMENT_LABELS = {
  invoice: { singular: "facture", title: "Votre facture", detailsTitle: "DE LA FACTURE" },
  quote: { singular: "devis", title: "Votre devis", detailsTitle: "DU DEVIS" },
  creditNote: { singular: "avoir", title: "Votre avoir", detailsTitle: "DE L'AVOIR" },
};

// Données de démonstration
const demoData = {
  documentNumber: "F-112024-0042",
  clientName: "Client Exemple SARL",
  totalAmount: "10 800,00 €",
  issueDate: "15/11/2024",
  companyName: "Votre Entreprise",
  invoiceNumber: "F-112024-0001",
};

// Fonction pour mettre en évidence les variables
function highlightVariables(text, realData = {}) {
  if (!text) return [];
  
  const regex = /\{(\w+)\}/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  // Fusionner les données réelles avec les données de démo
  const data = { ...demoData, ...realData };
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    
    const variableName = match[1];
    const value = data[variableName] || match[0];
    
    parts.push({
      type: "variable",
      content: value,
      variable: match[0],
    });
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }
  
  return parts;
}

export default function SendDocumentEmailPreview({ 
  formData, 
  documentType = "invoice",
  documentNumber,
  clientName,
  clientEmail,
  totalAmount,
  companyName,
  senderEmail,
  senderName,
  issueDate,
  dueDate,
  invoiceNumber, // Numéro de la facture associée (pour les avoirs)
}) {
  const labels = DOCUMENT_LABELS[documentType] || DOCUMENT_LABELS.invoice;
  
  // Utiliser les vraies données si disponibles
  const displayData = useMemo(() => ({
    documentNumber: documentNumber || demoData.documentNumber,
    clientName: clientName || demoData.clientName,
    totalAmount: totalAmount || demoData.totalAmount,
    issueDate: issueDate || demoData.issueDate,
    dueDate: dueDate || null,
    companyName: companyName || demoData.companyName,
    invoiceNumber: invoiceNumber || demoData.invoiceNumber,
  }), [documentNumber, clientName, totalAmount, companyName, issueDate, dueDate, invoiceNumber]);
  
  const fullSender = useMemo(() => {
    if (senderName && senderEmail) {
      return `${senderName} <${senderEmail}>`;
    }
    return senderEmail || "votre-email@exemple.fr";
  }, [senderName, senderEmail]);

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Email Meta Header */}
      <div className="px-4 md:px-6 py-4 space-y-3 md:space-y-2 text-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="text-muted-foreground sm:w-24 text-xs sm:text-sm mb-0.5 sm:mb-0">De</span>
          <span className="font-medium text-foreground text-xs sm:text-sm break-all">{fullSender}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="text-muted-foreground sm:w-24 text-xs sm:text-sm mb-0.5 sm:mb-0">À</span>
          <span className="text-foreground text-xs sm:text-sm">{clientEmail || "client@exemple.fr"}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="text-muted-foreground sm:w-24 text-xs sm:text-sm mb-0.5 sm:mb-0">Objet</span>
          <span className="font-medium text-foreground text-xs sm:text-sm">
            {highlightVariables(formData?.emailSubject || "", displayData).map((part, index) => (
              part.type === "variable" ? (
                <span
                  key={index}
                  className="bg-[#5b50ff]/10 text-[#5b50ff] px-1 py-0.5 rounded text-xs"
                  title={part.variable}
                >
                  {part.content}
                </span>
              ) : (
                <span key={index}>{part.content}</span>
              )
            ))}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="text-muted-foreground sm:w-24 text-xs sm:text-sm mb-0.5 sm:mb-0">Pièce jointe</span>
          <span className="text-[#5b50ff] flex items-center gap-1 text-xs sm:text-sm">
            <Paperclip className="h-3 w-3" />
            {displayData.documentNumber}.pdf
          </span>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-6 py-6">
        <h1 className="text-xl font-normal text-center text-gray-900 dark:text-white mb-4">
          {labels.title}
        </h1>
        
        {/* Corps de l'email */}
        <div className="mb-6">
          {formData?.emailBody ? (
            <div className="text-gray-600 dark:text-gray-300 text-sm leading-6 whitespace-pre-wrap">
              {highlightVariables(formData.emailBody, displayData).map((part, index) => (
                part.type === "variable" ? (
                  <span
                    key={index}
                    className="bg-[#5b50ff]/10 text-[#5b50ff] px-1 py-0.5 rounded text-xs font-medium"
                    title={part.variable}
                  >
                    {part.content}
                  </span>
                ) : (
                  <span key={index}>{part.content}</span>
                )
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm italic">
              Aperçu du contenu de l&apos;email...
            </p>
          )}
        </div>

        {/* Bloc détails document */}
        <div className="bg-gray-50 dark:bg-[#252525] rounded-lg p-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
            DÉTAILS {labels.detailsTitle}
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Numéro</span>
              <span className="font-medium text-gray-900 dark:text-white">{displayData.documentNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Montant total</span>
              <span className="font-semibold text-gray-900 dark:text-white">{displayData.totalAmount}</span>
            </div>
            {displayData.issueDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Date</span>
                <span className="font-medium text-gray-900 dark:text-white">{displayData.issueDate}</span>
              </div>
            )}
            {documentType === "invoice" && displayData.dueDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Date d&apos;échéance</span>
                <span className="font-medium text-gray-900 dark:text-white">{displayData.dueDate}</span>
              </div>
            )}
            {documentType === "creditNote" && displayData.invoiceNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Facture associée</span>
                <span className="font-medium text-gray-900 dark:text-white">{displayData.invoiceNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
          <p>La {labels.singular} est jointe à cet email au format PDF.</p>
          <p>Pour toute question, n&apos;hésitez pas à nous contacter.</p>
          <p>
            Cordialement,<br />
            L&apos;équipe {displayData.companyName}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-[#252525] px-6 py-4 text-center border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {documentType === "invoice" ? "Cette facture" : documentType === "quote" ? "Ce devis" : "Cet avoir"} a été envoyé{documentType === "invoice" || documentType === "creditNote" ? "e" : ""} par {displayData.companyName} depuis la plateforme Newbi Logiciel de gestion.
        </p>
      </div>
    </div>
  );
}
