"use client";

import React, { useCallback } from "react";
import { Label } from "@/src/components/ui/label";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import {
  FlipHorizontalIcon,
  FlipVerticalIcon,
  Columns2,
  BetweenHorizontalStart,
  Table2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

export default function DisplayModeSection({
  signatureData,
  updateSignatureData,
}) {
  const handleOrientationChange = useCallback((newOrientation) => {
    // Mettre à jour l'orientation seulement
    console.log("🔍 DEBUG SÉLECTEUR - Changement orientation vers:", newOrientation);
    updateSignatureData("orientation", newOrientation);
  }, [updateSignatureData]);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Mode d'affichage</h2>
      <div className="space-y-2 ml-4">
        <div className="flex items-center justify-between w-full">
          <Label className="text-xs text-muted-foreground">Orientation</Label>
          <AlignmentSelector
            items={[
              { value: "horizontal", icon: FlipVerticalIcon },
              { value: "vertical", icon: FlipHorizontalIcon },
            ]}
            size="sm"
            className="w-30"
            value={signatureData.orientation}
            onValueChange={handleOrientationChange}
          />
        </div>

        {/* <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Alignement nom</Label>
          <AlignmentSelector
            items={[
              { value: "left", icon: AlignLeft },
              { value: "center", icon: AlignCenter },
              { value: "right", icon: AlignRight },
            ]}
            size="sm"
            className="w-30"
            value={signatureData.nameAlignment}
            onValueChange={(value) => updateSignatureData('nameAlignment', value)}
          />
        </div> */}
      </div>
    </div>
  );
}
