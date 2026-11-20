import { normalizeLegalForm } from "@/src/lib/company-registry";
import { FILING_SITES } from "@/src/utils/calendar-linked-items";

/**
 * Événements Newbi de déclaration, proposés à la création d'un événement :
 * « Déclaration de TVA » et « Déclaration Urssaf ». L'événement garde son
 * type (declarationKind) : le lien vers le site où déposer la déclaration
 * s'affiche quel que soit son titre.
 */

export const DECLARATION_PRESETS = {
  VAT: {
    kind: "VAT",
    label: "Déclaration de TVA",
    title: "Déclaration de TVA",
    color: "#5A50FF",
    description:
      "Déclarer et payer la TVA dans votre espace professionnel sur impots.gouv.fr.",
  },
  URSSAF: {
    kind: "URSSAF",
    label: "Déclaration Urssaf",
    title: "Déclaration Urssaf",
    color: "#F59E0B",
    description:
      "Déclarer le chiffre d'affaires et payer les cotisations sur autoentrepreneur.urssaf.fr, onglet « Déclarer et payer ».",
  },
};

// Sociétés : TVA (pas de déclaration de chiffre d'affaires à l'Urssaf)
const COMPANY_FORMS = new Set([
  "SAS",
  "SASU",
  "SARL",
  "EURL",
  "SA",
  "SCA",
  "SNC",
  "SCS",
  "SELARL",
  "SELAS",
  "SELAFA",
  "SELCA",
  "SCI",
  "SCM",
  "SCP",
  "Association",
  "Indivision",
]);
const MICRO_REGIMES = new Set(["micro-entreprise", "micro-bic", "micro-bnc"]);

/**
 * Déclarations à proposer selon la forme juridique et la situation de TVA,
 * la plus probable en premier :
 * - société (SAS, SARL…) : TVA, sauf franchise en base ou non assujettie ;
 * - micro-entrepreneur : Urssaf, plus la TVA s'il y est assujetti ;
 * - entrepreneur individuel au réel : TVA, sauf franchise ;
 * - forme juridique inconnue : les deux.
 */
export function declarationPresetsFor(organization) {
  const legalForm = normalizeLegalForm(organization?.legalForm);
  const noVat =
    organization?.vatFranchise === true || organization?.isVatSubject === false;
  const vat = noVat ? [] : [DECLARATION_PRESETS.VAT];

  if (COMPANY_FORMS.has(legalForm)) return vat;

  const isIndividual = legalForm === "EI" || legalForm === "Auto-entrepreneur";
  if (isIndividual) {
    const isMicro =
      legalForm === "Auto-entrepreneur" ||
      MICRO_REGIMES.has(organization?.fiscalRegime);
    if (isMicro) {
      return [
        DECLARATION_PRESETS.URSSAF,
        ...(organization?.isVatSubject === true
          ? [DECLARATION_PRESETS.VAT]
          : []),
      ];
    }
    return vat;
  }

  return [DECLARATION_PRESETS.VAT, DECLARATION_PRESETS.URSSAF];
}

/** Site où déposer la déclaration d'un événement, null pour les autres. */
export function declarationFilingSite(kind) {
  return FILING_SITES[kind] || null;
}
