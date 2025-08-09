"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";
import { useSignatureData } from "@/src/hooks/use-signature-data";

// Mutation GraphQL pour créer une signature
const CREATE_EMAIL_SIGNATURE = gql`
  mutation CreateEmailSignature($input: EmailSignatureInput!) {
    createEmailSignature(input: $input) {
      id
      signatureName
      isDefault
      createdAt
    }
  }
`;

// Mutation GraphQL pour mettre à jour une signature
const UPDATE_EMAIL_SIGNATURE = gql`
  mutation UpdateEmailSignature($input: UpdateEmailSignatureInput!) {
    updateEmailSignature(input: $input) {
      id
      signatureName
      isDefault
      updatedAt
    }
  }
`;

const SignatureSave = ({ existingSignatureId = null }) => {
  const { signatureData } = useSignatureData();
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState(signatureData.signatureName || "");
  const [isDefault, setIsDefault] = useState(signatureData.isDefault || false);
  const [saveStatus, setSaveStatus] = useState(null); // null, 'success', 'error'

  // Éviter l'erreur d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [createSignature, { loading: creating }] = useMutation(CREATE_EMAIL_SIGNATURE, {
    refetchQueries: ['GetMyEmailSignatures'],
    onCompleted: (data) => {
      console.log("✅ Signature créée:", data.createEmailSignature);
      setSaveStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setSaveStatus(null);
      }, 2000);
    },
    onError: (error) => {
      console.error("❌ Erreur création signature:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  });

  const [updateSignature, { loading: updating }] = useMutation(UPDATE_EMAIL_SIGNATURE, {
    refetchQueries: ['GetMyEmailSignatures'],
    onCompleted: (data) => {
      console.log("✅ Signature mise à jour:", data.updateEmailSignature);
      setSaveStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setSaveStatus(null);
      }, 2000);
    },
    onError: (error) => {
      console.error("❌ Erreur mise à jour signature:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  });

  const isLoading = creating || updating;

  // Préparer les données pour l'API
  const prepareSignatureData = () => {
    return {
      signatureName,
      isDefault,
      // Informations personnelles
      firstName: signatureData.firstName || "",
      lastName: signatureData.lastName || "",
      position: signatureData.position || "",
      // Informations de contact
      email: signatureData.email || "",
      phone: signatureData.phone || null,
      mobile: signatureData.mobile || null,
      website: signatureData.website || null,
      address: signatureData.address || null,
      companyName: signatureData.companyName || null,
      // Options d'affichage des icônes
      showPhoneIcon: signatureData.showPhoneIcon ?? true,
      showMobileIcon: signatureData.showMobileIcon ?? true,
      showEmailIcon: signatureData.showEmailIcon ?? true,
      showAddressIcon: signatureData.showAddressIcon ?? true,
      showWebsiteIcon: signatureData.showWebsiteIcon ?? true,
      // Couleurs
      primaryColor: signatureData.primaryColor || "#2563eb",
      colors: {
        name: signatureData.colors?.name || "#2563eb",
        position: signatureData.colors?.position || "#666666",
        company: signatureData.colors?.company || "#2563eb",
        contact: signatureData.colors?.contact || "#666666",
        separatorVertical: signatureData.colors?.separatorVertical || "#e0e0e0",
        separatorHorizontal: signatureData.colors?.separatorHorizontal || "#e0e0e0"
      },
      // Configuration layout
      nameSpacing: signatureData.nameSpacing || 4,
      nameAlignment: signatureData.nameAlignment || "left",
      layout: signatureData.layout || "horizontal",
      columnWidths: {
        photo: signatureData.columnWidths?.photo || 25,
        content: signatureData.columnWidths?.content || 75
      },
      // Images
      photo: signatureData.photo || null,
      photoKey: signatureData.photoKey || null,
      logo: signatureData.logo || null,
      logoKey: signatureData.logoKey || null,
      imageSize: signatureData.imageSize || 80,
      imageShape: signatureData.imageShape || "round",
      logoSize: signatureData.logoSize || 60,
      // Séparateurs
      separatorVerticalWidth: signatureData.separatorVerticalWidth || 1,
      separatorHorizontalWidth: signatureData.separatorHorizontalWidth || 1,
      // Espacements
      spacings: {
        global: signatureData.spacings?.global || 8,
        photoBottom: signatureData.spacings?.photoBottom || 12,
        logoBottom: signatureData.spacings?.logoBottom || 12,
        nameBottom: signatureData.spacings?.nameBottom || 8,
        positionBottom: signatureData.spacings?.positionBottom || 8,
        companyBottom: signatureData.spacings?.companyBottom || 12,
        contactBottom: signatureData.spacings?.contactBottom || 6,
        phoneToMobile: signatureData.spacings?.phoneToMobile || 4,
        mobileToEmail: signatureData.spacings?.mobileToEmail || 4,
        emailToWebsite: signatureData.spacings?.emailToWebsite || 4,
        websiteToAddress: signatureData.spacings?.websiteToAddress || 4,
        separatorTop: signatureData.spacings?.separatorTop || 12,
        separatorBottom: signatureData.spacings?.separatorBottom || 12
      },
      // Typographie
      fontFamily: signatureData.fontFamily || "Arial, sans-serif",
      fontSize: {
        name: signatureData.fontSize?.name || 16,
        position: signatureData.fontSize?.position || 14,
        contact: signatureData.fontSize?.contact || 12
      }
    };
  };

  const handleSave = async () => {
    console.log("🚀 Début de la sauvegarde");
    
    // Utiliser la fonction prepareSignatureData qui contient TOUS les champs avancés
    const completeData = prepareSignatureData();
    
    // Remplacer le nom et le statut par défaut avec les valeurs du modal
    const finalData = {
      ...completeData,
      signatureName: signatureName || "Ma signature",
      isDefault: isDefault || false
    };
    
    console.log("📝 Données complètes pour sauvegarde:", finalData);
    console.log("🎨 Couleurs incluses:", finalData.colors);
    console.log("📏 Largeurs colonnes incluses:", finalData.columnWidths);
    console.log("📎 Espacements inclus:", finalData.spacings);
    console.log("🔤 Tailles police incluses:", finalData.fontSize);
    
    try {
      if (existingSignatureId) {
        // Mise à jour d'une signature existante
        console.log("📝 Mise à jour de la signature existante:", existingSignatureId);
        await updateSignature({
          variables: {
            input: {
              id: existingSignatureId,
              ...finalData
            }
          }
        });
      } else {
        // Création d'une nouvelle signature
        console.log("✨ Création d'une nouvelle signature avec TOUS les champs avancés");
        const result = await createSignature({
          variables: {
            input: finalData
          }
        });
        console.log("✅ Signature créée avec succès:", result.data.createEmailSignature);
      }
      
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
      setSaveStatus('error');
    }
  };

  const handleOpenModal = () => {
    setSignatureName(signatureData.signatureName || "");
    setIsDefault(signatureData.isDefault || false);
    setIsModalOpen(true);
  };

  // Ne pas rendre le composant côté serveur pour éviter l'erreur d'hydratation
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Bouton pour ouvrir le modal de sauvegarde */}
      <Button
        onClick={handleOpenModal}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        size="sm"
      >
        <Save className="w-4 h-4" />
        {existingSignatureId ? "Mettre à jour" : "Sauvegarder"}
      </Button>

      {/* Modal de sauvegarde */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {existingSignatureId ? "Mettre à jour la signature" : "Sauvegarder la signature"}
            </h3>
            
            <div className="space-y-4">
              {/* Nom de la signature */}
              <div>
                <Label htmlFor="signatureName">Nom de la signature</Label>
                <Input
                  id="signatureName"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Ma signature professionnelle"
                  className="mt-1"
                />
              </div>

              {/* Signature par défaut */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="isDefault">Définir comme signature par défaut</Label>
              </div>

              {/* Status de sauvegarde */}
              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                  <Check className="w-4 h-4" />
                  <span>Signature sauvegardée avec succès !</span>
                </div>
              )}

              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  <span>Erreur lors de la sauvegarde</span>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !signatureName.trim()}
                className="flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {existingSignatureId ? "Mettre à jour" : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignatureSave;
