"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";

export default function ColorsSection({ signatureData, updateSignatureData }) {
  // Gestion des couleurs
  const handleColorChange = (colorKey, value) => {
    updateSignatureData('colors', {
      ...signatureData.colors,
      [colorKey]: value
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Couleurs</h2>
      <div className="flex flex-col gap-3 ml-4">
        
        {/* Couleur du nom */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Nom</Label>
          <div className="flex items-center gap-3 w-30">
            <input
              type="color"
              value={signatureData.colors?.name || "#000000"}
              onChange={(e) => handleColorChange('name', e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              title="Couleur du nom"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {signatureData.colors?.name || "#000000"}
            </span>
          </div>
        </div>
        
        {/* Couleur du poste */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Poste</Label>
          <div className="flex items-center gap-3 w-30">
            <input
              type="color"
              value={signatureData.colors?.position || "#666666"}
              onChange={(e) => handleColorChange('position', e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              title="Couleur du poste"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {signatureData.colors?.position || "#666666"}
            </span>
          </div>
        </div>
        
        {/* Couleur de l'entreprise */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Entreprise</Label>
          <div className="flex items-center gap-3 w-30">
            <input
              type="color"
              value={signatureData.colors?.company || "#666666"}
              onChange={(e) => handleColorChange('company', e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              title="Couleur de l'entreprise"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {signatureData.colors?.company || "#666666"}
            </span>
          </div>
        </div>
        
        {/* Couleur des contacts */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Contact</Label>
          <div className="flex items-center gap-3 w-30">
            <input
              type="color"
              value={signatureData.colors?.contact || "#666666"}
              onChange={(e) => handleColorChange('contact', e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              title="Couleur des informations de contact"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {signatureData.colors?.contact || "#666666"}
            </span>
          </div>
        </div>
        
        {/* Couleur des réseaux sociaux */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Réseaux sociaux</Label>
          <div className="flex items-center gap-3 w-30">
            <input
              type="color"
              value={signatureData.colors?.social || "#1877F2"}
              onChange={(e) => handleColorChange('social', e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              title="Couleur des logos sociaux"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {signatureData.colors?.social || "#1877F2"}
            </span>
          </div>
        </div>
        
        {/* Couleur du séparateur vertical - uniquement pour layout vertical */}
        {signatureData.layout === 'vertical' && (
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Séparateur vertical</Label>
          <div className="flex items-center gap-3 w-30">
            <input
              type="color"
              value={signatureData.colors?.separatorVertical || "#e0e0e0"}
              onChange={(e) => handleColorChange('separatorVertical', e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              title="Couleur du séparateur vertical"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {signatureData.colors?.separatorVertical || "#e0e0e0"}
            </span>
          </div>
        </div>
        )}
        
        {/* Couleur du séparateur horizontal */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Séparateur horizontal</Label>
          <div className="flex items-center gap-3 w-30">
            <input
              type="color"
              value={signatureData.colors?.separatorHorizontal || "#e0e0e0"}
              onChange={(e) => handleColorChange('separatorHorizontal', e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              title="Couleur du séparateur horizontal"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {signatureData.colors?.separatorHorizontal || "#e0e0e0"}
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
