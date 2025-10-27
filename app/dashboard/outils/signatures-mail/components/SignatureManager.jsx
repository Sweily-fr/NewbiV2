"use client";

import React, { useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useLazyQuery,
  useApolloClient,
} from "@apollo/client";
import { gql } from "@apollo/client";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Trash2,
  Download,
  Star,
  StarOff,
  LoaderCircleIcon,
  AlertCircle,
  Copy,
} from "lucide-react";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import TemplateSelector from "./TemplateSelector";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

// Query pour récupérer toutes les signatures de l'utilisateur
const GET_MY_EMAIL_SIGNATURES = gql`
  query GetMyEmailSignatures($workspaceId: ID!) {
    getMyEmailSignatures(workspaceId: $workspaceId) {
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
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        position {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        company {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        email {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        phone {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        mobile {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        website {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        address {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
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
  const { workspaceId } = useRequiredWorkspace();

  // Éviter l'erreur d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, loading, error, refetch } = useQuery(GET_MY_EMAIL_SIGNATURES, {
    variables: { workspaceId },
    skip: !isMounted || !workspaceId,
    onCompleted: (data) => {
      console.log("📋 [FRONTEND] Signatures:");
    },
    onError: (error) => {
      console.error("❌ [FRONTEND] Erreur lors de la récupération:", error);
    },
  });

  const [deleteSignature, { loading: deleting }] = useMutation(
    DELETE_EMAIL_SIGNATURE,
    {
      // Mise à jour optimiste du cache
      update: (cache, { data: { deleteEmailSignature: deletedId } }) => {
        // Lire les données actuelles du cache
        const existingSignatures = cache.readQuery({
          query: GET_MY_EMAIL_SIGNATURES,
        });

        if (existingSignatures?.getMyEmailSignatures) {
          // Filtrer la signature supprimée
          const newSignatures = existingSignatures.getMyEmailSignatures.filter(
            (sig) => sig.id !== deletedId
          );

          // Écrire les données mises à jour dans le cache
          cache.writeQuery({
            query: GET_MY_EMAIL_SIGNATURES,
            data: { getMyEmailSignatures: newSignatures },
          });
        }
      },
      onError: (error) => {
        console.error("❌ Erreur suppression:", error);
        // En cas d'erreur, on recharge les données
        refetch();
      },
    }
  );

  const [setDefaultSignature, { loading: settingDefault }] = useMutation(
    SET_DEFAULT_EMAIL_SIGNATURE,
    {
      onCompleted: (data) => {
        refetch();
      },
      onError: (error) => {
        console.error("❌ Erreur définition par défaut:", error);
      },
    }
  );

  const [loadSignature, { loading: loadingSignature }] = useLazyQuery(
    GET_EMAIL_SIGNATURE,
    {
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
              separatorHorizontal: "#e5e7eb",
            },

            // Layout
            nameSpacing: signature.nameSpacing || 8,
            nameAlignment: signature.nameAlignment || "left",
            layout: signature.layout || "vertical",
            orientation: signature.orientation || signature.layout || "vertical",
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
              separatorBottom: 16,
              logoToSocial: 12,
              verticalSeparatorLeft: 22,
              verticalSeparatorRight: 22,
            },

            // Mode espacement détaillé
            detailedSpacing: signature.detailedSpacing || false,

            // Typographie
            fontFamily: signature.fontFamily || "Arial, sans-serif",
            fontSize: signature.fontSize || {
              name: 16,
              position: 14,
              contact: 13,
            },
            // Typographie détaillée
            typography: signature.typography
              ? {
                  fullName: {
                    fontFamily:
                      signature.typography.fullName?.fontFamily ||
                      "Arial, sans-serif",
                    fontSize: signature.typography.fullName?.fontSize || 16,
                    color: signature.typography.fullName?.color || "#171717",
                    fontWeight:
                      signature.typography.fullName?.fontWeight || "normal",
                    fontStyle:
                      signature.typography.fullName?.fontStyle || "normal",
                    textDecoration:
                      signature.typography.fullName?.textDecoration || "none",
                  },
                  position: {
                    fontFamily:
                      signature.typography.position?.fontFamily ||
                      "Arial, sans-serif",
                    fontSize: signature.typography.position?.fontSize || 14,
                    color: signature.typography.position?.color || "#666666",
                    fontWeight:
                      signature.typography.position?.fontWeight || "normal",
                    fontStyle:
                      signature.typography.position?.fontStyle || "normal",
                    textDecoration:
                      signature.typography.position?.textDecoration || "none",
                  },
                  company: {
                    fontFamily:
                      signature.typography.company?.fontFamily ||
                      "Arial, sans-serif",
                    fontSize: signature.typography.company?.fontSize || 14,
                    color: signature.typography.company?.color || "#171717",
                    fontWeight:
                      signature.typography.company?.fontWeight || "normal",
                    fontStyle:
                      signature.typography.company?.fontStyle || "normal",
                    textDecoration:
                      signature.typography.company?.textDecoration || "none",
                  },
                  email: {
                    fontFamily:
                      signature.typography.email?.fontFamily ||
                      "Arial, sans-serif",
                    fontSize: signature.typography.email?.fontSize || 12,
                    color: signature.typography.email?.color || "#666666",
                    fontWeight:
                      signature.typography.email?.fontWeight || "normal",
                    fontStyle:
                      signature.typography.email?.fontStyle || "normal",
                    textDecoration:
                      signature.typography.email?.textDecoration || "none",
                  },
                  phone: {
                    fontFamily:
                      signature.typography.phone?.fontFamily ||
                      "Arial, sans-serif",
                    fontSize: signature.typography.phone?.fontSize || 12,
                    color: signature.typography.phone?.color || "#666666",
                    fontWeight:
                      signature.typography.phone?.fontWeight || "normal",
                    fontStyle:
                      signature.typography.phone?.fontStyle || "normal",
                    textDecoration:
                      signature.typography.phone?.textDecoration || "none",
                  },
                  mobile: {
                    fontFamily:
                      signature.typography.mobile?.fontFamily ||
                      "Arial, sans-serif",
                    fontSize: signature.typography.mobile?.fontSize || 12,
                    color: signature.typography.mobile?.color || "#666666",
                    fontWeight:
                      signature.typography.mobile?.fontWeight || "normal",
                    fontStyle:
                      signature.typography.mobile?.fontStyle || "normal",
                    textDecoration:
                      signature.typography.mobile?.textDecoration || "none",
                  },
                  website: {
                    fontFamily:
                      signature.typography.website?.fontFamily ||
                      "Arial, sans-serif",
                    fontSize: signature.typography.website?.fontSize || 12,
                    color: signature.typography.website?.color || "#666666",
                    fontWeight:
                      signature.typography.website?.fontWeight || "normal",
                    fontStyle:
                      signature.typography.website?.fontStyle || "normal",
                    textDecoration:
                      signature.typography.website?.textDecoration || "none",
                  },
                  address: {
                    fontFamily:
                      signature.typography.address?.fontFamily ||
                      "Arial, sans-serif",
                    fontSize: signature.typography.address?.fontSize || 12,
                    color: signature.typography.address?.color || "#666666",
                    fontWeight:
                      signature.typography.address?.fontWeight || "normal",
                    fontStyle:
                      signature.typography.address?.fontStyle || "normal",
                    textDecoration:
                      signature.typography.address?.textDecoration || "none",
                  },
                }
              : {
                  fullName: {
                    fontFamily: "Arial, sans-serif",
                    fontSize: 16,
                    color: "#171717",
                    fontWeight: "normal",
                    fontStyle: "normal",
                    textDecoration: "none",
                  },
                  position: {
                    fontFamily: "Arial, sans-serif",
                    fontSize: 14,
                    color: "#666666",
                    fontWeight: "normal",
                    fontStyle: "normal",
                    textDecoration: "none",
                  },
                  company: {
                    fontFamily: "Arial, sans-serif",
                    fontSize: 14,
                    color: "#171717",
                    fontWeight: "normal",
                    fontStyle: "normal",
                    textDecoration: "none",
                  },
                  email: {
                    fontFamily: "Arial, sans-serif",
                    fontSize: 12,
                    color: "#666666",
                    fontWeight: "normal",
                    fontStyle: "normal",
                    textDecoration: "none",
                  },
                  phone: {
                    fontFamily: "Arial, sans-serif",
                    fontSize: 12,
                    color: "#666666",
                    fontWeight: "normal",
                    fontStyle: "normal",
                    textDecoration: "none",
                  },
                  mobile: {
                    fontFamily: "Arial, sans-serif",
                    fontSize: 12,
                    color: "#666666",
                    fontWeight: "normal",
                    fontStyle: "normal",
                    textDecoration: "none",
                  },
                  website: {
                    fontFamily: "Arial, sans-serif",
                    fontSize: 12,
                    color: "#666666",
                    fontWeight: "normal",
                    fontStyle: "normal",
                    textDecoration: "none",
                  },
                  address: {
                    fontFamily: "Arial, sans-serif",
                    fontSize: 12,
                    color: "#666666",
                    fontWeight: "normal",
                    fontStyle: "normal",
                    textDecoration: "none",
                  },
                },

            // Réseaux sociaux
            socialNetworks: signature.socialNetworks || {
              facebook: "",
              instagram: "",
              linkedin: "",
              x: "",
            },
            socialColors: signature.socialColors || {
              facebook: null,
              instagram: null,
              linkedin: null,
              x: null,
              github: null,
              youtube: null,
            },
            customSocialIcons: signature.customSocialIcons || {
              facebook: "",
              instagram: "",
              linkedin: "",
              x: "",
            },
            socialGlobalColor: signature.socialGlobalColor || null,
            socialSize: signature.socialSize || 24,

            // Orientation (remplace layout dans certains cas)
            orientation:
              signature.orientation || signature.layout || "vertical",
          };

          console.log("🔄 [SignatureManager] Mapped typography data:", mappedData.typography);
          console.log("🔄 [SignatureManager] Full mapped data:", mappedData);
          updateSignatureData(mappedData);
        }
      },
      onError: (error) => {
        console.error("❌ Erreur chargement signature:", error);
      },
    }
  );

  const handleDeleteSignature = async (id, name) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer la signature "${name}" ?`
      )
    ) {
      try {
        await deleteSignature({
          variables: { id },
          // Réponse optimiste pour une mise à jour immédiate
          optimisticResponse: {
            __typename: "Mutation",
            deleteEmailSignature: id,
          },
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
    const template = signature.template || signature.layout || "horizontal";

    // Générer selon l'orientation
    if (template === "vertical") {
      return generateVerticalSignatureHTML(
        signature,
        primaryColor,
        photoSrc,
        logoSrc
      );
    } else {
      return generateHorizontalSignatureHTML(
        signature,
        primaryColor,
        photoSrc,
        logoSrc
      );
    }
  };

  // Fonction pour générer le HTML horizontal
  const generateHorizontalSignatureHTML = (
    signature,
    primaryColor,
    photoSrc,
    logoSrc
  ) => {
    // HTML optimisé pour Gmail - format horizontal
    return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: ${signature.fontFamily || "Arial, sans-serif"}; font-size: 14px; line-height: 1.4; margin: 0; padding: 0;">
<tbody>
  <tr>
    ${
      photoSrc
        ? `
    <td style="padding: 0; margin: 0; vertical-align: top; width: ${signature.imageSize || 80}px;">
      <img src="${photoSrc}" alt="Photo de profil" style="width: ${signature.imageSize || 80}px; height: ${signature.imageSize || 80}px; border-radius: ${signature.imageShape === "square" ? "8px" : "50%"}; display: block; margin: 0; padding: 0; border: none;" />
    </td>
    <td style="width: ${signature.spacings?.nameSpacing || 12}px; padding: 0; margin: 0; padding-left: ${signature.spacings?.nameSpacing || 12}px;">&nbsp;</td>
    `
        : ""
    }
    
    <td style="vertical-align: top; padding: 0; margin: 0;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.nameBottom || 2}px;">
              <span style="font-size: ${signature.typography?.fullName?.fontSize || signature.fontSize?.name || 16}px; font-weight: ${signature.typography?.fullName?.fontWeight || "normal"}; color: ${signature.typography?.fullName?.color || primaryColor}; line-height: 1.2; margin: 0; padding: 0; font-family: ${signature.typography?.fullName?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                ${signature.fullName || ""}
              </span>
            </td>
          </tr>
            ${
              signature.position
                ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.positionBottom || 2}px;">
                <span style="font-size: ${signature.typography?.position?.fontSize || signature.fontSize?.position || 14}px; color: ${signature.typography?.position?.color || "#666666"}; font-weight: ${signature.typography?.position?.fontWeight || "normal"}; font-style: ${signature.typography?.position?.fontStyle || "normal"}; text-decoration: ${signature.typography?.position?.textDecoration || "none"}; margin: 0; padding: 0; font-family: ${signature.typography?.position?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                  ${signature.position}
                </span>
              </td>
            </tr>
            `
                : ""
            }
            ${
              signature.company
                ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.companyBottom || 8}px;">
                <span style="font-size: ${signature.typography?.company?.fontSize || signature.fontSize?.company || 14}px; font-weight: ${signature.typography?.company?.fontWeight || "bold"}; color: ${signature.typography?.company?.color || primaryColor}; margin: 0; padding: 0; font-family: ${signature.typography?.company?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                  ${signature.company}
                </span>
              </td>
            </tr>
            `
                : ""
            }
            ${
              signature.phone
                ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${spacings.phoneBottom}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                  <tbody>
                    <tr>
                      <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                      </td>
                      <td style="padding: 0; margin: 0; vertical-align: middle;">
                        <span style="font-size: ${signature.typography?.phone?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.phone?.color || "#666666"}; font-weight: ${signature.typography?.phone?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.phone?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                          <a href="tel:${signature.phone}" style="color: ${signature.typography?.phone?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.phone}</a>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            `
                : ""
            }
            ${
              signature.mobile
                ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${spacings.mobileBottom}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                  <tbody>
                    <tr>
                      <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                      </td>
                      <td style="padding: 0; margin: 0; vertical-align: middle;">
                        <span style="font-size: ${signature.typography?.mobile?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.mobile?.color || "#666666"}; font-weight: ${signature.typography?.mobile?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.mobile?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                          <a href="tel:${signature.mobile}" style="color: ${signature.typography?.mobile?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.mobile}</a>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            `
                : ""
            }
            ${
              signature.email
                ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${spacings.emailBottom}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                  <tbody>
                    <tr>
                      <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                      </td>
                      <td style="padding: 0; margin: 0; vertical-align: middle;">
                        <span style="font-size: ${signature.typography?.email?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.email?.color || "#666666"}; font-weight: ${signature.typography?.email?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.email?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                          <a href="mailto:${signature.email}" style="color: ${signature.typography?.email?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.email}</a>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            `
                : ""
            }
            ${
              signature.website
                ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${spacings.websiteBottom}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                  <tbody>
                    <tr>
                      <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                      </td>
                      <td style="padding: 0; margin: 0; vertical-align: middle;">
                        <span style="font-size: ${signature.typography?.website?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.website?.color || "#666666"}; font-weight: ${signature.typography?.website?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.website?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                          <a href="${signature.website}" style="color: ${signature.typography?.website?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.website}</a>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            `
                : ""
            }
            ${
              signature.address
                ? `
            <tr>
              <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.addressBottom || 8}px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                  <tbody>
                    <tr>
                      <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                      </td>
                      <td style="padding: 0; margin: 0; vertical-align: middle;">
                        <span style="font-size: ${signature.typography?.address?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.address?.color || "#666666"}; font-weight: ${signature.typography?.address?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.address?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                          ${signature.address}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            `
                : ""
            }
          </tbody>
        </table>
      </td>
    </tr>
    
    ${
      signature.separator?.enabled
        ? `
    <tr>
      <td colspan="${photoSrc ? "3" : "1"}" style="padding: 0; margin: 0; padding-top: ${signature.spacings?.separatorTop || 8}px; padding-bottom: ${signature.spacings?.separatorBottom || 8}px;">
        <div style="width: 100%; height: 1px; background-color: ${signature.separator?.color || "#e5e7eb"}; margin: 0; padding: 0;"></div>
      </td>
    </tr>
    `
        : ""
    }
    
    ${
      logoSrc
        ? `
    <tr>
      <td colspan="${photoSrc ? "3" : "1"}" style="padding: 0; margin: 0; padding-top: ${signature.spacings?.logoToSocial || 15}px; text-align: ${signature.logoAlignment || "left"};">
        ${
          signature.logoBackground?.enabled
            ? `
        <span style="display: inline-block; background-color: ${signature.logoBackground?.color || "#f3f4f6"}; border-radius: ${signature.logoBackground?.shape === "round" ? "50%" : "0"}; padding: 8px; margin: 0;">
          <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; display: block; margin: 0; padding: 0; border: none;" />
        </span>
        `
            : `
        <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; margin: 0; padding: 0; border: none;" />
        `
        }
      </td>
    </tr>
    `
        : ""
    }
  </tbody>
</table>`;
  };

  // Fonction pour générer le HTML vertical
  const generateVerticalSignatureHTML = (
    signature,
    primaryColor,
    photoSrc,
    logoSrc
  ) => {
    // Normaliser les noms des espacements pour la version verticale
    const spacings = {
      // Espacements communs
      nameBottom: signature.spacings?.nameBottom || 8,
      positionBottom: signature.spacings?.positionBottom || 8,
      companyBottom: signature.spacings?.companyBottom || 12,
      phoneBottom:
        signature.spacings?.phoneBottom ||
        signature.spacings?.phoneToMobile ||
        4,
      mobileBottom:
        signature.spacings?.mobileBottom ||
        signature.spacings?.mobileToEmail ||
        4,
      emailBottom: signature.spacings?.emailBottom || 4,
      websiteBottom:
        signature.spacings?.websiteBottom ||
        signature.spacings?.emailToWebsite ||
        4,
      addressBottom:
        signature.spacings?.addressBottom ||
        signature.spacings?.websiteToAddress ||
        12,

      // Espacements verticaux
      photoBottom: signature.spacings?.photoBottom || 16, // Espace sous la photo en vertical

      // Espacements généraux
      logoTop: signature.spacings?.logoTop || 15,
      logoBottom: signature.spacings?.logoBottom || 15,
      socialTop: signature.spacings?.socialTop || 10,
      socialBottom: signature.spacings?.socialBottom || 10,
      separatorTop: signature.spacings?.separatorTop || 8,
      separatorBottom: signature.spacings?.separatorBottom || 8,

      // Espacements entre les éléments de contact
      phoneToMobile: signature.spacings?.phoneToMobile || 4,
      mobileToEmail: signature.spacings?.mobileToEmail || 4,
      emailToWebsite: signature.spacings?.emailToWebsite || 4,
      websiteToAddress: signature.spacings?.websiteToAddress || 4,
    };

    // HTML optimisé pour Gmail - format vertical
    return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: ${signature.fontFamily || "Arial, sans-serif"}; font-size: 14px; line-height: 1.4; margin: 0; padding: 0;">
<tbody>
  ${
    photoSrc
      ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${spacings.photoBottom}px; text-align: ${signature.nameAlignment || "left"};">
      <img src="${photoSrc}" alt="Photo de profil" style="width: ${signature.imageSize || 80}px; height: ${signature.imageSize || 80}px; border-radius: ${signature.imageShape === "square" ? "8px" : "50%"}; display: block; margin: 0; padding: 0; border: none;" />
    </td>
  </tr>
  `
      : ""
  }
  
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${spacings.nameBottom}px; text-align: ${signature.nameAlignment || "left"};">
      <span style="font-size: ${signature.typography?.fullName?.fontSize || signature.fontSize?.name || 16}px; font-weight: ${signature.typography?.fullName?.fontWeight || "normal"}; color: ${signature.typography?.fullName?.color || primaryColor}; line-height: 1.2; margin: 0; padding: 0; font-family: ${signature.typography?.fullName?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
        ${signature.fullName || ""}
      </span>
    </td>
  </tr>
  
  ${
    signature.position
      ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${spacings.positionBottom}px;">
      <span style="font-size: ${signature.typography?.position?.fontSize || signature.fontSize?.position || 14}px; color: ${signature.typography?.position?.color || "#666666"}; font-weight: ${signature.typography?.position?.fontWeight || "normal"}; font-style: ${signature.typography?.position?.fontStyle || "normal"}; text-decoration: ${signature.typography?.position?.textDecoration || "none"}; margin: 0; padding: 0; font-family: ${signature.typography?.position?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
        ${signature.position}
      </span>
    </td>
  </tr>
  `
      : ""
  }
  
  ${
    signature.company
      ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${spacings.companyBottom}px;">
      <span style="font-size: ${signature.typography?.company?.fontSize || signature.fontSize?.company || 14}px; font-weight: ${signature.typography?.company?.fontWeight || "bold"}; color: ${signature.typography?.company?.color || primaryColor}; margin: 0; padding: 0; font-family: ${signature.typography?.company?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
        ${signature.company}
      </span>
    </td>
  </tr>
  `
      : ""
  }
  
  ${
    signature.phone
      ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${spacings.phoneBottom}px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
              <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
            </td>
            <td style="padding: 0; margin: 0; vertical-align: middle;">
              <span style="font-size: ${signature.typography?.phone?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.phone?.color || "#666666"}; font-weight: ${signature.typography?.phone?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.phone?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                <a href="tel:${signature.phone}" style="color: ${signature.typography?.phone?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.phone}</a>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  `
      : ""
  }
  
  ${
    signature.mobile
      ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${spacings.mobileBottom}px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
              <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
            </td>
            <td style="padding: 0; margin: 0; vertical-align: middle;">
              <span style="font-size: ${signature.typography?.mobile?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.mobile?.color || "#666666"}; font-weight: ${signature.typography?.mobile?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.mobile?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                <a href="tel:${signature.mobile}" style="color: ${signature.typography?.mobile?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.mobile}</a>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  `
      : ""
  }
  
  ${
    signature.email
      ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${spacings.emailBottom}px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
              <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
            </td>
            <td style="padding: 0; margin: 0; vertical-align: middle;">
              <span style="font-size: ${signature.typography?.email?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.email?.color || "#666666"}; font-weight: ${signature.typography?.email?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.email?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                <a href="mailto:${signature.email}" style="color: ${signature.typography?.email?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.email}</a>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  `
      : ""
  }
  
  ${
    signature.website
      ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${spacings.websiteBottom}px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
              <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
            </td>
            <td style="padding: 0; margin: 0; vertical-align: middle;">
              <span style="font-size: ${signature.typography?.website?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.website?.color || "#666666"}; font-weight: ${signature.typography?.website?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.website?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                <a href="${signature.website}" style="color: ${signature.typography?.website?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.website}</a>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  `
      : ""
  }
  
  ${
    signature.address
      ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-bottom: ${spacings.addressBottom}px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
              <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
            </td>
            <td style="padding: 0; margin: 0; vertical-align: middle;">
              <span style="font-size: ${signature.typography?.address?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.address?.color || "#666666"}; font-weight: ${signature.typography?.address?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.address?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                ${signature.address}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  `
      : ""
  }
  
  ${
    signature.separator?.enabled
      ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-top: ${spacings.separatorTop}px; padding-bottom: ${spacings.separatorBottom}px;">
      <div style="width: 100%; height: 1px; background-color: ${signature.separator?.color || "#e5e7eb"}; margin: 0; padding: 0;"></div>
    </td>
  </tr>
  `
      : ""
  }
  
  ${
    logoSrc
      ? `
  <tr>
    <td style="padding: 0; margin: 0; padding-top: ${spacings.logoTop}px; text-align: ${signature.logoAlignment || "left"};">
      ${
        signature.logoBackground?.enabled
          ? `
      <span style="display: inline-block; background-color: ${signature.logoBackground?.color || "#f3f4f6"}; border-radius: ${signature.logoBackground?.shape === "round" ? "50%" : "0"}; padding: 8px; margin: 0;">
        <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; display: block; margin: 0; padding: 0; border: none;" />
      </span>
      `
          : `
      <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; margin: 0; padding: 0; border: none;" />
      `
      }
    </td>
  </tr>
  `
      : ""
  }
</tbody>
</table>`;
  };

  // Fonction pour copier une signature
  const handleCopySignature = async (signature) => {
    setCopyingId(signature.id);

    try {
      // Créer une copie profonde des données actuelles de l'éditeur
      const currentSignatureData = JSON.parse(JSON.stringify(signatureData));

      // Créer la signature à copier en fusionnant les données
      const signatureToCopy = {
        ...signature, // Données de base de la signature sauvegardée
        ...currentSignatureData, // Données actuelles de l'éditeur
        id: signature.id, // Conserver l'ID original
        signatureName: signature.signatureName, // Conserver le nom original
      };

      // Forcer l'orientation actuelle
      const currentTemplate = currentSignatureData.template || "horizontal";
      signatureToCopy.template = currentTemplate;
      signatureToCopy.layout = currentTemplate;

      // S'assurer que les espacements sont correctement définis
      if (!signatureToCopy.spacings) {
        signatureToCopy.spacings = {};
      }

      // Définir les valeurs par défaut pour tous les espacements
      // Ces valeurs doivent correspondre à celles utilisées dans les templates
      const defaultSpacings = {
        // Espacements communs
        nameBottom: 8,
        positionBottom: 8,
        companyBottom: 12,
        phoneBottom: 4,
        mobileBottom: 4,
        emailBottom: 4,
        websiteBottom: 4,
        addressBottom: 12,

        // Espacements horizontaux
        nameSpacing: 12, // Espacement entre la photo et le nom en horizontal

        // Espacements verticaux
        photoBottom: 16, // Espace sous la photo en vertical

        // Espacements généraux
        logoTop: 15,
        logoBottom: 15,
        socialTop: 10,
        socialBottom: 10,
        separatorTop: 8,
        separatorBottom: 8,

        // Espacements entre les éléments de contact
        phoneToMobile: 4,
        mobileToEmail: 4,
        emailToWebsite: 4,
        websiteToAddress: 4,

        // Valeurs spécifiques aux templates
        ...(currentTemplate === "horizontal"
          ? {
              // Valeurs spécifiques au mode horizontal
              nameSpacing: 12, // Espacement entre photo et contenu
            }
          : {
              // Valeurs spécifiques au mode vertical
              photoBottom: 16, // Espace sous la photo
            }),
      };

      // Fusionner les espacements en respectant la priorité :
      // 1. Valeurs actuelles de l'éditeur (signatureData.spacings)
      // 2. Valeurs de la signature sauvegardée (signature.spacings)
      // 3. Valeurs par défaut
      signatureToCopy.spacings = {
        ...defaultSpacings,
        ...(signature.spacings || {}),
        ...(currentSignatureData.spacings || {}),
      };

      // S'assurer que les valeurs numériques sont bien des nombres
      Object.keys(signatureToCopy.spacings).forEach((key) => {
        if (typeof signatureToCopy.spacings[key] === "string") {
          signatureToCopy.spacings[key] =
            parseInt(signatureToCopy.spacings[key], 10) ||
            defaultSpacings[key] ||
            0;
        }
      });

      // Générer le HTML avec la signature mise à jour
      const htmlSignature = generateSignatureHTML(signatureToCopy);

      // Copier en tant que texte riche (HTML)
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([htmlSignature], { type: "text/html" }),
            "text/plain": new Blob([htmlSignature.replace(/<[^>]*>/g, "")], {
              type: "text/plain",
            }),
          }),
        ]);
        toast.success(
          `Signature "${signature.signatureName}" copiée avec le visuel !`
        );
      } else {
        // Fallback pour les navigateurs plus anciens
        const textarea = document.createElement("textarea");
        textarea.value = htmlSignature;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success(
          `Signature "${signature.signatureName}" copiée ! (format HTML)`
        );
      }
    } catch (error) {
      toast.error("Erreur lors de la copie de la signature");
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
        <LoaderCircleIcon className="-ms-1 animate-spin mr-2" size={24} aria-hidden="true" />
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

  // Fonction pour changer de template
  const handleTemplateChange = (templateId) => {
    updateSignatureData("template", templateId);
    // Maintenir la compatibilité avec l'ancien système layout
    if (templateId === "horizontal" || templateId === "vertical") {
      updateSignatureData("layout", templateId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de templates */}
      <div>
        <TemplateSelector
          selectedTemplate={
            signatureData.template || signatureData.layout || "horizontal"
          }
          onTemplateChange={handleTemplateChange}
        />
      </div>

      {/* Section signatures sauvegardées (si il y en a) */}
      {signatures.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Mes signatures sauvegardées
            </h2>
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
                        onClick={() => handleCopySignature(signature)}
                        disabled={copyingId === signature.id}
                        className="p-2 text-blue-600 hover:text-blue-700"
                        title="Copier la signature"
                      >
                        {copyingId === signature.id ? (
                          <LoaderCircleIcon className="-ms-1 animate-spin" size={16} aria-hidden="true" />
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
                        onClick={() =>
                          handleDeleteSignature(
                            signature.id,
                            signature.signatureName
                          )
                        }
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
                      <p>
                        <strong>Nom :</strong> {signature.fullName}
                      </p>
                    )}
                    {signature.position && (
                      <p>
                        <strong>Poste :</strong> {signature.position}
                      </p>
                    )}
                    {signature.email && (
                      <p>
                        <strong>Email :</strong> {signature.email}
                      </p>
                    )}
                    {signature.companyName && (
                      <p>
                        <strong>Entreprise :</strong> {signature.companyName}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Créée le{" "}
                      {new Date(signature.createdAt).toLocaleDateString(
                        "fr-FR"
                      )}
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
                        <LoaderCircleIcon className="-ms-1 animate-spin" size={16} aria-hidden="true" />
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
          <p className="text-sm">
            Créez votre première signature et sauvegardez-la pour la retrouver
            ici.
          </p>
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
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: ${signature.fontFamily || "Arial, sans-serif"}; font-size: 14px; line-height: 1.4; margin: 0; padding: 0;">
<tbody>
  <tr>
    ${
      photoSrc
        ? `
    <td style="padding: 0; margin: 0; vertical-align: top; width: ${signature.imageSize || 80}px;">
      <div style="width: ${signature.imageSize || 80}px; height: ${signature.imageSize || 80}px; border-radius: ${signature.imageShape === "square" ? "8px" : "50%"}; background: url('${photoSrc}') center center/cover no-repeat; display: block; margin: 0; padding: 0; border: none;"></div>
    </td>
    <td style="width: ${signature.spacings?.nameSpacing || 12}px; padding: 0; margin: 0; padding-left: ${signature.spacings?.nameSpacing || 12}px;">&nbsp;</td>
    ${
      signature.verticalSeparator?.enabled
        ? `
    <td style="width: ${signature.spacings?.verticalSeparatorLeft || 4}px; padding: 0; margin: 0; vertical-align: top;">&nbsp;</td>
    <td style="width: ${signature.verticalSeparator?.width || 2}px; background-color: ${signature.verticalSeparator?.color || "#000000"}; padding: 0; margin: 0; vertical-align: top; height: 100%; min-height: 80px;">&nbsp;</td>
    <td style="width: ${signature.spacings?.verticalSeparatorRight || 12}px; padding: 0; margin: 0; vertical-align: top;">&nbsp;</td>
    `
        : ""
    }
    `
        : ""
    }
    
    <td style="vertical-align: top; padding: 0; margin: 0;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.nameBottom || 2}px;">
              <span style="font-size: ${signature.typography?.fullName?.fontSize || signature.fontSize?.name || 16}px; font-weight: ${signature.typography?.fullName?.fontWeight || "bold"}; color: ${signature.typography?.fullName?.color || primaryColor}; line-height: 1.2; margin: 0; padding: 0; font-family: ${signature.typography?.fullName?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                ${signature.fullName || ""}
              </span>
            </td>
          </tr>
          ${
            signature.position
              ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.positionBottom || 2}px;">
              <span style="font-size: ${signature.typography?.position?.fontSize || signature.fontSize?.position || 14}px; color: ${signature.typography?.position?.color || "#666666"}; font-weight: ${signature.typography?.position?.fontWeight || "normal"}; font-style: ${signature.typography?.position?.fontStyle || "normal"}; text-decoration: ${signature.typography?.position?.textDecoration || "none"}; margin: 0; padding: 0; font-family: ${signature.typography?.position?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                ${signature.position}
              </span>
            </td>
          </tr>
          `
              : ""
          }
          ${
            signature.company
              ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.companyBottom || 8}px;">
              <span style="font-size: ${signature.typography?.company?.fontSize || signature.fontSize?.company || 14}px; font-weight: ${signature.typography?.company?.fontWeight || "bold"}; color: ${signature.typography?.company?.color || primaryColor}; margin: 0; padding: 0; font-family: ${signature.typography?.company?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                ${signature.company}
              </span>
            </td>
          </tr>
          `
              : ""
          }
          ${
            signature.phone
              ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.phoneBottom || 4}px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tbody>
                  <tr>
                    <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                      <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                    </td>
                    <td style="padding: 0; margin: 0; vertical-align: middle;">
                      <span style="font-size: ${signature.typography?.phone?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.phone?.color || "#666666"}; font-weight: ${signature.typography?.phone?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.phone?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                        <a href="tel:${signature.phone}" style="color: ${signature.typography?.phone?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.phone}</a>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          `
              : ""
          }
          ${
            signature.mobile
              ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.mobileBottom || 4}px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tbody>
                  <tr>
                    <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                      <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                    </td>
                    <td style="padding: 0; margin: 0; vertical-align: middle;">
                      <span style="font-size: ${signature.typography?.mobile?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.mobile?.color || "#666666"}; font-weight: ${signature.typography?.mobile?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.mobile?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                        <a href="tel:${signature.mobile}" style="color: ${signature.typography?.mobile?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.mobile}</a>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          `
              : ""
          }
          ${
            signature.email
              ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.emailBottom || 4}px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tbody>
                  <tr>
                    <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                      <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                    </td>
                    <td style="padding: 0; margin: 0; vertical-align: middle;">
                      <span style="font-size: ${signature.typography?.email?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.email?.color || "#666666"}; font-weight: ${signature.typography?.email?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.email?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                        <a href="mailto:${signature.email}" style="color: ${signature.typography?.email?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.email}</a>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          `
              : ""
          }
          ${
            signature.website
              ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.websiteBottom || 4}px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tbody>
                  <tr>
                    <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                      <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                    </td>
                    <td style="padding: 0; margin: 0; vertical-align: middle;">
                      <span style="font-size: ${signature.typography?.website?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.website?.color || "#666666"}; font-weight: ${signature.typography?.website?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.website?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                        <a href="${signature.website}" style="color: ${signature.typography?.website?.color || "#666666"}; text-decoration: none; margin: 0; padding: 0;">${signature.website}</a>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          `
              : ""
          }
          ${
            signature.address
              ? `
          <tr>
            <td style="padding: 0; margin: 0; padding-bottom: ${signature.spacings?.addressBottom || 8}px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tbody>
                  <tr>
                    <td style="padding: 0; margin: 0; padding-right: 10px; vertical-align: middle; width: 20px;">
                      <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="16" height="16" style="width: 16px; height: 16px; display: block; margin: 0; padding: 0; border: none;" />
                    </td>
                    <td style="padding: 0; margin: 0; vertical-align: middle;">
                      <span style="font-size: ${signature.typography?.address?.fontSize || signature.fontSize?.contact || 12}px; color: ${signature.typography?.address?.color || "#666666"}; font-weight: ${signature.typography?.address?.fontWeight || "normal"}; margin: 0; padding: 0; font-family: ${signature.typography?.address?.fontFamily || signature.fontFamily || "Arial, sans-serif"};">
                        ${signature.address}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          `
              : ""
          }
        </tbody>
      </table>
    </td>
  </tr>
  
  <tr>
    <td colspan="${photoSrc ? (signature.verticalSeparator?.enabled ? "6" : "3") : "1"}" style="padding: 0; margin: 0; padding-top: ${signature.spacings?.separatorTop || 12}px; padding-bottom: ${signature.spacings?.separatorBottom || 12}px;">
      <hr style="border: none; border-top: ${signature.separatorHorizontalWidth || 1}px solid ${signature.colors?.separatorHorizontal || "#e0e0e0"}; margin: 0; width: 100%;" />
    </td>
  </tr>
  
  ${
    logoSrc
      ? `
  <tr>
    <td colspan="${photoSrc ? (signature.verticalSeparator?.enabled ? "6" : "3") : "1"}" style="padding: 0; margin: 0; text-align: left;">
      <img src="${logoSrc}" alt="Logo entreprise" style="width: ${signature.logoSize || 60}px; height: auto; max-height: ${signature.logoSize || 60}px; margin: 0; padding: 0; border: none;" />
    </td>
  </tr>
  `
      : ""
  }
  
  ${
    signature.socialNetworks?.linkedin ||
    signature.socialNetworks?.facebook ||
    signature.socialNetworks?.x ||
    signature.socialNetworks?.instagram
      ? `
  <tr>
    <td colspan="${photoSrc ? (signature.verticalSeparator?.enabled ? "6" : "3") : "1"}" style="padding: 0; margin: 0; padding-top: ${signature.spacings?.logoToSocial || 15}px; text-align: left;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tbody>
          <tr>
            ${
              signature.socialNetworks?.linkedin
                ? `
            <td style="padding: 0; margin: 0; padding-right: 8px;">
              <a href="${signature.socialNetworks.linkedin}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin: 0; padding: 0;">
                <div style="display: inline-block; background-color: ${signature.socialBackground?.enabled ? signature.socialBackground?.color || "#f3f4f6" : "transparent"}; border-radius: ${signature.socialBackground?.enabled && signature.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: ${signature.socialBackground?.enabled ? "6px" : "0"}; margin: 0;">
                  <img src="https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev/linkedin.svg" alt="LinkedIn" width="${signature.socialSize || 24}" height="${signature.socialSize || 24}" style="display: block; margin: 0; padding: 0; border: none;" />
                </div>
              </a>
            </td>
            `
                : ""
            }
            ${
              signature.socialNetworks?.facebook
                ? `
            <td style="padding: 0; margin: 0; padding-right: 8px;">
              <a href="${signature.socialNetworks.facebook}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin: 0; padding: 0;">
                <div style="display: inline-block; background-color: ${signature.socialBackground?.enabled ? signature.socialBackground?.color || "#f3f4f6" : "transparent"}; border-radius: ${signature.socialBackground?.enabled && signature.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: ${signature.socialBackground?.enabled ? "6px" : "0"}; margin: 0;">
                  <img src="${"https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev/facebook.svg"}" alt="Facebook" width="${signature.socialSize || 24}" height="${signature.socialSize || 24}" style="display: block; margin: 0; padding: 0; border: none;" />
                </div>
              </a>
            </td>
            `
                : ""
            }
            ${
              signature.socialNetworks?.x
                ? `
            <td style="padding: 0; margin: 0; padding-right: 8px;">
              <a href="${signature.socialNetworks.x}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin: 0; padding: 0;">
                <div style="display: inline-block; background-color: ${signature.socialBackground?.enabled ? signature.socialBackground?.color || "#f3f4f6" : "transparent"}; border-radius: ${signature.socialBackground?.enabled && signature.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: ${signature.socialBackground?.enabled ? "6px" : "0"}; margin: 0;">
                  <img src="https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev/x.svg" alt="X (Twitter)" width="${signature.socialSize || 24}" height="${signature.socialSize || 24}" style="display: block; margin: 0; padding: 0; border: none;" />
                </div>
              </a>
            </td>
            `
                : ""
            }
            ${
              signature.socialNetworks?.instagram
                ? `
            <td style="padding: 0; margin: 0;">
              <a href="${signature.socialNetworks.instagram}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin: 0; padding: 0;">
                <div style="display: inline-block; background-color: ${signature.socialBackground?.enabled ? signature.socialBackground?.color || "#f3f4f6" : "transparent"}; border-radius: ${signature.socialBackground?.enabled && signature.socialBackground?.shape === "round" ? "50%" : "4px"}; padding: ${signature.socialBackground?.enabled ? "6px" : "0"}; margin: 0;">
                  <img src="https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev/instagram.svg" alt="Instagram" width="${signature.socialSize || 24}" height="${signature.socialSize || 24}" style="display: block; margin: 0; padding: 0; border: none;" />
                </div>
              </a>
            </td>
            `
                : ""
            }
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  `
      : ""
  }
</tbody>
</table>`;
};

export default SignatureManager;
