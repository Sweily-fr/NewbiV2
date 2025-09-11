"use client";

import { useState, useEffect } from "react";
import { FormProvider } from "react-hook-form";
import {
  ArrowLeft,
  Receipt,
  Send,
  FileText,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useRouter } from "next/navigation";
import { useCreditNoteEditor } from "../hooks/use-credit-note-editor";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import EnhancedCreditNoteForm from "./enhanced-credit-note-form";
import { toast } from "@/src/components/ui/sonner";
import { getActiveOrganization } from "@/src/lib/organization-client";

export default function ModernCreditNoteEditor({
  mode = "create",
  creditNoteId = null,
  invoiceId = null,
  initialData = null,
}) {
  const router = useRouter();
  const [organization, setOrganization] = useState(null);

  // Récupérer l'organisation au chargement
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const org = await getActiveOrganization();
        setOrganization(org);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'organisation:", error);
      }
    };
    fetchOrganization();
  }, []);

  const {
    form,
    formData,
    originalInvoice,
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

  const handleBack = () => {
    if (invoiceId) {
      router.push(`/dashboard/outils/factures/${invoiceId}`);
    } else {
      router.push("/dashboard/outils/factures");
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      await saveAsDraft(false);
      toast.success("Avoir sauvegardé en brouillon");
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleFinalize = async () => {
    try {
      await finalize(true);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const getStatusBadge = () => {
    const status = formData?.status || "DRAFT";
    const statusConfig = {
      DRAFT: { label: "Brouillon", variant: "secondary" },
      PENDING: { label: "En attente", variant: "default" },
      COMPLETED: { label: "Terminé", variant: "success" },
      CANCELED: { label: "Annulé", variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Left Panel - Enhanced Form */}
        <div className="pl-6 pt-6 pr-6 pb-4 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b">
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-2xl font-medium mb-1">
                    {isCreating ? "Créer un avoir" : isEditing ? "Modifier l'avoir" : "Voir l'avoir"}
                  </h1>
                  <div className="flex items-center gap-2">
                    {formData?.number && (
                      <span className="text-sm text-muted-foreground">
                        {formData.number}
                      </span>
                    )}
                    {getStatusBadge()}
                    {originalInvoice && (
                      <span className="text-sm text-muted-foreground">
                        • Facture {originalInvoice.number}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-hidden">
              <FormProvider {...form}>
                <EnhancedCreditNoteForm
                  mode={mode}
                  originalInvoice={originalInvoice}
                  organization={organization}
                  onSubmit={createCreditNoteAction}
                />
              </FormProvider>
            </div>
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div className="bg-muted/30 border-l flex flex-col h-[calc(100vh-3.5rem)]">
          <div className="p-6 border-b bg-background">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Aperçu</h2>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pl-18 pr-18 pt-22 pb-22 bg-[#F9F9F9] dark:bg-[#1a1a1a] h-[calc(100vh-64px)]">
            <UniversalPreviewPDF data={{...formData, originalInvoice}} type="creditNote" />
          </div>
        </div>
      </div>
    </div>
  );
}
