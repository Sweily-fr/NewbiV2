"use client";

import React from "react";
import { Plus, Settings2 } from "lucide-react";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { WidgetPalette, WidgetSettings } from "../widgets";
import { Separator } from "@/src/components/ui/separator";

/**
 * WidgetEditorContent - Sidebar content for the modular widget editor
 * Shows either the widget palette (add mode) or widget settings (edit mode)
 */
export default function WidgetEditorContent() {
  const {
    signatureData,
    widgets,
    selectedWidgetId,
    addWidget,
    updateWidget,
    deleteWidget,
    selectWidget,
    getSelectedWidget,
  } = useSignatureData();

  const selectedWidget = getSelectedWidget();

  // If a widget is selected, show its settings
  if (selectedWidget) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 px-1 pb-4">
          <Settings2 className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium">Paramètres de l'élément</span>
        </div>

        <Separator className="mb-4" />

        {/* Settings panel */}
        <WidgetSettings
          widget={selectedWidget}
          onUpdate={updateWidget}
          onDelete={deleteWidget}
          onClose={() => selectWidget(null)}
        />
      </div>
    );
  }

  // Otherwise, show the widget palette
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-1 pb-4">
        <Plus className="w-4 h-4 text-neutral-500" />
        <span className="text-sm font-medium">Ajouter un élément</span>
      </div>

      <Separator className="mb-4" />

      {/* Widget palette */}
      <WidgetPalette onAddWidget={addWidget} signatureData={signatureData} />

      {/* Info footer */}
      <div className="mt-auto pt-6">
        <Separator className="mb-4" />
        <div className="text-xs text-neutral-500 space-y-2">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Cliquez sur un élément pour le modifier
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Double-cliquez pour éditer le texte
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Glissez pour réorganiser
          </p>
        </div>
      </div>
    </div>
  );
}
