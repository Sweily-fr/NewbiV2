"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Save, LoaderCircleIcon, Check, AlertCircle } from "lucide-react";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

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
  const { signatureData, editingSignatureId } = useSignatureData();
  const { organization } = useActiveOrganization();
  const { workspaceId } = useRequiredWorkspace();
  const router = useRouter();
  
  // Utiliser editingSignatureId du hook si existingSignatureId n'est pas fourni
  const signatureId = existingSignatureId || editingSignatureId;
  
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState(
    signatureData.signatureName || ""
  );
  const [isDefault, setIsDefault] = useState(signatureData.isDefault || false);
  const [saveStatus, setSaveStatus] = useState(null); // null, 'success', 'error'

  // Éviter l'erreur d'hydratation
  useEffect(() => {
    setIsMounted(true);

    // Écouter l'événement de sauvegarde global
    const handleGlobalSave = () => {
      setIsModalOpen(true);
    };

    window.addEventListener("signature-save", handleGlobalSave);

    return () => {
      window.removeEventListener("signature-save", handleGlobalSave);
    };
  }, []);

  const [createSignature, { loading: creating }] = useMutation(
    CREATE_EMAIL_SIGNATURE,
    {
      refetchQueries: [],  // Pas besoin de refetch car on redirige
      onCompleted: (data) => {
        setSaveStatus("success");
        toast.success("Signature créée avec succès !");
        setTimeout(() => {
          setIsModalOpen(false);
          setSaveStatus(null);
          // Redirection vers le tableau des signatures
          router.push("/dashboard/outils/signatures-mail");
        }, 2000);
      },
      onError: (error) => {
        console.error("❌ Erreur création signature:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus(null), 3000);
      },
    }
  );

  const [updateSignature, { loading: updating }] = useMutation(
    UPDATE_EMAIL_SIGNATURE,
    {
      refetchQueries: [],  // Pas besoin de refetch car on redirige
      onCompleted: (data) => {
        setSaveStatus("success");
        toast.success("Signature mise à jour avec succès !");
        setTimeout(() => {
          setIsModalOpen(false);
          setSaveStatus(null);
          // Redirection vers le tableau des signatures
          router.push("/dashboard/outils/signatures-mail");
        }, 2000);
      },
      onError: (error) => {
        console.error("❌ Erreur mise à jour signature:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus(null), 3000);
      },
    }
  );

  const isLoading = creating || updating;

  // Préparer les données pour l'API
  const prepareSignatureData = () => {
    const data = {
      signatureName,
      isDefault,
      workspaceId: organization?.id,
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
      companyName: signatureData.company || signatureData.companyName || null,
      // Réseaux sociaux
      socialNetworks: {
        facebook: signatureData.socialNetworks?.facebook || "",
        instagram: signatureData.socialNetworks?.instagram || "",
        linkedin: signatureData.socialNetworks?.linkedin || "",
        x: signatureData.socialNetworks?.x || "",
      },
      // Couleurs personnalisées pour chaque réseau social (noms de couleurs, pas hex)
      socialColors: {
        facebook: signatureData.socialColors?.facebook || null,
        instagram: signatureData.socialColors?.instagram || null,
        linkedin: signatureData.socialColors?.linkedin || null,
        x: signatureData.socialColors?.x || null,
        github: signatureData.socialColors?.github || null,
        youtube: signatureData.socialColors?.youtube || null,
      },
      // URLs des icônes personnalisées sur Cloudflare
      customSocialIcons: {
        facebook: signatureData.customSocialIcons?.facebook || "",
        instagram: signatureData.customSocialIcons?.instagram || "",
        linkedin: signatureData.customSocialIcons?.linkedin || "",
        x: signatureData.customSocialIcons?.x || "",
      },
      // Couleur globale et taille des icônes sociales
      socialGlobalColor: signatureData.socialGlobalColor || null,
      socialSize: signatureData.socialSize || 24,
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
        separatorHorizontal:
          signatureData.colors?.separatorHorizontal || "#e0e0e0",
      },
      // Configuration layout
      nameSpacing: signatureData.nameSpacing ?? signatureData.spacings?.nameSpacing ?? 4,
      nameAlignment: signatureData.nameAlignment || "left",
      layout: signatureData.layout || signatureData.orientation || "horizontal",
      orientation: signatureData.orientation || signatureData.layout || "horizontal",
      columnWidths: {
        photo: signatureData.columnWidths?.photo || 25,
        content: signatureData.columnWidths?.content || 75,
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
      separatorVerticalWidth: signatureData.separators?.vertical?.width ?? signatureData.separatorVerticalWidth ?? 1,
      separatorHorizontalWidth: signatureData.separators?.horizontal?.width ?? signatureData.separatorHorizontalWidth ?? 1,
      // Espacements - utiliser ?? au lieu de || pour permettre la valeur 0
      spacings: {
        global: signatureData.spacings?.global ?? 8,
        photoBottom: signatureData.spacings?.photoBottom ?? 12,
        logoBottom: signatureData.spacings?.logoBottom ?? 12,
        nameBottom: signatureData.spacings?.nameBottom ?? 8,
        positionBottom: signatureData.spacings?.positionBottom ?? 8,
        companyBottom: signatureData.spacings?.companyBottom ?? 12,
        contactBottom: signatureData.spacings?.contactBottom ?? 6,
        phoneToMobile: signatureData.spacings?.phoneToMobile ?? 4,
        mobileToEmail: signatureData.spacings?.mobileToEmail ?? 4,
        emailToWebsite: signatureData.spacings?.emailToWebsite ?? 4,
        websiteToAddress: signatureData.spacings?.websiteToAddress ?? 4,
        separatorTop: signatureData.spacings?.separatorTop ?? 12,
        separatorBottom: signatureData.spacings?.separatorBottom ?? 12,
        // Espacements spécifiques aux orientations
        logoToSocial: signatureData.spacings?.logoToSocial ?? 12,
        verticalSeparatorLeft: signatureData.spacings?.verticalSeparatorLeft ?? 22,
        verticalSeparatorRight: signatureData.spacings?.verticalSeparatorRight ?? 22,
      },
      // Mode espacement détaillé
      detailedSpacing: signatureData.detailedSpacing ?? false,
      // Typographie
      fontFamily: signatureData.fontFamily || signatureData.typography?.fontFamily || "Arial, sans-serif",
      fontSize: {
        name: signatureData.fontSize?.name || signatureData.typography?.fullName?.fontSize || 16,
        position: signatureData.fontSize?.position || signatureData.typography?.position?.fontSize || 14,
        contact: signatureData.fontSize?.contact || signatureData.typography?.phone?.fontSize || 12,
      },
      // Typographie détaillée
      typography: {
        fullName: {
          fontFamily: signatureData.typography?.fullName?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.fullName?.fontSize || 16,
          color: signatureData.typography?.fullName?.color || "#171717",
          fontWeight: signatureData.typography?.fullName?.fontWeight || "normal",
          fontStyle: signatureData.typography?.fullName?.fontStyle || "normal",
          textDecoration: signatureData.typography?.fullName?.textDecoration || "none",
        },
        position: {
          fontFamily: signatureData.typography?.position?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.position?.fontSize || 14,
          color: signatureData.typography?.position?.color || "#666666",
          fontWeight: signatureData.typography?.position?.fontWeight || "normal",
          fontStyle: signatureData.typography?.position?.fontStyle || "normal",
          textDecoration: signatureData.typography?.position?.textDecoration || "none",
        },
        company: {
          fontFamily: signatureData.typography?.company?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.company?.fontSize || 14,
          color: signatureData.typography?.company?.color || "#171717",
          fontWeight: signatureData.typography?.company?.fontWeight || "normal",
          fontStyle: signatureData.typography?.company?.fontStyle || "normal",
          textDecoration: signatureData.typography?.company?.textDecoration || "none",
        },
        email: {
          fontFamily: signatureData.typography?.email?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.email?.fontSize || 12,
          color: signatureData.typography?.email?.color || "#666666",
          fontWeight: signatureData.typography?.email?.fontWeight || "normal",
          fontStyle: signatureData.typography?.email?.fontStyle || "normal",
          textDecoration: signatureData.typography?.email?.textDecoration || "none",
        },
        phone: {
          fontFamily: signatureData.typography?.phone?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.phone?.fontSize || 12,
          color: signatureData.typography?.phone?.color || "#666666",
          fontWeight: signatureData.typography?.phone?.fontWeight || "normal",
          fontStyle: signatureData.typography?.phone?.fontStyle || "normal",
          textDecoration: signatureData.typography?.phone?.textDecoration || "none",
        },
        mobile: {
          fontFamily: signatureData.typography?.mobile?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.mobile?.fontSize || 12,
          color: signatureData.typography?.mobile?.color || "#666666",
          fontWeight: signatureData.typography?.mobile?.fontWeight || "normal",
          fontStyle: signatureData.typography?.mobile?.fontStyle || "normal",
          textDecoration: signatureData.typography?.mobile?.textDecoration || "none",
        },
        website: {
          fontFamily: signatureData.typography?.website?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.website?.fontSize || 12,
          color: signatureData.typography?.website?.color || "#666666",
          fontWeight: signatureData.typography?.website?.fontWeight || "normal",
          fontStyle: signatureData.typography?.website?.fontStyle || "normal",
          textDecoration: signatureData.typography?.website?.textDecoration || "none",
        },
        address: {
          fontFamily: signatureData.typography?.address?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.address?.fontSize || 12,
          color: signatureData.typography?.address?.color || "#666666",
          fontWeight: signatureData.typography?.address?.fontWeight || "normal",
          fontStyle: signatureData.typography?.address?.fontStyle || "normal",
          textDecoration: signatureData.typography?.address?.textDecoration || "none",
        },
      },
    };
  };

  const handleSave = async () => {
    
    
    // Utiliser la fonction prepareSignatureData qui contient TOUS les champs avancés
    const completeData = prepareSignatureData();

    // Remplacer le nom et le statut par défaut avec les valeurs du modal
    const finalData = {
      ...completeData,
      signatureName,
      isDefault,
    };

    console.log("💾 [SAVE] Données à sauvegarder:", {
      socialGlobalColor: finalData.socialGlobalColor,
      socialSize: finalData.socialSize,
    });

    try {
      if (signatureId) {
        await updateSignature({
          variables: {
            input: {
              id: signatureId,
              ...finalData,
            },
          },
        });
      } else {
        // Création d'une nouvelle signature
        const result = await createSignature({
          variables: {
            input: finalData,
          },
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
      setSaveStatus("error");
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
        {signatureId ? "Mettre à jour" : "Sauvegarder"}
      </Button>

      {/* Modal de sauvegarde */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)' }}>
          <div 
            className="rounded-lg p-6 w-full max-w-md mx-4 border shadow-lg"
            style={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))'
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
              {signatureId
                ? "Mettre à jour la signature"
                : "Sauvegarder la signature"}
            </h3>

            <div className="space-y-4">
              {/* Nom de la signature */}
              <div>
                <Label htmlFor="signatureName" style={{ color: 'hsl(var(--foreground))' }}>Nom de la signature</Label>
                <Input
                  id="signatureName"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Ma signature professionnelle"
                  className="mt-1"
                  style={{
                    backgroundColor: 'hsl(var(--input))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </div>

              {/* Signature par défaut */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="isDefault" style={{ color: 'hsl(var(--foreground))' }}>
                  Définir comme signature par défaut
                </Label>
              </div>

              {/* Status de sauvegarde */}
              {saveStatus === "success" && (
                <div 
                  className="flex items-center gap-2 p-3 rounded-md border"
                  style={{
                    backgroundColor: 'hsl(var(--success) / 0.1)',
                    borderColor: 'hsl(var(--success) / 0.3)',
                    color: 'hsl(var(--success))'
                  }}
                >
                  <Check className="w-4 h-4" />
                  <span>Signature sauvegardée avec succès !</span>
                </div>
              )}

              {saveStatus === "error" && (
                <div 
                  className="flex items-center gap-2 p-3 rounded-md border"
                  style={{
                    backgroundColor: 'hsl(var(--destructive) / 0.1)',
                    borderColor: 'hsl(var(--destructive) / 0.3)',
                    color: 'hsl(var(--destructive))'
                  }}
                >
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
                className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !signatureName.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {isLoading && <LoaderCircleIcon className="-ms-1 animate-spin" size={16} aria-hidden="true" />}
                {signatureId ? "Mettre à jour" : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignatureSave;
