"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  EyeOff,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  useDetectedRecurrences,
  useMuteDetectedRecurrence,
  useRunRecurrenceDetection,
} from "@/src/hooks/useDetectedRecurrences";

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

export function DetectedRecurrencesList() {
  const { recurrences, loading } = useDetectedRecurrences();
  const { setMuted, loading: muting } = useMuteDetectedRecurrence();
  const { runDetection, loading: detecting } = useRunRecurrenceDetection();

  if (loading) {
    return (
      <Card className="border-border shadow-none">
        <CardContent className="p-6 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-none">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#5b4fff]" />
            <h3 className="text-sm font-medium text-foreground">
              Récurrences détectées
            </h3>
            <span className="text-xs text-muted-foreground">
              — factures répétées sur les 3 derniers mois
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runDetection}
            disabled={detecting}
            className="cursor-pointer"
          >
            <RefreshCw
              size={13}
              className={detecting ? "mr-1.5 animate-spin" : "mr-1.5"}
            />
            Analyser maintenant
          </Button>
        </div>

        {recurrences.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Aucune récurrence détectée. Lance l&apos;analyse pour scanner tes
            factures des 3 derniers mois.
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-md">
            {recurrences.map((rec) => {
              const isIncome = rec.type === "INCOME";
              return (
                <li
                  key={rec.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={
                        isIncome
                          ? "h-8 w-8 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0"
                          : "h-8 w-8 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center shrink-0"
                      }
                    >
                      {isIncome ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownRight size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {rec.partyName}
                        </p>
                        {rec.isMuted ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            Masquée
                          </Badge>
                        ) : rec.isActive ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            Projetée
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.category || "—"} · moyenne mensuelle
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={
                        isIncome
                          ? "text-sm font-medium text-green-600"
                          : "text-sm font-medium text-red-600"
                      }
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(rec.averageAmount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMuted(rec.id, !rec.isMuted)}
                      disabled={muting}
                      className="h-7 w-7"
                      title={rec.isMuted ? "Réactiver" : "Masquer"}
                    >
                      {rec.isMuted ? <Eye size={13} /> : <EyeOff size={13} />}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
