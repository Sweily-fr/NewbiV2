"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useLazyQuery, useApolloClient } from "@apollo/client";
import { gql } from "@apollo/client";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Trash2, Download, Star, StarOff, Loader2, AlertCircle, Copy } from "lucide-react";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import TemplateSelector from "./TemplateSelector";
import { toast } from "@/src/components/ui/sonner";

// Query pour récupérer toutes les signatures de l'utilisateur
const GET_MY_EMAIL_SIGNATURES = gql`
  query GetMyEmailSignatures {
    getMyEmailSignatures {
      id
      signatureName
      isDefault
      firstName
      lastName
      position
      email
      companyName
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour supprimer une signature
const DELETE_EMAIL_SIGNATURE = gql`
  mutation DeleteEmailSignature($id: ID!) {
    deleteEmailSignature(id: $id)
  }
`;

// Mutation pour définir une signature par défaut
const SET_DEFAULT_EMAIL_SIGNATURE = gql`
  mutation SetDefaultEmailSignature($id: ID!) {
    setDefaultEmailSignature(id: $id) {
      id
      signatureName
      isDefault
    }
  }
`;

// Query pour récupérer une signature complète
const GET_EMAIL_SIGNATURE = gql`
  query GetEmailSignature($id: ID!) {
    getEmailSignature(id: $id) {
      id
      signatureName
      isDefault
      
      # Informations personnelles
      firstName
      lastName
      position
      
      # Informations de contact
      email
      phone
      mobile
      website
      address
      companyName
      
      # Options d'affichage des icônes
      showPhoneIcon
      showMobileIcon
      showEmailIcon
      showAddressIcon
      showWebsiteIcon
      
      # Couleurs
      primaryColor
      colors {
        name
        position
        company
        contact
        separatorVertical
        separatorHorizontal
      }
      
      # Configuration layout
      nameSpacing
      nameAlignment
      layout
      columnWidths {
        photo
        content
      }
      
      # Images
      photo
      photoKey
      logo
      logoKey
      imageSize
      imageShape
      logoSize
      
      # Séparateurs
      separatorVerticalWidth
      separatorHorizontalWidth
      
      # Espacements
      spacings {
        global
        photoBottom
        logoBottom
        nameBottom
        positionBottom
        companyBottom
        contactBottom
        phoneToMobile
        mobileToEmail
        emailToWebsite
        websiteToAddress
        separatorTop
        separatorBottom
      }
      
      # Typographie
      fontFamily
      fontSize {
        name
        position
        contact
      }
      
      createdAt
      updatedAt
    }
  }
