"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import DetailedPaddingSection from "./DetailedPaddingSection";

export default function SpacingSection({ signatureData, updateSignatureData }) {
  // Gérer l'activation/désactivation du mode détaillé
  const handleDetailedSpacingToggle = (checked) => {
    // Si on active le mode détaillé, toujours réinitialiser avec les valeurs actuelles de spacings
    if (checked) {
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
        separatorHorizontal: { top: globalSpacing, right: 0, bottom: globalSpacing, left: 0 },
        separatorVertical: { top: 0, right: 4, bottom: 0, left: 4 },
        logo: { top: 0, right: 0, bottom: globalSpacing, left: 0 },
        social: { top: globalSpacing, right: 0, bottom: 0, left: 0 },
      };
      
      // Initialiser les paddings d'abord
      updateSignatureData("paddings", defaultPaddings);
      // Puis activer le mode détaillé
      setTimeout(() => {
        updateSignatureData("detailedSpacing", true);
      }, 0);
    } else {
      // Si on désactive ou si les paddings existent déjà, juste toggle
      updateSignatureData("detailedSpacing", checked);
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Espacements</h2>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground cursor-pointer">Mode avancé</Label>
          <div className="relative inline-flex items-center">
            <Switch
              className="ml-2 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff] cursor-pointer"
              checked={signatureData.detailedSpacing || false}
              onCheckedChange={handleDetailedSpacingToggle}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {!signatureData.detailedSpacing ? (
          // Mode espacement global
          <div className="flex items-center justify-between ml-4">
            <Label className="text-xs text-muted-foreground">
              Espacement global
            </Label>
            <div className="flex items-center gap-2 w-48">
              <button
                onClick={() => handleGlobalSpacingChange(8)}
                className="h-8 w-8 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md flex-shrink-0"
                title="Réinitialiser à 8"
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <Input
                className="h-8 px-2 py-1 min-w-12"
                style={{ width: `${Math.max(48, (signatureData.spacings?.global?.toString().length || 2) * 8 + 16)}px` }}
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.global ?? 8}
                onChange={(e) => handleGlobalSpacingChange(e.target.value)}
                onBlur={(e) => handleGlobalSpacingChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGlobalSpacingChange(e.target.value);
                  }
                }}
                aria-label="Espacement global"
                placeholder="8"
              />
              <Slider
                className="grow h-4"
                value={[signatureData.spacings?.global || 8]}
                onValueChange={(value) => handleGlobalSpacingChange(value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement global"
              />
            </div>
          </div>
        ) : (
          // Mode espacement détaillé - Uniquement DetailedPaddingSection
          <div className="flex flex-col gap-3">
            <DetailedPaddingSection
              signatureData={signatureData}
              updateSignatureData={updateSignatureData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
