"use client";

import { useState } from "react";
import {
  useGmailConnection,
  useDisconnectGmail,
  useTriggerGmailSync,
} from "@/src/hooks/useGmailConnection";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  RefreshCw,
  Unplug,
  Clock,
  LoaderCircle,
  CornerDownLeft,
  ShieldCheck,
  AlertTriangle,
  Check,
  Mail,
  FileSearch,
  Zap,
} from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

const SCAN_PERIOD_OPTIONS = [
  { value: "1", label: "1 mois" },
  { value: "3", label: "3 mois (recommandé)" },
  { value: "6", label: "6 mois" },
  { value: "12", label: "12 mois" },
];

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function GmailConnectionDialog({ open, onOpenChange }) {
  const { connection, stats, loading, refetch } = useGmailConnection();
  const { disconnect, loading: disconnecting } = useDisconnectGmail();
  const { triggerSync, loading: syncing } = useTriggerGmailSync();
  const { workspaceId } = useWorkspace();
  const [scanPeriod, setScanPeriod] = useState("3");
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const tokenRes = await fetch("/api/auth/token", { credentials: "include" });
      const tokenData = await tokenRes.json();
      if (!tokenData.token) throw new Error("Non authentifié");

      const res = await fetch(
        `${API_URL}/gmail-connect/authorize?scanPeriodMonths=${scanPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.token}`,
            "x-organization-id": workspaceId,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      window.location.href = data.authUrl;
    } catch (err) {
      console.error("Gmail connect error:", err);
      setConnecting(false);
    }
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

  const statusConfig = {
    active: { label: "Actif", variant: "success" },
    syncing: { label: "Synchronisation...", variant: "info" },
    expired: { label: "Expiré", variant: "destructive" },
    error: { label: "Erreur", variant: "destructive" },
  };
  const currentStatus = statusConfig[connection?.status] || statusConfig.error;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
          <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
            {/* Header */}
            <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
              <DialogTitle className="text-sm font-medium flex items-center gap-2">
                <GoogleIcon className="size-4" />
                Automatisation Gmail
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground sr-only">
                Connectez votre compte Gmail pour importer automatiquement vos factures fournisseurs.
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoaderCircle className="size-5 animate-spin text-muted-foreground/40" />
              </div>
            ) : isConnected ? (
              /* ─── Connected state ─── */
              <div className="px-5 pt-4 pb-0">
                {/* Account row */}
                <div className="flex items-center justify-between px-3.5 py-3 rounded-lg border border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-white dark:bg-muted flex items-center justify-center shrink-0 ring-1 ring-border/50">
                      <GoogleIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{connection.accountEmail}</p>
                      {connection.accountName && (
                        <p className="text-xs text-muted-foreground truncate">{connection.accountName}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={currentStatus.variant} className="text-[10px] shrink-0 ml-3">
                    {currentStatus.label}
                  </Badge>
                </div>

                {/* Error */}
                {isError && connection.lastSyncError && (
                  <div className="flex items-start gap-2.5 mt-3 px-3.5 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                    <AlertTriangle className="size-3.5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">{connection.lastSyncError}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="px-3 py-3 rounded-lg border border-border/50 bg-muted/30 text-center">
                    <p className="text-xl font-semibold tabular-nums">{stats.totalEmailsScanned}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Emails scannés</p>
                  </div>
                  <div className="px-3 py-3 rounded-lg border border-border/50 bg-muted/30 text-center">
                    <p className="text-xl font-semibold tabular-nums">{stats.totalInvoicesFound}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Factures trouvées</p>
                  </div>
                  <div className="px-3 py-3 rounded-lg border border-border/50 bg-muted/30 text-center">
                    <p className="text-xl font-semibold tabular-nums text-amber-600 dark:text-amber-500">{stats.pendingReview}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">En attente</p>
                  </div>
                </div>

                {/* Last sync */}
                {stats.lastSyncAt && (
                  <div className="flex items-center gap-2 mt-3 px-3.5 py-2.5 rounded-lg border border-border/50 bg-muted/30">
                    <Clock className="size-3.5 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Dernière synchronisation{" "}
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

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/40 mt-4 -mx-5 px-5 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5"
                    onClick={() => setShowDisconnectConfirm(true)}
                  >
                    <Unplug className="size-3.5" />
                    Déconnecter
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing || connection.status === "syncing"}
                    className="gap-1.5"
                  >
                    {syncing ? (
                      <>
                        <LoaderCircle className="size-3.5 animate-spin" />
                        Synchronisation...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="size-3.5" />
                        Synchroniser
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* ─── Not connected state ─── */
              <div className="px-5 pt-5 pb-0">
                {/* Steps */}
                <div className="space-y-2">
                  {[
                    {
                      icon: Mail,
                      title: "Détection automatique",
                      description: "Scanne vos emails à la recherche de factures PDF en pièce jointe.",
                    },
                    {
                      icon: FileSearch,
                      title: "Extraction intelligente",
                      description: "Les montants, dates, fournisseurs et TVA sont extraits automatiquement via OCR.",
                    },
                    {
                      icon: Zap,
                      title: "Synchronisation continue",
                      description: "Vos nouvelles factures sont importées automatiquement toutes les 4 heures.",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 px-3.5 py-3 rounded-lg border border-border/50 bg-muted/30">
                      <div className="size-7 rounded-md bg-background flex items-center justify-center shrink-0 ring-1 ring-border/50">
                        <step.icon className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none mb-1">{step.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scan period */}
                <div className="mt-4">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
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
                <div className="flex items-center gap-2.5 mt-3 px-3.5 py-2.5 rounded-lg border border-border/50 bg-muted/30">
                  <ShieldCheck className="size-3.5 text-green-600 dark:text-green-500 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Accès en <span className="font-medium text-foreground">lecture seule</span>. Aucun email n&apos;est modifié ou supprimé.
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end border-t border-border/40 mt-4 -mx-5 px-5 py-3">
                  <Button
                    variant="primary"
                    onClick={handleConnect}
                    disabled={connecting}
                    className="gap-2"
                  >
                    {connecting ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <GoogleIcon className="size-4" />
                        Connecter Gmail
                        <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                          <CornerDownLeft className="size-3" />
                        </kbd>
                      </>
                    )}
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
              <Unplug className="size-5 text-red-500" />
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
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
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
