"use client";

import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  EyeOff,
  Eye,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  GitBranch,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import {
  useDetectedRecurrences,
  useMuteDetectedRecurrence,
  useDeleteDetectedRecurrence,
  useRunRecurrenceDetection,
} from "@/src/hooks/useDetectedRecurrences";
import { useForecastScenario } from "@/src/contexts/forecast-scenario-context";
import { DetectedRecurrenceDialog } from "./detected-recurrence-dialog";
import {
  FREQUENCY_LABELS,
  FREQUENCY_SUFFIX,
  formatCurrency,
} from "./detected-recurrence-labels";
import { getCategoryLabel } from "@/lib/category-icons-config";

// Libellé d'état d'une récurrence. Dans un scénario, on distingue ce qui
// vient de Base de ce qui a été surchargé ici.
const statusLabel = (rec, isScenario) => {
  if (rec.isMuted) {
    return isScenario && rec.scenarioOverride
      ? "masquée dans ce scénario"
      : "masquée";
  }
  if (isScenario && rec.scenarioOverride) return "réactivée dans ce scénario";
  if (rec.isActive) return "projetée";
  return null;
};

const SOURCE_LABELS = {
  PURCHASE_INVOICE: "factures d'achat",
  INVOICE: "factures client",
  TRANSACTION: "transactions bancaires",
};

// Périodicités gérées par les prévisions manuelles (CashflowFrequency).
const FORECAST_FREQUENCY = {
  WEEKLY: "WEEKLY",
  BIWEEKLY: "MONTHLY",
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  SEMIANNUAL: "SEMIANNUAL",
  ANNUAL: "ANNUAL",
};

// true si l'utilisateur a modifié au moins une valeur détectée.
const hasUserOverride = (rec) =>
  Boolean(
    rec.categoryOverride ||
    rec.subcategoryOverride ||
    rec.amountOverride != null ||
    rec.frequencyOverride ||
    rec.labelOverride,
  );

// Résumé des valeurs détectées (infobulle du badge « modifiée »).
const detectedSummary = (rec) =>
  [
    rec.partyName,
    formatCurrency(rec.averageAmount),
    FREQUENCY_LABELS[rec.frequency] || "Mensuel",
    getCategoryLabel(rec.category),
  ]
    .filter(Boolean)
    .join(" · ");

const PAGE_SIZE = 5;

