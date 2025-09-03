"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import { Square } from "lucide-react";

export default function ProfileImageSection({ signatureData, updateSignatureData }) {
  // Gestion de l'espacement entre prénom et nom
  const handleNameSpacingChange = (value) => {
    const numValue = parseInt(value) || 0;
    updateSignatureData('nameSpacing', Math.max(0, Math.min(20, numValue))); // Entre 0 et 20px
  };

  // Gestion de la taille de l'image de profil
  const handleImageSizeChange = (value) => {
    const numValue = parseInt(value) || 80;
    updateSignatureData('imageSize', Math.max(40, Math.min(150, numValue))); // Entre 40 et 150px
  };

  // Gestion de la forme de l'image de profil
  const handleImageShapeChange = (shape) => {
    updateSignatureData('imageShape', shape);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Photo de profil</h2>
      <div className="flex flex-col gap-3 ml-4">
        {/* Upload de la photo de profil */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Image</Label>
          <div className="flex items-center gap-3 w-30">
            <span className="text-xs text-muted-foreground">Glisser ou cliquer</span>
          </div>
        </div>
        
        {/* Taille de l'image */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Taille</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.imageSize || 80}
              onChange={(e) => handleImageSizeChange(e.target.value)}
              onBlur={(e) => handleImageSizeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleImageSizeChange(e.target.value);
                }
              }}
              aria-label="Taille de l'image de profil"
              placeholder="80"
            />
            <Slider
              className="grow"
              value={[signatureData.imageSize || 80]}
              onValueChange={(value) => handleImageSizeChange(value[0])}
              min={40}
              max={150}
              step={5}
              aria-label="Taille image"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>
        
        {/* Forme de l'image */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Forme</Label>
          <AlignmentSelector
            items={[
              { value: "round", icon: () => <div className="w-4 h-4 bg-current rounded-full" /> },
              { value: "square", icon: Square },
            ]}
            size="sm"
            className="w-30"
            value={signatureData.imageShape || 'round'}
            onValueChange={handleImageShapeChange}
          />
        </div>
        
        {/* Espacement nom */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Espacement nom</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.nameSpacing || 0}
              onChange={(e) => handleNameSpacingChange(e.target.value)}
              onBlur={(e) => handleNameSpacingChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleNameSpacingChange(e.target.value);
                }
              }}
              aria-label="Espacement entre prénom et nom"
              placeholder="0"
            />
            <Slider
              className="grow"
              value={[signatureData.nameSpacing || 0]}
              onValueChange={(value) => handleNameSpacingChange(value[0])}
              min={0}
              max={20}
              step={1}
              aria-label="Espacement nom"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>
      </div>
    </div>
  );
}
