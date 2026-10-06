"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
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

/**
 * Lignes de TVA d'une facture d'achat qui mêle plusieurs taux : taux, base
 * HT et montant de TVA par ligne. La TVA d'une ligne suit sa base et son
 * taux, et reste modifiable (arrondi imprimé sur le justificatif). Un TTC
 * qui ne vaut pas HT + TVA (pourboire, frais hors TVA, facture rapprochée)
 * est signalé, pas corrigé.
 */
// Sélecteur de taux sur toute la largeur restante : le libellé le plus long
// (« 10% - Taux intermédiaire ») demande ~205 px, le tiroir en laisse ~220.
const LINE_GRID =
  "grid grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_2rem] items-center gap-2";
const RATE_TRIGGER =
  "w-full h-8 text-sm [&>span:first-child]:min-w-0 [&>span:first-child]:truncate [&>span:first-child]:block";

export function VatBreakdownEditor({
  lines,
  currency,
  amountTTC,
  onChange,
  // Volet étroit (confirmation d'un justificatif) : le taux prend une ligne
  // entière, base HT et TVA se partagent la suivante
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
      className="w-full h-8 text-sm text-right"
    />
  );
  const removeButton = (index) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 text-muted-foreground"
      onClick={() => onChange(lines.filter((_, i) => i !== index))}
      title="Retirer ce taux"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );

  return (
    <div className="space-y-2">
      {compact ? (
        lines.map((line, index) => (
          <div key={index} className="space-y-2 rounded-md border p-2.5">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">{rateSelect(line, index)}</div>
              {removeButton(index)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="block text-xs text-muted-foreground">
                  Base HT
                </span>
                {amountInput(line, index, "baseHT", "Base HT")}
              </label>
              <label className="space-y-1">
                <span className="block text-xs text-muted-foreground">TVA</span>
                {amountInput(line, index, "amountTVA", "TVA")}
              </label>
            </div>
          </div>
        ))
      ) : (
        <>
          <div className={`${LINE_GRID} text-xs text-muted-foreground`}>
            <span>Taux</span>
            <span className="text-right">Base HT</span>
            <span className="text-right">TVA</span>
          </div>
          {lines.map((line, index) => (
            <div key={index} className={LINE_GRID}>
              {rateSelect(line, index)}
              {amountInput(line, index, "baseHT", "Base HT")}
              {amountInput(line, index, "amountTVA", "TVA")}
              {removeButton(index)}
            </div>
          ))}
        </>
      )}
      <AddVatRateButton
        onClick={() =>
          onChange([
            ...lines,
            { rate: String(nextVatRate(lines)), baseHT: "", amountTVA: "" },
          ])
        }
      />
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-normal text-muted-foreground">
          Total HT
        </span>
        <span className="text-sm font-normal">
          {formatCurrencyAmount(totals?.amountHT ?? 0, currency)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-normal text-muted-foreground">
          Total TVA
        </span>
        <span className="text-sm font-normal">
          {formatCurrencyAmount(totals?.amountTVA ?? 0, currency)}
        </span>
      </div>
      {Math.abs(gap) >= 0.01 && (
        <p className="text-xs text-muted-foreground">
          Le TTC diffère de HT + TVA de {formatCurrencyAmount(gap, currency)}.
        </p>
      )}
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