`;

const SignatureManager = () => {
  const { updateSignatureData, signatureData } = useSignatureData();
  const [isMounted, setIsMounted] = useState(false);
  const [copyingId, setCopyingId] = useState(null);
  const client = useApolloClient();

  // Éviter l'erreur d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, loading, error, refetch } = useQuery(GET_MY_EMAIL_SIGNATURES, {
    skip: !isMounted,
    onCompleted: (data) => {
      console.log('📊 [FRONTEND] Données reçues du serveur:', data);
      console.log('📋 [FRONTEND] Signatures:', data?.getMyEmailSignatures);
    },
    onError: (error) => {
      console.error('❌ [FRONTEND] Erreur lors de la récupération:', error);
    }
  });

  const [deleteSignature, { loading: deleting }] = useMutation(DELETE_EMAIL_SIGNATURE, {
    // Mise à jour optimiste du cache
    update: (cache, { data: { deleteEmailSignature: deletedId } }) => {
      // Lire les données actuelles du cache
      const existingSignatures = cache.readQuery({ query: GET_MY_EMAIL_SIGNATURES });
      
      if (existingSignatures?.getMyEmailSignatures) {
        // Filtrer la signature supprimée
        const newSignatures = existingSignatures.getMyEmailSignatures.filter(
          sig => sig.id !== deletedId
        );
        
        // Écrire les données mises à jour dans le cache
        cache.writeQuery({
          query: GET_MY_EMAIL_SIGNATURES,
          data: { getMyEmailSignatures: newSignatures }
        });
      }
    },
    onError: (error) => {
      console.error("❌ Erreur suppression:", error);
      // En cas d'erreur, on recharge les données
      refetch();
    }
  });

  const [setDefaultSignature, { loading: settingDefault }] = useMutation(SET_DEFAULT_EMAIL_SIGNATURE, {
    onCompleted: (data) => {
      console.log("✅ Signature par défaut définie:", data.setDefaultEmailSignature);
      refetch();
    },
    onError: (error) => {
      console.error("❌ Erreur définition par défaut:", error);
    }
  });

  const [loadSignature, { loading: loadingSignature }] = useLazyQuery(GET_EMAIL_SIGNATURE, {
    onCompleted: (data) => {
      const signature = data.getEmailSignature;
      if (signature) {
        // Mapper les données de la signature vers le contexte
        const mappedData = {
          signatureName: signature.signatureName || "",
          isDefault: signature.isDefault || false,
          
          // Informations personnelles
          fullName: signature.fullName || "",
          position: signature.position || "",
          
          // Informations de contact
          email: signature.email || "",
          phone: signature.phone || "",
          mobile: signature.mobile || "",
          website: signature.website || "",
          address: signature.address || "",
          companyName: signature.companyName || "",
          
          // Options d'affichage
          showPhoneIcon: signature.showPhoneIcon ?? true,
          showMobileIcon: signature.showMobileIcon ?? true,
          showEmailIcon: signature.showEmailIcon ?? true,
          showAddressIcon: signature.showAddressIcon ?? true,
          showWebsiteIcon: signature.showWebsiteIcon ?? true,
          
          // Couleurs
          primaryColor: signature.primaryColor || "#3b82f6",
          colors: signature.colors || {
            name: "#000000",
            position: "#666666",
            company: "#666666",
            contact: "#666666",
            separatorVertical: "#e5e7eb",
            separatorHorizontal: "#e5e7eb"
          },
          
          // Layout
          nameSpacing: signature.nameSpacing || 8,
          nameAlignment: signature.nameAlignment || "left",
          layout: signature.layout || "vertical",
          columnWidths: signature.columnWidths || { photo: 30, content: 70 },
          
          // Images
          photo: signature.photo || "",
          photoKey: signature.photoKey || "",
          logo: signature.logo || "",
          logoKey: signature.logoKey || "",
          imageSize: signature.imageSize || 80,
          imageShape: signature.imageShape || "round",
          logoSize: signature.logoSize || 60,
          
          // Séparateurs
          separatorVerticalWidth: signature.separatorVerticalWidth || 1,
          separatorHorizontalWidth: signature.separatorHorizontalWidth || 1,
          
          // Espacements
          spacings: signature.spacings || {
            global: 16,
            photoBottom: 16,
            logoBottom: 12,
            nameBottom: 4,
            positionBottom: 8,
            companyBottom: 12,
            contactBottom: 4,
            phoneToMobile: 4,
            mobileToEmail: 4,
            emailToWebsite: 4,
            websiteToAddress: 4,
            separatorTop: 16,
            separatorBottom: 16
          },
          
          // Typographie
          fontFamily: signature.fontFamily || "Arial, sans-serif",
          fontSize: signature.fontSize || {
            name: 16,
            position: 14,
            contact: 13
          }
        };
        
        updateSignatureData(mappedData);
        console.log("✅ Signature chargée:", signature.signatureName);
      }
    },
    onError: (error) => {
      console.error("❌ Erreur chargement signature:", error);
    }
  });

  const handleDeleteSignature = async (id, name) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la signature "${name}" ?`)) {
      try {
        await deleteSignature({ 
          variables: { id },
          // Réponse optimiste pour une mise à jour immédiate
          optimisticResponse: {
            __typename: 'Mutation',
            deleteEmailSignature: id
          }
        });
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultSignature({ variables: { id } });
    } catch (error) {
      console.error("Erreur lors de la définition par défaut:", error);
    }
  };

  const handleLoadSignature = async (id) => {
    try {
      await loadSignature({ variables: { id } });
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
  };

  // Fonction pour générer le HTML d'une signature compatible Gmail
  const generateSignatureHTML = (signature) => {
    const primaryColor = signature.primaryColor || "#3b82f6";
    const photoSrc = signature.photo || "";
    const logoSrc = signature.logo || "";
    const template = signature.template || signature.layout || 'horizontal';
    
    // Debug pour voir quelle orientation est détectée
    console.log('🎯 Template détecté dans generateSignatureHTML:', template);
    console.log('🎯 signature.template:', signature.template);
    console.log('🎯 signature.layout:', signature.layout);
    
    // Générer selon l'orientation
    if (template === 'vertical') {
      console.log('📋 Génération HTML VERTICAL');
      return generateVerticalSignatureHTML(signature, primaryColor, photoSrc, logoSrc);
    } else {
      console.log('📋 Génération HTML HORIZONTAL');
      return generateHorizontalSignatureHTML(signature, primaryColor, photoSrc, logoSrc);
    }
  };

  // Fonction pour générer le HTML horizontal
  const generateHorizontalSignatureHTML = (signature, primaryColor, photoSrc, logoSrc) => {
    // HTML optimisé pour Gmail - format horizontal
    return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: ${signature.fontFamily || 'Arial, sans-serif'}; font-size: 14px; line-height: 1.4; margin: 0; padding: 0;">
<tbody>
  <tr>
    ${photoSrc ? `
    <td style="padding: 0; margin: 0; vertical-align: top; width: ${signature.imageSize || 80}px;">
      <img src="${photoSrc}" alt="Photo de profil" style="width: ${signature.imageSize || 80}px; height: ${signature.imageSize || 80}px; border-radius: ${signature.imageShape === 'square' ? '8px' : '50%'}; display: block; margin: 0; padding: 0; border: none;" />
    </td>
    <td style="width: ${signature.spacings?.nameSpacing || 12}px; padding: 0; margin: 0; padding-left: ${signature.spacings?.nameSpacing || 12}px;">&nbsp;</td>
    ` : ''}
    
    <td style="vertical-align: top; padding: 0; margin: 0;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.nameBottom || 2}px;">
              <span style="font-size: ${signature.typography?.fullName?.fontSize || signature.fontSize?.name || 16}px; font-weight: ${signature.typography?.fullName?.fontWeight || 'normal'}; color: ${signature.typography?.fullName?.color || primaryColor}; line-height: 1.2; margin: 0; padding: 0; font-family: ${signature.typography?.fullName?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                ${signature.fullName || ''}
              </span>
            </td>
          </tr>
            ${signature.position ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.positionBottom || 2}px;">
                <span style="font-size: ${signature.typography?.position?.fontSize || signature.fontSize?.position || 14}px; color: ${signature.typography?.position?.color || '#666666'}; font-weight: ${signature.typography?.position?.fontWeight || 'normal'}; font-style: ${signature.typography?.position?.fontStyle || 'normal'}; text-decoration: ${signature.typography?.position?.textDecoration || 'none'}; margin: 0; padding: 0; font-family: ${signature.typography?.position?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                  ${signature.position}
                </span>
              </td>
            </tr>
            ` : ''}
            ${signature.company ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.companyBottom || 8}px;">
                <span style="font-size: ${signature.typography?.company?.fontSize || signature.fontSize?.company || 14}px; font-weight: ${signature.typography?.company?.fontWeight || 'bold'}; color: ${signature.typography?.company?.color || primaryColor}; margin: 0; padding: 0; font-family: ${signature.typography?.company?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                  ${signature.company}
                </span>
              </td>
            </tr>
            ` : ''}
            ${signature.phone ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.phoneToMobile || 4}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                  <tbody>
                    <tr>
                      <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                      </td>
                      <td style="padding: 0; margin: 0; vertical-align: middle;">
                        <span style="font-size: ${signature.typography?.phone?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.phone?.color || '#666666'}; font-weight: ${signature.typography?.phone?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.phone?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                          <a href="tel:${signature.phone}" style="color: ${signature.typography?.phone?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.phone}</a>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            ` : ''}
            ${signature.mobile ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.mobileToEmail || 4}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                  <tbody>
                    <tr>
                      <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                      </td>
                      <td style="padding: 0; margin: 0; vertical-align: middle;">
                        <span style="font-size: ${signature.typography?.mobile?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.mobile?.color || '#666666'}; font-weight: ${signature.typography?.mobile?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.mobile?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                          <a href="tel:${signature.mobile}" style="color: ${signature.typography?.mobile?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.mobile}</a>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            ` : ''}
            ${signature.email ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.emailToWebsite || 4}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                  <tbody>
                    <tr>
                      <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                      </td>
                      <td style="padding: 0; margin: 0; vertical-align: middle;">
                        <span style="font-size: ${signature.typography?.email?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.email?.color || '#666666'}; font-weight: ${signature.typography?.email?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.email?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                          <a href="mailto:${signature.email}" style="color: ${signature.typography?.email?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.email}</a>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            ` : ''}
            ${signature.website ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.websiteToAddress || 4}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                  <tbody>
                    <tr>
                      <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                      </td>
                      <td style="padding: 0; margin: 0; vertical-align: middle;">
                        <span style="font-size: ${signature.typography?.website?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.website?.color || '#666666'}; font-weight: ${signature.typography?.website?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.website?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                          <a href="${signature.website}" style="color: ${signature.typography?.website?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.website}</a>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            ` : ''}
            ${signature.address ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.addressBottom || 8}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                  <tbody>
                    <tr>
                      <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                      </td>
                      <td style="padding: 0; margin: 0; vertical-align: middle;">
                        <span style="font-size: ${signature.typography?.address?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.address?.color || '#666666'}; font-weight: ${signature.typography?.address?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.address?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                          ${signature.address}
                        </span>
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
    
    ${signature.separator?.enabled ? `
    <tr>
      <td colspan="${photoSrc ? '3' : '1'}" style="padding: 0; margin: 0; padding-top: ${signature.spacings?.separatorTop || 8}px; padding-bottom: ${signature.spacings?.separatorBottom || 8}px;">
        <div style="width: 100%; height: 1px; background-color: ${signature.separator?.color || '#e5e7eb'}; margin: 0; padding: 0;"></div>
      </td>
    </tr>
    ` : ''}
    
    ${logoSrc ? `
    <tr>
      <td colspan="${photoSrc ? '3' : '1'}" style="padding: 0; margin: 0; padding-top: ${signature.spacings?.logoToSocial || 15}px; text-align: ${signature.logoAlignment || 'left'};">
        ${signature.logoBackground?.enabled ? `
        <span style="display: inline-block; background-color: ${signature.logoBackground?.color || '#f3f4f6'}; border-radius: ${signature.logoBackground?.shape === 'round' ? '50%' : '0'}; padding: 8px; margin: 0;">
          <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; display: block; margin: 0; padding: 0; border: none;" />
        </span>
        ` : `
        <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; margin: 0; padding: 0; border: none;" />
        `}
      </td>
    </tr>
    ` : ''}
  </tbody>
