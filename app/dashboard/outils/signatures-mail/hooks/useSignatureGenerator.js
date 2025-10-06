/**
 * Hook personnalisé pour la génération de signatures HTML
 */

import { useSignatureData } from "@/src/hooks/use-signature-data";

export function useSignatureGenerator() {
  const { signatureData } = useSignatureData();

  // Générer le HTML de la signature
  const generateHTML = () => {
    // Fonction helper pour obtenir l'espacement approprié
    const getSpacing = (specificSpacing, fallbackSpacing = 8) => {
      let result;
      // Si le mode détaillé est activé, utiliser l'espacement spécifique
      if (signatureData.detailedSpacing && specificSpacing !== undefined) {
        result = specificSpacing;
      } else {
        // Sinon, utiliser l'espacement global ou le fallback
        result = signatureData.spacings?.global || fallbackSpacing;
      }

      console.log(
        `🔍 getSpacing - specific: ${specificSpacing}, fallback: ${fallbackSpacing}, detailedMode: ${signatureData.detailedSpacing}, global: ${signatureData.spacings?.global}, result: ${result}`
      );
      return result;
    };

    // Fonction helper pour obtenir les valeurs de typographie (nouvelle structure détaillée ou ancienne)
    const getTypography = (field, property, fallback) => {
      // Priorité à la nouvelle structure détaillée
      const detailedValue = signatureData.typography?.[field]?.[property];
      if (detailedValue !== undefined) {
        return detailedValue;
      }

      // Fallback vers l'ancienne structure
      if (property === "fontSize") {
        const fieldMapping = {
          fullName: "name",
          position: "position",
          email: "contact",
          phone: "contact",
          mobile: "contact",
          website: "contact",
          address: "contact",
        };
        return (
          signatureData.fontSize?.[fieldMapping[field] || field] || fallback
        );
      } else if (property === "color") {
        const fieldMapping = {
          fullName: "name",
          position: "position",
          company: "company",
          email: "contact",
          phone: "contact",
          mobile: "contact",
          website: "contact",
          address: "contact",
        };
        return signatureData.colors?.[fieldMapping[field] || field] || fallback;
      } else if (property === "fontFamily") {
        return signatureData.fontFamily || fallback;
      } else if (property === "fontWeight") {
        return fallback;
      }

      return fallback;
    };

    const profileImageHTML = signatureData.photo
      ? `<div style="width: ${signatureData.imageSize || 80}px; height: ${signatureData.imageSize || 80}px; border-radius: ${signatureData.imageShape === "square" ? "8px" : "50%"}; background: url('${signatureData.photo}') center center/cover no-repeat; display: block;"></div>`
      : "";

    const logoHTML = signatureData.logo
      ? `<img src="${signatureData.logo}" alt="Logo entreprise" style="max-width: ${signatureData.logoSize || 60}px; height: auto; display: block; margin: 0;" />`
      : "";

    // Générer les icônes sociales avec la couleur globale
    const generateSocialIconsHTML = () => {
      // Fonction pour obtenir l'URL de l'icône avec couleur globale
      const getSocialIconUrl = (platform) => {
        const baseUrl =
          "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social";
        const color = signatureData.socialGlobalColor;

        // Construction de l'URL avec ou sans couleur
        const iconName = color ? `${platform}-${color}` : platform;
        return `${baseUrl}/${platform}/${iconName}.png`;
      };

      // Réseaux sociaux disponibles
      const availableSocialNetworks = [
        { key: "linkedin", label: "LinkedIn" },
        { key: "facebook", label: "Facebook" },
        { key: "instagram", label: "Instagram" },
        { key: "twitter", label: "Twitter/X" },
        { key: "github", label: "GitHub" },
        { key: "youtube", label: "YouTube" },
      ];

      // Filtrer seulement les réseaux activés (avec switch ON)
      const activeNetworks = availableSocialNetworks.filter(
        (social) =>
          signatureData.socialNetworks?.hasOwnProperty(social.key) &&
          signatureData.socialNetworks[social.key] &&
          signatureData.socialNetworks[social.key].trim() !== ""
      );

      if (activeNetworks.length === 0) {
        return "";
      }

      const iconsHTML = activeNetworks
        .map((social, index) => {
          return `
            <td style="padding-right: ${index < activeNetworks.length - 1 ? "8px" : "0"};">
              <a href="${signatureData.socialNetworks[social.key]}" style="text-decoration: none; display: block;">
                <img src="${getSocialIconUrl(social.key)}" alt="${social.label}" style="width: ${signatureData.socialSize || 24}px; height: ${signatureData.socialSize || 24}px; display: block;" />
              </a>
            </td>
          `;
        })
        .join("");

      return `
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
          <tbody>
            <tr>
              ${iconsHTML}
            </tr>
          </tbody>
        </table>
      `;
    };

    const socialIconsHTML = generateSocialIconsHTML();

    const isHorizontal = signatureData.orientation === "horizontal";
 

    if (isHorizontal) {
      // Structure horizontale
      return `
       <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: ${signatureData.fontFamily || "Arial, sans-serif"}; width: 100%;">
          <tbody>
            <tr>
              <!-- Colonne de gauche : Photo seulement -->
              <td style="width: ${signatureData.photo ? (signatureData.imageSize || 80) + 16 : 120}px; padding-right: 15px; vertical-align: top;">
                ${signatureData.photo ? profileImageHTML : ""}
              </td>
              
              <!-- Séparateur vertical -->
              <td style="width: ${1}px; background-color: ${signatureData.colors?.separatorVertical || "#e0e0e0"}; padding: 0; font-size: 1px; line-height: 1px;">
                &nbsp;
              </td>
              
              <!-- Colonne de droite : Nom + Poste + Informations de contact -->
              <td style="padding-left: 15px; vertical-align: top;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                  <tbody>
                    <!-- Nom -->
                    <tr>
                      <td colspan="2" style="padding-bottom: ${getSpacing(signatureData.spacings?.nameBottom, 8)}px; text-align: ${signatureData.nameAlignment || "left"};">
                        <div style="font-size: ${getTypography("fullName", "fontSize", 16)}px; font-weight: ${getTypography("fullName", "fontWeight", "bold")}; color: ${getTypography("fullName", "color", signatureData.primaryColor || "#2563eb")}; line-height: 1.2; font-family: ${getTypography("fullName", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("fullName", "fontStyle", "normal")}; text-decoration: ${getTypography("fullName", "textDecoration", "none")};">
                          ${signatureData.fullName || `${signatureData.firstName || ""} ${signatureData.lastName || ""}`.trim()}
                        </div>
                      </td>
                    </tr>
                    <!-- Poste -->
                    ${
                      signatureData.position
                        ? `
                      <tr>
                        <td colspan="2" style="padding-bottom: ${getSpacing(signatureData.spacings?.positionBottom, 12)}px; text-align: ${signatureData.nameAlignment || "left"};">
                          <div style="font-size: ${getTypography("position", "fontSize", 14)}px; color: ${getTypography("position", "color", "rgb(102,102,102)")}; font-family: ${getTypography("position", "fontFamily", "Arial, sans-serif")}; font-weight: ${getTypography("position", "fontWeight", "normal")}; font-style: ${getTypography("position", "fontStyle", "normal")}; text-decoration: ${getTypography("position", "textDecoration", "none")};">
                            ${signatureData.position}
                          </div>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      signatureData.phone
                        ? `
                      <tr>
                        <td style="padding-bottom: ${getSpacing(signatureData.spacings?.phoneToMobile, 6)}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 16px;">
                                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/smartphone.png" alt="Téléphone" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
                                </td>
                                <td style="font-size: ${getTypography("phone", "fontSize", 12)}px; color: ${getTypography("phone", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("phone", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("phone", "fontFamily", "Arial, sans-serif")};">
                                  <a href="tel:${signatureData.phone}" style="color: ${getTypography("phone", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.phone}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      signatureData.mobile
                        ? `
                      <tr>
                        <td style="padding-bottom: ${getSpacing(signatureData.spacings?.mobileToEmail, 6)}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 16px;">
                                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/phone.png" alt="Mobile" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
                                </td>
                                <td style="font-size: ${getTypography("mobile", "fontSize", 12)}px; color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("mobile", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("mobile", "fontFamily", "Arial, sans-serif")};">
                                  <a href="tel:${signatureData.mobile}" style="color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.mobile}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      signatureData.email
                        ? `
                      <tr>
                        <td style="padding-bottom: ${getSpacing(signatureData.spacings?.emailToWebsite, 6)}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 16px;">
                                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/mail.png" alt="Email" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
                                </td>
                                <td style="font-size: ${getTypography("email", "fontSize", 12)}px; color: ${getTypography("email", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("email", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("email", "fontFamily", "Arial, sans-serif")};">
                                  <a href="mailto:${signatureData.email}" style="color: ${getTypography("email", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.email}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      signatureData.website
                        ? `
                      <tr>
                        <td style="padding-bottom: ${getSpacing(signatureData.spacings?.websiteToAddress, 6)}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 16px;">
                                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/globe.png" alt="Site web" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
                                </td>
                                <td style="font-size: ${getTypography("website", "fontSize", 12)}px; color: ${getTypography("website", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("website", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("website", "fontFamily", "Arial, sans-serif")};">
                                  <a href="${signatureData.website}" style="color: ${getTypography("website", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.website}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      signatureData.address
                        ? `
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: top; width: 16px;">
                                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/map-pin.png" alt="Adresse" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block; margin-top: 1px;" />
                                </td>
                                <td style="font-size: ${getTypography("address", "fontSize", 12)}px; color: ${getTypography("address", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("address", "fontWeight", "normal")}; vertical-align: top; font-family: ${getTypography("address", "fontFamily", "Arial, sans-serif")};">
                                  ${signatureData.address}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                  </tbody>
                </table>
              </td>
            </tr>
            
            <!-- Séparateur horizontal sur toute la largeur -->
            <tr>
              <td colspan="3" style="padding-top: ${getSpacing(signatureData.spacings?.separatorTop, 12)}px; padding-bottom: ${getSpacing(signatureData.spacings?.separatorBottom, 12)}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                  <tbody>
                    <tr>
                      <td style="border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}; line-height: 1px; font-size: 1px;">&nbsp;</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            
            <!-- Logo entreprise aligné à gauche -->
            ${
              logoHTML
                ? `
              <tr>
                <td style="padding-top: ${getSpacing(signatureData.spacings?.logoBottom, 15)}px; text-align: left;" colspan="1">
                  ${logoHTML}
                </td>
                <td colspan="2"></td>
              </tr>
            `
                : ""
            }
            
            <!-- Icônes sociales alignées à gauche -->
            ${
              socialIconsHTML
                ? `
              <tr>
                <td style="padding-top: ${getSpacing(signatureData.spacings?.logoToSocial, 12)}px; text-align: left;" colspan="1">
                  ${socialIconsHTML}
                </td>
                <td colspan="2"></td>
              </tr>
            `
                : ""
            }
          </tbody>
        </table>
      `;
    } else {
      // Structure verticale - identique au composant VerticalSignature
      const photoWidthPx = signatureData.photo
        ? (signatureData.imageSize || 80) + 15
        : 120;

      return `
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: ${signatureData.fontFamily || "Arial, sans-serif"}; width: 100%;">
          <tbody>
            <tr>
              <!-- Colonne de gauche : Photo + Nom + Poste -->
              <td style="width: ${photoWidthPx}px; padding-right: 15px; vertical-align: top;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                  <tbody>
                    ${
                      signatureData.photo
                        ? `
                      <tr>
                        <td style="padding-bottom: ${getSpacing(signatureData.spacings?.photoBottom, 16)}px; text-align: ${signatureData.nameAlignment || "left"};">
                          ${profileImageHTML}
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    <tr>
                      <td style="padding-bottom: ${getSpacing(signatureData.spacings?.nameBottom, 8)}px; text-align: ${signatureData.nameAlignment || "left"};">
                        <div style="font-size: ${getTypography("fullName", "fontSize", 16)}px; font-weight: ${getTypography("fullName", "fontWeight", "bold")}; color: ${getTypography("fullName", "color", signatureData.primaryColor || "#2563eb")}; line-height: 1.2; font-family: ${getTypography("fullName", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("fullName", "fontStyle", "normal")}; text-decoration: ${getTypography("fullName", "textDecoration", "none")};">
                          ${signatureData.fullName || `${signatureData.firstName || ""} ${signatureData.lastName || ""}`.trim()}
                        </div>
                      </td>
                    </tr>
                    ${
                      signatureData.position
                        ? `
                      <tr>
                        <td style="padding-bottom: ${getSpacing(signatureData.spacings?.positionBottom, 8)}px; text-align: ${signatureData.nameAlignment || "left"};">
                          <div style="font-size: ${getTypography("position", "fontSize", 14)}px; color: ${getTypography("position", "color", "rgb(102,102,102)")}; font-family: ${getTypography("position", "fontFamily", "Arial, sans-serif")}; font-weight: ${getTypography("position", "fontWeight", "normal")}; font-style: ${getTypography("position", "fontStyle", "normal")}; text-decoration: ${getTypography("position", "textDecoration", "none")};">
                            ${signatureData.position}
                          </div>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    

                    
                  </tbody>
                </table>
              </td>
              
              <!-- Séparateur vertical -->
              <td style="width: ${1}px; background-color: ${signatureData.colors?.separatorVertical || "#e0e0e0"}; padding: 0; font-size: 1px; line-height: 1px;">
                &nbsp;
              </td>
              
              <!-- Colonne de droite : Informations de contact -->
              <td style="padding-left: 15px; vertical-align: top;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                  <tbody>
                    ${
                      signatureData.phone
                        ? `
                      <tr>
                        <td style="padding-bottom: ${getSpacing(signatureData.spacings?.phoneToMobile, 6)}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 16px;">
                                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/smartphone.png" alt="Téléphone" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
                                </td>
                                <td style="font-size: ${getTypography("phone", "fontSize", 12)}px; color: ${getTypography("phone", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("phone", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("phone", "fontFamily", "Arial, sans-serif")};">
                                  <a href="tel:${signatureData.phone}" style="color: ${getTypography("phone", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.phone}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      signatureData.mobile
                        ? `
                      <tr>
                        <td style="padding-bottom: ${getSpacing(signatureData.spacings?.mobileToEmail, 6)}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 16px;">
                                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/phone.png" alt="Mobile" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
                                </td>
                                <td style="font-size: ${getTypography("mobile", "fontSize", 12)}px; color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("mobile", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("mobile", "fontFamily", "Arial, sans-serif")};">
                                  <a href="tel:${signatureData.mobile}" style="color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.mobile}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      signatureData.email
                        ? `
                      <tr>
                        <td style="padding-bottom: ${getSpacing(signatureData.spacings?.emailToWebsite, 6)}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 16px;">
                                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/mail.png" alt="Email" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
                                </td>
                                <td style="font-size: ${getTypography("email", "fontSize", 12)}px; color: ${getTypography("email", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("email", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("email", "fontFamily", "Arial, sans-serif")};">
                                  <a href="mailto:${signatureData.email}" style="color: ${getTypography("email", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.email}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      signatureData.website
                        ? `
                      <tr>
                        <td style="padding-bottom: ${getSpacing(signatureData.spacings?.websiteToAddress, 6)}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 16px;">
                                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/globe.png" alt="Site web" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
                                </td>
                                <td style="font-size: ${getTypography("website", "fontSize", 12)}px; color: ${getTypography("website", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("website", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("website", "fontFamily", "Arial, sans-serif")};">
                                  <a href="${signatureData.website}" style="color: ${getTypography("website", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.website}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      signatureData.address
                        ? `
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: top; width: 16px;">
                                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/map-pin.png" alt="Adresse" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block; margin-top: 1px;" />
                                </td>
                                <td style="font-size: ${getTypography("address", "fontSize", 12)}px; color: ${getTypography("address", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("address", "fontWeight", "normal")}; vertical-align: top; font-family: ${getTypography("address", "fontFamily", "Arial, sans-serif")};">
                                  ${signatureData.address}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    
                    <!-- Séparateur horizontal -->
                    <tr>
                      <td style="padding-top: ${getSpacing(signatureData.spacings?.separatorTop, 12)}px; padding-bottom: ${getSpacing(signatureData.spacings?.separatorBottom, 12)}px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                          <tbody>
                            <tr>
                              <td style="border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}; line-height: 1px; font-size: 1px;">&nbsp;</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Logo entreprise - Après le séparateur, dans la colonne de droite -->
                    ${
                      logoHTML
                        ? `
                      <tr>
                        <td style="padding-top: ${getSpacing(signatureData.spacings?.logoBottom, 15)}px; text-align: left;">
                          ${logoHTML}
                        </td>
                      </tr>
                    `
                        : ""
                    }
                    
                  </tbody>
                </table>
              </td>
            </tr>
            
            <!-- Icônes sociales - Ligne séparée en bas de toute la signature -->
            ${
              socialIconsHTML
                ? `
              <tr>
                <td style="padding-top: ${getSpacing(signatureData.spacings?.logoToSocial, 12)}px; text-align: left;" colspan="3">
                  ${socialIconsHTML}
                </td>
              </tr>
            `
                : ""
            }
          </tbody>
        </table>
      `;
    }
  };

  // Générer le CSS pour la prévisualisation
  const generateCSS = () => {
    return `
      .signature-preview {
        font-family: ${signature.appearance.fontFamily};
        font-size: ${signature.appearance.fontSize};
        color: #333;
        line-height: 1.4;
        max-width: 600px;
        padding: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: white;
      }
    `;
  };

  // Générer le HTML optimisé pour les clients mail avec cellules vides pour espacements
  const generateEmailHTML = () => {
    // Fonction helper pour obtenir l'espacement approprié
    const getSpacing = (specificSpacing, fallbackSpacing = 8) => {
      let result;
      // Si le mode détaillé est activé, utiliser l'espacement spécifique
      if (signatureData.detailedSpacing && specificSpacing !== undefined) {
        result = specificSpacing;
      } else {
        // Sinon, utiliser l'espacement global ou le fallback
        result = signatureData.spacings?.global || fallbackSpacing;
      }

      return result;
    };

    // Fonction helper pour créer un espacement avec une cellule vide
    const createSpacingRow = (spacing) => {
      if (spacing <= 0) {

        return "";
      }
      const row = `<tr><td style="height: ${spacing}px; line-height: ${spacing}px; font-size: 1px;">&nbsp;</td></tr>`;
   
      return row;
    };

    const profileImageHTML = signatureData.photo
      ? `<img src="${signatureData.photo}" alt="Profile" style="width: ${signatureData.imageSize || 80}px; height: ${signatureData.imageSize || 80}px; border-radius: ${signatureData.imageShape === "square" ? "8px" : "50%"}; background: url('${signatureData.photo}') center center / cover no-repeat; display: block;" />`
      : "";

    const logoHTML = signatureData.logo
      ? `<img src="${signatureData.logo}" alt="Logo entreprise" style="max-width: ${signatureData.logoSize || 60}px; height: auto; display: block; margin: 0;" />`
      : "";

    const isHorizontal = signatureData.orientation === "horizontal";

    if (isHorizontal) {
      return `
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: ${signatureData.fontFamily || "Arial, sans-serif"};">
          <tr>
            ${profileImageHTML ? `<td style="padding-right: 16px; vertical-align: top;">${profileImageHTML}</td>` : ""}
            <td style="vertical-align: top;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td style="font-size: ${signatureData.fontSize?.name || 16}px; font-weight: bold; color: ${signatureData.colors?.name || signatureData.primaryColor || "#2563eb"}; line-height: 1.2; padding: 0; margin: 0;">
                    ${signatureData.fullName || `${signatureData.firstName || ""} ${signatureData.lastName || ""}`.trim()}
                  </td>
                </tr>
                ${
                  signatureData.position
                    ? `
                  ${createSpacingRow(getSpacing(signatureData.spacings?.positionBottom, 8))}
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.position || 14}px; color: ${signatureData.colors?.position || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      ${signatureData.position}
                    </td>
                  </tr>
                `
                    : ""
                }
                ${
                  signatureData.phone
                    ? `
                  ${createSpacingRow(getSpacing(signatureData.spacings?.phoneToMobile, 4))}
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      📞 <a href="tel:${signatureData.phone}" style="color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; text-decoration: none;">${signatureData.phone}</a>
                    </td>
                  </tr>
                `
                    : ""
                }
                ${
                  signatureData.email
                    ? `
                  ${createSpacingRow(getSpacing(signatureData.spacings?.mobileToEmail, 4))}
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      ✉️ <a href="mailto:${signatureData.email}" style="color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; text-decoration: none;">${signatureData.email}</a>
                    </td>
                  </tr>
                `
                    : ""
                }
                ${
                  signatureData.website
                    ? `
                  ${createSpacingRow(getSpacing(signatureData.spacings?.emailToWebsite, 4))}
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      🌐 <a href="${signatureData.website}" style="color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; text-decoration: none;">${signatureData.website}</a>
                    </td>
                  </tr>
                `
                    : ""
                }
                ${
                  signatureData.address
                    ? `
                  ${createSpacingRow(getSpacing(signatureData.spacings?.websiteToAddress, 4))}
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      📍 ${signatureData.address}
                    </td>
                  </tr>
                `
                    : ""
                }
                ${createSpacingRow(getSpacing(signatureData.spacings?.separatorTop, 8))}
                <tr>
                  <td style="border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}; height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</td>
                </tr>
                ${
                  logoHTML
                    ? `
                  ${createSpacingRow(getSpacing(signatureData.spacings?.logoBottom, 8))}
                  <tr>
                    <td style="text-align: left; padding: 0; margin: 0;">
                      ${logoHTML}
                    </td>
                  </tr>
                `
                    : ""
                }
              </table>
            </td>
          </tr>
        </table>
      `;
    } else {
      // Version verticale avec tableaux et cellules vides pour les espacements
      return `
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: ${signatureData.fontFamily || "Arial, sans-serif"};">
          <tr>
            <td style="padding-right: ${getSpacing(signatureData.spacings?.verticalSeparatorLeft, 15)}px; vertical-align: top;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                ${
                  profileImageHTML
                    ? `
                  <tr>
                    <td style="padding: 0; margin: 0;">
                      ${profileImageHTML}
                    </td>
                  </tr>
                  ${createSpacingRow(getSpacing(signatureData.spacings?.photoBottom, 12))}
                `
                    : ""
                }
                <tr>
                  <td style="font-size: ${signatureData.fontSize?.name || 16}px; font-weight: bold; color: ${signatureData.colors?.name || signatureData.primaryColor || "#2563eb"}; line-height: 1.2; padding: 0; margin: 0;">
                    ${signatureData.fullName || `${signatureData.firstName || ""} ${signatureData.lastName || ""}`.trim()}
                  </td>
                </tr>
                ${
                  signatureData.position
                    ? `
                  ${createSpacingRow(getSpacing(signatureData.spacings?.nameBottom, 8))}
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.position || 14}px; color: ${signatureData.colors?.position || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      ${signatureData.position}
                    </td>
                  </tr>
                `
                    : ""
                }
                ${
                  signatureData.companyName
                    ? `
                  ${createSpacingRow(getSpacing(signatureData.spacings?.positionBottom, 8))}
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.position || 14}px; font-weight: bold; color: ${signatureData.colors?.company || signatureData.primaryColor || "#2563eb"}; padding: 0; margin: 0;">
                      ${signatureData.companyName}
                    </td>
                  </tr>
                `
                    : ""
                }
              </table>
            </td>
            <td style="width: ${1}px; background-color: ${signatureData.colors?.separatorVertical || "#e0e0e0"}; font-size: 1px; line-height: 1px;">&nbsp;</td>
            <td style="padding-left: ${getSpacing(signatureData.spacings?.verticalSeparatorRight, 15)}px; vertical-align: top;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                ${
                  signatureData.phone
                    ? `
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      📞 <a href="tel:${signatureData.phone}" style="color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; text-decoration: none;">${signatureData.phone}</a>
                    </td>
                  </tr>
                  ${createSpacingRow(getSpacing(signatureData.spacings?.phoneToMobile, 6))}
                `
                    : ""
                }
                ${
                  signatureData.mobile
                    ? `
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      📱 <a href="tel:${signatureData.mobile}" style="color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; text-decoration: none;">${signatureData.mobile}</a>
                    </td>
                  </tr>
                  ${createSpacingRow(getSpacing(signatureData.spacings?.mobileToEmail, 6))}
                `
                    : ""
                }
                ${
                  signatureData.email
                    ? `
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      ✉️ <a href="mailto:${signatureData.email}" style="color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; text-decoration: none;">${signatureData.email}</a>
                    </td>
                  </tr>
                  ${createSpacingRow(getSpacing(signatureData.spacings?.emailToWebsite, 6))}
                `
                    : ""
                }
                ${
                  signatureData.website
                    ? `
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      🌐 <a href="${signatureData.website}" style="color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; text-decoration: none;">${signatureData.website}</a>
                    </td>
                  </tr>
                  ${createSpacingRow(getSpacing(signatureData.spacings?.websiteToAddress, 6))}
                `
                    : ""
                }
                ${
                  signatureData.address
                    ? `
                  <tr>
                    <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || "rgb(102,102,102)"}; padding: 0; margin: 0;">
                      📍 ${signatureData.address}
                    </td>
                  </tr>
                  ${createSpacingRow(12)}
                `
                    : ""
                }
                ${createSpacingRow(getSpacing(signatureData.spacings?.separatorTop, 12))}
                <tr>
                  <td style="border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}; height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</td>
                </tr>
                ${
                  logoHTML
                    ? `
                  ${createSpacingRow(getSpacing(signatureData.spacings?.logoBottom, 12))}
                  <tr>
                    <td style="text-align: left; padding: 0; margin: 0;">
                      ${logoHTML}
                    </td>
                  </tr>
                `
                    : ""
                }
              </table>
            </td>
          </tr>
        </table>
      `;
    }
  };

  // Sauvegarder automatiquement la signature avant la copie
  const autoSaveSignatureForCopy = async () => {
    try {

      // Générer un ID permanent si c'est temporaire
      let finalSignatureId = signatureData.signatureId;
      if (!finalSignatureId || finalSignatureId.startsWith("temp-")) {
        finalSignatureId = `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Préparer les données de signature pour la sauvegarde
      const signatureToSave = {
        signatureName:
          signatureData.signatureName ||
          `Signature ${new Date().toLocaleDateString()}`,
        fullName:
          signatureData.fullName ||
          `${signatureData.firstName || ""} ${signatureData.lastName || ""}`.trim(),
        firstName: signatureData.firstName || "",
        lastName: signatureData.lastName || "",
        position: signatureData.position || "",
        company: signatureData.company || "",
        email: signatureData.email || "",
        phone: signatureData.phone || "",
        mobile: signatureData.mobile || "",
        website: signatureData.website || "",
        address: signatureData.address || "",
        photo: signatureData.photo || "",
        photoKey: signatureData.photoKey || "",
        logo: signatureData.logo || "",
        logoKey: signatureData.logoKey || "",
        orientation: signatureData.orientation || "vertical",
        socialNetworks: signatureData.socialNetworks || {},
        socialColors: signatureData.socialColors || {},
        customSocialIcons: signatureData.customSocialIcons || {},
        spacings: signatureData.spacings || {},
        detailedSpacing: signatureData.detailedSpacing || false,
        typography: signatureData.typography || {},
        imageSize: signatureData.imageSize || 80,
        imageShape: signatureData.imageShape || "circle",
        logoSize: signatureData.logoSize || 60,
      };

      // Appeler l'API de sauvegarde
      const response = await fetch("/api/signatures/auto-save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signatureId: finalSignatureId,
          signatureData: signatureToSave,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur sauvegarde: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
     
        // Stocker l'ID permanent pour les futures générations d'icônes
        sessionStorage.setItem("lastSavedSignatureId", result.signatureId);
        return { success: true, signatureId: result.signatureId };
      } else {
        throw new Error(result.message || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      // Ne pas bloquer la copie si la sauvegarde échoue
      return { success: false, error: error.message };
    }
  };

  // Copier la signature dans le presse-papiers
  const copyToClipboard = async (regenerateIconsCallback = null) => {
    // 1. Générer le HTML avec les données actuelles
    const html = generateHTML();

    try {
      // 2. Copier dans le presse-papiers
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html.replace(/<[^>]*>/g, "")], {
            type: "text/plain",
          }),
        }),
      ]);

      return { success: true, message: "Signature copiée avec formatage HTML" };
    } catch (error) {
      console.warn("⚠️ Erreur copie moderne, fallback vers texte:", error);
      // Fallback vers la méthode simple
      try {
        await navigator.clipboard.writeText(html);
        return { success: true, message: "Signature copiée (texte brut)" };
      } catch {
        return { success: false, message: "Erreur lors de la copie" };
      }
    }
  };

  // Sauvegarder ET copier la signature
  const saveAndCopyToClipboard = async (regenerateIconsCallback = null) => {
    try {
      // 1. Sauvegarder automatiquement la signature
      const saveResult = await autoSaveSignatureForCopy();
      if (saveResult.success) {

        // 2. Régénérer les icônes avec l'ID permanent si callback fourni
        if (
          regenerateIconsCallback &&
          typeof regenerateIconsCallback === "function"
        ) {
          try {
            await regenerateIconsCallback(saveResult.signatureId);
          } catch (error) {
            console.warn("⚠️ Erreur régénération icônes:", error);
          }
        }
      } else {
        console.warn(
          "⚠️ Sauvegarde automatique échouée, copie quand même:",
          saveResult.error
        );
      }

      // 3. Générer le HTML avec les données actuelles
      const html = generateHTML();

      try {
        // 4. Copier dans le presse-papiers
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([html.replace(/<[^>]*>/g, "")], {
              type: "text/plain",
            }),
          }),
        ]);

        const message = saveResult.success
          ? "Signature sauvegardée et copiée avec URLs permanentes !"
          : "Signature copiée avec formatage HTML";

        return { success: true, message, signatureId: saveResult.signatureId };
      } catch (error) {
        console.warn("⚠️ Erreur copie moderne, fallback vers texte:", error);
        // Fallback vers la méthode simple
        try {
          await navigator.clipboard.writeText(html);
          const message = saveResult.success
            ? "Signature sauvegardée et copiée (texte brut)"
            : "Signature copiée (texte brut)";
          return {
            success: true,
            message,
            signatureId: saveResult.signatureId,
          };
        } catch {
          return { success: false, message: "Erreur lors de la copie" };
        }
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde et copie:", error);
      return { success: false, message: error.message };
    }
  };

  // Télécharger la signature en HTML
  const downloadHTML = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Signature Email - ${signature.personalInfo.firstName} ${signature.personalInfo.lastName}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          ${generateCSS()}
        </style>
      </head>
      <body>
        <div class="signature-preview">
          ${generateHTML()}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signature-${signature.signatureName || "email"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Valider si la signature est complète
  const validateSignature = () => {
    const errors = [];

    if (!signature.personalInfo.firstName) {
      errors.push("Le prénom est requis");
    }

    if (!signature.personalInfo.lastName) {
      errors.push("Le nom est requis");
    }

    if (!signature.personalInfo.email) {
      errors.push("L'email est requis");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    generateHTML,
    generateCSS,
    copyToClipboard,
    saveAndCopyToClipboard,
    downloadHTML,
    validateSignature,
  };
}
