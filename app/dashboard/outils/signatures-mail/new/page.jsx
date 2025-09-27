/**
 * Page de création de nouvelle signature email
 * Affiche l'aperçu de la signature avec édition inline et upload d'images
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { toast } from "@/src/components/ui/sonner";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { useSignatureGenerator } from "../hooks/useSignatureGenerator";
import { useCustomSocialIcons } from "../hooks/useCustomSocialIcons";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";
import { useImageUpload } from "../hooks/useImageUpload";
import "@/src/styles/signature-text-selection.css";
import HorizontalSignature from "../components/HorizontalSignature";
import VerticalSignature from "../components/VerticalSignature";
import TemplateObama from "../components/templates/TemplateObama";
import TemplateRangan from "../components/templates/TemplateRangan";
import TemplateShah from "../components/templates/TemplateShah";
import TemplateCustom from "../components/templates/TemplateCustom";
import TemplateSelector from "../components/TemplateSelector";
// CustomSignatureBuilder supprimé - édition maintenant dans le panneau de droite

// Aperçu de l'email avec édition inline
const EmailPreview = ({ signatureData, editingSignatureId, isEditMode }) => {
  const { updateSignatureData } = useSignatureData();
  const { copyToClipboard } = useSignatureGenerator();
  const { regenerateWithPermanentId } = useCustomSocialIcons(
    signatureData,
    updateSignatureData
  );
  const { uploadImageFile, getImageUrl, isUploading, error } = useImageUpload();
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [imageStatus, setImageStatus] = useState({
    photo: "idle",
    logo: "idle",
  });
  const [convertedImages, setConvertedImages] = useState({
    photo: null,
    logo: null,
  });

  // Cache pour éviter les conversions répétées
  const imageCache = useRef(new Map());

  // Conversion à la demande uniquement (pas de useEffect automatique)

  // Fonction pour récupérer l'URL d'image (Cloudflare ou locale)
  const getImageSrc = async (imageUrl) => {
    if (!imageUrl) {
      return null;
    }

    // Si c'est déjà une URL Cloudflare (https://), on la retourne directement
    if (imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // Vérifier le cache pour les conversions blob
    if (imageCache.current.has(imageUrl)) {
      return imageCache.current.get(imageUrl);
    }

    // Si c'est déjà une URL publique (http/https), la retourner directement
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      imageCache.current.set(imageUrl, imageUrl);
      return imageUrl;
    }

    // Si c'est déjà du base64, le retourner directement
    if (imageUrl.startsWith("data:")) {
      imageCache.current.set(imageUrl, imageUrl);
      return imageUrl;
    }

    try {
      // Vérifier si l'URL blob est valide
      if (!imageUrl.startsWith("blob:")) {
        console.error("❌ URL non reconnue:", imageUrl);
        return null;
      }

      // Fetch l'image depuis l'URL blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error("❌ Erreur fetch:", response.status, response.statusText);
        return null;
      }

      const blob = await response.blob();

      // Vérifier que c'est bien une image
      if (!blob.type.startsWith("image/")) {
        console.error("❌ Le blob n'est pas une image:", blob.type);
        return null;
      }

      // Fonction de conversion avec gestion d'erreur améliorée
      const convertToBase64 = (blob, compress = false) => {
        return new Promise((resolve, reject) => {
          if (compress && blob.size > 100000) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            const timeout = setTimeout(() => {
              console.error("❌ Timeout compression image");
              reject(new Error("Timeout compression"));
            }, 10000);

            img.onload = () => {
              clearTimeout(timeout);
              try {
                // Redimensionner pour réduire la taille
                const maxSize = 200;
                let { width, height } = img;

                if (width > height) {
                  if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                  }
                } else {
                  if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

                resolve(compressedBase64);
              } catch (error) {
                console.error("❌ Erreur compression:", error);
                reject(error);
              }
            };

            img.onerror = (error) => {
              clearTimeout(timeout);
              console.error(
                "❌ Erreur chargement image pour compression:",
                error
              );
              reject(error);
            };

            img.src = URL.createObjectURL(blob);
          } else {
            // Conversion normale
            const reader = new FileReader();

            const timeout = setTimeout(() => {
              console.error("❌ Timeout FileReader");
              reject(new Error("Timeout FileReader"));
            }, 10000);

            reader.onloadend = () => {
              clearTimeout(timeout);
              const base64 = reader.result;

              resolve(base64);
            };

            reader.onerror = (error) => {
              clearTimeout(timeout);
              console.error("❌ Erreur FileReader:", error);
              reject(error);
            };

            reader.readAsDataURL(blob);
          }
        });
      };

      const result = await convertToBase64(blob, true);

      // Mettre en cache le résultat
      if (result) {
        imageCache.current.set(imageUrl, result);
      }

      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la conversion base64:", error);
      return null;
    }
  };

  // Fonction pour générer le HTML de la signature
  const generateSignatureHTML = async (facebookImageUrl = null) => {
    const primaryColor = signatureData.primaryColor || "#171717";

    try {
      // Utiliser directement les URLs des images (plus simple et efficace)
      const photoSrc = signatureData.photo;
      const logoSrc = signatureData.logo;

      // Générer le HTML selon l'orientation sélectionnée
      const orientation = signatureData.orientation || "vertical";
      let htmlSignature;

      // Génération HTML basée sur l'orientation uniquement
      if (orientation === "horizontal") {
        htmlSignature = generateHorizontalHTML(
          signatureData,
          primaryColor,
          facebookImageUrl,
          photoSrc,
          logoSrc
        );
      } else {
        htmlSignature = generateVerticalHTML(
          signatureData,
          primaryColor,
          facebookImageUrl,
          photoSrc,
          logoSrc
        );
      }

      return htmlSignature;
    } catch (error) {
      console.error("❌ Erreur lors de la génération HTML:", error);
      throw error;
    }
  };

  // Fonction pour générer le HTML du layout vertical
  const generateVerticalHTML = (
    signatureData,
    primaryColor,
    facebookImageUrl = null,
    photoSrc,
    logoSrc
  ) => {
    // Ensure facebookImageUrl is properly handled
    const facebookImgUrl = facebookImageUrl || "";
    const imageSize = signatureData.imageSize || 80;
    const borderRadius = signatureData.imageShape === "square" ? "8px" : "50%";
    const separatorVerticalWidth =
      signatureData.separators?.vertical?.width ||
      signatureData.separatorVerticalWidth ||
      1;
    const separatorHorizontalWidth =
      signatureData.separatorHorizontalWidth || 1;
    const logoSize = signatureData.logoSize || 60;
    const spacings = signatureData.spacings || {};
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Signature Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: ${signatureData.fontFamily || "Arial, sans-serif"};">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: ${signatureData.fontFamily || "Arial, sans-serif"};">
        <tbody>
          <tr>
            <!-- Colonne de gauche : Informations personnelles -->
            <td style="padding-right: 15px; vertical-align: top;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                <tbody>
                  ${
                    photoSrc
                      ? `
                 <tr>
                  <td style="padding-bottom: ${spacings.photoBottom || 12}px; text-align: left;">
                    <div style="width: ${imageSize}px; height: ${imageSize}px; border-radius: ${borderRadius}; background: url('${photoSrc}') center center / cover no-repeat; display: inline-block; overflow: hidden; -webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover; background-size: cover !important;"></div>
                  </td>
                </tr>
                  `
                      : ""
                  }
                  

                  <tr>
                    <td style="padding-bottom: ${spacings.nameBottom || 8}px; text-align: left;">
                      <div style="font-size: ${signatureData.typography?.fullName?.fontSize || signatureData.fontSize?.name || 16}px; font-weight: ${signatureData.typography?.fullName?.fontWeight || "bold"}; font-style: ${signatureData.typography?.fullName?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.fullName?.textDecoration || "none"}; color: ${signatureData.typography?.fullName?.color || primaryColor}; line-height: 1.2; font-family: ${signatureData.typography?.fullName?.fontFamily || signatureData.fontFamily || "Arial, sans-serif"};">
                        ${signatureData.fullName || ""}
                      </div>
                    </td>
                  </tr>
                  ${
                    signatureData.position
                      ? `
                    <tr>
                      <td style="padding-bottom: ${spacings.positionBottom || 8}px; text-align: left;">
                        <div style="font-size: ${signatureData.typography?.position?.fontSize || signatureData.fontSize?.position || 14}px; font-weight: ${signatureData.typography?.position?.fontWeight || "normal"}; font-style: ${signatureData.typography?.position?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.position?.textDecoration || "none"}; color: ${signatureData.typography?.position?.color || "rgb(102,102,102)"}; font-family: ${signatureData.typography?.position?.fontFamily || signatureData.fontFamily || "Arial, sans-serif"};">
                          ${signatureData.position}
                        </div>
                      </td>
                    </tr>
                  `
                      : ""
                  }
                  ${
                    signatureData.companyName
                      ? `
                    <tr>
                      <td style="padding-bottom: ${spacings.companyBottom || 12}px; text-align: left;">
                        <div style="font-size: 14px; font-weight: bold; color: ${primaryColor}; font-family: ${signatureData.fontFamily || "Arial, sans-serif"};">
                          ${signatureData.companyName}
                        </div>
                      </td>
                    </tr>
                  `
                      : ""
                  }
                </tbody>
              </table>
            </td>
            
            <!-- Séparateur vertical - Gmail compatible -->
          ${
            signatureData.separators?.vertical?.enabled
              ? `
          <td style="width: ${signatureData.separators?.vertical?.width || signatureData.separatorVerticalWidth || 1}px; background-color: ${signatureData.separators?.vertical?.color || "#e0e0e0"}; border-radius: ${signatureData.separators?.vertical?.radius || 0}px; padding: 0; vertical-align: top; height: 100%; min-height: 200px;">
            &nbsp;
          </td>
          `
              : ""
          }
            
            <!-- Colonne de droite : Informations de contact -->
            <td style="padding-left: 15px; vertical-align: top;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                <tbody>
                  ${
                    signatureData.phone
                      ? `
                    <tr>
                      <td style="padding-bottom: ${signatureData.mobile ? spacings.phoneToMobile || 4 : spacings.contactBottom || 6}px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                              </td>
                              <td style="font-size: ${signatureData.typography?.phone?.fontSize || 12}px; font-weight: ${signatureData.typography?.phone?.fontWeight || "normal"}; font-style: ${signatureData.typography?.phone?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.phone?.textDecoration || "none"}; color: ${signatureData.typography?.phone?.color || "rgb(102,102,102)"}; vertical-align: middle; font-family: ${signatureData.typography?.phone?.fontFamily || "Arial, sans-serif"};">
                                <a href="tel:${signatureData.phone}" style="color: ${signatureData.typography?.phone?.color || "rgb(102,102,102)"}; text-decoration: none; font-family: inherit;">${signatureData.phone}</a>
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
                      <td style="padding-bottom: ${signatureData.email ? spacings.mobileToEmail || 4 : spacings.contactBottom || 6}px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                              </td>
                              <td style="font-size: ${signatureData.typography?.mobile?.fontSize || 12}px; font-weight: ${signatureData.typography?.mobile?.fontWeight || "normal"}; font-style: ${signatureData.typography?.mobile?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.mobile?.textDecoration || "none"}; color: ${signatureData.typography?.mobile?.color || "rgb(102,102,102)"}; vertical-align: middle; font-family: ${signatureData.typography?.mobile?.fontFamily || "Arial, sans-serif"};">
                                <a href="tel:${signatureData.mobile}" style="color: ${signatureData.typography?.mobile?.color || "rgb(102,102,102)"}; text-decoration: none; font-family: inherit;">${signatureData.mobile}</a>
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
                      <td style="padding-bottom: ${signatureData.website ? spacings.emailToWebsite || 4 : spacings.contactBottom || 6}px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                              </td>
                              <td style="font-size: ${signatureData.typography?.email?.fontSize || 12}px; font-weight: ${signatureData.typography?.email?.fontWeight || "normal"}; font-style: ${signatureData.typography?.email?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.email?.textDecoration || "none"}; color: ${signatureData.typography?.email?.color || "rgb(102,102,102)"}; vertical-align: middle; font-family: ${signatureData.typography?.email?.fontFamily || "Arial, sans-serif"};">
                                <a href="mailto:${signatureData.email}" style="color: ${primaryColor}; text-decoration: none; font-family: inherit;">${signatureData.email}</a>
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
                      <td style="padding-bottom: ${signatureData.address ? spacings.websiteToAddress || 4 : spacings.contactBottom || 6}px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                              </td>
                              <td style="font-size: ${signatureData.typography?.website?.fontSize || 12}px; font-weight: ${signatureData.typography?.website?.fontWeight || "normal"}; font-style: ${signatureData.typography?.website?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.website?.textDecoration || "none"}; color: ${signatureData.typography?.website?.color || "rgb(102,102,102)"}; vertical-align: middle; font-family: ${signatureData.typography?.website?.fontFamily || "Arial, sans-serif"};">
                                <a href="${signatureData.website && signatureData.website.startsWith("http") ? signatureData.website : "https://" + (signatureData.website || "")}" style="color: ${primaryColor}; text-decoration: none; font-family: inherit;">${signatureData.website ? signatureData.website.replace(/^https?:\/\//, "") : ""}</a>
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
                              <td style="padding-right: 8px; vertical-align: top; width: 12px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block; margin-top: 1px;" />
                              </td>
                              <td style="font-size: ${signatureData.typography?.address?.fontSize || 12}px; font-weight: ${signatureData.typography?.address?.fontWeight || "normal"}; font-style: ${signatureData.typography?.address?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.address?.textDecoration || "none"}; color: ${signatureData.typography?.address?.color || "rgb(102,102,102)"}; vertical-align: top; font-family: ${signatureData.typography?.address?.fontFamily || "Arial, sans-serif"}; line-height: 1.4;">
                                ${signatureData.address.replace(/\n/g, "<br>")}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  `
                      : ""
                  }
                  
                  <!-- Séparateur horizontal après tous les contacts -->
                  ${
                    signatureData.separators?.horizontal?.enabled
                      ? `
                  <tr>
                    <td style="padding-top: ${spacings.separatorTop || 12}px; padding-bottom: ${spacings.separatorBottom || 12}px;">
                      <hr style="border: none; border-top: ${signatureData.separators?.horizontal?.width || 1}px solid ${signatureData.separators?.horizontal?.color || "#e0e0e0"}; border-radius: ${signatureData.separators?.horizontal?.radius || 0}px; margin: 0; width: 100%;" />
                    </td>
                  </tr>
                  `
                      : ""
                  }
                  
                  <!-- Logo entreprise après le séparateur -->
                  ${
                    logoSrc
                      ? `
                    <tr>
                      <td style="padding-top: ${spacings.separatorBottom || 12}px; text-align: left;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="text-align: left;">
                                <img src="${logoSrc}" alt="Logo entreprise" style="max-width: ${logoSize}px; height: auto; display: block;" />
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
        </tbody>
      </table>
    </body>
    </html>
  `;
  };

  // Fonction pour générer le HTML du layout horizontal
  const generateHorizontalHTML = (
    signatureData,
    primaryColor,
    facebookImageUrl = null,
    photoSrc,
    logoSrc
  ) => {
    // Ensure facebookImageUrl is properly handled
    const facebookImgUrl = facebookImageUrl || "";
    const imageSize = signatureData.imageSize || 80;
    const borderRadius = signatureData.imageShape === "square" ? "8px" : "50%";
    const separatorHorizontalWidth =
      signatureData.separators?.horizontal?.width || 1;
    const spacings = signatureData.spacings || {};
    const logoSize = signatureData.logoSize || 60;
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Signature Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px !important;">
        <tr>
          <!-- Photo de profil à gauche -->
          ${
            photoSrc
              ? `
            <td style="width: ${signatureData.columnWidths?.photo || 25}%; padding-right: ${spacings.photoBottom || 16}px; vertical-align: top;">
              <div style="width: ${imageSize}px; height: ${imageSize}px; border-radius: ${borderRadius}; background: url('${photoSrc}') center center/cover no-repeat; display: block; overflow: hidden; -webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover;"></div>
            </td>
          `
              : ""
          }
          
          <!-- Informations empilées verticalement à droite -->
          <td style="width: ${signatureData.columnWidths?.content || 75}%; vertical-align: top;">
            <!-- Nom et prénom -->
            <div style="font-size: ${signatureData.typography?.fullName?.fontSize || 16}px; font-weight: ${signatureData.typography?.fullName?.fontWeight || "bold"}; font-style: ${signatureData.typography?.fullName?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.fullName?.textDecoration || "none"}; color: ${signatureData.typography?.fullName?.color || primaryColor}; line-height: 1.2; margin-bottom: 2px; font-family: ${signatureData.typography?.fullName?.fontFamily || "Arial, sans-serif"};">
              ${signatureData.fullName || ""}
            </div>
            
            <!-- Profession -->
            ${
              signatureData.position
                ? `
              <div style="font-size: ${signatureData.typography?.position?.fontSize || 14}px; font-weight: ${signatureData.typography?.position?.fontWeight || "normal"}; font-style: ${signatureData.typography?.position?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.position?.textDecoration || "none"}; color: ${signatureData.typography?.position?.color || "rgb(102,102,102)"}; margin-bottom: 4px; font-family: ${signatureData.typography?.position?.fontFamily || "Arial, sans-serif"};">
                ${signatureData.position}
              </div>
            `
                : ""
            }
            
            <!-- Contacts -->
            ${
              signatureData.phone
                ? `
              <div style="display: flex; align-items: center; font-size: ${signatureData.typography?.phone?.fontSize || 12}px; font-weight: ${signatureData.typography?.phone?.fontWeight || "normal"}; font-style: ${signatureData.typography?.phone?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.phone?.textDecoration || "none"}; color: ${signatureData.typography?.phone?.color || "rgb(102,102,102)"}; margin-bottom: 1px; font-family: ${signatureData.typography?.phone?.fontFamily || "Arial, sans-serif"};">
                <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                ${signatureData.phone}
              </div>
            `
                : ""
            }
            
            ${
              signatureData.mobile
                ? `
              <div style="display: flex; align-items: center; font-size: ${signatureData.typography?.mobile?.fontSize || 12}px; font-weight: ${signatureData.typography?.mobile?.fontWeight || "normal"}; font-style: ${signatureData.typography?.mobile?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.mobile?.textDecoration || "none"}; color: ${signatureData.typography?.mobile?.color || "rgb(102,102,102)"}; margin-bottom: 1px; font-family: ${signatureData.typography?.mobile?.fontFamily || "Arial, sans-serif"};">
                <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                ${signatureData.mobile}
              </div>
            `
                : ""
            }
            
            ${
              signatureData.email
                ? `
              <div style="display: flex; align-items: center; font-size: ${signatureData.typography?.email?.fontSize || 12}px; font-weight: ${signatureData.typography?.email?.fontWeight || "normal"}; font-style: ${signatureData.typography?.email?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.email?.textDecoration || "none"}; color: ${signatureData.typography?.email?.color || "rgb(102,102,102)"}; margin-bottom: 1px; font-family: ${signatureData.typography?.email?.fontFamily || "Arial, sans-serif"};">
                <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                <a href="mailto:${signatureData.email}" style="color: ${primaryColor}; text-decoration: none;">${signatureData.email}</a>
              </div>
            `
                : ""
            }
            
            ${
              signatureData.website
                ? `
              <div style="display: flex; align-items: center; font-size: ${signatureData.typography?.website?.fontSize || 12}px; font-weight: ${signatureData.typography?.website?.fontWeight || "normal"}; font-style: ${signatureData.typography?.website?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.website?.textDecoration || "none"}; color: ${signatureData.typography?.website?.color || "rgb(102,102,102)"}; margin-bottom: 1px; font-family: ${signatureData.typography?.website?.fontFamily || "Arial, sans-serif"};">
                <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                <a href="${signatureData.website.startsWith("http") ? signatureData.website : "https://" + signatureData.website}" target="_blank" style="color: ${primaryColor}; text-decoration: none;">${signatureData.website.replace(/^https?:\/\//, "")}</a>
              </div>
            `
                : ""
            }
            
            ${
              signatureData.address
                ? `
              <div style="display: flex; align-items: flex-start; font-size: ${signatureData.typography?.address?.fontSize || 12}px; font-weight: ${signatureData.typography?.address?.fontWeight || "normal"}; font-style: ${signatureData.typography?.address?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.address?.textDecoration || "none"}; color: ${signatureData.typography?.address?.color || "rgb(102,102,102)"}; margin-bottom: 4px; font-family: ${signatureData.typography?.address?.fontFamily || "Arial, sans-serif"};">
                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px; margin-top: 1px;" />
                ${signatureData.address.replace(/\n/g, "<br>")}
              </div>
            `
                : ""
            }
            
            <!-- Logo/Nom entreprise -->
            ${signatureData.companyName || logoSrc ? "" : ""}
          </td>
        </tr>
        
        <!-- Séparateur horizontal -->
        ${
          signatureData.separators?.horizontal?.enabled
            ? `
        <tr>
          <td colspan="2" style="padding: ${spacings.separatorTop || 12}px 0 ${spacings.separatorBottom || 12}px 0;">
            <hr style="border: none; border-top: ${signatureData.separators?.horizontal?.width || 1}px solid ${signatureData.separators?.horizontal?.color || "#e0e0e0"}; border-radius: ${signatureData.separators?.horizontal?.radius || 0}px; margin: 0; width: 100%;" />
          </td>
        </tr>
        `
            : ""
        }
        
        <!-- Logo entreprise après le séparateur -->
        ${
          logoSrc
            ? `
        <tr>
          <td colspan="2" style="text-align: left;">
            <img src="${logoSrc}" alt="Logo entreprise" style="width: ${logoSize}px; height: auto; max-height: ${logoSize}px; object-fit: contain;" />
          </td>
        </tr>
        `
            : ""
        }
        
        <!-- Logos sociaux -->
        ${
          signatureData.socialLinks?.linkedin ||
          signatureData.socialLinks?.facebook ||
          signatureData.socialLinks?.twitter ||
          signatureData.socialLinks?.instagram
            ? `
        <tr>
          <td colspan="2" style="padding: ${spacings.separatorBottom || 15}px 0 0 0; text-align: left;">
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
              <tr>
                ${
                  signatureData.socialLinks?.linkedin
                    ? `
                <td style="padding-right: 8px;">
                  <a href="${signatureData.socialLinks.linkedin}" target="_blank" rel="noopener noreferrer">
                    ${
                      signatureData.socialBackground?.enabled
                        ? `
                    <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || "#f3f4f6"}; border-radius: ${signatureData.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: 6px;">
                      <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/linkedin.png" alt="LinkedIn" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    </div>
                    `
                        : `
                    <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/linkedin.png" alt="LinkedIn" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    `
                    }
                  </a>
                </td>
                `
                    : ""
                }
                ${
                  signatureData.socialLinks?.facebook
                    ? `
                <td style="padding-right: 8px;">
                  <a href="${signatureData.socialLinks.facebook}" target="_blank" rel="noopener noreferrer">
                    ${
                      signatureData.socialBackground?.enabled
                        ? `
                    <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || "#f3f4f6"}; border-radius: ${signatureData.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: 6px;">
                      ${
                        facebookImgUrl
                          ? `
                      <img src="${facebookImgUrl}" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                      `
                          : `
                      <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/facebook.png" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                      `
                      }
                    </div>
                    `
                        : `
                    ${
                      facebookImgUrl
                        ? `
                    <img src="${facebookImgUrl}" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    `
                        : `
                    <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/facebook.png" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    `
                    }
                    `
                    }
                  </a>
                </td>
                `
                    : ""
                }
                ${
                  signatureData.socialLinks?.twitter
                    ? `
                <td style="padding-right: 8px;">
                  <a href="${signatureData.socialLinks.twitter}" target="_blank" rel="noopener noreferrer">
                    ${
                      signatureData.socialBackground?.enabled
                        ? `
                    <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || "#f3f4f6"}; border-radius: ${signatureData.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: 6px;">
                      <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/x.png" alt="X (Twitter)" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    </div>
                    `
                        : `
                    <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/x.png" alt="X (Twitter)" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    `
                    }
                  </a>
                </td>
                `
                    : ""
                }
                ${
                  signatureData.socialLinks?.instagram
                    ? `
                <td>
                  <a href="${signatureData.socialLinks.instagram}" target="_blank" rel="noopener noreferrer">
                    ${
                      signatureData.socialBackground?.enabled
                        ? `
                    <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || "#f3f4f6"}; border-radius: ${signatureData.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: 6px;">
                      <img src="https://img.icons8.com/fluency/${signatureData.socialSize || 24}/instagram-new.png" alt="Instagram" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    </div>
                    `
                        : `
                    <img src="https://img.icons8.com/fluency/${signatureData.socialSize || 24}/instagram-new.png" alt="Instagram" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    `
                    }
                  </a>
                </td>
                `
                    : ""
                }
              </tr>
            </table>
          </td>
        </tr>
        `
            : ""
        }
      </table>
    </body>
    </html>
  `;
  };

  // Générateur HTML pour le template Obama
  const generateObamaHTML = (
    signatureData,
    primaryColor,
    photoSrc,
    logoSrc
  ) => {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 450px; font-family: Arial, sans-serif; background-color: #ffffff;">
  <tbody>
    <tr>
      <!-- Photo de profil à gauche -->
      <td style="width: 100px; padding-right: 20px; vertical-align: top; padding-bottom: 10px;">
        ${
          photoSrc
            ? `
        <div style="width: 90px; height: 90px; border-radius: 50%; background: url('${photoSrc}') center center/cover no-repeat; display: block; border: 3px solid #f0f0f0;"></div>
        `
            : ""
        }
      </td>
      
      <!-- Informations à droite -->
      <td style="vertical-align: top; padding-bottom: 10px;">
        <!-- Nom complet -->
        <div style="font-size: ${signatureData.typography?.fullName?.fontSize || 22}px; font-weight: ${signatureData.typography?.fullName?.fontWeight || "bold"}; font-style: ${signatureData.typography?.fullName?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.fullName?.textDecoration || "none"}; color: ${signatureData.typography?.fullName?.color || "#2563eb"}; line-height: 1.2; margin-bottom: 5px; font-family: ${signatureData.typography?.fullName?.fontFamily || "Arial, sans-serif"};">
          ${signatureData.fullName || ""}
        </div>
        
        <!-- Titre/Position -->
        ${
          signatureData.position || signatureData.company
            ? `
        <div style="font-size: ${signatureData.typography?.position?.fontSize || 14}px; font-weight: ${signatureData.typography?.position?.fontWeight || "normal"}; font-style: ${signatureData.typography?.position?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.position?.textDecoration || "none"}; color: ${signatureData.typography?.position?.color || "#666666"}; line-height: 1.3; margin-bottom: 15px; font-family: ${signatureData.typography?.position?.fontFamily || "Arial, sans-serif"};">
          ${signatureData.position || ""}${signatureData.position && signatureData.company ? " | " : ""}${signatureData.company || ""}
        </div>
        `
            : ""
        }
        
        <!-- Informations de contact -->
        <div style="font-size: 13px; color: #666666; line-height: 1.6;">
          ${
            signatureData.email
              ? `
          <div style="margin-bottom: 3px; display: flex; align-items: center;">
            <span style="color: #2563eb; margin-right: 8px; font-size: 14px;">✉</span>
            <a href="mailto:${signatureData.email}" style="color: #666666; text-decoration: none;">${signatureData.email}</a>
          </div>
          `
              : ""
          }
          
          ${
            signatureData.phone
              ? `
          <div style="margin-bottom: 3px; display: flex; align-items: center;">
            <span style="color: #2563eb; margin-right: 8px; font-size: 14px;">📞</span>
            <span style="color: #666666;">${signatureData.phone}</span>
          </div>
          `
              : ""
          }
          
          ${
            signatureData.website
              ? `
          <div style="margin-bottom: 3px; display: flex; align-items: center;">
            <span style="color: #2563eb; margin-right: 8px; font-size: 14px;">🌐</span>
            <a href="${signatureData.website}" style="color: #666666; text-decoration: none;">${signatureData.website}</a>
          </div>
          `
              : ""
          }
          
          ${
            signatureData.address
              ? `
          <div style="margin-top: 8px; display: flex; align-items: flex-start;">
            <span style="color: #2563eb; margin-right: 8px; font-size: 14px; margin-top: 2px;">📍</span>
            <span style="color: #666666;">${signatureData.address}</span>
          </div>
          `
              : ""
          }
        </div>
      </td>
    </tr>
  </tbody>
</table>
  `;
  };

  // Générateur HTML pour le template Rangan
  const generateRanganHTML = (
    signatureData,
    primaryColor,
    photoSrc,
    logoSrc
  ) => {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: Arial, sans-serif; background-color: #ffffff;">
  <tbody>
    <tr>
      <!-- Photo de profil à gauche -->
      <td style="width: 110px; padding-right: 25px; vertical-align: top; padding-bottom: 15px;">
        ${
          photoSrc
            ? `
        <div style="width: 100px; height: 100px; border-radius: 50%; background: url('${photoSrc}') center center/cover no-repeat; display: block; border: 4px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>
        `
            : ""
        }
      </td>
      
      <!-- Informations à droite -->
      <td style="vertical-align: top; padding-bottom: 15px;">
        <!-- Nom complet -->
        <div style="font-size: ${signatureData.typography?.fullName?.fontSize || 24}px; font-weight: ${signatureData.typography?.fullName?.fontWeight || "bold"}; font-style: ${signatureData.typography?.fullName?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.fullName?.textDecoration || "none"}; color: ${signatureData.typography?.fullName?.color || "#1a1a1a"}; line-height: 1.2; margin-bottom: 4px; font-family: ${signatureData.typography?.fullName?.fontFamily || "Arial, sans-serif"};">
          ${signatureData.fullName || ""}
        </div>
        
        <!-- Titre/Position -->
        <div style="font-size: ${signatureData.typography?.position?.fontSize || 16}px; font-weight: ${signatureData.typography?.position?.fontWeight || "normal"}; font-style: ${signatureData.typography?.position?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.position?.textDecoration || "none"}; color: ${signatureData.typography?.position?.color || "#666666"}; line-height: 1.3; margin-bottom: 12px; font-family: ${signatureData.typography?.position?.fontFamily || "Arial, sans-serif"};">
          ${signatureData.position || ""}${signatureData.position && signatureData.company ? "<br>" : ""}${signatureData.company || ""}
        </div>
        
        <!-- Informations de contact avec icônes colorées -->
        <div style="font-size: 14px; line-height: 1.8; margin-bottom: 15px;">
          ${
            signatureData.phone
              ? `
          <div style="margin-bottom: 4px; display: flex; align-items: center;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #ff6b35; margin-right: 10px; display: flex; align-items: center; justify-content: center; font-size: 10px;">📞</div>
            <span style="color: #333;">${signatureData.phone}</span>
          </div>
          `
              : ""
          }
          
          ${
            signatureData.email
              ? `
          <div style="margin-bottom: 4px; display: flex; align-items: center;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #4285f4; margin-right: 10px; display: flex; align-items: center; justify-content: center; font-size: 10px;">✉</div>
            <a href="mailto:${signatureData.email}" style="color: #333; text-decoration: none;">${signatureData.email}</a>
          </div>
          `
              : ""
          }
          
          ${
            signatureData.website
              ? `
          <div style="margin-bottom: 4px; display: flex; align-items: center;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #34a853; margin-right: 10px; display: flex; align-items: center; justify-content: center; font-size: 10px;">🌐</div>
            <a href="${signatureData.website}" style="color: #333; text-decoration: none;">${signatureData.website}</a>
          </div>
          `
              : ""
          }
        </div>
        
        <!-- Icônes sociales colorées -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #0077b5; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <span style="color: white; font-size: 14px; font-weight: bold;">in</span>
          </div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #1da1f2; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <span style="color: white; font-size: 12px;">🐦</span>
          </div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <span style="color: white; font-size: 12px;">📷</span>
          </div>
        </div>
      </td>
    </tr>
  </tbody>
</table>
  `;
  };

  // Générateur HTML pour le template Shah
  const generateShahHTML = (signatureData, primaryColor, photoSrc, logoSrc) => {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 480px; font-family: Arial, sans-serif; background-color: #ffffff;">
  <tbody>
    <tr>
      <!-- Informations à gauche -->
      <td style="vertical-align: top; padding-right: 25px; padding-bottom: 15px; width: 300px;">
        <!-- Nom complet -->
        <div style="font-size: ${signatureData.typography?.fullName?.fontSize || 26}px; font-weight: ${signatureData.typography?.fullName?.fontWeight || "bold"}; font-style: ${signatureData.typography?.fullName?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.fullName?.textDecoration || "none"}; color: ${signatureData.typography?.fullName?.color || "#1a1a1a"}; line-height: 1.1; margin-bottom: 6px; font-family: ${signatureData.typography?.fullName?.fontFamily || "Arial, sans-serif"};">
          ${signatureData.fullName || ""}
        </div>
        
        <!-- Titre/Position -->
        <div style="font-size: ${signatureData.typography?.position?.fontSize || 15}px; font-weight: ${signatureData.typography?.position?.fontWeight || "normal"}; font-style: ${signatureData.typography?.position?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.position?.textDecoration || "none"}; color: ${signatureData.typography?.position?.color || "#666666"}; line-height: 1.4; margin-bottom: 18px; font-family: ${signatureData.typography?.position?.fontFamily || "Arial, sans-serif"};">
          ${signatureData.position || ""}${signatureData.position && signatureData.company ? " at " : ""}${signatureData.company || ""}
        </div>
        
        <!-- Informations de contact -->
        <div style="font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
          ${
            signatureData.email
              ? `
          <div style="margin-bottom: 5px; display: flex; align-items: center;">
            <span style="color: #666666; margin-right: 8px; font-size: 13px;">📧</span>
            <a href="mailto:${signatureData.email}" style="color: #333; text-decoration: none;">${signatureData.email}</a>
          </div>
          `
              : ""
          }
          
          ${
            signatureData.phone
              ? `
          <div style="margin-bottom: 5px; display: flex; align-items: center;">
            <span style="color: #666666; margin-right: 8px; font-size: 13px;">📱</span>
            <span style="color: #333;">${signatureData.phone}</span>
          </div>
          `
              : ""
          }
          
          ${
            signatureData.website
              ? `
          <div style="margin-bottom: 5px; display: flex; align-items: center;">
            <span style="color: #666666; margin-right: 8px; font-size: 13px;">🌍</span>
            <a href="${signatureData.website}" style="color: #333; text-decoration: none;">${signatureData.website}</a>
          </div>
          `
              : ""
          }
        </div>
        
        <!-- Icônes sociales bleues alignées -->
        <div style="display: flex; gap: 10px; align-items: center;">
          <div style="width: 32px; height: 32px; border-radius: 6px; background-color: #0077b5; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <span style="color: white; font-size: 16px; font-weight: bold;">in</span>
          </div>
          <div style="width: 32px; height: 32px; border-radius: 6px; background-color: #0077b5; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <span style="color: white; font-size: 14px;">🐦</span>
          </div>
          <div style="width: 32px; height: 32px; border-radius: 6px; background-color: #0077b5; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <span style="color: white; font-size: 16px; font-weight: bold;">f</span>
          </div>
          <div style="width: 32px; height: 32px; border-radius: 6px; background-color: #0077b5; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <span style="color: white; font-size: 14px;">📷</span>
          </div>
        </div>
      </td>
      
      <!-- Photo de profil carrée à droite -->
      <td style="width: 130px; vertical-align: top; padding-bottom: 15px; text-align: center;">
        ${
          photoSrc
            ? `
        <div style="width: 120px; height: 120px; border-radius: 8px; background: url('${photoSrc}') center center/cover no-repeat; display: inline-block; border: 2px solid #f0f0f0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);"></div>
        `
            : ""
        }
      </td>
    </tr>
  </tbody>
</table>
  `;
  };

  // Générateur HTML pour le template personnalisé
  const generateCustomHTML = (
    signatureData,
    primaryColor,
    photoSrc,
    logoSrc
  ) => {
    const layout = signatureData.customLayout || {
      grid: { rows: 2, cols: 2 },
      cells: [
        {
          id: "cell-0-0",
          row: 0,
          col: 0,
          elements: [{ type: "photo", content: photoSrc, alignment: "center" }],
        },
        {
          id: "cell-0-1",
          row: 0,
          col: 1,
          elements: [
            {
              type: "text",
              content: `${signatureData.fullName || ""}`,
              alignment: "left",
              styles: {
                fontSize: "18px",
                fontWeight: "bold",
                color: primaryColor,
              },
            },
            {
              type: "text",
              content: signatureData.position || "",
              alignment: "left",
              styles: { fontSize: "14px", color: "#666", marginTop: "4px" },
            },
          ],
        },
        {
          id: "cell-1-0",
          row: 1,
          col: 0,
          elements: [{ type: "logo", content: logoSrc, alignment: "center" }],
        },
        {
          id: "cell-1-1",
          row: 1,
          col: 1,
          elements: [
            {
              type: "text",
              content: signatureData.contact || "",
              alignment: "left",
              styles: { fontSize: "12px", color: "#666" },
            },
          ],
        },
      ],
    };

    const { grid, cells } = layout;

    // Fonction pour générer le HTML d'un élément
    const generateElementHTML = (element) => {
      const { type, content, alignment, styles = {} } = element;

      if (!content) return "";

      const alignStyle =
        alignment === "center"
          ? "text-align: center;"
          : alignment === "right"
            ? "text-align: right;"
            : "text-align: left;";

      const styleString = Object.entries(styles)
        .map(([key, value]) => {
          const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
          return `${cssKey}: ${value};`;
        })
        .join(" ");

      switch (type) {
        case "photo":
          return `
          <div style="${alignStyle}">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: url('${content}') center center/cover no-repeat; display: inline-block; border: 2px solid #f0f0f0; ${styleString}"></div>
          </div>
        `;

        case "logo":
          return `
          <div style="${alignStyle}">
            <img src="${content}" alt="Logo" style="height: 40px; object-fit: contain; ${styleString}" />
          </div>
        `;

        case "text":
        case "custom":
          return `<div style="${alignStyle} ${styleString}">${content}</div>`;

        default:
          return "";
      }
    };

    // Fonction pour générer le HTML d'une cellule
    const generateCellHTML = (cell) => {
      const elementsHTML = cell.elements
        .map(generateElementHTML)
        .filter((html) => html)
        .join("");
      const { borders = {} } = cell;

      // Construire les styles de bordure pour le HTML
      const borderStyles = [
        borders.top ? "border-top: 2px solid #e5e7eb" : "",
        borders.right ? "border-right: 2px solid #e5e7eb" : "",
        borders.bottom ? "border-bottom: 2px solid #e5e7eb" : "",
        borders.left ? "border-left: 2px solid #e5e7eb" : "",
      ]
        .filter(Boolean)
        .join("; ");

      return `
      <td style="padding: 10px; vertical-align: top; ${borderStyles}">
        ${elementsHTML}
      </td>
    `;
    };

    // Générer la structure de la grille
    const rows = [];
    for (let row = 0; row < grid.rows; row++) {
      const rowCells = cells
        .filter((cell) => cell.row === row)
        .sort((a, b) => a.col - b.col);
      const rowHTML = `
      <tr>
        ${rowCells.map(generateCellHTML).join("")}
      </tr>
    `;
      rows.push(rowHTML);
    }

    return `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 600px; font-family: Arial, sans-serif; background-color: #ffffff;">
  <tbody>
    ${rows.join("")}
  </tbody>
</table>
  `;
  };

  // Fonction pour copier la signature dans le presse-papier
  const handleCopySignature = async () => {
    setIsCopying(true);

    try {
      // Utiliser notre hook optimisé avec sauvegarde automatique et régénération d'icônes
      const result = await copyToClipboard(regenerateWithPermanentId);

      if (result.success) {
        const message = result.signatureId
          ? "Signature sauvegardée et copiée avec URLs permanentes !"
          : "Signature copiée avec espacements optimisés !";
        toast.success(message);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("❌ Erreur copie signature:", error);
      toast.error("Erreur lors de la copie de la signature");
    } finally {
      setIsCopying(false);
    }
  };

  // Fonctions de validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "L'email est requis";
    if (!emailRegex.test(email)) return "Format d'email invalide";
    return true;
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Optionnel
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(phone)) return "Format de téléphone invalide";
    return true;
  };

  const validateUrl = (url) => {
    if (!url) return true; // Optionnel
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return "Format d'URL invalide";
    }
  };

  // Gestionnaires de changement
  const handleFieldChange = (field, value) => {
    updateSignatureData(field, value);
  };

  const handleImageChange = async (field, file) => {
    if (!file) {
      // Si pas de fichier, on supprime l'image
      updateSignatureData(field, null);
      updateSignatureData(field + "Key", null);
      return;
    }

    try {
      // Déterminer le type d'image pour la nouvelle structure
      const imageType = field === "photo" ? "imgProfil" : "logoReseau";

      // Récupérer ou générer un signatureId
      const signatureId = editingSignatureId || `temp-${Date.now()}`;

      // Upload vers Cloudflare avec la nouvelle structure
      const result = await uploadImageFile(file, imageType, signatureId);

      // Stocker l'URL publique et la clé Cloudflare
      updateSignatureData(field, result.url);
      updateSignatureData(field + "Key", result.key);

      toast.success("Image uploadée avec succès vers Cloudflare");
    } catch (error) {
      console.error("❌ Erreur upload Cloudflare:", error);
      toast.error("Erreur lors de l'upload: " + error.message);
    }
  };

  return (
    <div className="rounded-lg border w-full">
      <div className="bg-[#171717] text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm">Nouveau message</span>
          {isEditMode && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Modification
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCopySignature}
          disabled={isCopying}
          className="text-xs font-normal cursor-pointer"
        >
          {isCopied ? (
            <Check className="w-3 h-3 mr-1 text-green-600" />
          ) : (
            <Copy className="w-3 h-3 mr-1" />
          )}
          {isCopying
            ? "Copie en cours..."
            : isCopied
              ? "Copiée !"
              : "Copier la signature"}
        </Button>
      </div>

      <div className="p-4 space-y-3 text-sm dark:bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs dark:text-black">De :</span>
          <span className="text-xs dark:text-black">
            {signatureData.email || "newbi@contact.fr"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs dark:text-black">À :</span>
          <span className="text-xs dark:text-black">sweily@contact.fr</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs dark:text-black">Obj :</span>
          <span className="text-xs dark:text-black">
            Votre demande de renseignements
          </span>
        </div>

        <div className="border-t pt-4 mt-4">
          {/* Signature avec rendu conditionnel selon le template */}
          {(() => {
            const templateProps = {
              signatureData,
              handleFieldChange,
              handleImageChange,
              validatePhone,
              validateEmail,
              validateUrl,
              logoSrc: signatureData.logo,
            };

            if (signatureData.orientation === "horizontal") {
              return <HorizontalSignature {...templateProps} />;
            } else {
              return <VerticalSignature {...templateProps} />;
            }
          })()}
        </div>
      </div>
    </div>
  );
};

