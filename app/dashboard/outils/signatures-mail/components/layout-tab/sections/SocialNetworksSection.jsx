"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

export default function SocialNetworksSection({
  signatureData,
  updateSignatureData,
}) {
  // Gestion de la taille des logos sociaux
  const handleSocialSizeChange = (value) => {
    const numValue = parseInt(value) || 24;
    updateSignatureData("socialSize", Math.max(16, Math.min(48, numValue))); // Entre 16 et 48px
  };

  // Gestion des liens sociaux
  const handleSocialLinkChange = (platform, value) => {
    updateSignatureData("socialLinks", {
      ...signatureData.socialLinks,
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

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Réseaux sociaux</h2>
      <div className="flex flex-col gap-3 ml-4">
        {/* LinkedIn */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">LinkedIn</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-full px-2 py-1 text-xs placeholder:text-xs"
              type="url"
              value={signatureData.socialLinks?.linkedin || ""}
              onChange={(e) =>
                handleSocialLinkChange("linkedin", e.target.value)
              }
              placeholder="linkedin.com/in/..."
            />
          </div>
        </div>

        {/* Facebook */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Facebook</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-full px-2 py-1 text-xs placeholder:text-xs"
              type="url"
              value={signatureData.socialLinks?.facebook || ""}
              onChange={(e) =>
                handleSocialLinkChange("facebook", e.target.value)
              }
              placeholder="facebook.com/..."
            />
          </div>
        </div>

        {/* Twitter/X */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Twitter/X</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-full px-2 py-1 text-xs placeholder:text-xs"
              type="url"
              value={signatureData.socialLinks?.twitter || ""}
              onChange={(e) =>
                handleSocialLinkChange("twitter", e.target.value)
              }
              placeholder="x.com/..."
            />
          </div>
        </div>

        {/* Instagram */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Instagram</Label>
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-full px-2 py-1"
              type="url"
              value={signatureData.socialLinks?.instagram || ""}
              onChange={(e) =>
                handleSocialLinkChange("instagram", e.target.value)
              }
              placeholder="instagram.com/..."
            />
          </div>
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
      </div>
    </div>
  );
}
