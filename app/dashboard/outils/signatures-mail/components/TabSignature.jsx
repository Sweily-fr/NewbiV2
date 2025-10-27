import {
  ScanEye,
  LayoutDashboard,
  Palette,
  Columns3Cog,
  Save,
  LoaderCircleIcon,
  Check,
  AlertCircle,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";

import { ScrollArea, ScrollBar } from "@/src/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useQuery } from "@apollo/client";

// Import du composant LayoutTab pour l'onglet 1
import LayoutTab from "./layout-tab/layout-tab";
import LayoutTabTypography from "./tab-typography/layout-tab";
import LayoutTabImg from "./layout-img/layout-tab";
import SignatureManager from "./SignatureManager";
import CancelConfirmationModal from "./CancelConfirmationModal";
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

// Query pour récupérer toutes les signatures (utilisée pour la mise à jour du cache)
const GET_MY_EMAIL_SIGNATURES = gql`
  query GetMyEmailSignatures($workspaceId: ID!) {
    getMyEmailSignatures(workspaceId: $workspaceId) {
      id
      signatureName
      firstName
      lastName
      email
      position
      companyName
      phone
      website
      address
      photo
      logo
      primaryColor
      isDefault
      createdAt
      updatedAt
    }
  }
`;

// Fonction utilitaire pour convertir HSL en HEX
const hslToHex = (hslString) => {
  if (!hslString || hslString.startsWith("#")) return hslString;

  const hslMatch = hslString.match(
    /hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
  );
  if (!hslMatch) return hslString;

  const h = parseFloat(hslMatch[1]) / 360;
  const s = parseFloat(hslMatch[2]) / 100;
  const l = parseFloat(hslMatch[3]) / 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Fonction utilitaire pour nettoyer les champs __typename
const cleanGraphQLData = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanGraphQLData);

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key !== "__typename") {
      cleaned[key] = cleanGraphQLData(value);
    }
  }
  return cleaned;
};

