"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
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
  Bold,
  Italic,
  Underline,
  CaseUpper,
} from "lucide-react";
import { useSliderWithInput } from "@/src/hooks/use-slider-with-input";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useForm } from "react-hook-form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { ColorPicker } from "@/src/components/ui/color-picker";
import { Button } from "@/src/components/ui/button";

const FONTS = [
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Courier New", label: "Courier New" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Comic Sans MS", label: "Comic Sans MS" },
];

export default function SpacingSection() {
  const { register, handleSubmit, watch, setValue } = useForm();
  const [spacingValues, setSpacingValues] = useState({
    vertical: 25,
    horizontal: 15,
    sections: 30,
    margin: 16,
    iconText: 8,
  });

  const [primaryColor, setPrimaryColor] = useState("#000000");

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

  const selectedFont = watch("typography.font");

  const handleValueChange = (key, value) => {
    setSpacingValues((prev) => ({
      ...prev,
      [key]: value[0],
    }));
  };

  return (
    <div className="mt-4 flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Typography</h2>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between w-full">
            <Label className="text-xs text-muted-foreground">
              Police générale
            </Label>
            <Select
              value={selectedFont}
              onValueChange={(value) => setValue("typography.font", value)}
            >
              <SelectTrigger className="w-30">
                <SelectValue placeholder="Police générale" />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">Police nom</Label>
            <Select
              value={selectedFont}
              onValueChange={(value) => setValue("typography.font", value)}
            >
              <SelectTrigger className="w-30">
                <SelectValue placeholder="Police nom" />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">
              Police titre/poste
            </Label>
            <Select
              value={selectedFont}
              onValueChange={(value) => setValue("typography.font", value)}
            >
              <SelectTrigger className="w-30">
                <SelectValue placeholder="Police titre/poste" />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">
              Taille texte
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
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Couleurs</h2>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between w-full">
            <Label className="text-xs text-muted-foreground">
              Couleur principale
            </Label>
            <div className="w-30">
              <ColorPicker
                color={primaryColor}
                onChange={setPrimaryColor}
                className="w-30"
                align="start"
                sideOffsetVw="-23.5"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">
              Couleur secondaire
            </Label>
            <div className="w-30">
              <ColorPicker
                color={primaryColor}
                onChange={setPrimaryColor}
                className="w-30"
                align="start"
                sideOffsetVw="-23.5"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">
              Couleur texte
            </Label>
            <div className="w-30">
              <ColorPicker
                color={primaryColor}
                onChange={setPrimaryColor}
                className="w-30"
                align="start"
                sideOffsetVw="-23.5"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">
              Couleur liens
            </Label>
            <div className="w-30">
              <ColorPicker
                color={primaryColor}
                onChange={setPrimaryColor}
                className="w-30"
                align="start"
                sideOffsetVw="-23.5"
              />
            </div>
          </div>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Effets</h2>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">Effets</Label>
            <AlignmentSelector
              items={[
                { value: "Colonne", icon: Bold },
                { value: "Ligne", icon: Italic },
                { value: "Grille", icon: Underline },
              ]}
              size="sm"
              className="w-30"
            />
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">
              Majuscules nom
            </Label>
            <AlignmentSelector
              items={[{ value: "Colonne", icon: CaseUpper }]}
              size="sm"
              className="w-30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
