export const _getNow = () => new Date();

/**
 * Generates an invoice prefix based on the current date
 * @param {Date} [date] - Optional date to use (defaults to current date)
 * @returns {string} Formatted invoice prefix (e.g., "F-072025" for July 2025)
 */
export const generateInvoicePrefix = (date = _getNow()) => {
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 0-11 → 01-12
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
  const fullYear = year
    ? year.length === 2
      ? `20${year}`
      : year
    : new Date().getFullYear().toString();

  return {
    month: month.padStart(2, "0"),
    year: fullYear,
  };
};

/**
 * Formats a month and year into a standard invoice prefix
 * @param {string} month - Month as string (1-12 or 01-12)
 * @param {string} year - Year as string (2 or 4 digits)
 * @returns {string} Formatted invoice prefix (e.g., "F-072025")
 */
export const formatInvoicePrefix = (month, year) => {
  const formattedMonth = String(month).padStart(2, "0");
  const formattedYear = year.length === 2 ? `20${year}` : year;
  return `F-${formattedMonth}${formattedYear}`;
};

/**
 * Gets the current month and year as separate values
 * @returns {{month: string, year: string}} Object with current month (01-12) and year (YYYY)
 */
export const getCurrentMonthYear = () => {
  const now = _getNow();
  return {
    month: String(now.getMonth() + 1).padStart(2, "0"),
    year: String(now.getFullYear()),
  };
};

/**
 * Refreshes a date-like portion (YYYYMM / MMYYYY / YYYY-MM / MM-YYYY / YYYY)
 * at the end of a prefix to use the given date (defaults to current date).
 * Returns the prefix unchanged if no recognizable date pattern is found.
 *
 * @param {string} prefix
 * @param {Date} [date]
 * @returns {string}
 */
export const refreshPrefixDate = (prefix, date = _getNow()) => {
  if (!prefix) return prefix;

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());

  const isValidMonth = (m) => {
    const n = parseInt(m, 10);
    return n >= 1 && n <= 12;
  };
  const isValidYear = (y) => {
    const n = parseInt(y, 10);
    return n >= 2000 && n <= 2099;
  };

  // YYYY[sep]MM
  let m = prefix.match(/^(.*?)(\d{4})([-/]?)(\d{2})$/);
  if (m && isValidYear(m[2]) && isValidMonth(m[4])) {
    return `${m[1]}${yyyy}${m[3]}${mm}`;
  }

  // MM[sep]YYYY
  m = prefix.match(/^(.*?)(\d{2})([-/]?)(\d{4})$/);
  if (m && isValidMonth(m[2]) && isValidYear(m[4])) {
    return `${m[1]}${mm}${m[3]}${yyyy}`;
  }

  // Year only at the end
  m = prefix.match(/^(.*?)(\d{4})$/);
  if (m && isValidYear(m[2])) {
    return `${m[1]}${yyyy}`;
  }

  return prefix;
};
