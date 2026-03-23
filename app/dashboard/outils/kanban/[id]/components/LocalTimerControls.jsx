"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Euro, RotateCcw, Pencil } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Label } from "@/src/components/ui/label";

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
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualPopoverOpen, setManualPopoverOpen] = useState(false);
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

  // Remonter les données au parent à chaque changement
  // On passe currentStartTime pour que le parent puisse calculer le temps final à la création
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
      // Stop
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
      // Start
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

  const handleAddManualTime = () => {
    const h = parseInt(manualHours) || 0;
    const m = parseInt(manualMinutes) || 0;
    const seconds = h * 3600 + m * 60;
    if (seconds <= 0) return;

    const newTotal = totalSeconds + seconds;
    setTotalSeconds(newTotal);
    setManualHours("");
    setManualMinutes("");
    setManualPopoverOpen(false);
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
    <div className="space-y-2">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-normal">Gestion du temps</span>
        </div>

        {/* Bouton start/stop */}
        <button
          onClick={handleStartStop}
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
            isRunning
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : "bg-gray-300 hover:bg-gray-400"
          }`}
          title={isRunning ? "Arrêter le timer" : "Démarrer le timer"}
        >
          <div
            className={`w-2 h-2 rounded-full ${isRunning ? "bg-white" : "bg-gray-600"}`}
          />
        </button>

        {/* Affichage du temps */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-md border border-border flex-shrink-0">
          <span className="text-sm font-mono tabular-nums">
            {formatTime(currentTime)}
          </span>
          {!isRunning && (
            <Popover
              open={manualPopoverOpen}
              onOpenChange={setManualPopoverOpen}
            >
              <PopoverTrigger asChild>
                <button
                  className="ml-1 text-muted-foreground hover:text-blue-500 transition-colors"
                  title="Ajouter du temps manuellement"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Ajouter du temps</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label
                        htmlFor="local-manual-hours"
                        className="text-xs text-muted-foreground"
                      >
                        Heures
                      </Label>
                      <Input
                        id="local-manual-hours"
                        type="number"
                        min="0"
                        max="99"
                        value={manualHours}
                        onChange={(e) => setManualHours(e.target.value)}
                        placeholder="0"
                        className="h-8"
                      />
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor="local-manual-minutes"
                        className="text-xs text-muted-foreground"
                      >
                        Minutes
                      </Label>
                      <Input
                        id="local-manual-minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(e.target.value)}
                        placeholder="0"
                        className="h-8"
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleAddManualTime}
                    disabled={!manualHours && !manualMinutes}
                  >
                    Ajouter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Bouton réinitialiser */}
        {hasTime && !isRunning && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Réinitialiser le timer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser le timer ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le temps enregistré ({formatTime(currentTime)}) sera remis à
                  zéro. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Réinitialiser
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Prix à l'heure */}
        <div className="relative flex-shrink-0">
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
            className="w-28 sm:w-32 h-9 pr-10"
            title="Prix à l'heure"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            €/h
          </span>
        </div>

        {/* Arrondi */}
        <Select value={roundingOption} onValueChange={handleRoundingChange}>
          <SelectTrigger className="w-32 sm:w-40 h-9 flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Proportionnel</SelectItem>
            <SelectItem value="up">Arrondir ↑</SelectItem>
            <SelectItem value="down">Arrondir ↓</SelectItem>
          </SelectContent>
        </Select>

        {/* Prix estimé */}
        {price && (
          <div className="px-3 py-1.5 bg-muted/50 rounded-md border border-border inline-flex items-center gap-1.5 flex-shrink-0 ml-auto">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{price}€</span>
          </div>
        )}
      </div>
    </div>
  );
}
