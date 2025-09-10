"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import DynamicSocialLogo from "./DynamicSocialLogo";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";
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

const HorizontalSignature = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  validatePhone,
  validateEmail,
  validateUrl,
  logoSrc,
}) => {
  // Debug pour vérifier la valeur du séparateur vertical
  console.log(
    "HorizontalSignature - separators?.vertical?.width:",
    signatureData.separators?.vertical?.width
  );

  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      border="0"
      style={{
        borderCollapse: "collapse",
        maxWidth: "500px",
        fontFamily: "Arial, sans-serif",
      }}
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
          {signatureData.separators?.vertical?.enabled && (
            <td
              style={{
                width: `${signatureData.spacings?.verticalSeparatorLeft || 8}px`,
              }}
            >
              &nbsp;
            </td>
          )}

          {/* Séparateur vertical si activé */}
          {signatureData.separators?.vertical?.enabled && (
            <td
              style={{
                width: `${signatureData.separators?.vertical?.width !== undefined ? signatureData.separators.vertical.width : 1}px`,
                backgroundColor:
                  signatureData.separators?.vertical?.color || "#e0e0e0",
                borderRadius: `${signatureData.separators?.vertical?.radius || 0}px`,
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
          {signatureData.separators?.vertical?.enabled && (
            <td
              style={{
                width: `${signatureData.spacings?.verticalSeparatorRight || 8}px`,
              }}
            >
              &nbsp;
            </td>
          )}

          {/* Informations empilées verticalement à droite */}
          <td
            style={{
              verticalAlign: "top",
              paddingLeft: `${signatureData.spacings?.nameSpacing || 12}px`,
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
                      paddingBottom: `${signatureData.spacings?.nameBottom || 2}px`,
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
                        fontSize: `${signatureData.typography?.position?.fontSize || signatureData.fontSize?.position || 14}px`,
                        color:
                          signatureData.typography?.position?.color ||
                          signatureData.colors?.position ||
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
                          signatureData.typography?.position?.textDecoration ||
                          "none",
                        paddingTop: "2px",
                        paddingBottom: `${signatureData.spacings?.positionBottom || 4}px`,
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
                        fontSize: `${signatureData.typography?.company?.fontSize || signatureData.fontSize?.company || 14}px`,
                        color:
                          signatureData.typography?.company?.color ||
                          signatureData.colors?.company ||
                          "#2563eb",
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
                        paddingTop: "2px",
                        paddingBottom: `${signatureData.spacings?.companyBottom || 8}px`,
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
                        paddingBottom: `${signatureData.spacings?.phoneToMobile || 4}px`,
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
                                fontSize: `${signatureData.typography?.phone?.fontSize || signatureData.fontSize?.contact || 12}px`,
                                color:
                                  signatureData.typography?.phone?.color ||
                                  signatureData.colors?.contact ||
                                  "rgb(102,102,102)",
                                fontFamily:
                                  signatureData.typography?.phone?.fontFamily ||
                                  signatureData.fontFamily ||
                                  "Arial, sans-serif",
                                fontWeight:
                                  signatureData.typography?.phone?.fontWeight ||
                                  "normal",
                                fontStyle:
                                  signatureData.typography?.phone?.fontStyle ||
                                  "normal",
                                textDecoration:
                                  signatureData.typography?.phone
                                    ?.textDecoration || "none",
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
                        paddingBottom: `${signatureData.spacings?.mobileToEmail || 4}px`,
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
                                fontSize: `${signatureData.typography?.mobile?.fontSize || signatureData.fontSize?.contact || 12}px`,
                                color:
                                  signatureData.typography?.mobile?.color ||
                                  signatureData.colors?.contact ||
                                  "rgb(102,102,102)",
                                fontFamily:
                                  signatureData.typography?.mobile
                                    ?.fontFamily ||
                                  signatureData.fontFamily ||
                                  "Arial, sans-serif",
                                fontWeight:
                                  signatureData.typography?.mobile
                                    ?.fontWeight || "normal",
                                fontStyle:
                                  signatureData.typography?.mobile?.fontStyle ||
                                  "normal",
                                textDecoration:
                                  signatureData.typography?.mobile
                                    ?.textDecoration || "none",
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
                        paddingBottom: `${signatureData.spacings?.emailToWebsite || 4}px`,
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
                                fontSize: `${signatureData.typography?.email?.fontSize || signatureData.fontSize?.contact || 12}px`,
                                color:
                                  signatureData.typography?.email?.color ||
                                  signatureData.colors?.contact ||
                                  "rgb(102,102,102)",
                                fontFamily:
                                  signatureData.typography?.email?.fontFamily ||
                                  signatureData.fontFamily ||
                                  "Arial, sans-serif",
                                fontWeight:
                                  signatureData.typography?.email?.fontWeight ||
                                  "normal",
                                fontStyle:
                                  signatureData.typography?.email?.fontStyle ||
                                  "normal",
                                textDecoration:
                                  signatureData.typography?.email
                                    ?.textDecoration || "none",
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
                        paddingBottom: `${signatureData.spacings?.websiteToAddress || 4}px`,
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
                                fontSize: `${signatureData.typography?.website?.fontSize || signatureData.fontSize?.contact || 12}px`,
                                color:
                                  signatureData.typography?.website?.color ||
                                  signatureData.colors?.contact ||
                                  "rgb(102,102,102)",
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
                        paddingBottom: `${signatureData.spacings?.contactBottom || 8}px`,
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
                                fontSize: `${signatureData.typography?.address?.fontSize || signatureData.fontSize?.contact || 12}px`,
                                color:
                                  signatureData.typography?.address?.color ||
                                  signatureData.colors?.contact ||
                                  "rgb(102,102,102)",
                                fontFamily:
                                  signatureData.typography?.address
                                    ?.fontFamily ||
                                  signatureData.fontFamily ||
                                  "Arial, sans-serif",
                                fontWeight:
                                  signatureData.typography?.address
                                    ?.fontWeight || "normal",
                                fontStyle:
                                  signatureData.typography?.address
                                    ?.fontStyle || "normal",
                                textDecoration:
                                  signatureData.typography?.address
                                    ?.textDecoration || "none",
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
        {signatureData.separators?.horizontal?.enabled && (
          <tr>
            <td
              colSpan={signatureData.separators?.vertical?.enabled ? "5" : "2"}
              style={{
                paddingTop: `${signatureData.spacings?.separatorTop || 12}px`,
                paddingBottom: `${signatureData.spacings?.separatorBottom || 12}px`,
              }}
            >
              <hr
                style={{
                  border: "none",
                  borderTop: `${signatureData.separators?.horizontal?.width || 1}px solid ${signatureData.separators?.horizontal?.color || "#e0e0e0"}`,
                  borderRadius: `${signatureData.separators?.horizontal?.radius || 0}px`,
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
          <td style={{ textAlign: "right", verticalAlign: "top" }}>
            {/* Espace pour équilibrer la mise en page */}
          </td>
        </tr>

        {/* Logos sociaux */}
        {(signatureData.socialLinks?.linkedin ||
          signatureData.socialLinks?.facebook ||
          signatureData.socialLinks?.twitter ||
          signatureData.socialLinks?.instagram) && (
          <tr>
            <td
              colSpan={signatureData.separators?.vertical?.enabled ? "5" : "2"}
              style={{
                paddingTop: `${signatureData.spacings?.logoToSocial || 15}px`,
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
                    {signatureData.socialLinks?.linkedin && (
                      <td style={{ paddingRight: "8px" }}>
                        <a
                          href={signatureData.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
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
                                signatureData.socialBackground?.shape ===
                                  "round"
                                  ? "50%"
                                  : "4px",
                              padding: signatureData.socialBackground?.enabled
                                ? "6px"
                                : "0",
                            }}
                          >
                            <img
                              src={`https://img.icons8.com/color/${signatureData.socialSize || 24}/linkedin.png`}
                              alt="LinkedIn"
                              width={signatureData.socialSize || 24}
                              height={signatureData.socialSize || 24}
                              style={{
                                display: "block",
                                filter: signatureData.colors?.social
                                  ? getColorFilter(signatureData.colors.social)
                                  : "none",
                              }}
                            />
                          </div>
                        </a>
                      </td>
                    )}

                    {signatureData.socialLinks?.facebook && (
                      <td style={{ paddingRight: "8px" }}>
                        <a
                          href={signatureData.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
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
                                signatureData.socialBackground?.shape ===
                                  "round"
                                  ? "50%"
                                  : "4px",
                              padding: signatureData.socialBackground?.enabled
                                ? "6px"
                                : "0",
                            }}
                          >
                            <svg
                              width={signatureData.socialSize || 24}
                              height={signatureData.socialSize || 24}
                              viewBox="0 0 50 50"
                              style={{ display: "block" }}
                            >
                              <path
                                fill={signatureData.colors?.social || "#1877F2"}
                                d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M37,19h-2c-2.14,0-3,0.5-3,2 v3h5l-1,5h-4v15h-5V29h-4v-5h4v-3c0-4,2-7,6-7c2.9,0,4,1,4,1V19z"
                              />
                            </svg>
                          </div>
                        </a>
                      </td>
                    )}

                    {signatureData.socialLinks?.twitter && (
                      <td style={{ paddingRight: "8px" }}>
                        <a
                          href={signatureData.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
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
                                signatureData.socialBackground?.shape ===
                                  "round"
                                  ? "50%"
                                  : "4px",
                              padding: signatureData.socialBackground?.enabled
                                ? "6px"
                                : "0",
                            }}
                          >
                            <img
                              src={`https://img.icons8.com/color/${signatureData.socialSize || 24}/x.png`}
                              alt="X (Twitter)"
                              width={signatureData.socialSize || 24}
                              height={signatureData.socialSize || 24}
                              style={{
                                display: "block",
                                filter: signatureData.colors?.social
                                  ? getColorFilter(signatureData.colors.social)
                                  : "none",
                              }}
                            />
                          </div>
                        </a>
                      </td>
                    )}

                    {signatureData.socialLinks?.instagram && (
                      <td>
                        <a
                          href={signatureData.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
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
                                signatureData.socialBackground?.shape ===
                                  "round"
                                  ? "50%"
                                  : "4px",
                              padding: signatureData.socialBackground?.enabled
                                ? "6px"
                                : "0",
                            }}
                          >
                            <img
                              src={`https://img.icons8.com/fluency/${signatureData.socialSize || 24}/instagram-new.png`}
                              alt="Instagram"
                              width={signatureData.socialSize || 24}
                              height={signatureData.socialSize || 24}
                              style={{
                                display: "block",
                                filter: signatureData.colors?.social
                                  ? getColorFilter(signatureData.colors.social)
                                  : "none",
                              }}
                            />
                          </div>
                        </a>
                      </td>
                    )}
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
