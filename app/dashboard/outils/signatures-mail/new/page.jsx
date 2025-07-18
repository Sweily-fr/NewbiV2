/**
 * Page de création de nouvelle signature email
 * Affiche l'aperçu de la signature avec édition inline et upload d'images
 */

"use client";

import React, { useState } from "react";
import { Copy, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";

// Aperçu de l'email avec édition inline
const EmailPreview = ({ signatureData }) => {
  const { updateSignatureData } = useSignatureData();
  const [isCopying, setIsCopying] = useState(false);

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
      // Génération du HTML de la signature sous forme de tableau
    // Fonction pour convertir une image en base64 si nécessaire
    const getImageSrc = async (imageUrl) => {
      if (!imageUrl) {
        console.log('getImageSrc: Pas d\'URL fournie');
        return '';
      }
      
      console.log('🖼️ Image à traiter:', imageUrl.substring(0, 50) + '...');
      
      // Si c'est déjà une data URL (base64), la retourner telle quelle
      if (imageUrl.startsWith('data:')) {
        console.log('✅ Déjà en base64');
        return imageUrl;
      }
      
      // Si c'est déjà une URL publique (http/https), la retourner telle quelle
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        console.log('🌐 URL publique, pas de conversion');
        return imageUrl;
      }
      
      // Si c'est une blob URL ou autre, essayer de la convertir en base64
      try {
        console.log('🔄 Conversion blob → base64...');
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('📦 Blob:', blob.size, 'bytes,', blob.type);
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log('✅ Conversion réussie!');
            resolve(reader.result);
          };
          reader.onerror = () => {
            console.error('❌ Erreur FileReader');
            reject(reader.error);
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('❌ Erreur conversion:', error.message);
        return ''; // Retourner une chaîne vide en cas d'erreur
      }
    };

    const generateSignatureHTML = async () => {
      const primaryColor = signatureData.primaryColor || '#2563eb';
      
      // Convertir les images en base64 si nécessaire
      const photoSrc = await getImageSrc(signatureData.photo);
      const logoSrc = await getImageSrc(signatureData.companyLogo);
      
      let contactRows = '';
      
      if (signatureData.showPhoneIcon && signatureData.phone) {
        contactRows += `
          <tr>
            <td style="padding-bottom: 2px; color: #6b7280; font-size: 12px;">
              📞 ${signatureData.phone}
            </td>
          </tr>`;
      }
      
      if (signatureData.showMobileIcon && signatureData.mobile) {
        contactRows += `
          <tr>
            <td style="padding-bottom: 2px; color: #6b7280; font-size: 12px;">
              📱 ${signatureData.mobile}
            </td>
          </tr>`;
      }
      
      if (signatureData.showEmailIcon && signatureData.email) {
        contactRows += `
          <tr>
            <td style="padding-bottom: 2px; color: #6b7280; font-size: 12px;">
              ✉️ ${signatureData.email}
            </td>
          </tr>`;
      }
      
      if (signatureData.showWebsiteIcon && signatureData.website) {
        contactRows += `
          <tr>
            <td style="padding-bottom: 2px; color: #6b7280; font-size: 12px;">
              🌐 ${signatureData.website}
            </td>
          </tr>`;
      }
      
      if (signatureData.showAddressIcon && signatureData.address) {
        contactRows += `
          <tr>
            <td style="padding-bottom: 8px; color: #6b7280; font-size: 12px;">
              📍 ${signatureData.address}
            </td>
          </tr>`;
      }
      
      const logoSection = logoSrc ? `
        <tr>
          <td style="padding-top: 12px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tbody>
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="${logoSrc}" alt="Logo" style="max-height: 40px; max-width: 120px;" />
                  </td>
                  <td style="vertical-align: middle; color: #2563eb; font-weight: bold; font-size: 14px;">
                    ${signatureData.companyName || ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>` : '';
      
      // Afficher le nom d'entreprise soit avec le logo, soit seul
      const companyNameRow = !logoSrc && signatureData.companyName ? `
            <tr>
              <td style="padding-bottom: 8px; color: #6b7280; font-size: 14px;">
                ${signatureData.companyName}
              </td>
            </tr>` : '';
      
      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4;">
  <tbody>
    <tr>
      <td style="vertical-align: top; padding-right: 16px;">
        ${photoSrc ? `<img src="${photoSrc}" alt="Photo" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />` : ''}
      </td>
      <td style="vertical-align: top;">
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
          <tbody>
            <tr>
              <td style="padding-bottom: 4px; color: ${primaryColor}; font-weight: bold; font-size: 16px;">
                ${signatureData.firstName || ''} ${signatureData.lastName || ''}
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 2px; color: #6b7280; font-size: 14px;">
                ${signatureData.position || ''}
              </td>
            </tr>${companyNameRow}${contactRows}${logoSection}
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>`;
    };
    
    // Copie dans le presse-papiers avec HTML rendu (visuel direct)
    const copyAsRichText = async () => {
      const htmlSignature = await generateSignatureHTML();
      try {
        // Créer un élément temporaire pour rendre le HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlSignature;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        // Sélectionner le contenu rendu
        const range = document.createRange();
        range.selectNodeContents(tempDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Copier avec le formatage
        const successful = document.execCommand('copy');
        
        // Nettoyer
        document.body.removeChild(tempDiv);
        selection.removeAllRanges();
        
        if (successful) {
          toast.success("Signature copiée avec le visuel !");
        } else {
          throw new Error('Échec de la copie');
        }
      } catch (error) {
        // Fallback vers l'API moderne du clipboard
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([htmlSignature], { type: 'text/html' }),
              'text/plain': new Blob([htmlSignature.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
            })
          ]);
          toast.success("Signature copiée avec le visuel !");
        } catch (fallbackError) {
          // Dernier recours : copie du HTML brut
          await navigator.clipboard.writeText(htmlSignature);
          toast.success("Signature HTML copiée (collage manuel requis) !");
        }
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

  const handleImageChange = (field, imageUrl) => {
    updateSignatureData(field, imageUrl);
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
          {/* Signature générée avec tableau HTML pour meilleure compatibilité email */}
          <table cellPadding="0" cellSpacing="0" border="0" style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.4' }}>
            <tbody>
              <tr>
                {/* Photo de profil */}
                <td style={{ verticalAlign: 'top', paddingRight: '16px' }}>
                  <ImageDropZone
                    currentImage={signatureData.photo}
                    onImageChange={(imageUrl) =>
                      handleImageChange("photo", imageUrl)
                    }
                    placeholder="Photo de profil"
                    size="md"
                    type="profile"
                    className="mb-2"
                  />
                </td>
                
                {/* Informations principales */}
                <td style={{ verticalAlign: 'top' }}>
                  <table cellPadding="0" cellSpacing="0" border="0" style={{ width: '100%' }}>
                    <tbody>
                      {/* Nom et prénom */}
                      <tr>
                        <td style={{ 
                          paddingBottom: '4px',
                          color: signatureData.primaryColor || '#2563eb',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                          <InlineEdit
                            value={signatureData.firstName}
                            onChange={(value) => handleFieldChange("firstName", value)}
                            placeholder="Prénom"
                            displayClassName="font-semibold"
                            inputClassName="font-semibold border-0 shadow-none p-1 h-auto"
                          />
                          {' '}
                          <InlineEdit
                            value={signatureData.lastName}
                            onChange={(value) => handleFieldChange("lastName", value)}
                            placeholder="Nom"
                            displayClassName="font-semibold"
                            inputClassName="font-semibold border-0 shadow-none p-1 h-auto"
                          />
                        </td>
                      </tr>
                      
                      {/* Poste */}
                      <tr>
                        <td style={{ 
                          paddingBottom: '2px',
                          color: '#6b7280',
                          fontSize: '14px'
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
                      
                      {/* Entreprise - n'afficher que s'il n'y a pas de logo */}
                      {!signatureData.companyLogo && (
                        <tr>
                          <td style={{ 
                            paddingBottom: '8px',
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>
                            <InlineEdit
                              value={signatureData.companyName}
                              onChange={(value) => handleFieldChange("companyName", value)}
                              placeholder="Nom de l'entreprise"
                              displayClassName="text-gray-600 text-sm"
                              inputClassName="text-gray-600 text-sm border-0 shadow-none p-1 h-auto"
                            />
                          </td>
                        </tr>
                      )}
                      
                      {/* Informations de contact */}
                      {signatureData.showPhoneIcon && (
                        <tr>
                          <td style={{ 
                            paddingBottom: '2px',
                            color: '#6b7280',
                            fontSize: '12px'
                          }}>
                            <span style={{ marginRight: '4px' }}>📞</span>
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
                      )}
                      
                      {signatureData.showMobileIcon && (
                        <tr>
                          <td style={{ 
                            paddingBottom: '2px',
                            color: '#6b7280',
                            fontSize: '12px'
                          }}>
                            <span style={{ marginRight: '4px' }}>📱</span>
                            <InlineEdit
                              value={signatureData.mobile}
                              onChange={(value) => handleFieldChange("mobile", value)}
                              placeholder="Numéro de mobile"
                              validation={validatePhone}
                              displayClassName="text-xs text-gray-600"
                              inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
                            />
                          </td>
                        </tr>
                      )}
                      
                      {signatureData.showEmailIcon && (
                        <tr>
                          <td style={{ 
                            paddingBottom: '2px',
                            color: '#6b7280',
                            fontSize: '12px'
                          }}>
                            <span style={{ marginRight: '4px' }}>✉️</span>
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
                      )}
                      
                      {signatureData.showWebsiteIcon && (
                        <tr>
                          <td style={{ 
                            paddingBottom: '2px',
                            color: '#6b7280',
                            fontSize: '12px'
                          }}>
                            <span style={{ marginRight: '4px' }}>🌐</span>
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
                      )}
                      
                      {signatureData.showAddressIcon && (
                        <tr>
                          <td style={{ 
                            paddingBottom: '8px',
                            color: '#6b7280',
                            fontSize: '12px'
                          }}>
                            <span style={{ marginRight: '4px', verticalAlign: 'top' }}>📍</span>
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
                      )}
                      
                      {/* Logo entreprise */}
                      <tr>
                        <td style={{ paddingTop: '12px' }}>
                          <table cellPadding="0" cellSpacing="0" border="0" style={{ width: '100%' }}>
                            <tbody>
                              <tr>
                                <td style={{ verticalAlign: 'middle', paddingRight: '12px', width: 'auto' }}>
                                  <ImageDropZone
                                    currentImage={signatureData.companyLogo}
                                    onImageChange={(imageUrl) =>
                                      handleImageChange("companyLogo", imageUrl)
                                    }
                                    placeholder="Logo entreprise"
                                    size="sm"
                                    type="logo"
                                  />
                                </td>
                                <td style={{ 
                                  verticalAlign: 'middle',
                                  color: signatureData.companyLogo ? '#2563eb' : '#6b7280',
                                  fontWeight: signatureData.companyLogo ? 'bold' : 'normal',
                                  fontSize: '14px',
                                  width: '100%'
                                }}>
                                  <InlineEdit
                                    value={signatureData.companyName}
                                    onChange={(value) =>
                                      handleFieldChange("companyName", value)
                                    }
                                    placeholder="Nom entreprise"
                                    displayClassName={signatureData.companyLogo ? "text-blue-600 font-semibold text-sm" : "text-gray-600 text-sm"}
                                    inputClassName={signatureData.companyLogo ? "text-blue-600 font-semibold text-sm border-0 shadow-none p-1 h-auto" : "text-gray-600 text-sm border-0 shadow-none p-1 h-auto"}
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
