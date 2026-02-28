"use client";

import { useGmailConnection, useTriggerGmailSync } from "@/src/hooks/useGmailConnection";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Mail, RefreshCw, Loader2, AlertCircle } from "lucide-react";

function formatTimeAgo(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  return `il y a ${diffD}j`;
}

export function GmailStatusBanner({ onOpenGmailDialog }) {
  const { connection, stats, loading } = useGmailConnection();
  const { triggerSync, loading: syncing } = useTriggerGmailSync();

  if (loading || !connection || connection.status === "disconnected") {
    return null;
  }

  const handleSync = async () => {
    if (connection?.id) {
      await triggerSync(connection.id);
    }
  };

  const isError = connection.status === "error" || connection.status === "expired";

  return (
    <div className="mx-4 sm:mx-6 mb-3">
      <div className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${
        isError ? "border-red-200 bg-red-50" : "border-border bg-background"
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <Mail className={`h-4 w-4 shrink-0 ${isError ? "text-red-500" : "text-muted-foreground"}`} />

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm truncate">{connection.accountEmail}</span>
            <Badge
              variant={isError ? "destructive" : "default"}
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {connection.status === "active"
                ? "Connecté"
                : connection.status === "syncing"
                  ? "Sync..."
                  : connection.status === "expired"
                    ? "Expiré"
                    : "Erreur"}
            </Badge>
          </div>

          {isError && connection.lastSyncError && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[200px]">{connection.lastSyncError}</span>
            </div>
          )}

          {!isError && stats.pendingReview > 0 && (
            <button
              onClick={onOpenGmailDialog}
              className="text-xs text-amber-600 hover:underline shrink-0"
            >
              {stats.pendingReview} facture(s) en attente
            </button>
          )}

          {stats.lastSyncAt && (
            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
              Sync : {formatTimeAgo(stats.lastSyncAt)}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleSync}
          disabled={syncing || connection.status === "syncing"}
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
