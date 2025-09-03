"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";

export default function ColumnWidthSection({ signatureData, updateSignatureData }) {
  // Gestion de la largeur des colonnes
  const handleColumnWidthChange = (columnKey, value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(10, Math.min(80, numValue)); // Entre 10% et 80%
    
    const updatedWidths = {
      ...signatureData.columnWidths,
      [columnKey]: clampedValue
    };
    
    // Ajustement automatique de l'autre colonne
    if (columnKey === 'photo') {
      updatedWidths.content = 100 - clampedValue;
    } else if (columnKey === 'content') {
      updatedWidths.photo = 100 - clampedValue;
    }
    
    updateSignatureData('columnWidths', updatedWidths);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Largeur des colonnes</h2>
      <div className="space-y-3 ml-4">
        {/* Largeur colonne photo */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Photo</Label>
          <div className="flex items-center gap-3 w-30">
            <Slider
              value={[signatureData.columnWidths?.photo || 25]}
              onValueChange={(value) => handleColumnWidthChange('photo', value[0])}
              max={80}
              min={10}
              step={5}
              className="flex-1"
            />
            <input
              type="text"
              value={signatureData.columnWidths?.photo || 25}
              onChange={(e) => handleColumnWidthChange('photo', e.target.value)}
              className="w-12 h-6 px-2 text-xs border rounded text-center bg-white"
              min="10"
              max="80"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
        
        {/* Largeur colonne contenu */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Contenu</Label>
          <div className="flex items-center gap-3 w-30">
            <Slider
              value={[signatureData.columnWidths?.content || 75]}
              onValueChange={(value) => handleColumnWidthChange('content', value[0])}
              max={80}
              min={10}
              step={5}
              className="flex-1"
            />
            <input
              type="text"
              value={signatureData.columnWidths?.content || 75}
              onChange={(e) => handleColumnWidthChange('content', e.target.value)}
              className="w-12 h-6 px-2 text-xs border rounded text-center bg-white"
              min="10"
              max="80"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
