"use client";

import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import { downloadErrorsCSV } from "@/src/utils/client-import";

export default function ImportStepResults({ results, total, isImporting }) {
  const { successCount, errors } = results;
  const processed = successCount + errors.length;
  const progress = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress */}
      {isImporting && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm">
              Import en cours... {processed} / {total}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Final summary */}
      {!isImporting && (
        <div className="space-y-4">
          {/* Success */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {successCount} contact{successCount > 1 ? "s" : ""} importé{successCount > 1 ? "s" : ""} avec succès
              </p>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/10">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    {errors.length} erreur{errors.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Error list */}
              <div className="border rounded-lg max-h-[200px] overflow-auto">
                <div className="divide-y">
                  {errors.map((err, idx) => (
                    <div key={idx} className="px-4 py-2 text-xs">
                      <span className="font-medium text-red-600 dark:text-red-400">
                        Ligne {err.row}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {err.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => downloadErrorsCSV(errors)}
              >
                <Download className="h-3.5 w-3.5" />
                Télécharger les erreurs (CSV)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
