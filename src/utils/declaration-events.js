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
 * Déclarations conseillées selon la forme juridique et la situation de TVA :
 * - société (SAS, SARL…) : TVA, sauf franchise en base ou non assujettie ;
 * - micro-entrepreneur : Urssaf, plus la TVA s'il y est assujetti ;
 * - entrepreneur individuel au réel : TVA, sauf franchise ;
 * - forme juridique inconnue : aucune en particulier.
 */
export function recommendedDeclarationKinds(organization) {
  const legalForm = normalizeLegalForm(organization?.legalForm);
  const noVat =
    organization?.vatFranchise === true || organization?.isVatSubject === false;
  const vat = noVat ? [] : ["VAT"];

  if (COMPANY_FORMS.has(legalForm)) return vat;

  if (legalForm === "EI" || legalForm === "Auto-entrepreneur") {
    const isMicro =
      legalForm === "Auto-entrepreneur" ||
      MICRO_REGIMES.has(organization?.fiscalRegime);
    if (isMicro) {
      return [
        "URSSAF",
        ...(organization?.isVatSubject === true ? ["VAT"] : []),
      ];
    }
    return vat;
  }

  return [];
}

/**
 * Toutes les déclarations Newbi, toujours proposées (un choix ne disparaît
 * jamais de la fenêtre) : les conseillées pour l'espace en premier, avec
 * `recommended`.
 */
export function declarationPresetsFor(organization) {
  const recommended = recommendedDeclarationKinds(organization);
  const all = Object.values(DECLARATION_PRESETS);
  return [
    ...recommended.map((kind) => DECLARATION_PRESETS[kind]),
    ...all.filter((preset) => !recommended.includes(preset.kind)),
  ].map((preset) => ({
    ...preset,
    recommended: recommended.includes(preset.kind),
  }));
}

/** Site où déposer la déclaration d'un événement, null pour les autres. */
export function declarationFilingSite(kind) {
  return FILING_SITES[kind] || null;
}
