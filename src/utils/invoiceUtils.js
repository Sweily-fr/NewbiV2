/**
 * Generates an invoice prefix based on the current date
 * @param {Date} [date] - Optional date to use (defaults to current date)
 * @returns {string} Formatted invoice prefix (e.g., "F-072025" for July 2025)
 */
export const generateInvoicePrefix = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-11 → 01-12
  const year = date.getFullYear();
  return `F-${month}${year}`;
};

/**
 * Extracts month and year from an invoice prefix
 * @param {string} prefix - The invoice prefix (e.g., "F-072025")
 * @returns {{month: string, year: string} | null} Object with month and year, or null if invalid format
 */
export const parseInvoicePrefix = (prefix) => {
  if (!prefix) return null;
  
  // Match F-MMYYYY or F-MM-YYYY or F-MM/YYYY
  const match = prefix.match(/^F-?(\d{2})[\s-/]?(\d{2,4})?$/);
  
  if (!match) return null;
  
  const [, month, year] = match;
  
  // If year is 2 digits, assume 20XX
  const fullYear = year ? (year.length === 2 ? `20${year}` : year) : new Date().getFullYear().toString();
  
  return {
    month: month.padStart(2, '0'),
    year: fullYear
  };
};

/**
 * Formats a month and year into a standard invoice prefix
 * @param {string} month - Month as string (1-12 or 01-12)
 * @param {string} year - Year as string (2 or 4 digits)
 * @returns {string} Formatted invoice prefix (e.g., "F-072025")
 */
export const formatInvoicePrefix = (month, year) => {
  const formattedMonth = String(month).padStart(2, '0');
  const formattedYear = year.length === 2 ? `20${year}` : year;
  return `F-${formattedMonth}${formattedYear}`;
};

/**
 * Gets the current month and year as separate values
 * @returns {{month: string, year: string}} Object with current month (01-12) and year (YYYY)
 */
export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: String(now.getMonth() + 1).padStart(2, '0'),
    year: String(now.getFullYear())
  };
};
