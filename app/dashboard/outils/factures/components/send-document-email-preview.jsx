"use client";

import { useMemo } from "react";
import { Paperclip } from "lucide-react";

const DOCUMENT_LABELS = {
  invoice: { singular: "facture", title: "Votre facture", detailsTitle: "DE LA FACTURE" },
  quote: { singular: "devis", title: "Votre devis", detailsTitle: "DU DEVIS" },
  creditNote: { singular: "avoir", title: "Votre avoir", detailsTitle: "DE L'AVOIR" },
  purchaseOrder: { singular: "bon de commande", title: "Votre bon de commande", detailsTitle: "DU BON DE COMMANDE" },
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

function VariableHighlight({ parts }) {
  return parts.map((part, index) =>
    part.type === "variable" ? (
      <code
        key={index}
        className="px-1 py-0.5 text-[11px] rounded-md bg-muted/60 text-muted-foreground border border-border/40 font-mono"
        title={part.variable}
      >
        {part.content}
      </code>
    ) : (
      <span key={index}>{part.content}</span>
    )
  );
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
  invoiceNumber,
}) {
  const labels = DOCUMENT_LABELS[documentType] || DOCUMENT_LABELS.invoice;

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
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#e6e7ea] dark:border-[#2E2E32]">
      {/* Email Meta Header */}
      <div className="px-5 py-4 space-y-2 text-sm border-b border-[#e6e7ea] dark:border-[#2E2E32]">
        <div className="flex gap-4">
          <span className="text-muted-foreground w-20 text-xs shrink-0">De</span>
          <span className="font-medium text-foreground text-xs break-all">{fullSender}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-muted-foreground w-20 text-xs shrink-0">À</span>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center size-5 rounded-full bg-[#5b50ff]/10 shrink-0">
              <span className="text-[9px] font-medium text-[#5b50ff]">
                {(clientName || "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-foreground text-xs truncate">
              {clientEmail || "client@exemple.fr"}
            </span>
          </div>
        </div>
        {formData?.ccEmails?.length > 0 && (
          <div className="flex gap-4">
            <span className="text-muted-foreground w-20 text-xs shrink-0">Cc</span>
            <div className="flex flex-wrap gap-1">
              {formData.ccEmails.map((email) => (
                <span key={email} className="text-xs text-foreground bg-[#5b50ff]/10 text-[#5b50ff] px-1.5 py-0.5 rounded-md font-medium">
                  {email}
                </span>
              ))}
            </div>
          </div>
        )}
        {formData?.bccEmails?.length > 0 && (
          <div className="flex gap-4">
            <span className="text-muted-foreground w-20 text-xs shrink-0">Cci</span>
            <div className="flex flex-wrap gap-1">
              {formData.bccEmails.map((email) => (
                <span key={email} className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-md font-medium">
                  {email}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-4">
          <span className="text-muted-foreground w-20 text-xs shrink-0">Objet</span>
          <span className="font-medium text-foreground text-xs">
            <VariableHighlight parts={highlightVariables(formData?.emailSubject || "", displayData)} />
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-muted-foreground w-20 text-xs shrink-0">Pièce jointe</span>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Paperclip className="size-3" />
            {displayData.documentNumber}.pdf
          </span>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-6 py-6">
        <h1 className="text-lg font-medium text-center text-foreground mb-5">
          {labels.title}
        </h1>

        {/* Corps de l'email */}
        <div className="mb-6">
          {formData?.emailBody ? (
            <div className="text-muted-foreground text-sm leading-6 whitespace-pre-wrap">
              <VariableHighlight parts={highlightVariables(formData.emailBody, displayData)} />
            </div>
          ) : (
            <p className="text-muted-foreground/50 text-sm italic">
              Aperçu du contenu de l&apos;email...
            </p>
          )}
        </div>

        {/* Bloc détails document */}
        <div className="rounded-[9px] border border-[#e6e7ea] dark:border-[#2E2E32] p-4 mb-6">
          <h2 className="text-[11px] font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Détails {labels.detailsTitle.toLowerCase()}
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Numéro</span>
              <span className="font-medium text-foreground">{displayData.documentNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant total</span>
              <span className="font-semibold text-foreground">{displayData.totalAmount}</span>
            </div>
            {displayData.issueDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{displayData.issueDate}</span>
              </div>
            )}
            {documentType === "invoice" && displayData.dueDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date d&apos;échéance</span>
                <span className="font-medium text-foreground">{displayData.dueDate}</span>
              </div>
            )}
            {documentType === "creditNote" && displayData.invoiceNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Facture associée</span>
                <span className="font-medium text-foreground">{displayData.invoiceNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="text-sm text-muted-foreground space-y-3">
          <p>{documentType === "invoice" ? "La" : documentType === "creditNote" ? "L'" : "Le"} {labels.singular} est {documentType === "invoice" ? "jointe" : "joint"} à cet email au format PDF.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 text-center border-t border-[#e6e7ea] dark:border-[#2E2E32]">
        <p className="text-[11px] text-muted-foreground/60">
          {formData?.useCustomFooter && formData?.customEmailFooter
            ? <VariableHighlight parts={highlightVariables(formData.customEmailFooter, displayData)} />
            : <>
                {documentType === "invoice" ? "Cette facture" : documentType === "quote" ? "Ce devis" : documentType === "purchaseOrder" ? "Ce bon de commande" : "Cet avoir"} a été envoyé{documentType === "invoice" ? "e" : ""} par {displayData.companyName} depuis la plateforme Newbi Logiciel de gestion.
              </>
          }
        </p>
      </div>
    </div>
  );
}