</table>`;
  };

  // Fonction pour générer le HTML vertical
  const generateVerticalSignatureHTML = (signature, primaryColor, photoSrc, logoSrc) => {
    // HTML optimisé pour Gmail - format vertical
    return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: ${signature.fontFamily || 'Arial, sans-serif'}; font-size: 14px; line-height: 1.4; margin: 0; padding: 0;">
<tbody>
  ${photoSrc ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.photoBottom || 16}px; text-align: ${signature.nameAlignment || 'left'};">
      <img src="${photoSrc}" alt="Photo de profil" style="width: ${signature.imageSize || 80}px; height: ${signature.imageSize || 80}px; border-radius: ${signature.imageShape === 'square' ? '8px' : '50%'}; display: block; margin: 0; padding: 0; border: none;" />
    </td>
  </tr>
  ` : ''}
  
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.nameBottom || 8}px; text-align: ${signature.nameAlignment || 'left'};">
      <span style="font-size: ${signature.typography?.fullName?.fontSize || signature.fontSize?.name || 16}px; font-weight: ${signature.typography?.fullName?.fontWeight || 'normal'}; color: ${signature.typography?.fullName?.color || primaryColor}; line-height: 1.2; margin: 0; padding: 0; font-family: ${signature.typography?.fullName?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
        ${signature.fullName || ''}
      </span>
    </td>
  </tr>
  
  ${signature.position ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.positionBottom || 8}px;">
      <span style="font-size: ${signature.typography?.position?.fontSize || signature.fontSize?.position || 14}px; color: ${signature.typography?.position?.color || '#666666'}; font-weight: ${signature.typography?.position?.fontWeight || 'normal'}; font-style: ${signature.typography?.position?.fontStyle || 'normal'}; text-decoration: ${signature.typography?.position?.textDecoration || 'none'}; margin: 0; padding: 0; font-family: ${signature.typography?.position?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
        ${signature.position}
      </span>
    </td>
  </tr>
  ` : ''}
  
  ${signature.company ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.companyBottom || 12}px;">
      <span style="font-size: ${signature.typography?.company?.fontSize || 14}px; font-weight: ${signature.typography?.company?.fontWeight || 'normal'}; color: ${signature.typography?.company?.color || primaryColor}; margin: 0; padding: 0; font-family: ${signature.typography?.company?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
        ${signature.company}
      </span>
    </td>
  </tr>
  ` : ''}
  
  ${signature.phone ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.phoneToMobile || 4}px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
              <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
            </td>
            <td style="padding: 0; margin: 0; vertical-align: middle;">
              <span style="font-size: ${signature.typography?.phone?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.phone?.color || '#666666'}; font-weight: ${signature.typography?.phone?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.phone?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                <a href="tel:${signature.phone}" style="color: ${signature.typography?.phone?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.phone}</a>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  ` : ''}
  
  ${signature.mobile ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.mobileToEmail || 4}px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
              <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
            </td>
            <td style="padding: 0; margin: 0; vertical-align: middle;">
              <span style="font-size: ${signature.typography?.mobile?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.mobile?.color || '#666666'}; font-weight: ${signature.typography?.mobile?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.mobile?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                <a href="tel:${signature.mobile}" style="color: ${signature.typography?.mobile?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.mobile}</a>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  ` : ''}
  
  ${signature.email ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.emailToWebsite || 4}px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
              <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
            </td>
            <td style="padding: 0; margin: 0; vertical-align: middle;">
              <span style="font-size: ${signature.typography?.email?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.email?.color || '#666666'}; font-weight: ${signature.typography?.email?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.email?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                <a href="mailto:${signature.email}" style="color: ${signature.typography?.email?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.email}</a>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  ` : ''}
  
  ${signature.website ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.websiteToAddress || 4}px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
              <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
            </td>
            <td style="padding: 0; margin: 0; vertical-align: middle;">
              <span style="font-size: ${signature.typography?.website?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.website?.color || '#666666'}; font-weight: ${signature.typography?.website?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.website?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                <a href="${signature.website}" style="color: ${signature.typography?.website?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.website}</a>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  ` : ''}
  
  ${signature.address ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.addressBottom || 8}px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
              <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
            </td>
            <td style="padding: 0; margin: 0; vertical-align: middle;">
              <span style="font-size: ${signature.typography?.address?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.address?.color || '#666666'}; font-weight: ${signature.typography?.address?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.address?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                ${signature.address}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  ` : ''}
  
  ${signature.separator?.enabled ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-top: ${signature.spacings?.separatorTop || 8}px; padding-bottom: ${signature.spacings?.separatorBottom || 8}px;">
      <div style="width: 100%; height: 1px; background-color: ${signature.separator?.color || '#e5e7eb'}; margin: 0; padding: 0;"></div>
    </td>
  </tr>
  ` : ''}
  
  ${logoSrc ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-top: ${signature.spacings?.logoToSocial || 15}px; text-align: ${signature.logoAlignment || 'left'};">
      ${signature.logoBackground?.enabled ? `
      <span style="display: inline-block; background-color: ${signature.logoBackground?.color || '#f3f4f6'}; border-radius: ${signature.logoBackground?.shape === 'round' ? '50%' : '0'}; padding: 8px; margin: 0;">
        <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; display: block; margin: 0; padding: 0; border: none;" />
      </span>
      ` : `
      <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; margin: 0; padding: 0; border: none;" />
      `}
    </td>
  </tr>
  ` : ''}
