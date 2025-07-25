"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import {
  CircleOff,
  Minus,
  Dot,
  Slash,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  Columns2,
  BetweenHorizontalStart,
  Table2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { useSliderWithInput } from "@/src/hooks/use-slider-with-input";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { useSignatureData } from "@/src/hooks/use-signature-data";

export default function ContentTab() {
  const { signatureData, updateSignatureData } = useSignatureData();
  
  const minValue = 0;
  const maxValue = 100;
  const initialValue = [25];

  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
  } = useSliderWithInput({ minValue, maxValue, initialValue });
  
  // Gestion de l'espacement entre prénom et nom
  const handleNameSpacingChange = (value) => {
    const numValue = parseInt(value) || 0;
    updateSignatureData('nameSpacing', Math.max(0, Math.min(20, numValue))); // Entre 0 et 20px
  };

  return (
    <div className="mt-4 flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Mode d'affichage</h2>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between w-full">
            <Label className="text-xs text-muted-foreground">Orientation</Label>
            <AlignmentSelector
              items={[
                { value: "horizontal", icon: FlipHorizontalIcon },
                { value: "vertical", icon: FlipVerticalIcon },
              ]}
              size="sm"
              className="w-30"
            />
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">Alignement</Label>
            <AlignmentSelector className="w-30" />
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">
              Direction contact
            </Label>
            <AlignmentSelector
              items={[
                { value: "Colonne", icon: Columns2 },
                { value: "Ligne", icon: BetweenHorizontalStart },
                { value: "Grille", icon: Table2 },
              ]}
              size="sm"
              className="w-30"
            />
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">
              Alignement nom
            </Label>
            <AlignmentSelector
              items={[
                { value: "left", icon: AlignLeft },
                { value: "center", icon: AlignCenter },
                { value: "right", icon: AlignRight },
              ]}
              size="sm"
              className="w-30"
              value={signatureData.nameAlignment}
              onValueChange={(value) => updateSignatureData('nameAlignment', value)}
            />
          </div>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Espacements</h2>
        <div className="flex flex-col gap-3 ml-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">vertical</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={inputValues[0]}
                onChange={(e) => handleInputChange(e, 0)}
                onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndUpdateValue(inputValues[0], 0);
                  }
                }}
                aria-label="Enter value"
              />
              <Slider
                className="grow"
                value={sliderValue}
                onValueChange={handleSliderChange}
                min={minValue}
                max={maxValue}
                aria-label="Slider with input"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Horizontal</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={inputValues[0]}
                onChange={(e) => handleInputChange(e, 0)}
                onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndUpdateValue(inputValues[0], 0);
                  }
                }}
                aria-label="Enter value"
              />
              <Slider
                className="grow"
                value={sliderValue}
                onValueChange={handleSliderChange}
                min={minValue}
                max={maxValue}
                aria-label="Slider with input"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Espacement sections
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={inputValues[0]}
                onChange={(e) => handleInputChange(e, 0)}
                onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndUpdateValue(inputValues[0], 0);
                  }
                }}
                aria-label="Enter value"
              />
              <Slider
                className="grow"
                value={sliderValue}
                onValueChange={handleSliderChange}
                min={minValue}
                max={maxValue}
                aria-label="Slider with input"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Marge globale
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={inputValues[0]}
                onChange={(e) => handleInputChange(e, 0)}
                onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndUpdateValue(inputValues[0], 0);
                  }
                }}
                aria-label="Enter value"
              />
              <Slider
                className="grow"
                value={sliderValue}
                onValueChange={handleSliderChange}
                min={minValue}
                max={maxValue}
                aria-label="Slider with input"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Gap</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-full px-2 py-1"
                type="text"
                inputMode="decimal"
                value={inputValues[0]}
                onChange={(e) => handleInputChange(e, 0)}
                onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndUpdateValue(inputValues[0], 0);
                  }
                }}
                aria-label="Enter value"
              />
            </div>
          </div>
          
          {/* Nouvel espacement prénom/nom */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Prénom/Nom</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.nameSpacing}
                onChange={(e) => handleNameSpacingChange(e.target.value)}
                onBlur={(e) => handleNameSpacingChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNameSpacingChange(e.target.value);
                  }
                }}
                aria-label="Espacement entre prénom et nom"
                placeholder="4"
              />
              <Slider
                className="grow"
                value={[signatureData.nameSpacing]}
                onValueChange={(value) => handleNameSpacingChange(value[0])}
                min={0}
                max={20}
                step={1}
                aria-label="Espacement prénom/nom"
              />
            </div>
          </div>
        </div>
      </div>
      <Separator />
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
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Largeur maximale
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={inputValues[0]}
                onChange={(e) => handleInputChange(e, 0)}
                onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndUpdateValue(inputValues[0], 0);
                  }
                }}
                aria-label="Enter value"
              />
              <Slider
                className="grow"
                value={sliderValue}
                onValueChange={handleSliderChange}
                min={minValue}
                max={maxValue}
                aria-label="Slider with input"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Largeur</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={inputValues[0]}
                onChange={(e) => handleInputChange(e, 0)}
                onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndUpdateValue(inputValues[0], 0);
                  }
                }}
                aria-label="Enter value"
              />
              <Slider
                className="grow"
                value={sliderValue}
                onValueChange={handleSliderChange}
                min={minValue}
                max={maxValue}
                aria-label="Slider with input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
