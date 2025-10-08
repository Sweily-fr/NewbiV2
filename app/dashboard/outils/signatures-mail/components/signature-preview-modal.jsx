"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Skeleton } from "@/src/components/ui/skeleton";
import { LoaderCircleIcon } from "lucide-react";
import HorizontalSignature from "./HorizontalSignature";
import VerticalSignature from "./VerticalSignature";

// Query pour récupérer une signature complète avec tous les champs nécessaires
// Query pour récupérer une signature complète (copiée de use-signature-table.js)
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
      orientation
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
        logoToSocial
        verticalSeparatorLeft
        verticalSeparatorRight
      }
      detailedSpacing

      # Réseaux sociaux
      socialNetworks {
        facebook
        instagram
        linkedin
        x
        github
        youtube
      }
      socialColors {
        facebook
        instagram
        linkedin
        x
        github
        youtube
      }
      customSocialIcons {
        facebook
        instagram
        linkedin
        x
        github
        youtube
      }
      socialGlobalColor
      socialSize

      # Typographie
      fontFamily
      fontSize {
        name
        position
        contact
      }
      typography {
        fullName {
          fontSize
          fontWeight
          fontStyle
          textDecoration
          color
          fontFamily
        }
        position {
          fontSize
          fontWeight
          fontStyle
          textDecoration
          color
          fontFamily
        }
        company {
          fontSize
          fontWeight
          fontStyle
          textDecoration
          color
          fontFamily
        }
        email {
          fontSize
          fontWeight
          fontStyle
          textDecoration
          color
          fontFamily
        }
        phone {
          fontSize
          fontWeight
          fontStyle
          textDecoration
          color
          fontFamily
        }
        mobile {
          fontSize
          fontWeight
          fontStyle
          textDecoration
          color
          fontFamily
        }
        website {
          fontSize
          fontWeight
          fontStyle
          textDecoration
          color
          fontFamily
        }
        address {
          fontSize
          fontWeight
          fontStyle
          textDecoration
          color
          fontFamily
        }
      }

      createdAt
      updatedAt
    }
  }
