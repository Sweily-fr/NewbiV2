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
    // Espacement entre prénom et nom (en pixels)
    nameSpacing: 4,
    // Alignement du nom et prénom (left, center, right)
    nameAlignment: 'left',
    // Images Cloudflare
    photo: null, // URL de la photo de profil
    photoKey: null, // Clé Cloudflare de la photo de profil
    logo: null, // URL du logo d'entreprise
    logoKey: null, // Clé Cloudflare du logo d'entreprise
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
      // Espacement entre prénom et nom (en pixels)
      nameSpacing: 4,
      // Alignement du nom et prénom (left, center, right)
      nameAlignment: 'left',
      // Images Cloudflare
      photo: null,
      photoKey: null,
      logo: null,
      logoKey: null,
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
