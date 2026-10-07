/**
 * TVA d'une facture d'achat ventilée par taux (cf. newbi-api
 * utils/purchaseInvoiceVat.js) : `vatBreakdown` porte une ligne par taux
 * (base HT, TVA) quand la facture en mêle au moins deux ; amountHT /
 * amountTVA / vatRate en sont alors le résumé. Une facture à taux unique
 * n'a pas de détail.
 *
 * Côté formulaire, les lignes sont gardées en chaînes (saisie en cours) :
 * { rate, baseHT, amountTVA }.
 */

const round2 = (n) => Math.round(n * 100) / 100;

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n =
    typeof value === "string"
      ? parseFloat(value.replace(",", "."))
      : Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Détail par taux d'une facture ou d'une proposition OCR (≥ 2 taux). */
export function invoiceVatLines(source) {
  const lines = source?.vatBreakdown;
  return Array.isArray(lines) && lines.length >= 2 ? lines : [];
}

/** Lignes enregistrées → lignes de formulaire (chaînes). */
export function toVatLinesForm(lines) {
  return (lines || []).map((l) => ({
    rate: l.rate === null || l.rate === undefined ? "" : String(l.rate),
    baseHT: l.baseHT === null || l.baseHT === undefined ? "" : String(l.baseHT),
    amountTVA:
      l.amountTVA === null || l.amountTVA === undefined
        ? ""
        : String(l.amountTVA),
  }));
}

/**
 * Lignes de formulaire → lignes à enregistrer. Une ligne sans taux ni base
 * est ignorée (ligne ajoutée puis laissée vide) ; la TVA vide est déduite de
 * la base et du taux.
 */
export function parseVatLines(lines) {
  return (lines || [])
    .map((l) => {
      const rate = toNumber(l.rate);
      const baseHT = toNumber(l.baseHT);
      if (rate === null || rate < 0 || rate > 100 || baseHT === null) {
        return null;
      }
      const tva = toNumber(l.amountTVA);
      return {
        rate,
        baseHT: round2(baseHT),
        amountTVA: tva === null ? round2((baseHT * rate) / 100) : round2(tva),
      };
    })
    .filter(Boolean);
}

/** Totaux d'un détail : HT, TVA, taux de la plus grosse base. */
export function summarizeVatLines(lines) {
  if (!lines?.length) return null;
  const main = lines.reduce((a, b) =>
    Math.abs(b.baseHT) > Math.abs(a.baseHT) ? b : a,
  );
  return {
    amountHT: round2(lines.reduce((s, l) => s + l.baseHT, 0)),
    amountTVA: round2(lines.reduce((s, l) => s + l.amountTVA, 0)),
    vatRate: main.rate,
  };
}