// Petit bouton d'action toujours visible (« Modifier », « Ajouter »).
function RowAction({ icon: Icon, label, onClick, disabled, title, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

export function DetectedRecurrencesList({ onCreateForecast }) {
  const { isScenario, scenarioName } = useForecastScenario();
  const { recurrences, loading } = useDetectedRecurrences();
  const { setMuted, loading: muting } = useMuteDetectedRecurrence();
  const { deleteRecurrence, loading: deleting } = useDeleteDetectedRecurrence();
  const { runDetection, loading: detecting } = useRunRecurrenceDetection();
  const [expanded, setExpanded] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toEdit, setToEdit] = useState(null);

  const confirmDelete = async () => {
    if (!toDelete) return;
    const result = await deleteRecurrence(toDelete.id);
    if (result.success) setToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    );
  }

  const visible = expanded ? recurrences : recurrences.slice(0, PAGE_SIZE);
  const remaining = recurrences.length - PAGE_SIZE;
  // Le dialogue reçoit toujours la version à jour de la récurrence éditée
  // (refetch après enregistrement).
  const editing = toEdit
    ? recurrences.find((r) => r.id === toEdit.id) || toEdit
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">
            Récurrences détectées
          </h3>
          {recurrences.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {recurrences.length}
            </span>
          )}
          {isScenario && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#5b4fff]/10 px-2 py-0.5 text-[10px] font-medium text-[#5b4fff]">
              <GitBranch size={10} />
              {scenarioName}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={runDetection}
          disabled={detecting}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={12} className={detecting ? "animate-spin" : ""} />
          Analyser
        </button>
      </div>

      {recurrences.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Aucune récurrence détectée. Cliquez sur «&nbsp;Analyser&nbsp;» pour
          rechercher les abonnements et factures qui reviennent à intervalle
          régulier (hebdomadaire, mensuel, trimestriel, annuel…) dans vos
          transactions bancaires et vos factures.
        </p>
      ) : (
        <>
          <div className="divide-y divide-border/40">
            {visible.map((rec) => {
              const isIncome = rec.type === "INCOME";
              const status = statusLabel(rec, isScenario);
              const modified = hasUserOverride(rec);
              const name = rec.forecastName || rec.partyName;
              const amount = rec.forecastAmount ?? rec.averageAmount;
              const frequency = rec.forecastFrequency || rec.frequency;
              const category =
                rec.forecastSubcategory || rec.forecastCategory || rec.category;
              const muteTitle = rec.isMuted
                ? isScenario
                  ? "Réactiver dans ce scénario"
                  : "Réactiver"
                : isScenario
                  ? "Masquer dans ce scénario"
                  : "Masquer";
              return (
                <div
                  key={rec.id}
                  className={cn(
                    "flex items-center justify-between gap-3 py-2.5 group transition-colors",
                    rec.isMuted && "opacity-50",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] text-foreground truncate">
                        {name}
                      </span>
                      {status && (
                        <span
                          className={cn(
                            "text-[10px]",
                            isScenario && rec.scenarioOverride
                              ? "text-[#5b4fff]/80"
                              : "text-muted-foreground/60",
                          )}
                        >
                          {status}
                        </span>
                      )}
                      {modified && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground cursor-default">
                              <Pencil size={9} />
                              modifiée
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Détecté : {detectedSummary(rec)}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {getCategoryLabel(category) || "—"}
                      {frequency
                        ? ` · ${FREQUENCY_LABELS[frequency] || ""}`
                        : ""}{" "}
                      · ~{formatCurrency(amount)}
                      {FREQUENCY_SUFFIX[frequency] || "/mois"}
                      {SOURCE_LABELS[rec.source]
                        ? ` · via ${SOURCE_LABELS[rec.source]}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={cn(
                        "text-[13px] font-medium tabular-nums mr-1",
                        isIncome ? "text-green-600" : "text-red-500",
                      )}
                    >
                      {isIncome ? "+" : "−"}
                      {formatCurrency(amount)}
                    </span>
                    {/* « Modifier » : les valeurs sont communes à tous les
                        scénarios, donc modifiables depuis Base seulement
                        (comme le crayon des saisies de Base). */}
                    {isScenario ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <RowAction
                              icon={Pencil}
                              label="Modifier"
                              disabled
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Libellé, montant, périodicité et catégorie sont
                          communs à tous les scénarios : revenez au scénario
                          Base pour les modifier.
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <RowAction
                        icon={Pencil}
                        label="Modifier"
                        onClick={() => setToEdit(rec)}
                        title="Modifier le libellé, le montant, la périodicité ou la catégorie de cette récurrence"
                      />
                    )}
                    {onCreateForecast && !rec.isMuted && (
                      <RowAction
                        icon={Plus}
                        label="Ajouter"
                        onClick={() =>
                          onCreateForecast({
                            type: rec.type,
                            name,
                            amount,
                            frequency:
                              FORECAST_FREQUENCY[frequency] || "MONTHLY",
                            category,
                            // La prévision créée remplace la détection, qui
                            // sera masquée à l'enregistrement (sinon le
                            // montant serait compté deux fois).
                            fromDetection: { id: rec.id, name },
                          })
                        }
                        title="Ajouter une prévision manuelle à partir de cette détection (la détection sera masquée)"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setMuted(rec.id, !rec.isMuted)}
                      disabled={muting}
                      className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title={muteTitle}
                    >
                      {rec.isMuted ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    {/* La suppression est définitive et commune à tous les
                        scénarios : dans un scénario, on ne propose que le
                        masquage local. */}
                    {!isScenario && (
                      <button
                        type="button"
                        onClick={() => setToDelete(rec)}
                        disabled={deleting}
                        className="p-1 rounded-md text-muted-foreground/40 hover:text-red-500 hover:bg-muted/50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {remaining > 0 && !expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full py-2.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Afficher {remaining} autre{remaining > 1 ? "s" : ""}
            </button>
          )}
        </>
      )}

      <DetectedRecurrenceDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setToEdit(null)}
        recurrence={editing}
      />

      <AlertDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la récurrence ?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              «&nbsp;{toDelete?.forecastName || toDelete?.partyName}&nbsp;» sera
              retirée de la liste et de vos prévisions. Si le motif réapparaît
              dans vos transactions ou factures, elle pourra être détectée à
              nouveau lors d&apos;une prochaine analyse. Pour la masquer
              durablement, utilisez plutôt l&apos;option «&nbsp;Masquer&nbsp;».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
