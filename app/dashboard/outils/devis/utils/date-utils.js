/**
 * Formate une date en tenant compte de différents formats d'entrée
 * @param {string|number|Date} dateInput - La date à formater (peut être un timestamp, une chaîne ISO, etc.)
 * @returns {string} La date formatée au format français (JJ/MM/AAAA) ou "-" si la date est invalide
 */
export function formatDate(dateInput) {
  // Si l'entrée est vide ou nulle, retourner un tiret
  if (!dateInput && dateInput !== 0) return "-";
  
  let date;
  
  try {
    // Gérer les différents formats de date d'entrée
    if (dateInput instanceof Date) {
      // Déjà un objet Date
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number' || /^\d+$/.test(dateInput)) {
      // Timestamp numérique (en millisecondes)
      const timestamp = typeof dateInput === 'string' ? parseInt(dateInput, 10) : dateInput;
      date = new Date(timestamp);
    } else if (typeof dateInput === 'string') {
      // Chaîne de date (ISO ou autre format)
      // Essayer de parser la date directement
      date = new Date(dateInput);
      
      // Si le parsing échoue, essayer d'extraire un timestamp
      if (isNaN(date.getTime())) {
        const timestamp = Date.parse(dateInput);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
        }
      }
    } else {
      // Autre type non pris en charge
      console.warn('Format de date non supporté:', dateInput);
      return "-";
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn('Date invalide dans formatDate:', dateInput);
      return "-";
    }
    
    // Formater la date en français
    return date.toLocaleDateString('fr-FR');
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error, 'Valeur:', dateInput);
    return "-";
  }
}

/**
 * Vérifie si une date est expirée (antérieure à aujourd'hui)
 * @param {string|number|Date} dateInput - La date à vérifier (peut être un timestamp, une chaîne, un objet Date)
 * @returns {boolean} true si la date est expirée, false sinon
 */
export function isDateExpired(dateInput) {
  if (!dateInput) return false;
  
  let date;
  
  // Gérer les différents formats de date d'entrée
  if (dateInput instanceof Date) {
    // Déjà un objet Date
    date = new Date(dateInput);
  } else if (typeof dateInput === 'number' || /^\d+$/.test(dateInput)) {
    // Timestamp numérique (en millisecondes)
    date = new Date(parseInt(dateInput, 10));
  } else {
    // Chaîne de date ISO ou autre format
    date = new Date(dateInput);
  }
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    console.warn('Date invalide dans isDateExpired:', dateInput);
    return false;
  }
  
  // Créer une date de référence pour aujourd'hui à minuit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Comparer les dates (sans l'heure)
  date.setHours(0, 0, 0, 0);
  
  return date < today;
}
