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
  const generateSignatureHTML = async () => {
    const primaryColor = signatureData.primaryColor || '#2563eb';
    
    // Convertir les images en base64 si nécessaire
    console.log('🔍 Données avant conversion:');
    console.log('  - Photo originale:', signatureData.photo);
    console.log('  - Logo original:', signatureData.companyLogo);
    console.log('  - Nom entreprise:', signatureData.companyName);
    
    // Conversion directe des images
    console.log('🖼️ Conversion des images pour la signature:');
    console.log('  - Photo URL originale:', signatureData.photo);
    console.log('  - Logo URL originale:', signatureData.companyLogo);
    console.log('  - URLs identiques?', signatureData.photo === signatureData.companyLogo);
    console.log('📊 ÉTAT COMPLET signatureData:');
    console.log('  - photo:', signatureData.photo);
    console.log('  - companyLogo:', signatureData.companyLogo);
    console.log('  - companyName:', signatureData.companyName);
    
    try {
      const [photoSrc, logoSrc] = await Promise.all([
        signatureData.photo ? getImageSrc(signatureData.photo) : Promise.resolve(null),
        signatureData.companyLogo ? getImageSrc(signatureData.companyLogo) : Promise.resolve(null)
      ]);
      
      console.log('🖼️ Résultats de conversion:');
      console.log('  - Photo src:', photoSrc ? 'Convertie (' + photoSrc.length + ' chars)' : 'Indisponible');
      console.log('  - Logo src:', logoSrc ? 'Converti (' + logoSrc.length + ' chars)' : 'Indisponible');
      console.log('  - Logo src type:', typeof logoSrc);
      console.log('  - Logo src preview:', logoSrc ? logoSrc.substring(0, 100) + '...' : 'null');
      
      // Version HTML de la signature (compatible Gmail avec structure tableau stricte)
    const htmlSignature = `
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
            ${photoSrc ? `
              <td style="width: 60px; padding-right: 12px; vertical-align: top;">
                <img src="${photoSrc}" alt="${signatureData.firstName} ${signatureData.lastName}" style="width: 60px !important; height: 60px !important; max-width: 60px !important; max-height: 60px !important; border-radius: 50%; object-fit: cover; display: block;" />
              </td>
            ` : ''}
            <td style="vertical-align: top;">
              <!-- Tableau principal pour les informations -->
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <!-- Nom séparé en 2 cellules avec espacement contrôlé -->
                <tr>
                  <td colspan="2" style="text-align: ${signatureData.nameAlignment || 'left'}; padding-bottom: 2px;">
                    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 ${signatureData.nameAlignment === 'center' ? 'auto' : signatureData.nameAlignment === 'right' ? '0 0 0 auto' : '0 auto 0 0'};">
                      <tr>
                        <td style="font-size: 16px; font-weight: bold; color: ${primaryColor}; line-height: 1.2; padding-right: ${signatureData.nameSpacing}px; white-space: nowrap;">
                          ${signatureData.firstName}
                        </td>
                        <td style="font-size: 16px; font-weight: bold; color: ${primaryColor}; line-height: 1.2; white-space: nowrap;">
                          ${signatureData.lastName}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Titre sur toute la largeur -->
                ${signatureData.position ? `
                  <tr>
                    <td colspan="2" style="font-size: 14px; color: rgb(102,102,102); padding-top: 2px; padding-bottom: 4px;">
                      ${signatureData.position}
                    </td>
                  </tr>
                ` : ''}
                
                <!-- Informations de contact -->
                ${signatureData.phone ? `
                  <tr>
                    <td colspan="2" style="padding-top: 1px; padding-bottom: 1px;">
                      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                        <tr>
                          <td style="padding-right: 8px; vertical-align: middle; width: 14px;">
                            <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style="width: 12px; height: 12px; display: block;" />
                          </td>
                          <td style="font-size: 12px; color: rgb(102,102,102); vertical-align: middle;">
                            ${signatureData.phone}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                ` : ''}
                
                ${signatureData.email ? `
                  <tr>
                    <td colspan="2" style="padding-top: 1px; padding-bottom: 1px;">
                      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                        <tr>
                          <td style="padding-right: 8px; vertical-align: middle; width: 14px;">
                            <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style="width: 12px; height: 12px; display: block;" />
                          </td>
                          <td style="font-size: 12px; color: rgb(102,102,102); vertical-align: middle;">
                            <a href="mailto:${signatureData.email}" style="color: ${primaryColor}; text-decoration: none;">${signatureData.email}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                ` : ''}
                
                ${signatureData.website ? `
                  <tr>
                    <td colspan="2" style="padding-top: 1px; padding-bottom: 1px;">
                      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                        <tr>
                          <td style="padding-right: 8px; vertical-align: middle; width: 14px;">
                            <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style="width: 12px; height: 12px; display: block;" />
                          </td>
                          <td style="font-size: 12px; color: rgb(102,102,102); vertical-align: middle;">
                            <a href="${signatureData.website.startsWith('http') ? signatureData.website : 'https://' + signatureData.website}" target="_blank" style="color: ${primaryColor}; text-decoration: none;">${signatureData.website.replace(/^https?:\/\//, '')}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                ` : ''}
                
                ${signatureData.address ? `
                  <tr>
                    <td colspan="2" style="padding-top: 1px; padding-bottom: 4px;">
                      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                        <tr>
                          <td style="padding-right: 8px; vertical-align: top; width: 14px;">
                            <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style="width: 12px; height: 12px; display: block; margin-top: 1px;" />
                          </td>
                          <td style="font-size: 12px; color: rgb(102,102,102); vertical-align: top;">
                            ${signatureData.address.replace(/\n/g, '<br>')}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                ` : ''}
                
                <!-- Logo/Nom entreprise -->
                ${(signatureData.companyName || (logoSrc && logoSrc !== null)) ? `
                  <tr>
                    <td colspan="2" style="padding-top: 6px; border-top: 1px solid #e0e0e0;">
                      ${(() => {
                        console.log('🏢 DIAGNOSTIC LOGO DANS HTML:');
                        console.log('  - logoSrc exists:', !!logoSrc);
                        console.log('  - logoSrc !== null:', logoSrc !== null);
                        console.log('  - logoSrc type:', typeof logoSrc);
                        console.log('  - logoSrc length:', logoSrc ? logoSrc.length : 'N/A');
                        console.log('  - logoSrc preview:', logoSrc ? logoSrc.substring(0, 100) + '...' : 'null/undefined');
                        console.log('  - companyName:', signatureData.companyName);
                        console.log('  - Condition logo (logoSrc && logoSrc !== null):', (logoSrc && logoSrc !== null));
                        console.log('  - Condition texte (!logoSrc || logoSrc === null):', (!logoSrc || logoSrc === null));
                        return '';
                      })()}
                      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                        <tr>
                          ${(logoSrc && logoSrc !== null) ? `
                            <td style="padding-top: 8px;">
                              <img src="${logoSrc}" alt="${signatureData.companyName || 'Logo'}" style="height: 30px !important; max-width: 100px !important; width: auto !important; display: block;" />
                            </td>
                          ` : ''}
                          ${signatureData.companyName && (!logoSrc || logoSrc === null) ? `
                            <td style="font-size: 14px; font-weight: bold; color: ${primaryColor}; padding-top: 8px;">
                              ${signatureData.companyName}
                            </td>
                          ` : ''}
                        </tr>
                      </table>
                    </td>
                  </tr>
                ` : ''}
                
                <!-- Liens sociaux -->
                ${signatureData.socialLinks && signatureData.socialLinks.length > 0 ? `
                  <tr>
                    <td colspan="2" style="padding-top: 8px;">
                      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                        <tr>
                          ${signatureData.socialLinks.map(link => `
                            <td style="padding-right: 8px;">
                              <a href="${link.url}" target="_blank" style="display: inline-block;">
                                <img src="${link.icon}" alt="${link.name}" width="20" height="20" style="width: 20px; height: 20px; border: none; display: block;" />
                              </a>
                            </td>
                          `).join('')}
                        </tr>
                      </table>
                    </td>
                  </tr>
                ` : ''}
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    
      return htmlSignature;
      
    } catch (error) {
      console.error('❌ Erreur lors de la conversion des images:', error);
      throw error;
    }
  };
  
  // Fonction pour copier la signature dans le presse-papier
  const handleCopySignature = async () => {
    console.log('🚀 Début de la copie de signature');
    console.log('📋 Données signature:', {
      photo: signatureData.photo ? 'Présente' : 'Absente',
      companyLogo: signatureData.companyLogo ? 'Présent' : 'Absent',
      firstName: signatureData.firstName,
      lastName: signatureData.lastName
    });
    
    setIsCopying(true);
    
    try {
      const htmlSignature = await generateSignatureHTML();
      console.log('📝 HTML généré:', htmlSignature);
      
      // Fonction pour copier en tant que texte riche (HTML)
      const copyAsRichText = async () => {
        try {
          // Essayer avec la nouvelle API Clipboard
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({
                'text/html': new Blob([htmlSignature], { type: 'text/html' }),
                'text/plain': new Blob([htmlSignature.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
              })
            ]);
            toast.success("Signature copiée avec le visuel !");
          } else {
            // Fallback pour les navigateurs plus anciens
            const textarea = document.createElement('textarea');
            textarea.value = htmlSignature;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            toast.success("Signature copiée ! (format HTML)");
          }
        } catch (error) {
          console.error('❌ Erreur copie riche:', error);
          throw error; // Propage l'erreur pour le bloc catch externe
        }
      };
      
      await copyAsRichText();
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
          {/* Signature avec structure identique à la version copiée */}
          <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', maxWidth: '500px', fontFamily: 'Arial, sans-serif' }}>
            <tbody>
              <tr>
                {/* Photo de profil */}
                <td style={{ width: '60px', paddingRight: '12px', verticalAlign: 'top' }}>
                  <ImageDropZone
                    currentImage={signatureData.photo}
                    onImageChange={(imageUrl) =>
                      handleImageChange("photo", imageUrl)
                    }
                    placeholder="Photo de profil"
                    size="sm"
                    type="profile"
                    style={{ width: '60px', height: '60px', borderRadius: '50%' }}
                  />
                </td>
                
                {/* Informations principales */}
                <td style={{ verticalAlign: 'top' }}>
                  <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', tableLayout: 'auto', width: 'auto' }}>
                    <tbody>
                       {/* Nom séparé en 2 cellules avec espacement contrôlé */}
                       <tr>
                         <td colSpan="2" style={{ 
                           textAlign: signatureData.nameAlignment || 'left',
                           paddingBottom: '2px'
                         }}>
                           <table cellPadding="0" cellSpacing="0" border="0" style={{ 
                             borderCollapse: 'collapse',
                             margin: signatureData.nameAlignment === 'center' ? '0 auto' : 
                                     signatureData.nameAlignment === 'right' ? '0 0 0 auto' : 
                                     '0 auto 0 0'
                           }}>
                             <tbody>
                               <tr>
                                 <td style={{ 
                                   fontSize: '16px',
                                   fontWeight: 'bold',
                                   color: signatureData.primaryColor || '#2563eb',
                                   lineHeight: '1.2',
                                   paddingRight: `${signatureData.nameSpacing || 4}px`,
                                   whiteSpace: 'nowrap'
                                 }}>
                                   <InlineEdit
                                     value={signatureData.firstName}
                                     onChange={(value) => handleFieldChange("firstName", value)}
                                     placeholder="Prénom"
                                     displayClassName="!p-0 !m-0 !rounded-none font-semibold inline-block w-auto"
                                     inputClassName="!p-0 !m-0 !rounded-none font-semibold border-0 shadow-none h-auto w-auto min-w-0"
                                     className="!p-0 !m-0 !rounded-none inline-block w-auto"
                                     style={{ width: 'auto', minWidth: '0' }}
                                   />
                                 </td>
                                 <td style={{ 
                                   fontSize: '16px',
                                   fontWeight: 'bold',
                                   color: signatureData.primaryColor || '#2563eb',
                                   lineHeight: '1.2',
                                   whiteSpace: 'nowrap'
                                 }}>
                                   <InlineEdit
                                     value={signatureData.lastName}
                                     onChange={(value) => handleFieldChange("lastName", value)}
                                     placeholder="Nom"
                                     displayClassName="!p-0 !m-0 !rounded-none font-semibold inline-block w-auto"
                                     inputClassName="!p-0 !m-0 !rounded-none font-semibold border-0 shadow-none h-auto w-auto min-w-0"
                                     className="!p-0 !m-0 !rounded-none inline-block w-auto"
                                     style={{ width: 'auto', minWidth: '0' }}
                                   />
                                 </td>
                               </tr>
                             </tbody>
                           </table>
                         </td>
                       </tr>
                      
                      {/* Titre sur toute la largeur */}
                      {signatureData.position && (
                        <tr>
                          <td colSpan="2" style={{ 
                            fontSize: '14px',
                            color: 'rgb(102,102,102)',
                            paddingTop: '2px',
                            paddingBottom: '4px'
                          }}>
                            <InlineEdit
                              value={signatureData.position}
                              onChange={(value) => handleFieldChange("position", value)}
                              placeholder="Votre poste"
                              displayClassName="text-gray-600 text-sm"
                              inputClassName="text-gray-600 text-sm border-0 shadow-none p-1 h-auto"
                            />
                          </td>
                        </tr>
                      )}
                      
                      {/* Informations de contact avec icônes images */}
                      {signatureData.phone && (
                        <tr>
                          <td colSpan="2" style={{ paddingTop: '1px', paddingBottom: '1px' }}>
                            <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                              <tbody>
                                <tr>
                                  <td style={{ paddingRight: '8px', verticalAlign: 'middle', width: '14px' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style={{ width: '12px', height: '12px', display: 'block' }} />
                                  </td>
                                  <td style={{ fontSize: '12px', color: 'rgb(102,102,102)', verticalAlign: 'middle' }}>
                                    <InlineEdit
                                      value={signatureData.phone}
                                      onChange={(value) => handleFieldChange("phone", value)}
                                      placeholder="Numéro de téléphone"
                                      validation={validatePhone}
                                      displayClassName="text-xs text-gray-600"
                                      inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
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
                          <td colSpan="2" style={{ paddingTop: '1px', paddingBottom: '1px' }}>
                            <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                              <tbody>
                                <tr>
                                  <td style={{ paddingRight: '8px', verticalAlign: 'middle', width: '14px' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style={{ width: '12px', height: '12px', display: 'block' }} />
                                  </td>
                                  <td style={{ fontSize: '12px', color: 'rgb(102,102,102)', verticalAlign: 'middle' }}>
                                    <InlineEdit
                                      value={signatureData.email}
                                      onChange={(value) => handleFieldChange("email", value)}
                                      placeholder="adresse@email.com"
                                      validation={validateEmail}
                                      displayClassName="text-xs text-gray-600"
                                      inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
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
                          <td colSpan="2" style={{ paddingTop: '1px', paddingBottom: '1px' }}>
                            <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                              <tbody>
                                <tr>
                                  <td style={{ paddingRight: '8px', verticalAlign: 'middle', width: '14px' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style={{ width: '12px', height: '12px', display: 'block' }} />
                                  </td>
                                  <td style={{ fontSize: '12px', color: 'rgb(102,102,102)', verticalAlign: 'middle' }}>
                                    <InlineEdit
                                      value={signatureData.website}
                                      onChange={(value) => handleFieldChange("website", value)}
                                      placeholder="www.monsite.com"
                                      validation={validateUrl}
                                      displayClassName="text-xs text-gray-600"
                                      inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
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
                          <td colSpan="2" style={{ paddingTop: '1px', paddingBottom: '4px' }}>
                            <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                              <tbody>
                                <tr>
                                  <td style={{ paddingRight: '8px', verticalAlign: 'top', width: '14px' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style={{ width: '12px', height: '12px', display: 'block', marginTop: '1px' }} />
                                  </td>
                                  <td style={{ fontSize: '12px', color: 'rgb(102,102,102)', verticalAlign: 'top' }}>
                                    <InlineEdit
                                      value={signatureData.address}
                                      onChange={(value) => handleFieldChange("address", value)}
                                      placeholder="Adresse complète"
                                      multiline={true}
                                      displayClassName="text-xs text-gray-600"
                                      inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 min-h-[2rem] resize-none"
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                      
                      {/* Logo/Nom entreprise */}
                      <tr>
                        <td colSpan="2" style={{ paddingTop: '6px', borderTop: '1px solid #e0e0e0' }}>
                          <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                              <tr>
                                <td style={{ paddingTop: '8px', paddingRight: '8px' }}>
                                  <ImageDropZone
                                    currentImage={signatureData.companyLogo}
                                    onImageChange={(imageUrl) =>
                                      handleImageChange("companyLogo", imageUrl)
                                    }
                                    placeholder="Logo entreprise"
                                    size="xs"
                                    type="logo"
                                    style={{ height: '30px', maxWidth: '100px', width: 'auto' }}
                                  />
                                </td>
                                <td style={{ 
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  color: signatureData.primaryColor || '#2563eb',
                                  paddingTop: '8px',
                                  verticalAlign: 'middle'
                                }}>
                                  <InlineEdit
                                    value={signatureData.companyName}
                                    onChange={(value) =>
                                      handleFieldChange("companyName", value)
                                    }
                                    placeholder="Nom entreprise"
                                    displayClassName="text-blue-600 font-semibold text-sm"
                                    inputClassName="text-blue-600 font-semibold text-sm border-0 shadow-none p-1 h-auto"
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
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
  const { signatureData } = useSignatureData();

  return (
    <div className="p-12 h-[calc(100vh-64px)] flex items-center justify-center">
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
