"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

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

// Provider pour les données de signature
export function SignatureProvider({ children }) {
  const searchParams = useSearchParams();
  const isEditMode = searchParams?.get('edit') === 'true';
  
  // Données par défaut (mémorisées pour éviter les re-renders)
  const defaultSignatureData = useMemo(() => ({
    signatureName: "Ma signature professionnelle",
    isDefault: true,
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
    primaryColor: "#2563eb",
    // Couleurs des différents éléments
    colors: {
      name: "#2563eb", // Couleur du nom et prénom
      position: "#666666", // Couleur du poste
      company: "#2563eb", // Couleur du nom d'entreprise
      contact: "#666666", // Couleur des informations de contact
      separatorVertical: "#e0e0e0", // Couleur du séparateur vertical
      separatorHorizontal: "#e0e0e0", // Couleur du séparateur horizontal
    },
    // Espacement entre prénom et nom (en pixels)
    nameSpacing: 4,
    // Alignement du nom et prénom (left, center, right)
    nameAlignment: 'left',
    // Layout de la signature (vertical ou horizontal)
    layout: 'horizontal',
    // Template de signature (vertical, horizontal, obama, rangan, shah)
    template: 'horizontal',
    // Largeurs des colonnes (en pourcentage)
    columnWidths: {
      photo: 25,      // Largeur de la colonne photo (25%)
      content: 75     // Largeur de la colonne contenu (75%)
    },
    // Images Cloudflare
    photo: null, // URL de la photo de profil
    photoKey: null, // Clé Cloudflare de la photo de profil
    logo: null, // URL du logo d'entreprise
    logoKey: null, // Clé Cloudflare du logo d'entreprise
    // Taille de l'image de profil (en pixels)
    imageSize: 80, // Taille par défaut de l'image de profil
    // Forme de l'image de profil (round ou square)
    imageShape: 'round', // Forme par défaut : ronde
    // Épaisseur des séparateurs (en pixels)
    separatorVerticalWidth: 1, // Épaisseur du séparateur vertical (entre colonnes)
    separatorHorizontalWidth: 1, // Épaisseur du séparateur horizontal (sous l'adresse)
    // Taille du logo entreprise (en pixels)
    logoSize: 60, // Taille par défaut du logo
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
    },
    // Typographie générale
    fontFamily: 'Arial, sans-serif', // Police par défaut
    fontSize: {
      name: 16, // Taille de police pour le nom
      position: 14, // Taille de police pour le poste
      contact: 12, // Taille de police pour les contacts
    }
  }), []);
  
  const [signatureData, setSignatureData] = useState(defaultSignatureData);
  const [editingSignatureId, setEditingSignatureId] = useState(null);
  
  // Effet pour charger les données d'édition depuis localStorage
  useEffect(() => {
    console.log('🔍 [SIGNATURE_PROVIDER] Mode édition détecté:', isEditMode);
    
    if (isEditMode) {
      try {
        const editingSignature = localStorage.getItem('editingSignature');
        console.log('📦 [SIGNATURE_PROVIDER] Données localStorage:', editingSignature);
        
        if (editingSignature) {
          const parsedData = JSON.parse(editingSignature);
          console.log('✅ [SIGNATURE_PROVIDER] Données parsées:', parsedData);
          
          // Merger les données existantes avec les données par défaut pour éviter les champs manquants
          const mergedData = {
            ...defaultSignatureData,
            ...parsedData,
            // S'assurer que les objets imbriqués sont bien mergés
            colors: {
              ...defaultSignatureData.colors,
              ...(parsedData.colors || {})
            },
            columnWidths: {
              ...defaultSignatureData.columnWidths,
              ...(parsedData.columnWidths || {})
            },
            spacings: {
              ...defaultSignatureData.spacings,
              ...(parsedData.spacings || {})
            },
            fontSize: {
              ...defaultSignatureData.fontSize,
              ...(parsedData.fontSize || {})
            }
          };
          
          console.log('🔄 [SIGNATURE_PROVIDER] Données mergées:', mergedData);
          setSignatureData(mergedData);
          
          // Stocker l'ID de la signature en cours d'édition
          setEditingSignatureId(parsedData.id);
          console.log('🆔 [SIGNATURE_PROVIDER] ID signature en édition:', parsedData.id);
          
          // Nettoyer localStorage après chargement
          localStorage.removeItem('editingSignature');
          console.log('🧹 [SIGNATURE_PROVIDER] localStorage nettoyé');
        } else {
          console.log('⚠️ [SIGNATURE_PROVIDER] Aucune donnée d\'édition trouvée dans localStorage');
        }
      } catch (error) {
        console.error('❌ [SIGNATURE_PROVIDER] Erreur lors du chargement des données d\'édition:', error);
      }
    } else {
      console.log('📝 [SIGNATURE_PROVIDER] Mode création - utilisation des données par défaut');
    }
  }, [isEditMode, defaultSignatureData]);

  const updateSignatureData = (key, value) => {
    setSignatureData((prev) => ({ ...prev, [key]: value }));
  };

  const resetSignatureData = () => {
    setSignatureData(defaultSignatureData);
  };
  
  // Fonction pour charger manuellement des données d'édition
  const loadEditingData = (editData) => {
    console.log('🔄 [SIGNATURE_PROVIDER] Chargement manuel des données d\'édition:', editData);
    const mergedData = {
      ...defaultSignatureData,
      ...editData,
      colors: {
        ...defaultSignatureData.colors,
        ...(editData.colors || {})
      },
      columnWidths: {
        ...defaultSignatureData.columnWidths,
        ...(editData.columnWidths || {})
      },
      spacings: {
        ...defaultSignatureData.spacings,
        ...(editData.spacings || {})
      },
      fontSize: {
        ...defaultSignatureData.fontSize,
        ...(editData.fontSize || {})
      }
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