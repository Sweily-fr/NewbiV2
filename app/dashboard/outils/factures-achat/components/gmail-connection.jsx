"use client";

import { useState } from "react";
import {
  useGmailConnection,
  useDisconnectGmail,
  useTriggerGmailSync,
} from "@/src/hooks/useGmailConnection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Mail,
  RefreshCw,
  Unplug,
  ScanSearch,
  Clock,
  LoaderCircle,
  CornerDownLeft,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const SCAN_PERIOD_OPTIONS = [
  { value: "1", label: "1 mois" },
  { value: "3", label: "3 mois (recommandé)" },
  { value: "6", label: "6 mois" },
  { value: "12", label: "12 mois" },
];

export function GmailConnectionDialog({ open, onOpenChange }) {
  const { connection, stats, loading, refetch } = useGmailConnection();
  const { disconnect, loading: disconnecting } = useDisconnectGmail();
  const { triggerSync, loading: syncing } = useTriggerGmailSync();
  const [scanPeriod, setScanPeriod] = useState("3");
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleConnect = () => {
    const url = `${API_URL}/gmail-connect/authorize?scanPeriodMonths=${scanPeriod}`;
    window.location.href = url;
  };

  const handleDisconnect = async () => {
    if (connection?.id) {
      await disconnect(connection.id);
      setShowDisconnectConfirm(false);
      refetch();
    }
  };

  const handleSync = async () => {
    if (connection?.id) {
      await triggerSync(connection.id);
      refetch();
    }
  };

  const isConnected = connection && connection.status !== "disconnected";
  const isError = connection?.status === "error" || connection?.status === "expired";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[720px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] overflow-hidden rounded-2xl">
          <div className="bg-background rounded-xl overflow-hidden" style={{ boxShadow: "rgba(0, 0, 0, 0.07) 0px 0px 0px 1px" }}>
            <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
              <DialogTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="size-4" />
                Automatiser les factures fournisseurs
              </DialogTitle>
            </DialogHeader>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground/50" />
              </div>
            ) : isConnected ? (
              /* ─── Connected state ─── */
              <div className="space-y-5 px-5 pt-4 pb-0">
                {/* Account info */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Compte connecté
                  </label>
                  <div className="flex items-center justify-between px-3 py-2.5 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <Mail className="size-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{connection.accountEmail}</p>
                        {connection.accountName && (
                          <p className="text-xs text-muted-foreground">{connection.accountName}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={isError ? "destructive" : "default"}
                      className="text-[10px] shrink-0"
                    >
                      {connection.status === "active"
                        ? "Actif"
                        : connection.status === "syncing"
                          ? "Sync..."
                          : connection.status === "expired"
                            ? "Expiré"
                            : "Erreur"}
                    </Badge>
                  </div>
                </div>

                {/* Error message */}
                {isError && connection.lastSyncError && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="size-3.5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600">{connection.lastSyncError}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Statistiques
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="px-3 py-2.5 bg-muted/50 rounded-lg border border-border/50 text-center">
                      <p className="text-lg font-medium">{stats.totalEmailsScanned}</p>
                      <p className="text-[11px] text-muted-foreground">Emails scannés</p>
                    </div>
                    <div className="px-3 py-2.5 bg-muted/50 rounded-lg border border-border/50 text-center">
                      <p className="text-lg font-medium">{stats.totalInvoicesFound}</p>
                      <p className="text-[11px] text-muted-foreground">Factures trouvées</p>
                    </div>
                    <div className="px-3 py-2.5 bg-muted/50 rounded-lg border border-border/50 text-center">
                      <p className="text-lg font-medium text-amber-600">{stats.pendingReview}</p>
                      <p className="text-[11px] text-muted-foreground">En attente</p>
                    </div>
                  </div>
                </div>

                {/* Last sync info */}
                {stats.lastSyncAt && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Dernière synchronisation :{" "}
                      <span className="font-medium text-foreground">
                        {new Date(stats.lastSyncAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>
                )}

                {/* Actions footer */}
                <div className="flex items-center justify-between border-t border-border/40 mt-3 px-5 py-3 -mx-5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setShowDisconnectConfirm(true)}
                  >
                    <Unplug className="size-3.5 mr-1.5" />
                    Déconnecter
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSync}
                    disabled={syncing || connection.status === "syncing"}
                    className="gap-2"
                  >
                    {syncing ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Synchronisation...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="size-3.5" />
                        Synchroniser maintenant
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* ─── Not connected state ─── */
              <div className="space-y-5 px-5 pt-4 pb-0">
                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Comment ça marche ?
                  </label>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                      <ScanSearch className="size-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Scanne automatiquement vos emails contenant des factures PDF
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                      <FileText className="size-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Extrait les montants, dates et fournisseurs via OCR
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                      <RefreshCw className="size-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Synchronisation automatique toutes les 4 heures
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scan period */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Période du scan initial
                  </label>
                  <Select value={scanPeriod} onValueChange={setScanPeriod}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCAN_PERIOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Security note */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                  <ShieldCheck className="size-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Accès en <span className="font-medium text-foreground">lecture seule</span>. Nous ne modifions ni ne supprimons vos emails.
                  </p>
                </div>

                {/* Connect button footer */}
                <div className="flex justify-end border-t border-border/40 mt-3 px-5 py-3 -mx-5">
                  <Button
                    variant="primary"
                    onClick={handleConnect}
                    className="gap-2"
                  >
                    Connecter mon compte Gmail
                    <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                      <CornerDownLeft className="size-3" />
                    </kbd>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Disconnect confirmation */}
      <AlertDialog open={showDisconnectConfirm} onOpenChange={setShowDisconnectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Unplug className="h-5 w-5 text-red-500" />
              Déconnecter Gmail ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Les factures déjà importées seront conservées. La synchronisation automatique sera arrêtée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDisconnectConfirm(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {disconnecting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Déconnexion...
                </>
              ) : (
                "Confirmer la déconnexion"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
