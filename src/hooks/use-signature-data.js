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
      columnWidths {
        photo
        content
      }
      photo
      photoKey
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

  // Hook pour récupérer une signature spécifique
  const [getSignature, { loading: loadingSignature }] = useLazyQuery(
    GET_EMAIL_SIGNATURE,
    {
      onCompleted: (data) => {
        if (data?.getEmailSignature) {
          const signatureData = data.getEmailSignature;
          console.log(
            "🔍 [SIGNATURE_DATA] Données récupérées via GraphQL:",
            signatureData
          );
          console.log(
            "🎯 [SIGNATURE_DATA] Orientation récupérée:",
            signatureData.orientation
          );

          // Transformer firstName + lastName en fullName pour compatibilité
          const transformedData = {
            ...signatureData,
            fullName:
              signatureData.firstName && signatureData.lastName
                ? `${signatureData.firstName} ${signatureData.lastName}`.trim()
                : signatureData.firstName || signatureData.lastName || "",
          };

          // Reconstruire les URLs à partir des clés Cloudflare si nécessaire
          const SIGNATURE_URL = "https://pub-f4c5982b836541739955ba7662828aa2.r2.dev";
          
          // Si on a une clé mais pas d'URL, ou si l'URL est incorrecte/obsolète
          if (transformedData.photoKey) {
            // Toujours reconstruire l'URL à partir de la clé pour garantir la cohérence
            const reconstructedPhotoUrl = `${SIGNATURE_URL}/${transformedData.photoKey}`;
            if (transformedData.photo !== reconstructedPhotoUrl) {
              transformedData.photo = reconstructedPhotoUrl;
              console.log("🔄 [SIGNATURE_DATA] URL photo reconstruite:", transformedData.photo);
            }
          }
          
          if (transformedData.logoKey) {
            // Toujours reconstruire l'URL à partir de la clé pour garantir la cohérence
            const reconstructedLogoUrl = `${SIGNATURE_URL}/${transformedData.logoKey}`;
            if (transformedData.logo !== reconstructedLogoUrl) {
              transformedData.logo = reconstructedLogoUrl;
              console.log("🔄 [SIGNATURE_DATA] URL logo reconstruite:", transformedData.logo);
            }
          }

          // Merger les données récupérées avec les données par défaut
          const mergedData = {
            ...defaultSignatureData,
            ...transformedData,
            // S'assurer que les objets imbriqués sont bien mergés
            colors: {
              ...defaultSignatureData.colors,
              ...(signatureData.colors || {}),
            },
            columnWidths: {
              ...defaultSignatureData.columnWidths,
              ...(signatureData.columnWidths || {}),
            },
            spacings: {
              ...defaultSignatureData.spacings,
              ...(signatureData.spacings || {}),
            },
            fontSize: {
              ...defaultSignatureData.fontSize,
              ...(signatureData.fontSize || {}),
            },
            socialNetworks: {
              ...defaultSignatureData.socialNetworks,
              ...(signatureData.socialNetworks || {}),
            },
            typography: {
              fullName: {
                ...defaultSignatureData.typography.fullName,
                ...(signatureData.typography?.fullName || {}),
              },
              position: {
                ...defaultSignatureData.typography.position,
                ...(signatureData.typography?.position || {}),
              },
              company: {
                ...defaultSignatureData.typography.company,
                ...(signatureData.typography?.company || {}),
              },
              email: {
                ...defaultSignatureData.typography.email,
                ...(signatureData.typography?.email || {}),
              },
              phone: {
                ...defaultSignatureData.typography.phone,
                ...(signatureData.typography?.phone || {}),
              },
              mobile: {
                ...defaultSignatureData.typography.mobile,
                ...(signatureData.typography?.mobile || {}),
              },
              website: {
                ...defaultSignatureData.typography.website,
                ...(signatureData.typography?.website || {}),
              },
              address: {
                ...defaultSignatureData.typography.address,
                ...(signatureData.typography?.address || {}),
              },
            },
          };

          setSignatureData(mergedData);
          console.log("✅ [SIGNATURE_DATA] Données mergées et chargées");
        }
      },
      onError: (error) => {
        console.error("❌ [SIGNATURE_DATA] Erreur lors du chargement:", error);
      },
    }
  );

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
      logo: null, // URL du logo d'entreprise
      logoKey: null, // Clé Cloudflare du logo d'entreprise
      // Taille de l'image de profil (en pixels)
      imageSize: 80, // Taille par défaut de l'image de profil
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
      separatorVerticalWidth: 4, // Épaisseur du séparateur vertical (entre colonnes) - DEPRECATED
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

  const [signatureData, setSignatureData] = useState(defaultSignatureData);
  const [editingSignatureId, setEditingSignatureId] = useState(null);

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
  }, [isEditMode, signatureIdFromUrl, defaultSignatureData, getSignature]);

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
  }, [isEditMode, defaultSignatureData]);

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
