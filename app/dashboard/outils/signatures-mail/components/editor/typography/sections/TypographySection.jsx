"use client";

import React, { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Plus,
  X,
  Search,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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

const weightOptions = [
  { value: "400", label: "Normal" },
  { value: "700", label: "Bold" },
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

// Liste des champs typographiques disponibles
const TYPOGRAPHY_FIELDS = [
  "fullName",
  "position",
  "email",
  "phone",
  "mobile",
  "website",
  "address",
];

export default function TypographySection({
  signatureData,
  updateSignatureData,
}) {
  // États pour les Popovers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFieldPopover, setOpenFieldPopover] = useState(null);

  const updateTypography = (newTypography) => {
    updateSignatureData("typography", newTypography);
  };

  // Champs activés (ceux qui ont une entrée dans typography)
  const activeFields = Object.keys(signatureData.typography || {});

  // Champs disponibles pour l'ajout (filtrés par recherche)
  const availableFields = TYPOGRAPHY_FIELDS.filter(
    (field) => !activeFields.includes(field),
  ).filter((field) =>
    fieldLabels[field].toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Ajouter un champ typographique
  const handleAddField = (fieldKey) => {
    const updatedTypography = {
      ...signatureData.typography,
      [fieldKey]: {
        fontFamily: "Arial, sans-serif",
        fontSize: DEFAULT_FONT_SIZES[fieldKey],
        fontWeight: "normal",
        color: "#000000",
        letterSpacing: 0,
        lineHeight: 100,
        textAlign: "left",
      },
    };
    updateTypography(updatedTypography);
  };

  // Supprimer un champ typographique
  const handleRemoveField = (fieldKey) => {
    const updatedTypography = { ...signatureData.typography };
    delete updatedTypography[fieldKey];
    updateTypography(updatedTypography);
  };

  // Mettre à jour une propriété d'un champ
  const updateField = (fieldKey, property, value) => {
    const fieldTypo = signatureData.typography?.[fieldKey] || {};
    updateTypography({
      ...signatureData.typography,
      [fieldKey]: {
        ...fieldTypo,
        [property]: value,
      },
    });
  };

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Header avec titre et bouton + */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Typographie</h2>
        <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
          <PopoverTrigger asChild>
            <button
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Ajouter un champ typographique"
            >
              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg"
            side="left"
            align="start"
            sideOffset={12}
          >
            {/* Barre de recherche */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-md">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
            {/* Liste des champs disponibles */}
            <div className="max-h-64 overflow-y-auto py-1">
              {availableFields.length > 0 ? (
                availableFields.map((fieldKey) => (
                  <button
                    key={fieldKey}
                    onClick={() => {
                      handleAddField(fieldKey);
                      setIsAddOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Type className="w-4 h-4" />
                    {fieldLabels[fieldKey]}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-400">
                  {activeFields.length === TYPOGRAPHY_FIELDS.length
                    ? "Tous les champs sont ajoutés"
                    : "Aucun résultat"}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Liste des champs activés */}
      {activeFields.length > 0 && (
        <div className="flex flex-col gap-3 ml-4">
          {activeFields.map((fieldKey) => {
            const fieldTypo = signatureData.typography?.[fieldKey] || {};
            return (
              <div key={fieldKey} className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground w-16">
                  {fieldLabels[fieldKey]?.split(" ")[0] || fieldKey}
                </Label>
                <Popover
                  open={openFieldPopover === fieldKey}
                  onOpenChange={(open) =>
                    setOpenFieldPopover(open ? fieldKey : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 w-40 px-1.5 justify-start gap-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        <span className="text-xs font-normal truncate">
                          {fieldLabels[fieldKey]}
                        </span>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-72 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg"
                    side="left"
                    align="start"
                    sideOffset={160}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {fieldLabels[fieldKey]}
                      </span>
                      <button
                        onClick={() => setOpenFieldPopover(null)}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    {/* Contenu */}
                    <div className="p-4 space-y-4">
                      {/* Police */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Police
                        </Label>
                        <Select
                          value={fieldTypo.fontFamily || "Arial, sans-serif"}
                          onValueChange={(value) =>
                            updateField(fieldKey, "fontFamily", value)
                          }
                        >
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {fontOptions.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Graisse */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Graisse
                        </Label>
                        <Select
                          value={fieldTypo.fontWeight || "normal"}
                          onValueChange={(value) =>
                            updateField(fieldKey, "fontWeight", value)
                          }
                        >
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {weightOptions.map((weight) => (
                              <SelectItem
                                key={weight.value}
                                value={weight.value}
                              >
                                {weight.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Couleur */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Couleur
                        </Label>
                        <ColorPicker
                          color={fieldTypo.color || "#000000"}
                          onChange={(color) =>
                            updateField(fieldKey, "color", color)
                          }
                        />
                      </div>

                      {/* Taille */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Taille
                        </Label>
                        <div className="flex items-center gap-1">
                          <Input
                            className="h-7 w-16 px-2 py-1 text-xs text-center"
                            type="text"
                            inputMode="decimal"
                            value={
                              fieldTypo.fontSize ?? DEFAULT_FONT_SIZES[fieldKey]
                            }
                            onChange={(e) => {
                              const numValue = parseInt(e.target.value);
                              if (!isNaN(numValue) && numValue >= 1) {
                                updateField(fieldKey, "fontSize", numValue);
                              }
                            }}
                          />
                          <span className="text-xs text-gray-400">Px</span>
                        </div>
                      </div>

                      {/* Letter spacing */}
                      {/* <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Letter
                        </Label>
                        <div className="flex items-center gap-1">
                          <Input
                            className="h-7 w-16 px-2 py-1 text-xs text-center"
                            type="text"
                            inputMode="decimal"
                            value={fieldTypo.letterSpacing ?? 0}
                            onChange={(e) => {
                              const numValue = parseInt(e.target.value);
                              if (!isNaN(numValue)) {
                                updateField(
                                  fieldKey,
                                  "letterSpacing",
                                  numValue,
                                );
                              }
                            }}
                          />
                          <span className="text-xs text-gray-400">Px</span>
                        </div>
                      </div> */}

                      {/* Line height */}
                      {/* <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Line
                        </Label>
                        <div className="flex items-center gap-1">
                          <Input
                            className="h-7 w-16 px-2 py-1 text-xs text-center"
                            type="text"
                            inputMode="decimal"
                            value={fieldTypo.lineHeight ?? 100}
                            onChange={(e) => {
                              const numValue = parseInt(e.target.value);
                              if (!isNaN(numValue) && numValue >= 1) {
                                updateField(fieldKey, "lineHeight", numValue);
                              }
                            }}
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                      </div> */}

                      {/* Alignement */}
                      {/* <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Alignement
                        </Label>
                        <div className="flex items-center gap-0 border border-gray-200 dark:border-gray-700 rounded-md">
                          <button
                            type="button"
                            className={`h-7 w-8 flex items-center justify-center rounded-l-md transition-colors ${
                              (fieldTypo.textAlign || "left") === "left"
                                ? "bg-blue-100 text-blue-600"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                            onClick={() =>
                              updateField(fieldKey, "textAlign", "left")
                            }
                          >
                            <AlignLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className={`h-7 w-8 flex items-center justify-center border-l border-gray-200 dark:border-gray-700 transition-colors ${
                              fieldTypo.textAlign === "center"
                                ? "bg-blue-100 text-blue-600"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                            onClick={() =>
                              updateField(fieldKey, "textAlign", "center")
                            }
                          >
                            <AlignCenter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className={`h-7 w-8 flex items-center justify-center border-l border-gray-200 dark:border-gray-700 transition-colors ${
                              fieldTypo.textAlign === "right"
                                ? "bg-blue-100 text-blue-600"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                            onClick={() =>
                              updateField(fieldKey, "textAlign", "right")
                            }
                          >
                            <AlignRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className={`h-7 w-8 flex items-center justify-center border-l border-gray-200 dark:border-gray-700 rounded-r-md transition-colors ${
                              fieldTypo.textAlign === "justify"
                                ? "bg-blue-100 text-blue-600"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                            onClick={() =>
                              updateField(fieldKey, "textAlign", "justify")
                            }
                          >
                            <AlignJustify className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div> */}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}
        </div>
      )}

      {/* Message si aucun champ */}
      {activeFields.length === 0 && (
        <div className="ml-4 text-xs text-gray-400">
          Cliquez sur + pour personnaliser la typographie
        </div>
      )}
    </div>
  );
}
