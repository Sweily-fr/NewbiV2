"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Plus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import DetailedPaddingSection from "./DetailedPaddingSection";

export default function SpacingSection({ signatureData, updateSignatureData }) {
  // Gérer l'activation/désactivation du mode détaillé
  const handleDetailedSpacingToggle = (checked) => {
    if (checked) {
      // Toujours réinitialiser les paddings avec la valeur actuelle de globalSpacing
      const globalSpacing = signatureData.spacings?.global || 8;

      const defaultPaddings = {
        photo: { top: 0, right: 0, bottom: globalSpacing, left: 0 },
        name: { top: 0, right: 0, bottom: globalSpacing, left: 0 },
        position: { top: 0, right: 0, bottom: globalSpacing, left: 0 },
        company: { top: 0, right: 0, bottom: globalSpacing, left: 0 },
        phone: { top: 0, right: 0, bottom: globalSpacing, left: 0 },
        mobile: { top: 0, right: 0, bottom: globalSpacing, left: 0 },
        email: { top: 0, right: 0, bottom: globalSpacing, left: 0 },
        website: { top: 0, right: 0, bottom: globalSpacing, left: 0 },
        address: { top: 0, right: 0, bottom: globalSpacing, left: 0 },
        separatorHorizontal: {
          top: globalSpacing,
          right: 0,
          bottom: globalSpacing,
          left: 0,
        },
        separatorVertical: { top: 0, right: 4, bottom: 0, left: 4 },
        logo: { top: globalSpacing, right: 0, bottom: 0, left: 0 },
        social: { top: globalSpacing, right: 0, bottom: 0, left: 0 },
      };

      // Initialiser les paddings d'abord
      updateSignatureData("paddings", defaultPaddings);
      // Puis activer le mode détaillé
      setTimeout(() => {
        updateSignatureData("detailedSpacing", true);
      }, 0);
    } else {
      // Désactiver le mode détaillé
      updateSignatureData("detailedSpacing", false);
    }
  };

  // Fonction spéciale pour l'espacement global
  const handleGlobalSpacingChange = (value) => {
    if (value === "" || value === null) {
      const clampedValue = 1;
      const updated = {
        ...signatureData.spacings,
        global: clampedValue,
        photoBottom: clampedValue,
        logoBottom: clampedValue,
        nameBottom: clampedValue,
        positionBottom: clampedValue,
        companyBottom: clampedValue,
        contactBottom: clampedValue,
        phoneToMobile: clampedValue,
        mobileToEmail: clampedValue,
        emailToWebsite: clampedValue,
        websiteToAddress: clampedValue,
        separatorTop: clampedValue,
        separatorBottom: clampedValue,
        verticalSeparatorLeft: 4,
        verticalSeparatorRight: clampedValue,
      };
      updateSignatureData("spacings", updated);
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      const clampedValue = numValue;
      const updated = {
        ...signatureData.spacings,
        global: clampedValue,
        photoBottom: clampedValue,
        logoBottom: clampedValue,
        nameBottom: clampedValue,
        positionBottom: clampedValue,
        companyBottom: clampedValue,
        contactBottom: clampedValue,
        phoneToMobile: clampedValue,
        mobileToEmail: clampedValue,
        emailToWebsite: clampedValue,
        websiteToAddress: clampedValue,
        separatorTop: clampedValue,
        separatorBottom: clampedValue,
        verticalSeparatorLeft: 4,
        verticalSeparatorRight: clampedValue,
      };
      updateSignatureData("spacings", updated);
    }
  };

  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  // Gérer l'ouverture/fermeture du Popover et activer/désactiver le mode détaillé
  const handlePopoverChange = (open) => {
    setIsAdvancedOpen(open);
    if (open) {
      // Activer le mode détaillé quand on ouvre le Popover
      handleDetailedSpacingToggle(true);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Espacements</h2>
        <Popover open={isAdvancedOpen} onOpenChange={handlePopoverChange}>
          <PopoverTrigger asChild>
            <button
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Mode avancé"
            >
              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg"
            side="left"
            align="start"
            sideOffset={300}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Mode avancé
              </span>
              <button
                onClick={() => setIsAdvancedOpen(false)}
                className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <DetailedPaddingSection
                signatureData={signatureData}
                updateSignatureData={updateSignatureData}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-3">
        {/* Mode espacement global - toujours affiché */}
        <div className="flex items-center justify-between ml-4">
          <Label className="text-xs text-muted-foreground font-normal">
            Global
          </Label>
          <div className="flex items-center gap-1.5 w-40">
            <Slider
              className="flex-1"
              value={[signatureData.spacings?.global || 8]}
              onValueChange={(value) => handleGlobalSpacingChange(value[0])}
              min={0}
              max={30}
              step={2}
              aria-label="Espacement global"
            />
            <Input
              className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
              type="text"
              inputMode="decimal"
              value={signatureData.spacings?.global ?? 8}
              onChange={(e) => handleGlobalSpacingChange(e.target.value)}
              aria-label="Espacement global"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
