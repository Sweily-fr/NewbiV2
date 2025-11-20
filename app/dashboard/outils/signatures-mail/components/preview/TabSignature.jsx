import {
  LayoutDashboard,
  Palette,
  Save,
  LoaderCircleIcon,
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
import { useQuery } from "@apollo/client";

// Import des composants d'édition
import LayoutContent from "../editor/layout/LayoutContent";
import TypographyContent from "../editor/typography/TypographyContent";
import CancelConfirmationModal from "../modals/CancelConfirmationModal";
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
  query GetMyEmailSignatures {
    getMyEmailSignatures {
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
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState(
    signatureData.signatureName || ""
  );
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
  }, [signatureData.signatureName]);

  const [createSignature, { loading: creating, client }] = useMutation(
    CREATE_EMAIL_SIGNATURE,
    {
      refetchQueries: [GET_MY_EMAIL_SIGNATURES],
      awaitRefetchQueries: false,
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
      refetchQueries: [GET_MY_EMAIL_SIGNATURES],
      awaitRefetchQueries: false,
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
      // workspaceId, // Plus nécessaire - le backend filtre automatiquement par utilisateur
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
      photoVisible: signatureData.photoVisible !== false, // Par défaut visible
      logo: signatureData.logo || null,
      logoKey: signatureData.logoKey || null,
      imageSize: signatureData.imageSize || 70,
      imageShape: signatureData.imageShape || "round",
      logoSize: signatureData.logoSize || 60,
      // Séparateurs
      separatorVerticalWidth: signatureData.separatorVerticalWidth || 1,
      separatorHorizontalWidth: signatureData.separatorHorizontalWidth || 1,
      // Espacements
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
        logoToSocial: signatureData.spacings?.logoToSocial ?? 12,
        verticalSeparatorLeft: signatureData.spacings?.verticalSeparatorLeft ?? 22,
        verticalSeparatorRight: signatureData.spacings?.verticalSeparatorRight ?? 22,
      },
      // Mode espacement détaillé
      detailedSpacing: signatureData.detailedSpacing ?? false,
      // Paddings détaillés pour chaque élément
      paddings: {
        photo: {
          top: signatureData.paddings?.photo?.top ?? 0,
          right: signatureData.paddings?.photo?.right ?? 0,
          bottom: signatureData.paddings?.photo?.bottom ?? (signatureData.spacings?.global ?? 8),
          left: signatureData.paddings?.photo?.left ?? 0,
        },
        name: {
          top: signatureData.paddings?.name?.top ?? 0,
          right: signatureData.paddings?.name?.right ?? 0,
          bottom: signatureData.paddings?.name?.bottom ?? (signatureData.spacings?.global ?? 8),
          left: signatureData.paddings?.name?.left ?? 0,
        },
        position: {
          top: signatureData.paddings?.position?.top ?? 0,
          right: signatureData.paddings?.position?.right ?? 0,
          bottom: signatureData.paddings?.position?.bottom ?? (signatureData.spacings?.global ?? 8),
          left: signatureData.paddings?.position?.left ?? 0,
        },
        company: {
          top: signatureData.paddings?.company?.top ?? 0,
          right: signatureData.paddings?.company?.right ?? 0,
          bottom: signatureData.paddings?.company?.bottom ?? (signatureData.spacings?.global ?? 8),
          left: signatureData.paddings?.company?.left ?? 0,
        },
        phone: {
          top: signatureData.paddings?.phone?.top ?? 0,
          right: signatureData.paddings?.phone?.right ?? 0,
          bottom: signatureData.paddings?.phone?.bottom ?? (signatureData.spacings?.global ?? 8),
          left: signatureData.paddings?.phone?.left ?? 0,
        },
        mobile: {
          top: signatureData.paddings?.mobile?.top ?? 0,
          right: signatureData.paddings?.mobile?.right ?? 0,
          bottom: signatureData.paddings?.mobile?.bottom ?? (signatureData.spacings?.global ?? 8),
          left: signatureData.paddings?.mobile?.left ?? 0,
        },
        email: {
          top: signatureData.paddings?.email?.top ?? 0,
          right: signatureData.paddings?.email?.right ?? 0,
          bottom: signatureData.paddings?.email?.bottom ?? (signatureData.spacings?.global ?? 8),
          left: signatureData.paddings?.email?.left ?? 0,
        },
        website: {
          top: signatureData.paddings?.website?.top ?? 0,
          right: signatureData.paddings?.website?.right ?? 0,
          bottom: signatureData.paddings?.website?.bottom ?? (signatureData.spacings?.global ?? 8),
          left: signatureData.paddings?.website?.left ?? 0,
        },
        address: {
          top: signatureData.paddings?.address?.top ?? 0,
          right: signatureData.paddings?.address?.right ?? 0,
          bottom: signatureData.paddings?.address?.bottom ?? (signatureData.spacings?.global ?? 8),
          left: signatureData.paddings?.address?.left ?? 0,
        },
        separatorHorizontal: {
          top: signatureData.paddings?.separatorHorizontal?.top ?? (signatureData.spacings?.global ?? 8),
          right: signatureData.paddings?.separatorHorizontal?.right ?? 0,
          bottom: signatureData.paddings?.separatorHorizontal?.bottom ?? (signatureData.spacings?.global ?? 8),
          left: signatureData.paddings?.separatorHorizontal?.left ?? 0,
        },
        separatorVertical: {
          top: signatureData.paddings?.separatorVertical?.top ?? 0,
          right: signatureData.paddings?.separatorVertical?.right ?? 4,
          bottom: signatureData.paddings?.separatorVertical?.bottom ?? 0,
          left: signatureData.paddings?.separatorVertical?.left ?? 4,
        },
        logo: {
          top: signatureData.paddings?.logo?.top ?? (signatureData.spacings?.global ?? 8),
          right: signatureData.paddings?.logo?.right ?? 0,
          bottom: signatureData.paddings?.logo?.bottom ?? 0,
          left: signatureData.paddings?.logo?.left ?? 0,
        },
        social: {
          top: signatureData.paddings?.social?.top ?? (signatureData.spacings?.global ?? 8),
          right: signatureData.paddings?.social?.right ?? 0,
          bottom: signatureData.paddings?.social?.bottom ?? 0,
          left: signatureData.paddings?.social?.left ?? 0,
        },
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
    };

    // Nettoyer les données pour supprimer tous les champs __typename
    const finalData = cleanGraphQLData(rawData);

    // Données prêtes pour l'envoi
    console.log("📤 Données à envoyer:", {
      detailedSpacing: finalData.detailedSpacing,
      paddings: finalData.paddings,
      spacings: finalData.spacings,
    });

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

  const [activeTab, setActiveTab] = useState("tab-1");

  // Debug: vérifier si le composant se rend plusieurs fois
  console.log("🔍 TabSignature rendu - existingSignatureId:", existingSignatureId);

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
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
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Contenu scrollable - prend l'espace restant automatiquement */}
        <div className="flex-1 overflow-y-auto px-5 min-h-0">
          {activeTab === "tab-1" && (
            <div className="w-full space-y-6 mt-4">
              <LayoutContent />
            </div>
          )}
          {activeTab === "tab-2" && (
            <div className="w-full space-y-6 mt-4">
              <TypographyContent />
            </div>
          )}
        </div>

        {/* Footer fixe en bas - en dehors du contenu scrollable */}
        <div className="flex-shrink-0 py-3 px-5 border-t">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="cursor-pointer flex-1"
              onClick={handleCancelClick}
            >
              Annuler
            </Button>
            <Button
              className="cursor-pointer flex-1 flex items-center justify-center font-normal gap-2"
              onClick={handleOpenModal}
              disabled={isLoading}
            >
              {isLoading && <LoaderCircleIcon className="-ms-1 animate-spin" size={16} aria-hidden="true" />}
              <Save className="w-4 h-4" />
              {existingSignatureId ? "Mettre à jour" : "Sauvegarder"}
            </Button>
          </div>
        </div>
      </Tabs>
      
      {/* Modal de sauvegarde */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 dark:bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-lg p-6 w-full max-w-md mx-4 border shadow-lg bg-card text-card-foreground">
            <h3 className="text-lg font-semibold mb-4">
              {existingSignatureId
                ? "Mettre à jour la signature"
                : "Sauvegarder la signature"}
            </h3>

            <div className="space-y-4">
              {/* Nom de la signature */}
              <div>
                <Label htmlFor="signatureName" className="text-sm font-medium text-muted-foreground">
                  Nom de la signature
                </Label>
                <Input
                  id="signatureName"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Ma signature professionnelle"
                  className="mt-1"
                />
              </div>

              {/* Status de sauvegarde */}
              {(saveStatus === "error" || saveStatus === "duplicate") && (
                <div 
                  className="flex items-center gap-2 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
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
                variant="outline"
                disabled={isLoading}
              >
                Continuer l'édition
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !signatureName.trim()}
                className="flex items-center font-normal gap-2"
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
    </>
  );
}
