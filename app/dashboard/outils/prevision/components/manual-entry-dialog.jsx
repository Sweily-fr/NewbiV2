"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";
import {
  useUpsertManualCashflowEntry,
  useDeleteManualCashflowEntry,
} from "@/src/hooks/useManualCashflowEntries";
import { Trash2 } from "lucide-react";

const FREQUENCIES = [
  { value: "WEEKLY", label: "Hebdo" },
  { value: "MONTHLY", label: "Mensuel" },
  { value: "QUARTERLY", label: "Trimestriel" },
  { value: "SEMIANNUAL", label: "Semestriel" },
  { value: "ANNUAL", label: "Annuel" },
];

const toDateInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const todayInput = () => toDateInput(new Date().toISOString());

export function ManualEntryDialog({ open, onOpenChange, entry }) {
  const { upsertEntry, loading: saving } = useUpsertManualCashflowEntry();
  const { deleteEntry, loading: deleting } = useDeleteManualCashflowEntry();

  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
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
      setType("EXPENSE");
      setAmount("");
      setName("");
      setStartDate(todayInput());
      setEndDate("");
      setHasFrequency(false);
      setFrequency("MONTHLY");
      setNotes("");
    }
  }, [open, entry]);

  const parsedAmount = parseFloat(amount);
  const canSubmit =
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    name.trim().length > 0 &&
    startDate &&
    (!endDate || endDate >= startDate);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const result = await upsertEntry({
      id: entry?.id,
      name: name.trim(),
      type,
      amount: parsedAmount,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      frequency: hasFrequency ? frequency : "ONCE",
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Modifier la saisie" : "Ajoutez une saisie manuelle"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Projeter un flux de trésorerie ponctuel ou récurrent.
          </DialogDescription>
        </DialogHeader>

        {/* ─── Amount + type ─── */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-baseline gap-2">
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="text-2xl font-medium border-0 shadow-none focus-visible:ring-0 px-0 h-auto flex-1"
            />
            <span className="text-lg text-muted-foreground">EUR</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                type === "INCOME"
                  ? "bg-[#5b4fff] text-white"
                  : "bg-muted text-foreground hover:bg-muted/80",
              )}
            >
              Entrée
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                type === "EXPENSE"
                  ? "bg-[#5b4fff] text-white"
                  : "bg-muted text-foreground hover:bg-muted/80",
              )}
            >
              Sortie
            </button>
          </div>
        </div>

        {/* ─── Name + start date ─── */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="manual-entry-name"
              className="text-xs text-muted-foreground font-normal"
            >
              Nom
            </Label>
            <Input
              id="manual-entry-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Loyer bureau"
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="manual-entry-start"
              className="text-xs text-muted-foreground font-normal"
            >
              Date prévue
            </Label>
            <Input
              id="manual-entry-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        {/* ─── Frequency ─── */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="manual-entry-freq" className="font-normal">
              Fréquence
            </Label>
            <Switch
              id="manual-entry-freq"
              checked={hasFrequency}
              onCheckedChange={setHasFrequency}
            />
          </div>
          {hasFrequency && (
            <>
              <div className="flex flex-wrap gap-2">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFrequency(f.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                      frequency === f.value
                        ? "bg-[#5b4fff] text-white"
                        : "bg-muted text-foreground hover:bg-muted/80",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="manual-entry-end"
                  className="text-xs text-muted-foreground font-normal"
                >
                  Date de fin (optionnel)
                </Label>
                <Input
                  id="manual-entry-end"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* ─── Notes (optional) ─── */}
        <div className="space-y-1.5">
          <Label
            htmlFor="manual-entry-notes"
            className="text-xs text-muted-foreground font-normal"
          >
            Notes (optionnel)
          </Label>
          <Textarea
            id="manual-entry-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={2}
          />
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <div>
            {entry?.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={14} className="mr-1.5" />
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
              {entry ? "Enregistrer" : "Saisie manuelle"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
