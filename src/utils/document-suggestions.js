/**
 * Suggestions pour les champs de texte des documents (devis et factures)
 */

export const documentSuggestions = {
  headerNotes: [
    {
      label: "Remerciement standard",
      value: "Merci de votre confiance. Nous restons à votre disposition pour toute question."
    },
    {
      label: "Délai de validité",
      value: "Cette offre est valable 30 jours à compter de la date d'émission."
    },
    {
      label: "Accompagnement personnalisé",
      value: "Nous vous accompagnons tout au long de votre projet pour garantir votre satisfaction."
    },
    {
      label: "Disponibilité",
      value: "Notre équipe reste à votre entière disposition pour tout renseignement complémentaire."
    }
  ],
  
  footerNotes: [
    {
      label: "Conditions de paiement standard",
      value: "Paiement à réception de facture par virement bancaire.\nEn cas de retard de paiement, des pénalités de 3 fois le taux d'intérêt légal seront appliquées, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement."
    },
    {
      label: "Conditions de paiement échelonné",
      value: "Paiement en 3 fois :\n- 30% à la commande\n- 40% à mi-parcours\n- 30% à la livraison\n\nEn cas de retard de paiement, des pénalités de 3 fois le taux d'intérêt légal seront appliquées."
    },
    {
      label: "Acompte requis",
      value: "Un acompte de 30% est requis à la signature du devis. Le solde sera dû à la livraison.\nEn cas de retard de paiement, des pénalités de 3 fois le taux d'intérêt légal seront appliquées, ainsi qu'une indemnité forfaitaire de 40€."
    },
    {
      label: "Paiement comptant",
      value: "Paiement comptant à la livraison par virement bancaire ou chèque.\nEn cas de retard de paiement, des pénalités de 3 fois le taux d'intérêt légal seront appliquées."
    }
  ],
  
  termsAndConditions: [
    {
      label: "CGV B2B standard",
      value: "CONDITIONS GÉNÉRALES DE VENTE\n\n1. OBJET\nLes présentes conditions générales régissent les ventes de prestations de services entre professionnels.\n\n2. PRIX\nLes prix sont indiqués en euros HT. Ils sont fermes et définitifs.\n\n3. PAIEMENT\nLe paiement est exigible à réception de facture. Tout retard de paiement entraînera l'application de pénalités de retard au taux de 3 fois le taux d'intérêt légal, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement.\n\n4. LIVRAISON\nLes délais de livraison sont donnés à titre indicatif. Tout retard ne peut donner lieu à annulation de commande ou pénalités.\n\n5. GARANTIE\nNos prestations sont garanties conformes aux spécifications convenues. Toute réclamation doit être formulée par écrit dans les 8 jours suivant la livraison.\n\n6. PROPRIÉTÉ INTELLECTUELLE\nTous les droits de propriété intellectuelle restent notre propriété exclusive jusqu'au paiement intégral.\n\n7. LITIGES\nTout litige relève de la compétence exclusive des tribunaux du siège social de notre société."
    },
    {
      label: "CGV prestations de services",
      value: "CONDITIONS GÉNÉRALES DE PRESTATION DE SERVICES\n\n1. PRESTATIONS\nLes prestations sont réalisées conformément au cahier des charges convenu. Toute modification fera l'objet d'un avenant.\n\n2. OBLIGATIONS DU CLIENT\nLe client s'engage à fournir tous les éléments nécessaires à la bonne exécution de la prestation dans les délais convenus.\n\n3. DÉLAIS\nLes délais d'exécution sont donnés à titre indicatif et courent à compter de la réception de l'ensemble des éléments nécessaires.\n\n4. ACCEPTATION\nLe client dispose d'un délai de 15 jours pour formuler ses observations. Passé ce délai, la prestation est réputée acceptée.\n\n5. CONFIDENTIALITÉ\nChaque partie s'engage à préserver la confidentialité des informations échangées dans le cadre de la prestation.\n\n6. RESPONSABILITÉ\nNotre responsabilité est limitée au montant de la prestation. Nous ne pourrons être tenus responsables des dommages indirects.\n\n7. RÉSILIATION\nEn cas de manquement grave de l'une des parties, le contrat pourra être résilié de plein droit après mise en demeure restée sans effet pendant 15 jours."
    },
    {
      label: "CGV simplifiées",
      value: "CONDITIONS GÉNÉRALES\n\n• Paiement : à réception de facture par virement bancaire\n• Retard de paiement : pénalités au taux de 3 fois le taux d'intérêt légal + indemnité forfaitaire de 40€\n• Livraison : selon les délais convenus au devis\n• Garantie : conformité aux spécifications, réclamation sous 8 jours\n• Annulation : possible jusqu'à 48h avant la date prévue, au-delà 50% du montant sera dû\n• Litiges : tribunaux du siège social de notre société"
    }
  ]
};

