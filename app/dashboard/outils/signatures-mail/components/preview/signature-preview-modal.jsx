"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { LoaderCircle, Eye, Copy, Pencil } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { generateSignatureHTML } from "../../utils/standalone-signature-generator";
import { generateSignatureHTMLFromContainer } from "../../utils/container-html-generator";

// Query pour récupérer une signature complète avec tous les champs nécessaires
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
      photoVisible
      logo
      logoKey
      banner
      bannerKey
      imageSize
      imageShape
      logoSize

      # Séparateurs
      separatorVerticalWidth
      separatorHorizontalWidth
      separatorVerticalEnabled
      separatorHorizontalEnabled

      # Template et structure
      templateId
      containerStructure
      elementsOrder
      horizontalLayout {
        leftColumn
        rightColumn
        bottomRow
      }

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
      paddings {
        photo {
          top
          right
          bottom
          left
        }
        name {
          top
          right
          bottom
          left
        }
        position {
          top
          right
          bottom
          left
        }
        company {
          top
          right
          bottom
          left
        }
        phone {
          top
          right
          bottom
          left
        }
        mobile {
          top
          right
          bottom
          left
        }
        email {
          top
          right
          bottom
          left
        }
        website {
          top
          right
          bottom
          left
        }
        address {
          top
          right
          bottom
          left
        }
        separatorHorizontal {
          top
          right
          bottom
          left
        }
        separatorVertical {
          top
          right
          bottom
          left
        }
        logo {
          top
          right
          bottom
          left
        }
        social {
          top
          right
          bottom
          left
        }
      }

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
    photoVisible: signature.photoVisible !== false,
    logo: signature.logo || "",
    logoKey: signature.logoKey || "",
    banner: signature.banner || "",
    bannerKey: signature.bannerKey || "",
    imageSize: signature.imageSize || 80,
    imageShape: signature.imageShape || "circle",
    logoSize: signature.logoSize || 60,
    primaryColor: signature.primaryColor || "#2563eb",
    fontFamily: signature.fontFamily || "Arial, sans-serif",
    nameAlignment: signature.nameAlignment || "left",
    orientation: signature.orientation || "vertical",
    detailedSpacing: signature.detailedSpacing || false,

    // Séparateurs - utiliser les valeurs sauvegardées
    separatorVerticalEnabled: signature.separatorVerticalEnabled ?? false,
    separatorHorizontalEnabled: signature.separatorHorizontalEnabled ?? false,
    separatorVerticalWidth: signature.separatorVerticalWidth || 1,
    separatorHorizontalWidth: signature.separatorHorizontalWidth || 1,

    // Layout
    elementsOrder: signature.elementsOrder || null,
    horizontalLayout: signature.horizontalLayout || null,

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
      global: 12,
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

    // Paddings détaillés
    paddings: signature.paddings || null,

    // Réseaux sociaux
    socialNetworks: signature.socialNetworks || {},
    socialGlobalColor: signature.socialGlobalColor || null,
    socialSize: signature.socialSize || 24,
    socialColors: signature.socialColors || {},
    customSocialIcons: signature.customSocialIcons || {},

    // Typography détaillée
    typography: signature.typography || {},
  };
}

// Générer le HTML de la signature en utilisant le bon moteur de rendu
function generatePreviewHTML(signatureData, containerStructure) {
  if (containerStructure) {
    return generateSignatureHTMLFromContainer(containerStructure, signatureData);
  }
  return generateSignatureHTML(signatureData);
}

export default function SignaturePreviewModal({
  signatureId,
  isOpen,
  onClose,
}) {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_EMAIL_SIGNATURE, {
    variables: { id: signatureId },
    skip: !signatureId || !isOpen,
  });

  const [signatureData, setSignatureData] = useState(null);
  const [containerStructure, setContainerStructure] = useState(null);
  const previewRef = useRef(null);

  const copySignatureToClipboard = async (data, container) => {
    try {
      const signatureHTML = generatePreviewHTML(data, container);

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([signatureHTML], { type: "text/html" }),
          "text/plain": new Blob([signatureHTML.replace(/<[^>]*>/g, "")], {
            type: "text/plain",
          }),
        }),
      ]);

      toast.success("Signature copiée avec succès !");
    } catch (error) {
      console.error("❌ Erreur copie signature:", error);
      try {
        const signatureHTML = generatePreviewHTML(data, container);
        await navigator.clipboard.writeText(signatureHTML);
        toast.success("Signature copiée (texte brut)");
      } catch (fallbackError) {
        toast.error("Erreur lors de la copie de la signature");
      }
    }
  };

  const handleEdit = () => {
    onClose();
    router.push(`/dashboard/outils/signatures-mail/new?edit=true&id=${signatureId}`);
  };

  useEffect(() => {
    if (data?.getEmailSignature) {
      try {
        const signature = data.getEmailSignature;
        const transformedData = transformSignatureData(signature);
        setSignatureData(transformedData);
        setContainerStructure(signature.containerStructure || null);
      } catch (error) {
        console.error(
          "Erreur lors de la transformation de la signature:",
          error
        );
        setSignatureData(null);
        setContainerStructure(null);
      }
    }
  }, [data]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="size-4" />
              Aperçu
              {data?.getEmailSignature?.signatureName && (
                <span className="text-muted-foreground font-normal">
                  — {data.getEmailSignature.signatureName}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground/50" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-muted-foreground">Erreur lors du chargement</p>
            </div>
          )}

          {signatureData && (
            <div>
              {/* Signature preview */}
              <div
                ref={previewRef}
                className="px-5 py-6 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={handleEdit}
                title="Cliquer pour modifier"
                dangerouslySetInnerHTML={{ __html: generatePreviewHTML(signatureData, containerStructure) }}
              />

              {/* Footer */}
              <div className="flex justify-between items-center border-t border-border/40 px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  Cliquez sur l'aperçu pour modifier
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await copySignatureToClipboard(signatureData, containerStructure);
                      } catch (error) {
                        console.error("Erreur lors de la copie:", error);
                      }
                    }}
                    className="gap-1.5"
                  >
                    <Copy className="size-3.5" />
                    Copier
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleEdit}
                    className="gap-1.5"
                  >
                    <Pencil className="size-3.5" />
                    Modifier
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