`;

// Transformer les données de la signature pour le générateur standalone
function transformSignatureData(signature) {
  return {
    signatureId: signature.id,
    signatureName: signature.signatureName,
    fullName:
      signature.firstName && signature.lastName
        ? `${signature.firstName} ${signature.lastName}`
        : signature.firstName || signature.lastName || "",
    firstName: signature.firstName || "",
    lastName: signature.lastName || "",
    position: signature.position || "",
    company: signature.companyName || "",
    companyName: signature.companyName || "",
    email: signature.email || "",
    phone: signature.phone || "",
    mobile: signature.mobile || "",
    website: signature.website || "",
    address: signature.address || "",
    photo: signature.photo || "",
    photoKey: signature.photoKey || "",
    logo: signature.logo || "",
    logoKey: signature.logoKey || "",
    imageSize: signature.imageSize || 80,
    imageShape: signature.imageShape || "circle",
    logoSize: signature.logoSize || 60,
    primaryColor: signature.primaryColor || "#2563eb",
    fontFamily: signature.fontFamily || "Arial, sans-serif",
    nameAlignment: signature.nameAlignment || "left",
    orientation: signature.orientation || "vertical",
    detailedSpacing: signature.detailedSpacing || false,

    // Séparateurs activés
    separatorVerticalEnabled: true,
    separatorHorizontalEnabled: true,
    separatorVerticalWidth: signature.separatorVerticalWidth || 1,
    separatorHorizontalWidth: signature.separatorHorizontalWidth || 1,

    // Couleurs
    colors: {
      name: signature.primaryColor || "#2563eb",
      position: signature.colors?.position || "rgb(102,102,102)",
      company: signature.colors?.company || signature.primaryColor || "#2563eb",
      contact: signature.colors?.contact || "rgb(102,102,102)",
      separatorVertical: signature.colors?.separatorVertical || "#e0e0e0",
      separatorHorizontal: signature.colors?.separatorHorizontal || "#e0e0e0",
      ...signature.colors
    },

    // Tailles de police
    fontSize: signature.fontSize || {
      name: 16,
      position: 14,
      contact: 12,
    },

    // Espacements
    spacings: signature.spacings || {
      global: 8,
      photoBottom: 16,
      nameBottom: 8,
      positionBottom: 8,
      companyBottom: 8,
      phoneToMobile: 6,
      mobileToEmail: 6,
      emailToWebsite: 6,
      websiteToAddress: 6,
      separatorTop: 12,
      separatorBottom: 12,
      logoBottom: 15,
      logoToSocial: 12,
      verticalSeparatorLeft: 8,
      verticalSeparatorRight: 8,
    },

    // Réseaux sociaux
    socialNetworks: signature.socialNetworks || {},
    socialGlobalColor: signature.socialGlobalColor || null, // null = couleurs par défaut de chaque réseau
    socialSize: signature.socialSize || 24,
    socialColors: signature.socialColors || {},
    customSocialIcons: signature.customSocialIcons || {},

    // Typography détaillée
    typography: signature.typography || {},
  };
}

export default function SignaturePreviewModal({
  signatureId,
  isOpen,
  onClose,
}) {
  const { data, loading, error } = useQuery(GET_EMAIL_SIGNATURE, {
    variables: { id: signatureId },
    skip: !signatureId || !isOpen,
  });

  const [signatureData, setSignatureData] = useState(null);

  // Fonction de copie indépendante pour le modal
  const copySignatureToClipboard = async (data) => {
    try {
      // Créer un élément temporaire pour générer le HTML
      const tempDiv = document.createElement("div");

      // Déterminer quel composant utiliser
      const isHorizontal = data.orientation === "horizontal";

      // Pour simplifier, on copie juste un message ou on utilise le générateur standalone
      const signatureHTML = `
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr>
            <td>
              <div style="font-size: 16px; font-weight: bold; color: ${data.primaryColor || "#171717"};">
                ${data.fullName || ""}
              </div>
              ${data.position ? `<div style="font-size: 14px; color: #666666; margin-top: 2px;">${data.position}</div>` : ""}
              ${data.email ? `<div style="font-size: 12px; color: #666666; margin-top: 4px;">${data.email}</div>` : ""}
              ${data.phone ? `<div style="font-size: 12px; color: #666666; margin-top: 2px;">${data.phone}</div>` : ""}
            </td>
          </tr>
        </table>
      `;

      await navigator.clipboard.writeText(signatureHTML);

      // Optionnel : afficher un toast de succès
      console.log("Signature copiée avec succès");
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (data?.getEmailSignature) {
      try {
        // Transformer les données pour les composants de signature
        const transformedData = transformSignatureData(data.getEmailSignature);
        setSignatureData(transformedData);
      } catch (error) {
        console.error(
          "Erreur lors de la transformation de la signature:",
          error
        );
        setSignatureData(null);
      }
    }
  }, [data]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        style={{
          width: "75vw",
          maxWidth: "75vw",
          minWidth: "800px",
        }}
      >
        <DialogHeader>
          <DialogTitle>
            Aperçu de la signature
            {data?.getEmailSignature?.signatureName && (
              <span className="ml-2 text-muted-foreground font-normal">
                - {data.getEmailSignature.signatureName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoaderCircleIcon
                className="-ms-1 animate-spin"
                size={16}
                aria-hidden="true"
              />
              <span className="ml-2 text-sm text-muted-foreground">
                Chargement de la signature...
              </span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Erreur lors du chargement</p>
              <Button onClick={onClose} variant="outline">
                Fermer
              </Button>
            </div>
          )}

          {signatureData && (
            <div className="space-y-4">
              {/* Aperçu dans un style email */}
              <div className="rounded-lg border w-full">
                <div className="bg-[#171717] text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm">Aperçu de la signature</span>
                  </div>
                </div>

                <div className="p-6 space-y-3 text-sm dark:bg-white">
                  <div className="flex items-center gap-2">
                    <span className="text-xs dark:text-black">De :</span>
                    <span className="text-xs dark:text-black">
                      {signatureData.email || "exemple@contact.fr"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs dark:text-black">À :</span>
                    <span className="text-xs dark:text-black">
                      client@contact.fr
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs dark:text-black">Obj :</span>
                    <span className="text-xs dark:text-black">
                      Votre demande de renseignements
                    </span>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    {/* Rendu de la signature avec les composants complets */}
                    <div 
                      className="flex justify-start"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {signatureData.orientation === "horizontal" ? (
                        <HorizontalSignature
                          signatureData={signatureData}
                          handleFieldChange={() => {}}
                          handleImageChange={() => {}}
                          validatePhone={() => true}
                          validateEmail={() => true}
                          validateUrl={() => true}
                          logoSrc={signatureData.logo}
                        />
                      ) : (
                        <VerticalSignature
                          signatureData={signatureData}
                          handleFieldChange={() => {}}
                          handleImageChange={() => {}}
                          validatePhone={() => true}
                          validateEmail={() => true}
                          validateUrl={() => true}
                          logoSrc={signatureData.logo}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Aperçu de votre signature email
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await copySignatureToClipboard(signatureData);
                      } catch (error) {
                        console.error("Erreur lors de la copie:", error);
                      }
                    }}
                  >
                    Copier la signature
                  </Button>
                  <Button onClick={onClose}>Fermer</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
