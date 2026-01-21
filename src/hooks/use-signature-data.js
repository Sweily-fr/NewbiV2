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
import { applyTemplatePreset as applyPresetFunction } from "@/app/dashboard/outils/signatures-mail/utils/template-presets";

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
      templateId: "template1", // ID du template de signature
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
      elementsOrder: [
        "photo",
        "fullName",
        "position",
        "separator",
        "contact",
        "logo",
        "social",
      ],
      // Éléments masqués (pour personnalisation)
      hiddenElements: [],
      // Ordre des éléments pour la signature horizontale (3 zones)
      horizontalLayout: {
        leftColumn: ["photo", "fullName", "position"],
        rightColumn: ["contact"],
        bottomRow: ["separator", "logo", "social"],
      },
      // Réseaux sociaux (3 par défaut)
      socialNetworks: {
        facebook: { url: "#" },
        linkedin: { url: "#" },
        x: { url: "#" },
      },
      // Couleur globale et taille des icônes sociales
      socialGlobalColor: null, // null = couleurs par défaut de chaque réseau
      socialSize: 24, // Taille par défaut des icônes sociales
      // Séparateurs (activation) - définis par le preset du template
      separatorVerticalEnabled: true, // template1 a un séparateur vertical
      separatorHorizontalEnabled: false, // template1 n'a pas de séparateur horizontal
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
      photoVisible: false, // Visibilité de la photo (définie par le preset du template)
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
      logoSize: 24, // Taille par défaut du logo
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
    [],
  );

  // Hook pour récupérer une signature spécifique
  const [
    getSignature,
    {
      data: signatureQueryData,
      error: signatureQueryError,
      loading: loadingSignature,
    },
  ] = useLazyQuery(GET_EMAIL_SIGNATURE);

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
        photoVisible:
          fetchedSignature.photoVisible !== undefined
            ? fetchedSignature.photoVisible
            : defaultSignatureData.photoVisible,
        orientation:
          fetchedSignature.orientation || defaultSignatureData.orientation,
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
        const computedFullName =
          `${fetchedSignature.firstName || ""} ${fetchedSignature.lastName || ""}`.trim();
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
        signatureIdFromUrl,
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
            parsedData,
          );

          // Merger les données existantes avec les données par défaut
          const mergedData = {
            ...defaultSignatureData,
            ...parsedData,
            contactElementsOrder:
              parsedData.contactElementsOrder ||
              defaultSignatureData.contactElementsOrder,
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
            "⚠️ [SIGNATURE_PROVIDER] Aucune donnée d'édition trouvée",
          );
        }
      } catch (error) {
        console.error(
          "❌ [SIGNATURE_PROVIDER] Erreur lors du chargement:",
          error,
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

  // Fonction pour appliquer un preset de template (appelée depuis les pages)
  const applyTemplatePreset = React.useCallback((templateId) => {
    console.log("🎨 [PRESET] Application du preset pour:", templateId);
    const presetData = applyPresetFunction(defaultSignatureData, templateId);
    setSignatureData(presetData);
    console.log("✅ [PRESET] Preset appliqué:", presetData.templateId, "photoVisible:", presetData.photoVisible, "separatorVerticalEnabled:", presetData.separatorVerticalEnabled);
    return presetData;
  }, [defaultSignatureData]);

  // Fonction pour vérifier et appliquer le preset depuis sessionStorage
  const checkAndApplyTemplatePreset = React.useCallback(() => {
    if (typeof window !== "undefined") {
      const newTemplate = sessionStorage.getItem("newSignatureTemplate");
      if (newTemplate) {
        console.log("🎨 [SESSION] Template trouvé dans sessionStorage:", newTemplate);
        sessionStorage.removeItem("newSignatureTemplate");
        applyTemplatePreset(newTemplate);
        return true;
      }
    }
    return false;
  }, [applyTemplatePreset]);

  const updateSignatureData = (key, value) => {
    setSignatureData((prev) => {
      // Si c'est un objet avec plusieurs clés, mettre à jour tout en une fois
      if (typeof key === "object" && key !== null) {
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
        editData.contactElementsOrder ||
        defaultSignatureData.contactElementsOrder,
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

  // ========== Widget System State ==========
  const [widgets, setWidgets] = useState([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);

  // Add a widget to the signature
  const addWidget = React.useCallback((widget) => {
    setWidgets((prev) => [...prev, widget]);
  }, []);

  // Update a widget's props
  const updateWidget = React.useCallback((widgetId, newProps) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widgetId
          ? { ...w, props: { ...w.props, ...newProps } }
          : w
      )
    );
  }, []);

  // Delete a widget
  const deleteWidget = React.useCallback((widgetId) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null);
    }
  }, [selectedWidgetId]);

  // Reorder widgets (for drag & drop)
  const reorderWidgets = React.useCallback((newWidgets) => {
    setWidgets(newWidgets);
  }, []);

  // Select a widget
  const selectWidget = React.useCallback((widgetId) => {
    setSelectedWidgetId(widgetId);
  }, []);

  // Get the selected widget
  const getSelectedWidget = React.useCallback(() => {
    return widgets.find((w) => w.id === selectedWidgetId) || null;
  }, [widgets, selectedWidgetId]);

  // Clear all widgets
  const clearWidgets = React.useCallback(() => {
    setWidgets([]);
    setSelectedWidgetId(null);
  }, []);

  // ========== Container System State (Unified Hierarchical Structure) ==========
  // rootContainer is the single root container that holds the entire signature structure
  const [rootContainer, setRootContainer] = useState(null);
  const [selectedContainerId, setSelectedContainerId] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [hoveredContainerId, setHoveredContainerId] = useState(null);

  // Helper function to find a container by ID recursively
  const findContainerById = React.useCallback((container, containerId) => {
    if (!container) return null;
    if (container.id === containerId) return container;
    if (container.children) {
      for (const child of container.children) {
        const found = findContainerById(child, containerId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Helper function to find parent of a container
  const findParentContainer = React.useCallback((container, containerId, parent = null) => {
    if (!container) return null;
    if (container.id === containerId) return parent;
    if (container.children) {
      for (const child of container.children) {
        const found = findParentContainer(child, containerId, container);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Helper function to update a container recursively
  const updateContainerRecursive = React.useCallback((container, containerId, updates) => {
    if (!container) return container;
    if (container.id === containerId) {
      return { ...container, ...updates };
    }
    if (container.children) {
      return {
        ...container,
        children: container.children.map(child =>
          updateContainerRecursive(child, containerId, updates)
        ),
      };
    }
    return container;
  }, []);

  // Helper function to delete a container recursively
  const deleteContainerRecursive = React.useCallback((container, containerId) => {
    if (!container) return container;
    if (container.id === containerId) return null;
    if (container.children) {
      const newChildren = container.children
        .map(child => deleteContainerRecursive(child, containerId))
        .filter(Boolean);
      return { ...container, children: newChildren };
    }
    return container;
  }, []);

  // Helper function to update element in a container recursively
  const updateElementRecursive = React.useCallback((container, containerId, elementId, newProps) => {
    if (!container) return container;
    if (container.id === containerId && container.elements) {
      return {
        ...container,
        elements: container.elements.map(el =>
          el.id === elementId ? { ...el, props: { ...el.props, ...newProps } } : el
        ),
      };
    }
    if (container.children) {
      return {
        ...container,
        children: container.children.map(child =>
          updateElementRecursive(child, containerId, elementId, newProps)
        ),
      };
    }
    return container;
  }, []);

  // Helper function to delete element from a container recursively
  const deleteElementRecursive = React.useCallback((container, containerId, elementId) => {
    if (!container) return container;
    if (container.id === containerId && container.elements) {
      return {
        ...container,
        elements: container.elements.filter(el => el.id !== elementId),
      };
    }
    if (container.children) {
      return {
        ...container,
        children: container.children.map(child =>
          deleteElementRecursive(child, containerId, elementId)
        ),
      };
    }
    return container;
  }, []);

  // Helper function to add a child container to a parent
  const addChildToContainerRecursive = React.useCallback((container, parentId, newChild, position = 'end') => {
    if (!container) return container;
    if (container.id === parentId) {
      const children = container.children || [];
      const newChildren = position === 'start'
        ? [newChild, ...children]
        : [...children, newChild];
      return { ...container, children: newChildren };
    }
    // Recurse into children if they exist
    if (container.children && container.children.length > 0) {
      return {
        ...container,
        children: container.children.map(child =>
          addChildToContainerRecursive(child, parentId, newChild, position)
        ),
      };
    }
    return container;
  }, []);

  // Set the root container (used when loading a template)
  const setRootContainerData = React.useCallback((newRoot) => {
    setRootContainer(newRoot);
  }, []);

  // Update root container directly
  const updateRootContainer = React.useCallback((updates) => {
    setRootContainer(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  // Add a child container to a parent container
  const addContainer = React.useCallback((parentId, newContainer, position = 'end') => {
    setRootContainer(prev =>
      addChildToContainerRecursive(prev, parentId, newContainer, position)
    );
  }, [addChildToContainerRecursive]);

  // Update a container's properties
  const updateContainer = React.useCallback((containerId, updates) => {
    setRootContainer(prev => updateContainerRecursive(prev, containerId, updates));
  }, [updateContainerRecursive]);

  // Delete a container
  const deleteContainer = React.useCallback((containerId) => {
    // Don't allow deleting the root container
    if (rootContainer && rootContainer.id === containerId) {
      console.warn('Cannot delete root container');
      return;
    }
    setRootContainer(prev => deleteContainerRecursive(prev, containerId));
    if (selectedContainerId === containerId) {
      setSelectedContainerId(null);
      setSelectedElementId(null);
    }
  }, [rootContainer, selectedContainerId, deleteContainerRecursive]);

  // Select a container
  const selectContainer = React.useCallback((containerId) => {
    setSelectedContainerId(containerId);
    if (containerId) {
      setSelectedElementId(null);
    }
  }, []);

  // Select an element within a container
  const selectElement = React.useCallback((elementId, containerId) => {
    setSelectedElementId(elementId);
    setSelectedContainerId(containerId);
  }, []);

  // Get the selected container
  const getSelectedContainer = React.useCallback(() => {
    if (!selectedContainerId || !rootContainer) return null;
    return findContainerById(rootContainer, selectedContainerId);
  }, [rootContainer, selectedContainerId, findContainerById]);

  // Get the selected element
  const getSelectedElement = React.useCallback(() => {
    if (!selectedContainerId || !selectedElementId || !rootContainer) return null;
    const container = findContainerById(rootContainer, selectedContainerId);
    if (!container || !container.elements) return null;
    return container.elements.find((el) => el.id === selectedElementId) || null;
  }, [rootContainer, selectedContainerId, selectedElementId, findContainerById]);

  // Update an element within a container
  const updateElement = React.useCallback((containerId, elementId, newProps) => {
    setRootContainer(prev => updateElementRecursive(prev, containerId, elementId, newProps));
  }, [updateElementRecursive]);

  // Delete an element from a container
  const deleteElement = React.useCallback((containerId, elementId) => {
    setRootContainer(prev => deleteElementRecursive(prev, containerId, elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [selectedElementId, deleteElementRecursive]);

  // Clear root container
  const clearRootContainer = React.useCallback(() => {
    setRootContainer(null);
    setSelectedContainerId(null);
    setSelectedElementId(null);
  }, []);

  // Deselect all (container and element)
  const clearSelection = React.useCallback(() => {
    setSelectedContainerId(null);
    setSelectedElementId(null);
  }, []);

  // Get container depth (for UI indentation)
  const getContainerDepth = React.useCallback((containerId) => {
    const findDepth = (container, targetId, depth = 0) => {
      if (!container) return -1;
      if (container.id === targetId) return depth;
      if (container.children) {
        for (const child of container.children) {
          const found = findDepth(child, targetId, depth + 1);
          if (found !== -1) return found;
        }
      }
      return -1;
    };
    return findDepth(rootContainer, containerId);
  }, [rootContainer]);

  // Check if a container is a descendant of another container
  const isDescendantOf = React.useCallback((container, ancestorId, targetId) => {
    if (!container) return false;
    if (container.id === targetId) return true;
    if (container.children) {
      return container.children.some(child => isDescendantOf(child, ancestorId, targetId));
    }
    return false;
  }, []);

  // Move a container to a new parent
  const moveContainer = React.useCallback((containerId, newParentId, position = 'end') => {
    console.log("🔄 [moveContainer] Called with:", { containerId, newParentId, position });

    if (!rootContainer) {
      console.log("🔄 [moveContainer] No rootContainer, aborting");
      return;
    }

    // Can't move to itself
    if (containerId === newParentId) {
      console.log("🔄 [moveContainer] Cannot move to itself, aborting");
      return;
    }

    // Find the container to move
    const containerToMove = findContainerById(rootContainer, containerId);
    if (!containerToMove) {
      console.log("🔄 [moveContainer] Container not found:", containerId);
      return;
    }

    // Can't move a container into one of its descendants
    if (isDescendantOf(containerToMove, containerId, newParentId)) {
      console.log("🔄 [moveContainer] Cannot move into descendant, aborting");
      return;
    }

    console.log("🔄 [moveContainer] Moving container:", containerToMove);

    // Remove from current location
    let updatedRoot = deleteContainerRecursive(rootContainer, containerId);
    console.log("🔄 [moveContainer] After delete:", updatedRoot);

    // Add to new parent
    updatedRoot = addChildToContainerRecursive(updatedRoot, newParentId, containerToMove, position);
    console.log("🔄 [moveContainer] After add to new parent:", updatedRoot);

    setRootContainer(updatedRoot);

    // Clear selection after move
    setSelectedContainerId(null);
  }, [rootContainer, findContainerById, isDescendantOf, deleteContainerRecursive, addChildToContainerRecursive]);

  // Helper function to find and extract an element from a container
  const findAndRemoveElement = React.useCallback((container, sourceContainerId, elementId) => {
    if (!container) return { container, element: null };

    if (container.id === sourceContainerId && container.elements) {
      const element = container.elements.find(el => el.id === elementId);
      if (element) {
        return {
          container: {
            ...container,
            elements: container.elements.filter(el => el.id !== elementId),
          },
          element,
        };
      }
    }

    if (container.children) {
      let foundElement = null;
      const newChildren = container.children.map(child => {
        if (foundElement) return child;
        const result = findAndRemoveElement(child, sourceContainerId, elementId);
        if (result.element) {
          foundElement = result.element;
          return result.container;
        }
        return child;
      });

      return {
        container: { ...container, children: newChildren },
        element: foundElement,
      };
    }

    return { container, element: null };
  }, []);

  // Helper function to add element to a container
  const addElementToContainer = React.useCallback((container, targetContainerId, element) => {
    if (!container) return container;

    if (container.id === targetContainerId) {
      const elements = container.elements || [];
      return {
        ...container,
        elements: [...elements, element],
      };
    }

    if (container.children) {
      return {
        ...container,
        children: container.children.map(child =>
          addElementToContainer(child, targetContainerId, element)
        ),
      };
    }

    return container;
  }, []);

  // Move an element from one container to another
  const moveElement = React.useCallback((elementId, sourceContainerId, targetContainerId) => {
    if (!rootContainer || sourceContainerId === targetContainerId) return;

    // Remove element from source container and get the element
    const { container: updatedRoot, element } = findAndRemoveElement(
      rootContainer,
      sourceContainerId,
      elementId
    );

    if (!element) return;

    // Add element to target container
    const finalRoot = addElementToContainer(updatedRoot, targetContainerId, element);

    setRootContainer(finalRoot);

    // Clear selection after move
    setSelectedElementId(null);
    setSelectedContainerId(null);
  }, [rootContainer, findAndRemoveElement, addElementToContainer]);

  // Reorder containers within the same parent
  const reorderContainer = React.useCallback((draggedContainerId, targetContainerId, position) => {
    if (!rootContainer) return;
    console.log("🔄 [reorderContainer] Called with:", { draggedContainerId, targetContainerId, position });

    // Find parent of both containers (they must have the same parent)
    const findParentOfContainer = (container, targetId, parent = null) => {
      if (!container) return null;
      if (container.id === targetId) return parent;
      if (container.children) {
        for (const child of container.children) {
          const found = findParentOfContainer(child, targetId, container);
          if (found) return found;
        }
      }
      return null;
    };

    const draggedParent = findParentOfContainer(rootContainer, draggedContainerId, null);
    const targetParent = findParentOfContainer(rootContainer, targetContainerId, null);

    // Both containers must have the same parent
    if (!draggedParent || !targetParent || draggedParent.id !== targetParent.id) {
      console.log("🔄 [reorderContainer] Different parents, using moveContainer instead");
      // If different parents, move into the target container
      moveContainer(draggedContainerId, targetContainerId);
      return;
    }

    console.log("🔄 [reorderContainer] Same parent:", draggedParent.id);

    // Reorder within the parent
    const reorderInParent = (container) => {
      if (container.id === draggedParent.id && container.children) {
        const children = [...container.children];
        const draggedIndex = children.findIndex(c => c.id === draggedContainerId);
        const targetIndex = children.findIndex(c => c.id === targetContainerId);

        if (draggedIndex === -1 || targetIndex === -1) return container;

        // Remove dragged container
        const [draggedContainer] = children.splice(draggedIndex, 1);

        // Calculate new index based on position
        let newIndex = targetIndex;
        if (draggedIndex < targetIndex) {
          newIndex = position === 'after' ? targetIndex : targetIndex - 1;
        } else {
          newIndex = position === 'after' ? targetIndex + 1 : targetIndex;
        }

        // Insert at new position
        children.splice(newIndex, 0, draggedContainer);

        return { ...container, children };
      }

      // Recursively search
      if (container.children) {
        return {
          ...container,
          children: container.children.map(child => reorderInParent(child))
        };
      }

      return container;
    };

    const updatedRoot = reorderInParent(rootContainer);
    setRootContainer(updatedRoot);
  }, [rootContainer, moveContainer]);

  // Reorder elements within the same container
  const reorderElement = React.useCallback((containerId, draggedElementId, targetElementId, position) => {
    if (!rootContainer) return;

    const reorderInContainer = (container) => {
      if (container.id === containerId && container.elements) {
        const elements = [...container.elements];
        const draggedIndex = elements.findIndex(el => el.id === draggedElementId);
        const targetIndex = elements.findIndex(el => el.id === targetElementId);

        if (draggedIndex === -1 || targetIndex === -1) return container;

        // Remove dragged element
        const [draggedElement] = elements.splice(draggedIndex, 1);

        // Calculate new index based on position
        let newIndex = targetIndex;
        if (draggedIndex < targetIndex) {
          // If dragging forward, adjust for removed element
          newIndex = position === 'after' ? targetIndex : targetIndex - 1;
        } else {
          // If dragging backward
          newIndex = position === 'after' ? targetIndex + 1 : targetIndex;
        }

        // Insert at new position
        elements.splice(newIndex, 0, draggedElement);

        return { ...container, elements };
      }

      // Recursively search children
      if (container.children) {
        return {
          ...container,
          children: container.children.map(child => reorderInContainer(child))
        };
      }

      return container;
    };

    const updatedRoot = reorderInContainer(rootContainer);
    setRootContainer(updatedRoot);
  }, [rootContainer]);

  // ========== Backward Compatibility Aliases ==========
  // These aliases maintain compatibility with existing code that uses "block" terminology
  const blocks = rootContainer; // For components that expect blocks
  const setBlocks = setRootContainerData;
  const selectedBlockId = selectedContainerId;
  const setSelectedBlockId = setSelectedContainerId;
  const addBlock = addContainer;
  const updateBlock = updateContainer;
  const deleteBlock = deleteContainer;
  const selectBlock = selectContainer;
  const getSelectedBlock = getSelectedContainer;
  const reorderBlocks = setRootContainerData; // Direct replacement
  const clearBlocks = clearRootContainer;

  // États et fonctions pour les actions de la toolbar
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Fonctions pour ouvrir les modals depuis la toolbar
  const openCancelModal = () => setShowCancelModal(true);
  const closeCancelModal = () => setShowCancelModal(false);
  const openSaveModal = () => setShowSaveModal(true);
  const closeSaveModal = () => setShowSaveModal(false);

  const value = {
    signatureData,
    updateSignatureData,
    setSignatureData,
    resetSignatureData,
    loadEditingData,
    applyTemplatePreset,
    checkAndApplyTemplatePreset,
    isEditMode,
    editingSignatureId,
    loadingSignature,
    // Widget system
    widgets,
    setWidgets,
    selectedWidgetId,
    setSelectedWidgetId,
    addWidget,
    updateWidget,
    deleteWidget,
    reorderWidgets,
    selectWidget,
    getSelectedWidget,
    clearWidgets,
    // Container system (new unified structure)
    rootContainer,
    setRootContainer: setRootContainerData,
    selectedContainerId,
    setSelectedContainerId,
    selectedElementId,
    setSelectedElementId,
    hoveredContainerId,
    setHoveredContainerId,
    addContainer,
    updateContainer,
    deleteContainer,
    selectContainer,
    selectElement,
    getSelectedContainer,
    getSelectedElement,
    updateElement,
    deleteElement,
    clearRootContainer,
    clearSelection,
    findContainerById: (containerId) => findContainerById(rootContainer, containerId),
    findParentContainer: (containerId) => findParentContainer(rootContainer, containerId, null),
    getContainerDepth,
    moveContainer,
    moveElement,
    reorderContainer,
    reorderElement,
    updateRootContainer,
    // Backward compatibility aliases
    blocks,
    setBlocks,
    selectedBlockId,
    setSelectedBlockId,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    selectBlock,
    getSelectedBlock,
    clearBlocks,
    // Actions pour la toolbar
    showCancelModal,
    setShowCancelModal,
    showSaveModal,
    setShowSaveModal,
    openCancelModal,
    closeCancelModal,
    openSaveModal,
    closeSaveModal,
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