// Composant de preview mobile avec signature responsive
const MobilePreview = ({ signatureData }) => {
  return (
    <div className="rounded-lg border w-[320px] h-[600px] bg-white overflow-hidden">
      {/* Header mobile */}
      <div className="bg-[#171717] text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm">Mobile Preview</span>
        </div>
      </div>

      {/* Contenu de l'email mobile */}
      <div className="p-4 bg-white h-full overflow-y-auto">
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-600 mb-2">
            <strong>De:</strong> {signatureData.email || "email@exemple.com"}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            <strong>À:</strong> contact@client.com
          </div>
          <div className="text-xs text-gray-600 mb-3">
            <strong>Objet:</strong> Votre demande de renseignements
          </div>
          <div className="text-sm text-gray-800 mb-4">
            Bonjour,
            <br />
            <br />
            Merci pour votre message. Je reviens vers vous rapidement.
            <br />
            <br />
            Cordialement,
          </div>
        </div>

        {/* Signature mobile - Version compacte et verticale */}
        <div className="border-t pt-4">
          <div
            className="space-y-3"
            style={{
              fontFamily: signatureData.fontFamily || "Arial, sans-serif",
              fontSize: "14px",
            }}
          >
            {/* Photo et nom - Centré pour mobile */}
            <div className="text-center">
              {signatureData.photo && (
                <div className="mb-3">
                  <img
                    src={signatureData.photo}
                    alt="Photo de profil"
                    className="w-16 h-16 rounded-full mx-auto object-cover"
                  />
                </div>
              )}

              {signatureData.fullName && (
                <div
                  className="font-semibold mb-1"
                  style={{
                    fontSize: "16px",
                    color:
                      signatureData.typography?.fullName?.color ||
                      signatureData.primaryColor ||
                      "#171717",
                  }}
                >
                  {signatureData.fullName}
                </div>
              )}

              {signatureData.position && (
                <div
                  className="text-gray-600 mb-1"
                  style={{
                    fontSize: "14px",
                    color:
                      signatureData.typography?.position?.color || "#666666",
                  }}
                >
                  {signatureData.position}
                </div>
              )}

              {signatureData.company && (
                <div
                  className="font-medium mb-3"
                  style={{
                    fontSize: "14px",
                    color:
                      signatureData.typography?.company?.color ||
                      signatureData.primaryColor ||
                      "#2563eb",
                  }}
                >
                  {signatureData.company}
                </div>
              )}
            </div>

            {/* Informations de contact - Compactes pour mobile */}
            <div className="space-y-2 text-sm">
              {signatureData.phone && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-blue-600">📞</span>
                  <a
                    href={`tel:${signatureData.phone}`}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    {signatureData.phone}
                  </a>
                </div>
              )}

              {signatureData.mobile && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-blue-600">📱</span>
                  <a
                    href={`tel:${signatureData.mobile}`}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    {signatureData.mobile}
                  </a>
                </div>
              )}

              {signatureData.email && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-blue-600">✉️</span>
                  <a
                    href={`mailto:${signatureData.email}`}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    {signatureData.email}
                  </a>
                </div>
              )}

              {signatureData.website && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-blue-600">🌐</span>
                  <a
                    href={signatureData.website}
                    className="text-gray-700 hover:text-blue-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {signatureData.website}
                  </a>
                </div>
              )}

              {signatureData.address && (
                <div className="flex items-start justify-center gap-2">
                  <span className="text-blue-600">📍</span>
                  <div className="text-gray-700 text-center text-xs leading-relaxed">
                    {signatureData.address}
                  </div>
                </div>
              )}
            </div>

            {/* Logo entreprise - Centré et plus petit pour mobile */}
            {signatureData.logo && (
              <div className="text-center pt-3 border-t border-gray-200">
                <img
                  src={signatureData.logo}
                  alt="Logo entreprise"
                  className="mx-auto"
                  style={{
                    maxWidth: "120px",
                    maxHeight: "40px",
                    objectFit: "contain",
                  }}
                />
              </div>
            )}

            {/* Réseaux sociaux - Compacts pour mobile */}
            {(signatureData.socialLinks?.linkedin ||
              signatureData.socialLinks?.facebook ||
              signatureData.socialLinks?.twitter ||
              signatureData.socialLinks?.instagram) && (
              <div className="flex justify-center gap-3 pt-3">
                {signatureData.socialLinks?.linkedin && (
                  <a
                    href={signatureData.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={`https://img.icons8.com/color/20/linkedin.png`}
                      alt="LinkedIn"
                      className="w-5 h-5"
                    />
                  </a>
                )}
                {signatureData.socialLinks?.facebook && (
                  <a
                    href={signatureData.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">f</span>
                    </div>
                  </a>
                )}
                {signatureData.socialLinks?.twitter && (
                  <a
                    href={signatureData.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={`https://img.icons8.com/color/20/x.png`}
                      alt="X (Twitter)"
                      className="w-5 h-5"
                    />
                  </a>
                )}
                {signatureData.socialLinks?.instagram && (
                  <a
                    href={signatureData.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={`https://img.icons8.com/fluency/20/instagram-new.png`}
                      alt="Instagram"
                      className="w-5 h-5"
                    />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant principal de la page
export default function NewSignaturePage() {
  const {
    signatureData,
    updateSignatureData,
    isEditMode,
    editingSignatureId,
    loadingSignature,
  } = useSignatureData();


  // Afficher un indicateur de chargement pendant le chargement des données d'édition
  if (isEditMode && loadingSignature) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement de la signature...</p>
        </div>
      </div>
    );
  }

  // Fonction pour changer de template
  const handleTemplateChange = (templateId) => {
    updateSignatureData("template", templateId);
    // Maintenir la compatibilité avec l'ancien système layout
    if (templateId === "horizontal" || templateId === "vertical") {
      updateSignatureData("layout", templateId);
    }
  };

  // Fonction pour mettre à jour le layout personnalisé
  const handleCustomLayoutChange = (newLayout) => {
    updateSignatureData("customLayout", newLayout);
  };

  return (
    <div className="p-12 h-[calc(100vh-64px)] flex items-center justify-center">
      <EmailPreview
        signatureData={signatureData}
        editingSignatureId={editingSignatureId}
        isEditMode={isEditMode}
      />
    </div>
  );
}
