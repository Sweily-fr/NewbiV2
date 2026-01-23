// Fonction pour mapper les catégories du formulaire vers les enums de l'API
export const mapCategoryToEnum = (category) => {
  const categoryMap = {
    // Fournitures et équipement
    bureau: "OFFICE_SUPPLIES",
    materiel: "HARDWARE", // ✅ Matériel informatique
    mobilier: "OFFICE_SUPPLIES", // ✅ Mobilier de bureau
    equipement: "HARDWARE", // ✅ Équipement professionnel
    
    // Transport et déplacements
    transport: "TRAVEL",
    carburant: "TRAVEL",
    parking: "TRAVEL",
    peage: "TRAVEL",
    taxi: "TRAVEL",
    train: "TRAVEL",
    avion: "TRAVEL",
    location_vehicule: "TRAVEL",
    
    // Repas et hébergement
    repas: "MEALS",
    restaurant: "MEALS",
    hotel: "ACCOMMODATION", // ✅ Hébergement
    
    // Communication et marketing
    marketing: "MARKETING",
    publicite: "MARKETING",
    communication: "MARKETING",
    telephone: "UTILITIES", // ✅ Charges/Utilities
    internet: "UTILITIES", // ✅ Charges/Utilities
    site_web: "MARKETING",
    reseaux_sociaux: "MARKETING",
    
    // Formation et développement
    formation: "TRAINING",
    conference: "TRAINING",
    livres: "TRAINING",
    abonnement: "SUBSCRIPTIONS", // ✅ Abonnements
    
    // Services professionnels
    comptabilite: "SERVICES",
    juridique: "SERVICES",
    assurance: "INSURANCE", // ✅ Assurance
    banque: "SERVICES",
    conseil: "SERVICES",
    sous_traitance: "SERVICES",
    
    // Locaux et charges
    loyer: "RENT",
    electricite: "UTILITIES", // ✅ Charges/Utilities
    eau: "UTILITIES", // ✅ Charges/Utilities
    chauffage: "UTILITIES", // ✅ Charges/Utilities
    entretien: "MAINTENANCE", // ✅ Maintenance
    
    // Logiciels et outils
    logiciel: "SOFTWARE", // ✅ Logiciels
    saas: "SUBSCRIPTIONS", // ✅ Abonnements SaaS
    licence: "SOFTWARE", // ✅ Licences logicielles
    
    // Ressources humaines
    salaire: "SALARIES",
    charges_sociales: "SALARIES",
    recrutement: "SERVICES",
    
    // Autres
    cadeaux: "MARKETING",
    representation: "MARKETING",
    poste: "OFFICE_SUPPLIES",
    impression: "OFFICE_SUPPLIES",
    autre: "OTHER",
    
    // Mapping ancien format (majuscules) pour compatibilité
    Transport: "TRAVEL",
    Repas: "MEALS",
    Bureau: "OFFICE_SUPPLIES",
    Prestation: "SERVICES",
    Alimentation: "MEALS",
    Logement: "ACCOMMODATION",
    Salaire: "SALARIES",
    Freelance: "SERVICES",
    "": "OTHER", // Catégorie vide par défaut
  };

  return categoryMap[category] || "OTHER";
};

// Fonction pour mapper les méthodes de paiement du formulaire vers les enums de l'API
export const mapPaymentMethodToEnum = (paymentMethod) => {
  const paymentMethodMap = {
    CARD: "CREDIT_CARD",
    CASH: "CASH",
    TRANSFER: "BANK_TRANSFER",
    CHECK: "CHECK",
  };

  return paymentMethodMap[paymentMethod] || "BANK_TRANSFER";
};
