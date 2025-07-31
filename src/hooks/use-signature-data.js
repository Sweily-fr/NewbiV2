"use client";

import React, { createContext, useContext, useState } from "react";

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
  const [signatureData, setSignatureData] = useState({
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
    companyName: "Newbi",
    website: "https://www.newbi.fr",
    address: "123 Avenue des Champs-Élysées, 75008 Paris, France",
    primaryColor: "#2563eb",
<<<<<<< HEAD
=======
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
    layout: 'vertical',
>>>>>>> Dylan/SM/AlignedField
    // Images Cloudflare
    photo: null, // URL de la photo de profil
    photoKey: null, // Clé Cloudflare de la photo de profil
    logo: null, // URL du logo d'entreprise
    logoKey: null, // Clé Cloudflare du logo d'entreprise
<<<<<<< HEAD
=======
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
      photoBottom: 12, // Espacement sous la photo
      logoBottom: 12, // Espacement sous le logo
      nameBottom: 8, // Espacement sous le nom
      positionBottom: 8, // Espacement sous le poste
      contactBottom: 6, // Espacement entre chaque contact
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
>>>>>>> Dylan/SM/AlignedField
  });

  const updateSignatureData = (key, value) => {
    setSignatureData((prev) => ({ ...prev, [key]: value }));
  };

  const resetSignatureData = () => {
    setSignatureData({
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
      companyName: "Newbi",
      website: "https://www.newbi.fr",
      address: "123 Avenue des Champs-Élysées, 75008 Paris, France",
      primaryColor: "#2563eb",
<<<<<<< HEAD
=======
      // Couleurs des différents éléments
      colors: {
        name: "#2563eb",
        position: "#666666",
        company: "#2563eb",
        contact: "#666666",
        separatorVertical: "#e0e0e0",
        separatorHorizontal: "#e0e0e0",
      },
      // Espacement entre prénom et nom (en pixels)
      nameSpacing: 4,
      // Alignement du nom et prénom (left, center, right)
      nameAlignment: 'left',
      // Layout de la signature (vertical ou horizontal)
      layout: 'vertical',
>>>>>>> Dylan/SM/AlignedField
      // Images Cloudflare
      photo: null,
      photoKey: null,
      logo: null,
      logoKey: null,
<<<<<<< HEAD
=======
      // Taille de l'image de profil (en pixels)
      imageSize: 80,
      // Forme de l'image de profil (round ou square)
      imageShape: 'round',
      // Épaisseur des séparateurs (en pixels)
      separatorVerticalWidth: 1,
      separatorHorizontalWidth: 1,
      // Taille du logo entreprise (en pixels)
      logoSize: 60,
      // Espacements entre les éléments (en pixels)
      spacings: {
        photoBottom: 12,
        logoBottom: 12,
        nameBottom: 8,
        positionBottom: 8,
        contactBottom: 6,
        separatorTop: 12,
        separatorBottom: 12,
      },
      // Typographie générale
      fontFamily: 'Arial, sans-serif',
      fontSize: {
        name: 16,
        position: 14,
        contact: 12,
      }
>>>>>>> Dylan/SM/AlignedField
    });
  };

  const value = {
    signatureData,
    updateSignatureData,
    setSignatureData,
    resetSignatureData,
  };

  return (
    <SignatureContext.Provider value={value}>
      {children}
    </SignatureContext.Provider>
  );
}
