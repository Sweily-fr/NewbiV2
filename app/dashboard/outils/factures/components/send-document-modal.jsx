"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { X, LoaderCircle, Send, Eye } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import SendDocumentEmailForm from "./send-document-email-form";
import SendDocumentEmailPreview from "./send-document-email-preview";
import { 
  useSendInvoiceEmail, 
  useSendQuoteEmail, 
  useSendCreditNoteEmail 
} from "@/src/graphql/documentEmailQueries";
import { useEmailSettings, useUpdateEmailSettings } from "@/src/graphql/emailQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";

const DOCUMENT_LABELS = {
  invoice: { singular: "facture", article: "la", title: "Envoyer la facture" },
  quote: { singular: "devis", article: "le", title: "Envoyer le devis" },
  creditNote: { singular: "avoir", article: "l'", title: "Envoyer l'avoir" },
};

// Récupérer le template sauvegardé depuis les paramètres email
function getSavedTemplate(emailSettings, documentType) {
  if (!emailSettings) return null;
  
  switch (documentType) {
    case "invoice":
      return emailSettings.invoiceEmailTemplate || null;
    case "quote":
      return emailSettings.quoteEmailTemplate || null;
    case "creditNote":
      return emailSettings.creditNoteEmailTemplate || null;
    default:
      return null;
  }
}

function getDefaultEmailContent(documentType, emailSettings) {
  const labels = DOCUMENT_LABELS[documentType] || DOCUMENT_LABELS.invoice;
  
  let subject;
  if (documentType === "invoice") {
    subject = "Facture {documentNumber}";
  } else if (documentType === "quote") {
    subject = "Devis {documentNumber}";
  } else {
    subject = "Avoir {documentNumber}";
  }
  
  // Utiliser le template sauvegardé en base s'il existe
  const savedTemplate = getSavedTemplate(emailSettings, documentType);
  if (savedTemplate) {
    return { subject, body: savedTemplate };
  }
  
  let instruction;
  let invoiceRef = "";
  if (documentType === "quote") {
    instruction = "N'hésitez pas à nous contacter pour toute question concernant ce devis.";
  } else if (documentType === "invoice") {
    instruction = "Nous vous remercions de bien vouloir procéder au règlement selon les conditions indiquées.";
  } else {
    instruction = "Cet avoir a été établi suite à votre demande.";
    invoiceRef = " relatif à la facture {invoiceNumber}";
  }
  
  // Ajouter un espace après l'article si nécessaire (pour "la facture", "le devis", mais pas "l'avoir")
  const articleWithSpace = labels.article.endsWith("'") ? labels.article : `${labels.article} `;
  
  const body = `Bonjour {clientName},

Veuillez trouver ci-joint ${articleWithSpace}${labels.singular} {documentNumber}${invoiceRef}.

${instruction}

Cordialement,
{companyName}`;

  return { subject, body };
}

