"use client";

import React, { useCallback, useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Plus,
  X,
  Search,
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
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
  // États pour les Popovers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openNetworkPopover, setOpenNetworkPopover] = useState(null);

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
    const platformName = socialNetwork === "x" ? "twitter" : socialNetwork;

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
    ],
  );

  // Gestion des changements d'URL
  const handleSocialUrlChange = useCallback(
    (platform, url) => {
      updateSignatureData("socialNetworks", {
        ...signatureData.socialNetworks,
        [platform]: url,
      });
    },
    [signatureData.socialNetworks, updateSignatureData],
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
      socialColors: updatedColors,
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

  // Mapping des icônes Lucide React pour les réseaux sociaux
  const socialNetworkIcons = {
    facebook: Facebook,
    github: Github,
    instagram: Instagram,
    linkedin: Linkedin,
    x: Twitter,
    youtube: Youtube,
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

  // Gestion de la couleur individuelle d'un réseau
  const handleIndividualColorChange = (network, color) => {
    const updatedColors = {
      ...signatureData.socialColors,
      [network]: color === "default" ? null : color,
    };
    updateSignatureData("socialColors", updatedColors);
  };

  // Gestion de la taille individuelle d'un réseau
  const handleIndividualSizeChange = (network, size) => {
    const updatedSizes = {
      ...signatureData.socialSizes,
      [network]: size,
    };
    updateSignatureData("socialSizes", updatedSizes);
  };

  // Réseaux activés (ceux qui sont dans socialNetworks)
  const activeNetworks = Object.keys(signatureData.socialNetworks || {});

  // Réseaux disponibles pour l'ajout (filtrés par recherche)
  const availableNetworks = ALLOWED_SOCIAL_NETWORKS.filter(
    (network) => !activeNetworks.includes(network),
  ).filter((network) =>
    socialNetworkLabels[network]
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header avec titre et bouton + */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-medium">Réseaux</h2>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-center">
                <p className="text-xs">Pour afficher les icônes dans votre signature, vous devez entrer l'URL de vos profils.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
          <PopoverTrigger asChild>
            <button
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Ajouter un réseau social"
            >
              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg"
            side="left"
            align="start"
            sideOffset={12}
          >
            {/* Barre de recherche */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-md">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
            {/* Liste des réseaux disponibles */}
            <div className="max-h-64 overflow-y-auto py-1">
              {availableNetworks.length > 0 ? (
                availableNetworks.map((network) => {
                  const IconComponent = socialNetworkIcons[network];
                  return (
                    <button
                      key={network}
                      onClick={() => {
                        handleSocialToggle(network, true);
                        setIsAddOpen(false);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      {socialNetworkLabels[network]}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-xs text-gray-400">
                  {activeNetworks.length === ALLOWED_SOCIAL_NETWORKS.length
                    ? "Tous les réseaux sont ajoutés"
                    : "Aucun résultat"}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Liste des réseaux activés */}
      {activeNetworks.length > 0 && (
        <div className="flex flex-col gap-3 ml-4">
          {activeNetworks.map((network) => {
            const IconComponent = socialNetworkIcons[network];
            return (
              <div key={network} className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  {socialNetworkLabels[network].split(" ")[0]}
                </Label>
                <Popover
                  open={openNetworkPopover === network}
                  onOpenChange={(open) =>
                    setOpenNetworkPopover(open ? network : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 w-40 px-1.5 justify-between gap-1.5"
                    >
                      <div className="flex items-center gap-2">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        <span className="text-xs font-normal truncate">
                          {socialNetworkLabels[network]}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSocialToggle(network, false);
                        }}
                        className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Supprimer"
                      >
                        <X className="w-2 h-2 text-gray-400 hover:text-gray-600" />
                      </button>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-72 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg"
                    side="left"
                    align="start"
                    sideOffset={160}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {socialNetworkLabels[network]}
                      </span>
                      <button
                        onClick={() => setOpenNetworkPopover(null)}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    {/* Contenu */}
                    <div className="p-4 space-y-4">
                      {/* URL */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          URL du profil
                        </Label>
                        <Input
                          className="h-8 w-full px-2 py-1 text-xs"
                          type="url"
                          value={signatureData.socialNetworks?.[network] || ""}
                          onChange={(e) =>
                            handleSocialUrlChange(network, e.target.value)
                          }
                          placeholder={`https://${network}.com/...`}
                        />
                      </div>

                      {/* Taille individuelle */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-gray-600 dark:text-gray-400">
                            Taille
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-8 w-14 px-2 py-1 text-xs text-center"
                              type="text"
                              inputMode="decimal"
                              value={
                                signatureData.socialSizes?.[network] ??
                                signatureData.socialSize ??
                                24
                              }
                              onChange={(e) =>
                                handleIndividualSizeChange(
                                  network,
                                  parseInt(e.target.value) || 24,
                                )
                              }
                              aria-label="Taille"
                            />
                            <span className="text-xs text-gray-400">px</span>
                          </div>
                        </div>
                        <Slider
                          className="w-full"
                          value={[
                            signatureData.socialSizes?.[network] ??
                              signatureData.socialSize ??
                              24,
                          ]}
                          onValueChange={(value) =>
                            handleIndividualSizeChange(network, value[0])
                          }
                          min={12}
                          max={64}
                          step={1}
                          aria-label="Taille"
                        />
                      </div>

                      {/* Couleur individuelle */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Couleur
                        </Label>
                        <Select
                          value={
                            signatureData.socialColors?.[network] || "default"
                          }
                          onValueChange={(color) =>
                            handleIndividualColorChange(network, color)
                          }
                        >
                          <SelectTrigger size="sm" className="h-8 w-40 text-xs">
                            <SelectValue placeholder="Défaut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded border border-gray-300 bg-gray-100" />
                                Défaut
                              </div>
                            </SelectItem>
                            {ALLOWED_COLORS.map((color) => (
                              <SelectItem key={color} value={color}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded border border-gray-300"
                                    style={{
                                      backgroundColor: getColorPreview(color),
                                    }}
                                  />
                                  {color.charAt(0).toUpperCase() +
                                    color.slice(1)}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}

          {/* Options globales */}
          <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
            {/* Couleur globale */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Couleur globale
              </Label>
              <Select
                value={signatureData.socialGlobalColor || "default"}
                onValueChange={handleGlobalColorChange}
              >
                <SelectTrigger size="sm" className="h-8 w-40 text-xs">
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

            {/* Taille globale */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Taille globale
              </Label>
              <div className="flex items-center gap-1.5 w-40">
                <Slider
                  className="flex-1"
                  value={[signatureData.socialSize ?? 24]}
                  onValueChange={(value) => handleSocialSizeChange(value[0])}
                  min={12}
                  max={64}
                  step={1}
                />
                <Input
                  className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.socialSize ?? 24}
                  onChange={(e) => handleSocialSizeChange(e.target.value)}
                  aria-label="Taille globale"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message si aucun réseau */}
      {activeNetworks.length === 0 && (
        <div className="ml-4 text-xs text-gray-400">
          Cliquez sur + pour ajouter un réseau social
        </div>
      )}
    </div>
  );
}
