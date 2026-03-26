"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Euro, RotateCcw, Pencil, Play, Square } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useMutation } from "@apollo/client";
import { START_TIMER, STOP_TIMER, RESET_TIMER, UPDATE_TIMER_SETTINGS, ADD_MANUAL_TIME } from "@/src/graphql/kanbanQueries";
import { toast } from "@/src/utils/debouncedToast";
import { useWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Composant pour gérer le timer et les paramètres de facturation
 */
export function TimerControls({ taskId, timeTracking, onTimerUpdate }) {
  const { workspaceId } = useWorkspace();
  const [currentTime, setCurrentTime] = useState(0);
  const [hourlyRate, setHourlyRate] = useState("");
  const [roundingOption, setRoundingOption] = useState("none");
  const [manualInput, setManualInput] = useState("");
  const [showManual, setShowManual] = useState(false);

  const updateCache = (cache, data, field) => {
    if (!data?.[field]) return;
    cache.modify({
      id: cache.identify({ __typename: "Task", id: data[field].id }),
      fields: { timeTracking() { return data[field].timeTracking; } },
    });
    onTimerUpdate?.(data[field].timeTracking);
  };

  const [startTimer, { loading: starting }] = useMutation(START_TIMER, {
    update: (cache, { data }) => updateCache(cache, data, "startTimer"),
    onError: (e) => toast.error(e.message || "Erreur démarrage timer"),
  });
  const [stopTimer, { loading: stopping }] = useMutation(STOP_TIMER, {
    update: (cache, { data }) => updateCache(cache, data, "stopTimer"),
    onError: (e) => toast.error(e.message || "Erreur arrêt timer"),
  });
  const [resetTimer, { loading: resetting }] = useMutation(RESET_TIMER, {
    update: (cache, { data }) => updateCache(cache, data, "resetTimer"),
    onError: (e) => toast.error(e.message || "Erreur reset timer"),
  });
  const [updateSettings] = useMutation(UPDATE_TIMER_SETTINGS, {
    update: (cache, { data }) => updateCache(cache, data, "updateTimerSettings"),
  });
  const [addManualTime, { loading: addingManual }] = useMutation(ADD_MANUAL_TIME, {
    update: (cache, { data }) => updateCache(cache, data, "addManualTime"),
    onError: (e) => toast.error(e.message || "Erreur ajout temps"),
  });

  useEffect(() => {
    if (timeTracking) {
      setHourlyRate(timeTracking.hourlyRate || "");
      setRoundingOption(timeTracking.roundingOption || "none");
    }
  }, [timeTracking?.hourlyRate, timeTracking?.roundingOption]);

  useEffect(() => {
    if (!timeTracking) { setCurrentTime(0); return; }
    const update = () => {
      let total = timeTracking.totalSeconds || 0;
      if (timeTracking.isRunning && timeTracking.currentStartTime) {
        total += Math.max(0, Math.floor((new Date() - new Date(timeTracking.currentStartTime)) / 1000));
      }
      setCurrentTime(Math.max(0, total));
    };
    update();
    if (timeTracking.isRunning) {
      const iv = setInterval(update, 1000);
      return () => clearInterval(iv);
    }
  }, [timeTracking, timeTracking?.isRunning, timeTracking?.currentStartTime, timeTracking?.totalSeconds]);

  const formatTime = (s) => {
    const safe = Math.max(0, s);
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const sec = safe % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatShort = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleStartStop = async () => {
    try {
      if (timeTracking?.isRunning) await stopTimer({ variables: { taskId, workspaceId } });
      else await startTimer({ variables: { taskId, workspaceId } });
    } catch (e) { console.error("Timer error:", e); }
  };

  const handleReset = async () => {
    try { await resetTimer({ variables: { taskId, workspaceId } }); } catch (e) { console.error(e); }
  };

  const handleManualAdd = async () => {
    const match = manualInput.match(/^(\d+)h?\s*(\d*)m?$/i);
    if (!match) { toast.error("Format: 1h 30m ou 45m"); return; }
    const h = parseInt(match[1]) || 0;
    const m = parseInt(match[2]) || 0;
    const totalSec = h * 3600 + m * 60;
    if (totalSec <= 0) return;
    try {
      await addManualTime({ variables: { taskId, seconds: totalSec, workspaceId } });
      setManualInput("");
      setShowManual(false);
    } catch (e) { console.error(e); }
  };

  const handleSaveSettings = useCallback(async () => {
    await updateSettings({
      variables: { taskId, hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null, roundingOption, workspaceId },
    });
  }, [taskId, hourlyRate, roundingOption, workspaceId, updateSettings]);

  const isRunning = timeTracking?.isRunning;
  const hasTime = currentTime > 0;
  const price = hourlyRate && currentTime > 0 ? (() => {
    const hours = currentTime / 3600;
    const billable = roundingOption === 'up' ? Math.ceil(hours) : roundingOption === 'down' ? Math.floor(hours) : hours;
    return (billable * parseFloat(hourlyRate)).toFixed(2);
  })() : null;

  return (
    <div className="w-full">
      {/* Header — temps total */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Temps suivi</span>
        <span className="text-sm font-mono tabular-nums text-foreground font-semibold">{formatShort(currentTime)}</span>
      </div>

      {/* Timer principal */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 h-10 rounded-lg border border-border bg-background px-3">
          <span className="flex-1 text-sm font-mono tabular-nums text-foreground/80">
            {formatTime(currentTime)}
          </span>
          <button
            onClick={handleStartStop}
            disabled={starting || stopping}
            className={`h-7 w-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-[#5A50FF] hover:bg-[#4a42d4]'
            }`}
            title={isRunning ? "Arrêter" : "Démarrer"}
          >
            {isRunning ? (
              <Square className="h-3 w-3 fill-white text-white" />
            ) : (
              <Play className="h-3 w-3 fill-white text-white ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Lancé par */}
      {isRunning && timeTracking?.startedBy && (
        <div className="px-4 pb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Lancé par</span>
          <Avatar className="h-4 w-4">
            <AvatarImage src={timeTracking.startedBy.userImage} className="object-cover" />
            <AvatarFallback className="text-[7px]">
              {timeTracking.startedBy.userName?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{timeTracking.startedBy.userName}</span>
        </div>
      )}

      {/* Séparateur */}
      <div className="border-t border-border/40" />

      {/* Ajouter manuellement */}
      <div className="px-4 py-2.5">
        {!showManual ? (
          <button
            onClick={() => setShowManual(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
            disabled={isRunning}
          >
            <Pencil className="h-3 w-3" />
            Ajouter du temps manuellement
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Ex: 1h 30m"
                className="flex-1 h-8 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:ring-1 focus:ring-[#5A50FF]/30 focus:border-ring placeholder:text-muted-foreground/40"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualAdd(); if (e.key === 'Escape') setShowManual(false); }}
              />
              <Button size="sm" className="h-8 px-3 text-xs bg-[#5A50FF] hover:bg-[#4a42d4] text-white" onClick={handleManualAdd} disabled={addingManual || !manualInput.trim()}>
                Ajouter
              </Button>
            </div>
            <button onClick={() => setShowManual(false)} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Annuler</button>
          </div>
        )}
      </div>

      {/* Séparateur */}
      <div className="border-t border-border/40" />

      {/* Facturation */}
      <div className="px-4 py-2.5 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Taux horaire</Label>
            <div className="relative mt-0.5">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                onBlur={handleSaveSettings}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSettings(); }}
                placeholder="0.00"
                className="h-8 pr-8 text-sm"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/50 pointer-events-none">€/h</span>
            </div>
          </div>
          <div className="flex-1">
            <Label className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Arrondi</Label>
            <Select value={roundingOption} onValueChange={(v) => {
              setRoundingOption(v);
              updateSettings({ variables: { taskId, hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null, roundingOption: v, workspaceId } });
            }}>
              <SelectTrigger className="h-8 text-sm mt-0.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Proportionnel</SelectItem>
                <SelectItem value="up">Arrondir ↑</SelectItem>
                <SelectItem value="down">Arrondir ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prix estimé */}
        {price && (
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/40 rounded-md">
            <span className="text-xs text-muted-foreground">Estimation</span>
            <span className="text-sm font-semibold">{price} €</span>
          </div>
        )}
      </div>

      {/* Reset */}
      {hasTime && !isRunning && (
        <>
          <div className="border-t border-border/40" />
          <div className="px-4 py-2">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="text-xs text-red-500 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              Réinitialiser le temps
            </button>
          </div>
        </>
      )}
    </div>
  );
}
