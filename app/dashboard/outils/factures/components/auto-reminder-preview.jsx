"use client";

import { Paperclip } from "lucide-react";
import { useMemo } from "react";

// Données de démonstration
const demoData = {
  invoiceNumber: "F-112024-0042",
  clientName: "Client Exemple SARL",
  totalAmount: "10 800,00 €",
  dueDate: "15/11/2024",
  companyName: "Votre Entreprise",
};

// Fonction pour mettre en évidence les variables
function highlightVariables(text) {
  if (!text) return [];

  const regex = /\{(\w+)\}/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    const variableName = match[1];
    const value = demoData[variableName] || match[0];

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
    ),
  );
}

export default function AutoReminderPreview({ formData }) {
  const senderEmail = useMemo(() => {
    return formData?.fromEmail || "contact@entreprise.fr";
  }, [formData?.fromEmail]);

  const senderName = useMemo(() => {
    return formData?.fromName || "Votre Entreprise";
  }, [formData?.fromName]);

  const replyToEmail = useMemo(() => {
    return formData?.replyTo || formData?.fromEmail || "contact@entreprise.fr";
  }, [formData?.replyTo, formData?.fromEmail]);

  const fullSender = useMemo(() => {
    if (senderName && senderEmail) {
      return `${senderName} <${senderEmail}>`;
    }
    return senderEmail;
  }, [senderName, senderEmail]);

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#e6e7ea] dark:border-[#2E2E32]">
      {/* Email Meta Header */}
      <div className="px-5 py-4 space-y-2 text-sm border-b border-[#e6e7ea] dark:border-[#2E2E32]">
        <div className="flex gap-4">
          <span className="text-muted-foreground w-20 text-xs shrink-0">
            De
          </span>
          <span className="font-medium text-foreground text-xs break-all">
            {fullSender}
          </span>
        </div>
        {replyToEmail !== senderEmail && (
          <div className="flex gap-4">
            <span className="text-muted-foreground w-20 text-xs shrink-0">
              Répondre à
            </span>
            <span className="text-foreground text-xs break-all">
              {replyToEmail}
            </span>
          </div>
        )}
        <div className="flex gap-4">
          <span className="text-muted-foreground w-20 text-xs shrink-0">À</span>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center size-5 rounded-full bg-[#5b50ff]/10 shrink-0">
              <span className="text-[9px] font-medium text-[#5b50ff]">C</span>
            </div>
            <span className="text-foreground text-xs truncate">
              client@exemple.fr
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="text-muted-foreground w-20 text-xs shrink-0">
            Objet
          </span>
          <span className="font-medium text-foreground text-xs">
            <VariableHighlight
              parts={highlightVariables(formData?.emailSubject || "")}
            />
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-muted-foreground w-20 text-xs shrink-0">
            Pièce jointe
          </span>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Paperclip className="size-3" />
            {demoData.invoiceNumber}.pdf
          </span>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-6 py-6">
        <h1 className="text-lg font-medium text-center text-foreground mb-5">
          Rappel de paiement
        </h1>

        {/* Corps de l'email */}
        <div className="mb-6">
          {formData?.emailBody ? (
            <div className="text-muted-foreground text-sm leading-6 whitespace-pre-wrap">
              <VariableHighlight
                parts={highlightVariables(formData.emailBody)}
              />
            </div>
          ) : (
            <p className="text-muted-foreground/50 text-sm italic">
              Aperçu du contenu de l&apos;email...
            </p>
          )}
        </div>

        {/* Bloc détails facture */}
        <div className="rounded-[9px] border border-[#e6e7ea] dark:border-[#2E2E32] p-4 mb-6">
          <h2 className="text-[11px] font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Détails de la facture
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Numéro de la facture
              </span>
              <span className="font-medium text-foreground">
                {demoData.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant total</span>
              <span className="font-semibold text-foreground">
                {demoData.totalAmount}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Date d&apos;échéance
              </span>
              <span className="font-medium text-foreground">
                {demoData.dueDate}
              </span>
            </div>
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="text-sm text-muted-foreground space-y-3">
          <p>La facture est jointe à cet email au format PDF.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 text-center border-t border-[#e6e7ea] dark:border-[#2E2E32]">
        <p className="text-[11px] text-muted-foreground/60">
          Cet email a été envoyé automatiquement par le système de relance de{" "}
          {demoData.companyName} depuis la plateforme Newbi Logiciel de gestion.
        </p>
      </div>
    </div>
  );
}
