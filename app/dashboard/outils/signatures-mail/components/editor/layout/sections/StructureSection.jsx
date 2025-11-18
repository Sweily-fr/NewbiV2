"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { ColorPicker } from "@/src/components/ui/color-picker";

export default function StructureSection({
  signatureData,
  updateSignatureData,
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Structure</h2>
      <div className="flex flex-col gap-3 ml-4">
        {/* Séparateur vertical - uniquement pour orientation horizontale */}
        {signatureData.orientation !== "vertical" && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Séparateur vertical
              </Label>
              <Switch
                checked={signatureData.separatorVerticalEnabled || false}
                onCheckedChange={(checked) =>
                  updateSignatureData("separatorVerticalEnabled", checked)
                }
                className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff] cursor-pointer"
              />
            </div>

            {/* Contrôles du séparateur vertical si activé */}
            {signatureData.separatorVerticalEnabled && (
              <>
                {/* Couleur du séparateur vertical */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Couleur verticale
                  </Label>
                  <ColorPicker
                    color={signatureData.colors?.separatorVertical || "#e0e0e0"}
                    onChange={(color) => {
                      updateSignatureData("colors", {
                        ...signatureData.colors,
                        separatorVertical: color,
                      });
                    }}
                    align="end"
                    sideOffset={5}
                    className="w-auto"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Séparateur horizontal */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            Séparateur horizontal
          </Label>
          <Switch
            checked={signatureData.separatorHorizontalEnabled || false}
            onCheckedChange={(checked) =>
              updateSignatureData("separatorHorizontalEnabled", checked)
            }
            className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff] cursor-pointer"
          />
        </div>

        {/* Contrôles du séparateur horizontal si activé */}
        {signatureData.separatorHorizontalEnabled && (
          <>
            {/* Couleur du séparateur horizontal */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Couleur horizontale
              </Label>
              <ColorPicker
                color={signatureData.colors?.separatorHorizontal || "#e0e0e0"}
                onChange={(color) => {
                  updateSignatureData("colors", {
                    ...signatureData.colors,
                    separatorHorizontal: color,
                  });
                }}
                align="end"
                sideOffset={5}
                className="w-auto"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