export function TabSignature({ existingSignatureId = null }) {
  const { signatureData } = useSignatureData();
  const { workspaceId } = useRequiredWorkspace();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState(
    signatureData.signatureName || ""
  );
  const [isDefault, setIsDefault] = useState(signatureData.isDefault || false);
  const [saveStatus, setSaveStatus] = useState(null); // null, 'success', 'error', 'duplicate'
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Récupérer toutes les signatures existantes pour vérifier les doublons
  const { data: signaturesData } = useQuery(GET_MY_EMAIL_SIGNATURES, {
    skip: !isModalOpen, // Charger uniquement quand le modal est ouvert
  });

  // Effet pour synchroniser le nom de la signature avec les données chargées
  useEffect(() => {
    if (signatureData.signatureName) {
      setSignatureName(signatureData.signatureName);
    }
    if (signatureData.isDefault !== undefined) {
      setIsDefault(signatureData.isDefault);
    }
  }, [signatureData.signatureName, signatureData.isDefault]);

  const [createSignature, { loading: creating, client }] = useMutation(
    CREATE_EMAIL_SIGNATURE,
    {
      refetchQueries: [{ query: GET_MY_EMAIL_SIGNATURES, variables: { workspaceId } }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        setSaveStatus("success");
        toast.success("Signature créée avec succès !");
        
        // Invalider tout le cache des signatures pour forcer le rechargement
        client.cache.evict({ fieldName: "getMyEmailSignatures" });
        client.cache.evict({ fieldName: "getEmailSignature" });
        client.cache.gc();

        // Redirection après un court délai pour laisser voir la notification
        setTimeout(() => {
          setSaveStatus(null);
          // Nettoyer le brouillon après sauvegarde réussie
          localStorage.removeItem("draftSignature");
          router.push("/dashboard/outils/signatures-mail");
        }, 1500);
      },
      onError: (error) => {
        console.error("❌ Erreur création:", error);
        setSaveStatus("error");
        toast.error("Erreur lors de la création de la signature");
        setTimeout(() => setSaveStatus(null), 3000);
      },
    }
  );

  const [updateSignature, { loading: updating, client: updateClient }] = useMutation(
    UPDATE_EMAIL_SIGNATURE,
    {
      refetchQueries: [{ query: GET_MY_EMAIL_SIGNATURES, variables: { workspaceId } }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        toast.success("Signature mise à jour avec succès !");
        
        // Invalider tout le cache des signatures pour forcer le rechargement
        updateClient.cache.evict({ fieldName: "getMyEmailSignatures" });
        updateClient.cache.evict({ fieldName: "getEmailSignature" });
        updateClient.cache.gc();

        // Redirection après un court délai pour laisser voir la notification
        setTimeout(() => {
          // Nettoyer le brouillon après sauvegarde réussie
          localStorage.removeItem("draftSignature");
          router.push("/dashboard/outils/signatures-mail");
        }, 1500);
      },
      onError: (error) => {
        console.error("❌ Erreur mise à jour:", error);
        toast.error("Erreur lors de la mise à jour de la signature");
      },
    }
  );

  const isLoading = creating || updating;

  // Fonction pour valider et normaliser une couleur hex
  const validateColor = (color) => {
    if (!color) return "#171717"; // Couleur par défaut
    
    // Si c'est déjà au bon format
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return color;
    }
    
    // Si c'est rgb(r, g, b), convertir en hex
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    
    // Si c'est hsl(h, s%, l%), convertir en hex
    const hslMatch = color.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
    if (hslMatch) {
      const h = parseFloat(hslMatch[1]) / 360;
      const s = parseFloat(hslMatch[2]) / 100;
      const l = parseFloat(hslMatch[3]) / 100;
      
      const hslToRgb = (h, s, l) => {
        let r, g, b;
        if (s === 0) {
          r = g = b = l;
        } else {
          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
          };
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
      };
      
      const [r, g, b] = hslToRgb(h, s, l);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Sinon, retourner la couleur par défaut
    return "#171717";
  };

  // Préparer les données pour l'API
  const prepareSignatureData = () => {
    // Extraire firstName et lastName du fullName si ils ne sont pas définis
    let firstName = signatureData.firstName || "";
    let lastName = signatureData.lastName || "";

    if (!firstName && !lastName && signatureData.fullName) {
      const nameParts = signatureData.fullName.trim().split(" ");
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      } else if (nameParts.length === 1) {
        firstName = nameParts[0];
        lastName = "";
      }
    }

    console.log(
      "👤 TabSignature - Noms extraits - firstName:",
      firstName,
      "lastName:",
      lastName
    );

    return {
      signatureName,
      isDefault,
      workspaceId, // Ajouter le workspaceId dans les données
      // Orientation de la signature
      orientation: signatureData.orientation || "vertical",
      // Informations personnelles
      firstName,
      lastName,
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
        separatorVertical: hslToHex(
          signatureData.colors?.separatorVertical || "#e0e0e0"
        ),
        separatorHorizontal: hslToHex(
          signatureData.colors?.separatorHorizontal || "#e0e0e0"
        ),
      },
      // Configuration layout
      nameSpacing: signatureData.nameSpacing || 4,
      nameAlignment: signatureData.nameAlignment || "left",
      layout: signatureData.layout || "horizontal",
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
        separatorBottom: signatureData.spacings?.separatorBottom || 12,
      },
      // Réseaux sociaux (seulement ceux qui ont une URL et sont supportés par le backend)
      socialNetworks: (() => {
        const networks = {};
        const socialData = signatureData.socialNetworks || {};

        // Liste des réseaux sociaux supportés par le backend GraphQL
        const supportedNetworks = [
          "facebook",
          "instagram",
          "linkedin",
          "x",
          "github",
          "youtube",
        ];

        // Ne garder que les réseaux supportés qui ont une URL non vide
        supportedNetworks.forEach((platform) => {
          if (socialData[platform] && socialData[platform].trim() !== "") {
            networks[platform] = socialData[platform];
          }
        });

        return networks;
      })(),
      // Couleurs personnalisées pour chaque réseau social (noms de couleurs)
      socialColors: {
        facebook: signatureData.socialColors?.facebook || null,
        instagram: signatureData.socialColors?.instagram || null,
        linkedin: signatureData.socialColors?.linkedin || null,
        x: signatureData.socialColors?.x || null,
        github: signatureData.socialColors?.github || null,
        youtube: signatureData.socialColors?.youtube || null,
      },
      // Couleur globale et taille des icônes sociales
      socialGlobalColor: signatureData.socialGlobalColor || null,
      socialSize: signatureData.socialSize || 24,
      // Typographie détaillée pour chaque champ
      typography: {
        fullName: {
          fontFamily: signatureData.typography?.fullName?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.fullName?.fontSize || 16,
          color: validateColor(signatureData.typography?.fullName?.color),
          fontWeight: signatureData.typography?.fullName?.fontWeight || "normal",
          fontStyle: signatureData.typography?.fullName?.fontStyle || "normal",
          textDecoration: signatureData.typography?.fullName?.textDecoration || "none",
        },
        position: {
          fontFamily: signatureData.typography?.position?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.position?.fontSize || 14,
          color: validateColor(signatureData.typography?.position?.color),
          fontWeight: signatureData.typography?.position?.fontWeight || "normal",
          fontStyle: signatureData.typography?.position?.fontStyle || "normal",
          textDecoration: signatureData.typography?.position?.textDecoration || "none",
        },
        company: {
          fontFamily: signatureData.typography?.company?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.company?.fontSize || 14,
          color: validateColor(signatureData.typography?.company?.color),
          fontWeight: signatureData.typography?.company?.fontWeight || "normal",
          fontStyle: signatureData.typography?.company?.fontStyle || "normal",
          textDecoration: signatureData.typography?.company?.textDecoration || "none",
        },
        email: {
          fontFamily: signatureData.typography?.email?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.email?.fontSize || 12,
          color: validateColor(signatureData.typography?.email?.color),
          fontWeight: signatureData.typography?.email?.fontWeight || "normal",
          fontStyle: signatureData.typography?.email?.fontStyle || "normal",
          textDecoration: signatureData.typography?.email?.textDecoration || "none",
        },
        phone: {
          fontFamily: signatureData.typography?.phone?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.phone?.fontSize || 12,
          color: validateColor(signatureData.typography?.phone?.color),
          fontWeight: signatureData.typography?.phone?.fontWeight || "normal",
          fontStyle: signatureData.typography?.phone?.fontStyle || "normal",
          textDecoration: signatureData.typography?.phone?.textDecoration || "none",
        },
        mobile: {
          fontFamily: signatureData.typography?.mobile?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.mobile?.fontSize || 12,
          color: validateColor(signatureData.typography?.mobile?.color),
          fontWeight: signatureData.typography?.mobile?.fontWeight || "normal",
          fontStyle: signatureData.typography?.mobile?.fontStyle || "normal",
          textDecoration: signatureData.typography?.mobile?.textDecoration || "none",
        },
        website: {
          fontFamily: signatureData.typography?.website?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.website?.fontSize || 12,
          color: validateColor(signatureData.typography?.website?.color),
          fontWeight: signatureData.typography?.website?.fontWeight || "normal",
          fontStyle: signatureData.typography?.website?.fontStyle || "normal",
          textDecoration: signatureData.typography?.website?.textDecoration || "none",
        },
        address: {
          fontFamily: signatureData.typography?.address?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.address?.fontSize || 12,
          color: validateColor(signatureData.typography?.address?.color),
          fontWeight: signatureData.typography?.address?.fontWeight || "normal",
          fontStyle: signatureData.typography?.address?.fontStyle || "normal",
          textDecoration: signatureData.typography?.address?.textDecoration || "none",
        },
      },
      // Typographie ancienne structure (pour compatibilité)
      fontFamily: signatureData.fontFamily || "Arial, sans-serif",
      fontSize: {
        name: signatureData.fontSize?.name || 16,
        position: signatureData.fontSize?.position || 14,
        contact: signatureData.fontSize?.contact || 12,
      },
    };
  };

  const handleSave = async () => {
    // Vérifier si le nom existe déjà (sauf si c'est la même signature en édition)
    const existingSignatures = signaturesData?.getMyEmailSignatures || [];
    const isDuplicate = existingSignatures.some(
      (sig) =>
        sig.signatureName.toLowerCase() === signatureName.toLowerCase() &&
        sig.id !== existingSignatureId // Permettre le même nom si on édite la même signature
    );

    if (isDuplicate) {
      setErrorMessage("Ce nom de signature existe déjà");
      setSaveStatus("duplicate");
      return; // Ne pas fermer le modal
    }

    // Réinitialiser le message d'erreur si pas de doublon
    setErrorMessage(null);
    setSaveStatus(null);

    // Utiliser la fonction prepareSignatureData qui contient TOUS les champs avancés
    const completeData = prepareSignatureData();

    // Remplacer le nom et le statut par défaut avec les valeurs du modal
    const rawData = {
      ...completeData,
      signatureName: signatureName || "Ma signature",
      isDefault: isDefault || false,
    };

    // Nettoyer les données pour supprimer tous les champs __typename
    const finalData = cleanGraphQLData(rawData);

    // Données prêtes pour l'envoi

    try {
      if (existingSignatureId) {
        // Mise à jour d'une signature existante

        await updateSignature({
          variables: {
            input: {
              id: existingSignatureId,
              ...finalData,
            },
          },
        });
      } else {
        const result = await createSignature({
          variables: {
            input: finalData,
          },
        });
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde", {
        description:
          error.message || "Une erreur est survenue lors de la sauvegarde.",
      });
      setSaveStatus("error");
      setErrorMessage("Erreur lors de la sauvegarde");
    }
  };

  const handleOpenModal = () => {
    setSignatureName(signatureData.signatureName || "");
    setIsDefault(signatureData.isDefault || false);
    setIsModalOpen(true);
  };

  const handleCancelClick = () => {
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirmation(false);
    router.push("/dashboard/outils/signatures-mail");
  };

  const handleCloseCancelModal = () => {
    setShowCancelConfirmation(false);
  };
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="tab-1" className="flex flex-col h-full">
        {/* Header fixe avec les onglets */}
        <div className="flex-shrink-0 p-5 pb-0">
          <ScrollArea className="w-full">
            <TabsList className="mb-3 w-full">
              <TabsTrigger value="tab-1" className="flex-1">
                <LayoutDashboard size={16} aria-hidden="true" />
              </TabsTrigger>
              <TabsTrigger value="tab-2" className="group flex-1">
                <Palette size={16} aria-hidden="true" />
              </TabsTrigger>
              {/* <TabsTrigger value="tab-3" className="group flex-1">
                <ScanEye size={16} aria-hidden="true" />
              </TabsTrigger> */}
              {/* <TabsTrigger value="tab-4" className="group">
                <Columns3Cog size={16} aria-hidden="true" />
              </TabsTrigger> */}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-5 max-h-[calc(100vh-9.5rem)]">
          <TabsContent value="tab-1" className="w-full mt-0">
            <LayoutTab />
          </TabsContent>
          <TabsContent value="tab-2" className="w-full mt-0">
            <LayoutTabTypography />
          </TabsContent>
          <TabsContent value="tab-3" className="w-full mt-0">
            <LayoutTabImg />
          </TabsContent>
          <TabsContent value="tab-4" className="w-full mt-0">
            <SignatureManager />
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer fixe avec les boutons */}
      <div className="flex-shrink-0 py-4 mx-4 border-t">
        <div className="flex justify-between">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={handleCancelClick}
          >
            Annuler
          </Button>
          <Button
            className="cursor-pointer flex items-center font-normal gap-2"
            onClick={handleOpenModal}
            disabled={isLoading}
          >
            {isLoading && <LoaderCircleIcon className="-ms-1 animate-spin" size={16} aria-hidden="true" />}
            <Save className="w-4 h-4" />
            {existingSignatureId ? "Mettre à jour" : "Sauvegarder"}
          </Button>
        </div>
      </div>
      {/* Modal de sauvegarde */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)' }}>
          <div 
            className="rounded-lg p-6 w-full max-w-md mx-4 border shadow-lg"
            style={{
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              color: '#f1f5f9'
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#f1f5f9' }}>
              {existingSignatureId
                ? "Mettre à jour la signature"
                : "Sauvegarder la signature"}
            </h3>

            <div className="space-y-4">
              {/* Nom de la signature */}
              <div>
                <Label htmlFor="signatureName" style={{ color: '#cbd5e1' }}>Nom de la signature</Label>
                <Input
                  id="signatureName"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Ma signature professionnelle"
                  className="mt-1"
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f1f5f9'
                  }}
                />
              </div>

              {/* Signature par défaut */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  className="scale-75"
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="isDefault" style={{ color: '#cbd5e1' }}>
                  Définir comme signature par défaut
                </Label>
              </div>

              {/* Status de sauvegarde */}
              {(saveStatus === "error" || saveStatus === "duplicate") && (
                <div 
                  className="flex items-center gap-2 p-3 rounded-md border"
                  style={{
                    backgroundColor: '#7f1d1d',
                    borderColor: '#991b1b',
                    color: '#fca5a5'
                  }}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMessage || "Erreur lors de la sauvegarde"}</span>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#f1f5f9',
                  border: '1px solid #334155'
                }}
              >
                Continuer l'édition
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !signatureName.trim()}
                className="flex items-center font-normal gap-2"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#fff'
                }}
              >
                {isLoading && <LoaderCircleIcon className="-ms-1 animate-spin" size={16} aria-hidden="true" />}
                {existingSignatureId ? "Mettre à jour" : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation d'annulation */}
      <CancelConfirmationModal
        isOpen={showCancelConfirmation}
        onClose={handleCloseCancelModal}
        onConfirm={handleConfirmCancel}
        title="Annuler la création de signature ?"
        message="Êtes-vous sûr de vouloir annuler ? Toutes les modifications non sauvegardées seront perdues et vous serez redirigé vers la liste des signatures."
      />
    </div>
  );
}
