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
          firstName: signature.firstName || "",
          lastName: signature.lastName || "",
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

  // Fonction pour générer le HTML d'une signature
  const generateSignatureHTML = (signature) => {
    const primaryColor = signature.primaryColor || "#3b82f6";
    const photoSrc = signature.photo || "";
    const logoSrc = signature.logo || "";
    
    // Génération HTML basique pour la signature horizontale
    return `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signature Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: ${signature.fontFamily || 'Arial, sans-serif'};">
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 600px; font-family: ${signature.fontFamily || 'Arial, sans-serif'};">
    <tbody>
      <tr>
        ${photoSrc ? `
        <td style="padding-right: 20px; vertical-align: top; width: ${signature.imageSize || 80}px;">
          <div style="width: ${signature.imageSize || 80}px; height: ${signature.imageSize || 80}px; border-radius: ${signature.imageShape === 'square' ? '8px' : '50%'}; background: url('${photoSrc}') center center / cover no-repeat; display: block; overflow: hidden;"></div>
        </td>
        ` : ''}
        
        <td style="vertical-align: top;">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="padding-bottom: 8px;">
                  <div style="font-size: ${signature.fontSize?.name || 16}px; font-weight: bold; color: ${primaryColor}; line-height: 1.2;">
                    ${signature.firstName || ''} ${signature.lastName || ''}
                  </div>
                </td>
              </tr>
              ${signature.position ? `
              <tr>
                <td style="padding-bottom: 8px;">
                  <div style="font-size: ${signature.fontSize?.position || 14}px; color: #666666;">
                    ${signature.position}
                  </div>
                </td>
              </tr>
              ` : ''}
              ${signature.companyName ? `
              <tr>
                <td style="padding-bottom: 12px;">
                  <div style="font-size: 14px; font-weight: bold; color: ${primaryColor};">
                    ${signature.companyName}
                  </div>
                </td>
              </tr>
              ` : ''}
              ${signature.email ? `
              <tr>
                <td style="padding-bottom: 4px;">
                  <div style="font-size: ${signature.fontSize?.contact || 12}px; color: #666666;">
                    <a href="mailto:${signature.email}" style="color: #666666; text-decoration: none;">${signature.email}</a>
                  </div>
                </td>
              </tr>
              ` : ''}
              ${signature.phone ? `
              <tr>
                <td style="padding-bottom: 4px;">
                  <div style="font-size: ${signature.fontSize?.contact || 12}px; color: #666666;">
                    <a href="tel:${signature.phone}" style="color: #666666; text-decoration: none;">${signature.phone}</a>
                  </div>
                </td>
              </tr>
              ` : ''}
              ${signature.website ? `
              <tr>
                <td style="padding-bottom: 4px;">
                  <div style="font-size: ${signature.fontSize?.contact || 12}px; color: #666666;">
                    <a href="${signature.website}" style="color: #666666; text-decoration: none;">${signature.website}</a>
                  </div>
                </td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </td>
      </tr>
      
      ${logoSrc ? `
      <tr>
        <td colSpan="2" style="padding-top: 15px; text-align: center;">
          ${signature.logoBackground?.enabled ? `
          <div style="display: inline-block; background-color: ${signature.logoBackground?.color || '#f3f4f6'}; border-radius: ${signature.logoBackground?.shape === 'round' ? '50%' : '0'}; padding: 8px;">
            <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; object-fit: contain; display: block;" />
          </div>
          ` : `
          <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; object-fit: contain;" />
          `}
        </td>
      </tr>
      ` : ''}
    </tbody>
  </table>
</body>
</html>
    `;
  };

  // Fonction pour copier une signature
  const handleCopySignature = async (signature) => {
    setCopyingId(signature.id);
    
    try {
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
                {signature.firstName && signature.lastName && (
                  <p><strong>Nom :</strong> {signature.firstName} {signature.lastName}</p>
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

export default SignatureManager;
