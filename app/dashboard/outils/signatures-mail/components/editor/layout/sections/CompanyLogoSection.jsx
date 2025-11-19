"use client";

import React, { useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Building, Info } from "lucide-react";
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

  // Si pas de logo d'organisation, ne rien afficher
  if (!organization?.logo) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">
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
                  depuis vos paramètres. Pour le modifier, rendez-vous dans
                  Paramètres → Informations entreprise.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {organization?.logo && (
            <img
              src={organization.logo}
              alt="Logo entreprise"
              className="w-8 h-8 object-contain"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Afficher</Label>
          <Switch
            className="ml-2 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff] cursor-pointer"
            checked={signatureData.logoVisible !== false}
            onCheckedChange={(checked) => {
              updateSignatureData("logoVisible", checked);
            }}
          />
        </div>
      </div>
    </div>
  );
}
