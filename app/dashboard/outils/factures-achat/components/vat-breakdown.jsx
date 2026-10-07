"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Input } from "@/src/components/ui/input";
import { VatRateSelect } from "@/src/components/vat-rate-select";
import { formatCurrencyAmount } from "@/src/lib/format-currency";
import {
  formatVatRate,
  nextVatRate,
  parseVatLines,
  summarizeVatLines,
} from "@/src/utils/purchase-invoice-vat";

const lineTva = (rate, base) => {
  const r = parseFloat(rate);
  const b = parseFloat(base);
  if (isNaN(r) || isNaN(b)) return "";
  return ((b * r) / 100).toFixed(2);
};

// Largeur commune des champs de la facture d'achat : celle qui affiche en
// entier le libellé de taux le plus long (« 10% - Taux intermédiaire »,
// ~203 px en Geist 14 px).
export const VAT_FIELD_WIDTH = "w-52";

// Tiroir : taux à la largeur commune, base HT et TVA à parts égales, puis la
// corbeille. Les totaux reprennent la même grille, sous leur colonne.
const LINE_GRID =
  "grid grid-cols-[13rem_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-2";
// Montants sans flèches d'incrément : Chrome leur réserve ~14 px à droite,
// le chiffre ne s'alignait plus sur les en-têtes et les totaux.
export const AMOUNT_INPUT =
  "w-full h-8 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
const RATE_TRIGGER =
  "w-full h-8 text-sm [&>span:first-child]:min-w-0 [&>span:first-child]:truncate [&>span:first-child]:block";

/**
 * Lignes de TVA d'une facture d'achat qui mêle plusieurs taux : taux, base
 * HT et montant de TVA par ligne. La TVA d'une ligne suit sa base et son
 * taux, et reste modifiable (arrondi imprimé sur le justificatif). Un TTC
 * qui ne vaut pas HT + TVA (pourboire, frais hors TVA, facture rapprochée)
 * est signalé, pas corrigé.
 */
