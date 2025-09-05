"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { X, Upload } from "lucide-react";

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
          <div className="flex items-center gap-2 w-30">
            {signatureData.logo ? (
              <>
                <img 
                  src={signatureData.logo} 
                  alt="Logo entreprise" 
                  className="w-8 h-8 object-contain rounded border bg-white"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateSignatureData('logo', null)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  title="Supprimer le logo"
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => updateSignatureData('logo', e.target.result);
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
                className="h-7 px-2 text-xs flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                Ajouter
              </Button>
            )}
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
