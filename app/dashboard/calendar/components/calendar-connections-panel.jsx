"use client";

import { useState, useCallback } from "react";
import { Link2, ChevronRight, Loader2, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "@/src/components/ui/sonner";
import { useCalendarConnections } from "@/src/hooks/useCalendarConnections";
import { CalendarConnectionCard } from "./calendar-connection-card";
import { AppleCredentialsDialog } from "./apple-credentials-dialog";
import { useBetterAuthJWT } from "@/src/hooks/useBetterAuthJWT";
import { cn } from "@/src/lib/utils";

const providers = [
  {
    id: "google",
    name: "Google Calendar",
    description: "Gmail, Google Workspace",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
    iconBg: "bg-white dark:bg-zinc-800 border-blue-100 dark:border-blue-900/50",
  },
  {
    id: "microsoft",
    name: "Microsoft Outlook",
    description: "Outlook, Office 365",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
      </svg>
    ),
    iconBg: "bg-white dark:bg-zinc-800 border-violet-100 dark:border-violet-900/50",
  },
  {
    id: "apple",
    name: "Apple Calendar",
    description: "iCloud, macOS, iOS",
    icon: (
      <svg className="h-5 w-5 text-zinc-800 dark:text-zinc-200" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    iconBg: "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
  },
];

export function CalendarConnectionsPanel() {
  const { connections, loading, refetch } = useCalendarConnections();
  const [showAppleDialog, setShowAppleDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const { jwtToken, isReady } = useBetterAuthJWT();

  const connectedProviders = new Set(
    connections.filter((c) => c.status !== "disconnected").map((c) => c.provider)
  );

  const availableProviders = providers.filter((p) => !connectedProviders.has(p.id));

  const handleCalendarConnect = useCallback(async (provider) => {
    if (!jwtToken) {
      toast.error("Session non disponible. Veuillez rafraichir la page et reessayer.");
      return;
    }

    if (provider === "apple") {
      setShowAppleDialog(true);
      return;
    }

    setConnecting(provider);
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
      const response = await fetch(`${apiUrl}/calendar-connect/${provider}/authorize`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Erreur ${response.status}`);
      }

      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("URL d'autorisation non recue du serveur");
      }
    } catch (error) {
      console.error(`Erreur connexion ${provider} Calendar:`, error);
      const providerName = providers.find((p) => p.id === provider)?.name || provider;
      toast.error(`Impossible de se connecter a ${providerName}`, {
        description: error.message || "Veuillez reessayer.",
      });
    } finally {
      setConnecting(null);
    }
  }, [jwtToken]);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 font-normal"
          >
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Calendriers</span>
            {connections.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {connections.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:w-[460px] sm:max-w-[460px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-base">Calendriers externes</SheetTitle>
            <SheetDescription className="text-xs">
              Synchronisez vos calendriers pour centraliser vos evenements.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-4 space-y-5 px-4">
            {/* Connected calendars */}
            {connections.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Connectes
                  </h3>
                  <span className="text-xs text-muted-foreground">{connections.length}/3</span>
                </div>
                <div className="space-y-2">
                  {connections.map((connection) => (
                    <CalendarConnectionCard
                      key={connection.id}
                      connection={connection}
                      onRefresh={refetch}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Available providers */}
            {availableProviders.length > 0 && (
              <>
                {connections.length > 0 && <Separator />}
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                    Ajouter
                  </h3>
                  <div className="space-y-1.5">
                    {availableProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => handleCalendarConnect(provider.id)}
                        disabled={connecting === provider.id || !isReady}
                        className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition-all hover:border-border hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-sm", provider.iconBg)}>
                          {connecting === provider.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            provider.icon
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{provider.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {connecting === provider.id ? "Connexion en cours..." : provider.description}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* All connected state */}
            {availableProviders.length === 0 && connections.length >= 3 && (
              <>
                <Separator />
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/20">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tous vos calendriers sont connectes
                  </p>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AppleCredentialsDialog
        isOpen={showAppleDialog}
        onClose={() => setShowAppleDialog(false)}
        onSuccess={refetch}
      />
    </>
  );
}
