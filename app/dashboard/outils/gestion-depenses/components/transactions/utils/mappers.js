// Fonction pour mapper les catégories du formulaire vers les enums de l'API
export const mapCategoryToEnum = (category) => {
  const categoryMap = {
    // Mapping depuis le formulaire (minuscules)
    bureau: "OFFICE_SUPPLIES",
    transport: "TRAVEL",
    repas: "MEALS",
    materiel: "EQUIPMENT",
    marketing: "MARKETING",
    formation: "TRAINING",
    autre: "OTHER",
    // Mapping ancien format (majuscules) pour compatibilité
    Transport: "TRAVEL",
    Repas: "MEALS",
    Bureau: "OFFICE_SUPPLIES",
    Prestation: "SERVICES",
    Alimentation: "MEALS",
    Logement: "RENT",
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
