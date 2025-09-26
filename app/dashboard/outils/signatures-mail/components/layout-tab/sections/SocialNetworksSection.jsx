"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useCustomSocialIcons } from "../../../hooks/useCustomSocialIcons";
export default function SocialNetworksSection({
  signatureData,
  updateSignatureData,
}) {
  // Hook pour les icônes personnalisées
  const {
    isGenerating,
    generationError,
    generateCustomSocialIcons,
    getGenerationStatus,
    hasCustomSocialIcons,
  } = useCustomSocialIcons(signatureData, updateSignatureData);

  // Gestion de la taille des logos sociaux
  const handleSocialSizeChange = (value) => {
    const numValue = parseInt(value) || 24;
    updateSignatureData("socialSize", Math.max(16, Math.min(48, numValue))); // Entre 16 et 48px
  };

  // Gestion des liens sociaux
  const handleSocialLinkChange = (platform, value) => {
    updateSignatureData("socialNetworks", {
      ...signatureData.socialNetworks,
      [platform]: value,
    });
  };

  // Gestion du background social
  const handleSocialBackgroundChange = (key, value) => {
    updateSignatureData("socialBackground", {
      ...signatureData.socialBackground,
      [key]: value,
    });
  };

  // Gestion des couleurs personnalisées pour chaque réseau social
  const handleSocialColorChange = (platform, color) => {
    updateSignatureData("socialColors", {
      ...signatureData.socialColors,
      [platform]: color,
    });
  };

  // Couleurs par défaut pour chaque réseau social
  const defaultColors = {
    linkedin: "#0077B5",
    facebook: "#1877F2", 
    instagram: "#E4405F",
    x: "#000000"
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Réseaux sociaux</h2>
      <div className="flex flex-col gap-3 ml-4">
        {/* LinkedIn */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">LinkedIn</Label>
            <div className="flex items-center gap-2 w-30">
              <Input
                className="h-8 w-full px-2 py-1 text-xs placeholder:text-xs"
                type="url"
                value={signatureData.socialNetworks?.linkedin || ""}
                onChange={(e) =>
                  handleSocialLinkChange("linkedin", e.target.value)
                }
                placeholder="linkedin.com/in/..."
              />
            </div>
          </div>
          {signatureData.socialNetworks?.linkedin && (
            <div className="flex items-center justify-between ml-4">
              <Label className="text-xs text-muted-foreground">Couleur</Label>
              <div className="flex items-center gap-2 bg-[#efefef] rounded-md px-2 py-2 w-20">
                <div
                  className="w-4 h-4 rounded border border-gray-200 cursor-pointer"
                  style={{
                    backgroundColor: signatureData.socialColors?.linkedin || defaultColors.linkedin,
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "color";
                    input.value = signatureData.socialColors?.linkedin || defaultColors.linkedin;
                    input.onchange = (e) => {
                      handleSocialColorChange("linkedin", e.target.value);
                    };
                    input.click();
                  }}
                  title="Couleur LinkedIn"
                />
              </div>
            </div>
          )}
        </div>

        {/* Facebook */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Facebook</Label>
            <div className="flex items-center gap-2 w-30">
              <Input
                className="h-8 w-full px-2 py-1 text-xs placeholder:text-xs"
                type="url"
                value={signatureData.socialNetworks?.facebook || ""}
                onChange={(e) =>
                  handleSocialLinkChange("facebook", e.target.value)
                }
                placeholder="facebook.com/..."
              />
            </div>
          </div>
          {signatureData.socialNetworks?.facebook && (
            <div className="flex items-center justify-between ml-4">
              <Label className="text-xs text-muted-foreground">Couleur</Label>
              <div className="flex items-center gap-2 bg-[#efefef] rounded-md px-2 py-2 w-20">
                <div
                  className="w-4 h-4 rounded border border-gray-200 cursor-pointer"
                  style={{
                    backgroundColor: signatureData.socialColors?.facebook || defaultColors.facebook,
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "color";
                    input.value = signatureData.socialColors?.facebook || defaultColors.facebook;
                    input.onchange = (e) => {
                      handleSocialColorChange("facebook", e.target.value);
                    };
                    input.click();
                  }}
                  title="Couleur Facebook"
                />
              </div>
            </div>
          )}
        </div>

        {/* Twitter/X */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Twitter/X</Label>
            <div className="flex items-center gap-2 w-30">
              <Input
                className="h-8 w-full px-2 py-1 text-xs placeholder:text-xs"
                type="url"
                value={signatureData.socialNetworks?.x || ""}
                onChange={(e) =>
                  handleSocialLinkChange("x", e.target.value)
                }
                placeholder="x.com/..."
              />
            </div>
          </div>
          {signatureData.socialNetworks?.x && (
            <div className="flex items-center justify-between ml-4">
              <Label className="text-xs text-muted-foreground">Couleur</Label>
              <div className="flex items-center gap-2 bg-[#efefef] rounded-md px-2 py-2 w-20">
                <div
                  className="w-4 h-4 rounded border border-gray-200 cursor-pointer"
                  style={{
                    backgroundColor: signatureData.socialColors?.x || defaultColors.x,
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "color";
                    input.value = signatureData.socialColors?.x || defaultColors.x;
                    input.onchange = (e) => {
                      handleSocialColorChange("x", e.target.value);
                    };
                    input.click();
                  }}
                  title="Couleur X"
                />
              </div>
            </div>
          )}
        </div>

        {/* Instagram */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Instagram</Label>
            <div className="flex items-center gap-2 w-30">
              <Input
                className="h-8 w-full px-2 py-1 text-xs placeholder:text-xs"
                type="url"
                value={signatureData.socialNetworks?.instagram || ""}
                onChange={(e) =>
                  handleSocialLinkChange("instagram", e.target.value)
                }
                placeholder="instagram.com/..."
              />
            </div>
          </div>
          {signatureData.socialNetworks?.instagram && (
            <div className="flex items-center justify-between ml-4">
              <Label className="text-xs text-muted-foreground">Couleur</Label>
              <div className="flex items-center gap-2 bg-[#efefef] rounded-md px-2 py-2 w-20">
                <div
                  className="w-4 h-4 rounded border border-gray-200 cursor-pointer"
                  style={{
                    backgroundColor: signatureData.socialColors?.instagram || defaultColors.instagram,
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "color";
                    input.value = signatureData.socialColors?.instagram || defaultColors.instagram;
                    input.onchange = (e) => {
                      handleSocialColorChange("instagram", e.target.value);
                    };
                    input.click();
                  }}
                  title="Couleur Instagram"
                />
              </div>
            </div>
          )}
        </div>

        {/* Taille des logos sociaux */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Taille logos</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-12 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.socialSize || 24}
              onChange={(e) => handleSocialSizeChange(e.target.value)}
              onBlur={(e) => handleSocialSizeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSocialSizeChange(e.target.value);
                }
              }}
              aria-label="Taille des logos sociaux"
              placeholder="24"
            />
            <Slider
              className="grow"
              value={[signatureData.socialSize || 24]}
              onValueChange={(value) => handleSocialSizeChange(value[0])}
              min={16}
              max={48}
              step={2}
              aria-label="Taille logos sociaux"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Background social */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Arrière-plan</Label>
          <div className="flex items-center gap-3">
            <Switch
              className="scale-75"
              checked={signatureData.socialBackground?.enabled || false}
              onCheckedChange={(checked) =>
                handleSocialBackgroundChange("enabled", checked)
              }
            />
          </div>
        </div>

        {signatureData.socialBackground?.enabled && (
          <>
            {/* Couleur background */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Couleur fond
              </Label>
              <div className="flex items-center gap-2 bg-[#efefef] rounded-md px-2 py-2 w-30">
                <div
                  className="w-4 h-4 rounded border border-gray-200 cursor-pointer"
                  style={{
                    backgroundColor:
                      signatureData.socialBackground?.color || "#f3f4f6",
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "color";
                    input.value =
                      signatureData.socialBackground?.color || "#f3f4f6";
                    input.onchange = (e) => {
                      handleSocialBackgroundChange("color", e.target.value);
                    };
                    input.click();
                  }}
                  title="Couleur de l'arrière-plan social"
                />
                <span className="text-xs text-gray-600 font-mono">
                  {(
                    signatureData.socialBackground?.color || "#f3f4f6"
                  ).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Forme background */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Forme fond
              </Label>
              <div className="flex items-center gap-3">
                <Select
                  className="w-full"
                  value={signatureData.socialBackground?.shape || "round"}
                  onValueChange={(value) =>
                    handleSocialBackgroundChange("shape", value)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">Rond</SelectItem>
                    <SelectItem value="square">Carré</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* Statut des icônes personnalisées */}
        {(signatureData.socialNetworks?.linkedin || 
          signatureData.socialNetworks?.facebook || 
          signatureData.socialNetworks?.instagram || 
          signatureData.socialNetworks?.x) && (
          <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Icônes personnalisées</Label>
              <div className="flex items-center gap-2">
                {getGenerationStatus() === 'generating' && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Génération...</span>
                  </div>
                )}
                {getGenerationStatus() === 'updating' && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Mise à jour...</span>
                  </div>
                )}
                {getGenerationStatus() === 'ready' && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Prêt</span>
                  </div>
                )}
                {getGenerationStatus() === 'error' && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>Erreur</span>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateCustomSocialIcons}
                  disabled={isGenerating}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Régénérer
                </Button>
              </div>
            </div>
            {generationError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {generationError}
              </div>
            )}
            {hasCustomSocialIcons() && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                Icônes personnalisées actives avec vos couleurs
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
