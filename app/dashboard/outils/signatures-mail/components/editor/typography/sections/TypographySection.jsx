"use client";

import React, { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { ColorPicker } from "@/src/components/ui/color-picker";

// Valeurs par défaut pour chaque champ
const DEFAULT_FONT_SIZES = {
  fullName: 16,
  position: 16,
  company: 14,
  email: 12,
  phone: 12,
  mobile: 12,
  website: 12,
  address: 12,
};

const fontOptions = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Calibri, sans-serif", label: "Calibri" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
];

const fieldLabels = {
  fullName: "Nom complet",
  position: "Poste",
  email: "Email",
  phone: "Téléphone",
  mobile: "Mobile",
  website: "Site web",
  address: "Adresse",
};

function FieldTypographyControls({
  fieldKey,
  fieldLabel,
  typography,
  updateTypography,
  isLast = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fieldTypo = typography?.[fieldKey] || {};

  const updateField = (property, value) => {
    // Si c'est la taille et qu'on efface tout, mettre 1
    if (property === "fontSize" && (value === "" || value === null)) {
      updateTypography({
        ...typography,
        [fieldKey]: {
          ...fieldTypo,
          [property]: 1,
        },
      });
      return;
    }
    updateTypography({
      ...typography,
      [fieldKey]: {
        ...fieldTypo,
        [property]: value,
      },
    });
  };

  return (
    <div className={`p-3 bg-gray-50/50 dark:bg-[#212121] dark:border dark:border-[#434343] dark:rounded-md ${!isLast ? 'border-b border-[#E5E5E5]' : ''}`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Label className="text-xs">{fieldLabel}</Label>
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-muted-foreground">
            {fieldTypo.fontFamily?.split(",")[0] || "Arial"} •{" "}
            {fieldTypo.fontSize || 12}px
          </div>
          {isExpanded ? (
            <Minus className="h-3 w-3" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Police */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Police</Label>
            <div>
              <Select
                value={fieldTypo.fontFamily || "Arial, sans-serif"}
                onValueChange={(value) => updateField("fontFamily", value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Taille */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Taille</Label>
            <div className="flex items-center gap-2 w-48">
              <button
                onClick={() => updateField("fontSize", DEFAULT_FONT_SIZES[fieldKey])}
                className="h-8 w-8 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md flex-shrink-0"
                title={`Réinitialiser à ${DEFAULT_FONT_SIZES[fieldKey]}`}
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <Input
                className="h-8 px-2 py-1 min-w-12"
                style={{ width: `${Math.max(48, (fieldTypo.fontSize?.toString().length || 2) * 8 + 16)}px` }}
                type="text"
                inputMode="decimal"
                value={fieldTypo.fontSize ?? 12}
                onChange={(e) => {
                  if (e.target.value === "") {
                    updateField("fontSize", 1);
                  } else {
                    const numValue = parseInt(e.target.value);
                    if (!isNaN(numValue) && numValue >= 1) {
                      updateField("fontSize", numValue);
                    }
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    updateField("fontSize", 1);
                  } else {
                    const numValue = parseInt(e.target.value);
                    if (!isNaN(numValue) && numValue >= 1) {
                      updateField("fontSize", numValue);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (e.target.value === "") {
                      updateField("fontSize", 1);
                    } else {
                      const numValue = parseInt(e.target.value);
                      if (!isNaN(numValue) && numValue >= 1) {
                        updateField("fontSize", numValue);
                      }
                    }
                  }
                }}
                aria-label="Taille de la police"
                placeholder="12"
              />
              <Slider
                className="grow h-4"
                value={[fieldTypo.fontSize || 12]}
                onValueChange={(value) => updateField("fontSize", value[0])}
                min={8}
                max={32}
                step={1}
                aria-label="Taille police"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>

          {/* Couleur */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Couleur</Label>
            <ColorPicker
              color={fieldTypo.color || "#000000"}
              onChange={(color) => updateField("color", color)}
            />
          </div>

          {/* Effets de texte */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Effets</Label>
            <div className="flex items-center gap-0 w-30 border border-input rounded-md">
              <button
                type="button"
                className={`flex-1 h-8 px-2 flex items-center justify-center border-r border-input first:rounded-l-md last:rounded-r-md last:border-r-0 transition-colors ${
                  fieldTypo.fontWeight === "bold"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
                onClick={() =>
                  updateField(
                    "fontWeight",
                    fieldTypo.fontWeight === "bold" ? "normal" : "bold"
                  )
                }
              >
                <Bold className="h-3 w-3" />
              </button>
              <button
                type="button"
                className={`flex-1 h-8 px-2 flex items-center justify-center border-r border-input first:rounded-l-md last:rounded-r-md last:border-r-0 transition-colors ${
                  fieldTypo.fontStyle === "italic"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
                onClick={() =>
                  updateField(
                    "fontStyle",
                    fieldTypo.fontStyle === "italic" ? "normal" : "italic"
                  )
                }
              >
                <Italic className="h-3 w-3" />
              </button>
              <button
                type="button"
                className={`flex-1 h-8 px-2 flex items-center justify-center border-r border-input first:rounded-l-md last:rounded-r-md last:border-r-0 transition-colors ${
                  fieldTypo.textDecoration === "underline"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
                onClick={() =>
                  updateField(
                    "textDecoration",
                    fieldTypo.textDecoration === "underline"
                      ? "none"
                      : "underline"
                  )
                }
              >
                <Underline className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TypographySection({
  signatureData,
  updateSignatureData,
}) {
  const updateTypography = (newTypography) => {
    updateSignatureData("typography", newTypography);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Typographie</h2>
      <div className="flex flex-col gap-3">
        {Object.entries(fieldLabels).map(([fieldKey, fieldLabel], index, array) => (
          <FieldTypographyControls
            key={fieldKey}
            fieldKey={fieldKey}
            fieldLabel={fieldLabel}
            typography={signatureData.typography}
            updateTypography={updateTypography}
            isLast={index === array.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
