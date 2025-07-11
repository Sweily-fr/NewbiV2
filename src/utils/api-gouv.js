/**
 * Utilitaires pour l'API Gouv Data - Recherche d'entreprises
 */

const API_GOUV_BASE_URL = 'https://recherche-entreprises.api.gouv.fr/search';

/**
 * Recherche d'entreprises via l'API Gouv Data
 * @param {string} query - Terme de recherche (nom d'entreprise, SIRET, etc.)
 * @param {number} limit - Nombre maximum de résultats (défaut: 10)
 * @returns {Promise<Array>} Liste des entreprises trouvées
 */
export async function searchCompanies(query, limit = 10) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const url = new URL(API_GOUV_BASE_URL);
    url.searchParams.append('q', query.trim());
    url.searchParams.append('limite', limit.toString());
    url.searchParams.append('activite_principale', 'true');
    url.searchParams.append('adresse', 'true');
    url.searchParams.append('dirigeants', 'true');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results?.map(company => ({
      id: company.siren,
      siret: company.siret,
      name: company.nom_complet || company.nom_raison_sociale,
      legalName: company.nom_raison_sociale,
      address: company.siege?.adresse || '',
      postalCode: company.siege?.code_postal || '',
      city: company.siege?.libelle_commune || '',
      activityCode: company.activite_principale,
      activityLabel: company.libelle_activite_principale,
      status: company.etat_administratif,
      creationDate: company.date_creation,
      employees: company.tranche_effectif_salarie?.intitule,
      vatNumber: company.numero_tva_intra,
      // Données brutes pour debug
      raw: company
    })) || [];
  } catch (error) {
    console.error('Erreur lors de la recherche d\'entreprises:', error);
    throw new Error('Impossible de rechercher les entreprises. Veuillez réessayer.');
  }
}

/**
 * Parse une adresse complète en composants séparés
 * @param {string} fullAddress - Adresse complète de l'API
 * @param {string} postalCode - Code postal
 * @param {string} city - Ville
 * @returns {Object} Adresse parsée
 */
export function parseAddress(fullAddress, postalCode = '', city = '') {
  if (!fullAddress) {
    return {
      street: '',
      postalCode: postalCode || '',
      city: city || '',
      country: 'France'
    };
  }

  // Nettoyer l'adresse
  let cleanAddress = fullAddress.trim();
  
  // Si le code postal et la ville sont fournis séparément, les retirer de l'adresse
  if (postalCode && city) {
    // Retirer le code postal et la ville de la fin de l'adresse
    const postalCityPattern = new RegExp(`\\s*${postalCode}\\s*${city}\\s*$`, 'i');
    cleanAddress = cleanAddress.replace(postalCityPattern, '').trim();
  } else {
    // Essayer d'extraire le code postal et la ville de l'adresse
    // Format typique: "123 Rue de la Paix 75001 Paris"
    const addressMatch = cleanAddress.match(/^(.+?)\s+(\d{5})\s+(.+)$/);
    if (addressMatch) {
      cleanAddress = addressMatch[1].trim();
      postalCode = addressMatch[2];
      city = addressMatch[3].trim();
    }
  }

  return {
    street: cleanAddress,
    postalCode: postalCode || '',
    city: city || '',
    country: 'France'
  };
}

/**
 * Convertit une entreprise de l'API Gouv en format client
 * @param {Object} company - Entreprise de l'API Gouv
 * @returns {Object} Client formaté
 */
export function convertCompanyToClient(company) {
  const address = parseAddress(company.address, company.postalCode, company.city);
  
  return {
    type: 'COMPANY',
    name: company.name,
    firstName: '',
    lastName: '',
    email: '', // À remplir manuellement
    phone: '', // À remplir manuellement
    siret: company.siret,
    vatNumber: company.vatNumber || '',
    address: address,
    shippingAddress: address, // Par défaut, même adresse
    hasDifferentShippingAddress: false,
    notes: `Entreprise trouvée via API Gouv Data\nActivité: ${company.activityLabel || 'Non renseignée'}\nEffectifs: ${company.employees || 'Non renseigné'}`,
    // Données supplémentaires pour référence
    _apiGouv: {
      siren: company.id,
      activityCode: company.activityCode,
      status: company.status,
      creationDate: company.creationDate
    }
  };
}
