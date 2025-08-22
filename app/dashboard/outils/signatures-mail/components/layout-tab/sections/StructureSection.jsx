"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import { Switch } from "@/src/components/ui/switch";
import {
  CircleOff,
  Minus,
  Dot,
  Slash,
} from "lucide-react";

export default function StructureSection({ signatureData, updateSignatureData }) {
  // Gestion de l'épaisseur du séparateur vertical
  const handleSeparatorVerticalWidthChange = (value) => {
    const numValue = parseInt(value) || 1;
    updateSignatureData('separatorVerticalWidth', Math.max(1, Math.min(5, numValue))); // Entre 1 et 5px
  };

  // Gestion de l'épaisseur du séparateur horizontal
  const handleSeparatorHorizontalWidthChange = (value) => {
    const numValue = parseInt(value) || 1;
    updateSignatureData('separatorHorizontalWidth', Math.max(1, Math.min(5, numValue))); // Entre 1 et 5px
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Structure</h2>
      <div className="flex flex-col gap-3 ml-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Séparateurs</Label>
          <AlignmentSelector
            items={[
              { value: "none", icon: CircleOff },
              { value: "line", icon: Minus },
              { value: "dot", icon: Dot },
              { value: "slash", icon: Slash },
            ]}
            size="sm"
            className="w-30"
          />
        </div>
        
        {/* Séparateur vertical - pour layout horizontal */}
        {signatureData.layout === 'horizontal' && (
          <>
            {/* Checkbox pour activer/désactiver le séparateur vertical */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Séparateur vertical</Label>
              <div className="flex items-center gap-3 w-30">
                <Switch
                  checked={signatureData.verticalSeparator?.enabled || false}
                  onCheckedChange={(checked) => updateSignatureData('verticalSeparator', {
                    ...signatureData.verticalSeparator,
                    enabled: checked
                  })}
                />
              </div>
            </div>
            
            {/* Contrôles du séparateur vertical si activé */}
            {signatureData.verticalSeparator?.enabled && (
              <>
                {/* Épaisseur du séparateur vertical */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Épaisseur verticale</Label>
                  <div className="flex items-center gap-3 w-30">
                    <Input
                      className="h-8 w-12 px-2 py-1"
                      type="text"
                      inputMode="decimal"
                      value={signatureData.verticalSeparator?.width || 1}
                      onChange={(e) => {
                        const numValue = parseInt(e.target.value) || 1;
                        updateSignatureData('verticalSeparator', {
                          ...signatureData.verticalSeparator,
                          width: Math.max(1, Math.min(5, numValue))
                        });
                      }}
                      onBlur={(e) => {
                        const numValue = parseInt(e.target.value) || 1;
                        updateSignatureData('verticalSeparator', {
                          ...signatureData.verticalSeparator,
                          width: Math.max(1, Math.min(5, numValue))
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const numValue = parseInt(e.target.value) || 1;
                          updateSignatureData('verticalSeparator', {
                            ...signatureData.verticalSeparator,
                            width: Math.max(1, Math.min(5, numValue))
                          });
                        }
                      }}
                      aria-label="Épaisseur du séparateur vertical"
                      placeholder="1"
                    />
                    <Slider
                      className="grow"
                      value={[signatureData.verticalSeparator?.width || 1]}
                      onValueChange={(value) => updateSignatureData('verticalSeparator', {
                        ...signatureData.verticalSeparator,
                        width: value[0]
                      })}
                      min={1}
                      max={5}
                      step={1}
                      aria-label="Épaisseur séparateur vertical"
                    />
                  </div>
                </div>
                
                {/* Couleur du séparateur vertical */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Couleur verticale</Label>
                  <div className="flex items-center gap-3 w-30">
                    <input
                      type="color"
                      value={signatureData.verticalSeparator?.color || "#000000"}
                      onChange={(e) => updateSignatureData('verticalSeparator', {
                        ...signatureData.verticalSeparator,
                        color: e.target.value
                      })}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      title="Couleur du séparateur vertical"
                    />
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {signatureData.verticalSeparator?.color || "#000000"}
                    </span>
                  </div>
                </div>
                
                {/* Espacement gauche du séparateur vertical */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Espacement gauche</Label>
                  <div className="flex items-center gap-3 w-30">
                    <Input
                      className="h-8 w-12 px-2 py-1"
                      type="text"
                      inputMode="decimal"
                      value={signatureData.verticalSeparator?.spacingLeft || 8}
                      onChange={(e) => {
                        const numValue = parseInt(e.target.value) || 0;
                        updateSignatureData('verticalSeparator', {
                          ...signatureData.verticalSeparator,
                          spacingLeft: Math.max(0, Math.min(30, numValue))
                        });
                      }}
                      onBlur={(e) => {
                        const numValue = parseInt(e.target.value) || 0;
                        updateSignatureData('verticalSeparator', {
                          ...signatureData.verticalSeparator,
                          spacingLeft: Math.max(0, Math.min(30, numValue))
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const numValue = parseInt(e.target.value) || 0;
                          updateSignatureData('verticalSeparator', {
                            ...signatureData.verticalSeparator,
                            spacingLeft: Math.max(0, Math.min(30, numValue))
                          });
                        }
                      }}
                      aria-label="Espacement gauche du séparateur vertical"
                      placeholder="8"
                    />
                    <Slider
                      className="grow"
                      value={[signatureData.verticalSeparator?.spacingLeft || 8]}
                      onValueChange={(value) => updateSignatureData('verticalSeparator', {
                        ...signatureData.verticalSeparator,
                        spacingLeft: value[0]
                      })}
                      min={0}
                      max={30}
                      step={2}
                      aria-label="Espacement gauche séparateur vertical"
                    />
                  </div>
                </div>
                
                {/* Espacement droite du séparateur vertical */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Espacement droite</Label>
                  <div className="flex items-center gap-3 w-30">
                    <Input
                      className="h-8 w-12 px-2 py-1"
                      type="text"
                      inputMode="decimal"
                      value={signatureData.verticalSeparator?.spacingRight || 12}
                      onChange={(e) => {
                        const numValue = parseInt(e.target.value) || 0;
                        updateSignatureData('verticalSeparator', {
                          ...signatureData.verticalSeparator,
                          spacingRight: Math.max(0, Math.min(30, numValue))
                        });
                      }}
                      onBlur={(e) => {
                        const numValue = parseInt(e.target.value) || 0;
                        updateSignatureData('verticalSeparator', {
                          ...signatureData.verticalSeparator,
                          spacingRight: Math.max(0, Math.min(30, numValue))
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const numValue = parseInt(e.target.value) || 0;
                          updateSignatureData('verticalSeparator', {
                            ...signatureData.verticalSeparator,
                            spacingRight: Math.max(0, Math.min(30, numValue))
                          });
                        }
                      }}
                      aria-label="Espacement droite du séparateur vertical"
                      placeholder="12"
                    />
                    <Slider
                      className="grow"
                      value={[signatureData.verticalSeparator?.spacingRight || 12]}
                      onValueChange={(value) => updateSignatureData('verticalSeparator', {
                        ...signatureData.verticalSeparator,
                        spacingRight: value[0]
                      })}
                      min={0}
                      max={30}
                      step={2}
                      aria-label="Espacement droite séparateur vertical"
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
        
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Séparateur horizontal</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.separatorHorizontalWidth || 1}
              onChange={(e) => handleSeparatorHorizontalWidthChange(e.target.value)}
              onBlur={(e) => handleSeparatorHorizontalWidthChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSeparatorHorizontalWidthChange(e.target.value);
                }
              }}
              aria-label="Épaisseur du séparateur horizontal"
              placeholder="1"
            />
            <Slider
              className="grow"
              value={[signatureData.separatorHorizontalWidth || 1]}
              onValueChange={(value) => handleSeparatorHorizontalWidthChange(value[0])}
              min={1}
              max={5}
              step={1}
              aria-label="Épaisseur séparateur horizontal"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Largeur séparateur</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.separatorHorizontalWidth || 1}
              onChange={(e) => handleSeparatorHorizontalWidthChange(e.target.value)}
              onBlur={(e) => handleSeparatorHorizontalWidthChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSeparatorHorizontalWidthChange(e.target.value);
                }
              }}
              aria-label="Largeur séparateur horizontal"
              placeholder="1"
            />
            <Slider
              className="grow"
              value={[signatureData.separatorHorizontalWidth || 1]}
              onValueChange={(value) => handleSeparatorHorizontalWidthChange(value[0])}
              min={1}
              max={5}
              step={1}
              aria-label="Largeur séparateur horizontal"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
