"use client";

import { useState, useEffect } from "react";
import { Clock, Euro, ChevronDown } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { useMutation } from "@apollo/client";
import { START_TIMER, STOP_TIMER, UPDATE_TIMER_SETTINGS } from "@/src/graphql/kanbanQueries";
import { toast } from "@/src/utils/debouncedToast";
import { useWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Composant pour gérer le timer et les paramètres de facturation dans la TaskModal
 * @param {string} taskId - ID de la tâche
 * @param {object} timeTracking - Données de suivi du temps (passées en prop)
 * @param {function} onTimerUpdate - Callback appelé après une action sur le timer
 */
export function TimerControls({ taskId, timeTracking, onTimerUpdate }) {
  const { workspaceId } = useWorkspace();
  const [currentTime, setCurrentTime] = useState(0);
  const [hourlyRate, setHourlyRate] = useState("");
  const [roundingOption, setRoundingOption] = useState("none");
  const [showSettings, setShowSettings] = useState(false);


  // Fonction pour mettre à jour le cache Apollo
  const updateCache = (cache, taskData) => {
    if (!taskData) return;
    
    // Mettre à jour le cache Apollo avec les nouvelles données de la tâche
    cache.modify({
      id: cache.identify({ __typename: 'Task', id: taskData.id }),
      fields: {
        timeTracking() {
          return taskData.timeTracking;
        },
      },
    });
  };

  // Mutations
  const [startTimer, { loading: starting }] = useMutation(START_TIMER, {
    update: (cache, { data }) => {
      if (data?.startTimer) {
        updateCache(cache, data.startTimer);
      }
    },
    onCompleted: (data) => {
      toast.success("Timer démarré");
      if (onTimerUpdate && data?.startTimer?.timeTracking) {
        onTimerUpdate(data.startTimer.timeTracking);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors du démarrage du timer");
    },
  });

  const [stopTimer, { loading: stopping }] = useMutation(STOP_TIMER, {
    update: (cache, { data }) => {
      if (data?.stopTimer) {
        updateCache(cache, data.stopTimer);
      }
    },
    onCompleted: (data) => {
      toast.success("Timer arrêté");
      if (onTimerUpdate && data?.stopTimer?.timeTracking) {
        onTimerUpdate(data.stopTimer.timeTracking);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'arrêt du timer");
    },
  });

  const [updateSettings, { loading: updating }] = useMutation(UPDATE_TIMER_SETTINGS, {
    update: (cache, { data }) => {
      if (data?.updateTimerSettings) {
        updateCache(cache, data.updateTimerSettings);
      }
    },
    onCompleted: (data) => {
      toast.success("Paramètres mis à jour");
      setShowSettings(false);
      if (onTimerUpdate && data?.updateTimerSettings?.timeTracking) {
        onTimerUpdate(data.updateTimerSettings.timeTracking);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  // Synchroniser les états locaux avec les props timeTracking
  useEffect(() => {
    if (timeTracking) {
      setHourlyRate(timeTracking.hourlyRate || "");
      setRoundingOption(timeTracking.roundingOption || "none");
    }
  }, [timeTracking?.hourlyRate, timeTracking?.roundingOption]);

  // Calculer le temps total en secondes
  useEffect(() => {
    if (!timeTracking) {
      setCurrentTime(0);
      return;
    }

    const updateTime = () => {
      let total = timeTracking.totalSeconds || 0;
      
      if (timeTracking.isRunning && timeTracking.currentStartTime) {
        const startTime = new Date(timeTracking.currentStartTime);
        const now = new Date();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        // Protection contre les valeurs négatives (problème de fuseau horaire)
        if (elapsedSeconds > 0) {
          total += elapsedSeconds;
        }
      }
      
      // S'assurer que le total n'est jamais négatif
      setCurrentTime(Math.max(0, total));
    };

    updateTime();

    if (timeTracking.isRunning) {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [timeTracking, timeTracking?.isRunning, timeTracking?.currentStartTime, timeTracking?.totalSeconds]);

  // Formater le temps en heures:minutes:secondes (format ClickUp)
  const formatTime = (seconds) => {
    // Protection contre les valeurs négatives
    const safeSeconds = Math.max(0, seconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculer le prix
  const calculatePrice = () => {
    if (!hourlyRate || currentTime <= 0) return null;

    const hours = Math.max(0, currentTime) / 3600;
    let billableHours = hours;
    
    if (roundingOption === 'up') {
      billableHours = Math.ceil(hours);
    } else if (roundingOption === 'down') {
      billableHours = Math.floor(hours);
    }
    
    const price = billableHours * parseFloat(hourlyRate);
    return price.toFixed(2);
  };

  const handleStartStop = async () => {
    try {
      if (timeTracking?.isRunning) {
        await stopTimer({ variables: { taskId, workspaceId } });
      } else {
        await startTimer({ variables: { taskId, workspaceId } });
      }
    } catch (error) {
      console.error("Erreur timer:", error);
    }
  };

  const handleSaveSettings = async () => {
    const rate = hourlyRate ? parseFloat(hourlyRate) : null;
    await updateSettings({
      variables: {
        taskId,
        hourlyRate: rate,
        roundingOption,
        workspaceId,
      },
    });
  };

  const isRunning = timeTracking?.isRunning;
  const price = calculatePrice();

  return (
    <div className="space-y-3">
      {/* Gestion du temps - Style ClickUp */}
      <div className="flex items-center gap-3">
        {/* Label avec icône */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-normal">Gestion du temps</span>
        </div>

        {/* Bouton rouge circulaire quand actif */}
        <button
          onClick={handleStartStop}
          disabled={starting || stopping}
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
            isRunning 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-gray-300 hover:bg-gray-400'
          }`}
          title={isRunning ? "Arrêter le timer" : "Démarrer le timer"}
        >
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-white' : 'bg-gray-600'}`} />
        </button>
        
        {/* Affichage du temps */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border border-border flex-shrink-0">
          <span className="text-sm font-mono tabular-nums">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Prix à l'heure - Input inline */}
        <Input
          type="number"
          min="0"
          step="0.01"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          onBlur={handleSaveSettings}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveSettings();
            }
          }}
          placeholder="Prix/h"
          className="w-28 h-9 flex-shrink-0"
          title="Prix à l'heure"
        />

        {/* Arrondi - Select inline */}
        <Select value={roundingOption} onValueChange={(value) => {
          setRoundingOption(value);
          // Sauvegarder automatiquement
          setTimeout(() => {
            updateSettings({
              variables: {
                taskId,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
                roundingOption: value,
                workspaceId,
              },
            });
          }, 0);
        }}>
          <SelectTrigger className="w-40 h-9 flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Proportionnel</SelectItem>
            <SelectItem value="up">Arrondir ↑</SelectItem>
            <SelectItem value="down">Arrondir ↓</SelectItem>
          </SelectContent>
        </Select>

        {/* Prix estimé - Affiché directement */}
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
