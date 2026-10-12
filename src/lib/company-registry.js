/**
 * Conversion d'une entreprise trouvée par /api/search-companies (registre
 * recherche-entreprises.api.gouv.fr) en champs des paramètres de l'espace.
 */

// Champs masqués des entreprises non diffusibles : l'API renvoie cette
// chaîne littérale au lieu de null.
const NON_DIFFUSIBLE = "[NON-DIFFUSIBLE]";

const diffusible = (value) =>
  value && value !== NON_DIFFUSIBLE ? String(value) : "";

/**
 * Catégorie juridique INSEE (4 chiffres) → valeur de la liste « Forme
 * juridique » des paramètres. Chaîne vide quand aucune valeur de la liste ne
 * correspond : la forme juridique déjà choisie est alors conservée.
 *
 * Une micro-entreprise a le même code qu'une entreprise individuelle (1000),
 * d'où « EI ».
 */
export function legalFormFromNatureJuridique(code) {
  const c = String(code || "");
  if (!/^\d{4}$/.test(c)) return "";
  const n = Number(c);

  if (c === "1000") return "EI";
  if (c.startsWith("21")) return "Indivision";
  if (c.startsWith("52")) return "SNC";
  if (c === "5385") return "SELCA";
  if (c === "5308" || c === "5309") return "SCA";
  if (c.startsWith("53")) return "SCS";
  if (c === "5485") return "SELARL";
  if (c === "5498") return "EURL";
  if (c.startsWith("54")) return "SARL";
  if (c === "5585" || c === "5685") return "SELAFA";
  if (c.startsWith("55") || c.startsWith("56")) return "SA";
  if (c === "5720") return "SASU";
  if (c === "5785") return "SELAS";
  if (c.startsWith("57")) return "SAS";
  if (c === "6540" || c === "6541") return "SCI";
  if (c === "6589") return "SCM";
  if (n >= 6561 && n <= 6585) return "SCP";
  if (c.startsWith("92")) return "Association";
  return "";
}

/**
 * Le registre donne l'adresse complète du siège (« 12 RUE DE LA PAIX 75002
 * PARIS ») : on en retire le code postal et la ville, qui ont leurs propres
 * champs, pour ne pas les imprimer deux fois sur les documents.
 */
function streetFromSiege(siege) {
  const full = diffusible(siege.adresse).trim();
  const suffix = [
    diffusible(siege.code_postal),
    diffusible(siege.libelle_commune),
  ]
    .filter(Boolean)
    .join(" ");
  if (suffix && full.toUpperCase().endsWith(suffix.toUpperCase())) {
    return full.slice(0, -suffix.length).trim();
  }
  return full;
}

/**
 * @returns {{
 *   companyName: string, siret: string, siren: string, legalForm: string,
 *   addressStreet: string, addressCity: string, addressZipCode: string
 * }}
 */
export function companyFieldsFromRegistry(company) {
  const siege = company?.siege || {};
  return {
    companyName: diffusible(
      company?.nom_complet || company?.nom_raison_sociale,
    ),
    siret: diffusible(siege.siret),
    siren: diffusible(company?.siren),
    legalForm: legalFormFromNatureJuridique(company?.nature_juridique),
    addressStreet: streetFromSiege(siege),
    addressCity: diffusible(siege.libelle_commune),
    addressZipCode: diffusible(siege.code_postal),
  };
}
