/**
 * Page de création de nouvelle signature email
 * Affiche l'aperçu de la signature avec édition inline et upload d'images
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { toast } from "@/src/components/ui/sonner";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { useSignatureGenerator } from "../hooks/useSignatureGenerator";
import { useCustomSocialIcons } from "../hooks/useCustomSocialIcons";
import { useImageUpload } from "../hooks/useImageUpload";
import "@/src/styles/signature-text-selection.css";
import SignatureTemplate from "../components/preview/SignatureTemplate";
import SignatureEditor from "../components/preview/SignatureEditor";
import { SignatureSidebar } from "@/src/components/signature-sidebar";
import { SignatureToolbar } from "../components/SignatureToolbar";
import SaveSignatureModal from "../components/modals/SaveSignatureModal";

// Aperçu de l'email avec édition inline
const EmailPreview = ({
  signatureData,
  editingSignatureId,
  isEditMode,
  templateId,
  onDragStart,
  isDragging,
}) => {
  const { updateSignatureData } = useSignatureData();
  const { generateHTML: generateSignatureHTMLFromHook } =
    useSignatureGenerator();
  const { uploadImageFile } = useImageUpload();
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
                error,
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

  // plus de gestion d'ordre dynamique des contacts ici

  // Fonction pour générer le HTML du layout horizontal
  // const generateHorizontalHTML = (
  //   signatureData,
  //   primaryColor,
  //   facebookImageUrl = null,
  //   photoSrc,
  //   logoSrc
  // ) => {
  //   // Ensure facebookImageUrl is properly handled
  //   const facebookImgUrl = facebookImageUrl || "";
  //   const imageSize = signatureData.imageSize || 70;
  //   const borderRadius = signatureData.imageShape === "square" ? "8px" : "50%";
  //   const separatorHorizontalWidth =
  //     signatureData.separators?.horizontal?.width || 1;
  //   const spacings = signatureData.spacings || {};
  //   const logoSize = signatureData.logoSize || 60;
  //   return `
  //   <!DOCTYPE html>
  //   <html>
  //   <head>
  //     <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //     <title>Signature Email</title>
  //   </head>
  //   <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  //     <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px !important;">
  //       <tr>
  //         <!-- Photo de profil à gauche -->
  //         ${
  //           photoSrc
  //             ? `
  //           <td style="width: ${signatureData.columnWidths?.photo || 25}%; padding-right: ${spacings.photoBottom || 16}px; vertical-align: top;">
  //             <div style="width: ${imageSize}px; height: ${imageSize}px; border-radius: ${borderRadius}; background: url('${photoSrc}') center center/cover no-repeat; display: block; overflow: hidden; -webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover;"></div>
  //           </td>
  //         `
  //             : ""
  //         }

  //         <!-- Informations empilées verticalement à droite -->
  //         <td style="width: ${signatureData.columnWidths?.content || 75}%; vertical-align: top;">
  //           <!-- Nom et prénom -->
  //           <div style="font-size: ${signatureData.typography?.fullName?.fontSize || 16}px; font-weight: ${signatureData.typography?.fullName?.fontWeight || "bold"}; font-style: ${signatureData.typography?.fullName?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.fullName?.textDecoration || "none"}; color: ${signatureData.typography?.fullName?.color || primaryColor}; line-height: 1.2; margin-bottom: 2px; font-family: ${signatureData.typography?.fullName?.fontFamily || "Arial, sans-serif"};">
  //             ${signatureData.fullName || ""}
  //           </div>

  //           <!-- Profession -->
  //           ${
  //             signatureData.position
  //               ? `
  //             <div style="font-size: ${signatureData.typography?.position?.fontSize || 14}px; font-weight: ${signatureData.typography?.position?.fontWeight || "normal"}; font-style: ${signatureData.typography?.position?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.position?.textDecoration || "none"}; color: ${signatureData.typography?.position?.color || "rgb(102,102,102)"}; margin-bottom: 4px; font-family: ${signatureData.typography?.position?.fontFamily || "Arial, sans-serif"};">
  //               ${signatureData.position}
  //             </div>
  //           `
  //               : ""
  //           }

  //           <!-- Contacts -->
  //           ${
  //             signatureData.phone
  //               ? `
  //             <div style="display: flex; align-items: center; font-size: ${signatureData.typography?.phone?.fontSize || 12}px; font-weight: ${signatureData.typography?.phone?.fontWeight || "normal"}; font-style: ${signatureData.typography?.phone?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.phone?.textDecoration || "none"}; color: ${signatureData.typography?.phone?.color || "rgb(102,102,102)"}; margin-bottom: 1px; font-family: ${signatureData.typography?.phone?.fontFamily || "Arial, sans-serif"};">
  //               <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
  //               ${signatureData.phone}
  //             </div>
  //           `
  //               : ""
  //           }

  //           ${
  //             signatureData.mobile
  //               ? `
  //             <div style="display: flex; align-items: center; font-size: ${signatureData.typography?.mobile?.fontSize || 12}px; font-weight: ${signatureData.typography?.mobile?.fontWeight || "normal"}; font-style: ${signatureData.typography?.mobile?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.mobile?.textDecoration || "none"}; color: ${signatureData.typography?.mobile?.color || "rgb(102,102,102)"}; margin-bottom: 1px; font-family: ${signatureData.typography?.mobile?.fontFamily || "Arial, sans-serif"};">
  //               <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
  //               ${signatureData.mobile}
  //             </div>
  //           `
  //               : ""
  //           }

  //           ${
  //             signatureData.email
  //               ? `
  //             <div style="display: flex; align-items: center; font-size: ${signatureData.typography?.email?.fontSize || 12}px; font-weight: ${signatureData.typography?.email?.fontWeight || "normal"}; font-style: ${signatureData.typography?.email?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.email?.textDecoration || "none"}; color: ${signatureData.typography?.email?.color || "rgb(102,102,102)"}; margin-bottom: 1px; font-family: ${signatureData.typography?.email?.fontFamily || "Arial, sans-serif"};">
  //               <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
  //               <a href="mailto:${signatureData.email}" style="color: ${primaryColor}; text-decoration: none;">${signatureData.email}</a>
  //             </div>
  //           `
  //               : ""
  //           }

  //           ${
  //             signatureData.website
  //               ? `
  //             <div style="display: flex; align-items: center; font-size: ${signatureData.typography?.website?.fontSize || 12}px; font-weight: ${signatureData.typography?.website?.fontWeight || "normal"}; font-style: ${signatureData.typography?.website?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.website?.textDecoration || "none"}; color: ${signatureData.typography?.website?.color || "rgb(102,102,102)"}; margin-bottom: 1px; font-family: ${signatureData.typography?.website?.fontFamily || "Arial, sans-serif"};">
  //               <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
  //               <a href="${signatureData.website.startsWith("http") ? signatureData.website : "https://" + signatureData.website}" target="_blank" style="color: ${primaryColor}; text-decoration: none;">${signatureData.website.replace(/^https?:\/\//, "")}</a>
  //             </div>
  //           `
  //               : ""
  //           }

  //           ${
  //             signatureData.address
  //               ? `
  //             <div style="display: flex; align-items: flex-start; font-size: ${signatureData.typography?.address?.fontSize || 12}px; font-weight: ${signatureData.typography?.address?.fontWeight || "normal"}; font-style: ${signatureData.typography?.address?.fontStyle || "normal"}; text-decoration: ${signatureData.typography?.address?.textDecoration || "none"}; color: ${signatureData.typography?.address?.color || "rgb(102,102,102)"}; margin-bottom: 4px; font-family: ${signatureData.typography?.address?.fontFamily || "Arial, sans-serif"};">
  //               <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px; margin-top: 1px;" />
  //               ${signatureData.address.replace(/\n/g, "<br>")}
  //             </div>
  //           `
  //               : ""
  //           }

  //           <!-- Logo/Nom entreprise -->
  //           ${signatureData.companyName || logoSrc ? "" : ""}
  //         </td>
  //       </tr>

  //       <!-- Séparateur horizontal -->
  //       ${
  //         signatureData.separators?.horizontal?.enabled
  //           ? `
  //       <tr>
  //         <td colspan="2" style="padding: ${spacings.separatorTop || 12}px 0 ${spacings.separatorBottom || 12}px 0;">
  //           <hr style="border: none; border-top: ${signatureData.separators?.horizontal?.width || 1}px solid ${signatureData.separators?.horizontal?.color || "#e0e0e0"}; border-radius: ${signatureData.separators?.horizontal?.radius || 0}px; margin: 0; width: 100%;" />
  //         </td>
  //       </tr>
  //       `
  //           : ""
  //       }

  //       <!-- Logo entreprise après le séparateur -->
  //       ${
  //         logoSrc
  //           ? `
  //       <tr>
  //         <td colspan="2" style="text-align: left;">
  //           <img src="${logoSrc}" alt="Logo entreprise" style="width: ${logoSize}px; height: auto; max-height: ${logoSize}px; object-fit: contain;" />
  //         </td>
  //       </tr>
  //       `
  //           : ""
  //       }

  //       <!-- Logos sociaux -->
  //       ${
  //         signatureData.socialLinks?.linkedin ||
  //         signatureData.socialLinks?.facebook ||
  //         signatureData.socialLinks?.twitter ||
  //         signatureData.socialLinks?.instagram
  //           ? `
  //       <tr>
  //         <td colspan="2" style="padding: ${spacings.separatorBottom || 15}px 0 0 0; text-align: left;">
  //           <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
  //             <tr>
  //               ${
  //                 signatureData.socialLinks?.linkedin
  //                   ? `
  //               <td style="padding-right: 8px;">
  //                 <a href="${signatureData.socialLinks.linkedin}" target="_blank" rel="noopener noreferrer">
  //                   ${
  //                     signatureData.socialBackground?.enabled
  //                       ? `
  //                   <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || "#f3f4f6"}; border-radius: ${signatureData.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: 6px;">
  //                     <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/linkedin.png" alt="LinkedIn" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
  //                   </div>
  //                   `
  //                       : `
  //                   <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/linkedin.png" alt="LinkedIn" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
  //                   `
  //                   }
  //                 </a>
  //               </td>
  //               `
  //                   : ""
  //               }
  //               ${
  //                 signatureData.socialLinks?.facebook
  //                   ? `
  //               <td style="padding-right: 8px;">
  //                 <a href="${signatureData.socialLinks.facebook}" target="_blank" rel="noopener noreferrer">
  //                   ${
  //                     signatureData.socialBackground?.enabled
  //                       ? `
  //                   <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || "#f3f4f6"}; border-radius: ${signatureData.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: 6px;">
  //                     ${
  //                       facebookImgUrl
  //                         ? `
  //                     <img src="${facebookImgUrl}" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
  //                     `
  //                         : `
  //                     <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/facebook.png" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
  //                     `
  //                     }
  //                   </div>
  //                   `
  //                       : `
  //                   ${
  //                     facebookImgUrl
  //                       ? `
  //                   <img src="${facebookImgUrl}" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
  //                   `
  //                       : `
  //                   <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/facebook.png" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
  //                   `
  //                   }
  //                   `
  //                   }
  //                 </a>
  //               </td>
  //               `
  //                   : ""
  //               }
  //               ${
  //                 signatureData.socialLinks?.twitter
  //                   ? `
  //               <td style="padding-right: 8px;">
  //                 <a href="${signatureData.socialLinks.twitter}" target="_blank" rel="noopener noreferrer">
  //                   ${
  //                     signatureData.socialBackground?.enabled
  //                       ? `
  //                   <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || "#f3f4f6"}; border-radius: ${signatureData.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: 6px;">
  //                     <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/x.png" alt="X (Twitter)" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
  //                   </div>
  //                   `
  //                       : `
  //                   <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/x.png" alt="X (Twitter)" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
  //                   `
  //                   }
  //                 </a>
  //               </td>
  //               `
  //                   : ""
  //               }
  //               ${
  //                 signatureData.socialLinks?.instagram
  //                   ? `
  //               <td>
  //                 <a href="${signatureData.socialLinks.instagram}" target="_blank" rel="noopener noreferrer">
  //                   ${
  //                     signatureData.socialBackground?.enabled
  //                       ? `
  //                   <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || "#f3f4f6"}; border-radius: ${signatureData.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: 6px;">
  //                     <img src="https://img.icons8.com/fluency/${signatureData.socialSize || 24}/instagram-new.png" alt="Instagram" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
  //                   </div>
  //                   `
  //                       : `
  //                   <img src="https://img.icons8.com/fluency/${signatureData.socialSize || 24}/instagram-new.png" alt="Instagram" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
  //                   `
  //                   }
  //                 </a>
  //               </td>
  //               `
  //                   : ""
  //               }
  //             </tr>
  //           </table>
  //         </td>
  //       </tr>
  //       `
  //           : ""
  //       }
  //     </table>
  //   </body>
  //   </html>
  // `;
  // };

  //   const generateHorizontalHTML = (
  //   signatureData,
  //   primaryColor,
  //   facebookImageUrl = null,
  //   photoSrc,
  //   logoSrc
  // ) => {
  //   const facebookImgUrl = facebookImageUrl || "";
  //   const imageSize = signatureData.imageSize || 70;
  //   const borderRadius = signatureData.imageShape === "square" ? "8px" : "50%";
  //   const separatorHorizontalWidth =
  //     signatureData.separators?.horizontal?.width || 1;
  //   const separatorHorizontalColor =
  //     signatureData.separators?.horizontal?.color || "#e0e0e0";
  //   const spacings = signatureData.spacings || {};
  //   const logoSize = signatureData.logoSize || 60;

  //   const mainFontFamily =
  //     signatureData.typography?.baseFontFamily || "Arial, sans-serif";

  //   // Petit helper pour une ligne "icône + texte" compatible email
  //   const renderIconRow = (iconUrl, alt, text, style = "") => {
  //     if (!text) return "";
  //     return `
  //       <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin:0; padding:0;">
  //         <tr>
  //           <td style="padding:0; padding-right:8px; vertical-align:middle;">
  //             <img src="${iconUrl}" alt="${alt}" width="12" height="12" style="display:block; border:0;" />
  //           </td>
  //           <td style="padding:0; vertical-align:middle; font-size:12px; color:#666666; font-family:${mainFontFamily}; ${style}">
  //             ${text}
  //           </td>
  //         </tr>
  //       </table>
  //     `;
  //   };

  //   // Typo helpers
  //   const fullNameStyle = `
  //     font-size:${signatureData.typography?.fullName?.fontSize || 16}px;
  //     font-weight:${signatureData.typography?.fullName?.fontWeight || "bold"};
  //     font-style:${signatureData.typography?.fullName?.fontStyle || "normal"};
  //     text-decoration:${signatureData.typography?.fullName?.textDecoration || "none"};
  //     color:${signatureData.typography?.fullName?.color || primaryColor};
  //     line-height:1.2;
  //     font-family:${signatureData.typography?.fullName?.fontFamily || mainFontFamily};
  //   `;

  //   const positionStyle = `
  //     font-size:${signatureData.typography?.position?.fontSize || 14}px;
  //     font-weight:${signatureData.typography?.position?.fontWeight || "normal"};
  //     font-style:${signatureData.typography?.position?.fontStyle || "normal"};
  //     text-decoration:${signatureData.typography?.position?.textDecoration || "none"};
  //     color:${signatureData.typography?.position?.color || "rgb(102,102,102)"};
  //     font-family:${signatureData.typography?.position?.fontFamily || mainFontFamily};
  //   `;

  //   const contactBaseStyle = (key) => `
  //     font-size:${signatureData.typography?.[key]?.fontSize || 12}px;
  //     font-weight:${signatureData.typography?.[key]?.fontWeight || "normal"};
  //     font-style:${signatureData.typography?.[key]?.fontStyle || "normal"};
  //     text-decoration:${signatureData.typography?.[key]?.textDecoration || "none"};
  //     color:${signatureData.typography?.[key]?.color || "rgb(102,102,102)"};
  //     font-family:${signatureData.typography?.[key]?.fontFamily || mainFontFamily};
  //   `;

  //   return `
  // <table cellpadding="0" cellspacing="0" border="0" width="500" style="border-collapse:collapse; max-width:500px;">
  //   <tr>
  //     ${
  //       photoSrc
  //         ? `
  //     <!-- Colonne photo -->
  //     <td style="width:${signatureData.columnWidths?.photo || 25}%; padding-right:${spacings.photoRight || 16}px; vertical-align:top;">
  //       <img src="${photoSrc}"
  //            alt="${signatureData.fullName || "Photo"}"
  //            width="${imageSize}"
  //            height="${imageSize}"
  //            style="display:block; border-radius:${borderRadius}; border:0;" />
  //     </td>
  //     `
  //         : ""
  //     }

  //     <!-- Colonne contenu -->
  //     <td style="width:${signatureData.columnWidths?.content || 75}%; vertical-align:top;">

  //       <!-- Nom -->
  //       ${
  //         signatureData.fullName
  //           ? `
  //       <div style="${fullNameStyle} margin:0; padding:0; margin-bottom:2px;">
  //         ${signatureData.fullName}
  //       </div>
  //       `
  //           : ""
  //       }

  //       <!-- Poste -->
  //       ${
  //         signatureData.position
  //           ? `
  //       <div style="${positionStyle} margin:0; padding:0; margin-bottom:4px;">
  //         ${signatureData.position}
  //       </div>
  //       `
  //           : ""
  //       }

  //       <!-- Coordonnées -->
  //       <div style="margin:0; padding:0;">

  //         ${
  //           signatureData.phone
  //             ? renderIconRow(
  //                 "https://cdn-icons-png.flaticon.com/512/126/126509.png",
  //                 "Téléphone",
  //                 signatureData.phone,
  //                 contactBaseStyle("phone")
  //               )
  //             : ""
  //         }

  //         ${
  //           signatureData.mobile
  //             ? renderIconRow(
  //                 "https://cdn-icons-png.flaticon.com/512/597/597177.png",
  //                 "Mobile",
  //                 signatureData.mobile,
  //                 contactBaseStyle("mobile")
  //               )
  //             : ""
  //         }

  //         ${
  //           signatureData.email
  //             ? renderIconRow(
  //                 "https://cdn-icons-png.flaticon.com/512/561/561127.png",
  //                 "Email",
  //                 `<a href="mailto:${signatureData.email}" style="color:inherit; text-decoration:none;">${signatureData.email}</a>`,
  //                 contactBaseStyle("email")
  //               )
  //             : ""
  //         }

  //         ${
  //           signatureData.website
  //             ? renderIconRow(
  //                 "https://cdn-icons-png.flaticon.com/512/535/535193.png",
  //                 "Site web",
  //                 `<a href="${signatureData.website}" style="color:${primaryColor}; text-decoration:none;" target="_blank" rel="noopener noreferrer">${signatureData.website}</a>`,
  //                 contactBaseStyle("website")
  //               )
  //             : ""
  //         }

  //         ${
  //           signatureData.address
  //             ? renderIconRow(
  //                 "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  //                 "Adresse",
  //                 signatureData.address,
  //                 contactBaseStyle("address")
  //               )
  //             : ""
  //         }

  //       </div>

  //       <!-- Séparateur horizontal -->
  //       ${
  //         signatureData.separators?.horizontal?.enabled !== false
  //           ? `
  //       <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; margin-top:${spacings.separatorTop || 8}px; margin-bottom:${spacings.separatorBottom || 8}px;">
  //         <tr>
  //           <td style="border-top:${separatorHorizontalWidth}px solid ${separatorHorizontalColor}; font-size:0; line-height:0;">
  //             &nbsp;
  //           </td>
  //         </tr>
  //       </table>
  //       `
  //           : ""
  //       }

  //       <!-- Logo + réseaux sociaux -->
  //       <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  //         <tr>
  //           ${
  //             logoSrc
  //               ? `
  //           <td style="padding:0; padding-right:${spacings.logoRight || 12}px; vertical-align:middle;">
  //             <img src="${logoSrc}" alt="Logo" width="${logoSize}" style="display:block; border:0; height:auto;" />
  //           </td>
  //           `
  //               : ""
  //           }

  //           ${
  //             signatureData.socialLinks
  //               ? `
  //           <td style="padding:0; vertical-align:middle;">
  //             <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  //               <tr>
  //                 ${
  //                   signatureData.socialLinks.facebook
  //                     ? `
  //                 <td style="padding:0; padding-right:8px;">
  //                   <a href="${signatureData.socialLinks.facebook}" target="_blank" rel="noopener noreferrer">
  //                     ${
  //                       signatureData.socialBackground?.enabled
  //                         ? `
  //                     <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  //                       <tr>
  //                         <td style="background-color:${
  //                           signatureData.socialBackground?.color || "#f3f4f6"
  //                         }; border-radius:${
  //                             signatureData.socialBackground?.shape === "round"
  //                               ? "50%"
  //                               : "4px"
  //                           }; padding:6px;">
  //                           <img src="${
  //                             facebookImgUrl ||
  //                             `https://img.icons8.com/color/${
  //                               signatureData.socialSize || 24
  //                             }/facebook.png`
  //                           }"
  //                                alt="Facebook"
  //                                width="${
  //                                  signatureData.socialSize || 24
  //                                }"
  //                                height="${
  //                                  signatureData.socialSize || 24
  //                                }"
  //                                style="display:block; border:0;" />
  //                         </td>
  //                       </tr>
  //                     </table>
  //                     `
  //                         : `
  //                     <img src="${
  //                       facebookImgUrl ||
  //                       `https://img.icons8.com/color/${
  //                         signatureData.socialSize || 24
  //                       }/facebook.png`
  //                     }"
  //                          alt="Facebook"
  //                          width="${signatureData.socialSize || 24}"
  //                          height="${signatureData.socialSize || 24}"
  //                          style="display:block; border:0;" />
  //                     `
  //                     }
  //                   </a>
  //                 </td>
  //                 `
  //                     : ""
  //                 }

  //                 ${
  //                   signatureData.socialLinks.twitter
  //                     ? `
  //                 <td style="padding:0; padding-right:8px;">
  //                   <a href="${signatureData.socialLinks.twitter}" target="_blank" rel="noopener noreferrer">
  //                     ${
  //                       signatureData.socialBackground?.enabled
  //                         ? `
  //                     <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  //                       <tr>
  //                         <td style="background-color:${
  //                           signatureData.socialBackground?.color || "#f3f4f6"
  //                         }; border-radius:${
  //                             signatureData.socialBackground?.shape === "round"
  //                               ? "50%"
  //                               : "4px"
  //                           }; padding:6px;">
  //                           <img src="https://img.icons8.com/color/${
  //                             signatureData.socialSize || 24
  //                           }/x.png"
  //                                alt="X (Twitter)"
  //                                width="${
  //                                  signatureData.socialSize || 24
  //                                }"
  //                                height="${
  //                                  signatureData.socialSize || 24
  //                                }"
  //                                style="display:block; border:0;" />
  //                         </td>
  //                       </tr>
  //                     </table>
  //                     `
  //                         : `
  //                     <img src="https://img.icons8.com/color/${
  //                       signatureData.socialSize || 24
  //                     }/x.png"
  //                          alt="X (Twitter)"
  //                          width="${signatureData.socialSize || 24}"
  //                          height="${signatureData.socialSize || 24}"
  //                          style="display:block; border:0;" />
  //                     `
  //                     }
  //                   </a>
  //                 </td>
  //                 `
  //                     : ""
  //                 }

  //                 ${
  //                   signatureData.socialLinks.instagram
  //                     ? `
  //                 <td style="padding:0;">
  //                   <a href="${signatureData.socialLinks.instagram}" target="_blank" rel="noopener noreferrer">
  //                     ${
  //                       signatureData.socialBackground?.enabled
  //                         ? `
  //                     <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  //                       <tr>
  //                         <td style="background-color:${
  //                           signatureData.socialBackground?.color || "#f3f4f6"
  //                         }; border-radius:${
  //                             signatureData.socialBackground?.shape === "round"
  //                               ? "50%"
  //                               : "4px"
  //                           }; padding:6px;">
  //                           <img src="https://img.icons8.com/fluency/${
  //                             signatureData.socialSize || 24
  //                           }/instagram-new.png"
  //                                alt="Instagram"
  //                                width="${
  //                                  signatureData.socialSize || 24
  //                                }"
  //                                height="${
  //                                  signatureData.socialSize || 24
  //                                }"
  //                                style="display:block; border:0;" />
  //                         </td>
  //                       </tr>
  //                     </table>
  //                     `
  //                         : `
  //                     <img src="https://img.icons8.com/fluency/${
  //                       signatureData.socialSize || 24
  //                     }/instagram-new.png"
  //                          alt="Instagram"
  //                          width="${signatureData.socialSize || 24}"
  //                          height="${signatureData.socialSize || 24}"
  //                          style="display:block; border:0;" />
  //                     `
  //                     }
  //                   </a>
  //                 </td>
  //                 `
  //                     : ""
  //                 }
  //               </tr>
  //             </table>
  //           </td>
  //           `
  //               : ""
  //           }
  //         </tr>
  //       </table>

  //     </td>
  //   </tr>
  // </table>
  //   `;
  // };

  // const generateHorizontalHTML = (
  //   signatureData,
  //   primaryColor,
  //   photoSrc,
  //   logoSrc
  // ) => {
  //   const imageSize = signatureData.imageSize || 70;
  //   const borderRadius = signatureData.imageShape === "square" ? "8px" : "50%";
  //   const mainFontFamily =
  //     signatureData.typography?.baseFontFamily || "Arial, sans-serif";
  //   const layoutWidth = signatureData.layoutWidth || 600;

  //   const fullName = signatureData.fullName || "";
  //   const position = signatureData.position || "";

  //   const phone = signatureData.phone || "";
  //   const mobile = signatureData.mobile || "";
  //   const email = signatureData.email || "";
  //   const website = signatureData.website || "";
  //   const address = signatureData.address || "";

  //   const separatorColor =
  //     signatureData.separators?.horizontal?.color || "#ff2d54";
  //   const separatorWidth =
  //     signatureData.separators?.horizontal?.width || 1;
  //   const verticalSeparatorColor =
  //     signatureData.separators?.vertical?.color || primaryColor || "#604520";

  //   // Icônes - tu peux les rendre configurables via signatureData.icons.*
  //   const icons = {
  //     phone:
  //       signatureData.icons?.phone ||
  //       "https://ton-cdn.com/icons/smartphone.png",
  //     mobile:
  //       signatureData.icons?.mobile ||
  //       "https://ton-cdn.com/icons/phone.png",
  //     email:
  //       signatureData.icons?.email ||
  //       "https://ton-cdn.com/icons/mail.png",
  //     website:
  //       signatureData.icons?.website ||
  //       "https://ton-cdn.com/icons/globe.png",
  //     address:
  //       signatureData.icons?.address ||
  //       "https://ton-cdn.com/icons/map-pin.png",
  //   };

  //   const sanitizeTelHref = (num) =>
  //     num ? num.replace(/\s+/g, "") : "";

  //   const phoneHref = sanitizeTelHref(phone);
  //   const mobileHref = sanitizeTelHref(mobile);

  //   const renderContactRow = (iconUrl, alt, contentHtml) => {
  //     if (!contentHtml) return "";
  //     return `
  //       <tr>
  //         <td colspan="2" style="padding-bottom:8px">
  //           <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
  //             <tbody>
  //               <tr>
  //                 <td style="padding-right:8px;vertical-align:middle">
  //                   <img src="${iconUrl}"
  //                        alt="${alt}"
  //                        width="16"
  //                        height="16"
  //                        style="width:16px;height:16px;display:block;border:0;">
  //                 </td>
  //                 <td style="font-size:12px;color:rgb(102,102,102);vertical-align:middle;font-family:${mainFontFamily}">
  //                   ${contentHtml}
  //                 </td>
  //               </tr>
  //             </tbody>
  //           </table>
  //         </td>
  //       </tr>
  //     `;
  //   };

  //   const phoneHtml =
  //     phone && phoneHref
  //       ? `<a href="tel:${phoneHref}" style="color:rgb(102,102,102);text-decoration:none;" target="_blank">${phone}</a>`
  //       : "";

  //   const mobileHtml =
  //     mobile && mobileHref
  //       ? `<a href="tel:${mobileHref}" style="color:rgb(102,102,102);text-decoration:none;" target="_blank">${mobile}</a>`
  //       : "";

  //   const emailHtml = email
  //     ? `<a href="mailto:${email}" style="color:rgb(102,102,102);text-decoration:none;" target="_blank">${email}</a>`
  //     : "";

  //   const websiteHtml = website
  //     ? `<a href="${website}" style="color:rgb(102,102,102);text-decoration:none;" target="_blank">${website.replace(
  //         /^https?:\/\//,
  //         ""
  //       )}</a>`
  //     : "";

  //   const addressHtml = address || "";

  //   // Bloc photo + nom + poste
  //   const leftColumn = `
  //     <td style="vertical-align:top;padding-right:8px">
  //       <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:auto">
  //         <tbody>

  //           ${
  //             photoSrc
  //               ? `
  //           <tr>
  //             <td style="padding-bottom:8px">
  //               <table cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0;border-collapse:collapse;">
  //                 <tbody>
  //                   <tr>
  //                     <td width="${imageSize}" height="${imageSize}" style="width:${imageSize}px;height:${imageSize}px;overflow:hidden;border-radius:${borderRadius};">
  //                       <img src="${photoSrc}"
  //                            alt="${fullName || "Photo de profil"}"
  //                            width="${imageSize}"
  //                            height="${imageSize}"
  //                            style="width:${imageSize}px;height:${imageSize}px;min-width:${imageSize}px;min-height:${imageSize}px;display:block;border:0;margin:0;padding:0;border-radius:${borderRadius};">
  //                     </td>
  //                   </tr>
  //                 </tbody>
  //               </table>
  //             </td>
  //           </tr>
  //           `
  //               : ""
  //           }

  //           ${
  //             fullName
  //               ? `
  //           <tr>
  //             <td colspan="2" style="padding-bottom:8px">
  //               <div style="font-size:16px;color:rgb(23,23,23);line-height:1.2;font-family:${mainFontFamily}">
  //                 ${fullName}
  //               </div>
  //             </td>
  //           </tr>
  //           `
  //               : ""
  //           }

  //           ${
  //             position
  //               ? `
  //           <tr>
  //             <td colspan="2" style="padding-bottom:8px">
  //               <div style="font-size:14px;color:rgb(102,102,102);font-family:${mainFontFamily}">
  //                 ${position}
  //               </div>
  //             </td>
  //           </tr>
  //           `
  //               : ""
  //           }

  //         </tbody>
  //       </table>
  //     </td>
  //   `;

  //   // Séparateur vertical
  //   const verticalSeparator = `
  //     <td style="width:8px">&nbsp;</td>
  //     <td style="width:1px;background-color:${verticalSeparatorColor};border-radius:0px;padding:0px;font-size:1px;line-height:1px;vertical-align:top;height:100%;min-height:200px">&nbsp;</td>
  //     <td style="width:8px">&nbsp;</td>
  //   `;

  //   // Colonne droite : coordonnées
  //   const rightColumn = `
  //     <td style="vertical-align:top;padding-left:8px">
  //       <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:auto">
  //         <tbody>
  //           ${renderContactRow(icons.phone, "Téléphone", phoneHtml)}
  //           ${renderContactRow(icons.mobile, "Mobile", mobileHtml)}
  //           ${renderContactRow(icons.email, "Email", emailHtml)}
  //           ${renderContactRow(icons.website, "Site web", websiteHtml)}

  //           ${
  //             addressHtml
  //               ? `
  //           <tr>
  //             <td colspan="2" style="padding-bottom:8px">
  //               <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
  //                 <tbody>
  //                   <tr>
  //                     <td style="padding-right:8px;vertical-align:top">
  //                       <img src="${icons.address}"
  //                            alt="Adresse"
  //                            width="16"
  //                            height="16"
  //                            style="width:16px;height:16px;display:block;margin-top:1px;border:0;">
  //                     </td>
  //                     <td style="font-size:12px;color:rgb(102,102,102);vertical-align:top;font-family:${mainFontFamily}">
  //                       ${addressHtml}
  //                     </td>
  //                   </tr>
  //                 </tbody>
  //               </table>
  //             </td>
  //           </tr>
  //           `
  //               : ""
  //           }

  //         </tbody>
  //       </table>
  //     </td>
  //   `;

  //   // Séparateur horizontal + logo
  //   const bottomSeparatorAndLogo = `
  //     <tr>
  //       <td colspan="5" style="padding-top:8px;padding-bottom:8px">
  //         <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%">
  //           <tbody>
  //             <tr>
  //               <td style="border-top:${separatorWidth}px solid ${separatorColor};line-height:1px;font-size:1px">&nbsp;</td>
  //             </tr>
  //           </tbody>
  //         </table>
  //       </td>
  //     </tr>

  //     ${
  //       logoSrc
  //         ? `
  //     <tr>
  //       <td colspan="5" style="padding:8px 0px 0px">
  //         <img src="${logoSrc}"
  //              alt="${signatureData.companyName || "Logo entreprise"}"
  //              style="width:${signatureData.logoSize || 60}px;height:auto;max-height:${signatureData.logoSize || 60}px;display:block;margin:0;padding:0;font-size:0;line-height:0;border:0;">
  //       </td>
  //     </tr>
  //     `
  //         : ""
  //     }
  //   `;

  //   // Table principale (fragment uniquement, pas de <html>, <body>, etc.)
  //   return `
  // <table cellpadding="0" cellspacing="0" border="0" width="${layoutWidth}" style="border-collapse:collapse;max-width:${layoutWidth}px;font-family:${mainFontFamily}">
  //   <tbody>
  //     <tr>
  //       ${leftColumn}
  //       ${verticalSeparator}
  //       ${rightColumn}
  //     </tr>
  //     ${bottomSeparatorAndLogo}
  //   </tbody>
  // </table>
  //   `.trim();
  // };

  const generateHorizontalHTML = (
    signatureData,
    primaryColor,
    photoSrc,
    logoSrc,
  ) => {
    const imageSize = signatureData.imageSize || 70;
    const borderRadius = signatureData.imageShape === "square" ? "8px" : "50%";
    const mainFontFamily =
      signatureData.typography?.baseFontFamily || "Arial, sans-serif";
    const layoutWidth = signatureData.layoutWidth || 600;

    const fullName = signatureData.fullName || "";
    const position = signatureData.position || "";

    const phone = signatureData.phone || "";
    const mobile = signatureData.mobile || "";
    const email = signatureData.email || "";
    const website = signatureData.website || "";
    const address = signatureData.address || "";

    const separatorColor =
      signatureData.separators?.horizontal?.color || "#ff2d54";
    const separatorWidth = signatureData.separators?.horizontal?.width || 1;
    const verticalSeparatorColor =
      signatureData.separators?.vertical?.color || primaryColor || "#604520";

    // Couleur de texte par défaut (configurable si tu veux plus tard)
    const baseTextColor = signatureData.colors?.text || "#444444";
    const nameColor = signatureData.colors?.name || "#171717";
    const roleColor = signatureData.colors?.role || baseTextColor;

    // Icônes
    const icons = {
      phone:
        signatureData.icons?.phone ||
        "https://ton-cdn.com/icons/smartphone.png",
      mobile:
        signatureData.icons?.mobile || "https://ton-cdn.com/icons/phone.png",
      email: signatureData.icons?.email || "https://ton-cdn.com/icons/mail.png",
      website:
        signatureData.icons?.website || "https://ton-cdn.com/icons/globe.png",
      address:
        signatureData.icons?.address || "https://ton-cdn.com/icons/map-pin.png",
    };

    const sanitizeTelHref = (num) => (num ? num.replace(/\s+/g, "") : "");

    const phoneHref = sanitizeTelHref(phone);
    const mobileHref = sanitizeTelHref(mobile);

    const renderContactRow = (iconUrl, alt, contentHtml) => {
      if (!contentHtml) return "";
      return `
      <tr>
        <td colspan="2" style="padding-bottom:8px">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
            <tbody>
              <tr>
                <td style="padding-right:8px;vertical-align:middle">
                  <img src="${iconUrl}"
                       alt="${alt}"
                       width="16"
                       height="16"
                       style="width:16px;height:16px;display:block;border:0;">
                </td>
                <td style="font-size:12px;color:${baseTextColor};vertical-align:middle;font-family:${mainFontFamily}">
                  ${contentHtml}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    `;
    };

    const linkColor = baseTextColor;

    const phoneHtml =
      phone && phoneHref
        ? `<a href="tel:${phoneHref}" style="color:${linkColor};text-decoration:none;" target="_blank">${phone}</a>`
        : "";

    const mobileHtml =
      mobile && mobileHref
        ? `<a href="tel:${mobileHref}" style="color:${linkColor};text-decoration:none;" target="_blank">${mobile}</a>`
        : "";

    const emailHtml = email
      ? `<a href="mailto:${email}" style="color:${linkColor};text-decoration:none;" target="_blank">${email}</a>`
      : "";

    const websiteHtml = website
      ? `<a href="${website}" style="color:${linkColor};text-decoration:none;" target="_blank">${website.replace(
          /^https?:\/\//,
          "",
        )}</a>`
      : "";

    const addressHtml = address || "";

    // Bloc photo + nom + poste
    const leftColumn = `
    <td style="padding-right:8px">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:auto">
        <tbody>

          ${
            photoSrc
              ? `
          <tr>
            <td style="padding-bottom:8px">
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0;border-collapse:collapse;">
                <tbody>
                  <tr>
                    <td width="${imageSize}" height="${imageSize}" style="width:${imageSize}px;height:${imageSize}px;overflow:hidden;border-radius:${borderRadius};">
                      <img src="${photoSrc}"
                           alt="${fullName || "Photo de profil"}"
                           width="${imageSize}"
                           height="${imageSize}"
                           style="width:${imageSize}px;height:${imageSize}px;min-width:${imageSize}px;min-height:${imageSize}px;display:block;border:0;margin:0;padding:0;border-radius:${borderRadius};">
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
            fullName
              ? `
          <tr>
            <td colspan="2" style="padding-bottom:8px">
              <div style="font-size:16px;color:${nameColor};line-height:1.2;font-family:${mainFontFamily}">
                ${fullName}
              </div>
            </td>
          </tr>
          `
              : ""
          }

          ${
            position
              ? `
          <tr>
            <td colspan="2" style="padding-bottom:8px">
              <div style="font-size:14px;color:${roleColor};font-family:${mainFontFamily}">
                ${position}
              </div>
            </td>
          </tr>
          `
              : ""
          }

        </tbody>
      </table>
    </td>
  `;

    // Séparateur vertical
    const verticalSeparator = `
    <td style="width:8px">&nbsp;</td>
    <td style="width:1px;background-color:${verticalSeparatorColor};border-radius:0px;padding:0px;font-size:1px;line-height:1px;vertical-align:top;height:100%;min-height:200px">
      &nbsp;
    </td>
    <td style="width:8px">&nbsp;</td>
  `;

    // Colonne droite : coordonnées
    const rightColumn = `
    <td style="vertical-align:top;padding-left:8px">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:auto">
        <tbody>
          ${renderContactRow(icons.phone, "Téléphone", phoneHtml)}
          ${renderContactRow(icons.mobile, "Mobile", mobileHtml)}
          ${renderContactRow(icons.email, "Email", emailHtml)}
          ${renderContactRow(icons.website, "Site web", websiteHtml)}

          ${
            addressHtml
              ? `
          <tr>
            <td colspan="2" style="padding-bottom:8px">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
                <tbody>
                  <tr>
                    <td style="padding-right:8px;vertical-align:top">
                      <img src="${icons.address}"
                           alt="Adresse"
                           width="16"
                           height="16"
                           style="width:16px;height:16px;display:block;margin-top:1px;border:0;">
                    </td>
                    <td style="font-size:12px;color:${baseTextColor};vertical-align:top;font-family:${mainFontFamily}">
                      ${addressHtml}
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
  `;

    // Séparateur horizontal + logo
    const bottomSeparatorAndLogo = `
    <tr>
      <td colspan="5" style="padding-top:8px;padding-bottom:8px">
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%">
          <tbody>
            <tr>
              <td style="border-top:${separatorWidth}px solid ${separatorColor};line-height:1px;font-size:1px">
                &nbsp;
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>

    ${
      logoSrc
        ? `
    <tr>
      <td colspan="5" style="padding:8px 0px 0px">
        <img src="${logoSrc}"
             alt="${signatureData.companyName || "Logo entreprise"}"
             style="width:${signatureData.logoSize || 60}px;height:auto;max-height:${signatureData.logoSize || 60}px;display:block;margin:0;padding:0;font-size:0;line-height:0;border:0;">
      </td>
    </tr>
    `
        : ""
    }
  `;

    // Table principale : carte blanche, couleurs inchangées quel que soit le thème
    return `
<table cellpadding="0" cellspacing="0" border="0"
       width="${layoutWidth}" bgcolor="#ffffff"
       style="border-collapse:collapse;max-width:${layoutWidth}px;font-family:${mainFontFamily};background-color:#ffffff;border:1px solid #e0e0e0;">
  <tbody>
    <tr>
      ${leftColumn}
      ${verticalSeparator}
      ${rightColumn}
    </tr>
    ${bottomSeparatorAndLogo}
  </tbody>
</table>
  `.trim();
  };

  // Fonction pour copier la signature dans le presse-papier
  const handleCopySignature = async () => {
    setIsCopying(true);

    try {
      // Générer le HTML optimisé pour Gmail (même générateur que la preview)
      const html = generateSignatureHTMLFromHook();

      if (!html || html.trim() === "") {
        toast.error("Erreur: signature vide");
        setIsCopying(false);
        return;
      }

      // Copier dans le presse-papiers avec ClipboardItem (HTML + texte)
      if (typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([html.replace(/<[^>]*>/g, "")], {
              type: "text/plain",
            }),
          }),
        ]);
        toast.success("Signature copiée avec succès !");
      } else {
        // Fallback pour les navigateurs qui ne supportent pas ClipboardItem
        await navigator.clipboard.writeText(html);
        toast.success("Signature copiée (texte brut)");
      }

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("❌ Erreur copie signature:", error);
      // Fallback ultime
      try {
        const html = generateSignatureHTMLFromHook();
        await navigator.clipboard.writeText(html);
        toast.success("Signature copiée (texte brut)");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (fallbackError) {
        console.error("❌ Erreur fallback:", fallbackError);
        toast.error("Erreur lors de la copie de la signature");
      }
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
    <div
      className="rounded-2xl border w-[700px] overflow-hidden"
      data-signature-preview
    >
      <div
        className={`bg-[#171717] text-white px-4 py-2 rounded-t-lg flex items-center justify-between ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={onDragStart}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm select-none">Nouveau message</span>
          {isEditMode && (
            <Badge
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              Modification
            </Badge>
          )}
        </div>
        {/* <Button
          size="sm"
          variant="secondary"
          onClick={handleCopySignature}
          disabled={isCopying}
          className="text-xs font-normal cursor-pointer"
          title="Copier la signature"
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
        </Button> */}
      </div>

      <div className="p-4 space-y-3 text-sm bg-[#FAFAFA] dark:bg-white">
        {/* <div className="flex items-center gap-2">
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
        </div> */}

        <div className="pt-4 mt-4 flex justify-start">
          {/* Signature avec système de widgets - drag & drop et sélection */}
          <SignatureEditor
            signatureData={signatureData}
            onImageUpload={async (field, file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                handleFieldChange(field, e.target.result);
              };
              reader.readAsDataURL(file);
            }}
            templateId={templateId}
          />
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

