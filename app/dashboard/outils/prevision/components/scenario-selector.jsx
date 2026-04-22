"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import {
  useForecastScenarios,
  useUpsertForecastScenario,
  useDeleteForecastScenario,
} from "@/src/hooks/useTreasuryForecast";
import {
  ChevronDown,
  Check,
  Plus,
  Trash2,
  GitBranch,
  CornerDownLeft,
  LoaderCircle,
} from "lucide-react";

const formatMultiplier = (v) => {
  const pct = Math.round((v - 1) * 100);
  if (pct === 0) return "=";
  return pct > 0 ? `+${pct}%` : `${pct}%`;
};

export function ScenarioSelector({ activeScenarioId, onScenarioChange }) {
  const { scenarios } = useForecastScenarios();
  const { upsertScenario, loading: saving } = useUpsertForecastScenario();
  const { deleteScenario, loading: deleting } = useDeleteForecastScenario();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [incomePct, setIncomePct] = useState("0");
  const [expensePct, setExpensePct] = useState("0");

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);
  const label = activeScenario ? activeScenario.name : "Base";

  const openCreate = () => {
    setEditing(null);
    setName("");
    setIncomePct("0");
    setExpensePct("0");
    setDialogOpen(true);
  };

  const openEdit = (scenario) => {
    setEditing(scenario);
    setName(scenario.name);
    setIncomePct(String(Math.round((scenario.incomeMultiplier - 1) * 100)));
    setExpensePct(String(Math.round((scenario.expenseMultiplier - 1) * 100)));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const incomeMultiplier = 1 + parseFloat(incomePct || "0") / 100;
    const expenseMultiplier = 1 + parseFloat(expensePct || "0") / 100;
    if (!name.trim()) return;

    const result = await upsertScenario({
      id: editing?.id,
      name: name.trim(),
      incomeMultiplier,
      expenseMultiplier,
    });
    if (result.success) {
      setDialogOpen(false);
      if (result.scenario?.id && !editing) {
        onScenarioChange(result.scenario.id);
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteScenario(id);
    if (result.success && activeScenarioId === id) {
      onScenarioChange(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="cursor-pointer">
            <GitBranch size={13} className="mr-1.5 text-muted-foreground" />
            {label}
            <ChevronDown
              size={12}
              className="ml-0.5 opacity-70"
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Scénario de prévision
          </DropdownMenuLabel>

          {/* Base scenario */}
          <DropdownMenuItem
            onClick={() => onScenarioChange(null)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="text-xs">Base</span>
            <Check
              className={cn(
                "h-4 w-4 text-[#5b4fff]",
                !activeScenarioId ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>

          {/* User scenarios */}
          {scenarios.map((s) => (
            <DropdownMenuItem
              key={s.id}
              onClick={() => onScenarioChange(s.id)}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs truncate">{s.name}</span>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                  {formatMultiplier(s.incomeMultiplier)} /{" "}
                  {formatMultiplier(s.expenseMultiplier)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(s);
                  }}
                  className="text-[10px] text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity px-1"
                >
                  Modifier
                </button>
                <Check
                  className={cn(
                    "h-4 w-4 text-[#5b4fff] shrink-0",
                    activeScenarioId === s.id ? "opacity-100" : "opacity-0",
                  )}
                />
              </div>
            </DropdownMenuItem>
          ))}

          {scenarios.length < 5 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openCreate} className="cursor-pointer">
                <Plus size={13} className="mr-1.5 text-muted-foreground" />
                <span className="text-xs">Nouveau scénario</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
          <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
            <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
              <DialogTitle className="text-sm font-medium flex items-center gap-2">
                <GitBranch className="size-4" />
                {editing ? "Modifier le scénario" : "Nouveau scénario"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 px-5 pt-4 pb-0">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Nom</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Optimiste, Pessimiste..."
                  maxLength={60}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">
                    Entrées
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={incomePct}
                      onChange={(e) => setIncomePct(e.target.value)}
                      className="pr-6"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/50">
                    {parseInt(incomePct || "0") > 0
                      ? "Hausse"
                      : parseInt(incomePct || "0") < 0
                        ? "Baisse"
                        : "Inchangé"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">
                    Sorties
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={expensePct}
                      onChange={(e) => setExpensePct(e.target.value)}
                      className="pr-6"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/50">
                    {parseInt(expensePct || "0") > 0
                      ? "Hausse"
                      : parseInt(expensePct || "0") < 0
                        ? "Baisse"
                        : "Inchangé"}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border/40 mt-4 px-5 py-3 -mx-5">
                <div>
                  {editing?.id && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(editing.id);
                        setDialogOpen(false);
                      }}
                      disabled={deleting}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <Button
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      {editing ? "Enregistrer" : "Créer"}
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
    </>
  );
}
