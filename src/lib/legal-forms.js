/**
 * Liste « Forme juridique » proposée dans les paramètres et dans la fenêtre
 * « Configuration de votre entreprise ». Les valeurs sont celles de
 * LEGAL_FORM_VALUES (company-registry.js).
 */
export const LEGAL_FORM_GROUPS = [
  {
    label: "Sociétés commerciales",
    forms: [
      { value: "SARL", label: "SARL - Société à responsabilité limitée" },
      {
        value: "EURL",
        label: "EURL - Entreprise unipersonnelle à responsabilité limitée",
      },
      { value: "SAS", label: "SAS - Société par actions simplifiée" },
      {
        value: "SASU",
        label: "SASU - Société par actions simplifiée unipersonnelle",
      },
      { value: "SA", label: "SA - Société anonyme" },
      { value: "SCA", label: "SCA - Société en commandite par actions" },
      { value: "SNC", label: "SNC - Société en nom collectif" },
      { value: "SCS", label: "SCS - Société en commandite simple" },
    ],
  },
  {
    label: "Sociétés d'exercice libéral",
    forms: [
      {
        value: "SELARL",
        label: "SELARL - Société d'exercice libéral à responsabilité limitée",
      },
      {
        value: "SELAS",
        label: "SELAS - Société d'exercice libéral par actions simplifiée",
      },
      {
        value: "SELAFA",
        label: "SELAFA - Société d'exercice libéral à forme anonyme",
      },
      {
        value: "SELCA",
        label: "SELCA - Société d'exercice libéral en commandite par actions",
      },
    ],
  },
  {
    label: "Sociétés civiles",
    forms: [
      { value: "SCI", label: "SCI - Société civile immobilière" },
      { value: "SCM", label: "SCM - Société civile de moyens" },
      { value: "SCP", label: "SCP - Société civile professionnelle" },
    ],
  },
  {
    label: "Entreprise individuelle",
    forms: [
      {
        value: "EI",
        label: "EI - Entreprise individuelle (auto-entrepreneur)",
      },
    ],
  },
  {
    label: "Indivision",
    forms: [{ value: "Indivision", label: "Indivision (Situation juridique)" }],
  },
  {
    label: "Associations",
    forms: [{ value: "Association", label: "Association déclarée" }],
  },
];
