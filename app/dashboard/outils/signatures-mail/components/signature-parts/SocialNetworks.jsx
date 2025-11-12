/**
 * Réseaux sociaux pour les signatures
 * Affiche les icônes des réseaux sociaux configurés
 */

"use client";

import React from "react";
import DynamicSocialLogo from "../DynamicSocialLogo";
import { CLOUDFLARE_URLS } from "../../utils/cloudflareUrls";

const SocialNetworks = ({
  socialNetworks = {},
  customSocialIcons = {},
  size = 24,
  globalColor = null,
  socialColors = {},
  spacing = 15,
  iconSpacing = 8,
  colSpan = 2,
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

  // Debug logs
  console.log("🔍 SocialNetworks - customSocialIcons:", customSocialIcons);
  console.log("🔍 SocialNetworks - socialNetworks:", socialNetworks);
  console.log("🔍 SocialNetworks - configuredNetworks:", configuredNetworks);

  // Ne rien afficher si aucun réseau configuré
  if (configuredNetworks.length === 0) return null;

  // Fonction pour obtenir l'URL de l'icône
  const getSocialIconUrl = (platform) => {
    // Utiliser l'icône personnalisée si disponible
    if (customSocialIcons?.[platform]) {
      console.log(`✅ Icône personnalisée trouvée pour ${platform}:`, customSocialIcons[platform]);
      return customSocialIcons[platform];
    }

    // URLs des icônes par défaut depuis Cloudflare (configuration centralisée)
    const iconUrl = CLOUDFLARE_URLS.socialIcons[platform];
    console.log(`ℹ️ Icône par défaut pour ${platform}:`, iconUrl);
    return iconUrl || null;
  };

  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          paddingTop: `${spacing}px`,
          textAlign: "left",
        }}
      >
        <table
          cellPadding="0"
          cellSpacing="0"
          border="0"
          style={{ borderCollapse: "collapse" }}
        >
          <tbody>
            <tr>
              {configuredNetworks.map((social, index) => {
                const url = socialNetworks[social.key];
                const iconUrl = getSocialIconUrl(social.key);
                const color = socialColors?.[social.key] || globalColor;
                
                // Si iconUrl est une URL personnalisée (commence par http), ne pas appliquer de couleur
                const isCustomUrl = iconUrl && (iconUrl.startsWith("http") || iconUrl.startsWith("data:"));

                return (
                  <td
                    key={social.key}
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
                      {isCustomUrl ? (
                        // Si URL personnalisée, utiliser <img> (compatible emails)
                        <img
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
                      ) : (
                        // Sinon, utiliser DynamicSocialLogo avec couleur
                        <DynamicSocialLogo
                          logoType={social.key}
                          color={color}
                          size={size}
                        />
                      )}
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
