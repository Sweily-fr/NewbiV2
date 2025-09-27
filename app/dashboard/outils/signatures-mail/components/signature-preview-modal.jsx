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
import { generateSignatureHTML } from "../utils/standalone-signature-generator";

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
      }
      socialColors {
        facebook
        instagram
        linkedin
        x
      }
      customSocialIcons {
        facebook
        instagram
        linkedin
        x
      }

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
        : "",
    firstName: signature.firstName || "",
    lastName: signature.lastName || "",
    position: signature.position || "",
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

    // Couleurs
    colors: signature.colors || {
      name: signature.primaryColor || "#2563eb",
      position: "rgb(102,102,102)",
      company: signature.primaryColor || "#2563eb",
      contact: "rgb(102,102,102)",
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
    },

    // Séparateurs
    separators: signature.separators || {
      horizontal: {
        width: 1,
        color: "#e0e0e0",
      },
      vertical: {
        width: 1,
        color: "#e0e0e0",
      },
    },

    // Réseaux sociaux
    socialNetworks: signature.socialNetworks || {},
    socialGlobalColor: signature.socialGlobalColor || "blue",
    socialSize: signature.socialSize || 20,

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

  const [signatureHTML, setSignatureHTML] = useState("");

  useEffect(() => {
    if (data?.getEmailSignature) {
      try {
        // Transformer les données et générer avec le générateur complet
        const transformedData = transformSignatureData(data.getEmailSignature);
        const html = generateSignatureHTML(transformedData);
        setSignatureHTML(html);
      } catch (error) {
        console.error("Erreur lors de la génération de la signature:", error);
        setSignatureHTML(
          '<p style="color: red;">Erreur lors de la génération de la signature</p>'
        );
      }
    }
  }, [data]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
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

          {signatureHTML && (
            <div className="space-y-4">
              <div className="border rounded-lg p-6 bg-white">
                <div dangerouslySetInnerHTML={{ __html: signatureHTML }} />
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Aperçu de votre signature email
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(signatureHTML)}
                  >
                    Copier le HTML
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
