"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { RefreshCw, Settings, MoreHorizontal, Trash2, CheckCircle2, AlertCircle, Clock, ChevronDown, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Switch } from "@/src/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/src/components/ui/tooltip";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useDisconnectCalendar, useSyncCalendar, useUpdateAutoSync } from "@/src/hooks/useCalendarConnections";
import { UPDATE_SELECTED_CALENDARS } from "@/src/graphql/mutations/calendarConnection";
import { GET_CALENDAR_CONNECTIONS } from "@/src/graphql/queries/calendarConnection";
import { CalendarSelectorDialog } from "./calendar-selector-dialog";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";

const providerInfo = {
  google: {
    name: "Google",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
    iconBg: "bg-white dark:bg-zinc-800",
  },
  microsoft: {
    name: "Outlook",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
      </svg>
    ),
    iconBg: "bg-white dark:bg-zinc-800",
  },
  apple: {
    name: "iCloud",
    icon: (
      <svg className="h-4 w-4 text-zinc-800 dark:text-zinc-200" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    iconBg: "bg-zinc-100 dark:bg-zinc-800",
  },
};

const statusConfig = {
  active: { label: "Connecte", variant: "success", icon: CheckCircle2 },
  expired: { label: "Expire", variant: "warning", icon: AlertCircle },
  error: { label: "Erreur", variant: "error", icon: AlertCircle },
};

export function CalendarConnectionCard({ connection, onRefresh }) {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { disconnect, loading: disconnecting } = useDisconnectCalendar();
  const { sync, loading: syncing } = useSyncCalendar();
  const { updateAutoSync, loading: togglingAutoSync } = useUpdateAutoSync();

  const [updateSelectedCalendars, { loading: toggling }] = useMutation(UPDATE_SELECTED_CALENDARS, {
    refetchQueries: [{ query: GET_CALENDAR_CONNECTIONS }, "GetEvents"],
  });

  const info = providerInfo[connection.provider] || providerInfo.google;
  const status = statusConfig[connection.status] || statusConfig.active;

  const handleSync = async () => {
    await sync(connection.id);
    onRefresh?.();
  };

  const handleDisconnect = async () => {
    await disconnect(connection.id);
    setShowDisconnectDialog(false);
    onRefresh?.();
  };

  const allCalendars = connection.selectedCalendars || [];
  const enabledCalendars = allCalendars.filter((c) => c.enabled);

  const handleToggleCalendar = async (calendarId) => {
    const updatedCalendars = allCalendars.map((cal) => ({
      calendarId: cal.calendarId,
      name: cal.name,
      color: cal.color || null,
      enabled: cal.calendarId === calendarId ? !cal.enabled : cal.enabled,
    }));

    try {
      const result = await updateSelectedCalendars({
        variables: {
          input: {
            connectionId: connection.id,
            selectedCalendars: updatedCalendars,
          },
        },
      });

      if (!result.data?.updateSelectedCalendars?.success) {
        toast.error("Erreur lors de la mise a jour");
      }
    } catch (error) {
      console.error("Erreur toggle calendrier:", error);
      toast.error("Erreur lors de la mise a jour");
    }
  };

  return (
    <>
      <div className="group rounded-xl border border-border/60 bg-card transition-all hover:border-border hover:shadow-sm">
        {/* Main content */}
        <div className="p-3">
          {/* Header: icon + name + status + menu */}
          <div className="flex items-center gap-2.5">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 shadow-sm", info.iconBg)}>
              {info.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">{info.name}</span>
                <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
                  {status.label}
                </Badge>
              </div>
              {connection.accountEmail && (
                <p className="text-xs text-muted-foreground truncate">{connection.accountEmail}</p>
              )}
            </div>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-1 shrink-0"
                  onFocus={(e) => e.preventDefault()}
                >
                  <span className="text-[10px] text-muted-foreground">Auto.</span>
                  <Switch
                    checked={connection.autoSync || false}
                    onCheckedChange={(checked) => updateAutoSync(connection.id, checked)}
                    disabled={togglingAutoSync}
                    className="shrink-0 scale-75 origin-right data-[state=checked]:bg-[#5b50FF]"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                Les nouveaux événements et tâches Newbi seront automatiquement envoyés vers ce calendrier
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={cn("h-3.5 w-3.5 mr-2", syncing && "animate-spin")} />
                  Synchroniser
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCalendarSelector(true)}>
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  Gerer les calendriers
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDisconnectDialog(true)}
                  disabled={disconnecting}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Deconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta info + expand toggle */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {allCalendars.length > 0 && (
                <span>{enabledCalendars.length}/{allCalendars.length} calendrier{allCalendars.length > 1 ? "s" : ""}</span>
              )}
              {allCalendars.length > 0 && connection.lastSyncAt && (
                <span className="text-border">|</span>
              )}
              {connection.lastSyncAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true, locale: fr })}
                </span>
              )}
            </div>
            {allCalendars.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
              </button>
            )}
          </div>

          {/* Error display */}
          {connection.lastSyncError && (
            <p className="mt-1.5 text-[11px] text-red-500 truncate" title={connection.lastSyncError}>
              {connection.lastSyncError}
            </p>
          )}
        </div>

        {/* Expandable calendar list */}
        {expanded && allCalendars.length > 0 && (
          <div className="border-t border-border/40 px-3 py-2 space-y-1">
            {allCalendars.map((cal) => (
              <div
                key={cal.calendarId}
                className="flex items-center justify-between py-1 group/cal"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {cal.color ? (
                    <div
                      className={cn("h-2.5 w-2.5 rounded-full shrink-0 transition-opacity", !cal.enabled && "opacity-30")}
                      style={{ backgroundColor: cal.color }}
                    />
                  ) : (
                    <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 bg-muted-foreground/40 transition-opacity", !cal.enabled && "opacity-30")} />
                  )}
                  <span className={cn("text-xs truncate transition-colors", cal.enabled ? "text-foreground" : "text-muted-foreground")}>
                    {cal.name}
                  </span>
                </div>
                <Switch
                  checked={cal.enabled}
                  onCheckedChange={() => handleToggleCalendar(cal.calendarId)}
                  disabled={toggling}
                  className="shrink-0 scale-75 origin-right data-[state=checked]:bg-[#5b50FF]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deconnecter {info.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les evenements importes depuis ce calendrier seront supprimes de Newbi.
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-red-500 hover:bg-red-600"
            >
              {disconnecting ? "Deconnexion..." : "Deconnecter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CalendarSelectorDialog
        isOpen={showCalendarSelector}
        onClose={() => setShowCalendarSelector(false)}
        connection={connection}
      />
    </>
  );
}