// Niveaux de zoom disponibles
const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];

// Composant principal de la page
export default function NewSignaturePage() {
  const {
    signatureData,
    updateSignatureData,
    resetSignatureData,
    checkAndApplyTemplatePreset,
    isEditMode,
    editingSignatureId,
    loadingSignature,
  } = useSignatureData();

  const { copyToClipboard } = useSignatureGenerator();
  const [isCopying, setIsCopying] = React.useState(false);

  // Appliquer le preset du template depuis sessionStorage au montage de la page
  React.useEffect(() => {
    if (!isEditMode) {
      checkAndApplyTemplatePreset();
    }
  }, [isEditMode, checkAndApplyTemplatePreset]);

  // États pour le zoom et le pan
  const [zoom, setZoom] = React.useState(100);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const [copySuccess, setCopySuccess] = React.useState(false);
  const panStartRef = React.useRef({ x: 0, y: 0 });
  const canvasRef = React.useRef(null);

  // Gestion du zoom (pinch) et du pan (deux doigts) avec le trackpad
  React.useEffect(() => {
    const handleWheel = (e) => {
      // Pinch zoom (Ctrl + scroll ou gesture trackpad)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        setZoom((prevZoom) => {
          const currentIndex = ZOOM_LEVELS.indexOf(prevZoom);
          const newIndex = Math.max(
            0,
            Math.min(ZOOM_LEVELS.length - 1, currentIndex + delta),
          );
          return ZOOM_LEVELS[newIndex];
        });
      } else {
        // Pan avec deux doigts (scroll normal sur trackpad)
        e.preventDefault();
        setPan((prevPan) => ({
          x: prevPan.x - e.deltaX,
          y: prevPan.y - e.deltaY,
        }));
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  // Gestion de la touche Espace pour le pan
  React.useEffect(() => {
    const isEditableElement = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    };

    const handleKeyDown = (e) => {
      if (e.code === "Space" && !e.repeat) {
        if (isEditableElement(document.activeElement)) return;
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Gestion du pan (déplacement) via Espace + drag ou clic molette
  const handleMouseDown = (e) => {
    if (isSpacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      };
    }
  };

  // Gestion du drag depuis la barre noire "Nouveau message"
  const handleHeaderDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Reset du pan au double-clic sur le canvas (pas sur le bloc)
  const handleDoubleClick = (e) => {
    if (e.target === canvasRef.current) {
      setPan({ x: 0, y: 0 });
      setZoom(100);
    }
  };

  // Afficher un indicateur de chargement pendant le chargement des données d'édition
  if (isEditMode && loadingSignature) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement de la signature...</p>
        </div>
      </div>
    );
  }

  // Note: Le templateId est maintenant toujours défini via le preset (dans use-signature-data.js)
  // ou via les données par défaut. Pas besoin de vérification supplémentaire.

  // Handler pour copier depuis la toolbar
  const handleCopyFromToolbar = async () => {
    setIsCopying(true);
    setCopySuccess(false);
    try {
      const result = await copyToClipboard();
      console.log('[handleCopyFromToolbar] Result:', result);
      if (result.success) {
        setCopySuccess(true);
        // Reset après 2 secondes
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error('[handleCopyFromToolbar] Error:', error);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="flex gap-0 w-full h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-neutral-950 bg-[radial-gradient(circle,#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#404040_1px,transparent_1px)] bg-[size:20px_20px]">
      <div
        ref={canvasRef}
        className={`relative flex-1 p-6 flex items-center justify-center overflow-hidden ${
          isSpacePressed ? "cursor-grab" : ""
        } ${isPanning ? "cursor-grabbing" : ""}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Container zoomable et déplaçable */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
            transformOrigin: "center center",
          }}
        >
          <EmailPreview
            signatureData={signatureData}
            editingSignatureId={editingSignatureId}
            isEditMode={isEditMode}
            templateId={signatureData.templateId || "template1"}
            onDragStart={handleHeaderDragStart}
            isDragging={isPanning}
          />
        </div>

        {/* Barre d'outils flottante */}
        <SignatureToolbar
          onCopy={handleCopyFromToolbar}
          isCopying={isCopying}
          copySuccess={copySuccess}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      </div>

      {/* Modal de sauvegarde */}
      <SaveSignatureModal existingSignatureId={editingSignatureId} />
    </div>
  );
}
