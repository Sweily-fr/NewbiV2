"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { LoaderCircle, Pencil, RotateCcw } from "lucide-react";
import { useUpdateDetectedRecurrence } from "@/src/hooks/useDetectedRecurrences";
import {
  CATEGORY_LABELS,
  EXPENSE_CATEGORY_OPTIONS,
  INCOME_CATEGORY_OPTIONS,
  FREQUENCY_LABELS,
  formatCurrency,
} from "./detected-recurrence-labels";

const FREQUENCY_OPTIONS = [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "SEMIANNUAL",
  "ANNUAL",
];

// « Modifier » une récurrence détectée : les valeurs saisies remplacent les
// valeurs détectées dans les prévisions (pour tous les scénarios) et
// survivent aux analyses suivantes. « Revenir aux valeurs détectées » retire
// toutes les surcharges.
export function DetectedRecurrenceDialog({ open, onOpenChange, recurrence }) {
  const { updateRecurrence, loading: saving } = useUpdateDetectedRecurrence();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!open || !recurrence) return;
    setLabel(recurrence.forecastName || recurrence.partyName || "");
    setAmount(
      recurrence.forecastAmount != null
        ? String(recurrence.forecastAmount)
        : "",
    );
    setFrequency(recurrence.forecastFrequency || "MONTHLY");
    setCategory(recurrence.forecastCategory || "");
  }, [open, recurrence]);

  if (!recurrence) return null;

  const isIncome = recurrence.type === "INCOME";
  const categoryOptions = isIncome
    ? INCOME_CATEGORY_OPTIONS
    : EXPENSE_CATEGORY_OPTIONS;
  const hasOverride = Boolean(
    recurrence.categoryOverride ||
    recurrence.amountOverride != null ||
    recurrence.frequencyOverride ||
    recurrence.labelOverride,
  );
  // Catégorie détectée rabattue sur l'enum (le serveur fait pareil).
  const detectedCategory = recurrence.categoryOverride
    ? null
    : recurrence.forecastCategory;
  const detectedSummary = [
    recurrence.partyName,
    `${formatCurrency(recurrence.averageAmount)}`,
    FREQUENCY_LABELS[recurrence.frequency] || "Mensuel",
    detectedCategory
      ? CATEGORY_LABELS[detectedCategory]
      : CATEGORY_LABELS[recurrence.category] || recurrence.category,
  ]
    .filter(Boolean)
    .join(" · ");

  const parsedAmount = parseFloat(amount);
  const canSubmit =
    label.trim().length > 0 &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    Boolean(frequency) &&
    !saving;

  const handleSave = async () => {
    if (!canSubmit) return;
    const result = await updateRecurrence(recurrence.id, {
      label: label.trim(),
      amount: parsedAmount,
      frequency,
      category: category || null,
    });
    if (result.success) onOpenChange(false);
  };

  const handleReset = async () => {
    const result = await updateRecurrence(recurrence.id, {}, { reset: true });
    if (result.success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Pencil className="size-4" />
              Modifier la récurrence
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground mt-1">
              Détecté : {detectedSummary}. Vos modifications remplacent ces
              valeurs dans les prévisions, pour tous les scénarios, et sont
              conservées aux analyses suivantes.
            </p>
          </DialogHeader>

          <div className="space-y-4 px-5 pt-4 pb-0">
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Libellé</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={120}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">
                  Montant par échéance
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-7"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    €
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">
                  Périodicité
                </label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {FREQUENCY_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Catégorie</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {CATEGORY_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/40 mt-4 px-5 py-3 -mx-5">
              <div>
                {hasOverride && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={saving}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                    title="Retirer toutes vos modifications et suivre à nouveau la détection"
                  >
                    <RotateCcw size={12} />
                    Revenir aux valeurs détectées
                  </button>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={!canSubmit}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
