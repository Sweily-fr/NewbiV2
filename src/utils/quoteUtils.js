/**
 * Generates a quote prefix based on the current date
 * @param {Date} [date] - Optional date to use (defaults to current date)
 * @returns {string} Formatted quote prefix (e.g., "D-022025" for February 2025)
 */
export const generateQuotePrefix = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-11 → 01-12
  const year = date.getFullYear();
  return `D-${month}${year}`;
};

/**
 * Extracts month and year from a quote prefix
 * @param {string} prefix - The quote prefix (e.g., "D-022025")
 * @returns {{month: string, year: string} | null} Object with month and year, or null if invalid format
 */
export const parseQuotePrefix = (prefix) => {
  if (!prefix) return null;
  
  // Match D-MMYYYY or D-MM-YYYY or D-MM/YYYY
  const match = prefix.match(/^D-?(\d{2})[\s-/]?(\d{2,4})?$/);
  
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
 * Formats a month and year into a standard quote prefix
 * @param {string} month - Month as string (1-12 or 01-12)
 * @param {string} year - Year as string (2 or 4 digits)
 * @returns {string} Formatted quote prefix (e.g., "D-022025")
 */
export const formatQuotePrefix = (month, year) => {
  const formattedMonth = String(month).padStart(2, '0');
  const formattedYear = year.length === 2 ? `20${year}` : year;
  return `D-${formattedMonth}${formattedYear}`;
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

/**
 * Validates a quote number format
 * @param {string} number - The quote number to validate
 * @returns {boolean} True if the number is valid
 */
export const validateQuoteNumber = (number) => {
  if (!number) return false;
  // Must be 1-6 digits
  return /^\d{1,6}$/.test(number);
};

/**
 * Formats a quote number with leading zeros
 * @param {string|number} number - The number to format
 * @param {number} [length=6] - The desired length with leading zeros
 * @returns {string} Formatted number with leading zeros
 */
export const formatQuoteNumber = (number, length = 6) => {
  if (!number) return '';
  return String(number).padStart(length, '0');
};

/**
 * Generates a display string for quote prefix and number
 * @param {string} prefix - The quote prefix (e.g., "D-022025")
 * @param {string} number - The quote number (e.g., "000001")
 * @returns {string} Display string (e.g., "D-022025-000001")
 */
export const getQuoteDisplayNumber = (prefix, number) => {
  if (!prefix || !number) return '';
  return `${prefix}-${number}`;
};

/**
 * Extracts information from a complete quote number
 * @param {string} fullNumber - Complete quote number (e.g., "D-022025-000001")
 * @returns {{prefix: string, number: string, month: string, year: string} | null}
 */
export const parseFullQuoteNumber = (fullNumber) => {
  if (!fullNumber) return null;

  const match = fullNumber.match(/^(D-\d{6})-(\d{6})$/);
  if (!match) return null;

  const [, prefix, number] = match;
  const prefixParts = parseQuotePrefix(prefix);

  if (!prefixParts) return null;

  return {
    prefix,
    number,
    month: prefixParts.month,
    year: prefixParts.year
  };
};

// ============================================
// Purchase Order (Bon de commande) Utilities
// ============================================

/**
 * Generates a purchase order prefix based on the current date
 * @param {Date} [date] - Optional date to use (defaults to current date)
 * @returns {string} Formatted purchase order prefix (e.g., "BD-022025" for February 2025)
 */
export const generatePurchaseOrderPrefix = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `BD-${month}${year}`;
};

/**
 * Extracts month and year from a purchase order prefix
 * @param {string} prefix - The purchase order prefix (e.g., "BD-022025")
 * @returns {{month: string, year: string} | null} Object with month and year, or null if invalid format
 */
export const parsePurchaseOrderPrefix = (prefix) => {
  if (!prefix) return null;

  // Match BD-MMYYYY or BD-MM-YYYY or BD-MM/YYYY
  const match = prefix.match(/^BD-?(\d{2})[\s-/]?(\d{2,4})?$/);

  if (!match) return null;

  const [, month, year] = match;

  const fullYear = year ? (year.length === 2 ? `20${year}` : year) : new Date().getFullYear().toString();

  return {
    month: month.padStart(2, '0'),
    year: fullYear
  };
};

/**
 * Formats a month and year into a standard purchase order prefix
 * @param {string} month - Month as string (1-12 or 01-12)
 * @param {string} year - Year as string (2 or 4 digits)
 * @returns {string} Formatted purchase order prefix (e.g., "BD-022025")
 */
export const formatPurchaseOrderPrefix = (month, year) => {
  const formattedMonth = String(month).padStart(2, '0');
  const formattedYear = year.length === 2 ? `20${year}` : year;
  return `BD-${formattedMonth}${formattedYear}`;
};
