"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Euro, RotateCcw, Pencil, Play, Square } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

/**
 * Timer local pour le mode création de tâche (pas de mutations serveur)
 * Stocke le temps localement et le remonte via onTimeTrackingChange
 */
export function LocalTimerControls({ timeTracking, onTimeTrackingChange }) {
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hourlyRate, setHourlyRate] = useState("");
  const [roundingOption, setRoundingOption] = useState("none");
  const [manualInput, setManualInput] = useState("");
  const [showManual, setShowManual] = useState(false);
  const startTimeRef = useRef(null);

  // Synchroniser avec les props initiales
  useEffect(() => {
    if (timeTracking) {
      setTotalSeconds(timeTracking.totalSeconds || 0);
      setHourlyRate(timeTracking.hourlyRate || "");
      setRoundingOption(timeTracking.roundingOption || "none");
      setIsRunning(timeTracking.isRunning || false);
    }
  }, []);

  // Mettre à jour le temps affiché
  useEffect(() => {
    const updateTime = () => {
      let total = totalSeconds;
      if (isRunning && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        total += elapsed;
      }
      setCurrentTime(Math.max(0, total));
    };

    updateTime();

    if (isRunning) {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, totalSeconds]);

  const notifyParent = (updates = {}) => {
    const data = {
      totalSeconds: updates.totalSeconds ?? totalSeconds,
      isRunning: updates.isRunning ?? isRunning,
      currentStartTime:
        updates.currentStartTime !== undefined
          ? updates.currentStartTime
          : startTimeRef.current || null,
      hourlyRate:
        updates.hourlyRate !== undefined
          ? updates.hourlyRate
          : hourlyRate
            ? parseFloat(hourlyRate)
            : null,
      roundingOption: updates.roundingOption ?? roundingOption,
    };
    onTimeTrackingChange?.(data);
  };

  const handleStartStop = () => {
    if (isRunning) {
      const elapsed = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;
      const newTotal = totalSeconds + elapsed;
      setTotalSeconds(newTotal);
      setIsRunning(false);
      startTimeRef.current = null;
      notifyParent({
        totalSeconds: newTotal,
        isRunning: false,
        currentStartTime: null,
      });
    } else {
      startTimeRef.current = Date.now();
      setIsRunning(true);
      notifyParent({ isRunning: true, currentStartTime: startTimeRef.current });
    }
  };

  const handleReset = () => {
    setTotalSeconds(0);
    setIsRunning(false);
    startTimeRef.current = null;
    setCurrentTime(0);
    notifyParent({ totalSeconds: 0, isRunning: false, currentStartTime: null });
  };

  const handleManualAdd = () => {
    const match = manualInput.match(/^(\d+)h?\s*(\d*)m?$/i);
    if (!match) return;
    const h = parseInt(match[1]) || 0;
    const m = parseInt(match[2]) || 0;
    const seconds = h * 3600 + m * 60;
    if (seconds <= 0) return;

    const newTotal = totalSeconds + seconds;
    setTotalSeconds(newTotal);
    setManualInput("");
    setShowManual(false);
    notifyParent({ totalSeconds: newTotal });
  };

  const handleHourlyRateChange = (value) => {
    setHourlyRate(value);
  };

  const handleHourlyRateBlur = () => {
    notifyParent({ hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null });
  };

  const handleRoundingChange = (value) => {
    setRoundingOption(value);
    notifyParent({ roundingOption: value });
  };

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatShort = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const calculatePrice = () => {
    if (!hourlyRate || currentTime <= 0) return null;
    const hours = currentTime / 3600;
    let billableHours = hours;
    if (roundingOption === "up") billableHours = Math.ceil(hours);
    else if (roundingOption === "down") billableHours = Math.floor(hours);
    return (billableHours * parseFloat(hourlyRate)).toFixed(2);
  };

  const price = calculatePrice();
  const hasTime = currentTime > 0;

  return (
    <div className="w-full">
      {/* Header — temps total */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Temps suivi</span>
        <span className="text-sm font-mono tabular-nums text-foreground font-semibold">
          {formatShort(currentTime)}
        </span>
      </div>

      {/* Timer principal */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 h-10 rounded-lg border border-border bg-background px-3">
          <span className="flex-1 text-sm font-mono tabular-nums text-foreground/80">
            {formatTime(currentTime)}
          </span>
          <button
            onClick={handleStartStop}
            className={`h-7 w-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              isRunning
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[#5A50FF] hover:bg-[#4a42d4]"
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualAdd();
                  if (e.key === "Escape") setShowManual(false);
                }}
              />
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-[#5A50FF] hover:bg-[#4a42d4] text-white"
                onClick={handleManualAdd}
                disabled={!manualInput.trim()}
              >
                Ajouter
              </Button>
            </div>
            <button
              onClick={() => setShowManual(false)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Séparateur */}
      <div className="border-t border-border/40" />

      {/* Facturation */}
      <div className="px-4 py-2.5 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">
              Taux horaire
            </Label>
            <div className="relative mt-0.5">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => handleHourlyRateChange(e.target.value)}
                onBlur={handleHourlyRateBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleHourlyRateBlur();
                }}
                placeholder="0.00"
                className="h-8 pr-8 text-sm"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/50 pointer-events-none">
                €/h
              </span>
            </div>
          </div>
          <div className="flex-1">
            <Label className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">
              Arrondi
            </Label>
            <Select value={roundingOption} onValueChange={handleRoundingChange}>
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
