/**
 * Utilitaires pour l'API Gouv Data - Recherche d'entreprises
 */

/**
 * Recherche d'entreprises via l'API Gouv Data
 * Utilise une route API Next.js comme proxy pour éviter les problèmes CORS
 * @param {string} query - Terme de recherche (nom d'entreprise, SIRET, etc.)
 * @param {number} limit - Nombre maximum de résultats (défaut: 10)
 * @returns {Promise<Array>} Liste des entreprises trouvées
 */
export async function searchCompanies(query, limit = 10) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Utiliser notre proxy API Next.js au lieu de l'API directe
    const url = new URL('/api/search-companies', window.location.origin);
    url.searchParams.append('q', query.trim());
    url.searchParams.append('limite', limit.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results?.map(company => ({
      id: company.siren,
      siret: company.siege?.siret || '',
      name: company.nom_complet || company.nom_raison_sociale,
      legalName: company.nom_raison_sociale,
      address: company.siege?.adresse || '',
      postalCode: company.siege?.code_postal || '',
      city: company.siege?.libelle_commune || '',
      activityCode: company.activite_principale,
      activityLabel: '', // Non disponible dans cette API
      status: company.etat_administratif,
      creationDate: company.date_creation,
      employees: company.tranche_effectif_salarie || '',
      vatNumber: '', // Non disponible dans cette API
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
