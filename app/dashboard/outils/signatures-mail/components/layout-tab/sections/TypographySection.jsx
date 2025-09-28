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
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={fieldTypo.fontSize || 12}
                onChange={(e) =>
                  updateField("fontSize", parseInt(e.target.value) || 12)
                }
                onBlur={(e) =>
                  updateField("fontSize", parseInt(e.target.value) || 12)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateField("fontSize", parseInt(e.target.value) || 12);
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
