"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import {
  CircleOff,
  Minus,
  Dot,
  Slash,
} from "lucide-react";

export default function StructureSection({ signatureData, updateSignatureData }) {
  // Gestion de l'épaisseur du séparateur vertical
  const handleSeparatorVerticalWidthChange = (value) => {
    const numValue = parseInt(value) || 1;
    updateSignatureData('separatorVerticalWidth', Math.max(1, Math.min(5, numValue))); // Entre 1 et 5px
  };

  // Gestion de l'épaisseur du séparateur horizontal
  const handleSeparatorHorizontalWidthChange = (value) => {
    const numValue = parseInt(value) || 1;
    updateSignatureData('separatorHorizontalWidth', Math.max(1, Math.min(5, numValue))); // Entre 1 et 5px
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Structure</h2>
      <div className="flex flex-col gap-3 ml-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Séparateurs</Label>
          <AlignmentSelector
            items={[
              { value: "none", icon: CircleOff },
              { value: "line", icon: Minus },
              { value: "dot", icon: Dot },
              { value: "slash", icon: Slash },
            ]}
            size="sm"
            className="w-30"
          />
        </div>
        
        {/* Séparateur vertical - uniquement pour layout vertical */}
        {signatureData.layout === 'vertical' && (
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Séparateur vertical</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.separatorVerticalWidth || 1}
              onChange={(e) => handleSeparatorVerticalWidthChange(e.target.value)}
              onBlur={(e) => handleSeparatorVerticalWidthChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSeparatorVerticalWidthChange(e.target.value);
                }
              }}
              aria-label="Épaisseur du séparateur vertical"
              placeholder="1"
            />
            <Slider
              className="grow"
              value={[signatureData.separatorVerticalWidth || 1]}
              onValueChange={(value) => handleSeparatorVerticalWidthChange(value[0])}
              min={1}
              max={5}
              step={1}
              aria-label="Épaisseur séparateur vertical"
            />
          </div>
        </div>
        )}
        
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Séparateur horizontal</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.separatorHorizontalWidth || 1}
              onChange={(e) => handleSeparatorHorizontalWidthChange(e.target.value)}
              onBlur={(e) => handleSeparatorHorizontalWidthChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSeparatorHorizontalWidthChange(e.target.value);
                }
              }}
              aria-label="Épaisseur du séparateur horizontal"
              placeholder="1"
            />
            <Slider
              className="grow"
              value={[signatureData.separatorHorizontalWidth || 1]}
              onValueChange={(value) => handleSeparatorHorizontalWidthChange(value[0])}
              min={1}
              max={5}
              step={1}
              aria-label="Épaisseur séparateur horizontal"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Largeur séparateur</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.separatorHorizontalWidth || 1}
              onChange={(e) => handleSeparatorHorizontalWidthChange(e.target.value)}
              onBlur={(e) => handleSeparatorHorizontalWidthChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSeparatorHorizontalWidthChange(e.target.value);
                }
              }}
              aria-label="Largeur séparateur horizontal"
              placeholder="1"
            />
            <Slider
              className="grow"
              value={[signatureData.separatorHorizontalWidth || 1]}
              onValueChange={(value) => handleSeparatorHorizontalWidthChange(value[0])}
              min={1}
              max={5}
              step={1}
              aria-label="Largeur séparateur horizontal"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
