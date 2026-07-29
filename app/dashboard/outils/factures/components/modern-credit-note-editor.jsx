"use client";

import { useState, useEffect, useRef } from "react";
import { FormProvider } from "react-hook-form";
import {
  ArrowLeft,
  Receipt,
  Send,
  FileText,
  Settings,
  X,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useRouter } from "next/navigation";
import { useCreditNoteEditor } from "../hooks/use-credit-note-editor";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import EnhancedCreditNoteForm from "./enhanced-credit-note-form";
import { getActiveOrganization } from "@/src/lib/organization-client";
import { SendDocumentModal } from "./send-document-modal";
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

export default function ModernCreditNoteEditor({
  mode = "create",
  creditNoteId = null,
  invoiceId = null,
  initialData = null,
}) {
  const router = useRouter();
  const [organization, setOrganization] = useState(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [createdCreditNoteData, setCreatedCreditNoteData] = useState(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const bypassGuardRef = useRef(false);
  const sentinelPushedRef = useRef(false);
  const pdfRef = useRef(null);

  // Récupérer l'organisation au chargement
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const org = await getActiveOrganization();
        setOrganization(org);
      } catch (error) {
        // Error silently ignored
      }
    };
    fetchOrganization();
  }, []);

  const {
    form,
    formData,
    originalInvoice,
    invoiceError,
    existingCreditNote,
    loading,
    isDirty,
    errors,
    createCreditNoteAction,
    finalize,
  } = useCreditNoteEditor({
    mode,
    creditNoteId,
    invoiceId,
    initialData,
    organization,
  });

  const isReadOnly = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  // La modal de confirmation ne s'affiche que si l'utilisateur a réellement
  // modifié le formulaire (isDirty). Les articles étant toujours pré-remplis
  // depuis la facture d'origine, leur simple présence ne compte pas comme une
  // modification — sinon « Annuler » ne quitterait jamais directement.
  // (Les avoirs n'ont pas de concept de brouillon : on propose juste de rester ou quitter.)
  const hasUserChanges = isDirty;
  const guardActive = hasUserChanges && !isReadOnly;

  // Retour vers la LISTE des factures : on arrive sur l'avoir depuis la liste
  // (sidebar ou menu de ligne). La page détail /factures/[id] rouvre un éditeur
  // plein écran quasi identique, ce qui donne l'impression que l'avoir se rouvre.
  const backUrl = "/dashboard/outils/factures";

  useEffect(() => {
    if (!guardActive) return;

    if (!sentinelPushedRef.current) {
      window.history.pushState({ creditNoteEditorGuard: true }, "");
      sentinelPushedRef.current = true;
    }

    const handlePopState = () => {
      if (bypassGuardRef.current) {
        bypassGuardRef.current = false;
        return;
      }
      window.history.pushState({ creditNoteEditorGuard: true }, "");
      setShowUnsavedDialog(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [guardActive]);

  const leaveEditor = () => {
    bypassGuardRef.current = true;
    router.push(backUrl);
  };

  const handleLeaveWithoutSaving = () => {
    setShowUnsavedDialog(false);
    leaveEditor();
  };

  // Fonction helper pour formater les dates
  const formatDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("fr-FR");
  };

  const handleFinalize = async () => {
    try {
      const result = await finalize(false); // Ne pas rediriger automatiquement

      if (result?.success && result?.creditNote) {
        // Stocker les données de l'avoir créé pour la modal d'envoi
        // Le montant doit être négatif pour un avoir - utiliser formData ou result
        const amount =
          formData.finalTotalTTC || result.creditNote.finalTotalTTC || 0;

        // Formater le numéro de facture associée avec préfixe
        const invoiceNum = originalInvoice
          ? `${originalInvoice.prefix || "F"}-${originalInvoice.number}`
          : result.creditNote.originalInvoiceNumber;

        // Formater la date de l'avoir - utiliser formData en priorité
        const creditNoteDate = formData.issueDate
          ? formatDate(formData.issueDate)
          : formatDate(result.creditNote.issueDate);

        const creditNoteData = {
          id: result.creditNote.id,
          number: `${result.creditNote.prefix || "AV"}-${result.creditNote.number}`,
          clientName: result.creditNote.client?.name,
          clientEmail: result.creditNote.client?.email,
          totalAmount: new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
          }).format(amount),
          companyName: result.creditNote.companyInfo?.name,
          issueDate: creditNoteDate,
          invoiceNumber: invoiceNum,
          redirectUrl: result.redirectUrl,
        };
        setCreatedCreditNoteData(creditNoteData);

        // Stocker les données dans sessionStorage pour afficher le toast sur la page de liste
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "newCreditNoteData",
            JSON.stringify(creditNoteData),
          );
        }

        // Rediriger vers la liste des factures
        router.push("/dashboard/outils/factures");
      }
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Handler pour fermer la modal après envoi d'email
  const handleEmailModalClose = () => {
    setShowSendEmailModal(false);
    // Rediriger vers la liste des factures après envoi ou fermeture
    router.push("/dashboard/outils/factures");
  };

  // Les avoirs n'ont pas de brouillon : statut unique CREATED. En création,
  // l'avoir n'existe pas encore en base, on affiche « Nouveau ».
  const getStatusBadge = () => {
    if (isCreating) {
      return <Badge variant="secondary">Nouveau</Badge>;
    }
    return <Badge variant="default">Créé</Badge>;
  };

  // Donnée principale selon le mode : l'avoir existant en édition, la facture
  // d'origine en création. Les requêtes Apollo sont en cache-and-network :
  // quand la donnée est déjà en cache, on affiche directement l'éditeur au
  // lieu d'un loader plein écran pendant le refetch.
  const mainDocument = isCreating ? originalInvoice : existingCreditNote;

  if (loading && !mainDocument) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier si la facture originale existe en mode création.
  // Une erreur de requête (session/réseau pas encore rétablis après un
  // refresh) n'est pas une facture supprimée : on propose de réessayer.
  if (mode === "create" && invoiceId && !originalInvoice && !loading) {
    const isLoadError = !!invoiceError;
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <X className="h-12 w-12 text-destructive mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {isLoadError ? "Erreur de chargement" : "Facture introuvable"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isLoadError
              ? "Impossible de charger la facture pour le moment. Réessayez dans quelques instants."
              : "La facture originale n'existe pas ou a été supprimée. Impossible de créer un avoir."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {/* leaveEditor directement : la popup de confirmation n'est pas
                rendue dans cette branche, handleBack y serait sans effet */}
            <Button onClick={leaveEditor} variant="default">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux factures
            </Button>
            {isLoadError && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Réessayer
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Left Panel - Enhanced Form */}
        <div className="px-4 pt-6 pb-4 md:px-6 md:pt-6 flex flex-col h-full overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 md:mb-6 md:pb-6 border-b">
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-xl md:text-2xl font-medium mb-1">
                    {isCreating
                      ? "Créer un avoir"
                      : isEditing
                        ? "Modifier l'avoir"
                        : "Voir l'avoir"}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    {formData?.number && (
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {formData.number}
                      </span>
                    )}
                    {getStatusBadge()}
                    {originalInvoice && (
                      <span className="text-xs md:text-sm text-muted-foreground">
                        • Facture {originalInvoice.number}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4"></div>
            </div>

            {/* Form Content */}
            <div className="flex-1 min-h-0">
              <FormProvider {...form}>
                <EnhancedCreditNoteForm
                  mode={mode}
                  originalInvoice={originalInvoice}
                  organization={organization}
                  onSubmit={handleFinalize}
                  onLeave={leaveEditor}
                  hasUserChanges={hasUserChanges}
                />
              </FormProvider>
            </div>
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div className="hidden lg:flex bg-muted/30 border-l flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto pl-4 pr-4 pt-6 pb-6 md:pl-18 md:pr-18 md:pt-22 md:pb-22 bg-[#F9F9F9] dark:bg-[#1a1a1a]">
            <div ref={pdfRef}>
              <UniversalPreviewPDF
                data={{ ...formData, originalInvoice }}
                type="creditNote"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation avant de quitter avec des articles renseignés */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter l'éditeur&nbsp;?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir quitter&nbsp;? Les modifications non
              enregistrées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rester</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleLeaveWithoutSaving();
              }}
            >
              Quitter sans enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal d'envoi par email */}
      {createdCreditNoteData && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={createdCreditNoteData.id}
          documentType="creditNote"
          documentNumber={createdCreditNoteData.number}
          clientName={createdCreditNoteData.clientName}
          clientEmail={createdCreditNoteData.clientEmail}
          totalAmount={createdCreditNoteData.totalAmount}
          companyName={createdCreditNoteData.companyName}
          issueDate={createdCreditNoteData.issueDate}
          invoiceNumber={createdCreditNoteData.invoiceNumber}
          onSent={handleEmailModalClose}
          onClose={() =>
            router.push(
              createdCreditNoteData.redirectUrl || "/dashboard/outils/factures",
            )
          }
          pdfRef={pdfRef}
        />
      )}
    </div>
  );
}
