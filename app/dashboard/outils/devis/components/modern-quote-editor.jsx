"use client";

import { useState, useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { ArrowLeft, FileText, Send, Download, Copy } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useRouter } from "next/navigation";
import { useQuoteEditor } from "../hooks/use-quote-editor";
import QuotePreview from "./QuotePreview";
import EnhancedQuoteForm from "./enhanced-quote-form";
import { toast } from "sonner";

export default function ModernQuoteEditor({ 
  mode = "create", 
  quoteId = null, 
  initialData = null 
}) {
  const router = useRouter();
  const {
    form,
    formData,
    setFormData,
    loading,
    saving,
    onSave,
    onSubmit,
    handleAutoSave,
    isDirty,
    errors,
    nextQuoteNumber,
  } = useQuoteEditor({
    mode,
    quoteId,
    initialData,
  });

  const isReadOnly = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const handleBack = () => {
    router.push("/dashboard/outils/devis");
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
                  <h1 className="text-xl font-bold">
                    {isCreating && "Nouveau devis"}
                    {isEditing && "Modifier le devis"}
                    {isReadOnly && "Détails du devis"}
                  </h1>
                  {isDirty && !isReadOnly && (
                    <p className="text-sm">
                      {saving ? "Sauvegarde en cours..." : "Modifications non sauvegardées"}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {formData.status && (
                  <Badge variant={formData.status === 'DRAFT' ? 'secondary' : 'default'}>
                    {formData.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Enhanced Form */}
            <div className="flex-1 min-h-0 p-2 -mr-2">
              <FormProvider {...form}>
                <EnhancedQuoteForm
                  mode={mode}
                  quoteId={quoteId}
                  formData={formData}
                  loading={loading}
                  saving={saving}
                  onSave={onSave}
                  onSubmit={onSubmit}
                  setFormData={setFormData}
                  canEdit={!isReadOnly}
                  nextQuoteNumber={nextQuoteNumber}
                />
              </FormProvider>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="border-l flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Aperçu du devis
              </h2>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Send className="h-4 w-4" />
                  Email
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Dupliquer
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 h-[calc(100vh-64px)]">
            <QuotePreview data={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}
