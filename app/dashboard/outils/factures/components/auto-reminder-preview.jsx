"use client";

import { Paperclip } from "lucide-react";
import { useMemo } from "react";

export default function AutoReminderPreview({ formData }) {
  // Données de démonstration pour la preview
  const demoData = {
    invoiceNumber: "F-112024-0042",
    clientName: "Client Exemple SARL",
    totalAmount: "10 800,00 €",
    dueDate: "15/11/2024",
    companyName: "Votre Entreprise",
  };

  // Remplacer les variables dans le texte
  const replaceVariables = (text) => {
    if (!text) return "";
    return text
      .replace(/\{invoiceNumber\}/g, demoData.invoiceNumber)
      .replace(/\{clientName\}/g, demoData.clientName)
      .replace(/\{totalAmount\}/g, demoData.totalAmount)
      .replace(/\{dueDate\}/g, demoData.dueDate)
      .replace(/\{companyName\}/g, demoData.companyName);
  };

  // Créer une version avec surlignage des variables pour la preview
  const highlightVariables = (text) => {
    if (!text) return [];
    
    const parts = [];
    const regex = /(\{invoiceNumber\}|\{clientName\}|\{totalAmount\}|\{dueDate\}|\{companyName\})/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      const variable = match[0];
      const value = replaceVariables(variable);
      parts.push({
        type: 'variable',
        content: value,
        variable: variable
      });
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    return parts;
  };

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
    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Email Meta Header */}
      <div className="px-4 md:px-6 py-4 space-y-3 md:space-y-2 text-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="text-muted-foreground sm:w-24 text-xs sm:text-sm mb-0.5 sm:mb-0">De</span>
          <span className="font-medium text-foreground text-xs sm:text-sm break-all">{fullSender}</span>
        </div>
        {replyToEmail !== senderEmail && (
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <span className="text-muted-foreground sm:w-24 text-xs sm:text-sm mb-0.5 sm:mb-0">Répondre à</span>
            <span className="text-foreground text-xs sm:text-sm break-all">{replyToEmail}</span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="text-muted-foreground sm:w-24 text-xs sm:text-sm mb-0.5 sm:mb-0">À</span>
          <span className="text-foreground text-xs sm:text-sm">client@exemple.fr</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <span className="text-muted-foreground sm:w-24 text-xs sm:text-sm mb-0.5 sm:mb-0">Objet</span>
          <span className="font-medium text-foreground text-xs sm:text-sm">
            {highlightVariables(formData?.emailSubject || "").map((part, index) => (
              part.type === 'variable' ? (
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
            {demoData.invoiceNumber}.pdf
          </span>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-6 py-6">
        <h1 className="text-xl font-normal text-center text-gray-900 dark:text-white mb-4">
          Rappel de paiement
        </h1>
        
        {/* Corps de l'email */}
        <div className="mb-6">
          {formData?.emailBody ? (
            <div className="text-gray-600 dark:text-gray-300 text-sm leading-6 whitespace-pre-wrap">
              {highlightVariables(formData.emailBody).map((part, index) => (
                part.type === 'variable' ? (
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
            <p className="text-gray-400 dark:text-gray-500 italic text-center text-sm">Aucun contenu d'email défini</p>
          )}
        </div>

        {/* Séparateur */}
        <hr className="border-gray-200 dark:border-gray-700 my-4" />

        {/* Détails de la facture */}
        <div className="bg-gray-50 dark:bg-[#252525] rounded-lg p-4 mb-4">
          <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
            Détails de la facture
          </p>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="text-gray-500 dark:text-gray-400 text-xs py-1">Numéro de facture</td>
                <td className="text-gray-900 dark:text-white text-xs py-1 text-right font-medium">{demoData.invoiceNumber}</td>
              </tr>
              <tr>
                <td className="text-gray-500 dark:text-gray-400 text-xs py-1">Montant total</td>
                <td className="text-gray-900 dark:text-white text-xs py-1 text-right font-bold">{demoData.totalAmount}</td>
              </tr>
              <tr>
                <td className="text-gray-500 dark:text-gray-400 text-xs py-1">Date d'échéance</td>
                <td className="text-gray-900 dark:text-white text-xs py-1 text-right font-medium">{demoData.dueDate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm leading-5">
          La facture est jointe à cet email au format PDF.
        </p>

        <p className="text-gray-600 dark:text-gray-300 text-sm leading-5 mt-2">
          Pour toute question, n'hésitez pas à nous contacter.
        </p>

        <p className="text-gray-600 dark:text-gray-300 text-sm leading-5 mt-4">
          Cordialement,<br />
          L'équipe {demoData.companyName}
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-400 dark:text-gray-500 text-xs text-center m-0">
          Cet email a été envoyé automatiquement par le système de relance de {demoData.companyName}.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs text-center mt-1 m-0">
          Merci de ne pas répondre directement à cet email.
        </p>
      </div>
    </div>
  );
}
