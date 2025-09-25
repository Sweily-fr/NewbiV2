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
  const { organization } = useActiveOrganization();

  // Données par défaut (mémorisées pour éviter les re-renders)
  const defaultSignatureData = useMemo(
    () => ({
      signatureName: "Ma signature professionnelle",
      isDefault: true,
      fullName: "Jean Dupont",
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
      primaryColor: "#171717",
      // Espacement entre prénom et nom (en pixels)
      nameSpacing: 4,
      // Alignement du nom et prénom (left, center, right)
      nameAlignment: "left",
      // Layout de la signature (vertical ou horizontal)
      layout: "horizontal",
      // Template de signature (vertical, horizontal, obama, rangan, shah, custom)
      template: "horizontal",
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
        },
        position: {
          fontFamily: "Arial, sans-serif",
          fontSize: 14,
          color: "#666666",
          fontWeight: "normal",
        },
        company: {
          fontFamily: "Arial, sans-serif",
          fontSize: 14,
          color: "#171717",
          fontWeight: "normal",
        },
        email: {
          fontFamily: "Arial, sans-serif",
          fontSize: 12,
          color: "#666666",
          fontWeight: "normal",
        },
        phone: {
          fontFamily: "Arial, sans-serif",
          fontSize: 12,
          color: "#666666",
          fontWeight: "normal",
        },
        mobile: {
          fontFamily: "Arial, sans-serif",
          fontSize: 12,
          color: "#666666",
          fontWeight: "normal",
        },
        website: {
          fontFamily: "Arial, sans-serif",
          fontSize: 12,
          color: "#666666",
          fontWeight: "normal",
        },
        address: {
          fontFamily: "Arial, sans-serif",
          fontSize: 12,
          color: "#666666",
          fontWeight: "normal",
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

  // Effet pour charger les données d'édition depuis localStorage
  useEffect(() => {
    if (isEditMode) {
      try {
        const editingSignature = localStorage.getItem("editingSignature");

        if (editingSignature) {
          const parsedData = JSON.parse(editingSignature);

          // Merger les données existantes avec les données par défaut pour éviter les champs manquants
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
              ...defaultSignatureData.typography,
              ...(parsedData.typography || {}),
            },
          };

          setSignatureData(mergedData);

          // Stocker l'ID de la signature en cours d'édition
          console.log("🔍 useSignatureData - ID de signature en édition:", parsedData.id);
          setEditingSignatureId(parsedData.id);

          // Nettoyer localStorage après chargement
          localStorage.removeItem("editingSignature");
        } else {
          console.log(
            "⚠️ [SIGNATURE_PROVIDER] Aucune donnée d'édition trouvée dans localStorage"
          );
        }
      } catch (error) {
        console.error(
          "❌ [SIGNATURE_PROVIDER] Erreur lors du chargement des données d'édition:",
          error
        );
      }
    } else {
      console.log(
        "📝 [SIGNATURE_PROVIDER] Mode création - utilisation des données par défaut"
      );
    }
  }, [isEditMode, defaultSignatureData]);

  // Effet pour appliquer automatiquement le logo de l'organisation
  useEffect(() => {
    console.log("🔍 SignatureProvider - Organization:", organization);
    console.log("🔍 SignatureProvider - Logo dans organization:", organization?.logo);
    console.log("🔍 SignatureProvider - Logo actuel signature:", signatureData.logo);
    
    if (organization?.logo && !signatureData.logo) {
      console.log("✅ SignatureProvider - Application automatique du logo:", organization.logo);
      setSignatureData(prev => ({
        ...prev,
        logo: organization.logo
      }));
    }
  }, [organization?.logo, signatureData.logo, organization]);

  const updateSignatureData = (key, value) => {
    setSignatureData((prev) => {
      // Handle nested object updates for spacings, colors, etc.
      if (
        key === "spacings" ||
        key === "colors" ||
        key === "columnWidths" ||
        key === "fontSize" ||
        key === "verticalSeparator" ||
        key === "typography" ||
        key === "separators"
      ) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            ...value,
          },
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
    console.log(
      "🔄 [SIGNATURE_PROVIDER] Chargement manuel des données d'édition:",
      editData
    );
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
        ...defaultSignatureData.typography,
        ...(editData.typography || {}),
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
