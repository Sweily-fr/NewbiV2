"use client";

import { useState, useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { ArrowLeft, FileText, Send, CreditCard } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useRouter } from "next/navigation";
import { useInvoiceEditor } from "../hooks/use-invoice-editor";
import UniversalPreviewPDF from '@/src/components/pdf/UniversalPreviewPDF';
import EnhancedInvoiceForm from "./enhanced-invoice-form";
import { toast } from "sonner";

export default function ModernInvoiceEditor({
  mode = "create",
  invoiceId = null,
  initialData = null,
}) {
  const router = useRouter();
  const {
    form,
    formData,
    setFormData,
    loading,
    saving,
    handleSave,
    handleSubmit,
    handleAutoSave,
    isDirty,
    errors,
  } = useInvoiceEditor({
    mode,
    invoiceId,
    initialData,
  });

  const isReadOnly = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const handleBack = () => {
    router.push("/dashboard/outils/factures");
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        {/* Left Panel - Enhanced Form */}
        <div className="p-6 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-medium">
                    {isCreating && "Nouvelle facture"}
                    {isEditing && "Modifier la facture"}
                    {isReadOnly && "Détails de la facture"}
                  </h1>
                  {isDirty && !isReadOnly && (
                    <p className="text-sm text-muted-foreground">
                      {saving
                        ? "Sauvegarde en cours..."
                        : "Modifications non sauvegardées"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {formData.status && (
                  <Badge
                    variant={
                      formData.status === "DRAFT" ? "secondary" : "default"
                    }
                  >
                    {formData.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Enhanced Form */}
            <div className="flex-1 min-h-0 p-2 -mr-2">
              <FormProvider {...form}>
                <EnhancedInvoiceForm
                  onSave={handleSave}
                  onSubmit={handleSubmit}
                  loading={loading}
                  saving={saving}
                  readOnly={isReadOnly}
                />
              </FormProvider>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="border-l flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Aperçu de la facture</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 h-[calc(100vh-64px)]">
            <UniversalPreviewPDF data={formData} type="invoice" />
          </div>
        </div>
      </div>
    </div>
  );
}
