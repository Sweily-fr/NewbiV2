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
    if (value === "" || value === null) {
      updateSignatureData("logoSize", 1);
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      updateSignatureData("logoSize", numValue);
    }
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
          <div className="flex items-center gap-2 w-48">
            <button
              onClick={() => handleLogoSizeChange(60)}
              className="h-8 w-8 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md flex-shrink-0"
              title="Réinitialiser à 60"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Input
              className="h-8 px-2 py-1 min-w-12"
              style={{ width: `${Math.max(48, (signatureData.logoSize?.toString().length || 2) * 8 + 16)}px` }}
              type="text"
              inputMode="decimal"
              value={signatureData.logoSize ?? 60}
              onChange={(e) => {
                if (e.target.value === "") {
                  handleLogoSizeChange("");
                } else {
                  const numValue = parseInt(e.target.value);
                  if (!isNaN(numValue) && numValue >= 1) {
                    handleLogoSizeChange(e.target.value);
                  }
                }
              }}
              onBlur={(e) => {
                if (e.target.value === "") {
                  handleLogoSizeChange("");
                } else {
                  const numValue = parseInt(e.target.value);
                  if (!isNaN(numValue) && numValue >= 1) {
                    handleLogoSizeChange(e.target.value);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.target.value === "") {
                    handleLogoSizeChange("");
                  } else {
                    const numValue = parseInt(e.target.value);
                    if (!isNaN(numValue) && numValue >= 1) {
                      handleLogoSizeChange(e.target.value);
                    }
                  }
                }
              }}
              aria-label="Taille du logo entreprise"
              placeholder="60"
            />
            <Slider
              className="grow"
              value={[signatureData.logoSize || 60]}
              onValueChange={(value) => handleLogoSizeChange(value[0])}
              min={1}
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
