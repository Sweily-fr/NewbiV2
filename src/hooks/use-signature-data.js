"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { useLazyQuery, gql } from "@apollo/client";

// Query pour récupérer une signature spécifique (pour l'édition)
const GET_EMAIL_SIGNATURE = gql`
  query GetEmailSignature($id: ID!) {
    getEmailSignature(id: $id) {
      id
      signatureName
      isDefault
      firstName
      lastName
      position
      email
      phone
      mobile
      website
      address
      companyName
      showPhoneIcon
      showMobileIcon
      showEmailIcon
      showAddressIcon
      showWebsiteIcon
      primaryColor
      colors {
        name
        position
        company
        contact
        separatorVertical
        separatorHorizontal
      }
      nameSpacing
      nameAlignment
      layout
      orientation
      columnWidths {
        photo
        content
      }
      photo
      photoKey
      photoVisible
      logo
      logoKey
      imageSize
      imageShape
      logoSize
      separatorVerticalWidth
      separatorHorizontalWidth
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
      elementsOrder
      horizontalLayout {
        leftColumn
        rightColumn
        bottomRow
      }
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

// Context pour les données de signature
const SignatureContext = createContext();

// Hook pour utiliser le contexte
export const useSignatureData = () => {
  const context = useContext(SignatureContext);
  if (!context) {
    throw new Error("useSignatureData must be used within SignatureProvider");
  }
  return context;
};

// Provider content avec useSearchParams
function SignatureProviderContent({ children }) {
  const searchParams = useSearchParams();
  const isEditMode = searchParams?.get("edit") === "true";
  const signatureIdFromUrl = searchParams?.get("id");
  const { organization } = useActiveOrganization();

  // Données par défaut (mémorisées pour éviter les re-renders)
  const defaultSignatureData = useMemo(
    () => ({
      signatureName: "Ma signature professionnelle",
      isDefault: true,
      signatureId: null, // ID de la signature (généré lors de la sauvegarde)
      fullName: "Jean Dupont",
      firstName: "Jean",
      lastName: "Dupont",
      position: "Fondateur & CEO",
      email: "newbi@contact.fr",
      phone: "+33 7 34 64 06 18",
      mobile: "+33 6 12 34 56 78",
      showPhoneIcon: true,
      showMobileIcon: true,
      showEmailIcon: true,
      showAddressIcon: true,
      showWebsiteIcon: true,
      companyName: "",
      website: "https://www.newbi.fr",
      address: "123 Avenue des Champs-Élysées, 75008 Paris, France",
      contactElementsOrder: [],
      // Ordre des éléments de la signature verticale (drag & drop)
      elementsOrder: ["photo", "fullName", "position", "company", "separator", "contact", "logo", "social"],
      // Ordre des éléments pour la signature horizontale (3 zones)
      horizontalLayout: {
        leftColumn: ["photo", "fullName", "position", "company"],
        rightColumn: ["contact"],
        bottomRow: ["separator", "logo", "social"],
      },
      // Réseaux sociaux
      socialNetworks: {
        facebook: "",
        instagram: "",
        linkedin: "",
        x: "",
        github: "",
        youtube: "",
      },
      // Couleur globale et taille des icônes sociales
      socialGlobalColor: null, // null = couleurs par défaut de chaque réseau
      socialSize: 24, // Taille par défaut des icônes sociales
      // Séparateurs (activation)
      separatorVerticalEnabled: true,
      separatorHorizontalEnabled: true,
      primaryColor: "#171717",
      // Espacement entre prénom et nom (en pixels)
      nameSpacing: 4,
      // Alignement du nom et prénom (left, center, right)
      nameAlignment: "left",
      // Orientation de la signature (vertical ou horizontal)
      orientation: "vertical",
      // Layout personnalisé pour le template custom
      customLayout: null,
      // Largeurs des colonnes (en pourcentage)
      columnWidths: {
        photo: 25, // Largeur de la colonne photo (25%)
        content: 75, // Largeur de la colonne contenu (75%)
      },
      // Images Cloudflare
      photo: null, // URL de la photo de profil
      photoKey: null, // Clé Cloudflare de la photo de profil
      photoVisible: true, // Visibilité de la photo (par défaut visible)
      logo: null, // URL du logo d'entreprise
      logoKey: null, // Clé Cloudflare du logo d'entreprise
      // Taille de l'image de profil (en pixels)
      imageSize: 70, // Taille par défaut de l'image de profil
      // Forme de l'image de profil (round ou square)
      imageShape: "round", // Forme par défaut : ronde
      // Configuration des séparateurs
      separators: {
        horizontal: {
          enabled: true, // Séparateur horizontal activé par défaut
          width: 1, // Épaisseur du séparateur horizontal
          color: "#e0e0e0", // Couleur du séparateur horizontal
          radius: 0, // Radius du séparateur horizontal
        },
        vertical: {
          enabled: true, // Séparateur vertical activé par défaut
          width: 1, // Épaisseur du séparateur vertical
          color: "#e0e0e0", // Couleur du séparateur vertical
          radius: 0, // Radius du séparateur vertical
        },
      },
      // Épaisseur des séparateurs (en pixels) - DEPRECATED, utiliser separators
      separatorVerticalWidth: 1, // Épaisseur du séparateur vertical (entre colonnes) - DEPRECATED
      separatorHorizontalWidth: 1, // Épaisseur du séparateur horizontal (sous l'adresse)
      // Taille du logo entreprise (en pixels)
      logoSize: 60, // Taille par défaut du logo
      // Taille des logos sociaux (en pixels)
      socialSize: 24, // Taille par défaut des logos sociaux
      // Mode espacement détaillé
      detailedSpacing: false, // Par défaut, utiliser l'espacement global
      // Espacements entre les éléments (en pixels)
      spacings: {
        global: 8, // Espacement global par défaut
        photoBottom: 12, // Espacement sous la photo
        logoBottom: 12, // Espacement sous le logo
        nameBottom: 8, // Espacement sous le nom
        positionBottom: 8, // Espacement sous le poste
        companyBottom: 12, // Espacement sous l'entreprise
        contactBottom: 6, // Espacement entre chaque contact
        phoneToMobile: 4, // Espacement téléphone vers mobile
        mobileToEmail: 4, // Espacement mobile vers email
        emailToWebsite: 4, // Espacement email vers site web
        websiteToAddress: 4, // Espacement site web vers adresse
        separatorTop: 12, // Espacement au-dessus du séparateur
        separatorBottom: 12, // Espacement sous le séparateur
        nameSpacing: 12, // Espacement entre photo et contenu
        logoToSocial: 12, // Espacement entre logo et réseaux sociaux
        verticalSeparatorLeft: 22, // Espacement gauche du séparateur vertical
        verticalSeparatorRight: 22, // Espacement droite du séparateur vertical
      },
      // Padding détaillé pour chaque élément (top, right, bottom, left)
      paddings: {
        photo: { top: 0, right: 0, bottom: 12, left: 0 },
        name: { top: 0, right: 0, bottom: 8, left: 0 },
        position: { top: 0, right: 0, bottom: 8, left: 0 },
        company: { top: 0, right: 0, bottom: 12, left: 0 },
        phone: { top: 0, right: 0, bottom: 4, left: 0 },
        mobile: { top: 0, right: 0, bottom: 4, left: 0 },
        email: { top: 0, right: 0, bottom: 4, left: 0 },
        website: { top: 0, right: 0, bottom: 4, left: 0 },
        address: { top: 0, right: 0, bottom: 0, left: 0 },
        separator: { top: 12, right: 0, bottom: 12, left: 0 },
        logo: { top: 0, right: 0, bottom: 12, left: 0 },
        social: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      // Typographie détaillée pour chaque champ
      typography: {
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
      // Typographie générale (conservée pour compatibilité)
      fontFamily: "Arial, sans-serif", // Police par défaut
      fontSize: {
        name: 16, // Taille de police pour le nom
        position: 14, // Taille de police pour le poste
        contact: 12, // Taille de police pour les contacts
      },
    }),
    []
  );

  // Hook pour récupérer une signature spécifique
  const [getSignature, { data: signatureQueryData, error: signatureQueryError, loading: loadingSignature }] = useLazyQuery(
    GET_EMAIL_SIGNATURE
  );

  const [signatureData, setSignatureData] = useState(defaultSignatureData);
  const [editingSignatureId, setEditingSignatureId] = useState(null);

  // Appliquer les données récupérées via GraphQL en mode édition
  useEffect(() => {
    if (isEditMode && signatureQueryData?.getEmailSignature) {
      const fetchedSignature = signatureQueryData.getEmailSignature;

      const mergedData = {
        ...defaultSignatureData,
        ...fetchedSignature,
        contactElementsOrder:
          fetchedSignature.contactElementsOrder ||
          defaultSignatureData.contactElementsOrder,
        // S'assurer que photoVisible a toujours une valeur booléenne
        photoVisible: fetchedSignature.photoVisible !== undefined ? fetchedSignature.photoVisible : defaultSignatureData.photoVisible,
        orientation: fetchedSignature.orientation || defaultSignatureData.orientation,
        colors: {
          ...defaultSignatureData.colors,
          ...(fetchedSignature.colors || {}),
        },
        columnWidths: {
          ...defaultSignatureData.columnWidths,
          ...(fetchedSignature.columnWidths || {}),
        },
        spacings: {
          ...defaultSignatureData.spacings,
          ...(fetchedSignature.spacings || {}),
        },
        paddings: {
          photo: {
            ...defaultSignatureData.paddings.photo,
            ...(fetchedSignature.paddings?.photo || {}),
          },
          name: {
            ...defaultSignatureData.paddings.name,
            ...(fetchedSignature.paddings?.name || {}),
          },
          position: {
            ...defaultSignatureData.paddings.position,
            ...(fetchedSignature.paddings?.position || {}),
          },
          company: {
            ...defaultSignatureData.paddings.company,
            ...(fetchedSignature.paddings?.company || {}),
          },
          phone: {
            ...defaultSignatureData.paddings.phone,
            ...(fetchedSignature.paddings?.phone || {}),
          },
          mobile: {
            ...defaultSignatureData.paddings.mobile,
            ...(fetchedSignature.paddings?.mobile || {}),
          },
          email: {
            ...defaultSignatureData.paddings.email,
            ...(fetchedSignature.paddings?.email || {}),
          },
          website: {
            ...defaultSignatureData.paddings.website,
            ...(fetchedSignature.paddings?.website || {}),
          },
          address: {
            ...defaultSignatureData.paddings.address,
            ...(fetchedSignature.paddings?.address || {}),
          },
          separatorHorizontal: {
            ...defaultSignatureData.paddings.separatorHorizontal,
            ...(fetchedSignature.paddings?.separatorHorizontal || {}),
          },
          separatorVertical: {
            ...defaultSignatureData.paddings.separatorVertical,
            ...(fetchedSignature.paddings?.separatorVertical || {}),
          },
          logo: {
            ...defaultSignatureData.paddings.logo,
            ...(fetchedSignature.paddings?.logo || {}),
          },
          social: {
            ...defaultSignatureData.paddings.social,
            ...(fetchedSignature.paddings?.social || {}),
          },
        },
        separators: {
          ...defaultSignatureData.separators,
          ...(fetchedSignature.separators || {}),
        },
        socialNetworks: {
          ...defaultSignatureData.socialNetworks,
          ...(fetchedSignature.socialNetworks || {}),
        },
        socialColors: {
          ...defaultSignatureData.socialColors,
          ...(fetchedSignature.socialColors || {}),
        },
        customSocialIcons: {
          ...defaultSignatureData.customSocialIcons,
          ...(fetchedSignature.customSocialIcons || {}),
        },
        fontSize: {
          ...defaultSignatureData.fontSize,
          ...(fetchedSignature.fontSize || {}),
        },
        typography: {
          fullName: {
            ...defaultSignatureData.typography.fullName,
            ...(fetchedSignature.typography?.fullName || {}),
          },
          position: {
            ...defaultSignatureData.typography.position,
            ...(fetchedSignature.typography?.position || {}),
          },
          company: {
            ...defaultSignatureData.typography.company,
            ...(fetchedSignature.typography?.company || {}),
          },
          email: {
            ...defaultSignatureData.typography.email,
            ...(fetchedSignature.typography?.email || {}),
          },
          phone: {
            ...defaultSignatureData.typography.phone,
            ...(fetchedSignature.typography?.phone || {}),
          },
          mobile: {
            ...defaultSignatureData.typography.mobile,
            ...(fetchedSignature.typography?.mobile || {}),
          },
          website: {
            ...defaultSignatureData.typography.website,
            ...(fetchedSignature.typography?.website || {}),
          },
          address: {
            ...defaultSignatureData.typography.address,
            ...(fetchedSignature.typography?.address || {}),
          },
        },
      };

      setSignatureData(mergedData);

      if (!fetchedSignature.fullName) {
        const computedFullName = `${fetchedSignature.firstName || ""} ${fetchedSignature.lastName || ""}`.trim();
        if (computedFullName) {
          setSignatureData((prev) => ({
            ...prev,
            fullName: computedFullName,
          }));
        }
      }
    }
  }, [isEditMode, signatureQueryData, defaultSignatureData]);

  // Effet pour charger les données d'édition via GraphQL ou localStorage
  useEffect(() => {
    if (isEditMode && signatureIdFromUrl) {
      // Mode édition avec ID dans l'URL - charger via GraphQL
      console.log(
        "🔍 [SIGNATURE_DATA] Mode édition avec ID:",
        signatureIdFromUrl
      );
      setEditingSignatureId(signatureIdFromUrl);
      getSignature({ variables: { id: signatureIdFromUrl } });
    } else if (isEditMode) {
      // Mode édition sans ID - fallback sur localStorage (compatibilité)
      try {
        const editingSignature = localStorage.getItem("editingSignature");

        if (editingSignature) {
          const parsedData = JSON.parse(editingSignature);

          console.log(
            "🔍 [SIGNATURE_DATA] Données récupérées de localStorage (fallback):",
            parsedData
          );

          // Merger les données existantes avec les données par défaut
          const mergedData = {
            ...defaultSignatureData,
            ...parsedData,
            contactElementsOrder:
              parsedData.contactElementsOrder || defaultSignatureData.contactElementsOrder,
            // S'assurer que les objets imbriqués sont bien mergés
            colors: {
              ...defaultSignatureData.colors,
              ...(parsedData.colors || {}),
            },
            columnWidths: {
              ...defaultSignatureData.columnWidths,
              ...(parsedData.columnWidths || {}),
            },
            spacings: {
              ...defaultSignatureData.spacings,
              ...(parsedData.spacings || {}),
            },
            paddings: {
              photo: {
                ...defaultSignatureData.paddings.photo,
                ...(parsedData.paddings?.photo || {}),
              },
              name: {
                ...defaultSignatureData.paddings.name,
                ...(parsedData.paddings?.name || {}),
              },
              position: {
                ...defaultSignatureData.paddings.position,
                ...(parsedData.paddings?.position || {}),
              },
              company: {
                ...defaultSignatureData.paddings.company,
                ...(parsedData.paddings?.company || {}),
              },
              phone: {
                ...defaultSignatureData.paddings.phone,
                ...(parsedData.paddings?.phone || {}),
              },
              mobile: {
                ...defaultSignatureData.paddings.mobile,
                ...(parsedData.paddings?.mobile || {}),
              },
              email: {
                ...defaultSignatureData.paddings.email,
                ...(parsedData.paddings?.email || {}),
              },
              website: {
                ...defaultSignatureData.paddings.website,
                ...(parsedData.paddings?.website || {}),
              },
              address: {
                ...defaultSignatureData.paddings.address,
                ...(parsedData.paddings?.address || {}),
              },
              separatorHorizontal: {
                ...defaultSignatureData.paddings.separatorHorizontal,
                ...(parsedData.paddings?.separatorHorizontal || {}),
              },
              separatorVertical: {
                ...defaultSignatureData.paddings.separatorVertical,
                ...(parsedData.paddings?.separatorVertical || {}),
              },
              logo: {
                ...defaultSignatureData.paddings.logo,
                ...(parsedData.paddings?.logo || {}),
              },
              social: {
                ...defaultSignatureData.paddings.social,
                ...(parsedData.paddings?.social || {}),
              },
            },
            verticalSeparator: {
              ...defaultSignatureData.verticalSeparator,
              ...(parsedData.verticalSeparator || {}),
            },
            fontSize: {
              ...defaultSignatureData.fontSize,
              ...(parsedData.fontSize || {}),
            },
            typography: {
              fullName: {
                ...defaultSignatureData.typography.fullName,
                ...(parsedData.typography?.fullName || {}),
              },
              position: {
                ...defaultSignatureData.typography.position,
                ...(parsedData.typography?.position || {}),
              },
              company: {
                ...defaultSignatureData.typography.company,
                ...(parsedData.typography?.company || {}),
              },
              email: {
                ...defaultSignatureData.typography.email,
                ...(parsedData.typography?.email || {}),
              },
              phone: {
                ...defaultSignatureData.typography.phone,
                ...(parsedData.typography?.phone || {}),
              },
              mobile: {
                ...defaultSignatureData.typography.mobile,
                ...(parsedData.typography?.mobile || {}),
              },
              website: {
                ...defaultSignatureData.typography.website,
                ...(parsedData.typography?.website || {}),
              },
              address: {
                ...defaultSignatureData.typography.address,
                ...(parsedData.typography?.address || {}),
              },
            },
          };

          setSignatureData(mergedData);
          setEditingSignatureId(parsedData.id);

          // Nettoyer localStorage après chargement
          localStorage.removeItem("editingSignature");
        } else {
          console.log(
            "⚠️ [SIGNATURE_PROVIDER] Aucune donnée d'édition trouvée"
          );
        }
      } catch (error) {
        console.error(
          "❌ [SIGNATURE_PROVIDER] Erreur lors du chargement:",
          error
        );
      }
    } else {
      console.log("📝 [SIGNATURE_PROVIDER] Mode création - données par défaut");
    }
  }, [isEditMode, signatureIdFromUrl, getSignature]);

  // Effet pour appliquer automatiquement le logo de l'organisation
  useEffect(() => {
    if (organization?.logo && !signatureData.logo) {
      setSignatureData((prev) => ({
        ...prev,
        logo: organization.logo,
      }));
    }
  }, [organization?.logo, signatureData.logo, organization]);

  // Effet pour sauvegarder automatiquement dans localStorage (sauf en mode édition)
  useEffect(() => {
    if (!isEditMode && signatureData && Object.keys(signatureData).length > 0) {
      // Éviter de sauvegarder les données par défaut vides
      if (
        signatureData.fullName ||
        signatureData.email ||
        signatureData.position ||
        signatureData.photo
      ) {
        console.log("💾 [AUTO_SAVE] Sauvegarde automatique dans localStorage");
        localStorage.setItem("draftSignature", JSON.stringify(signatureData));
      }
    }
  }, [signatureData, isEditMode]);

  // Effet pour charger les données de brouillon au démarrage (seulement en mode création)
  useEffect(() => {
    if (!isEditMode) {
      const draftData = localStorage.getItem("draftSignature");
      if (draftData) {
        try {
          const parsedDraft = JSON.parse(draftData);
          console.log(
            "📋 [DRAFT] Chargement du brouillon depuis localStorage:",
            parsedDraft
          );

          // Merger avec les données par défaut pour éviter les champs manquants
          const mergedData = {
            ...defaultSignatureData,
            ...parsedDraft,
            colors: {
              ...defaultSignatureData.colors,
              ...(parsedDraft.colors || {}),
            },
            spacings: {
              ...defaultSignatureData.spacings,
              ...(parsedDraft.spacings || {}),
            },
            paddings: {
              ...defaultSignatureData.paddings,
              ...(parsedDraft.paddings || {}),
            },
            columnWidths: {
              ...defaultSignatureData.columnWidths,
              ...(parsedDraft.columnWidths || {}),
            },
            fontSize: {
              ...defaultSignatureData.fontSize,
              ...(parsedDraft.fontSize || {}),
            },
            socialNetworks: {
              ...defaultSignatureData.socialNetworks,
              ...(parsedDraft.socialNetworks || {}),
            },
            typography: {
              fullName: {
                ...defaultSignatureData.typography.fullName,
                ...(parsedDraft.typography?.fullName || {}),
              },
              position: {
                ...defaultSignatureData.typography.position,
                ...(parsedDraft.typography?.position || {}),
              },
              company: {
                ...defaultSignatureData.typography.company,
                ...(parsedDraft.typography?.company || {}),
              },
              email: {
                ...defaultSignatureData.typography.email,
                ...(parsedDraft.typography?.email || {}),
              },
              phone: {
                ...defaultSignatureData.typography.phone,
                ...(parsedDraft.typography?.phone || {}),
              },
              mobile: {
                ...defaultSignatureData.typography.mobile,
                ...(parsedDraft.typography?.mobile || {}),
              },
              website: {
                ...defaultSignatureData.typography.website,
                ...(parsedDraft.typography?.website || {}),
              },
              address: {
                ...defaultSignatureData.typography.address,
                ...(parsedDraft.typography?.address || {}),
              },
            },
          };

          setSignatureData(mergedData);
          console.log("✅ [DRAFT] Brouillon chargé et mergé avec succès");
        } catch (error) {
          console.error(
            "❌ [DRAFT] Erreur lors du chargement du brouillon:",
            error
          );
          localStorage.removeItem("draftSignature");
        }
      }
    }
  }, [isEditMode]);

  const updateSignatureData = (key, value) => {
    setSignatureData((prev) => {
      // Si c'est un objet avec plusieurs clés, mettre à jour tout en une fois
      if (typeof key === 'object' && key !== null) {
        return {
          ...prev,
          ...key,
        };
      }
      
      // Handle nested object updates for spacings, colors, etc.
      if (
        key === "spacings" ||
        key === "paddings" ||
        key === "colors" ||
        key === "columnWidths" ||
        key === "fontSize" ||
        key === "verticalSeparator" ||
        key === "typography" ||
        key === "separators" ||
        key === "socialColors"
      ) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            ...value,
          },
        };
      }

      // Gestion spéciale pour fullName - le diviser en firstName et lastName
      if (key === "fullName") {
        const nameParts = (value || "").trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        return {
          ...prev,
          fullName: value,
          firstName,
          lastName,
        };
      }

      // Gestion spéciale pour firstName et lastName - reconstruire fullName
      if (key === "firstName" || key === "lastName") {
        const updatedData = { ...prev, [key]: value };
        const fullName =
          `${updatedData.firstName || ""} ${updatedData.lastName || ""}`.trim();

        return {
          ...updatedData,
          fullName,
        };
      }

      // Handle simple property updates
      return { ...prev, [key]: value };
    });
  };

  const resetSignatureData = () => {
    setSignatureData(defaultSignatureData);
  };

  // Fonction pour charger manuellement des données d'édition
  const loadEditingData = (editData) => {
    const mergedData = {
      ...defaultSignatureData,
      ...editData,
      contactElementsOrder:
        editData.contactElementsOrder || defaultSignatureData.contactElementsOrder,
      colors: {
        ...defaultSignatureData.colors,
        ...(editData.colors || {}),
      },
      columnWidths: {
        ...defaultSignatureData.columnWidths,
        ...(editData.columnWidths || {}),
      },
      spacings: {
        ...defaultSignatureData.spacings,
        ...(editData.spacings || {}),
      },
      paddings: {
        ...defaultSignatureData.paddings,
        ...(editData.paddings || {}),
      },
      verticalSeparator: {
        ...defaultSignatureData.verticalSeparator,
        ...(editData.verticalSeparator || {}),
      },
      fontSize: {
        ...defaultSignatureData.fontSize,
        ...(editData.fontSize || {}),
      },
      typography: {
        fullName: {
          ...defaultSignatureData.typography.fullName,
          ...(editData.typography?.fullName || {}),
        },
        position: {
          ...defaultSignatureData.typography.position,
          ...(editData.typography?.position || {}),
        },
        company: {
          ...defaultSignatureData.typography.company,
          ...(editData.typography?.company || {}),
        },
        email: {
          ...defaultSignatureData.typography.email,
          ...(editData.typography?.email || {}),
        },
        phone: {
          ...defaultSignatureData.typography.phone,
          ...(editData.typography?.phone || {}),
        },
        mobile: {
          ...defaultSignatureData.typography.mobile,
          ...(editData.typography?.mobile || {}),
        },
        website: {
          ...defaultSignatureData.typography.website,
          ...(editData.typography?.website || {}),
        },
        address: {
          ...defaultSignatureData.typography.address,
          ...(editData.typography?.address || {}),
        },
      },
    };
    setSignatureData(mergedData);
  };

  // Fonction supprimée car redondante avec resetSignatureData

  const value = {
    signatureData,
    updateSignatureData,
    setSignatureData,
    resetSignatureData,
    loadEditingData,
    isEditMode,
    editingSignatureId,
    loadingSignature,
  };

  return (
    <SignatureContext.Provider value={value}>
      {children}
    </SignatureContext.Provider>
  );
}

// Provider principal avec Suspense
export function SignatureProvider({ children }) {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SignatureProviderContent>{children}</SignatureProviderContent>
    </Suspense>
  );
}
