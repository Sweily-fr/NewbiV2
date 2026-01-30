// Configuration des catégories bancaires Bridge
// Les IDs correspondent aux category_id de Bridge API

// Catégories de dépenses (transactions négatives)
export const expenseCategories = {
  // Alimentation
  270: { name: "Alimentation", color: "#f97316" }, // Orange
  271: { name: "Restaurants", color: "#ea580c" },
  272: { name: "Courses", color: "#fb923c" },

  // Transport
  280: { name: "Transport", color: "#3b82f6" }, // Blue
  281: { name: "Carburant", color: "#2563eb" },
  282: { name: "Transports en commun", color: "#60a5fa" },
  283: { name: "Taxi/VTC", color: "#93c5fd" },
  284: { name: "Parking", color: "#1d4ed8" },

  // Logement
  290: { name: "Logement", color: "#8b5cf6" }, // Violet
  291: { name: "Loyer", color: "#7c3aed" },
  292: { name: "Charges", color: "#a78bfa" },
  293: { name: "Assurance habitation", color: "#c4b5fd" },

  // Loisirs
  300: { name: "Loisirs", color: "#ec4899" }, // Pink
  301: { name: "Sorties", color: "#db2777" },
  302: { name: "Voyages", color: "#f472b6" },
  303: { name: "Sport", color: "#f9a8d4" },

  // Santé
  310: { name: "Santé", color: "#14b8a6" }, // Teal
  311: { name: "Médecin", color: "#0d9488" },
  312: { name: "Pharmacie", color: "#2dd4bf" },
  313: { name: "Mutuelle", color: "#5eead4" },

  // Shopping
  320: { name: "Shopping", color: "#f43f5e" }, // Rose
  321: { name: "Vêtements", color: "#e11d48" },
  322: { name: "High-tech", color: "#fb7185" },
  323: { name: "Maison", color: "#fda4af" },

  // Services
  330: { name: "Services", color: "#6366f1" }, // Indigo
  331: { name: "Téléphone/Internet", color: "#4f46e5" },
  332: { name: "Abonnements", color: "#818cf8" },
  333: { name: "Banque", color: "#a5b4fc" },

  // Impôts
  340: { name: "Impôts & Taxes", color: "#64748b" }, // Slate
  341: { name: "Impôt sur le revenu", color: "#475569" },
  342: { name: "Taxe foncière", color: "#94a3b8" },

  // Éducation
  350: { name: "Éducation", color: "#0ea5e9" }, // Sky
  351: { name: "Formation", color: "#0284c7" },
  352: { name: "Livres", color: "#38bdf8" },

  // Autres
  0: { name: "Autre", color: "#9ca3af" },
  null: { name: "Non catégorisé", color: "#d1d5db" },
};

// Catégories de revenus (transactions positives)
export const incomeCategories = {
  // Salaire
  100: { name: "Salaire", color: "#22c55e" }, // Green
  101: { name: "Prime", color: "#16a34a" },
  102: { name: "Remboursement", color: "#4ade80" },

  // Revenus professionnels
  110: { name: "Revenus professionnels", color: "#10b981" }, // Emerald
  111: { name: "Facturation", color: "#059669" },
  112: { name: "Honoraires", color: "#34d399" },

  // Aides
  120: { name: "Aides & Allocations", color: "#06b6d4" }, // Cyan
  121: { name: "CAF", color: "#0891b2" },
  122: { name: "Pôle Emploi", color: "#22d3ee" },

  // Investissements
  130: { name: "Investissements", color: "#8b5cf6" }, // Violet
  131: { name: "Dividendes", color: "#7c3aed" },
  132: { name: "Intérêts", color: "#a78bfa" },

  // Transferts
  140: { name: "Virements reçus", color: "#3b82f6" }, // Blue
  141: { name: "Virement interne", color: "#2563eb" },

  // Autres
  0: { name: "Autre revenu", color: "#9ca3af" },
  null: { name: "Non catégorisé", color: "#d1d5db" },
};