export function VatBreakdownEditor({
  lines,
  currency,
  amountTTC,
  onChange,
  // Volet étroit (confirmation d'un justificatif) : libellé à gauche, champ
  // à droite, comme les autres champs du volet
  compact = false,
}) {
  const update = (index, field, value) => {
    onChange(
      lines.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, [field]: value };
        if (field === "rate" || field === "baseHT") {
          next.amountTVA = lineTva(next.rate, next.baseHT);
        }
        return next;
      }),
    );
  };

  const totals = summarizeVatLines(parseVatLines(lines));
  const ttc = parseFloat(amountTTC);
  const gap =
    totals && !isNaN(ttc)
      ? Math.round((ttc - totals.amountHT - totals.amountTVA) * 100) / 100
      : 0;

  const rateSelect = (line, index) => (
    <VatRateSelect
      value={line.rate}
      onChange={(v) => update(index, "rate", String(v))}
      className={RATE_TRIGGER}
    />
  );
  const amountInput = (line, index, field, label) => (
    <Input
      type="number"
      step="0.01"
      value={line[field]}
      onChange={(e) => update(index, field, e.target.value)}
      placeholder="0.00"
      aria-label={`${label} à ${formatVatRate(line.rate)}`}
      className={AMOUNT_INPUT}
    />
  );
  const removeButton = (index, size = "h-8 w-8") => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`${size} shrink-0 text-muted-foreground`}
      onClick={() => onChange(lines.filter((_, i) => i !== index))}
      title="Retirer ce taux"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
  const addButton = (
    <AddVatRateButton
      onClick={() =>
        onChange([
          ...lines,
          { rate: String(nextVatRate(lines)), baseHT: "", amountTVA: "" },
        ])
      }
    />
  );
  const gapNote =
    Math.abs(gap) >= 0.01 ? (
      <p className="text-xs text-muted-foreground">
        Le TTC diffère de HT + TVA de {formatCurrencyAmount(gap, currency)}.
      </p>
    ) : null;

  if (compact) {
    const row = (label, field, extra = null) => (
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          {label}
          {extra}
        </span>
        <div className={VAT_FIELD_WIDTH}>{field}</div>
      </div>
    );
    return (
      <div className="space-y-2.5">
        {lines.map((line, index) => (
          <div
            key={index}
            className="space-y-2.5 border-t pt-2.5 first:border-t-0 first:pt-0"
          >
            {row(
              "Taux",
              rateSelect(line, index),
              removeButton(index, "h-6 w-6"),
            )}
            {row("Base HT", amountInput(line, index, "baseHT", "Base HT"))}
            {row("TVA", amountInput(line, index, "amountTVA", "TVA"))}
          </div>
        ))}
        {addButton}
        {row(
          "Total HT",
          <p className="text-right text-sm pr-[11px]">
            {formatCurrencyAmount(totals?.amountHT ?? 0, currency)}
          </p>,
        )}
        {row(
          "Total TVA",
          <p className="text-right text-sm pr-[11px]">
            {formatCurrencyAmount(totals?.amountTVA ?? 0, currency)}
          </p>,
        )}
        {gapNote}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`${LINE_GRID} text-xs text-muted-foreground`}>
        <span>Taux</span>
        <span className="text-right pr-[11px]">Base HT</span>
        <span className="text-right pr-[11px]">TVA</span>
      </div>
      {lines.map((line, index) => (
        <div key={index} className={LINE_GRID}>
          {rateSelect(line, index)}
          {amountInput(line, index, "baseHT", "Base HT")}
          {amountInput(line, index, "amountTVA", "TVA")}
          {removeButton(index)}
        </div>
      ))}
      {addButton}
      {/* Totaux sous leur colonne, alignés sur le texte des champs */}
      <div className={`${LINE_GRID} border-t pt-2 text-sm`}>
        <span className="text-muted-foreground">Total</span>
        <span className="text-right pr-[11px]">
          {formatCurrencyAmount(totals?.amountHT ?? 0, currency)}
        </span>
        <span className="text-right pr-[11px]">
          {formatCurrencyAmount(totals?.amountTVA ?? 0, currency)}
        </span>
      </div>
      {gapNote}
    </div>
  );
}

export function AddVatRateButton({ onClick }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 font-normal gap-1.5 text-xs"
      onClick={onClick}
    >
      <Plus className="h-3.5 w-3.5" />
      Ajouter un taux de TVA
    </Button>
  );
}

/** Détail de la TVA en lecture : une ligne par taux, base HT en regard. */
export function VatBreakdownView({ lines, currency }) {
  return lines.map((line) => (
    <div key={line.rate} className="flex items-center justify-between">
      <span className="text-sm font-normal text-muted-foreground">
        TVA {formatVatRate(line.rate)}
        <span className="text-xs">
          {" "}
          sur {formatCurrencyAmount(line.baseHT, currency)} HT
        </span>
      </span>
      <span className="text-sm font-normal">
        {formatCurrencyAmount(line.amountTVA, currency)}
      </span>
    </div>
  ));
}

/**
 * Taux d'une facture sous son montant de TVA (tableau) : « 20 % » ou
 * « 20 % · 10 % » ; à plusieurs taux, l'infobulle détaille base HT et TVA.
 */
export function VatRatesSummary({ lines, currency }) {
  if (!lines?.length) return null;
  const rates = (
    <span className="block truncate text-xs text-muted-foreground">
      {lines.map((l) => formatVatRate(l.rate)).join(" · ")}
    </span>
  );
  if (lines.length < 2) return rates;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{rates}</TooltipTrigger>
        <TooltipContent>
          <div className="font-medium">TVA par taux</div>
          {lines.map((l) => (
            <div key={l.rate} className="text-xs text-muted-foreground">
              {formatVatRate(l.rate)} :{" "}
              {formatCurrencyAmount(l.amountTVA, currency)} sur{" "}
              {formatCurrencyAmount(l.baseHT, currency)} HT
            </div>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
