"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon, AlertCircle } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
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

// Query pour récupérer toutes les signatures (pour vérification des doublons)
const GET_MY_EMAIL_SIGNATURES = gql`
  query GetMyEmailSignatures {
    getMyEmailSignatures {
      id
      signatureName
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

// Fonction pour valider et normaliser une couleur hex
const validateColor = (color) => {
  if (!color) return "#171717";

  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return color;
  }

  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  return hslToHex(color) || "#171717";
};

// Convertir fontWeight numérique en valeur enum acceptée par le backend
const normalizeFontWeight = (weight) => {
  if (!weight) return "normal";
  // Si c'est déjà une chaîne valide, la retourner
  if (typeof weight === "string" && ["normal", "bold"].includes(weight)) {
    return weight;
  }
  // Convertir les valeurs numériques
  const numWeight = typeof weight === "number" ? weight : parseInt(weight, 10);
  if (isNaN(numWeight)) return "normal";
  // 100-500 → normal, 600-900 → bold
  return numWeight >= 600 ? "bold" : "normal";
};

export default function SaveSignatureModal({ existingSignatureId = null }) {
  const router = useRouter();
  const client = useApolloClient();
  const { signatureData, showSaveModal, closeSaveModal, rootContainer } = useSignatureData();


  const [signatureName, setSignatureName] = useState(signatureData.signatureName || "");
  const [saveStatus, setSaveStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Récupérer toutes les signatures existantes pour vérifier les doublons
  const { data: signaturesData } = useQuery(GET_MY_EMAIL_SIGNATURES, {
    skip: !showSaveModal,
  });

  // Synchroniser le nom avec les données
  useEffect(() => {
    if (signatureData.signatureName) {
      setSignatureName(signatureData.signatureName);
    }
  }, [signatureData.signatureName]);

  // Reset état quand le modal s'ouvre
  useEffect(() => {
    if (showSaveModal) {
      setSaveStatus(null);
      setErrorMessage(null);
    }
  }, [showSaveModal]);

  const [createSignature, { loading: creating }] = useMutation(
    CREATE_EMAIL_SIGNATURE,
    {
      refetchQueries: [GET_MY_EMAIL_SIGNATURES],
      awaitRefetchQueries: false,
      onCompleted: () => {
        setSaveStatus("success");
        toast.success("Signature créée avec succès !");
        client.cache.evict({ fieldName: "getMyEmailSignatures" });
        client.cache.evict({ fieldName: "getEmailSignature" });
        client.cache.gc();
        setTimeout(() => {
          closeSaveModal();
          router.push("/dashboard/outils/signatures-mail");
        }, 1500);
      },
      onError: (error) => {
        console.error("❌ Erreur création:", error);
        setSaveStatus("error");
        setErrorMessage("Erreur lors de la création de la signature");
        toast.error("Erreur lors de la création de la signature");
      },
    }
  );

  const [updateSignature, { loading: updating }] = useMutation(
    UPDATE_EMAIL_SIGNATURE,
    {
      refetchQueries: [GET_MY_EMAIL_SIGNATURES],
      awaitRefetchQueries: false,
      onCompleted: () => {
        toast.success("Signature mise à jour avec succès !");
        client.cache.evict({ fieldName: "getMyEmailSignatures" });
        client.cache.evict({ fieldName: "getEmailSignature" });
        client.cache.gc();
        setTimeout(() => {
          closeSaveModal();
          router.push("/dashboard/outils/signatures-mail");
        }, 1500);
      },
      onError: (error) => {
        console.error("❌ Erreur mise à jour:", error);
        setSaveStatus("error");
        setErrorMessage("Erreur lors de la mise à jour de la signature");
        toast.error("Erreur lors de la mise à jour de la signature");
      },
    }
  );

  const isLoading = creating || updating;

  // Préparer les données pour l'API
  const prepareSignatureData = () => {
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

    return {
      signatureName,
      orientation: signatureData.orientation || "vertical",
      firstName,
      lastName,
      position: signatureData.position || "",
      email: signatureData.email || "",
      phone: signatureData.phone || null,
      mobile: signatureData.mobile || null,
      website: signatureData.website || null,
      address: signatureData.address || null,
      companyName: signatureData.companyName || null,
      showPhoneIcon: signatureData.showPhoneIcon ?? true,
      showMobileIcon: signatureData.showMobileIcon ?? true,
      showEmailIcon: signatureData.showEmailIcon ?? true,
      showAddressIcon: signatureData.showAddressIcon ?? true,
      showWebsiteIcon: signatureData.showWebsiteIcon ?? true,
      primaryColor: signatureData.primaryColor || "#2563eb",
      colors: {
        name: signatureData.colors?.name || "#2563eb",
        position: signatureData.colors?.position || "#666666",
        company: signatureData.colors?.company || "#2563eb",
        contact: signatureData.colors?.contact || "#666666",
        separatorVertical: hslToHex(signatureData.colors?.separatorVertical || "#e0e0e0"),
        separatorHorizontal: hslToHex(signatureData.colors?.separatorHorizontal || "#e0e0e0"),
      },
      nameSpacing: signatureData.nameSpacing || 4,
      nameAlignment: signatureData.nameAlignment || "left",
      layout: signatureData.layout || "horizontal",
      columnWidths: {
        photo: signatureData.columnWidths?.photo || 25,
        content: signatureData.columnWidths?.content || 75,
      },
      photo: signatureData.photo || null,
      photoKey: signatureData.photoKey || null,
      photoVisible: signatureData.photoVisible !== false,
      logo: signatureData.logo || null,
      logoKey: signatureData.logoKey || null,
      imageSize: signatureData.imageSize || 70,
      imageShape: signatureData.imageShape || "round",
      logoSize: signatureData.logoSize || 60,
      separatorVerticalWidth: signatureData.separatorVerticalWidth || 1,
      separatorHorizontalWidth: signatureData.separatorHorizontalWidth || 1,
      separatorVerticalEnabled: signatureData.separatorVerticalEnabled ?? true,
      separatorHorizontalEnabled: signatureData.separatorHorizontalEnabled ?? false,
      templateId: signatureData.templateId || "template1",
      // Sauvegarder la structure des conteneurs (disposition personnalisée des blocs)
      containerStructure: rootContainer || null,
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
      detailedSpacing: signatureData.detailedSpacing ?? false,
      paddings: {
        photo: {
          top: signatureData.paddings?.photo?.top ?? 0,
          right: signatureData.paddings?.photo?.right ?? 0,
          bottom: signatureData.paddings?.photo?.bottom ?? signatureData.spacings?.global ?? 8,
          left: signatureData.paddings?.photo?.left ?? 0,
        },
        name: {
          top: signatureData.paddings?.name?.top ?? 0,
          right: signatureData.paddings?.name?.right ?? 0,
          bottom: signatureData.paddings?.name?.bottom ?? signatureData.spacings?.global ?? 8,
          left: signatureData.paddings?.name?.left ?? 0,
        },
        position: {
          top: signatureData.paddings?.position?.top ?? 0,
          right: signatureData.paddings?.position?.right ?? 0,
          bottom: signatureData.paddings?.position?.bottom ?? signatureData.spacings?.global ?? 8,
          left: signatureData.paddings?.position?.left ?? 0,
        },
        company: {
          top: signatureData.paddings?.company?.top ?? 0,
          right: signatureData.paddings?.company?.right ?? 0,
          bottom: signatureData.paddings?.company?.bottom ?? signatureData.spacings?.global ?? 8,
          left: signatureData.paddings?.company?.left ?? 0,
        },
        phone: {
          top: signatureData.paddings?.phone?.top ?? 0,
          right: signatureData.paddings?.phone?.right ?? 0,
          bottom: signatureData.paddings?.phone?.bottom ?? signatureData.spacings?.global ?? 8,
          left: signatureData.paddings?.phone?.left ?? 0,
        },
        mobile: {
          top: signatureData.paddings?.mobile?.top ?? 0,
          right: signatureData.paddings?.mobile?.right ?? 0,
          bottom: signatureData.paddings?.mobile?.bottom ?? signatureData.spacings?.global ?? 8,
          left: signatureData.paddings?.mobile?.left ?? 0,
        },
        email: {
          top: signatureData.paddings?.email?.top ?? 0,
          right: signatureData.paddings?.email?.right ?? 0,
          bottom: signatureData.paddings?.email?.bottom ?? signatureData.spacings?.global ?? 8,
          left: signatureData.paddings?.email?.left ?? 0,
        },
        website: {
          top: signatureData.paddings?.website?.top ?? 0,
          right: signatureData.paddings?.website?.right ?? 0,
          bottom: signatureData.paddings?.website?.bottom ?? signatureData.spacings?.global ?? 8,
          left: signatureData.paddings?.website?.left ?? 0,
        },
        address: {
          top: signatureData.paddings?.address?.top ?? 0,
          right: signatureData.paddings?.address?.right ?? 0,
          bottom: signatureData.paddings?.address?.bottom ?? signatureData.spacings?.global ?? 8,
          left: signatureData.paddings?.address?.left ?? 0,
        },
        separatorHorizontal: {
          top: signatureData.paddings?.separatorHorizontal?.top ?? signatureData.spacings?.global ?? 8,
          right: signatureData.paddings?.separatorHorizontal?.right ?? 0,
          bottom: signatureData.paddings?.separatorHorizontal?.bottom ?? signatureData.spacings?.global ?? 8,
          left: signatureData.paddings?.separatorHorizontal?.left ?? 0,
        },
        separatorVertical: {
          top: signatureData.paddings?.separatorVertical?.top ?? 0,
          right: signatureData.paddings?.separatorVertical?.right ?? 4,
          bottom: signatureData.paddings?.separatorVertical?.bottom ?? 0,
          left: signatureData.paddings?.separatorVertical?.left ?? 4,
        },
        logo: {
          top: signatureData.paddings?.logo?.top ?? signatureData.spacings?.global ?? 8,
          right: signatureData.paddings?.logo?.right ?? 0,
          bottom: signatureData.paddings?.logo?.bottom ?? 0,
          left: signatureData.paddings?.logo?.left ?? 0,
        },
        social: {
          top: signatureData.paddings?.social?.top ?? signatureData.spacings?.global ?? 8,
          right: signatureData.paddings?.social?.right ?? 0,
          bottom: signatureData.paddings?.social?.bottom ?? 0,
          left: signatureData.paddings?.social?.left ?? 0,
        },
      },
      socialNetworks: (() => {
        const networks = {};
        const socialData = signatureData.socialNetworks || {};
        const supportedNetworks = ["facebook", "instagram", "linkedin", "x", "github", "youtube"];
        supportedNetworks.forEach((platform) => {
          const value = socialData[platform];
          if (value) {
            // Gérer le cas où la valeur est un objet { url: "..." } ou une chaîne directe
            const url = typeof value === "string" ? value : value?.url;
            if (url && typeof url === "string" && url.trim() !== "" && url !== "#") {
              networks[platform] = url;
            }
          }
        });
        return networks;
      })(),
      socialColors: {
        facebook: signatureData.socialColors?.facebook || null,
        instagram: signatureData.socialColors?.instagram || null,
        linkedin: signatureData.socialColors?.linkedin || null,
        x: signatureData.socialColors?.x || null,
        github: signatureData.socialColors?.github || null,
        youtube: signatureData.socialColors?.youtube || null,
      },
      socialGlobalColor: signatureData.socialGlobalColor || null,
      socialSize: signatureData.socialSize || 24,
      customSocialIcons: {
        facebook: signatureData.customSocialIcons?.facebook || "",
        instagram: signatureData.customSocialIcons?.instagram || "",
        linkedin: signatureData.customSocialIcons?.linkedin || "",
        x: signatureData.customSocialIcons?.x || "",
        github: signatureData.customSocialIcons?.github || "",
        youtube: signatureData.customSocialIcons?.youtube || "",
      },
      typography: {
        fullName: {
          fontFamily: signatureData.typography?.fullName?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.fullName?.fontSize || 16,
          color: validateColor(signatureData.typography?.fullName?.color),
          fontWeight: normalizeFontWeight(signatureData.typography?.fullName?.fontWeight),
          fontStyle: signatureData.typography?.fullName?.fontStyle || "normal",
          textDecoration: signatureData.typography?.fullName?.textDecoration || "none",
        },
        position: {
          fontFamily: signatureData.typography?.position?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.position?.fontSize || 14,
          color: validateColor(signatureData.typography?.position?.color),
          fontWeight: normalizeFontWeight(signatureData.typography?.position?.fontWeight),
          fontStyle: signatureData.typography?.position?.fontStyle || "normal",
          textDecoration: signatureData.typography?.position?.textDecoration || "none",
        },
        company: {
          fontFamily: signatureData.typography?.company?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.company?.fontSize || 14,
          color: validateColor(signatureData.typography?.company?.color),
          fontWeight: normalizeFontWeight(signatureData.typography?.company?.fontWeight),
          fontStyle: signatureData.typography?.company?.fontStyle || "normal",
          textDecoration: signatureData.typography?.company?.textDecoration || "none",
        },
        email: {
          fontFamily: signatureData.typography?.email?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.email?.fontSize || 12,
          color: validateColor(signatureData.typography?.email?.color),
          fontWeight: normalizeFontWeight(signatureData.typography?.email?.fontWeight),
          fontStyle: signatureData.typography?.email?.fontStyle || "normal",
          textDecoration: signatureData.typography?.email?.textDecoration || "none",
        },
        phone: {
          fontFamily: signatureData.typography?.phone?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.phone?.fontSize || 12,
          color: validateColor(signatureData.typography?.phone?.color),
          fontWeight: normalizeFontWeight(signatureData.typography?.phone?.fontWeight),
          fontStyle: signatureData.typography?.phone?.fontStyle || "normal",
          textDecoration: signatureData.typography?.phone?.textDecoration || "none",
        },
        mobile: {
          fontFamily: signatureData.typography?.mobile?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.mobile?.fontSize || 12,
          color: validateColor(signatureData.typography?.mobile?.color),
          fontWeight: normalizeFontWeight(signatureData.typography?.mobile?.fontWeight),
          fontStyle: signatureData.typography?.mobile?.fontStyle || "normal",
          textDecoration: signatureData.typography?.mobile?.textDecoration || "none",
        },
        website: {
          fontFamily: signatureData.typography?.website?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.website?.fontSize || 12,
          color: validateColor(signatureData.typography?.website?.color),
          fontWeight: normalizeFontWeight(signatureData.typography?.website?.fontWeight),
          fontStyle: signatureData.typography?.website?.fontStyle || "normal",
          textDecoration: signatureData.typography?.website?.textDecoration || "none",
        },
        address: {
          fontFamily: signatureData.typography?.address?.fontFamily || "Arial, sans-serif",
          fontSize: signatureData.typography?.address?.fontSize || 12,
          color: validateColor(signatureData.typography?.address?.color),
          fontWeight: normalizeFontWeight(signatureData.typography?.address?.fontWeight),
          fontStyle: signatureData.typography?.address?.fontStyle || "normal",
          textDecoration: signatureData.typography?.address?.textDecoration || "none",
        },
      },
      fontFamily: signatureData.fontFamily || "Arial, sans-serif",
      fontSize: {
        name: signatureData.fontSize?.name || 16,
        position: signatureData.fontSize?.position || 14,
        contact: signatureData.fontSize?.contact || 12,
      },
      elementsOrder: signatureData.elementsOrder || [
        "photo", "fullName", "position", "separator", "contact", "logo", "social"
      ],
      horizontalLayout: signatureData.horizontalLayout || {
        leftColumn: ["photo", "fullName", "position"],
        rightColumn: ["contact"],
        bottomRow: ["separator", "logo", "social"],
      },
    };
  };

  const handleSave = async () => {
    const existingSignatures = signaturesData?.getMyEmailSignatures || [];
    const isDuplicate = existingSignatures.some(
      (sig) =>
        sig.signatureName.toLowerCase() === signatureName.toLowerCase() &&
        sig.id !== existingSignatureId
    );

    if (isDuplicate) {
      setErrorMessage("Ce nom de signature existe déjà");
      setSaveStatus("duplicate");
      return;
    }

    setErrorMessage(null);
    setSaveStatus(null);

    const completeData = prepareSignatureData();
    const rawData = {
      ...completeData,
      signatureName: signatureName || "Ma signature",
    };
    const finalData = cleanGraphQLData(rawData);

    // Debug: vérifier que containerStructure est bien inclus
    console.log("💾 [SaveSignatureModal] rootContainer:", rootContainer);
    console.log("💾 [SaveSignatureModal] containerStructure in finalData:", finalData.containerStructure);

    try {
      if (existingSignatureId) {
        await updateSignature({
          variables: {
            input: {
              id: existingSignatureId,
              ...finalData,
            },
          },
        });
      } else {
        await createSignature({
          variables: {
            input: finalData,
          },
        });
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde", {
        description: error.message || "Une erreur est survenue lors de la sauvegarde.",
      });
      setSaveStatus("error");
      setErrorMessage("Erreur lors de la sauvegarde");
    }
  };

  return (
    <Dialog open={showSaveModal} onOpenChange={closeSaveModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingSignatureId
              ? "Mettre à jour la signature"
              : "Sauvegarder la signature"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="signatureName">Nom de la signature</Label>
            <Input
              id="signatureName"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="Ma signature professionnelle"
            />
          </div>

          {(saveStatus === "error" || saveStatus === "duplicate") && (
            <div className="flex items-center gap-2 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage || "Erreur lors de la sauvegarde"}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={closeSaveModal}
            variant="outline"
            disabled={isLoading}
          >
            Continuer l'édition
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !signatureName.trim()}
          >
            {isLoading && (
              <LoaderCircleIcon
                className="-ms-1 me-2 animate-spin"
                size={16}
                aria-hidden="true"
              />
            )}
            {existingSignatureId ? "Mettre à jour" : "Sauvegarder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