/** Taux affiché à la française : « 5,5 % », « 20 % ». */
export function formatVatRate(rate) {
  const n = toNumber(rate);
  if (n === null) return "";
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

/** Taux proposé pour une ligne ajoutée : un taux courant pas encore utilisé. */
export function nextVatRate(lines) {
  const used = new Set((lines || []).map((l) => toNumber(l.rate)));
  return [20, 10, 5.5, 2.1, 0].find((r) => !used.has(r)) ?? 20;
}

/** Les deux détails décrivent-ils la même TVA ? (comparaison OCR) */
export function sameVatLines(a, b) {
  const left = invoiceVatLines({ vatBreakdown: a });
  const right = invoiceVatLines({ vatBreakdown: b });
  if (left.length !== right.length) return false;
  const key = (l) =>
    `${round2(l.rate)}|${round2(l.baseHT)}|${round2(l.amountTVA)}`;
  const sorted = (lines) => lines.map(key).sort();
  const [x, y] = [sorted(left), sorted(right)];
  return x.every((k, i) => k === y[i]);
}

/**
 * Détail par taux lu par l'OCR (extracted_fields.tax_details : Claude
 * {rate, base, amount}, Mistral {type, rate, base_amount, tax_amount}).
 * Même règle que l'API (vatBreakdownFromOcr) : retenu à partir de deux taux,
 * et seulement si la somme des TVA colle au total de TVA lu (1 % ou 5 cts).
 */
export function vatLinesFromOcr(financial, expectedTVA = null) {
  const details = financial?.extracted_fields?.tax_details;
  if (!Array.isArray(details)) return [];
  const byRate = new Map();
  for (const d of details) {
    if (!d || typeof d !== "object") continue;
    if (typeof d.type === "string" && !/tva|vat/i.test(d.type)) continue;
    const rate = toNumber(d.rate);
    if (rate === null || rate < 0 || rate > 100) continue;
    let base = toNumber(d.base ?? d.base_amount ?? d.baseHT);
    let tva = toNumber(d.amount ?? d.tax_amount ?? d.amountTVA);
    if (tva === null && base !== null) tva = (base * rate) / 100;
    if (base === null && tva !== null && rate > 0) base = (tva * 100) / rate;
    if (base === null || tva === null || (base === 0 && tva === 0)) continue;
    const line = byRate.get(rate) || { rate, baseHT: 0, amountTVA: 0 };
    line.baseHT += base;
    line.amountTVA += tva;
    byRate.set(rate, line);
  }
  const lines = [...byRate.values()]
    .map((l) => ({
      rate: l.rate,
      baseHT: round2(l.baseHT),
      amountTVA: round2(l.amountTVA),
    }))
    .sort((a, b) => b.rate - a.rate);
  if (lines.length < 2) return [];
  const expected = toNumber(expectedTVA);
  if (expected !== null && expected > 0) {
    const total = lines.reduce((s, l) => s + l.amountTVA, 0);
    if (Math.abs(total - expected) > Math.max(0.05, expected * 0.01)) {
      return [];
    }
  }
  return lines;
}

/**
 * Formulaire (chaînes) après modification des lignes de TVA : à partir de
 * deux lignes, HT / TVA / taux en sont le résumé ; revenu à une seule ligne,
 * la TVA reprend sa forme habituelle. Le TTC suit HT + TVA sauf `keepTTC`
 * (facture rapprochée : son TTC est le débit bancaire).
 */
export function applyVatLinesToForm(prev, lines, { keepTTC = false } = {}) {
  const next = { ...prev };
  if (lines.length >= 2) {
    next.vatLines = lines;
    const totals = summarizeVatLines(parseVatLines(lines));
    next.amountHT = totals ? totals.amountHT.toFixed(2) : "";
    next.amountTVA = totals ? totals.amountTVA.toFixed(2) : "";
    if (totals) next.vatRate = String(totals.vatRate);
  } else {
    next.vatLines = [];
    const [line] = parseVatLines(lines);
    if (line) {
      next.amountHT = line.baseHT.toFixed(2);
      next.amountTVA = line.amountTVA.toFixed(2);
      next.vatRate = String(line.rate);
    }
  }
  if (!keepTTC) {
    const ht = parseFloat(next.amountHT) || 0;
    const tva = parseFloat(next.amountTVA) || 0;
    next.amountTTC = (ht + tva).toFixed(2);
  }
  return next;
}

/** Passage à plusieurs taux : la TVA saisie + une ligne vide à compléter. */
export function splitVatIntoLines(form) {
  const first = {
    rate: form.vatRate,
    baseHT: form.amountHT,
    amountTVA: form.amountTVA,
  };
  return [
    first,
    { rate: String(nextVatRate([first])), baseHT: "", amountTVA: "" },
  ];
}

/** Champs de TVA à envoyer à l'API depuis le formulaire. */
export function vatInputFromForm(form) {
  const lines = parseVatLines(form.vatLines);
  if (form.vatLines?.length >= 2 && lines.length >= 2) {
    return { ...summarizeVatLines(lines), vatBreakdown: lines };
  }
  const rate = toNumber(form.vatRate);
  return {
    amountHT: toNumber(form.amountHT) ?? 0,
    amountTVA: toNumber(form.amountTVA) ?? 0,
    // 0 % (exonération, autoliquidation) est un taux valide
    vatRate: rate === null ? 20 : rate,
    vatBreakdown: [],
  };
}

/**
 * TVA d'une facture par taux, pour l'affichage : son détail s'il en a un,
 * sinon une ligne à son taux unique (vide si la TVA n'est pas renseignée).
 */
export function vatLinesOf(invoice) {
  const lines = invoiceVatLines(invoice);
  if (lines.length) return lines;
  const rate = toNumber(invoice?.vatRate);
  const tva = toNumber(invoice?.amountTVA);
  if (rate === null || tva === null) return [];
  return [{ rate, baseHT: toNumber(invoice.amountHT) ?? 0, amountTVA: tva }];
}
