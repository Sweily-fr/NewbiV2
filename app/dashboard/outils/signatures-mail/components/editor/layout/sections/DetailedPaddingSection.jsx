"use client";

import React, { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Composant pour gérer les paddings détaillés de chaque élément
 * Détecte automatiquement les TD dans la structure de la signature
 */
export default function DetailedPaddingSection({ signatureData, updateSignatureData }) {
  const [expandedSections, setExpandedSections] = useState({});

  // Définition des éléments avec leurs labels
  const elements = [
    { key: "photo", label: "Photo de profil", icon: "📷" },
    { key: "name", label: "Nom complet", icon: "👤" },
    { key: "position", label: "Poste", icon: "💼" },
    { key: "company", label: "Entreprise", icon: "🏢" },
    { key: "phone", label: "Téléphone", icon: "📞" },
    { key: "mobile", label: "Mobile", icon: "📱" },
    { key: "email", label: "Email", icon: "✉️" },
    { key: "website", label: "Site web", icon: "🌐" },
    { key: "address", label: "Adresse", icon: "📍" },
    { key: "separatorHorizontal", label: "Séparateur horizontal", icon: "➖" },
    { key: "separatorVertical", label: "Séparateur vertical", icon: "⬜" },
    { key: "logo", label: "Logo entreprise", icon: "🏷️" },
    { key: "social", label: "Réseaux sociaux", icon: "🔗" },
  ];

  // Gestion du padding pour un élément spécifique
  const handlePaddingChange = (elementKey, side, value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(50, numValue));

    updateSignatureData("paddings", {
      ...signatureData.paddings,
      [elementKey]: {
        ...(signatureData.paddings?.[elementKey] || { top: 0, right: 0, bottom: 0, left: 0 }),
        [side]: clampedValue,
      },
    });
  };

  // Toggle l'expansion d'une section
  const toggleSection = (key) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
      separatorHorizontal: { top: globalSpacing, right: 0, bottom: globalSpacing, left: 0 },
      separatorVertical: { top: 0, right: 4, bottom: 0, left: 4 },
      logo: { top: globalSpacing, right: 0, bottom: 0, left: 0 },
      social: { top: globalSpacing, right: 0, bottom: 0, left: 0 },
    };

    return signatureData.paddings?.[elementKey] || defaults[elementKey] || { top: 0, right: 0, bottom: 0, left: 0 };
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
        return Object.values(signatureData.socialNetworks || {}).some((url) => url);
      default:
        return true;
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px bg-border flex-1" />
        <Label className="text-xs text-muted-foreground font-semibold">
          Padding détaillé par élément
        </Label>
        <div className="h-px bg-border flex-1" />
      </div>

      <div className="flex flex-col gap-1">
        {elements.map((element) => {
          const padding = getPadding(element.key);
          const isExpanded = expandedSections[element.key];
          const isVisible = isElementVisible(element.key);

          return (
            <div
              key={element.key}
              className={`border rounded-lg transition-all ${
                isVisible ? "border-border bg-background" : "border-border/50 bg-muted/30 opacity-60"
              }`}
            >
              {/* En-tête de l'élément */}
              <button
                onClick={() => toggleSection(element.key)}
                className="w-full flex items-center justify-between p-3 hover:bg-accent/5 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{element.icon}</span>
                  <Label className="text-xs font-medium cursor-pointer">
                    {element.label}
                  </Label>
                  {!isVisible && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Masqué
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {padding.top}|{padding.right}|{padding.bottom}|{padding.left}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Contrôles de padding */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 grid grid-cols-2 gap-2">
                  {/* Top */}
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground w-12">
                      Haut
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={padding.top}
                      onChange={(e) => handlePaddingChange(element.key, "top", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground w-12">
                      Droite
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={padding.right}
                      onChange={(e) => handlePaddingChange(element.key, "right", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* Bottom */}
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground w-12">
                      Bas
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={padding.bottom}
                      onChange={(e) => handlePaddingChange(element.key, "bottom", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* Left */}
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground w-12">
                      Gauche
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={padding.left}
                      onChange={(e) => handlePaddingChange(element.key, "left", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          💡 <strong>Astuce :</strong> Le padding détaillé permet de contrôler précisément l'espacement
          autour de chaque élément (haut, droite, bas, gauche). Les éléments masqués sont grisés.
        </p>
      </div>
    </div>
  );
}