export function SendDocumentModal({ 
  open, 
  onOpenChange, 
  documentId,
  documentType = "invoice",
  documentNumber,
  clientName,
  clientEmail,
  totalAmount,
  companyName,
  issueDate,
  dueDate,
  invoiceNumber, // Numéro de la facture associée (pour les avoirs)
  onSent,
  onClose, // Callback pour fermer l'éditeur de document
}) {
  const [isSending, setIsSending] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const { workspaceId } = useWorkspace();
  
  const labels = DOCUMENT_LABELS[documentType] || DOCUMENT_LABELS.invoice;
  
  // Récupérer les paramètres email
  const { data: emailData } = useEmailSettings();
  const emailSettings = emailData?.getEmailSettings;
  
  // Mutation pour sauvegarder le template
  const [updateEmailSettings] = useUpdateEmailSettings();
  
  // Mutations pour chaque type de document
  const [sendInvoiceEmail] = useSendInvoiceEmail();
  const [sendQuoteEmail] = useSendQuoteEmail();
  const [sendCreditNoteEmail] = useSendCreditNoteEmail();
  
  // Valeurs par défaut (utilise les templates sauvegardés si disponibles)
  const defaultContent = getDefaultEmailContent(documentType, emailSettings);
  
  const methods = useForm({
    defaultValues: {
      emailSubject: defaultContent.subject,
      emailBody: defaultContent.body,
    },
  });

  const { handleSubmit, watch, reset } = methods;

  // Reset le formulaire quand la modal s'ouvre ou quand les paramètres email sont chargés
  useEffect(() => {
    if (open) {
      const content = getDefaultEmailContent(documentType, emailSettings);
      reset({
        emailSubject: content.subject,
        emailBody: content.body,
      });
      setShowMobilePreview(false);
    }
  }, [open, documentType, emailSettings, reset]);

  const onSubmit = async (data) => {
    if (!clientEmail) {
      toast.error("Le client n'a pas d'adresse email");
      return;
    }
    
    setIsSending(true);
    try {
      const input = {
        documentId,
        emailSubject: data.emailSubject,
        emailBody: data.emailBody,
        recipientEmail: clientEmail,
      };
      
      let result;
      if (documentType === "invoice") {
        result = await sendInvoiceEmail({
          variables: { workspaceId, input },
        });
      } else if (documentType === "quote") {
        result = await sendQuoteEmail({
          variables: { workspaceId, input },
        });
      } else {
        result = await sendCreditNoteEmail({
          variables: { workspaceId, input },
        });
      }
      
      // Sauvegarder le template en base de données pour les prochains envois
      if (emailSettings) {
        const templateUpdate = {
          fromEmail: emailSettings.fromEmail,
          fromName: emailSettings.fromName || "",
          replyTo: emailSettings.replyTo || "",
          invoiceEmailTemplate: documentType === "invoice" ? data.emailBody : (emailSettings.invoiceEmailTemplate || ""),
          quoteEmailTemplate: documentType === "quote" ? data.emailBody : (emailSettings.quoteEmailTemplate || ""),
          creditNoteEmailTemplate: documentType === "creditNote" ? data.emailBody : (emailSettings.creditNoteEmailTemplate || ""),
        };
        
        // Sauvegarder en arrière-plan sans bloquer l'envoi
        updateEmailSettings({ variables: { input: templateUpdate } }).catch(() => {
          // Ignorer les erreurs de sauvegarde du template
        });
      }
      
      toast.success(`${labels.singular.charAt(0).toUpperCase() + labels.singular.slice(1)} envoyée avec succès`);
      onOpenChange(false);
      onSent?.();
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      toast.error(error.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setIsSending(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    // Ne pas appeler onSent car l'email n'a pas été envoyé
    // onClose est appelé uniquement depuis la dialog de confirmation (croix)
  };

  if (!open) return null;

  const senderEmail = emailData?.getEmailSettings?.fromEmail;
  const senderName = emailData?.getEmailSettings?.fromName;

  // Handler pour confirmer la fermeture
  const handleCloseConfirm = () => {
    setShowCloseConfirm(false);
    onOpenChange(false);
    onClose?.(); // Fermer aussi l'éditeur de document
  };

  return (
    <>
      {/* Dialog de confirmation de fermeture */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Fermer sans envoyer ?</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.article.charAt(0).toUpperCase() + labels.article.slice(1)}{labels.singular} a été créé(e) mais n&apos;a pas encore été envoyé(e) par email. 
              Êtes-vous sûr de vouloir fermer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.stopPropagation();
              handleCloseConfirm();
            }}>
              Fermer sans envoyer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full h-full md:max-w-7xl md:h-[90vh] bg-white dark:bg-[#1a1a1a] md:rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                {labels.title}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden sm:block">
                Envoyez {labels.article}{labels.singular} par email à votre client
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowCloseConfirm(true);
              }}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

        {/* Content */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex overflow-hidden">
            {/* Left Panel - Form */}
            <div className="w-full lg:w-1/2 overflow-y-auto lg:border-r border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <SendDocumentEmailForm 
                  documentType={documentType}
                  clientEmail={clientEmail}
                  clientName={clientName}
                />
              </div>
            </div>

            {/* Right Panel - Preview (hidden on mobile) */}
            <div className="hidden lg:block w-1/2 overflow-y-auto p-6 bg-gray-50 dark:bg-[#252525]">
              <SendDocumentEmailPreview 
                formData={watch()} 
                documentType={documentType}
                documentNumber={documentNumber}
                clientName={clientName}
                clientEmail={clientEmail}
                totalAmount={totalAmount}
                companyName={companyName}
                senderEmail={senderEmail}
                senderName={senderName}
                issueDate={issueDate}
                dueDate={dueDate}
                invoiceNumber={invoiceNumber}
              />
            </div>
          </form>
        </FormProvider>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525]">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            disabled={isSending}
            className="text-sm"
          >
            Ne pas envoyer
          </Button>
          <Button
            type="submit"
            onClick={(e) => {
              e.stopPropagation();
              handleSubmit(onSubmit)(e);
            }}
            disabled={isSending || !clientEmail}
            className="gap-2 text-sm bg-[#5b50ff] hover:bg-[#4a41e0]"
          >
            {isSending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer au client
          </Button>
        </div>

        {/* Floating Preview Button (mobile/tablet only) */}
        <Button
          type="button"
          onClick={() => setShowMobilePreview(true)}
          className="lg:hidden fixed bottom-24 right-4 h-12 w-12 rounded-full shadow-lg bg-[#5b50ff] hover:bg-[#4a41e0] z-50"
          size="icon"
        >
          <Eye className="h-5 w-5 text-white" />
        </Button>

        {/* Mobile Preview Overlay */}
        {showMobilePreview && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-white dark:bg-[#1a1a1a] flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aperçu de l&apos;email</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobilePreview(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#252525]">
              <SendDocumentEmailPreview 
                formData={watch()} 
                documentType={documentType}
                documentNumber={documentNumber}
                clientName={clientName}
                clientEmail={clientEmail}
                totalAmount={totalAmount}
                companyName={companyName}
                senderEmail={senderEmail}
                senderName={senderName}
                issueDate={issueDate}
                dueDate={dueDate}
                invoiceNumber={invoiceNumber}
              />
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
