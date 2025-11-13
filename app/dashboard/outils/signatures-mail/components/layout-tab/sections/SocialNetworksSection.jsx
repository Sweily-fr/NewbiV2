"use client";

import React, { useCallback } from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

// Nouvelle configuration des icônes sociales - SINGLE SOURCE OF TRUTH
const ICONS_SOCIAL_BUCKET_NAME =
  process.env.NEXT_PUBLIC_ICONS_SOCIAL_BUCKET_NAME || "newbi-social-icons";
const ICONS_SOCIAL_URL =
  process.env.NEXT_PUBLIC_ICONS_SOCIAL_URL || "https://social-icons.newbi.fr";

// Réseaux AUTORISÉS uniquement
const ALLOWED_SOCIAL_NETWORKS = [
  "facebook",
  "github",
  "instagram",
  "linkedin",
  "x",
  "youtube",
];

// Couleurs AUTORISÉES uniquement
const ALLOWED_COLORS = [
  "black",
  "green",
  "yellow",
  "pink",
  "sky",
  "orange",
  "blue",
  "purple",
  "indigo",
];

export default function SocialNetworksSection({
  signatureData,
  updateSignatureData,
}) {
  
  // Construction de l'URL d'icône selon la nouvelle logique
  const buildSocialIconUrl = useCallback((socialNetwork, color = null) => {
    // Vérifier que les variables d'environnement sont définies
    if (!ICONS_SOCIAL_URL) {
      return null;
    }

    // Vérifier que le réseau social est autorisé
    if (!ALLOWED_SOCIAL_NETWORKS.includes(socialNetwork)) {
      return null;
    }

    // Si couleur fournie, vérifier qu'elle est autorisée
    if (color && !ALLOWED_COLORS.includes(color)) {
      color = null; // Utiliser l'icône par défaut si couleur invalide
    }

    // Mapper "x" vers "twitter" pour les URLs
    const platformName = socialNetwork === 'x' ? 'twitter' : socialNetwork;

    // Construction de l'URL
    const baseUrl = `${ICONS_SOCIAL_URL}/social/${platformName}/${platformName}`;
    const finalUrl = color ? `${baseUrl}-${color}.png` : `${baseUrl}.png`;

    return finalUrl;
  }, []);

  // Gestion de la taille des logos sociaux
  const handleSocialSizeChange = (value) => {
    if (value === "" || value === null) {
      updateSignatureData("socialSize", 1);
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      updateSignatureData("socialSize", numValue);
    }
  };

  // Gestion de l'activation/désactivation des réseaux sociaux
  const handleSocialToggle = useCallback(
    (platform, enabled) => {
      const updatedNetworks = {
        ...signatureData.socialNetworks,
      };

      if (enabled) {
        // Activer le réseau social avec une URL vide pour forcer la saisie
        updatedNetworks[platform] = "";
      } else {
        // Désactiver le réseau social
        delete updatedNetworks[platform];

        // Supprimer aussi l'URL d'icône
        const updatedIcons = { ...signatureData.socialIcons };
        delete updatedIcons[platform];
        updateSignatureData("socialIcons", updatedIcons);
      }

      updateSignatureData("socialNetworks", updatedNetworks);
    },
    [
      signatureData.socialNetworks,
      signatureData.socialIcons,
      updateSignatureData,
    ]
  );

  // Gestion des changements d'URL
  const handleSocialUrlChange = useCallback(
    (platform, url) => {
      updateSignatureData("socialNetworks", {
        ...signatureData.socialNetworks,
        [platform]: url,
      });
    },
    [signatureData.socialNetworks, updateSignatureData]
  );

  // Gestion de la couleur globale des icônes
  const handleGlobalColorChange = (color) => {
    const globalColor = color === "default" ? null : color;

    // Mettre à jour socialColors avec le nom de la couleur pour chaque réseau
    const updatedColors = {};
    ALLOWED_SOCIAL_NETWORKS.forEach((platform) => {
      updatedColors[platform] = globalColor || null;
    });
    
    // Mettre à jour les deux champs en une seule fois (objet)
    updateSignatureData({
      socialGlobalColor: globalColor,
      socialColors: updatedColors
    });
  };

  // Gestion du background social
  const handleSocialBackgroundChange = (key, value) => {
    updateSignatureData("socialBackground", {
      ...signatureData.socialBackground,
      [key]: value,
    });
  };

  // Mapping des noms d'affichage pour les réseaux sociaux
  const socialNetworkLabels = {
    facebook: "Facebook",
    github: "GitHub",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    x: "X (Twitter)",
    youtube: "YouTube",
  };

  // Initialisation des réseaux sociaux par défaut (seulement si pas défini)
  React.useEffect(() => {
    if (!signatureData.socialNetworks) {
      // Initialiser avec un objet vide au lieu de tous les réseaux
      updateSignatureData("socialNetworks", {});
    }
  }, [signatureData.socialNetworks, updateSignatureData]);

  // Fonction pour obtenir une couleur de preview pour les sélecteurs
  const getColorPreview = (colorName) => {
    const colorMap = {
      black: "#000000",
      green: "#22c55e",
      yellow: "#eab308",
      pink: "#ec4899",
      sky: "#0ea5e9",
      orange: "#f97316",
      blue: "#3b82f6",
      purple: "#a855f7",
      indigo: "#6366f1",
    };
    return colorMap[colorName] || "#6b7280";
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Réseaux sociaux</h2>
      <div className="flex flex-col gap-3 ml-4">
        {/* Génération dynamique des switches pour chaque réseau autorisé */}
        {ALLOWED_SOCIAL_NETWORKS.map((network) => (
          <div key={network} className="flex flex-col gap-2">
            <div className="flex items-center justify-between cursor-pointer">
              <Label className="text-xs text-muted-foreground">
                {socialNetworkLabels[network]}
              </Label>
              <Switch
                checked={signatureData.socialNetworks?.hasOwnProperty(network)}
                className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
                onCheckedChange={(checked) =>
                  handleSocialToggle(network, checked)
                }
              />
            </div>
            {signatureData.socialNetworks?.hasOwnProperty(network) && (
              <div className="flex flex-col gap-2 ml-4">
                <Input
                  className="h-8 w-full px-2 py-1 text-xs placeholder:text-xs"
                  type="url"
                  value={signatureData.socialNetworks?.[network] || ""}
                  onChange={(e) =>
                    handleSocialUrlChange(network, e.target.value)
                  }
                  placeholder={`URL de votre profil ${socialNetworkLabels[network]}`}
                />
              </div>
            )}
          </div>
        ))}

        {/* Couleur globale */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <Label className="text-xs text-muted-foreground">
            Couleur globale
          </Label>
          <Select
            value={signatureData.socialGlobalColor || "default"}
            onValueChange={handleGlobalColorChange}
          >
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue placeholder="Défaut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Défaut</SelectItem>
              {ALLOWED_COLORS.map((color) => (
                <SelectItem key={color} value={color}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded border border-gray-300"
                      style={{
                        backgroundColor: getColorPreview(color),
                      }}
                    />
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Taille des logos sociaux */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Taille logos</Label>
          <div className="flex items-center gap-2 w-48">
            <button
              onClick={() => handleSocialSizeChange(24)}
              className="h-8 w-8 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md flex-shrink-0"
              title="Réinitialiser à 24"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Input
              className="h-8 px-2 py-1 min-w-12"
              style={{ width: `${Math.max(48, (signatureData.socialSize?.toString().length || 2) * 8 + 16)}px` }}
              type="text"
              inputMode="decimal"
              value={signatureData.socialSize ?? 24}
              onChange={(e) => {
                if (e.target.value === "") {
                  handleSocialSizeChange("");
                } else {
                  const numValue = parseInt(e.target.value);
                  if (!isNaN(numValue) && numValue >= 1) {
                    handleSocialSizeChange(e.target.value);
                  }
                }
              }}
              onBlur={(e) => {
                if (e.target.value === "") {
                  handleSocialSizeChange("");
                } else {
                  const numValue = parseInt(e.target.value);
                  if (!isNaN(numValue) && numValue >= 1) {
                    handleSocialSizeChange(e.target.value);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.target.value === "") {
                    handleSocialSizeChange("");
                  } else {
                    const numValue = parseInt(e.target.value);
                    if (!isNaN(numValue) && numValue >= 1) {
                      handleSocialSizeChange(e.target.value);
                    }
                  }
                }
              }}
              aria-label="Taille des logos sociaux"
              placeholder="24"
            />
            <Slider
              className="grow"
              value={[signatureData.socialSize || 24]}
              onValueChange={(value) => handleSocialSizeChange(value[0])}
              min={1}
              max={120}
              step={1}
              aria-label="Taille logos sociaux"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Background social */}
        {/* <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Arrière-plan</Label>
          <div className="flex items-center gap-3">
            <Switch
              className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
              checked={signatureData.socialBackground?.enabled || false}
              onCheckedChange={(checked) =>
                handleSocialBackgroundChange("enabled", checked)
              }
            />
          </div>
        </div> */}

        {/* {signatureData.socialBackground?.enabled && (
          <>
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
        )} */}

        {/* Informations sur les URLs générées */}
        {/* {Object.keys(signatureData.socialNetworks || {}).some(
          (key) => signatureData.socialNetworks[key]
        ) && (
          <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                URLs d'icônes générées
              </Label>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              {Object.entries(signatureData.socialIcons || {}).map(
                ([network, url]) => (
                  <div key={network} className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                      {socialNetworkLabels[network]}:
                    </span>
                    <span className="text-xs text-blue-600 truncate">
                      {url}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
