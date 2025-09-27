"use client";

import React from "react";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import "@/src/styles/signature-text-selection.css";

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

const VerticalSignature = ({
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
    { key: "twitter", label: "Twitter/X" },
    { key: "github", label: "GitHub" },
    { key: "youtube", label: "YouTube" },
  ];

  // Fonction pour obtenir l'URL de l'icône avec le nouveau CDN R2
  const getSocialIconUrl = (platform) => {
    const baseUrl = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social";
    const color = signatureData.socialGlobalColor;
    
    // Construction de l'URL avec ou sans couleur
    const iconName = color ? `${platform}-${color}` : platform;
    return `${baseUrl}/${platform}/${iconName}.png`;
  };
  // Calcul des largeurs de colonnes dynamiques pour la signature verticale
  const photoColumnWidth = signatureData.columnWidths?.photo || 25;
  const contentColumnWidth = signatureData.columnWidths?.content || 75;
  const maxTableWidth = 500;
  const photoWidthPx = Math.round((photoColumnWidth / 100) * maxTableWidth);
  const contentWidthPx = Math.round((contentColumnWidth / 100) * maxTableWidth);

  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      border="0"
      style={{
        borderCollapse: "collapse",
        maxWidth: "500px",
        fontFamily: "Arial, sans-serif",
        width: "100%",
      }}
    >
      <tbody>
        <tr>
          {/* Colonne de gauche : Informations personnelles */}
          <td
            style={{
              width: `${photoWidthPx}px`,
              paddingRight: "15px",
              verticalAlign: "top",
            }}
          >
            <table
              cellPadding="0"
              cellSpacing="0"
              border="0"
              style={{ borderCollapse: "collapse", width: "100%" }}
            >
              <tbody>
                {/* Photo */}
                <tr>
                  <td
                    style={{
                      paddingBottom: `${spacings.photoBottom ?? 16}px`,
                      textAlign: signatureData.nameAlignment || "left",
                    }}
                  >
                    {signatureData.photo ? (
                      <div
                        style={{
                          width: `${signatureData.imageSize || 80}px`,
                          height: `${signatureData.imageSize || 80}px`,
                          borderRadius:
                            signatureData.imageShape === "square"
                              ? "8px"
                              : "50%",
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
                            signatureData.imageShape === "square"
                              ? "8px"
                              : "50%",
                        }}
                      />
                    )}
                  </td>
                </tr>

                {/* Prénom et Nom */}
                <tr>
                  <td
                    style={{
                      paddingBottom: `${spacings.nameBottom ?? 8}px`,
                      textAlign: signatureData.nameAlignment || "left",
                    }}
                  >
                    <div
                      style={{
                        fontSize: `${signatureData.typography?.fullName?.fontSize || signatureData.fontSize?.name || 16}px`,
                        fontWeight:
                          signatureData.typography?.fullName?.fontWeight ||
                          "bold",
                        fontStyle:
                          signatureData.typography?.fullName?.fontStyle ||
                          "normal",
                        textDecoration:
                          signatureData.typography?.fullName?.textDecoration ||
                          "none",
                        color:
                          signatureData.typography?.fullName?.color ||
                          signatureData.primaryColor ||
                          "#171717",
                        lineHeight: "1.2",
                        fontFamily:
                          signatureData.typography?.fullName?.fontFamily ||
                          signatureData.fontFamily ||
                          "Arial, sans-serif",
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
                        // className="!p-0 !m-0 !rounded-none inline-block w-auto"
                        style={{
                          width: "auto",
                          minWidth: "0",
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
                          fontStyle:
                            signatureData.typography?.fullName?.fontStyle ||
                            "normal",
                          textDecoration:
                            signatureData.typography?.fullName
                              ?.textDecoration || "none",
                        }}
                      />
                    </div>
                  </td>
                </tr>

                {/* Profession */}
                {signatureData.position && (
                  <tr>
                    <td
                      style={{
                        paddingBottom: `${spacings.positionBottom ?? 8}px`,
                        textAlign: signatureData.nameAlignment || "left",
                      }}
                    >
                      <div
                        style={{
                          fontSize: `${signatureData.typography?.position?.fontSize || signatureData.fontSize?.position || 14}px`,
                          color:
                            signatureData.typography?.position?.color ||
                            "#666666",
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
                      >
                        <InlineEdit
                          value={signatureData.position}
                          onChange={(value) =>
                            handleFieldChange("position", value)
                          }
                          placeholder="Votre poste"
                          displayClassName="border-0 shadow-none p-1 h-auto"
                          inputClassName="border-0 shadow-none p-1 h-auto"
                          style={{
                            color:
                              signatureData.typography?.position?.color ||
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
                      </div>
                    </td>
                  </tr>
                )}

                {/* Nom entreprise */}
                {signatureData.company && (
                  <tr>
                    <td
                      style={{
                        paddingBottom: `${spacings.companyBottom ?? 12}px`,
                        textAlign: signatureData.nameAlignment || "left",
                      }}
                    >
                      <div
                        style={{
                          fontSize: `${signatureData.typography?.company?.fontSize || 14}px`,
                          fontWeight:
                            signatureData.typography?.company?.fontWeight ||
                            "normal",
                          color:
                            signatureData.typography?.company?.color ||
                            signatureData.primaryColor ||
                            "#2563eb",
                          fontFamily:
                            signatureData.typography?.company?.fontFamily ||
                            signatureData.fontFamily ||
                            "Arial, sans-serif",
                        }}
                      >
                        <InlineEdit
                          value={signatureData.company}
                          onChange={(value) =>
                            handleFieldChange("company", value)
                          }
                          placeholder="Nom entreprise"
                          displayClassName="border-0 shadow-none p-1 h-auto"
                          inputClassName="border-0 shadow-none p-1 h-auto"
                          style={{
                            color:
                              signatureData.typography?.company?.color ||
                              signatureData.primaryColor ||
                              "#2563eb",
                            fontSize: `${signatureData.typography?.company?.fontSize || 14}px`,
                            fontFamily:
                              signatureData.typography?.company?.fontFamily ||
                              signatureData.fontFamily ||
                              "Arial, sans-serif",
                            fontWeight:
                              signatureData.typography?.company?.fontWeight ||
                              "normal",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>

          {/* Séparateur vertical - Gmail compatible */}
          {signatureData.separatorVerticalEnabled && (
            <td
              style={{
                width: "1px",
                backgroundColor:
                  signatureData.colors?.separatorVertical || "#e0e0e0",
                borderRadius: "0px",
                padding: "0",
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

          {/* Colonne de droite : Informations de contact */}
          <td
            style={{
              paddingLeft: "15px",
              verticalAlign: "top",
              width: `${contentWidthPx}px`,
            }}
          >
            <table
              cellPadding="0"
              cellSpacing="0"
              border="0"
              style={{ borderCollapse: "collapse", width: "100%" }}
            >
              <tbody>
                {/* Téléphone */}
                {signatureData.phone && (
                  <tr>
                    <td
                      style={{
                        paddingBottom: signatureData.mobile
                          ? `${spacings.phoneToMobile ?? 4}px`
                          : `${spacings.contactBottom ?? 6}px`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: `${signatureData.typography?.phone?.fontSize || signatureData.fontSize?.contact || 12}px`,
                          color:
                            signatureData.typography?.phone?.color ||
                            "rgb(102,102,102)",
                          fontFamily:
                            signatureData.typography?.phone?.fontFamily ||
                            signatureData.fontFamily ||
                            "Arial, sans-serif",
                        }}
                      >
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNtYXJ0cGhvbmUtaWNvbiBsdWNpZGUtc21hcnRwaG9uZSI+PHJlY3Qgd2lkdGg9IjE0IiBoZWlnaHQ9IjIwIiB4PSI1IiB5PSIyIiByeD0iMiIgcnk9IjIiLz48cGF0aCBkPSJNMTIgMThoLjAxIi8+PC9zdmc+"
                          alt="Téléphone"
                          width="14"
                          height="14"
                          style={{
                            width: "14px",
                            height: "14px",
                            marginRight: "8px",
                          }}
                        />
                        <InlineEdit
                          value={signatureData.phone}
                          onChange={(value) =>
                            handleFieldChange("phone", value)
                          }
                          placeholder="Téléphone fixe"
                          validation={validatePhone}
                          displayClassName="border-0 shadow-none p-1 h-auto"
                          inputClassName="border-0 shadow-none p-1 h-auto"
                          style={{
                            color:
                              signatureData.typography?.phone?.color ||
                              "rgb(102,102,102)",
                            fontSize: `${signatureData.typography?.phone?.fontSize || signatureData.fontSize?.contact || 12}px`,
                            fontFamily:
                              signatureData.typography?.phone?.fontFamily ||
                              signatureData.fontFamily ||
                              "Arial, sans-serif",
                            fontWeight:
                              signatureData.typography?.phone?.fontWeight ||
                              "normal",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )}

                {/* Mobile */}
                {signatureData.mobile && (
                  <tr>
                    <td
                      style={{
                        paddingBottom: signatureData.email
                          ? `${spacings.mobileToEmail ?? 4}px`
                          : `${spacings.contactBottom ?? 6}px`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: `${signatureData.typography?.mobile?.fontSize || signatureData.fontSize?.contact || 12}px`,
                          color:
                            signatureData.typography?.mobile?.color ||
                            "rgb(102,102,102)",
                          fontFamily:
                            signatureData.typography?.mobile?.fontFamily ||
                            signatureData.fontFamily ||
                            "Arial, sans-serif",
                        }}
                      >
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXBob25lLWljb24gbHVjaWRlLXBob25lIj48cGF0aCBkPSJNMTMuODMyIDE2LjU2OGExIDEgMCAwIDAgMS4yMTMtLjMwM2wuMzU1LS40NjVBMiAyIDAgMCAxIDE3IDE1aDNhMiAyIDAgMCAxIDIgMnYzYTIgMiAwIDAgMS0yIDJBMTggMTggMCAwIDEgMiA0YTIgMiAwIDAgMSAyLTJoM2EyIDIgMCAwIDEgMiAydjNhMiAyIDAgMCAxLS44IDEuNmwtLjQ2OC4zNTFhMSAxIDAgMCAwLS4yOTIgMS4yMzMgMTQgMTQgMCAwIDAgNi4zOTIgNi4zODQiLz48L3N2Zz4="
                          alt="Mobile"
                          width="14"
                          height="14"
                          style={{
                            width: "14px",
                            height: "14px",
                            marginRight: "8px",
                          }}
                        />
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
                              "rgb(102,102,102)",
                            fontSize: `${signatureData.typography?.mobile?.fontSize || signatureData.fontSize?.contact || 12}px`,
                            fontFamily:
                              signatureData.typography?.mobile?.fontFamily ||
                              signatureData.fontFamily ||
                              "Arial, sans-serif",
                            fontWeight:
                              signatureData.typography?.mobile?.fontWeight ||
                              "normal",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )}

                {/* Email */}
                {signatureData.email && (
                  <tr>
                    <td
                      style={{
                        paddingBottom: signatureData.website
                          ? `${spacings.emailToWebsite ?? 4}px`
                          : `${spacings.contactBottom ?? 6}px`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: `${signatureData.typography?.email?.fontSize || signatureData.fontSize?.contact || 12}px`,
                          color:
                            signatureData.typography?.email?.color ||
                            "rgb(102,102,102)",
                          fontFamily:
                            signatureData.typography?.email?.fontFamily ||
                            signatureData.fontFamily ||
                            "Arial, sans-serif",
                        }}
                      >
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLW1haWwtaWNvbiBsdWNpZGUtbWFpbCI+PHBhdGggZD0ibTIyIDctOC45OTEgNS43MjdhMiAyIDAgMCAxLTIuMDA5IDBMMiA3Ii8+PHJlY3QgeD0iMiIgeT0iNCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE2IiByeD0iMiIvPjwvc3ZnPg=="
                          alt="Email"
                          width="14"
                          height="14"
                          style={{
                            width: "14px",
                            height: "14px",
                            marginRight: "8px",
                          }}
                        />
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
                              "rgb(102,102,102)",
                            fontSize: `${signatureData.typography?.email?.fontSize || signatureData.fontSize?.contact || 12}px`,
                            fontFamily:
                              signatureData.typography?.email?.fontFamily ||
                              signatureData.fontFamily ||
                              "Arial, sans-serif",
                            fontWeight:
                              signatureData.typography?.email?.fontWeight ||
                              "normal",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )}

                {/* Site web */}
                {signatureData.website && (
                  <tr>
                    <td
                      style={{
                        paddingBottom: signatureData.address
                          ? `${spacings.websiteToAddress ?? 4}px`
                          : `${spacings.contactBottom ?? 6}px`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: `${signatureData.typography?.website?.fontSize || signatureData.fontSize?.contact || 12}px`,
                          color:
                            signatureData.typography?.website?.color ||
                            "rgb(102,102,102)",
                          fontFamily:
                            signatureData.typography?.website?.fontFamily ||
                            signatureData.fontFamily ||
                            "Arial, sans-serif",
                        }}
                      >
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdsb2JlLWljb24gbHVjaWRlLWdsb2JlIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiAyYTE0LjUgMTQuNSAwIDAgMCAwIDIwIDE0LjUgMTQuNSAwIDAgMCAwLTIwIi8+PHBhdGggZD0iTTIgMTJoMjAiLz48L3N2Zz4="
                          alt="Site web"
                          width="14"
                          height="14"
                          style={{
                            width: "14px",
                            height: "14px",
                            marginRight: "8px",
                          }}
                        />
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
                              "rgb(102,102,102)",
                            fontSize: `${signatureData.typography?.website?.fontSize || signatureData.fontSize?.contact || 12}px`,
                            fontFamily:
                              signatureData.typography?.website?.fontFamily ||
                              signatureData.fontFamily ||
                              "Arial, sans-serif",
                            fontWeight:
                              signatureData.typography?.website?.fontWeight ||
                              "normal",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )}

                {/* Adresse */}
                {signatureData.address && (
                  <tr>
                    <td
                      style={{
                        paddingBottom: `${spacings.addressBottom ?? spacings.websiteToAddress ?? 12}px`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          fontSize: `${signatureData.typography?.address?.fontSize || signatureData.fontSize?.contact || 12}px`,
                          color:
                            signatureData.typography?.address?.color ||
                            "rgb(102,102,102)",
                          fontFamily:
                            signatureData.typography?.address?.fontFamily ||
                            signatureData.fontFamily ||
                            "Arial, sans-serif",
                        }}
                      >
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLW1hcC1waW4taWNvbiBsdWNpZGUtbWFwLXBpbiI+PHBhdGggZD0iTTIwIDEwYzAgNC45OTMtNS41MzkgMTAuMTkzLTcuMzk5IDExLjc5OWExIDEgMCAwIDEtMS4yMDIgMEM5LjUzOSAyMC4xOTMgNCAxNC45OTMgNCAxMGE4IDggMCAwIDEgMTYgMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiLz48L3N2Zz4="
                          alt="Adresse"
                          width="14"
                          height="14"
                          style={{
                            width: "14px",
                            height: "14px",
                            marginRight: "8px",
                            marginTop: "1px",
                          }}
                        />
                        <InlineEdit
                          value={signatureData.address}
                          onChange={(value) =>
                            handleFieldChange("address", value)
                          }
                          placeholder="Adresse complète"
                          multiline={true}
                          displayClassName="border-0 shadow-none p-1 min-h-[2rem] resize-none"
                          inputClassName="border-0 shadow-none p-1 min-h-[2rem] resize-none"
                          style={{
                            color:
                              signatureData.typography?.address?.color ||
                              "rgb(102,102,102)",
                            fontSize: `${signatureData.typography?.address?.fontSize || signatureData.fontSize?.contact || 12}px`,
                            fontFamily:
                              signatureData.typography?.address?.fontFamily ||
                              signatureData.fontFamily ||
                              "Arial, sans-serif",
                            fontWeight:
                              signatureData.typography?.address?.fontWeight ||
                              "normal",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )}

                {/* Séparateur horizontal - après tous les contacts */}
                <tr>
                  <td
                    style={{
                      paddingTop: `${spacings.separatorTop ?? 12}px`,
                      paddingBottom: `${spacings.separatorBottom ?? 12}px`,
                    }}
                  >
                    {signatureData.separatorHorizontalEnabled && (
                      <hr
                        style={{
                          border: "none",
                          borderTop: `${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}`,
                          borderRadius: "0px",
                          margin: "0",
                          width: "100%",
                        }}
                      />
                    )}
                  </td>
                </tr>

                {/* Logo entreprise après le séparateur */}
                <tr>
                  <td
                    style={{
                      paddingTop: `${spacings.logoTop ?? 15}px`,
                      paddingBottom: `${spacings.logoBottom ?? 15}px`,
                      textAlign: "center",
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
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) =>
                                handleImageChange("logo", e.target.result);
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        title="Cliquer pour changer le logo"
                      />
                    ) : (
                      <ImageDropZone
                        currentImage={signatureData.logo}
                        onImageChange={(imageUrl) =>
                          handleImageChange("logo", imageUrl)
                        }
                        placeholder="Logo entreprise"
                        size="sm"
                        type="logo"
                        style={{
                          width: `${signatureData.logoSize || 60}px`,
                          height: `${signatureData.logoSize || 60}px`,
                        }}
                      />
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        {/* Logos sociaux - Toujours affichés */}
        {true && (
          <tr>
            <td
              style={{
                paddingTop: `${signatureData.spacings?.logoToSocial ?? 15}px`,
                textAlign: "left",
              }}
            >
              <table
                cellPadding="0"
                cellSpacing="0"
                border="0"
                style={{ 
                  borderCollapse: "collapse",
                  width: "auto",
                  minWidth: "fit-content"
                }}
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
                            minWidth: `${(signatureData.socialSize || 40) + (signatureData.socialBackground?.enabled ? 12 : 0)}px`,
                            minHeight: `${(signatureData.socialSize || 40) + (signatureData.socialBackground?.enabled ? 12 : 0)}px`,
                          }}
                          title={`Cliquez pour configurer ${social.label}`}
                        >
                          <img
                            src={getSocialIconUrl(social.key)}
                            alt={social.label}
                            width={signatureData.socialSize || 40}
                            height={signatureData.socialSize || 40}
                            style={{
                              display: "block",
                              opacity: signatureData.socialNetworks?.[
                                social.key
                              ]
                                ? 1
                                : 0.9,
                              minWidth: `${signatureData.socialSize || 40}px`,
                              minHeight: `${signatureData.socialSize || 40}px`,
                              maxWidth: "none",
                              maxHeight: "none",
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

export default VerticalSignature;
