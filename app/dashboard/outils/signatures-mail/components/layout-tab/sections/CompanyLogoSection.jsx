"use client";

import React, { useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { X, Upload, Building } from "lucide-react";
import { useActiveOrganization } from "@/src/lib/organization-client";

export default function CompanyLogoSection({
  signatureData,
  updateSignatureData,
}) {
  const { organization } = useActiveOrganization();
  
  // Récupérer automatiquement le logo de l'entreprise au chargement
  useEffect(() => {
    if (organization?.logo && !signatureData.logo) { 
      updateSignatureData("logo", organization.logo);
    } 
  }, [organization?.logo, signatureData.logo, updateSignatureData]);

  // Gestion de la taille du logo
  const handleLogoSizeChange = (value) => {
    const numValue = parseInt(value) || 60;
    updateSignatureData("logoSize", Math.max(30, Math.min(120, numValue))); // Entre 30 et 120px
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Logo entreprise</h2>
      <div className="flex flex-col gap-3 ml-4">
        {/* Logo entreprise automatique */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Logo entreprise</Label>
          <div className="flex items-center gap-2 w-30">
            {signatureData.logo ? (
              <>
                <img
                  src={signatureData.logo}
                  alt="Logo entreprise"
                  className="w-8 h-8 object-contain rounded border bg-white"
                />
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Building className="w-3 h-3" />
                  <span>Auto</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building className="w-3 h-3" />
                <span>Aucun logo d'entreprise</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Message informatif */}
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md">
          <div className="flex items-start gap-2">
            <Building className="w-3 h-3 mt-0.5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-400">Logo automatique</p>
              <p className="text-blue-600 dark:text-blue-300">
                Le logo de votre entreprise est récupéré automatiquement depuis votre profil. 
                Pour le modifier, rendez-vous dans Paramètres → Informations entreprise.
              </p>
            </div>
          </div>
        </div>

        {/* Taille du logo */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Taille</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.logoSize || 60}
              onChange={(e) => handleLogoSizeChange(e.target.value)}
              onBlur={(e) => handleLogoSizeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogoSizeChange(e.target.value);
                }
              }}
              aria-label="Taille du logo entreprise"
              placeholder="60"
            />
            <Slider
              className="grow"
              value={[signatureData.logoSize || 60]}
              onValueChange={(value) => handleLogoSizeChange(value[0])}
              min={30}
              max={120}
              step={5}
              aria-label="Taille logo"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>
      </div>
    </div>
  );
}
