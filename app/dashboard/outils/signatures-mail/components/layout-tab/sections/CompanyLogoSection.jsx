"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";

export default function CompanyLogoSection({ signatureData, updateSignatureData }) {
  // Gestion de la taille du logo
  const handleLogoSizeChange = (value) => {
    const numValue = parseInt(value) || 60;
    updateSignatureData('logoSize', Math.max(30, Math.min(120, numValue))); // Entre 30 et 120px
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Logo entreprise</h2>
      <div className="flex flex-col gap-3 ml-4">
        {/* Upload du logo entreprise */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Image</Label>
          <div className="flex items-center gap-3 w-30">
            <span className="text-xs text-muted-foreground">Glisser ou cliquer</span>
          </div>
        </div>
        
        {/* Taille du logo */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Taille</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.logoSize || 60}
              onChange={(e) => handleLogoSizeChange(e.target.value)}
              onBlur={(e) => handleLogoSizeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogoSizeChange(e.target.value);
                }
              }}
              aria-label="Taille du logo entreprise"
              placeholder="60"
            />
            <Slider
              className="grow"
              value={[signatureData.logoSize || 60]}
              onValueChange={(value) => handleLogoSizeChange(value[0])}
              min={30}
              max={120}
              step={5}
              aria-label="Taille logo"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>
      </div>
    </div>
  );
}