/**
 * Génère le footer dynamique basé sur les informations de l'entreprise
 * @param {Object} companyInfo - Informations de l'entreprise (peut venir de organization ou de companyInfo)
 * @param {string} variant - Type de footer ('standard', 'micro', 'autoliquidation', 'btp', 'b2c')
 * @returns {string} - Footer formaté
 */
export const generateDynamicFooter = (companyInfo, variant = 'standard') => {
  if (!companyInfo) return '';

  // Support pour les deux formats : organization (Better Auth) et companyInfo (ancien format)
  const {
    // Format organization (Better Auth)
    companyName,
    // Format ancien
    name = companyName || '',
    legalForm = '',
    capitalSocial = '',
    siret = '',
    rcs = '',
    addressStreet = '',
    addressCity = '',
    addressZipCode = '',
    vatNumber = '',
    fiscalRegime = '',
    // Support pour l'adresse en format objet ou string
    address,
  } = companyInfo;

  // Extraire le SIREN des 9 premiers caractères du SIRET
  const siren = siret ? siret.substring(0, 9) : '';
  
  // Gérer l'adresse qui peut être un objet ou une string
  let street = addressStreet;
  let city = addressCity;
  let zipCode = addressZipCode;
  
  if (address && typeof address === 'object') {
    street = address.street || addressStreet;
    city = address.city || addressCity;
    zipCode = address.postalCode || address.zipCode || addressZipCode;
  } else if (address && typeof address === 'string') {
    // Si l'adresse est une string, on l'utilise telle quelle
    const adresseComplete = address;
    const villeRCS = rcs ? rcs.replace(/RCS\s*/i, '').trim() : city;
    
    // Déterminer si c'est une micro-entreprise
    const isMicroEntreprise = fiscalRegime?.toLowerCase().includes('micro') || 
                              fiscalRegime?.toLowerCase().includes('franchise');

    // Utiliser directement l'adresse string dans les variantes
    switch (variant) {
      case 'standard-compact':
        return `${name}${legalForm ? ` • ${legalForm}` : ''}${capitalSocial ? ` au capital de ${capitalSocial}` : ''}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • Siège: ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''}`;

      case 'standard-lisible':
        // Construire la partie forme juridique + capital
        let legalInfo = '';
        if (legalForm && capitalSocial) {
          legalInfo = ` • ${legalForm} au capital de ${capitalSocial}`;
        } else if (legalForm) {
          legalInfo = ` • ${legalForm}`;
        } else if (capitalSocial) {
          legalInfo = ` • Capital: ${capitalSocial}`;
        }
        return `${name}${legalInfo}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • Siège: ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''}`;

      case 'micro-compact':
        return `${name}${legalForm === 'EI' ? ' • EI' : ''}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • ${adresseComplete}` : ''} • TVA non applicable, art. 293 B du CGI`;

      case 'micro-lisible':
        return `${name}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • ${adresseComplete}` : ''}\nTVA non applicable, art. 293 B du CGI`;

      case 'autoliquidation-compact':
        return `${name}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''} • Autoliquidation TVA, art. 283-2 CGI: TVA due par le client`;

      case 'btp':
        return `${name}${legalForm ? ` • ${legalForm}` : ''}${capitalSocial ? ` au capital de ${capitalSocial}` : ''}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''}\nAssurance RC décennale: [Nom assureur], police [N°], couverture: [Zone]`;

      case 'b2c':
        return `${name}${legalForm ? ` • ${legalForm}` : ''}${capitalSocial ? ` au capital de ${capitalSocial}` : ''}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''}\nMédiation à la consommation: [Nom du médiateur] • [Site/contact]`;

      default:
        if (isMicroEntreprise) {
          return generateDynamicFooter(companyInfo, 'micro-lisible');
        }
        return generateDynamicFooter(companyInfo, 'standard-lisible');
    }
  }
  
  // Ville RCS (extraite de l'adresse ou du RCS)
  const villeRCS = rcs ? rcs.replace(/RCS\s*/i, '').trim() : city;
  
  // Adresse complète à partir des champs séparés
  const adresseComplete = [street, zipCode, city]
    .filter(Boolean)
    .join(', ');

  // Déterminer si c'est une micro-entreprise
  const isMicroEntreprise = fiscalRegime?.toLowerCase().includes('micro') || 
                            fiscalRegime?.toLowerCase().includes('franchise');

  switch (variant) {
    case 'standard-compact':
      return `${name}${legalForm ? ` • ${legalForm}` : ''}${capitalSocial ? ` au capital de ${capitalSocial}` : ''}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • Siège: ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''}`;

    case 'standard-lisible':
      // Construire la partie forme juridique + capital
      let legalInfoMain = '';
      if (legalForm && capitalSocial) {
        legalInfoMain = ` • ${legalForm} au capital de ${capitalSocial}`;
      } else if (legalForm) {
        legalInfoMain = ` • ${legalForm}`;
      } else if (capitalSocial) {
        legalInfoMain = ` • Capital: ${capitalSocial}`;
      }
      return `${name}${legalInfoMain}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • Siège: ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''}`;

    case 'micro-compact':
      return `${name}${legalForm === 'EI' ? ' • EI' : ''}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • ${adresseComplete}` : ''} • TVA non applicable, art. 293 B du CGI`;

    case 'micro-lisible':
      // Construire la partie forme juridique + capital pour micro-entreprises
      let microLegalInfo = '';
      if (legalForm && capitalSocial) {
        microLegalInfo = ` • ${legalForm} au capital de ${capitalSocial}€`;
      } else if (legalForm) {
        microLegalInfo = ` • ${legalForm}`;
      } else if (capitalSocial) {
        microLegalInfo = ` • Capital: ${capitalSocial}€`;
      }
      return `${name}${microLegalInfo}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''}`;

    case 'autoliquidation-compact':
      return `${name}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''} • Autoliquidation TVA, art. 283-2 CGI: TVA due par le client`;

    case 'btp':
      // Ajout pour le BTP (à compléter avec les vraies données d'assurance)
      return `${name}${legalForm ? ` • ${legalForm}` : ''}${capitalSocial ? ` au capital de ${capitalSocial}` : ''}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''}\nAssurance RC décennale: [Nom assureur], police [N°], couverture: [Zone]`;

    case 'b2c':
      // Ajout pour B2C avec médiation
      return `${name}${legalForm ? ` • ${legalForm}` : ''}${capitalSocial ? ` au capital de ${capitalSocial}` : ''}${siren ? ` • SIREN ${siren}` : ''}${villeRCS ? ` • RCS ${villeRCS}` : ''}${adresseComplete ? ` • ${adresseComplete}` : ''}${vatNumber ? ` • TVA intracom: ${vatNumber}` : ''}\nMédiation à la consommation: [Nom du médiateur] • [Site/contact]`;

    default:
      // Auto-détection basée sur le régime fiscal
      if (isMicroEntreprise) {
        return generateDynamicFooter(companyInfo, 'micro-lisible');
      }
      return generateDynamicFooter(companyInfo, 'standard-lisible');
  }
};

/**
 * Obtient les variantes de footer disponibles
 * @returns {Array} - Liste des variantes avec label et value
 */
export const getFooterVariants = () => [
  { label: "Standard - Compact (mentions légales)", value: "standard-compact" },
  { label: "Standard - Lisible (mentions légales)", value: "standard-lisible" },
  { label: "Micro-entreprise - Compact", value: "micro-compact" },
  { label: "Micro-entreprise - Lisible", value: "micro-lisible" },
  { label: "Autoliquidation TVA", value: "autoliquidation-compact" },
  { label: "BTP avec assurance décennale", value: "btp" },
  { label: "B2C avec médiation consommateur", value: "b2c" },
];
