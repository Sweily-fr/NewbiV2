/**
 * Réseaux sociaux pour les signatures
 * Affiche les icônes des réseaux sociaux configurés depuis Cloudflare
 */

"use client";

import React from "react";
import { CLOUDFLARE_URLS } from "../../utils/cloudflareUrls";
import { getIndividualPaddingStyles } from "../../utils/padding-helper";

const SocialNetworks = ({
  socialNetworks = {},
  customSocialIcons = {},
  size = 24,
  globalColor = null,
  socialColors = {},
  spacing = 15,
  iconSpacing = 8,
  colSpan = 2,
  centered = false, // Mode centré pour signature verticale
  signatureData = {}, // Ajout pour le padding détaillé
}) => {
  // Liste des réseaux sociaux disponibles
  const availableSocialNetworks = [
    { key: "linkedin", label: "LinkedIn" },
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "x", label: "X (Twitter)" },
    { key: "youtube", label: "YouTube" },
    { key: "github", label: "GitHub" },
  ];

  // Filtrer les réseaux configurés
  const configuredNetworks = availableSocialNetworks.filter(
    (social) => socialNetworks?.hasOwnProperty(social.key) && socialNetworks[social.key]
  );

  // Ne rien afficher si aucun réseau configuré
  if (configuredNetworks.length === 0) return null;

  // Fonction pour mapper le nom du platform vers le nom Cloudflare
  const getPlatformName = (platform) => {
    const platformMap = {
      x: "twitter",
    };
    return platformMap[platform] || platform;
  };

  // Fonction pour obtenir l'URL de l'icône (personnalisée ou depuis Cloudflare)
  const getSocialIconUrl = (platform) => {
    // Utiliser l'icône personnalisée si disponible
    if (customSocialIcons?.[platform]) {
      return customSocialIcons[platform];
    }

    // Récupérer la couleur pour ce réseau (priorité: couleur spécifique > couleur globale)
    const color = socialColors?.[platform] || globalColor;
    
    // Construire l'URL Cloudflare avec la couleur si disponible
    if (color) {
      // Convertir la couleur hex en nom (ex: #0077b5 -> blue, #25D366 -> green)
      const colorName = getColorName(color);
      if (colorName) {
        // Utiliser le nom Cloudflare du platform (x -> twitter)
        const cloudflareplatform = getPlatformName(platform);
        const url = `${CLOUDFLARE_URLS.social}/${cloudflareplatform}/${cloudflareplatform}-${colorName}.png`;
        return url;
      }
    }

    // Fallback vers l'icône par défaut
    return CLOUDFLARE_URLS.socialIcons[platform];
  };

  // Fonction pour convertir une couleur hex ou nom en nom Cloudflare
  const getColorName = (colorInput) => {
    if (!colorInput) return null;
    
    const color = colorInput.toLowerCase().trim();
    
    // Si c'est déjà un nom de couleur, le retourner directement
    const validColorNames = ["blue", "pink", "purple", "black", "red", "green", "yellow", "orange", "indigo", "sky"];
    if (validColorNames.includes(color)) {
      return color;
    }
    
    // Sinon, convertir le hex en nom
    const hexColor = color.replace("#", "");
    
    // Mapping des couleurs hex vers les noms Cloudflare
    const colorMap = {
      // LinkedIn blue
      "0077b5": "blue",
      // Facebook blue
      "1877f2": "blue",
      // Instagram gradient (rose/purple)
      "e4405f": "pink",
      "833ab4": "purple",
      // X (Twitter) black
      "000000": "black",
      "1da1f2": "blue",
      // YouTube red
      "ff0000": "red",
      // GitHub black
      "333333": "black",
      // Couleurs communes
      "00ff00": "green",
      "ff00ff": "purple",
      "ffff00": "yellow",
      "ff6600": "orange",
    };
    
    return colorMap[hexColor] || null;
  };

  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          // Padding détaillé ou espacement par défaut
          ...(signatureData.detailedSpacing
            ? getIndividualPaddingStyles(signatureData, "social", { top: spacing })
            : { paddingTop: `${spacing}px` }),
          textAlign: centered ? "center" : "left",
        }}
      >
        <table
          cellPadding="0"
          cellSpacing="0"
          border="0"
          style={{ 
            borderCollapse: "collapse",
            margin: centered ? "0 auto" : "0",
          }}
        >
          <tbody>
            <tr>
              {configuredNetworks.map((social, index) => {
                const url = socialNetworks[social.key];
                const iconUrl = getSocialIconUrl(social.key);
                // Créer une clé unique basée sur la couleur pour forcer le rechargement
                const colorKey = socialColors?.[social.key] || globalColor || "default";
                const uniqueKey = `${social.key}-${colorKey}`;

                return (
                  <td
                    key={uniqueKey}
                    style={{
                      paddingRight:
                        index < configuredNetworks.length - 1
                          ? `${iconSpacing}px`
                          : "0",
                    }}
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      <img
                        key={uniqueKey}
                        src={iconUrl}
                        alt={social.label}
                        width={size}
                        height={size}
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          display: "block",
                          border: "none",
                        }}
                      />
                    </a>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
};

export default SocialNetworks;
