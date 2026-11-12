/**
 * Page Déclaration Urssaf : libellés et petits calculs d'affichage. Le calcul
 * de la déclaration lui-même est fait par l'API.
 */

export const URSSAF_FILING_URL = "https://www.autoentrepreneur.urssaf.fr/";

export const URSSAF_PERIOD_STATUS = {
  IN_PROGRESS: { label: "En cours", className: "text-muted-foreground" },
  TO_DECLARE: { label: "À déclarer", className: "text-[#5a50ff]" },
  NOT_CONFIRMED: { label: "Non confirmée", className: "text-muted-foreground" },
  DECLARED: {
    label: "Déclarée",
    className: "text-emerald-700 dark:text-emerald-400",
  },
};

const wholeEuros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const centsEuros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** « 1 234 € » : le chiffre d'affaires se déclare en euros entiers. */
export const formatUrssafEuros = (amount) => wholeEuros.format(amount || 0);

/** « 1 234,56 € » : les cotisations sont calculées au centime. */
export const formatUrssafCents = (amount) => centsEuros.format(amount || 0);

const rateFormat = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 3,
});

/** « 21,2 % » (espace insécable avant le signe). */
export const formatUrssafRate = (rate) => `${rateFormat.format(rate || 0)} %`;

const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** « 30 novembre 2026 », « 1er octobre 2026 » depuis un jour AAAA-MM-JJ. */
export function formatUrssafDay(day) {
  if (!day) return "";
  const text = dayFormat.format(new Date(`${day}T00:00:00Z`));
  return day.endsWith("-01") ? text.replace(/^1 /, "1er ") : text;
}

// Cases du formulaire de l'Urssaf ouvertes selon l'activité déclarée
const ACTIVITY_BOXES = {
  sales: ["sales"],
  "services-commercial": ["servicesBic"],
  "services-artisanal": ["servicesBic"],
  "services-liberal": ["servicesBnc"],
  cipav: ["servicesBnc"],
  "mixed-commercial": ["sales", "servicesBic"],
  "mixed-artisanal": ["sales", "servicesBic"],
};

const ADJUSTMENT_LABELS = {
  sales: "Ventes de marchandises encaissées hors factures Newbi",
  servicesBic: "Prestations de services (BIC) encaissées hors factures Newbi",
  servicesBnc: "Prestations de services (BNC) encaissées hors factures Newbi",
};

/** Montants saisis à la main : une case par catégorie de l'activité. */
export function urssafAdjustmentFields(activity) {
  return (ACTIVITY_BOXES[activity] || []).map((key) => ({
    key,
    label: ADJUSTMENT_LABELS[key],
  }));
}

/** Saisie du formulaire → montants envoyés à l'API (entiers positifs). */
export function urssafAdjustmentsInput(values = {}) {
  const input = {};
  for (const [key, value] of Object.entries(values)) {
    const number = Math.round(Number(String(value).replace(",", ".")));
    if (Number.isFinite(number) && number > 0) input[key] = number;
  }
  return input;
}

/** Phrase du résultat : cotisations estimées, ou chiffre d'affaires seul. */
export function urssafResultSummary(declaration) {
  const { totals, isNil, situation } = declaration;
  if (isNil) {
    return {
      title: "Chiffre d'affaires nul",
      amount: null,
      isCents: false,
      detail:
        "Aucun encaissement sur la période. La déclaration reste obligatoire : déclarez 0 € sur autoentrepreneur.urssaf.fr.",
    };
  }
  if (totals.totalToPay === null || totals.totalToPay === undefined) {
    return {
      title: "Chiffre d'affaires à déclarer",
      amount: totals.revenue,
      isCents: false,
      detail:
        situation?.estimateUnavailableReason ||
        "Les cotisations seront calculées par l'Urssaf.",
    };
  }
  const chamber =
    totals.chamberTax > 0
      ? ` La taxe pour frais de chambre (${formatUrssafCents(totals.chamberTax)}) s'ajoute si elle est due.`
      : "";
  return {
    title: "Total estimé à payer",
    amount: totals.totalToPay,
    isCents: true,
    detail: `Pour ${formatUrssafEuros(totals.revenue)} de chiffre d'affaires. Le montant exact est calculé par l'Urssaf.${chamber}`,
  };
}
