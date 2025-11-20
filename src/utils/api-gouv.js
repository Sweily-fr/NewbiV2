/**
 * Utilitaires pour l'API Gouv Data - Recherche d'entreprises
 */

// Cache pour éviter les requêtes répétées
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

  const cacheKey = `${query.toLowerCase()}-${limit}`;
  const cachedData = searchCache.get(cacheKey);
  
  // Retourner les données en cache si elles sont encore valides
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    return cachedData.data;
  }

  // Fonction pour traiter les résultats et les mettre en cache
  const processAndCacheResults = (results) => {
    const formattedResults = results.map(company => ({
      id: company.siret || company.siren || Math.random().toString(36).substr(2, 9),
      siret: company.siret || '',
      siren: company.siren || '',
      name: company.nom_raison_sociale || company.nom_complet || 'Entreprise non nommée',
      address: company.siege?.adresse || '',
      postalCode: company.siege?.code_postal || '',
      city: company.siege?.libelle_commune || '',
      activityCode: company.activite_principale || '',
      activityLabel: company.activite_principale || '',
      legalForm: company.forme_juridique || '',
      legalFormCode: company.forme_juridique_code || '',
      vatNumber: company.siren ? `FR${((12 + 3 * (parseInt(company.siren) % 97)) % 97).toString().padStart(2, '0')}${company.siren}` : '',
      isActive: company.etat_administratif === 'A',
      creationDate: company.date_creation || ''
    }));

    // Mise en cache des résultats
    searchCache.set(cacheKey, {
      data: formattedResults,
      timestamp: Date.now()
    });

    return formattedResults;
  };

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
    
    if (data && typeof data === 'object' && Array.isArray(data.results)) {
      return processAndCacheResults(data.results);
    } else {
      throw new Error('Format de réponse inattendu de l\'API');
    }
  } catch (error) {
    console.error('Erreur lors de la recherche directe, tentative avec le fallback:', error);
    
    // En cas d'échec, essayer avec la méthode de secours
    try {
      const fallbackResults = await searchCompaniesFallback(query, limit);
      if (fallbackResults && fallbackResults.length > 0) {
        // Mise en cache des résultats du fallback
        searchCache.set(cacheKey, {
          data: fallbackResults,
          timestamp: Date.now()
        });
        return fallbackResults;
      }
    } catch (fallbackError) {
      console.error('Erreur lors de l\'utilisation du fallback:', fallbackError);
    }
    
    return [];
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
 * Méthode de secours pour la recherche d'entreprises en cas d'échec CORS
 * Utilise une requête proxy via votre propre backend
 */
async function searchCompaniesFallback(query, limit = 10) {
  try {
    // Utilisez votre propre endpoint backend comme proxy
    const response = await fetch('/api/search-companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur du serveur: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
    
  } catch (fallbackError) {
    console.error('Erreur lors de la recherche de secours:', fallbackError);
    throw new Error('Service temporairement indisponible. Veuillez réessayer plus tard.');
  }
}

/**
 * Convertit une entreprise de l'API Gouv en format client
 * @param {Object} company - Entreprise de l'API Gouv
 * @returns {Object} Client formaté
 */
export function convertCompanyToClient(company) {
  const address = parseAddress(company.address, company.postalCode, company.city);
  
  // Utiliser le SIRET s'il existe, sinon utiliser le SIREN, sinon l'id
  const siret = company.siret || company.siren || company.id || '';
  
  return {
    type: 'COMPANY',
    name: company.name,
    firstName: '',
    lastName: '',
    email: '', // À remplir manuellement
    phone: '', // À remplir manuellement
    siret: siret,
    vatNumber: company.vatNumber || '',
    address: address,
    shippingAddress: address, // Par défaut, même adresse
    hasDifferentShippingAddress: false,
    notes: `Entreprise trouvée via API Gouv Data\nActivité: ${company.activityLabel || 'Non renseignée'}\nEffectifs: ${company.employees || 'Non renseigné'}`,
    // Données supplémentaires pour référence
    _apiGouv: {
      siren: company.siren || company.id,
      activityCode: company.activityCode,
      status: company.status,
      creationDate: company.creationDate
    }
  };
}
