/**
 * Appels à l'action des articles du blog, adaptés au sujet de l'article.
 *
 * Jusqu'au 31/10/2026, chaque article répétait deux ou trois fois le même
 * bouton « Essayer Newbi gratuitement », quel que soit le sujet. Un lecteur
 * venu chercher « facturer en sous-traitance » ou « scanner ses tickets de
 * caisse » veut résoudre ce problème-là, pas « un logiciel » : le bouton lui
 * propose désormais l'action qui y répond (générateur gratuit pour un
 * modèle, scan des justificatifs pour les notes de frais, etc.).
 *
 * Le thème se déduit du slug, du mot-clé et de la catégorie ; un article
 * peut le forcer avec `cta: <thème>` dans son frontmatter, et un bloc
 * précis avec `<ArticleCta intent="devis" />`.
 */

export type CtaIntent =
  | "facture"
  | "generateur-facture"
  | "generateur-devis"
  | "devis"
  | "facturation-electronique"
  | "achats"
  | "tresorerie"
  | "relance"
  | "signature"
  | "transfert"
  | "projet"
  | "comparatif";

type CtaLink = { label: string; href: string };

export type CtaContent = {
  title: string;
  text: string;
  primary: CtaLink;
  secondary?: CtaLink;
  /** Mention sous les boutons (offre d'essai) ; absente si le bouton principal ne mène pas à l'inscription. */
  note?: string;
};

const SIGNUP = "/auth/signup";
const TRIAL_NOTE = "30 jours gratuits, sans carte bancaire.";

export const CTA_CONTENT: Record<CtaIntent, CtaContent> = {
  facture: {
    title: "Des factures conformes, sans y penser",
    text: "Mentions obligatoires, numérotation continue, envoi par e-mail et suivi des paiements : Newbi applique les règles, vous facturez.",
    primary: { label: "Créer ma première facture", href: SIGNUP },
    secondary: {
      label: "Générer une facture gratuite",
      href: "/outils/generateur-de-facture",
    },
    note: TRIAL_NOTE,
  },
  "generateur-facture": {
    title: "Faites votre facture en ligne, sans inscription",
    text: "Le générateur gratuit de Newbi pose les mentions obligatoires et produit un PDF prêt à envoyer. Rien n'est enregistré sur nos serveurs.",
    primary: {
      label: "Ouvrir le générateur de facture",
      href: "/outils/generateur-de-facture",
    },
    secondary: {
      label: "Numéroter et envoyer avec un compte",
      href: SIGNUP,
    },
  },
  "generateur-devis": {
    title: "Faites votre devis en ligne, sans inscription",
    text: "Le générateur gratuit de Newbi pose les mentions obligatoires du devis et produit un PDF prêt à envoyer. Rien n'est enregistré sur nos serveurs.",
    primary: {
      label: "Ouvrir le générateur de devis",
      href: "/outils/generateur-de-devis",
    },
    secondary: { label: "Faire signer en ligne avec un compte", href: SIGNUP },
  },
  devis: {
    title: "Des devis signés en ligne, puis facturés en un clic",
    text: "Avec Newbi, vos devis portent les mentions obligatoires, se signent électroniquement et deviennent une facture sans ressaisie.",
    primary: { label: "Créer mon premier devis", href: SIGNUP },
    secondary: {
      label: "Générer un devis gratuit",
      href: "/outils/generateur-de-devis",
    },
    note: TRIAL_NOTE,
  },
  "facturation-electronique": {
    title: "Prêt pour la facturation électronique",
    text: "Newbi reçoit vos factures électroniques et émet les vôtres au format Factur-X, via une plateforme agréée. L'émission devient obligatoire pour les TPE et PME le 1er septembre 2027.",
    primary: { label: "Passer à la facture électronique", href: SIGNUP },
    secondary: {
      label: "Voir la facturation électronique",
      href: "/produits/facturation-electronique",
    },
    note: TRIAL_NOTE,
  },
  achats: {
    title: "Vos justificatifs scannés et rapprochés",
    text: "Prenez la photo du ticket ou de la facture : l'OCR de Newbi lit le montant et la TVA, puis rapproche le justificatif de la bonne transaction bancaire.",
    primary: { label: "Scanner mes justificatifs", href: SIGNUP },
    secondary: {
      label: "Voir la gestion des achats",
      href: "/produits/gestion-des-achats",
    },
    note: TRIAL_NOTE,
  },
  tresorerie: {
    title: "Votre trésorerie à jour, sans tableur",
    text: "Newbi se connecte à votre banque, classe vos transactions et projette votre trésorerie à partir de vos factures et de vos dépenses.",
    primary: { label: "Connecter ma banque", href: SIGNUP },
    secondary: { label: "Voir la trésorerie", href: "/produits/tresorerie" },
    note: TRIAL_NOTE,
  },
  relance: {
    title: "Faites-vous payer à l'échéance",
    text: "Newbi suit l'échéance de chaque facture et relance automatiquement vos clients en retard, avec vos propres modèles de message.",
    primary: { label: "Suivre mes paiements", href: SIGNUP },
    secondary: {
      label: "Calculer des pénalités de retard",
      href: "/outils/calculateur-penalites-retard",
    },
    note: TRIAL_NOTE,
  },
  signature: {
    title: "Votre signature de mail en quelques minutes",
    text: "Le générateur de Newbi crée une signature professionnelle compatible Gmail, Outlook et Apple Mail, à partir de modèles personnalisables.",
    primary: { label: "Créer ma signature de mail", href: SIGNUP },
    secondary: {
      label: "Voir le générateur de signature",
      href: "/produits/signatures",
    },
    note: TRIAL_NOTE,
  },
  transfert: {
    title: "Envoyez vos fichiers lourds par lien sécurisé",
    text: "Newbi Transfert partage vos fichiers volumineux par un lien temporaire, avec suivi des téléchargements.",
    primary: { label: "Envoyer un fichier", href: SIGNUP },
    secondary: { label: "Voir Newbi Transfert", href: "/produits/transfers" },
    note: TRIAL_NOTE,
  },
  projet: {
    title: "Vos projets et vos factures au même endroit",
    text: "Des tableaux kanban partagés, reliés à vos clients et à vos factures, pour suivre chaque mission jusqu'au paiement.",
    primary: { label: "Créer mon tableau", href: SIGNUP },
    secondary: { label: "Voir le kanban", href: "/produits/kanban" },
    note: TRIAL_NOTE,
  },
  comparatif: {
    title: "Faites-vous votre propre avis",
    text: "Testez toutes les fonctionnalités de Newbi pendant 30 jours : devis, factures, achats, banque et facturation électronique.",
    primary: { label: "Essayer Newbi 30 jours", href: SIGNUP },
    secondary: { label: "Voir les tarifs", href: "/tarifs" },
    note: "Sans carte bancaire.",
  },
};

