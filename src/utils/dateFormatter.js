/**
 * Utilitaires pour formater les dates en français
 */

/**
 * Formate une date en format français court (jj/mm/aaaa)
 * @param {string|number|Date} dateValue - La date à formater
 * @returns {string} - Date formatée en français (ex: 15/01/2024)
 */
export const formatDateToFrench = (dateValue) => {
  if (!dateValue) return "";
  
  let date;
  
  // Si c'est un timestamp
  if (typeof dateValue === "number" || (typeof dateValue === "string" && /^\d{10,13}$/.test(dateValue))) {
    date = new Date(Number(dateValue));
  }
  // Si c'est une string au format YYYY-MM-DD
  else if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    date = new Date(dateValue + "T12:00:00.000Z");
  }
  // Si c'est déjà un objet Date
  else if (dateValue instanceof Date) {
    date = dateValue;
  }
  // Autres cas
  else {
    date = new Date(dateValue);
  }
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return dateValue; // Retourner la valeur originale si invalide
  }
  
  // Formater en français : jj/mm/aaaa
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formate une date en format français long (jj mois aaaa)
 * @param {string|number|Date} dateValue - La date à formater
 * @returns {string} - Date formatée en français (ex: 15 janvier 2024)
 */
export const formatDateToFrenchLong = (dateValue) => {
  if (!dateValue) return "Date non disponible";
  
  let date;
  
  // Gérer différents types d'entrée
  if (typeof dateValue === 'string') {
    // Cas spécial pour les chaînes vides ou "Invalid Date"
    if (dateValue === '' || dateValue === 'Invalid Date') {
      return "Date non disponible";
    }
    
    // Si c'est une date au format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      date = new Date(dateValue + 'T12:00:00.000Z');
    } 
    // Si c'est un timestamp en string
    else if (/^\d{10,13}$/.test(dateValue)) {
      date = new Date(parseInt(dateValue));
    }
    // Autres formats de string
    else {
      date = new Date(dateValue);
    }
  } 
  // Si c'est un nombre (timestamp)
  else if (typeof dateValue === 'number') {
    date = new Date(dateValue);
  }
  // Si c'est déjà un objet Date
  else if (dateValue instanceof Date) {
    date = dateValue;
  }
  // Autres cas
  else {
    return "Format de date non supporté";
  }
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return "Date invalide";
  }
  
  // Formater en français long : jj mois aaaa
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Formate une date avec heure en format français
 * @param {string|number|Date} dateValue - La date à formater
 * @returns {string} - Date et heure formatées en français (ex: 15/01/2024 14:30)
 */
export const formatDateTimeToFrench = (dateValue) => {
  if (!dateValue) return "Date non disponible";
  
  let date;
  
  if (typeof dateValue === 'string') {
    if (dateValue === '' || dateValue === 'Invalid Date') {
      return "Date non disponible";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      date = new Date(dateValue + 'T12:00:00.000Z');
    } else if (/^\d{10,13}$/.test(dateValue)) {
      date = new Date(parseInt(dateValue));
    } else {
      date = new Date(dateValue);
    }
  } else if (typeof dateValue === 'number') {
    date = new Date(dateValue);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return "Format de date non supporté";
  }
  
  if (isNaN(date.getTime())) {
    return "Date invalide";
  }
  
  const dateStr = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  return `${dateStr} ${timeStr}`;
};
