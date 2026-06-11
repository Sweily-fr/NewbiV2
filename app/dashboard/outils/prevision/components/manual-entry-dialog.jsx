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
import { Switch } from "@/src/components/ui/switch";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  useUpsertManualCashflowEntry,
  useDeleteManualCashflowEntry,
} from "@/src/hooks/useManualCashflowEntries";
import {
  Trash2,
  CornerDownLeft,
  LoaderCircle,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon,
} from "lucide-react";

const FREQUENCIES = [
  { value: "WEEKLY", label: "Toutes les semaines" },
  { value: "MONTHLY", label: "Tous les mois" },
  { value: "QUARTERLY", label: "Tous les trimestres" },
  { value: "SEMIANNUAL", label: "Tous les semestres" },
  { value: "ANNUAL", label: "Tous les ans" },
];

const INCOME_CATEGORIES = [
  { value: "SALES", label: "Ventes" },
  { value: "REFUNDS_RECEIVED", label: "Remboursements" },
  { value: "OTHER_INCOME", label: "Autres revenus" },
];

const EXPENSE_CATEGORIES = [
  { value: "RENT", label: "Loyer" },
  { value: "SUBSCRIPTIONS", label: "Abonnements" },
  { value: "OFFICE_SUPPLIES", label: "Fournitures" },
  { value: "SERVICES", label: "Services" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "MEALS", label: "Repas" },
  { value: "TELECOMMUNICATIONS", label: "Télécom" },
  { value: "INSURANCE", label: "Assurance" },
  { value: "ENERGY", label: "Énergie" },
  { value: "SOFTWARE", label: "Logiciels" },
  { value: "HARDWARE", label: "Matériel" },
  { value: "MARKETING", label: "Marketing" },
  { value: "TRAINING", label: "Formation" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TAXES", label: "Impôts & taxes" },
  { value: "UTILITIES", label: "Charges" },
  { value: "SALARIES", label: "Salaires" },
  { value: "OTHER_EXPENSE", label: "Autres dépenses" },
];

// La détection stocke des catégories de transactions bancaires qui ne sont
// pas toutes dans l'enum ForecastCategory — on les rabat sur l'équivalent.
const CATEGORY_ALIAS = {
  TRAVEL: "TRANSPORT",
  ACCOMMODATION: "OTHER_EXPENSE",
  OTHER: "OTHER_EXPENSE",
};

const normalizeCategory = (cat, type) => {
  if (!cat) return "";
  const c = CATEGORY_ALIAS[cat] || cat;
  const list = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.some((o) => o.value === c) ? c : "";
};

const toDateInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const todayInput = () => toDateInput(new Date().toISOString());

const parseDate = (str) => {
  if (!str) return undefined;
  const d = new Date(str + "T00:00:00");
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const formatDateLabel = (str) => {
  const d = parseDate(str);
  if (!d) return null;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export function ManualEntryDialog({ open, onOpenChange, entry, defaults }) {
  const { upsertEntry, loading: saving } = useUpsertManualCashflowEntry();
  const { deleteEntry, loading: deleting } = useDeleteManualCashflowEntry();

  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amountDelta, setAmountDelta] = useState("");
  const [amountDeltaType, setAmountDeltaType] = useState("AMOUNT");
  const [startDate, setStartDate] = useState(todayInput());
  const [endDate, setEndDate] = useState("");
  const [hasFrequency, setHasFrequency] = useState(false);
  const [frequency, setFrequency] = useState("MONTHLY");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setType(entry.type || "EXPENSE");
      setAmount(entry.amount != null ? String(entry.amount) : "");
      setName(entry.name || "");
      setCategory(normalizeCategory(entry.category, entry.type || "EXPENSE"));
      setAmountDelta(entry.amountDelta ? String(entry.amountDelta) : "");
      setAmountDeltaType(entry.amountDeltaType || "AMOUNT");
      setStartDate(toDateInput(entry.startDate) || todayInput());
      setEndDate(toDateInput(entry.endDate));
      setHasFrequency(entry.frequency && entry.frequency !== "ONCE");
      setFrequency(
        entry.frequency && entry.frequency !== "ONCE"
          ? entry.frequency
          : "MONTHLY",
      );
      setNotes(entry.notes || "");
    } else {
      setType(defaults?.type || "EXPENSE");
      setAmount(
        defaults?.amount != null && !Number.isNaN(defaults.amount)
          ? String(defaults.amount)
          : "",
      );
      setName(defaults?.name || "");
      setCategory(
        normalizeCategory(defaults?.category, defaults?.type || "EXPENSE"),
      );
      setAmountDelta("");
      setAmountDeltaType("AMOUNT");
      // If defaults has a month (YYYY-MM), set startDate to first of that month
      if (defaults?.month) {
        setStartDate(`${defaults.month}-01`);
      } else {
        setStartDate(todayInput());
      }
      setEndDate("");
      // T9 — pré-cocher la récurrence si une fréquence est passée en defaults
      setHasFrequency(Boolean(defaults?.hasFrequency || defaults?.frequency));
      setFrequency(defaults?.frequency || "MONTHLY");
      setNotes("");
    }
  }, [open, entry, defaults]);

  const handleTypeChange = (next) => {
    setType(next);
    // Une catégorie de dépense n'est pas valide pour une entrée (et vice-versa)
    setCategory((prev) => normalizeCategory(prev, next));
  };

  const parsedAmount = parseFloat(amount);
  const canSubmit =
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    name.trim().length > 0 &&
    startDate &&
    (!endDate || endDate >= startDate) &&
    (!hasFrequency ||
      amountDelta.trim() === "" ||
      !Number.isNaN(parseFloat(amountDelta)));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const result = await upsertEntry({
      id: entry?.id,
      name: name.trim(),
      type,
      category: category || null,
      amount: parsedAmount,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      frequency: hasFrequency ? frequency : "ONCE",
      amountDelta: hasFrequency ? parseFloat(amountDelta) || 0 : 0,
      amountDeltaType,
      notes: notes.trim() || null,
    });
    if (result.success) onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!entry?.id) return;
    const result = await deleteEntry(entry.id);
    if (result.success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-1 gap-0 border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
        <div className="bg-background rounded-xl overflow-y-auto ring-1 ring-black/[0.07] dark:ring-white/[0.1] flex-1 min-h-0">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              {type === "INCOME" ? (
                <ArrowUpRight className="size-4" />
              ) : (
                <ArrowDownRight className="size-4" />
              )}
              {entry ? "Modifier la saisie" : "Nouvelle saisie"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-5 pt-4 pb-0">
            {/* Type toggle */}
            <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => handleTypeChange("EXPENSE")}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                  type === "EXPENSE"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/[0.07] dark:ring-white/[0.1]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Sortie
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("INCOME")}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                  type === "INCOME"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/[0.07] dark:ring-white/[0.1]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Entrée
              </button>
            </div>

            {/* Name + Amount on same row */}
            <div className="grid grid-cols-[1fr,140px] gap-3">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Libellé</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Loyer bureau"
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">
                  Montant prévu
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    €
                  </span>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">
                Catégorie
                <span className="text-muted-foreground/50 ml-1">optionnel</span>
              </label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {(type === "INCOME"
                    ? INCOME_CATEGORIES
                    : EXPENSE_CATEGORIES
                  ).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">
                Date prévue
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-fit justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    {formatDateLabel(startDate) || "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseDate(startDate)}
                    onSelect={(date) => {
                      if (date) setStartDate(toDateInput(date.toISOString()));
                    }}
                    defaultMonth={parseDate(startDate)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Frequency */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">
                  Configurer une prévision récurrente
                </label>
                <Switch
                  checked={hasFrequency}
                  onCheckedChange={setHasFrequency}
                />
              </div>
              {hasFrequency && (
                <div className="space-y-3">
                  {/* Augmenter ou diminuer de (style Qonto) */}
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted-foreground">
                      Augmenter ou diminuer de
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={amountDelta}
                        onChange={(e) => setAmountDelta(e.target.value)}
                        placeholder="0"
                        className="flex-1"
                      />
                      <Select
                        value={amountDeltaType}
                        onValueChange={(value) => setAmountDeltaType(value)}
                      >
                        <SelectTrigger className="w-24 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AMOUNT">EUR</SelectItem>
                          <SelectItem value="PERCENT">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground/60">
                      Ajoutez un «&nbsp;-&nbsp;» pour diminuer
                    </p>
                  </div>

                  {/* Récurrence + Répéter jusqu'en */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground">
                        Récurrence
                      </label>
                      <Select
                        value={frequency}
                        onValueChange={(value) => setFrequency(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground">
                        Répéter jusqu'en
                        <span className="text-muted-foreground/50 ml-1">
                          optionnel
                        </span>
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="size-3.5 text-muted-foreground" />
                            {formatDateLabel(endDate) || "Aucune"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDate(endDate)}
                            onSelect={(date) => {
                              if (date)
                                setEndDate(toDateInput(date.toISOString()));
                            }}
                            disabled={(date) => {
                              const start = parseDate(startDate);
                              return start ? date < start : false;
                            }}
                            defaultMonth={
                              parseDate(endDate) || parseDate(startDate)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">
                Note
                <span className="text-muted-foreground/50 ml-1">optionnel</span>
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter un commentaire..."
                maxLength={500}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/40 mt-4 px-5 py-3 -mx-5">
              <div>
                {entry?.id && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? "Suppression..." : "Supprimer"}
                  </button>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || saving}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    {entry ? "Enregistrer" : "Ajouter"}
                    <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                      <CornerDownLeft className="size-3" />
                    </kbd>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