</tbody>
</table>`;
  };

  // Fonction pour copier une signature
  const handleCopySignature = async (signature) => {
    setCopyingId(signature.id);
    
    try {
      // Debug: Afficher les espacements actuels et l'orientation
      console.log('Signature à copier:', signature);
      console.log('Template de la signature:', signature.template || signature.layout);
      console.log('HTML généré:', generateSignatureHTML(signature).substring(0, 500) + '...');
      
      // Utiliser la signature passée en paramètre (celle qu'on veut copier)
      const htmlSignature = generateSignatureHTML(signature);
      
      // Copier en tant que texte riche (HTML)
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlSignature], { type: 'text/html' }),
            'text/plain': new Blob([htmlSignature.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
          })
        ]);
        toast.success(`Signature "${signature.signatureName}" copiée avec le visuel !`);
      } else {
        // Fallback pour les navigateurs plus anciens
        const textarea = document.createElement('textarea');
        textarea.value = htmlSignature;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast.success(`Signature "${signature.signatureName}" copiée ! (format HTML)`);
      }
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      toast.error('Erreur lors de la copie de la signature');
    } finally {
      setCopyingId(null);
    }
  };

  // Ne pas rendre le composant côté serveur
  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Chargement des signatures...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>Erreur lors du chargement des signatures</span>
      </div>
    );
  }

  const signatures = data?.getMyEmailSignatures || [];
  
  // Debug logs
  console.log('🔍 [FRONTEND] État du composant SignatureManager:');
  console.log('  - isMounted:', isMounted);
  console.log('  - loading:', loading);
  console.log('  - error:', error);
  console.log('  - data:', data);
  console.log('  - signatures:', signatures);
  console.log('  - signatures.length:', signatures.length);

  // Fonction pour changer de template
  const handleTemplateChange = (templateId) => {
    updateSignatureData('template', templateId);
    // Maintenir la compatibilité avec l'ancien système layout
    if (templateId === 'horizontal' || templateId === 'vertical') {
      updateSignatureData('layout', templateId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de templates */}
      <div>
        <TemplateSelector 
          selectedTemplate={signatureData.template || signatureData.layout || 'horizontal'}
          onTemplateChange={handleTemplateChange}
        />
      </div>
      
      {/* Section signatures sauvegardées (si il y en a) */}
      {signatures.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mes signatures sauvegardées</h2>
            <Badge variant="outline">{signatures.length} signature(s)</Badge>
          </div>

      <div className="grid gap-4">
        {signatures.map((signature) => (
          <Card key={signature.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {signature.signatureName}
                  {signature.isDefault && (
                    <Badge variant="default" className="text-xs">
                      Par défaut
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopySignature(signature)}
                    disabled={copyingId === signature.id}
                    className="p-2 text-blue-600 hover:text-blue-700"
                    title="Copier la signature"
                  >
                    {copyingId === signature.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(signature.id)}
                    disabled={settingDefault || signature.isDefault}
                    className="p-2"
                  >
                    {signature.isDefault ? (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    ) : (
                      <StarOff className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSignature(signature.id, signature.signatureName)}
                    disabled={deleting}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-gray-600">
                {signature.fullName && (
                  <p><strong>Nom :</strong> {signature.fullName}</p>
                )}
                {signature.position && (
                  <p><strong>Poste :</strong> {signature.position}</p>
                )}
                {signature.email && (
                  <p><strong>Email :</strong> {signature.email}</p>
                )}
                {signature.companyName && (
                  <p><strong>Entreprise :</strong> {signature.companyName}</p>
                )}
                <p className="text-xs text-gray-400">
                  Créée le {new Date(signature.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => handleLoadSignature(signature.id)}
                  disabled={loadingSignature}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  {loadingSignature ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Charger cette signature
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        </div>
      )}
      
      {/* Message si aucune signature sauvegardée */}
      {signatures.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          <p className="text-lg mb-2">Aucune signature sauvegardée</p>
          <p className="text-sm">Créez votre première signature et sauvegardez-la pour la retrouver ici.</p>
        </div>
      )}
    </div>
  );
};

// Fonction exportée pour générer le HTML d'une signature compatible Gmail
export const generateGmailSignatureHTML = (signature) => {
  const primaryColor = signature.primaryColor || "#3b82f6";
  const photoSrc = signature.photo || "";
  const logoSrc = signature.logo || "";
  
  // HTML optimisé pour Gmail - sans DOCTYPE ni balises HTML/HEAD/BODY
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: ${signature.fontFamily || 'Arial, sans-serif'}; font-size: 14px; line-height: 1.4; margin: 0; padding: 0;">
<tbody>
  <tr>
    ${photoSrc ? `
    <td style="padding: 0; margin: 0; vertical-align: top; width: ${signature.imageSize || 80}px;">
      <div style="width: ${signature.imageSize || 80}px; height: ${signature.imageSize || 80}px; border-radius: ${signature.imageShape === 'square' ? '8px' : '50%'}; background: url('${photoSrc}') center center/cover no-repeat; display: block; margin: 0; padding: 0; border: none;"></div>
    </td>
    <td style="width: ${signature.spacings?.nameSpacing || 12}px; padding: 0; margin: 0; padding-left: ${signature.spacings?.nameSpacing || 12}px;">&nbsp;</td>
    ${signature.verticalSeparator?.enabled ? `
    <td style="width: ${signature.spacings?.verticalSeparatorLeft || 4}px; padding: 0; margin: 0; vertical-align: top;">&nbsp;</td>
    <td style="width: ${signature.verticalSeparator?.width || 2}px; background-color: ${signature.verticalSeparator?.color || '#000000'}; padding: 0; margin: 0; vertical-align: top; height: 100%; min-height: 80px;">&nbsp;</td>
    <td style="width: ${signature.spacings?.verticalSeparatorRight || 12}px; padding: 0; margin: 0; vertical-align: top;">&nbsp;</td>
    ` : ''}
    ` : ''}
    
    <td style="vertical-align: top; padding: 0; margin: 0;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.nameBottom || 2}px;">
              <span style="font-size: ${signature.typography?.fullName?.fontSize || signature.fontSize?.name || 16}px; font-weight: ${signature.typography?.fullName?.fontWeight || 'bold'}; color: ${signature.typography?.fullName?.color || primaryColor}; line-height: 1.2; margin: 0; padding: 0; font-family: ${signature.typography?.fullName?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                ${signature.fullName || ''}
              </span>
            </td>
          </tr>
          ${signature.position ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.positionBottom || 2}px;">
              <span style="font-size: ${signature.typography?.position?.fontSize || signature.fontSize?.position || 14}px; color: ${signature.typography?.position?.color || '#666666'}; font-weight: ${signature.typography?.position?.fontWeight || 'normal'}; font-style: ${signature.typography?.position?.fontStyle || 'normal'}; text-decoration: ${signature.typography?.position?.textDecoration || 'none'}; margin: 0; padding: 0; font-family: ${signature.typography?.position?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                ${signature.position}
              </span>
            </td>
          </tr>
          ` : ''}
          ${signature.company ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.companyBottom || 8}px;">
              <span style="font-size: ${signature.typography?.company?.fontSize || signature.fontSize?.company || 14}px; font-weight: ${signature.typography?.company?.fontWeight || 'bold'}; color: ${signature.typography?.company?.color || primaryColor}; margin: 0; padding: 0; font-family: ${signature.typography?.company?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                ${signature.company}
              </span>
            </td>
          </tr>
          ` : ''}
          ${signature.phone ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.phoneToMobile || 4}px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tbody>
                  <tr>
                    <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                      <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                    </td>
                    <td style="padding: 0; margin: 0; vertical-align: middle;">
                      <span style="font-size: ${signature.typography?.phone?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.phone?.color || '#666666'}; font-weight: ${signature.typography?.phone?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.phone?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                        <a href="tel:${signature.phone}" style="color: ${signature.typography?.phone?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.phone}</a>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}
          ${signature.mobile ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.mobileToEmail || 4}px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tbody>
                  <tr>
                    <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                      <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                    </td>
                    <td style="padding: 0; margin: 0; vertical-align: middle;">
                      <span style="font-size: ${signature.typography?.mobile?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.mobile?.color || '#666666'}; font-weight: ${signature.typography?.mobile?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.mobile?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                        <a href="tel:${signature.mobile}" style="color: ${signature.typography?.mobile?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.mobile}</a>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}
          ${signature.email ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.emailToWebsite || 4}px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tbody>
                  <tr>
                    <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                      <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                    </td>
                    <td style="padding: 0; margin: 0; vertical-align: middle;">
                      <span style="font-size: ${signature.typography?.email?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.email?.color || '#666666'}; font-weight: ${signature.typography?.email?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.email?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                        <a href="mailto:${signature.email}" style="color: ${signature.typography?.email?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.email}</a>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}
          ${signature.website ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.websiteToAddress || 4}px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tbody>
                  <tr>
                    <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                      <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                    </td>
                    <td style="padding: 0; margin: 0; vertical-align: middle;">
                      <span style="font-size: ${signature.typography?.website?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.website?.color || '#666666'}; font-weight: ${signature.typography?.website?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.website?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                        <a href="${signature.website}" style="color: ${signature.typography?.website?.color || '#666666'}; text-decoration: none; margin: 0; padding: 0;">${signature.website}</a>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}
          ${signature.address ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.addressBottom || 8}px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tbody>
                  <tr>
                    <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                      <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                    </td>
                    <td style="padding: 0; margin: 0; vertical-align: middle;">
                      <span style="font-size: ${signature.typography?.address?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.address?.color || '#666666'}; font-weight: ${signature.typography?.address?.fontWeight || 'normal'}; margin: 0; padding: 0; font-family: ${signature.typography?.address?.fontFamily || signature.fontFamily || 'Arial, sans-serif'};">
                        ${signature.address}
                      </span>
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
  
  <tr>
    <td colspan="${photoSrc ? (signature.verticalSeparator?.enabled ? '6' : '3') : '1'}" style="padding: 0; margin: 0; padding-top: ${signature.spacings?.separatorTop || 12}px; padding-bottom: ${signature.spacings?.separatorBottom || 12}px;">
      <hr style="border: none; border-top: ${signature.separatorHorizontalWidth || 1}px solid ${signature.colors?.separatorHorizontal || '#e0e0e0'}; margin: 0; width: 100%;" />
    </td>
  </tr>
  
  ${logoSrc ? `
  <tr>
    <td colspan="${photoSrc ? (signature.verticalSeparator?.enabled ? '6' : '3') : '1'}" style="padding: 0; margin: 0; text-align: left;">
      <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; margin: 0; padding: 0; border: none;" />
    </td>
  </tr>
  ` : ''}
  
  ${(signature.socialLinks?.linkedin || signature.socialLinks?.facebook || signature.socialLinks?.twitter || signature.socialLinks?.instagram) ? `
  <tr>
    <td colspan="${photoSrc ? (signature.verticalSeparator?.enabled ? '6' : '3') : '1'}" style="padding: 0; margin: 0; padding-top: ${signature.spacings?.logoToSocial || 15}px; text-align: left;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            ${signature.socialLinks?.linkedin ? `
            <td style="padding: 0; margin: 0; padding-right: 8px;">
              <a href="${signature.socialLinks.linkedin}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin: 0; padding: 0;">
                <div style="display: inline-block; background-color: ${signature.socialBackground?.enabled ? (signature.socialBackground?.color || '#f3f4f6') : 'transparent'}; border-radius: ${signature.socialBackground?.enabled && signature.socialBackground?.shape === 'round' ? '50%' : '4px'}; padding: ${signature.socialBackground?.enabled ? '6px' : '0'}; margin: 0;">
                  <img src="https://img.icons8.com/color/${signature.socialSize || 24}/linkedin.png" alt="LinkedIn" width="${signature.socialSize || 24}" height="${signature.socialSize || 24}" style="display: block; margin: 0; padding: 0; border: none;" />
                </div>
              </a>
            </td>
            ` : ''}
            ${signature.socialLinks?.facebook ? `
            <td style="padding: 0; margin: 0; padding-right: 8px;">
              <a href="${signature.socialLinks.facebook}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin: 0; padding: 0;">
                <div style="display: inline-block; background-color: ${signature.socialBackground?.enabled ? (signature.socialBackground?.color || '#f3f4f6') : 'transparent'}; border-radius: ${signature.socialBackground?.enabled && signature.socialBackground?.shape === 'round' ? '50%' : '4px'}; padding: ${signature.socialBackground?.enabled ? '6px' : '0'}; margin: 0;">
                  <img src="${signature.facebookImageUrl || 'https://img.icons8.com/fluency/' + (signature.socialSize || 24) + '/facebook-new.png'}" alt="Facebook" width="${signature.socialSize || 24}" height="${signature.socialSize || 24}" style="display: block; margin: 0; padding: 0; border: none;" />
                </div>
              </a>
            </td>
            ` : ''}
            ${signature.socialLinks?.twitter ? `
            <td style="padding: 0; margin: 0; padding-right: 8px;">
              <a href="${signature.socialLinks.twitter}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin: 0; padding: 0;">
                <div style="display: inline-block; background-color: ${signature.socialBackground?.enabled ? (signature.socialBackground?.color || '#f3f4f6') : 'transparent'}; border-radius: ${signature.socialBackground?.enabled && signature.socialBackground?.shape === 'round' ? '50%' : '4px'}; padding: ${signature.socialBackground?.enabled ? '6px' : '0'}; margin: 0;">
                  <img src="https://img.icons8.com/color/${signature.socialSize || 24}/x.png" alt="X (Twitter)" width="${signature.socialSize || 24}" height="${signature.socialSize || 24}" style="display: block; margin: 0; padding: 0; border: none;" />
                </div>
              </a>
            </td>
            ` : ''}
            ${signature.socialLinks?.instagram ? `
            <td style="padding: 0; margin: 0;">
              <a href="${signature.socialLinks.instagram}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin: 0; padding: 0;">
                <div style="display: inline-block; background-color: ${signature.socialBackground?.enabled ? (signature.socialBackground?.color || '#f3f4f6') : 'transparent'}; border-radius: ${signature.socialBackground?.enabled && signature.socialBackground?.shape === 'round' ? '50%' : '4px'}; padding: ${signature.socialBackground?.enabled ? '6px' : '0'}; margin: 0;">
                  <img src="https://img.icons8.com/fluency/${signature.socialSize || 24}/instagram-new.png" alt="Instagram" width="${signature.socialSize || 24}" height="${signature.socialSize || 24}" style="display: block; margin: 0; padding: 0; border: none;" />
                </div>
              </a>
            </td>
            ` : ''}
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  ` : ''}
</tbody>
</table>`;
};

export default SignatureManager;
