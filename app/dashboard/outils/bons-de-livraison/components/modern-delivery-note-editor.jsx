"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { FormProvider } from "react-hook-form";
import { X, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
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
import { getActiveOrganization } from "@/src/lib/organization-client";
import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";
import { useOrganizationUpdatedSync } from "@/src/hooks/useOrganizationUpdatedSync";
import { ResourceNotFound } from "@/src/components/resource-not-found";
import { useClient } from "@/src/graphql/clientQueries";
import ClientsModal from "@/app/dashboard/clients/components/clients-modal";
import { SendDocumentModal } from "@/app/dashboard/outils/factures/components/send-document-modal";
import { formatDeliveryNoteReference } from "@/src/graphql/deliveryNoteQueries";
import { useDeliveryNoteEditor } from "../hooks/use-delivery-note-editor";
import EnhancedDeliveryNoteForm from "./enhanced-delivery-note-form";
import DeliveryNotePreview from "./DeliveryNotePreview";

const LIST_URL = "/dashboard/outils/bons-de-livraison";

export default function ModernDeliveryNoteEditor({
  mode = "create",
  deliveryNoteId = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromUrl =
    mode === "create" ? searchParams.get("clientId") : null;
  const { client: preselectedClient } = useClient(clientIdFromUrl);

  const [showEditClient, setShowEditClient] = useState(false);
  const [debouncedPreview, setDebouncedPreview] = useState(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [createdDeliveryNote, setCreatedDeliveryNote] = useState(null);
  const [organization, setOrganization] = useState(null);
  useOrganizationUpdatedSync(setOrganization);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const bypassGuardRef = useRef(false);
  const sentinelPushedRef = useRef(false);

  useEffect(() => {
    getActiveOrganization()
      .then((org) => setOrganization(org))
      .catch(() => {});
  }, []);

  const {
    form,
    formData,
    previewData,
    setFormData,
    loading,
    saving,
    onSave,
    onSubmit,
    deliveryNote: loadedDeliveryNote,
    error: deliveryNoteError,
    validationErrors,
    setValidationErrors,
    nextDeliveryNumber,
    isDraft,
  } = useDeliveryNoteEditor({ mode, deliveryNoteId, organization });

  // Pré-remplir le client si clientId est dans l'URL
  useEffect(() => {
    if (preselectedClient && mode === "create" && !formData?.client) {
      form.setValue("client", preselectedClient, { shouldDirty: true });
    }
  }, [preselectedClient, mode, form, formData?.client]);

  // Aperçu debouncé : pas de re-rendu à chaque frappe
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPreview(previewData), 300);
    return () => clearTimeout(timer);
  }, [previewData]);

  const previewElement = useMemo(
    () =>
      debouncedPreview ? <DeliveryNotePreview data={debouncedPreview} /> : null,
    [debouncedPreview],
  );

  useOrganizationChange({
    resourceId: deliveryNoteId,
    listUrl: LIST_URL,
    enabled: mode !== "create" && !loading,
  });

  if (mode !== "create" && !loading && !loadedDeliveryNote && deliveryNoteError) {
    return <ResourceNotFound listUrl={LIST_URL} homeUrl="/dashboard" />;
  }

  const isCreating = mode === "create";
  const isFinalized = !isCreating && !isDraft;

  // Garde « modifications non sauvegardées » : client + au moins un article
  const watchedItems = form.watch("items");
  const watchedClient = form.watch("client");
  const hasUserChanges =
    !!(watchedClient && watchedClient.id) &&
    Array.isArray(watchedItems) &&
    watchedItems.length > 0 &&
    form.formState.isDirty;

  useEffect(() => {
    if (!hasUserChanges) return;
    if (!sentinelPushedRef.current) {
      window.history.pushState({ deliveryNoteEditorGuard: true }, "");
      sentinelPushedRef.current = true;
    }
    const handlePopState = () => {
      if (bypassGuardRef.current) {
        bypassGuardRef.current = false;
        return;
      }
      window.history.pushState({ deliveryNoteEditorGuard: true }, "");
      setShowUnsavedDialog(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasUserChanges]);

  const leaveEditor = () => {
    bypassGuardRef.current = true;
    router.push(LIST_URL);
  };

  const handleBack = () => {
    if (hasUserChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    leaveEditor();
  };

  const handleSaveDraftAndLeave = async () => {
    setSavingDraft(true);
    const ok = await onSave();
    setSavingDraft(false);
    if (ok) setShowUnsavedDialog(false);
  };

  const formatDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString("fr-FR");
  };

  // Émission / modification, puis retour à la liste avec toast + envoi email
  const handleSubmitWithEmail = async () => {
    const result = await onSubmit();
    if (!result?.success || !result?.deliveryNote) return;
    const dn = result.deliveryNote;
    const payload = {
      id: dn.id,
      number: formatDeliveryNoteReference(dn),
      clientName: dn.client?.name,
      clientEmail: dn.client?.email,
      companyName: dn.companyInfo?.name,
      issueDate: formatDate(dn.issueDate),
    };
    setCreatedDeliveryNote(payload);
    if (isFinalized) {
      bypassGuardRef.current = true;
      router.push(LIST_URL);
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem("newDeliveryNoteData", JSON.stringify(payload));
    }
    bypassGuardRef.current = true;
    router.push(LIST_URL);
  };

  const handleClientUpdated = (updatedClient) => {
    setFormData((prev) => ({ ...prev, client: updatedClient }));
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Colonne gauche : formulaire */}
        <div className="px-4 pt-6 pb-4 md:px-6 md:pt-6 flex flex-col h-full overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full">
            <div className="flex items-center justify-between pb-4 md:pb-6 border-b">
              <div>
                <h1 className="text-xl md:text-2xl font-medium mb-1">
                  {isCreating && "Nouveau bon de livraison"}
                  {!isCreating && "Modifier le bon de livraison"}
                </h1>
                {!isCreating && loadedDeliveryNote && (
                  <p className="text-sm text-muted-foreground">
                    {formatDeliveryNoteReference(loadedDeliveryNote)}
                    {loadedDeliveryNote.sourceQuote?.number &&
                      ` · issu du devis ${loadedDeliveryNote.sourceQuote.prefix || ""}-${loadedDeliveryNote.sourceQuote.number}`}
                    {loadedDeliveryNote.sourceInvoice?.number &&
                      ` · issu de la facture ${loadedDeliveryNote.sourceInvoice.prefix || ""}-${loadedDeliveryNote.sourceInvoice.number}`}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8 w-8 p-0 md:hidden"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0">
                <FormProvider {...form}>
                  <EnhancedDeliveryNoteForm
                    mode={mode}
                    loading={loading}
                    saving={saving}
                    onSave={onSave}
                    onSubmit={handleSubmitWithEmail}
                    onLeave={leaveEditor}
                    hasUserChanges={hasUserChanges}
                    validationErrors={validationErrors}
                    setValidationErrors={setValidationErrors}
                    nextDeliveryNumber={nextDeliveryNumber}
                    isDraft={isCreating || isDraft}
                    onEditClient={() => setShowEditClient(true)}
                  />
                </FormProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite : aperçu */}
        <div className="border-l flex-col h-full overflow-hidden hidden lg:flex">
          <div className="flex-1 overflow-y-auto pl-18 pr-18 pt-22 pb-22 bg-[#F9F9F9] dark:bg-[#1a1a1a] h-full relative">
            {debouncedPreview ? (
              <div>{previewElement}</div>
            ) : loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#F9F9F9] dark:bg-[#1a1a1a]">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {formData.client && (
        <ClientsModal
          open={showEditClient}
          onOpenChange={setShowEditClient}
          client={formData.client}
          onSave={handleClientUpdated}
        />
      )}

      <AlertDialog
        open={showUnsavedDialog}
        onOpenChange={(open) => {
          if (!savingDraft) setShowUnsavedDialog(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enregistrer en brouillon&nbsp;?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non sauvegardées. Voulez-vous
              enregistrer ce bon de livraison avant de quitter&nbsp;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingDraft}>Annuler</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setShowUnsavedDialog(false);
                leaveEditor();
              }}
              disabled={savingDraft}
            >
              Quitter sans enregistrer
            </Button>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSaveDraftAndLeave();
              }}
              disabled={savingDraft}
            >
              {savingDraft ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {createdDeliveryNote && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={createdDeliveryNote.id}
          documentType="deliveryNote"
          documentNumber={createdDeliveryNote.number}
          clientName={createdDeliveryNote.clientName}
          clientEmail={createdDeliveryNote.clientEmail}
          totalAmount=""
          companyName={createdDeliveryNote.companyName}
          issueDate={createdDeliveryNote.issueDate}
          onSent={() => {
            setShowSendEmailModal(false);
            router.push(LIST_URL);
          }}
          onClose={() => router.push(LIST_URL)}
        />
      )}
    </div>
  );
}
