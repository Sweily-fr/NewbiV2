/**
 * Référence légale de la franchise en base de TVA.
 *
 * Jusqu'au 31/12/2026, la mention en vigueur cite l'article 293 B du CGI.
 * L'ordonnance n° 2026-671 du 27/07/2026 a reporté au 01/01/2027 la
 * recodification de la TVA dans le CIBS et placé la franchise à l'article
 * L. 233-3 ; les anciennes références au CGI restent admises jusqu'au
 * 30/06/2028.
 *
 * Du 01/09 au 15/10/2026, Newbi a écrit « L. 223-3 du CIBS », un article qui
 * n'est jamais entré en vigueur. Les documents émis gardent la mention
 * enregistrée ; les brouillons et les avoirs créés depuis reprennent la
 * référence en vigueur à l'enregistrement.
 */
const LEGACY_REFERENCES = {
  "Article L. 223-3 du CIBS": "Article 293 B du CGI",
  "TVA non applicable, art. L. 223-3 du CIBS":
    "TVA non applicable, art. 293 B du CGI",
};

export function normalizeVatExemptionText(text) {
  return LEGACY_REFERENCES[text] ?? text;
}
