"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import { Switch } from "@/src/components/ui/switch";
import { ColorPicker } from "@/src/components/ui/color-picker";
import { CircleOff, Minus, Dot, Slash } from "lucide-react";

export default function StructureSection({
  signatureData,
  updateSignatureData,
}) {
  // Gestion de l'épaisseur du séparateur vertical - DEPRECATED
  const handleSeparatorVerticalWidthChange = (value) => {
    const numValue = parseInt(value) || 1;
    updateSignatureData(
      "separatorVerticalWidth",
      Math.max(1, Math.min(5, numValue))
    ); // Entre 1 et 5px
  };

  // Gestion de l'épaisseur du séparateur horizontal - DEPRECATED
  const handleSeparatorHorizontalWidthChange = (value) => {
    const numValue = parseInt(value) || 1;
    updateSignatureData(
      "separatorHorizontalWidth",
      Math.max(1, Math.min(5, numValue))
    ); // Entre 1 et 5px
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Structure</h2>
      <div className="flex flex-col gap-3 ml-4">
        {/* Séparateur vertical */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            Séparateur vertical
          </Label>
          <div className="flex items-center gap-3">
            <Switch
              checked={signatureData.separatorVerticalEnabled || false}
              onCheckedChange={(checked) =>
                updateSignatureData("separatorVerticalEnabled", checked)
              }
              className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
            />
          </div>
        </div>

        {/* Contrôles du séparateur vertical si activé */}
        {signatureData.separatorVerticalEnabled && (
          <>
            {/* Épaisseur du séparateur vertical */}
            {/* <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Épaisseur verticale
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.separators?.vertical?.width || 1}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value) || 1;
                    updateSignatureData("separators", {
                      ...signatureData.separators,
                      vertical: {
                        ...signatureData.separators?.vertical,
                        width: Math.max(1, Math.min(5, numValue)),
                      },
                    });
                  }}
                  aria-label="Épaisseur du séparateur vertical"
                  placeholder="1"
                />
                <Slider
                  className="grow"
                  value={[signatureData.separators?.vertical?.width || 1]}
                  onValueChange={(value) =>
                    updateSignatureData("separators", {
                      ...signatureData.separators,
                      vertical: {
                        ...signatureData.separators?.vertical,
                        width: value[0],
                      },
                    })
                  }
                  min={1}
                  max={5}
                  step={1}
                  aria-label="Épaisseur séparateur vertical"
                />
              </div>
            </div> */}

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

            {/* Radius du séparateur vertical */}
            {/* <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Radius vertical
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.separators?.vertical?.radius || 0}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value) || 0;
                    updateSignatureData("separators", {
                      ...signatureData.separators,
                      vertical: {
                        ...signatureData.separators?.vertical,
                        radius: Math.max(0, Math.min(10, numValue)),
                      },
                    });
                  }}
                  aria-label="Radius du séparateur vertical"
                  placeholder="0"
                />
                <Slider
                  className="grow"
                  value={[signatureData.separators?.vertical?.radius || 0]}
                  onValueChange={(value) =>
                    updateSignatureData("separators", {
                      ...signatureData.separators,
                      vertical: {
                        ...signatureData.separators?.vertical,
                        radius: value[0],
                      },
                    })
                  }
                  min={0}
                  max={10}
                  step={1}
                  aria-label="Radius séparateur vertical"
                />
              </div>
            </div> */}
          </>
        )}

        {/* Séparateur horizontal */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            Séparateur horizontal
          </Label>
          <div className="flex items-center gap-3">
            <Switch
              checked={signatureData.separatorHorizontalEnabled || false}
              onCheckedChange={(checked) =>
                updateSignatureData("separatorHorizontalEnabled", checked)
              }
              className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
            />
          </div>
        </div>

        {/* Contrôles du séparateur horizontal si activé */}
        {signatureData.separatorHorizontalEnabled && (
          <>
            {/* Épaisseur du séparateur horizontal */}
            {/* <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Épaisseur horizontale</Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.separators?.horizontal?.width || 1}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value) || 1;
                    updateSignatureData('separators', {
                      ...signatureData.separators,
                      horizontal: {
                        ...signatureData.separators?.horizontal,
                        width: Math.max(1, Math.min(5, numValue))
                      }
                    });
                  }}
                  aria-label="Épaisseur du séparateur horizontal"
                  placeholder="1"
                />
                <Slider
                  className="grow"
                  value={[signatureData.separators?.horizontal?.width || 1]}
                  onValueChange={(value) => updateSignatureData('separators', {
                    ...signatureData.separators,
                    horizontal: {
                      ...signatureData.separators?.horizontal,
                      width: value[0]
                    }
                  })}
                  min={1}
                  max={5}
                  step={1}
                  aria-label="Épaisseur séparateur horizontal"
                />
              </div>
            </div> */}

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

            {/* Radius du séparateur horizontal */}
            {/* <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Radius horizontal
              </Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  className="h-8 w-16 px-2 py-1"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.separators?.horizontal?.radius || 0}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value) || 0;
                    updateSignatureData("separators", {
                      ...signatureData.separators,
                      horizontal: {
                        ...signatureData.separators?.horizontal,
                        radius: Math.max(0, Math.min(10, numValue)),
                      },
                    });
                  }}
                  aria-label="Radius du séparateur horizontal"
                  placeholder="0"
                />
                <Slider
                  className="grow"
                  value={[signatureData.separators?.horizontal?.radius || 0]}
                  onValueChange={(value) =>
                    updateSignatureData("separators", {
                      ...signatureData.separators,
                      horizontal: {
                        ...signatureData.separators?.horizontal,
                        radius: value[0],
                      },
                    })
                  }
                  min={0}
                  max={10}
                  step={1}
                  aria-label="Radius séparateur horizontal"
                />
              </div>
            </div> */}
          </>
        )}
      </div>
    </div>
  );
}
