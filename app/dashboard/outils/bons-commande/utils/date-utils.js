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
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number' || /^\d+$/.test(dateInput)) {
      const timestamp = typeof dateInput === 'string' ? parseInt(dateInput, 10) : dateInput;
      date = new Date(timestamp);
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);

      if (isNaN(date.getTime())) {
        const timestamp = Date.parse(dateInput);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
        }
      }
    } else {
      return "-";
    }

    if (isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString('fr-FR');
  } catch (error) {
    return "-";
  }
}

/**
 * Vérifie si une date est expirée (antérieure à aujourd'hui)
 * @param {string|number|Date} dateInput - La date à vérifier
 * @returns {boolean} true si la date est expirée, false sinon
 */
export function isDateExpired(dateInput) {
  if (!dateInput) return false;

  let date;

  if (dateInput instanceof Date) {
    date = new Date(dateInput);
  } else if (typeof dateInput === 'number' || /^\d+$/.test(dateInput)) {
    date = new Date(parseInt(dateInput, 10));
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
}
