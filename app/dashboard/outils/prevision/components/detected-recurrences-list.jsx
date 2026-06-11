"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { EyeOff, Eye, RefreshCw, Plus } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  useDetectedRecurrences,
  useMuteDetectedRecurrence,
  useRunRecurrenceDetection,
} from "@/src/hooks/useDetectedRecurrences";

const CATEGORY_LABELS = {
  SALES: "Ventes",
  REFUNDS_RECEIVED: "Remboursements",
  OTHER_INCOME: "Autres revenus",
  RENT: "Loyer",
  SUBSCRIPTIONS: "Abonnements",
  OFFICE_SUPPLIES: "Fournitures",
  SERVICES: "Services",
  TRANSPORT: "Transport",
  MEALS: "Repas",
  TELECOMMUNICATIONS: "Télécom",
  INSURANCE: "Assurance",
  ENERGY: "Énergie",
  SOFTWARE: "Logiciels",
  HARDWARE: "Matériel",
  MARKETING: "Marketing",
  TRAINING: "Formation",
  MAINTENANCE: "Maintenance",
  TAXES: "Impôts & taxes",
  UTILITIES: "Charges",
  SALARIES: "Salaires",
  OTHER_EXPENSE: "Autres dépenses",
  // Catégories spécifiques aux transactions bancaires
  OTHER: "Autres dépenses",
  TRAVEL: "Déplacements",
  ACCOMMODATION: "Hébergement",
};

const SOURCE_LABELS = {
  PURCHASE_INVOICE: "factures d'achat",
  INVOICE: "factures client",
  TRANSACTION: "transactions bancaires",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const PAGE_SIZE = 5;

export function DetectedRecurrencesList({ onCreateForecast }) {
  const { recurrences, loading } = useDetectedRecurrences();
  const { setMuted, loading: muting } = useMuteDetectedRecurrence();
  const { runDetection, loading: detecting } = useRunRecurrenceDetection();
  const [expanded, setExpanded] = useState(false);

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
          rechercher les abonnements et factures qui reviennent au moins 3 mois
          de suite dans vos transactions bancaires et vos factures.
        </p>
      ) : (
        <>
          <div className="divide-y divide-border/40">
            {visible.map((rec) => {
              const isIncome = rec.type === "INCOME";
              return (
                <div
                  key={rec.id}
                  className={cn(
                    "flex items-center justify-between py-2.5 group transition-colors",
                    rec.isMuted && "opacity-50",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-foreground truncate">
                        {rec.partyName}
                      </span>
                      {rec.isMuted && (
                        <span className="text-[10px] text-muted-foreground/60">
                          masquée
                        </span>
                      )}
                      {!rec.isMuted && rec.isActive && (
                        <span className="text-[10px] text-muted-foreground/60">
                          projetée
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {CATEGORY_LABELS[rec.category] || rec.category || "—"} · ~
                      {formatCurrency(rec.averageAmount)}/mois
                      {SOURCE_LABELS[rec.source]
                        ? ` · via ${SOURCE_LABELS[rec.source]}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-[13px] font-medium tabular-nums",
                        isIncome ? "text-green-600" : "text-red-500",
                      )}
                    >
                      {isIncome ? "+" : "−"}
                      {formatCurrency(rec.averageAmount)}
                    </span>
                    {onCreateForecast && !rec.isMuted && (
                      <button
                        type="button"
                        onClick={() =>
                          onCreateForecast({
                            type: rec.type,
                            name: rec.partyName,
                            amount: rec.averageAmount,
                            frequency: "MONTHLY",
                            category: rec.category,
                          })
                        }
                        className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Créer une prévision récurrente à partir de cette détection"
                      >
                        <Plus size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMuted(rec.id, !rec.isMuted)}
                      disabled={muting}
                      className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title={rec.isMuted ? "Réactiver" : "Masquer"}
                    >
                      {rec.isMuted ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
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
    </div>
  );
}
