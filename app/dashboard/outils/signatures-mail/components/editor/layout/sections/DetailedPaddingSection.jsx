"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";

/**
 * Composant pour gérer les paddings détaillés de chaque élément
 * Détecte automatiquement les TD dans la structure de la signature
 */
export default function DetailedPaddingSection({
  signatureData,
  updateSignatureData,
}) {
  // Définition des éléments avec leurs labels
  const elements = [
    { key: "photo", label: "Photo" },
    { key: "name", label: "Nom" },
    { key: "position", label: "Poste" },
    { key: "company", label: "Entreprise" },
    { key: "phone", label: "Téléphone" },
    { key: "mobile", label: "Mobile" },
    { key: "email", label: "Email" },
    { key: "website", label: "Site web" },
    { key: "address", label: "Adresse" },
    { key: "separatorHorizontal", label: "Séparateur H" },
    { key: "separatorVertical", label: "Séparateur V" },
    { key: "logo", label: "Logo" },
    { key: "social", label: "Réseaux" },
  ];

  // Gestion du padding pour un élément spécifique
  const handlePaddingChange = (elementKey, side, value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(50, numValue));

    updateSignatureData("paddings", {
      ...signatureData.paddings,
      [elementKey]: {
        ...(signatureData.paddings?.[elementKey] || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }),
        [side]: clampedValue,
      },
    });
  };

  // Récupérer le padding d'un élément avec les valeurs par défaut basées sur globalSpacing
  const getPadding = (elementKey) => {
    const globalSpacing = signatureData.spacings?.global || 8;

    // Valeurs par défaut pour chaque élément basées sur globalSpacing
    const defaults = {
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

    return (
      signatureData.paddings?.[elementKey] ||
      defaults[elementKey] || { top: 0, right: 0, bottom: 0, left: 0 }
    );
  };

  // Vérifier si un élément est visible dans la signature
  const isElementVisible = (elementKey) => {
    switch (elementKey) {
      case "photo":
        return signatureData.photo && signatureData.photoVisible !== false;
      case "name":
        return signatureData.fullName;
      case "position":
        return signatureData.position;
      case "company":
        return signatureData.companyName;
      case "phone":
        return signatureData.phone;
      case "mobile":
        return signatureData.mobile;
      case "email":
        return signatureData.email;
      case "website":
        return signatureData.website;
      case "address":
        return signatureData.address;
      case "separatorHorizontal":
        return signatureData.separatorHorizontalEnabled;
      case "separatorVertical":
        return signatureData.separatorVerticalEnabled;
      case "logo":
        return signatureData.logo;
      case "social":
        return Object.values(signatureData.socialNetworks || {}).some(
          (url) => url,
        );
      default:
        return true;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {elements.map((element) => {
        const padding = getPadding(element.key);
        const isVisible = isElementVisible(element.key);

        return (
          <div
            key={element.key}
            className={`transition-opacity ${!isVisible && "opacity-40"}`}
          >
            {/* Label et contrôles alignés */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                {element.label}
              </Label>

              {/* Contrôles de padding groupés */}
              <div className="space-y-0.5">
                <div className="flex gap-0.5">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={padding.top}
                    onChange={(e) =>
                      handlePaddingChange(element.key, "top", e.target.value)
                    }
                    className="h-8 w-9 text-[11px] border-none text-center bg-[#F5F5F5] dark:bg-gray-800 border-gray-200 rounded-r-sm rounded-r-none"
                    placeholder="0"
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={padding.right}
                    onChange={(e) =>
                      handlePaddingChange(element.key, "right", e.target.value)
                    }
                    className="h-8 w-9 text-[11px] border-none text-center bg-[#F5F5F5] dark:bg-gray-800 border-gray-200 rounded-none"
                    placeholder="0"
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={padding.bottom}
                    onChange={(e) =>
                      handlePaddingChange(element.key, "bottom", e.target.value)
                    }
                    className="h-8 w-9 text-[11px] border-none text-center bg-[#F5F5F5] dark:bg-gray-800 border-gray-200 rounded-none"
                    placeholder="0"
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={padding.left}
                    onChange={(e) =>
                      handlePaddingChange(element.key, "left", e.target.value)
                    }
                    className="h-8 w-9 text-[11px] border-none text-center bg-[#F5F5F5] dark:bg-gray-800 border-gray-200 rounded-l-sm rounded-l-none"
                    placeholder="0"
                  />
                </div>
                <div className="flex gap-px text-[8px] text-gray-400">
                  <span className="w-9 text-center">T</span>
                  <span className="w-9 text-center">R</span>
                  <span className="w-9 text-center">B</span>
                  <span className="w-9 text-center">L</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
