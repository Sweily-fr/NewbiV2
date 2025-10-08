"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import DynamicSocialLogo from "./DynamicSocialLogo";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";
import { getTypographyStyles } from "../utils/typography-styles";
import "@/src/styles/signature-text-selection.css";
import "./signature-preview.css";

// Fonction utilitaire pour convertir hex en HSL et calculer la rotation de teinte
const hexToHsl = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
};

const getColorFilter = (targetColor) => {
  if (!targetColor || targetColor === "transparent") return "none";

  // Normaliser la couleur cible
  const normalizedColor = targetColor.toLowerCase();

  // Pour une approche plus simple et efficace, utiliser directement la couleur
  // Convertir la couleur en filtre CSS compatible
  const rgb = hexToRgb(targetColor);
  if (!rgb) return "none";

  // Calculer les filtres pour approximer la couleur cible
  const brightness = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
  const [hue, saturation] = hexToHsl(targetColor);

  return `brightness(0) saturate(100%) invert(${brightness > 0.5 ? 0 : 1}) sepia(1) saturate(5) hue-rotate(${hue}deg) brightness(${brightness + 0.5}) contrast(1.2)`;
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const HorizontalSignature = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  validatePhone,
  validateEmail,
  validateUrl,
  logoSrc,
}) => {
  // Utilisation directe des espacements de signatureData
  const spacings = signatureData.spacings ?? {};

  // Liste des réseaux sociaux disponibles
  const availableSocialNetworks = [
    { key: "linkedin", label: "LinkedIn" },
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "x", label: "X (Twitter)" },
    { key: "youtube", label: "YouTube" },
    { key: "github", label: "GitHub" },
  ];

  // Fonction pour obtenir l'URL de l'icône avec le nouveau CDN R2
  const getSocialIconUrl = (platform) => {
    // Utiliser l'icône personnalisée si disponible
    if (signatureData.customSocialIcons?.[platform]) {
      return signatureData.customSocialIcons[platform];
    }

    const baseUrl =
      "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social";
    
    // Mapping des couleurs hex/RGB vers noms de couleurs
    const colorMapping = {
      '#1877F2': 'blue',
      '#E4405F': 'pink',
      '#0077B5': 'blue',
      '#000000': 'black',
      '#333333': 'black',
      '#FF0000': 'red',
      'rgb(24, 119, 242)': 'blue',
      'rgb(228, 64, 95)': 'pink',
      'rgb(0, 119, 181)': 'blue',
      'rgb(0, 0, 0)': 'black',
      'rgb(51, 51, 51)': 'black',
      'rgb(255, 0, 0)': 'red',
    };
    
    // Couleurs par défaut pour chaque réseau social
    const defaultColors = {
      linkedin: 'blue',
      facebook: 'blue',
      instagram: 'pink',
      x: 'black',
      twitter: 'black',
      github: 'black',
      youtube: 'red'
    };
    
    // PRIORITÉ : socialGlobalColor > socialColors > couleur par défaut
    // Si une couleur globale est définie, elle a la priorité absolue
    let color = signatureData.socialGlobalColor || 
                signatureData.socialColors?.[platform];
    
    // Convertir les couleurs hex/RGB en noms de couleurs
    if (color && colorMapping[color]) {
      color = colorMapping[color];
    }
    
    // Si pas de couleur, utiliser la couleur par défaut
    if (!color) {
      color = defaultColors[platform];
    }
    
    // Construction de l'URL avec couleur
    // Utiliser "twitter" au lieu de "x" pour les URLs
    const platformName = platform === 'x' ? 'twitter' : platform;
    const iconName = color ? `${platformName}-${color}` : platformName;
    return `${baseUrl}/${platformName}/${iconName}.png`;
  };

  return (
    <table
      cellSpacing="0"
      border="0"
      style={{
        borderCollapse: "collapse",
        maxWidth: "500px",
        fontFamily: "Arial, sans-serif",
        margin: "0",
      }}
      className="signature-preview"
    >
    <tbody>
        <tr>
          {/* Photo de profil à gauche */}
          <td
            style={{
              width: `${signatureData.imageSize || 80}px`,
              verticalAlign: "top",
            }}
          >
            {signatureData.photo ? (
              <div
                style={{
                  width: `${signatureData.imageSize || 80}px`,
                  height: `${signatureData.imageSize || 80}px`,
                  borderRadius:
                    signatureData.imageShape === "square" ? "8px" : "50%",
                  backgroundImage: `url('${signatureData.photo}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  display: "block",
                  cursor: "pointer",
                }}
                onClick={() => {
                  // Créer un input file invisible pour changer l'image
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) =>
                        handleImageChange("photo", e.target.result);
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
                title="Cliquer pour changer la photo"
              />
            ) : (
              <ImageDropZone
                currentImage={signatureData.photo}
                onImageChange={(imageUrl) =>
                  handleImageChange("photo", imageUrl)
                }
                placeholder="Photo de profil"
                size="md"
                type="profile"
                style={{
                  width: `${signatureData.imageSize || 80}px`,
                  height: `${signatureData.imageSize || 80}px`,
                  borderRadius:
                    signatureData.imageShape === "square" ? "8px" : "50%",
                }}
              />
            )}
          </td>

          {/* Espacement avant séparateur vertical */}
          {signatureData.separatorVerticalEnabled && (
            <td
              style={{
                width: `${signatureData.spacings?.verticalSeparatorLeft ?? 8}px`,
              }}
            >
              &nbsp;
            </td>
          )}

          {/* Séparateur vertical si activé */}
          {signatureData.separatorVerticalEnabled && (
            <td
              style={{
                width: "1px",
                backgroundColor:
                  signatureData.colors?.separatorVertical || "#e0e0e0",
                borderRadius: "0px",
                padding: "0px",
                fontSize: "1px",
                lineHeight: "1px",
                verticalAlign: "top",
                height: "100%",
                minHeight: "200px",
              }}
            >
              &nbsp;
            </td>
          )}

          {/* Espacement après séparateur vertical */}
          {signatureData.separatorVerticalEnabled && (
            <td
              style={{
                width: `${signatureData.spacings?.verticalSeparatorRight ?? 8}px`,
              }}
            >
              &nbsp;
            </td>
          )}

          {/* Informations empilées verticalement à droite */}
          <td
            style={{
              verticalAlign: "top",
              paddingLeft: `${signatureData.spacings?.nameSpacing ?? 12}px`,
            }}
          >
            <table
              cellPadding="0"
              cellSpacing="0"
              border="0"
              style={{
                borderCollapse: "collapse",
                tableLayout: "auto",
                width: "auto",
              }}
            >
              <tbody>
                {/* Nom complet unifié */}
                <tr>
                  <td
                    colSpan="2"
                    style={{
                      textAlign: signatureData.nameAlignment || "left",
                      paddingBottom: `${signatureData.spacings?.nameBottom ?? 2}px`,
                    }}
                  >
                    <div
                      style={{
                        ...getTypographyStyles(signatureData.typography?.fullName, {
                          fontFamily: signatureData.fontFamily || "Arial, sans-serif",
                          fontSize: signatureData.fontSize?.name || 16,
                          fontWeight: "bold",
                          color: signatureData.primaryColor || "#171717",
                        }),
                        lineHeight: "1.2",
                      }}
                    >
                      <InlineEdit
                        value={signatureData.fullName}
                        onChange={(value) =>
                          handleFieldChange("fullName", value)
                        }
                        placeholder="Nom complet"
                        displayClassName="border-0 shadow-none p-1 h-auto"
                        inputClassName="border-0 shadow-none p-1 h-auto"
                        style={{
                          width: "auto",
                          minWidth: "0",
                          height: "1em",
                          lineHeight: "1em",
                          fontSize: `${signatureData.typography?.fullName?.fontSize || signatureData.fontSize?.name || 16}px`,
                          color:
                            signatureData.typography?.fullName?.color ||
                            signatureData.primaryColor ||
                            "#171717",
                          fontFamily:
                            signatureData.typography?.fullName?.fontFamily ||
                            signatureData.fontFamily ||
                            "Arial, sans-serif",
                          fontWeight:
                            signatureData.typography?.fullName?.fontWeight ||
                            "normal",
                        }}
                      />
                    </div>
                  </td>
                </tr>

                {/* Titre sur toute la largeur */}
                {signatureData.position && (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        ...getTypographyStyles(signatureData.typography?.position, {
                          fontFamily: signatureData.fontFamily || "Arial, sans-serif",
                          fontSize: signatureData.fontSize?.position || 14,
                          color: signatureData.colors?.position || "#666666",
                        }),
                        paddingTop: "2px",
                        paddingBottom: `${signatureData.spacings?.positionBottom ?? 4}px`,
                      }}
                    >
                      <InlineEdit
                        value={signatureData.position}
                        onChange={(value) =>
                          handleFieldChange("position", value)
                        }
                        placeholder="Votre poste"
                        displayClassName="text-sm"
                        inputClassName="text-sm border-0 shadow-none p-1 h-auto"
                        style={{
                          color:
                            signatureData.typography?.position?.color ||
                            signatureData.colors?.position ||
                            "#666666",
                          fontSize: `${signatureData.typography?.position?.fontSize || signatureData.fontSize?.position || 14}px`,
                          fontFamily:
                            signatureData.typography?.position?.fontFamily ||
                            signatureData.fontFamily ||
                            "Arial, sans-serif",
                          fontWeight:
                            signatureData.typography?.position?.fontWeight ||
                            "normal",
                          fontStyle:
                            signatureData.typography?.position?.fontStyle ||
                            "normal",
                          textDecoration:
                            signatureData.typography?.position
                              ?.textDecoration || "none",
                        }}
                      />
                    </td>
                  </tr>
                )}

                {/* Entreprise */}
                {signatureData.company && (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        ...getTypographyStyles(signatureData.typography?.company, {
                          fontFamily: signatureData.fontFamily || "Arial, sans-serif",
                          fontSize: signatureData.fontSize?.company || 14,
                          color: signatureData.colors?.company || "#2563eb",
                        }),
                        paddingTop: "2px",
                        paddingBottom: `${signatureData.spacings?.companyBottom ?? 8}px`,
                      }}
                    >
                      <InlineEdit
                        value={signatureData.company}
                        onChange={(value) =>
                          handleFieldChange("company", value)
                        }
                        placeholder="Nom de l'entreprise"
                        displayClassName="text-sm"
                        inputClassName="text-sm border-0 shadow-none p-1 h-auto"
                        style={{
                          color:
                            signatureData.typography?.company?.color ||
                            signatureData.colors?.company ||
                            "#2563eb",
                          fontSize: `${signatureData.typography?.company?.fontSize || signatureData.fontSize?.company || 14}px`,
                          fontFamily:
                            signatureData.typography?.company?.fontFamily ||
                            signatureData.fontFamily ||
                            "Arial, sans-serif",
                          fontWeight:
                            signatureData.typography?.company?.fontWeight ||
                            "normal",
                          fontStyle:
                            signatureData.typography?.company?.fontStyle ||
                            "normal",
                          textDecoration:
                            signatureData.typography?.company?.textDecoration ||
                            "none",
                        }}
                      />
                    </td>
                  </tr>
                )}

                {/* Informations de contact avec icônes images */}
                {signatureData.phone && (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        paddingTop: "4px",
                        paddingBottom: `${signatureData.spacings?.phoneToMobile ?? 4}px`,
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
                            <td
                              style={{
                                paddingRight: "10px",
                                verticalAlign: "middle",
                                width: "20px",
                              }}
                            >
                              <img
                                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNtYXJ0cGhvbmUtaWNvbiBsdWNpZGUtc21hcnRwaG9uZSI+PHJlY3Qgd2lkdGg9IjE0IiBoZWlnaHQ9IjIwIiB4PSI1IiB5PSIyIiByeD0iMiIgcnk9IjIiLz48cGF0aCBkPSJNMTIgMThoLjAxIi8+PC9zdmc+"
                                alt="Téléphone"
                                width="14"
                                height="14"
                                style={{
                                  width: "14px !important",
                                  height: "14px !important",
                                  display: "block",
                                  minWidth: "14px",
                                }}
                              />
                            </td>
                            <td
                              style={{
                                ...getTypographyStyles(signatureData.typography?.phone, {
                                  fontFamily: signatureData.fontFamily || "Arial, sans-serif",
                                  fontSize: signatureData.fontSize?.contact || 12,
                                  color: signatureData.colors?.contact || "rgb(102,102,102)",
                                }),
                                verticalAlign: "middle",
                              }}
                            >
                              <InlineEdit
                                value={signatureData.phone}
                                onChange={(value) =>
                                  handleFieldChange("phone", value)
                                }
                                placeholder="Numéro de téléphone"
                                validation={validatePhone}
                                displayClassName="border-0 shadow-none p-1 h-auto"
                                inputClassName="border-0 shadow-none p-1 h-auto"
                                style={{
                                  color:
                                    signatureData.typography?.phone?.color ||
                                    signatureData.colors?.contact ||
                                    "rgb(102,102,102)",
                                  fontSize: `${signatureData.typography?.phone?.fontSize || signatureData.fontSize?.contact || 12}px`,
                                  fontFamily:
                                    signatureData.typography?.phone
                                      ?.fontFamily ||
                                    signatureData.fontFamily ||
                                    "Arial, sans-serif",
                                  fontWeight:
                                    signatureData.typography?.phone
                                      ?.fontWeight || "normal",
                                  fontStyle:
                                    signatureData.typography?.phone
                                      ?.fontStyle || "normal",
                                  textDecoration:
                                    signatureData.typography?.phone
                                      ?.textDecoration || "none",
                                }}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}

                {signatureData.mobile && (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        paddingTop: "4px",
                        paddingBottom: `${signatureData.spacings?.mobileToEmail ?? 4}px`,
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
                            <td
                              style={{
                                paddingRight: "10px",
                                verticalAlign: "middle",
                                width: "20px",
                              }}
                            >
                              <img
                                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXBob25lLWljb24gbHVjaWRlLXBob25lIj48cGF0aCBkPSJNMTMuODMyIDE2LjU2OGExIDEgMCAwIDAgMS4yMTMtLjMwM2wuMzU1LS40NjVBMiAyIDAgMCAxIDE3IDE1aDNhMiAyIDAgMCAxIDIgMnYzYTIgMiAwIDAgMS0yIDJBMTggMTggMCAwIDEgMiA0YTIgMiAwIDAgMSAyLTJoM2EyIDIgMCAwIDEgMiAydjNhMiAyIDAgMCAxLS44IDEuNmwtLjQ2OC4zNTFhMSAxIDAgMCAwLS4yOTIgMS4yMzMgMTQgMTQgMCAwIDAgNi4zOTIgNi4zODQiLz48L3N2Zz4="
                                alt="Mobile"
                                width="14"
                                height="14"
                                style={{
                                  width: "14px !important",
                                  height: "14px !important",
                                  display: "block",
                                  minWidth: "14px",
                                }}
                              />
                            </td>
                            <td
                              style={{
                                ...getTypographyStyles(signatureData.typography?.mobile, {
                                  fontFamily: signatureData.fontFamily || "Arial, sans-serif",
                                  fontSize: signatureData.fontSize?.contact || 12,
                                  color: signatureData.colors?.contact || "rgb(102,102,102)",
                                }),
                                verticalAlign: "middle",
                              }}
                            >
                              <InlineEdit
                                value={signatureData.mobile}
                                onChange={(value) =>
                                  handleFieldChange("mobile", value)
                                }
                                placeholder="Téléphone mobile"
                                validation={validatePhone}
                                displayClassName="border-0 shadow-none p-1 h-auto"
                                inputClassName="border-0 shadow-none p-1 h-auto"
                                style={{
                                  color:
                                    signatureData.typography?.mobile?.color ||
                                    signatureData.colors?.contact ||
                                    "rgb(102,102,102)",
                                  fontSize: `${signatureData.typography?.mobile?.fontSize || signatureData.fontSize?.contact || 12}px`,
                                  fontFamily:
                                    signatureData.typography?.mobile
                                      ?.fontFamily ||
                                    signatureData.fontFamily ||
                                    "Arial, sans-serif",
                                  fontWeight:
                                    signatureData.typography?.mobile
                                      ?.fontWeight || "normal",
                                  fontStyle:
                                    signatureData.typography?.mobile
                                      ?.fontStyle || "normal",
                                  textDecoration:
                                    signatureData.typography?.mobile
                                      ?.textDecoration || "none",
                                }}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}

                {signatureData.email && (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        paddingTop: "4px",
                        paddingBottom: `${signatureData.spacings?.emailToWebsite ?? 4}px`,
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
                            <td
                              style={{
                                paddingRight: "10px",
                                verticalAlign: "middle",
                                width: "20px",
                              }}
                            >
                              <img
                                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLW1haWwtaWNvbiBsdWNpZGUtbWFpbCI+PHBhdGggZD0ibTIyIDctOC45OTEgNS43MjdhMiAyIDAgMCAxLTIuMDA5IDBMMiA3Ii8+PHJlY3QgeD0iMiIgeT0iNCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE2IiByeD0iMiIvPjwvc3ZnPg=="
                                alt="Email"
                                width="14"
                                height="14"
                                style={{
                                  width: "14px !important",
                                  height: "14px !important",
                                  display: "block",
                                  minWidth: "14px",
                                }}
                              />
                            </td>
                            <td
                              style={{
                                ...getTypographyStyles(signatureData.typography?.email, {
                                  fontFamily: signatureData.fontFamily || "Arial, sans-serif",
                                  fontSize: signatureData.fontSize?.contact || 12,
                                  color: signatureData.colors?.contact || "rgb(102,102,102)",
                                }),
                                verticalAlign: "middle",
                              }}
                            >
                              <InlineEdit
                                value={signatureData.email}
                                onChange={(value) =>
                                  handleFieldChange("email", value)
                                }
                                placeholder="adresse@email.com"
                                validation={validateEmail}
                                displayClassName="border-0 shadow-none p-1 h-auto"
                                inputClassName="border-0 shadow-none p-1 h-auto"
                                style={{
                                  color:
                                    signatureData.typography?.email?.color ||
                                    signatureData.colors?.contact ||
                                    "rgb(102,102,102)",
                                  fontSize: `${signatureData.typography?.email?.fontSize || signatureData.fontSize?.contact || 12}px`,
                                  fontFamily:
                                    signatureData.typography?.email
                                      ?.fontFamily ||
                                    signatureData.fontFamily ||
                                    "Arial, sans-serif",
                                  fontWeight:
                                    signatureData.typography?.email
                                      ?.fontWeight || "normal",
                                  fontStyle:
                                    signatureData.typography?.email
                                      ?.fontStyle || "normal",
                                  textDecoration:
                                    signatureData.typography?.email
                                      ?.textDecoration || "none",
                                }}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}

                {signatureData.website && (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        paddingTop: "4px",
                        paddingBottom: `${signatureData.spacings?.websiteToAddress ?? 4}px`,
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
                            <td
                              style={{
                                paddingRight: "10px",
                                verticalAlign: "middle",
                                width: "20px",
                              }}
                            >
                              <img
                                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdsb2JlLWljb24gbHVjaWRlLWdsb2JlIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiAyYTE0LjUgMTQuNSAwIDAgMCAwIDIwIDE0LjUgMTQuNSAwIDAgMCAwLTIwIi8+PHBhdGggZD0iTTIgMTJoMjAiLz48L3N2Zz4="
                                alt="Site web"
                                width="14"
                                height="14"
                                style={{
                                  width: "14px !important",
                                  height: "14px !important",
                                  display: "block",
                                  minWidth: "14px",
                                }}
                              />
                            </td>
                            <td
                              style={{
                                ...getTypographyStyles(signatureData.typography?.website, {
                                  fontFamily: signatureData.fontFamily || "Arial, sans-serif",
                                  fontSize: signatureData.fontSize?.contact || 12,
                                  color: signatureData.colors?.contact || "rgb(102,102,102)",
                                }),
                                verticalAlign: "middle",
                              }}
                            >
                              <InlineEdit
                                value={signatureData.website}
                                onChange={(value) =>
                                  handleFieldChange("website", value)
                                }
                                placeholder="www.monsite.com"
                                validation={validateUrl}
                                displayClassName="border-0 shadow-none p-1 h-auto"
                                inputClassName="border-0 shadow-none p-1 h-auto"
                                style={{
                                  color:
                                    signatureData.typography?.website?.color ||
                                    signatureData.colors?.contact ||
                                    "rgb(102,102,102)",
                                  fontSize: `${signatureData.typography?.website?.fontSize || signatureData.fontSize?.contact || 12}px`,
                                  fontFamily:
                                    signatureData.typography?.website
                                      ?.fontFamily ||
                                    signatureData.fontFamily ||
                                    "Arial, sans-serif",
                                  fontWeight:
                                    signatureData.typography?.website
                                      ?.fontWeight || "normal",
                                  fontStyle:
                                    signatureData.typography?.website
                                      ?.fontStyle || "normal",
                                  textDecoration:
                                    signatureData.typography?.website
                                      ?.textDecoration || "none",
                                }}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}

                {signatureData.address && (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        paddingTop: "4px",
                        paddingBottom: `${signatureData.spacings?.contactBottom ?? 8}px`,
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
                            <td
                              style={{
                                paddingRight: "10px",
                                verticalAlign: "top",
                                width: "20px",
                              }}
                            >
                              <img
                                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLW1hcC1waW4taWNvbiBsdWNpZGUtbWFwLXBpbiI+PHBhdGggZD0iTTIwIDEwYzAgNC45OTMtNS41MzkgMTAuMTkzLTcuMzk5IDExLjc5OWExIDEgMCAwIDEtMS4yMDIgMEM5LjUzOSAyMC4xOTMgNCAxNC45OTMgNCAxMGE4IDggMCAwIDEgMTYgMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiLz48L3N2Zz4="
                                alt="Adresse"
                                width="14"
                                height="14"
                                style={{
                                  width: "14px !important",
                                  height: "14px !important",
                                  display: "block",
                                  marginTop: "2px",
                                  minWidth: "14px",
                                }}
                              />
                            </td>
                            <td
                              style={{
                                ...getTypographyStyles(signatureData.typography?.address, {
                                  fontFamily: signatureData.fontFamily || "Arial, sans-serif",
                                  fontSize: signatureData.fontSize?.contact || 12,
                                  color: signatureData.colors?.contact || "rgb(102,102,102)",
                                }),
                                verticalAlign: "top",
                              }}
                            >
                              <InlineEdit
                                value={signatureData.address}
                                onChange={(value) =>
                                  handleFieldChange("address", value)
                                }
                                placeholder="Adresse complète"
                                multiline={true}
                                displayClassName="border-0 shadow-none p-1 min-h-[2rem] resize-none"
                                inputClassName="border-0 shadow-none p-1 min-h-[2rem] resize-none"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>

        {/* Séparateur horizontal */}
        {signatureData.separatorHorizontalEnabled && (
          <tr>
            <td
              colSpan={signatureData.separatorVerticalEnabled ? "5" : "2"}
              style={{
                paddingTop: `${signatureData.spacings?.separatorTop ?? 8}px`,
                paddingBottom: `${signatureData.spacings?.separatorBottom ?? 8}px`,
              }}
            >
              <hr
                style={{
                  border: "none",
                  borderTop: `${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}`,
                  borderRadius: "0px",
                  margin: "0",
                  width: "100%",
                }}
              />
            </td>
          </tr>
        )}

        {/* Logo entreprise en bas à gauche */}
        <tr>
          <td
            style={{
              textAlign: "left",
              verticalAlign: "top",
            }}
          >
            {logoSrc ? (
              <img
                src={logoSrc}
                alt="Logo entreprise"
                style={{
                  width: `${signatureData.logoSize || 60}px`,
                  height: "auto",
                  maxHeight: `${signatureData.logoSize || 60}px`,
                  objectFit: "contain",
                  cursor: "default",
                }}
              />
            ) : (
              <div
                style={{
                  width: `${signatureData.logoSize || 60}px`,
                  height: `${signatureData.logoSize || 60}px`,
                  border: "1px dashed #e5e7eb",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: "10px",
                  userSelect: "none",
                  margin: "0",
                }}
                aria-label="Logo entreprise (upload désactivé)"
                title="Upload de logo désactivé"
              >
                Logo
              </div>
            )}
          </td>
          <td style={{ textAlign: "right", verticalAlign: "top" }}>
            {/* Espace pour équilibrer la mise en page */}
          </td>
        </tr>

        {/* Logos sociaux - Toujours affichés */}
        {true && (
          <tr>
            <td
              colSpan={signatureData.separatorVerticalEnabled ? "5" : "2"}
              style={{
                paddingTop: `${signatureData.spacings?.logoToSocial ?? 15}px`,
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
                    {availableSocialNetworks
                      .filter(social => signatureData.socialNetworks?.hasOwnProperty(social.key))
                      .map((social, index) => (
                      <td
                        key={social.key}
                        style={{
                          paddingRight:
                            index < availableSocialNetworks.filter(s => signatureData.socialNetworks?.hasOwnProperty(s.key)).length - 1
                              ? "8px"
                              : "0",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-block",
                            backgroundColor: signatureData.socialBackground
                              ?.enabled
                              ? signatureData.socialBackground?.color ||
                                "#f3f4f6"
                              : "transparent",
                            borderRadius:
                              signatureData.socialBackground?.enabled &&
                              signatureData.socialBackground?.shape === "round"
                                ? "50%"
                                : "4px",
                            padding: signatureData.socialBackground?.enabled
                              ? "6px"
                              : "0",
                            cursor: "pointer",
                            position: "relative",
                          }}
                          title={`Cliquez pour configurer ${social.label}`}
                        >
                          <img
                            src={getSocialIconUrl(social.key)}
                            alt={social.label}
                            width={signatureData.socialSize || 32}
                            height={signatureData.socialSize || 32}
                            style={{
                              display: "block",
                              opacity: signatureData.socialNetworks?.[
                                social.key
                              ]
                                ? 1
                                : 0.9,
                            }}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default HorizontalSignature;
