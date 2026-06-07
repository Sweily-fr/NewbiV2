/**
 * Liste des codes ISO-3166-1 alpha-2 + helpers pour afficher les drapeaux
 * et les noms localisés en français.
 *
 * Les noms sont calculés à la volée via `Intl.DisplayNames` (supporté Node
 * 16+ et tous les navigateurs modernes), ce qui évite de maintenir une
 * table de traductions.
 *
 * Le drapeau emoji est dérivé du code à 2 lettres en utilisant les
 * "Regional Indicator Symbols" Unicode : chaque lettre A-Z est mappée sur
 * le caractère codepoint 0x1F1E6-0x1F1FF.
 */

const COUNTRY_CODES = [
  "AF",
  "AL",
  "DZ",
  "AS",
  "AD",
  "AO",
  "AI",
  "AQ",
  "AG",
  "AR",
  "AM",
  "AW",
  "AU",
  "AT",
  "AZ",
  "BS",
  "BH",
  "BD",
  "BB",
  "BY",
  "BE",
  "BZ",
  "BJ",
  "BM",
  "BT",
  "BO",
  "BA",
  "BW",
  "BR",
  "IO",
  "BN",
  "BG",
  "BF",
  "BI",
  "CV",
  "KH",
  "CM",
  "CA",
  "KY",
  "CF",
  "TD",
  "CL",
  "CN",
  "CX",
  "CC",
  "CO",
  "KM",
  "CG",
  "CD",
  "CK",
  "CR",
  "CI",
  "HR",
  "CU",
  "CY",
  "CZ",
  "DK",
  "DJ",
  "DM",
  "DO",
  "EC",
  "EG",
  "SV",
  "GQ",
  "ER",
  "EE",
  "SZ",
  "ET",
  "FK",
  "FO",
  "FJ",
  "FI",
  "FR",
  "GF",
  "PF",
  "GA",
  "GM",
  "GE",
  "DE",
  "GH",
  "GI",
  "GR",
  "GL",
  "GD",
  "GP",
  "GU",
  "GT",
  "GG",
  "GN",
  "GW",
  "GY",
  "HT",
  "VA",
  "HN",
  "HK",
  "HU",
  "IS",
  "IN",
  "ID",
  "IR",
  "IQ",
  "IE",
  "IM",
  "IL",
  "IT",
  "JM",
  "JP",
  "JE",
  "JO",
  "KZ",
  "KE",
  "KI",
  "KP",
  "KR",
  "KW",
  "KG",
  "LA",
  "LV",
  "LB",
  "LS",
  "LR",
  "LY",
  "LI",
  "LT",
  "LU",
  "MO",
  "MG",
  "MW",
  "MY",
  "MV",
  "ML",
  "MT",
  "MH",
  "MQ",
  "MR",
  "MU",
  "YT",
  "MX",
  "FM",
  "MD",
  "MC",
  "MN",
  "ME",
  "MS",
  "MA",
  "MZ",
  "MM",
  "NA",
  "NR",
  "NP",
  "NL",
  "NC",
  "NZ",
  "NI",
  "NE",
  "NG",
  "NU",
  "NF",
  "MK",
  "MP",
  "NO",
  "OM",
  "PK",
  "PW",
  "PS",
  "PA",
  "PG",
  "PY",
  "PE",
  "PH",
  "PN",
  "PL",
  "PT",
  "PR",
  "QA",
  "RE",
  "RO",
  "RU",
  "RW",
  "BL",
  "SH",
  "KN",
  "LC",
  "MF",
  "PM",
  "VC",
  "WS",
  "SM",
  "ST",
  "SA",
  "SN",
  "RS",
  "SC",
  "SL",
  "SG",
  "SX",
  "SK",
  "SI",
  "SB",
  "SO",
  "ZA",
  "GS",
  "SS",
  "ES",
  "LK",
  "SD",
  "SR",
  "SJ",
  "SE",
  "CH",
  "SY",
  "TW",
  "TJ",
  "TZ",
  "TH",
  "TL",
  "TG",
  "TK",
  "TO",
  "TT",
  "TN",
  "TR",
  "TM",
  "TC",
  "TV",
  "UG",
  "UA",
  "AE",
  "GB",
  "US",
  "UY",
  "UZ",
  "VU",
  "VE",
  "VN",
  "VG",
  "VI",
  "WF",
  "EH",
  "YE",
  "ZM",
  "ZW",
];

/**
 * Convertit un code ISO 2 lettres en drapeau emoji.
 * Ex: "FR" → "🇫🇷"
 */
export function codeToFlag(code) {
  if (!code || code.length !== 2) return "";
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// `Intl.DisplayNames` est mémoïsé pour éviter de recréer l'instance.
let _displayNamesFr = null;
function getDisplayNames() {
  if (_displayNamesFr) return _displayNamesFr;
  try {
    _displayNamesFr = new Intl.DisplayNames(["fr"], { type: "region" });
  } catch {
    _displayNamesFr = null;
  }
  return _displayNamesFr;
}

/**
 * Retourne le nom français d'un pays à partir de son code ISO.
 * Ex: "FR" → "France"
 */
export function getCountryName(code) {
  const dn = getDisplayNames();
  if (!dn) return code;
  try {
    return dn.of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

/**
 * Liste complète, triée par nom français.
 * Format : { code: "FR", name: "France", flag: "🇫🇷" }
 */
export const COUNTRIES = COUNTRY_CODES.map((code) => ({
  code,
  name: getCountryName(code),
  flag: codeToFlag(code),
})).sort((a, b) => a.name.localeCompare(b.name, "fr"));

/**
 * Retourne l'entrée pays correspondant à un code OU à un nom (recherche
 * insensible à la casse). Utile pour la migration depuis un champ texte
 * libre vers le select : on accepte aussi bien "France" que "FR".
 */
export function findCountry(input) {
  if (!input) return null;
  const v = String(input).trim().toLowerCase();
  if (!v) return null;
  return (
    COUNTRIES.find((c) => c.code.toLowerCase() === v) ||
    COUNTRIES.find((c) => c.name.toLowerCase() === v) ||
    null
  );
}
