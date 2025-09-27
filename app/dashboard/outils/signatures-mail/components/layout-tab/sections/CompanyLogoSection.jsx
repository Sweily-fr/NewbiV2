"use client";

import React, { useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { X, Upload, Building, Info } from "lucide-react";
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
    } else if (!organization?.logo) {
      console.log(
        "❌ CompanyLogoSection - Aucun logo trouvé dans l'organisation"
      );
    } else if (signatureData.logo) {
      console.log(
        "ℹ️ CompanyLogoSection - Logo déjà présent dans la signature"
      );
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
          <div className="flex items-center">
            <Label className="text-xs text-muted-foreground mr-2">
              Logo entreprise
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="w-64">
                  <p>
                    Le logo de votre entreprise est récupéré automatiquement
                    depuis votre profil. Pour le modifier, rendez-vous dans
                    Paramètres → Informations entreprise.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            {signatureData.logo ? (
              <>
                <img
                  src={signatureData.logo}
                  alt="Logo entreprise"
                  className="w-14 h-14 object-contain"
                />
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building className="w-3 h-3" />
                <span>Aucun logo d'entreprise</span>
              </div>
            )}
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