export const CTA_INTENTS = Object.keys(CTA_CONTENT) as CtaIntent[];

export function isCtaIntent(value: unknown): value is CtaIntent {
  return typeof value === "string" && value in CTA_CONTENT;
}

// Premier motif reconnu gagnant : l'ordre compte. Les modèles de facture et
// de devis, et les recherches de logiciel « gratuit », passent avant
// « devis » : le générateur gratuit répond à leur recherche, Newbi n'ayant
// pas d'offre gratuite. Les motifs travaillent sur des segments de slug
// (« devis » ne doit pas attraper « devise »). Les justificatifs passent
// avant les comparatifs (un « top des outils de scan » cherche à scanner),
// les devis avant les relances (« relancer un devis »).
const RULES: Array<[CtaIntent, RegExp]> = [
  ["signature", /signature-(mail|e-?mail|professionnelle)|signature mail/],
  ["transfert", /transfert|partager-documents|fichiers-volumineux/],
  ["projet", /kanban|gestion-projet|organiser-projets?/],
  [
    "facturation-electronique",
    /facture-electronique|facturation-electronique|e-invoicing|facturx|factur-x|ubl-cii|\bpdp\b|-pdp-|\bppf\b|-ppf-|e-reporting|chorus|dematerialisation|annuaire-facturation/,
  ],
  ["generateur-devis", /^modele-(de-)?devis|^devis-.*-modeles?$/],
  [
    "generateur-facture",
    /^modele-(de-)?facture|^facture-modele|^exemple-facture|^logiciels?-.*gratuit/,
  ],
  [
    "achats",
    /notes?-de-frais|ticket|justificatif|\bocr\b|-ocr-|^ocr-|depenses?|achats?|fournisseur|frais-professionnels|tva-deductible|scan/,
  ],
  [
    "tresorerie",
    /tresorerie|\bbfr\b|-bfr-|^bfr-|cash|previsionnel|rapprochement|bancaire|seuil-de-rentabilite|\bdso\b|^dso-|tableau-de-bord|budget/,
  ],
  [
    "devis",
    /(^|-)devis(-|$)|avenant|bon-commande|bon-de-commande|proforma|bon-de-livraison/,
  ],
  [
    "relance",
    /relance|impaye|retard|penalite|delais?-(de-)?paiement|mise-en-demeure|recouvrement|escompte/,
  ],
  ["comparatif", /alternatives?|-vs-|meilleur|^top-|comparatif|logiciels?-/],
];

export function ctaIntentFor(post: {
  slug: string;
  keyword?: string | null;
  category?: string | null;
  cta?: string | null;
}): CtaIntent {
  if (isCtaIntent(post.cta)) return post.cta;
  for (const [intent, re] of RULES) {
    if (re.test(post.slug)) return intent;
  }
  // Mot-clé en clair (« modèle devis », « note de frais ») : même règles sur
  // une version slugifiée, après le slug qui reste prioritaire.
  const keyword = (post.keyword || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
  if (keyword) {
    for (const [intent, re] of RULES) {
      if (re.test(keyword)) return intent;
    }
  }
  if (post.category === "comparaison" || post.category === "liste") {
    return "comparatif";
  }
  return "facture";
}