// Fonction pour obtenir la catégorie d'une transaction
export const getTransactionCategory = (transaction) => {
  const categoryId =
    transaction.metadata?.bridgeCategoryId || transaction.category_id || null;
  const isIncome = transaction.amount > 0;

  const categories = isIncome ? incomeCategories : expenseCategories;

  // Chercher la catégorie exacte par ID Bridge
  if (categoryId && categories[categoryId]) {
    return categories[categoryId];
  }

  // Fallback basé sur la description pour les catégories courantes
  // Nettoyer la description : minuscules, sans accents, sans préfixes CB/VIR/PRLV
  const description = (transaction.description || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^(cb |vir |prlv |cheque |chq |retrait |dab |tip )/i, "")
    .trim();

  if (isIncome) {
    // Salaire et revenus
    if (
      description.includes("salaire") ||
      description.includes("paie") ||
      description.includes("remuneration")
    ) {
      return incomeCategories[100];
    }
    if (description.includes("prime") || description.includes("bonus")) {
      return incomeCategories[101];
    }
    if (
      description.includes("remboursement") ||
      description.includes("rembours")
    ) {
      return incomeCategories[102];
    }
    if (
      description.includes("virement") ||
      description.includes("vir ") ||
      description.includes("vir.")
    ) {
      return incomeCategories[140];
    }
    if (description.includes("caf") || description.includes("allocation")) {
      return incomeCategories[121];
    }
    if (
      description.includes("pole emploi") ||
      description.includes("france travail")
    ) {
      return incomeCategories[122];
    }
    return incomeCategories[0]; // Autre revenu
  } else {
    // Alimentation et courses
    if (
      description.includes("carrefour") ||
      description.includes("leclerc") ||
      description.includes("auchan") ||
      description.includes("lidl") ||
      description.includes("franprix") ||
      description.includes("monoprix") ||
      description.includes("intermarche") ||
      description.includes("casino") ||
      description.includes("super u") ||
      description.includes("picard") ||
      description.includes("biocoop") ||
      description.includes("naturalia")
    ) {
      return expenseCategories[272]; // Courses
    }
    // Restaurants et repas
    if (
      description.includes("restaurant") ||
      description.includes("brasserie") ||
      description.includes("cafe") ||
      description.includes("mcdo") ||
      description.includes("mcdonald") ||
      description.includes("burger") ||
      description.includes("pizza") ||
      description.includes("sushi") ||
      description.includes("kebab") ||
      description.includes("boulangerie") ||
      description.includes("patisserie") ||
      description.includes("traiteur") ||
      description.includes("deliveroo") ||
      description.includes("uber eat") ||
      description.includes("just eat")
    ) {
      return expenseCategories[271]; // Restaurants
    }
    // Transport
    if (
      description.includes("sncf") ||
      description.includes("ratp") ||
      description.includes("uber") ||
      description.includes("taxi") ||
      description.includes("bolt") ||
      description.includes("blablacar") ||
      description.includes("navigo") ||
      description.includes("velib") ||
      description.includes("lime") ||
      description.includes("tier") ||
      description.includes("bird")
    ) {
      return expenseCategories[280]; // Transport
    }
    // Carburant
    if (
      description.includes("total") ||
      description.includes("shell") ||
      description.includes("bp ") ||
      description.includes("esso") ||
      description.includes("avia") ||
      description.includes("carburant") ||
      description.includes("station") ||
      description.includes("essence") ||
      description.includes("gasoil")
    ) {
      return expenseCategories[281]; // Carburant
    }
    // Shopping et High-tech
    if (
      description.includes("amazon") ||
      description.includes("fnac") ||
      description.includes("darty") ||
      description.includes("boulanger") ||
      description.includes("apple") ||
      description.includes("samsung")
    ) {
      return expenseCategories[322]; // High-tech
    }
    if (
      description.includes("zara") ||
      description.includes("h&m") ||
      description.includes("uniqlo") ||
      description.includes("decathlon") ||
      description.includes("kiabi") ||
      description.includes("celio") ||
      description.includes("jules") ||
      description.includes("galeries lafayette")
    ) {
      return expenseCategories[321]; // Vêtements
    }
    // Abonnements et services
    if (
      description.includes("netflix") ||
      description.includes("spotify") ||
      description.includes("disney") ||
      description.includes("prime") ||
      description.includes("canal") ||
      description.includes("deezer") ||
      description.includes("youtube") ||
      description.includes("apple music") ||
      description.includes("hbo")
    ) {
      return expenseCategories[332]; // Abonnements
    }
    if (
      description.includes("orange") ||
      description.includes("sfr") ||
      description.includes("bouygues") ||
      description.includes("free") ||
      description.includes("sosh") ||
      description.includes("red by")
    ) {
      return expenseCategories[331]; // Téléphone/Internet
    }
    // Logement
    if (
      description.includes("loyer") ||
      description.includes("immobilier") ||
      description.includes("foncier") ||
      description.includes("syndic") ||
      description.includes("copropriete")
    ) {
      return expenseCategories[291]; // Loyer
    }
    if (
      description.includes("edf") ||
      description.includes("engie") ||
      description.includes("eau") ||
      description.includes("gaz") ||
      description.includes("electricite") ||
      description.includes("veolia")
    ) {
      return expenseCategories[292]; // Charges
    }
    // Santé
    if (
      description.includes("pharmacie") ||
      description.includes("docteur") ||
      description.includes("medecin") ||
      description.includes("hopital") ||
      description.includes("clinique") ||
      description.includes("dentiste") ||
      description.includes("ophtalmo") ||
      description.includes("kine") ||
      description.includes("mutuelle")
    ) {
      return expenseCategories[310]; // Santé
    }
    // Assurance
    if (
      description.includes("assurance") ||
      description.includes("maif") ||
      description.includes("maaf") ||
      description.includes("axa") ||
      description.includes("allianz") ||
      description.includes("groupama") ||
      description.includes("macif") ||
      description.includes("matmut")
    ) {
      return expenseCategories[293]; // Assurance habitation (ou générale)
    }
    // Banque et frais
    if (
      description.includes("frais") ||
      description.includes("commission") ||
      description.includes("agios") ||
      description.includes("cotisation") ||
      description.includes("carte")
    ) {
      return expenseCategories[333]; // Banque
    }
    // Relevé différé (carte bancaire) - regroupement de plusieurs transactions
    if (
      description.includes("releve differe") ||
      description.includes("releve carte")
    ) {
      return expenseCategories[0]; // Autre (car c'est un regroupement)
    }
    // Loisirs
    if (
      description.includes("cinema") ||
      description.includes("theatre") ||
      description.includes("concert") ||
      description.includes("musee") ||
      description.includes("parc") ||
      description.includes("zoo")
    ) {
      return expenseCategories[301]; // Sorties
    }
    if (
      description.includes("hotel") ||
      description.includes("airbnb") ||
      description.includes("booking") ||
      description.includes("voyage") ||
      description.includes("avion") ||
      description.includes("air france")
    ) {
      return expenseCategories[302]; // Voyages
    }
    if (
      description.includes("sport") ||
      description.includes("fitness") ||
      description.includes("gym") ||
      description.includes("piscine") ||
      description.includes("basic fit") ||
      description.includes("neoness")
    ) {
      return expenseCategories[303]; // Sport
    }

    return expenseCategories[0]; // Autre
  }
};

// Fonction pour agréger les transactions par catégorie
export const aggregateByCategory = (transactions, isIncome = false) => {
  const categoryTotals = {};

  transactions.forEach((transaction) => {
    // Filtrer selon le type (entrée ou sortie)
    if (isIncome && transaction.amount <= 0) return;
    if (!isIncome && transaction.amount >= 0) return;

    const category = getTransactionCategory(transaction);
    const categoryName = category.name;

    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = {
        name: categoryName,
        amount: 0,
        count: 0,
        color: category.color,
      };
    }

    categoryTotals[categoryName].amount += Math.abs(transaction.amount);
    categoryTotals[categoryName].count += 1;
  });

  // Convertir en tableau et trier par montant décroissant
  return Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);
};
