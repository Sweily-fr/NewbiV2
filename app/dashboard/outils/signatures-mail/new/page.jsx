/**
 * Page de création de nouvelle signature email
 * Affiche l'aperçu de la signature avec édition inline et upload d'images
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Copy, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";
import { useImageUpload } from "../hooks/useImageUpload";
import VerticalSignature from "../components/VerticalSignature";
import HorizontalSignature from "../components/HorizontalSignature";
import TemplateObama from "../components/templates/TemplateObama";
import TemplateRangan from "../components/templates/TemplateRangan";
import TemplateShah from "../components/templates/TemplateShah";
import TemplateCustom from "../components/templates/TemplateCustom";
import TemplateSelector from "../components/TemplateSelector";
// CustomSignatureBuilder supprimé - édition maintenant dans le panneau de droite
import SignatureSave from "../components/SignatureSave";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";

// Aperçu de l'email avec édition inline
const EmailPreview = ({ signatureData }) => {
  const { updateSignatureData } = useSignatureData();
  const { uploadImageFile, getImageUrl, isUploading, error } = useImageUpload();
  const [isCopying, setIsCopying] = useState(false);
  const [imageStatus, setImageStatus] = useState({ photo: 'idle', logo: 'idle' });
  const [convertedImages, setConvertedImages] = useState({ photo: null, logo: null });

  // Cache pour éviter les conversions répétées
  const imageCache = useRef(new Map());
  
  // Conversion à la demande uniquement (pas de useEffect automatique)
  
  // Fonction pour récupérer l'URL d'image (Cloudflare ou locale)
  const getImageSrc = async (imageUrl) => {
    console.log('🔍 RÉCUPÉRATION URL IMAGE:');
    console.log('  - URL reçue:', imageUrl);
    console.log('  - Type URL:', typeof imageUrl);
    console.log('  - URL vide?', !imageUrl);
    
    if (!imageUrl) {
      console.log('⚠️ URL image vide ou null - ARRÊT');
      return null;
    }
    
    // Si c'est déjà une URL Cloudflare (https://), on la retourne directement
    if (imageUrl.startsWith('https://')) {
      console.log('✅ URL Cloudflare détectée, utilisation directe');
      return imageUrl;
    }
    
    // Vérifier le cache pour les conversions blob
    if (imageCache.current.has(imageUrl)) {
      console.log('💾 Image trouvée dans le cache:', imageUrl.substring(0, 30) + '...');
      return imageCache.current.get(imageUrl);
    }
    
    // Si c'est déjà une URL publique (http/https), la retourner directement
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('🌐 URL publique détectée:', imageUrl.substring(0, 50) + '...');
      imageCache.current.set(imageUrl, imageUrl);
      return imageUrl;
    }
    
    // Si c'est déjà du base64, le retourner directement
    if (imageUrl.startsWith('data:')) {
      console.log('📄 Base64 détecté, retour direct');
      imageCache.current.set(imageUrl, imageUrl);
      return imageUrl;
    }
    
    try {
      console.log('🔄 Conversion en base64 pour:', imageUrl.substring(0, 50) + '...');
      
      // Vérifier si l'URL blob est valide
      if (!imageUrl.startsWith('blob:')) {
        console.error('❌ URL non reconnue:', imageUrl);
        return null;
      }
      
      // Fetch l'image depuis l'URL blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error('❌ Erreur fetch:', response.status, response.statusText);
        return null;
      }
      
      const blob = await response.blob();
      console.log('📊 Taille du blob:', blob.size, 'bytes, type:', blob.type);
      
      // Vérifier que c'est bien une image
      if (!blob.type.startsWith('image/')) {
        console.error('❌ Le blob n\'est pas une image:', blob.type);
        return null;
      }
      
      // Fonction de conversion avec gestion d'erreur améliorée
      const convertToBase64 = (blob, compress = false) => {
        return new Promise((resolve, reject) => {
          if (compress && blob.size > 100000) {
            console.warn('⚠️ Image trop lourde pour Gmail:', blob.size, 'bytes. Compression...');
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            const timeout = setTimeout(() => {
              console.error('❌ Timeout compression image');
              reject(new Error('Timeout compression'));
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
                
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                console.log('✅ Image compressée:', compressedBase64.length, 'caractères');
                resolve(compressedBase64);
              } catch (error) {
                console.error('❌ Erreur compression:', error);
                reject(error);
              }
            };
            
            img.onerror = (error) => {
              clearTimeout(timeout);
              console.error('❌ Erreur chargement image pour compression:', error);
              reject(error);
            };
            
            img.src = URL.createObjectURL(blob);
          } else {
            // Conversion normale
            const reader = new FileReader();
            
            const timeout = setTimeout(() => {
              console.error('❌ Timeout FileReader');
              reject(new Error('Timeout FileReader'));
            }, 10000);
            
            reader.onloadend = () => {
              clearTimeout(timeout);
              const base64 = reader.result;
              console.log('✅ Conversion base64 réussie:', base64.length, 'caractères');
              resolve(base64);
            };
            
            reader.onerror = (error) => {
              clearTimeout(timeout);
              console.error('❌ Erreur FileReader:', error);
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
      console.error('❌ Erreur lors de la conversion base64:', error);
      return null;
    }
  };

  // Fonction pour générer le HTML de la signature
  const generateSignatureHTML = async (facebookImageUrl = null) => {
    const primaryColor = signatureData.primaryColor || '#2563eb';
    
    // Convertir les images en base64 si nécessaire
    console.log('🔍 Données avant conversion:');
    console.log('  - Photo originale:', signatureData.photo);
    console.log('  - Logo original:', signatureData.logo);
    
    // Conversion directe des images
    console.log('🖼️ Conversion des images pour la signature:');
    console.log('  - Photo URL originale:', signatureData.photo);
    console.log('  - Logo URL originale:', signatureData.logo);
    console.log('  - URLs identiques?', signatureData.photo === signatureData.logo);
    console.log('📊 ÉTAT COMPLET signatureData:');
    console.log('  - photo:', signatureData.photo);
    console.log('  - logo:', signatureData.logo);
    console.log('  - companyName:', signatureData.companyName);
    
    try {
      // Utiliser directement les URLs des images (plus simple et efficace)
      const photoSrc = signatureData.photo;
      const logoSrc = signatureData.logo;
      
      console.log('🖼️ Images utilisées:');
      console.log('  - Photo URL:', photoSrc || 'Aucune');
      console.log('  - Logo URL:', logoSrc || 'Aucun');
      
      // Générer le HTML selon le template sélectionné
    const template = signatureData.template || signatureData.layout;
    let htmlSignature;
    
    switch (template) {
      case 'obama':
        htmlSignature = generateObamaHTML(signatureData, primaryColor, photoSrc, logoSrc);
        break;
      case 'rangan':
        htmlSignature = generateRanganHTML(signatureData, primaryColor, photoSrc, logoSrc);
        break;
      case 'shah':
        htmlSignature = generateShahHTML(signatureData, primaryColor, photoSrc, logoSrc);
        break;
      case 'custom':
        htmlSignature = generateCustomHTML(signatureData, primaryColor, photoSrc, logoSrc);
        break;
      case 'horizontal':
        htmlSignature = generateHorizontalHTML(signatureData, primaryColor, facebookImageUrl, photoSrc, logoSrc);
        break;
      case 'vertical':
      default:
        htmlSignature = generateVerticalHTML(signatureData, primaryColor, facebookImageUrl, photoSrc, logoSrc);
        break;
    }
    
    return htmlSignature;
  } catch (error) {
    console.error('❌ Erreur lors de la génération HTML:', error);
    throw error;
  }
};

// Fonction pour générer le HTML du layout vertical
const generateVerticalHTML = (signatureData, primaryColor, facebookImageUrl = null, photoSrc, logoSrc) => {
  // Ensure facebookImageUrl is properly handled
  const facebookImgUrl = facebookImageUrl || '';
  const imageSize = signatureData.imageSize || 80;
  const borderRadius = signatureData.imageShape === 'square' ? '8px' : '50%';
  const separatorVerticalWidth = signatureData.separatorVerticalWidth || 1;
  const separatorHorizontalWidth = signatureData.separatorHorizontalWidth || 1;
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
    <body style="margin: 0; padding: 0; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
        <tbody>
          <tr>
            <!-- Colonne de gauche : Informations personnelles -->
            <td style="width: 200px; padding-right: 15px; vertical-align: top;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                <tbody>
                  ${photoSrc ? `
                 <tr>
                  <td style="padding-bottom: ${spacings.photoBottom || 12}px; text-align: left;">
                    <div style="width: ${imageSize}px; height: ${imageSize}px; border-radius: ${borderRadius}; background: url('${photoSrc}') center center / cover no-repeat; display: inline-block; overflow: hidden; -webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover; background-size: cover !important;"></div>
                  </td>
                </tr>
                  ` : ''}
                  

                  <tr>
                    <td style="padding-bottom: ${spacings.nameBottom || 8}px; text-align: left;">
                      <div style="font-size: ${signatureData.fontSize?.name || 16}px; font-weight: bold; color: ${primaryColor}; line-height: 1.2; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                        ${signatureData.firstName} ${signatureData.lastName}
                      </div>
                    </td>
                  </tr>
                  ${signatureData.position ? `
                    <tr>
                      <td style="padding-bottom: ${spacings.positionBottom || 8}px; text-align: left;">
                        <div style="font-size: ${signatureData.fontSize?.position || 14}px; color: rgb(102,102,102); font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                          ${signatureData.position}
                        </div>
                      </td>
                    </tr>
                  ` : ''}
                  ${signatureData.companyName ? `
                    <tr>
                      <td style="padding-bottom: ${spacings.companyBottom || 12}px; text-align: left;">
                        <div style="font-size: 14px; font-weight: bold; color: ${primaryColor}; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                          ${signatureData.companyName}
                        </div>
                      </td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            </td>
            
            <!-- Séparateur vertical - Gmail compatible -->
            <td style="width: ${separatorVerticalWidth}px; background-color: #e0e0e0; padding: 0; font-size: 1px; line-height: 1px;">
              &nbsp;
            </td>
            
            <!-- Colonne de droite : Informations de contact -->
            <td style="padding-left: 15px; vertical-align: top; width: 200px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                <tbody>
                  ${signatureData.phone ? `
                    <tr>
                      <td style="padding-bottom: ${signatureData.mobile ? (spacings.phoneToMobile || 4) : (spacings.contactBottom || 6)}px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                              </td>
                              <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: middle; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                                <a href="tel:${signatureData.phone}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none; font-family: inherit;">${signatureData.phone}</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ` : ''}
                  ${signatureData.mobile ? `
                    <tr>
                      <td style="padding-bottom: ${signatureData.email ? (spacings.mobileToEmail || 4) : (spacings.contactBottom || 6)}px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                              </td>
                              <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: middle; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                                <a href="tel:${signatureData.mobile}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none; font-family: inherit;">${signatureData.mobile}</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ` : ''}
                  ${signatureData.email ? `
                    <tr>
                      <td style="padding-bottom: ${signatureData.website ? (spacings.emailToWebsite || 4) : (spacings.contactBottom || 6)}px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                              </td>
                              <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: middle; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                                <a href="mailto:${signatureData.email}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none; font-family: inherit;">${signatureData.email}</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ` : ''}
                  ${signatureData.website ? `
                    <tr>
                      <td style="padding-bottom: ${signatureData.address ? (spacings.websiteToAddress || 4) : (spacings.contactBottom || 6)}px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                              </td>
                              <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: middle; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                                <a href="${signatureData.website && signatureData.website.startsWith('http') ? signatureData.website : 'https://' + (signatureData.website || '')}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none; font-family: inherit;">${signatureData.website ? signatureData.website.replace(/^https?:\/\//, '') : ''}</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ` : ''}
                  ${signatureData.address ? `
                    <tr>
                      <td style="padding-bottom: 12px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding-right: 8px; vertical-align: top; width: 12px;">
                                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block; margin-top: 1px;" />
                              </td>
                              <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: top; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                                <span style="font-family: inherit;">${signatureData.address.replace(/\n/g, '<br>')}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ` : ''}
                  
                  <!-- Séparateur horizontal après tous les contacts -->
                  <tr>
                    <td style="padding-top: ${spacings.separatorTop || 12}px; padding-bottom: ${spacings.separatorBottom || 12}px;">
                      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                        <tbody>
                          <tr>
                            <td style="border-top: ${separatorHorizontalWidth}px solid ${signatureData.colors?.separatorHorizontal || '#e0e0e0'}; line-height: 1px; font-size: 1px;">&nbsp;</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Logo entreprise après le séparateur -->
                  ${logoSrc ? `
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
                  ` : ''}
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
const generateHorizontalHTML = (signatureData, primaryColor, facebookImageUrl = null, photoSrc, logoSrc) => {
  // Ensure facebookImageUrl is properly handled
  const facebookImgUrl = facebookImageUrl || '';
  const imageSize = signatureData.imageSize || 80;
  const borderRadius = signatureData.imageShape === 'square' ? '8px' : '50%';
  const separatorHorizontalWidth = signatureData.separatorHorizontalWidth || 1;
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
          ${photoSrc ? `
            <td style="width: ${signatureData.columnWidths?.photo || 25}%; padding-right: ${spacings.photoBottom || 16}px; vertical-align: top;">
              <div style="width: ${imageSize}px; height: ${imageSize}px; border-radius: ${borderRadius}; background: url('${photoSrc}') center center/cover no-repeat; display: block; overflow: hidden; -webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover;"></div>
            </td>
          ` : ''}
          
          <!-- Informations empilées verticalement à droite -->
          <td style="width: ${signatureData.columnWidths?.content || 75}%; vertical-align: top;">
            <!-- Nom et prénom -->
            <div style="font-size: 16px; font-weight: bold; color: ${primaryColor}; line-height: 1.2; margin-bottom: 2px;">
              ${signatureData.firstName} ${signatureData.lastName}
            </div>
            
            <!-- Profession -->
            ${signatureData.position ? `
              <div style="font-size: 14px; color: rgb(102,102,102); margin-bottom: 4px;">
                ${signatureData.position}
              </div>
            ` : ''}
            
            <!-- Contacts -->
            ${signatureData.phone ? `
              <div style="display: flex; align-items: center; font-size: 12px; color: rgb(102,102,102); margin-bottom: 1px;">
                <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                ${signatureData.phone}
              </div>
            ` : ''}
            
            ${signatureData.mobile ? `
              <div style="display: flex; align-items: center; font-size: 12px; color: rgb(102,102,102); margin-bottom: 1px;">
                <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                ${signatureData.mobile}
              </div>
            ` : ''}
            
            ${signatureData.email ? `
              <div style="display: flex; align-items: center; font-size: 12px; color: rgb(102,102,102); margin-bottom: 1px;">
                <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                <a href="mailto:${signatureData.email}" style="color: ${primaryColor}; text-decoration: none;">${signatureData.email}</a>
              </div>
            ` : ''}
            
            ${signatureData.website ? `
              <div style="display: flex; align-items: center; font-size: 12px; color: rgb(102,102,102); margin-bottom: 1px;">
                <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                <a href="${signatureData.website.startsWith('http') ? signatureData.website : 'https://' + signatureData.website}" target="_blank" style="color: ${primaryColor}; text-decoration: none;">${signatureData.website.replace(/^https?:\/\//, '')}</a>
              </div>
            ` : ''}
            
            ${signatureData.address ? `
              <div style="display: flex; align-items: flex-start; font-size: 12px; color: rgb(102,102,102); margin-bottom: 4px;">
                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px; margin-top: 1px;" />
                ${signatureData.address.replace(/\n/g, '<br>')}
              </div>
            ` : ''}
            
            <!-- Logo/Nom entreprise -->
            ${(signatureData.companyName || logoSrc) ? '' : ''}
          </td>
        </tr>
        
        <!-- Séparateur horizontal -->
        <tr>
          <td colspan="2" style="padding: ${spacings.separatorTop || 12}px 0 ${spacings.separatorBottom || 12}px 0;">
            <hr style="border: none; border-top: ${separatorHorizontalWidth}px solid ${signatureData.colors?.separatorHorizontal || '#e0e0e0'}; margin: 0; width: 100%;" />
          </td>
        </tr>
        
        <!-- Logo entreprise après le séparateur -->
        ${logoSrc ? `
        <tr>
          <td colspan="2" style="text-align: left;">
            <img src="${logoSrc}" alt="Logo entreprise" style="width: ${logoSize}px; height: auto; max-height: ${logoSize}px; object-fit: contain;" />
          </td>
        </tr>
        ` : ''}
        
        <!-- Logos sociaux -->
        ${(signatureData.socialLinks?.linkedin || signatureData.socialLinks?.facebook || signatureData.socialLinks?.twitter || signatureData.socialLinks?.instagram) ? `
        <tr>
          <td colspan="2" style="padding: ${spacings.separatorBottom || 15}px 0 0 0; text-align: left;">
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
              <tr>
                ${signatureData.socialLinks?.linkedin ? `
                <td style="padding-right: 8px;">
                  <a href="${signatureData.socialLinks.linkedin}" target="_blank" rel="noopener noreferrer">
                    ${signatureData.socialBackground?.enabled ? `
                    <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || '#f3f4f6'}; border-radius: ${signatureData.socialBackground?.shape === 'round' ? '50%' : '4px'}; padding: 6px;">
                      <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/linkedin.png" alt="LinkedIn" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    </div>
                    ` : `
                    <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/linkedin.png" alt="LinkedIn" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    `}
                  </a>
                </td>
                ` : ''}
                ${signatureData.socialLinks?.facebook ? `
                <td style="padding-right: 8px;">
                  <a href="${signatureData.socialLinks.facebook}" target="_blank" rel="noopener noreferrer">
                    ${signatureData.socialBackground?.enabled ? `
                    <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || '#f3f4f6'}; border-radius: ${signatureData.socialBackground?.shape === 'round' ? '50%' : '4px'}; padding: 6px;">
                      ${facebookImgUrl ? `
                      <img src="${facebookImgUrl}" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                      ` : `
                      <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/facebook.png" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                      `}
                    </div>
                    ` : `
                    ${facebookImgUrl ? `
                    <img src="${facebookImgUrl}" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    ` : `
                    <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/facebook.png" alt="Facebook" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    `}
                    `}
                  </a>
                </td>
                ` : ''}
                ${signatureData.socialLinks?.twitter ? `
                <td style="padding-right: 8px;">
                  <a href="${signatureData.socialLinks.twitter}" target="_blank" rel="noopener noreferrer">
                    ${signatureData.socialBackground?.enabled ? `
                    <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || '#f3f4f6'}; border-radius: ${signatureData.socialBackground?.shape === 'round' ? '50%' : '4px'}; padding: 6px;">
                      <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/x.png" alt="X (Twitter)" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    </div>
                    ` : `
                    <img src="https://img.icons8.com/color/${signatureData.socialSize || 24}/x.png" alt="X (Twitter)" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    `}
                  </a>
                </td>
                ` : ''}
                ${signatureData.socialLinks?.instagram ? `
                <td>
                  <a href="${signatureData.socialLinks.instagram}" target="_blank" rel="noopener noreferrer">
                    ${signatureData.socialBackground?.enabled ? `
                    <div style="display: inline-block; background-color: ${signatureData.socialBackground?.color || '#f3f4f6'}; border-radius: ${signatureData.socialBackground?.shape === 'round' ? '50%' : '4px'}; padding: 6px;">
                      <img src="https://img.icons8.com/fluency/${signatureData.socialSize || 24}/instagram-new.png" alt="Instagram" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    </div>
                    ` : `
                    <img src="https://img.icons8.com/fluency/${signatureData.socialSize || 24}/instagram-new.png" alt="Instagram" width="${signatureData.socialSize || 24}" height="${signatureData.socialSize || 24}" style="display: block;" />
                    `}
                  </a>
                </td>
                ` : ''}
              </tr>
            </table>
          </td>
        </tr>
        ` : ''}
      </table>
    </body>
    </html>
  `;
};

// Générateur HTML pour le template Obama
const generateObamaHTML = (signatureData, primaryColor, photoSrc, logoSrc) => {
  return `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 450px; font-family: Arial, sans-serif; background-color: #ffffff;">
  <tbody>
    <tr>
      <!-- Photo de profil à gauche -->
      <td style="width: 100px; padding-right: 20px; vertical-align: top; padding-bottom: 10px;">
        ${photoSrc ? `
        <div style="width: 90px; height: 90px; border-radius: 50%; background: url('${photoSrc}') center center/cover no-repeat; display: block; border: 3px solid #f0f0f0;"></div>
        ` : ''}
      </td>
      
      <!-- Informations à droite -->
      <td style="vertical-align: top; padding-bottom: 10px;">
        <!-- Nom complet -->
        <div style="font-size: 22px; font-weight: bold; color: #2563eb; line-height: 1.2; margin-bottom: 5px; font-family: Arial, sans-serif;">
          ${signatureData.firstName || ''} ${signatureData.lastName || ''}
        </div>
        
        <!-- Titre/Position -->
        ${(signatureData.position || signatureData.company) ? `
        <div style="font-size: 14px; color: #666666; line-height: 1.3; margin-bottom: 15px; font-family: Arial, sans-serif;">
          ${signatureData.position || ''}${signatureData.position && signatureData.company ? ' | ' : ''}${signatureData.company || ''}
        </div>
        ` : ''}
        
        <!-- Informations de contact -->
        <div style="font-size: 13px; color: #666666; line-height: 1.6;">
          ${signatureData.email ? `
          <div style="margin-bottom: 3px; display: flex; align-items: center;">
            <span style="color: #2563eb; margin-right: 8px; font-size: 14px;">✉</span>
            <a href="mailto:${signatureData.email}" style="color: #666666; text-decoration: none;">${signatureData.email}</a>
          </div>
          ` : ''}
          
          ${signatureData.phone ? `
          <div style="margin-bottom: 3px; display: flex; align-items: center;">
            <span style="color: #2563eb; margin-right: 8px; font-size: 14px;">📞</span>
            <span style="color: #666666;">${signatureData.phone}</span>
          </div>
          ` : ''}
          
          ${signatureData.website ? `
          <div style="margin-bottom: 3px; display: flex; align-items: center;">
            <span style="color: #2563eb; margin-right: 8px; font-size: 14px;">🌐</span>
            <a href="${signatureData.website}" style="color: #666666; text-decoration: none;">${signatureData.website}</a>
          </div>
          ` : ''}
          
          ${signatureData.address ? `
          <div style="margin-top: 8px; display: flex; align-items: flex-start;">
            <span style="color: #2563eb; margin-right: 8px; font-size: 14px; margin-top: 2px;">📍</span>
            <span style="color: #666666;">${signatureData.address}</span>
          </div>
          ` : ''}
        </div>
      </td>
    </tr>
  </tbody>
</table>
  `;
};

// Générateur HTML pour le template Rangan
const generateRanganHTML = (signatureData, primaryColor, photoSrc, logoSrc) => {
  return `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: Arial, sans-serif; background-color: #ffffff;">
  <tbody>
    <tr>
      <!-- Photo de profil à gauche -->
      <td style="width: 110px; padding-right: 25px; vertical-align: top; padding-bottom: 15px;">
        ${photoSrc ? `
        <div style="width: 100px; height: 100px; border-radius: 50%; background: url('${photoSrc}') center center/cover no-repeat; display: block; border: 4px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>
        ` : ''}
      </td>
      
      <!-- Informations à droite -->
      <td style="vertical-align: top; padding-bottom: 15px;">
        <!-- Nom complet -->
        <div style="font-size: 24px; font-weight: bold; color: #1a1a1a; line-height: 1.2; margin-bottom: 4px; font-family: Arial, sans-serif;">
          ${signatureData.firstName || ''} ${signatureData.lastName || ''}
        </div>
        
        <!-- Titre/Position -->
        <div style="font-size: 16px; color: #666666; line-height: 1.3; margin-bottom: 12px; font-family: Arial, sans-serif;">
          ${signatureData.position || ''}${signatureData.position && signatureData.company ? '<br>' : ''}${signatureData.company || ''}
        </div>
        
        <!-- Informations de contact avec icônes colorées -->
        <div style="font-size: 14px; line-height: 1.8; margin-bottom: 15px;">
          ${signatureData.phone ? `
          <div style="margin-bottom: 4px; display: flex; align-items: center;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #ff6b35; margin-right: 10px; display: flex; align-items: center; justify-content: center; font-size: 10px;">📞</div>
            <span style="color: #333;">${signatureData.phone}</span>
          </div>
          ` : ''}
          
          ${signatureData.email ? `
          <div style="margin-bottom: 4px; display: flex; align-items: center;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #4285f4; margin-right: 10px; display: flex; align-items: center; justify-content: center; font-size: 10px;">✉</div>
            <a href="mailto:${signatureData.email}" style="color: #333; text-decoration: none;">${signatureData.email}</a>
          </div>
          ` : ''}
          
          ${signatureData.website ? `
          <div style="margin-bottom: 4px; display: flex; align-items: center;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #34a853; margin-right: 10px; display: flex; align-items: center; justify-content: center; font-size: 10px;">🌐</div>
            <a href="${signatureData.website}" style="color: #333; text-decoration: none;">${signatureData.website}</a>
          </div>
          ` : ''}
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
        <div style="font-size: 26px; font-weight: bold; color: #1a1a1a; line-height: 1.1; margin-bottom: 6px; font-family: Arial, sans-serif;">
          ${signatureData.firstName || ''} ${signatureData.lastName || ''}
        </div>
        
        <!-- Titre/Position -->
        <div style="font-size: 15px; color: #666666; line-height: 1.4; margin-bottom: 18px; font-family: Arial, sans-serif;">
          ${signatureData.position || ''}${signatureData.position && signatureData.company ? ' at ' : ''}${signatureData.company || ''}
        </div>
        
        <!-- Informations de contact -->
        <div style="font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
          ${signatureData.email ? `
          <div style="margin-bottom: 5px; display: flex; align-items: center;">
            <span style="color: #666666; margin-right: 8px; font-size: 13px;">📧</span>
            <a href="mailto:${signatureData.email}" style="color: #333; text-decoration: none;">${signatureData.email}</a>
          </div>
          ` : ''}
          
          ${signatureData.phone ? `
          <div style="margin-bottom: 5px; display: flex; align-items: center;">
            <span style="color: #666666; margin-right: 8px; font-size: 13px;">📱</span>
            <span style="color: #333;">${signatureData.phone}</span>
          </div>
          ` : ''}
          
          ${signatureData.website ? `
          <div style="margin-bottom: 5px; display: flex; align-items: center;">
            <span style="color: #666666; margin-right: 8px; font-size: 13px;">🌍</span>
            <a href="${signatureData.website}" style="color: #333; text-decoration: none;">${signatureData.website}</a>
          </div>
          ` : ''}
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
        ${photoSrc ? `
        <div style="width: 120px; height: 120px; border-radius: 8px; background: url('${photoSrc}') center center/cover no-repeat; display: inline-block; border: 2px solid #f0f0f0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);"></div>
        ` : ''}
      </td>
    </tr>
  </tbody>
</table>
  `;
};

// Générateur HTML pour le template personnalisé
const generateCustomHTML = (signatureData, primaryColor, photoSrc, logoSrc) => {
  const layout = signatureData.customLayout || {
    grid: { rows: 2, cols: 2 },
    cells: [
      { id: "cell-0-0", row: 0, col: 0, elements: [{ type: "photo", content: photoSrc, alignment: "center" }] },
      { id: "cell-0-1", row: 0, col: 1, elements: [
        { type: "text", content: `${signatureData.firstName || ''} ${signatureData.lastName || ''}`, alignment: "left", styles: { fontSize: "18px", fontWeight: "bold", color: primaryColor } },
        { type: "text", content: signatureData.position || '', alignment: "left", styles: { fontSize: "14px", color: "#666", marginTop: "4px" } }
      ]},
      { id: "cell-1-0", row: 1, col: 0, elements: [{ type: "logo", content: logoSrc, alignment: "center" }] },
      { id: "cell-1-1", row: 1, col: 1, elements: [{ type: "text", content: signatureData.contact || '', alignment: "left", styles: { fontSize: "12px", color: "#666" } }] }
    ]
  };

  const { grid, cells } = layout;

  // Fonction pour générer le HTML d'un élément
  const generateElementHTML = (element) => {
    const { type, content, alignment, styles = {} } = element;
    
    if (!content) return '';

    const alignStyle = alignment === 'center' ? 'text-align: center;' : 
                      alignment === 'right' ? 'text-align: right;' : 'text-align: left;';
    
    const styleString = Object.entries(styles).map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value};`;
    }).join(' ');

    switch (type) {
      case 'photo':
        return `
          <div style="${alignStyle}">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: url('${content}') center center/cover no-repeat; display: inline-block; border: 2px solid #f0f0f0; ${styleString}"></div>
          </div>
        `;
      
      case 'logo':
        return `
          <div style="${alignStyle}">
            <img src="${content}" alt="Logo" style="height: 40px; object-fit: contain; ${styleString}" />
          </div>
        `;
      
      case 'text':
      case 'custom':
        return `<div style="${alignStyle} ${styleString}">${content}</div>`;
      
      default:
        return '';
    }
  };

  // Fonction pour générer le HTML d'une cellule
  const generateCellHTML = (cell) => {
    const elementsHTML = cell.elements.map(generateElementHTML).filter(html => html).join('');
    const { borders = {} } = cell;
    
    // Construire les styles de bordure pour le HTML
    const borderStyles = [
      borders.top ? 'border-top: 2px solid #e5e7eb' : '',
      borders.right ? 'border-right: 2px solid #e5e7eb' : '',
      borders.bottom ? 'border-bottom: 2px solid #e5e7eb' : '',
      borders.left ? 'border-left: 2px solid #e5e7eb' : ''
    ].filter(Boolean).join('; ');
    
    return `
      <td style="padding: 10px; vertical-align: top; ${borderStyles}">
        ${elementsHTML}
      </td>
    `;
  };

  // Générer la structure de la grille
  const rows = [];
  for (let row = 0; row < grid.rows; row++) {
    const rowCells = cells.filter(cell => cell.row === row).sort((a, b) => a.col - b.col);
    const rowHTML = `
      <tr>
        ${rowCells.map(generateCellHTML).join('')}
      </tr>
    `;
    rows.push(rowHTML);
  }

  return `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 600px; font-family: Arial, sans-serif; background-color: #ffffff;">
  <tbody>
    ${rows.join('')}
  </tbody>
</table>
  `;
};

  
  // Fonction pour copier la signature dans le presse-papier
  const handleCopySignature = async () => {
    console.log('🚀 Début de la copie de signature');
    console.log('📋 Données signature:', {
      photo: signatureData.photo ? 'Présente' : 'Absente',
      companyLogo: signatureData.logo ? 'Présent' : 'Absent',
      firstName: signatureData.firstName,
      lastName: signatureData.lastName
    });
    
    setIsCopying(true);
    
    try {
      // Générer une PNG colorée pour Facebook si nécessaire
      let facebookImageUrl = null;
      if (signatureData.socialLinks?.facebook && signatureData.colors?.social) {
        console.log('🎨 Génération PNG Facebook pour Gmail...');
        try {
          const { generateColoredSocialLogo } = await import('../utils/svgToPng');
          facebookImageUrl = await generateColoredSocialLogo(
            'facebook', 
            signatureData.colors.social, 
            signatureData.socialSize || 24
          );
          console.log('✅ PNG Facebook générée:', facebookImageUrl);
        } catch (error) {
          console.error('❌ Erreur génération PNG:', error);
        }
      }
      
      // Utiliser la fonction generateSignatureHTML compatible Gmail avec espacements
      const { generateGmailSignatureHTML } = await import('../components/SignatureManager');
      const signatureWithFacebookUrl = {
        ...signatureData,
        facebookImageUrl: facebookImageUrl
      };
      const htmlSignature = generateGmailSignatureHTML(signatureWithFacebookUrl);
      console.log('📝 HTML généré:', htmlSignature);
      
      // Utiliser l'API moderne du clipboard pour copier du HTML
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlSignature], { type: 'text/html' }),
            'text/plain': new Blob([htmlSignature.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
          })
        ]);
        
        toast.success('Signature copiée avec logo PNG pour Gmail !');
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
        // Fallback pour les navigateurs plus anciens
        try {
          await navigator.clipboard.writeText(htmlSignature);
          toast.success('Signature copiée (texte brut) !');
        } catch (fallbackError) {
          console.error('Erreur fallback:', fallbackError);
          toast.error('Erreur lors de la copie de la signature');
        }
      }
      
      console.log('✅ Copie terminée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la copie:', error);
      toast.error('Erreur lors de la copie de la signature');
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
    console.log('🖼️ UPLOAD IMAGE TO CLOUDFLARE:');
    console.log('  - Field:', field);
    console.log('  - File:', file?.name);
    console.log('  - File type:', file?.type);
    console.log('  - File size:', file?.size);
    
    if (!file) {
      // Si pas de fichier, on supprime l'image
      updateSignatureData(field, null);
      updateSignatureData(field + 'Key', null);
      return;
    }

    try {
      // Déterminer le type d'image pour Cloudflare
      const imageType = field === 'photo' ? 'profile' : 'company';
      
      // Upload vers Cloudflare
      const result = await uploadImageFile(file, imageType);
      
      console.log('✅ Image uploadée vers Cloudflare:');
      console.log('  - URL:', result.url);
      console.log('  - Key:', result.key);
      
      // Stocker l'URL publique et la clé Cloudflare
      updateSignatureData(field, result.url);
      updateSignatureData(field + 'Key', result.key);
      
      toast.success('Image uploadée avec succès vers Cloudflare');
      
    } catch (error) {
      console.error('❌ Erreur upload Cloudflare:', error);
      toast.error('Erreur lors de l\'upload: ' + error.message);
    }
  };

  return (
    <div className="rounded-lg border w-full">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm">Nouveau message</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCopySignature}
          disabled={isCopying}
          className="text-xs"
        >
          <Copy className="w-3 h-3 mr-1" />
          {isCopying ? 'Copie en cours...' : 'Copier la signature'}
        </Button>
      </div>

      <div className="p-4 space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs">De :</span>
          <span className="text-xs">
            {signatureData.email || "newbi@contact.fr"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">À :</span>
          <span className="text-xs">sweily@contact.fr</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">Obj :</span>
          <span className="text-xs">Votre demande de renseignements</span>
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
              logoSrc: signatureData.logo
            };
            
            switch (signatureData.template || signatureData.layout) {
              case 'obama':
                return <TemplateObama {...templateProps} />;
              case 'rangan':
                return <TemplateRangan {...templateProps} />;
              case 'shah':
                return <TemplateShah {...templateProps} />;
              case 'custom':
                return <TemplateCustom {...templateProps} />;
              case 'horizontal':
                return <HorizontalSignature {...templateProps} />;
              case 'vertical':
              default:
                return <VerticalSignature {...templateProps} />;
            }
          })()}
        </div>
      </div>
    </div>
  );
};

// Composant de preview mobile (placeholder)
const MobilePreview = ({ signatureData }) => {
  return (
    <div className="rounded-lg border w-[320px] h-[600px] bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm">Mobile - À venir</span>
        </div>
      </div>
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Preview Mobile</p>
          <p className="text-sm">À venir prochainement...</p>
        </div>
      </div>
    </div>
  );
};

// Composant principal de la page
export default function NewSignaturePage() {
  const { signatureData, updateSignatureData, isEditMode, editingSignatureId } = useSignatureData();
  
  // Fonction pour changer de template
  const handleTemplateChange = (templateId) => {
    updateSignatureData('template', templateId);
    // Maintenir la compatibilité avec l'ancien système layout
    if (templateId === 'horizontal' || templateId === 'vertical') {
      updateSignatureData('layout', templateId);
    }
  };

  // Fonction pour mettre à jour le layout personnalisé
  const handleCustomLayoutChange = (newLayout) => {
    updateSignatureData('customLayout', newLayout);
  };

  return (
    <div className="p-12 h-[calc(100vh-64px)] flex items-center justify-center">

      {/* Bouton de sauvegarde en haut à droite */}
      <div className="absolute top-4 right-4 z-10">
        <SignatureSave existingSignatureId={isEditMode ? editingSignatureId : null} />
      </div>
      
      {/* Onglets Desktop/Mobile - Verticaux à gauche */}
      <Tabs
        defaultValue="desktop"
        orientation="vertical"
        className="w-full flex-row flex gap-6"
      >
        <TabsList className="flex-col h-fit w-fit p-1">
          <TabsTrigger
            value="desktop"
            className="flex flex-col items-center gap-2 p-3 w-10 h-15"
          >
            <Monitor className="w-6 h-6" />
          </TabsTrigger>
          <TabsTrigger
            value="mobile"
            className="flex flex-col items-center gap-2 p-3 w-10 h-15"
          >
            <Smartphone className="w-6 h-6" />
          </TabsTrigger>
        </TabsList>

        <div className="grow min-w-0 h-[600px]">
          <TabsContent value="desktop" className="mt-0 w-full h-full">
            <div className="flex justify-center items-start h-full">
              <EmailPreview signatureData={signatureData} />
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="mt-0 w-full h-full">
            <div className="flex justify-center items-center h-full">
              <MobilePreview signatureData={signatureData} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
