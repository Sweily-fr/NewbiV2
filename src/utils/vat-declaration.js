/**
 * Page Déclaration de TVA : libellés et petits calculs d'affichage. Le calcul
 * de la déclaration lui-même est fait par l'API.
 */

export const VAT_FILING_URL = "https://www.impots.gouv.fr/";

export const VAT_PERIOD_STATUS = {
  IN_PROGRESS: { label: "En cours", className: "text-muted-foreground" },
  TO_DECLARE: { label: "À déclarer", className: "text-[#5a50ff]" },
  NOT_CONFIRMED: { label: "Non confirmée", className: "text-muted-foreground" },
  DECLARED: {
    label: "Déclarée",
    className: "text-emerald-700 dark:text-emerald-400",
  },
};

export const VAT_MODE_LABELS = {
  debits: "TVA sur les débits",
  encaissements: "TVA sur les encaissements",
};

const eurosFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** « 1 234 € » : les montants déclarés sont en euros entiers. */
export const formatVatEuros = (amount) => eurosFormat.format(amount || 0);

const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** « 19 novembre 2026 » depuis un jour AAAA-MM-JJ. */
export function formatVatDay(day) {
  if (!day) return "";
  return dayFormat.format(new Date(`${day}T00:00:00Z`));
}

/**
 * Montants saisis à la main, selon le formulaire et la situation de la
 * période. `carriedCredit` : le crédit vient de la déclaration précédente,
 * il n'est donc pas à saisir.
 */
export function vatAdjustmentFields({ form, carriedCredit, credit }) {
  const fields = [];
  if (form === "CA3") {
    fields.push(
      {
        key: "reverseChargeServicesBase",
        code: "A3",
        label: "Achats de services à un prestataire non établi en France (HT)",
        hint: "TVA autoliquidée à 20 % : ajoutée en ligne 08 et déduite en ligne 20.",
      },
      {
        key: "intraCommunityAcquisitionsBase",
        code: "B2",
        label: "Acquisitions de biens dans l'Union européenne (HT)",
        hint: "TVA autoliquidée à 20 % : ajoutée en ligne 08 et déduite en ligne 20.",
      },
    );
  }
  fields.push(
    {
      key: "fixedAssetsVat",
      code: form === "CA3" ? "19" : null,
      label: "Dont TVA sur des immobilisations",
      hint: "Part de la TVA déductible à déplacer vers les immobilisations.",
    },
    {
      key: "otherDeductibleVat",
      code: form === "CA3" ? "21" : null,
      label: "Autre TVA à déduire",
    },
    {
      key: "vatToRepay",
      code: form === "CA3" ? "15" : null,
      label: "TVA déjà déduite à reverser",
    },
  );
  if (carriedCredit === null || carriedCredit === undefined) {
    fields.push({
      key: "previousCredit",
      code: form === "CA3" ? "22" : null,
      label: "Crédit de TVA de votre dernière déclaration",
      hint: "Une seule fois : ensuite, Newbi reprend le crédit de la déclaration précédente.",
    });
  }
  if (form === "CA3") {
    if (credit > 0) {
      fields.push({
        key: "refundRequested",
        code: "26",
        label: "Remboursement de crédit demandé",
        hint: "Sur le formulaire n° 3519. Le reste est reporté sur la déclaration suivante.",
      });
    }
    fields.push({
      key: "assimilatedTaxes",
      code: "29",
      label: "Taxes assimilées (annexe n° 3310-A)",
    });
  } else {
    fields.push({
      key: "installmentsPaid",
      code: null,
      label: "Acomptes déjà versés sur l'exercice",
    });
  }
  return fields;
}

/** Saisie du formulaire → montants envoyés à l'API (entiers positifs). */
export function vatAdjustmentsInput(values = {}) {
  const input = {};
  for (const [key, value] of Object.entries(values)) {
    const number = Math.round(Number(String(value).replace(",", ".")));
    if (Number.isFinite(number) && number > 0) input[key] = number;
  }
  return input;
}

/** Phrase du résultat : à payer, crédit, ou rien. */
export function vatResultSummary(vatReturn) {
  const { totals, isNil, period } = vatReturn;
  if (isNil) {
    return {
      title: "Déclaration néant",
      amount: null,
      detail:
        "Aucune opération sur la période. La déclaration reste obligatoire : cochez la case « néant » sur impots.gouv.fr.",
    };
  }
  if (totals.totalToPay > 0) {
    return {
      title: period.form === "CA12" ? "Solde à payer" : "Total à payer",
      amount: totals.totalToPay,
      detail: "À payer en ligne avec la déclaration.",
    };
  }
  if (totals.creditToCarry > 0) {
    return {
      title: "Crédit de TVA",
      amount: totals.creditToCarry,
      detail: "Reporté sur votre prochaine déclaration.",
    };
  }
  return {
    title: "Rien à payer",
    amount: 0,
    detail: "La TVA déductible couvre exactement la TVA due.",
  };
}

/** Où en est le chiffre d'affaires de la franchise face à un seuil. */
export function franchiseGauge(revenue, threshold, upperThreshold) {
  const percent = Math.min(100, Math.round((revenue / threshold) * 100));
  if (revenue > upperThreshold) {
    return {
      percent,
      tone: "over",
      label: "Seuil majoré dépassé : la TVA s'applique dès le dépassement.",
    };
  }
  if (revenue > threshold) {
    return {
      percent,
      tone: "warning",
      label: "Seuil dépassé : la TVA s'applique au 1er janvier suivant.",
    };
  }
  return { percent, tone: "ok", label: null };
}
