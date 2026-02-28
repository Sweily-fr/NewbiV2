"use client";

import { useState, useEffect } from "react";
import { Clock, Euro, RotateCcw, Pencil } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
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
import { useMutation } from "@apollo/client";
import { START_TIMER, STOP_TIMER, RESET_TIMER, UPDATE_TIMER_SETTINGS, ADD_MANUAL_TIME } from "@/src/graphql/kanbanQueries";
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
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualPopoverOpen, setManualPopoverOpen] = useState(false);


  // Fonction pour mettre à jour le cache Apollo
  const updateCache = (cache, taskData) => {
    if (!taskData) return;

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

  const [resetTimer, { loading: resetting }] = useMutation(RESET_TIMER, {
    update: (cache, { data }) => {
      if (data?.resetTimer) {
        updateCache(cache, data.resetTimer);
      }
    },
    onCompleted: (data) => {
      toast.success("Timer réinitialisé");
      if (onTimerUpdate && data?.resetTimer?.timeTracking) {
        onTimerUpdate(data.resetTimer.timeTracking);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la réinitialisation du timer");
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
      if (onTimerUpdate && data?.updateTimerSettings?.timeTracking) {
        onTimerUpdate(data.updateTimerSettings.timeTracking);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  const [addManualTime, { loading: addingManualTime }] = useMutation(ADD_MANUAL_TIME, {
    update: (cache, { data }) => {
      if (data?.addManualTime) {
        updateCache(cache, data.addManualTime);
      }
    },
    onCompleted: (data) => {
      toast.success("Temps ajouté manuellement");
      if (onTimerUpdate && data?.addManualTime?.timeTracking) {
        onTimerUpdate(data.addManualTime.timeTracking);
      }
      setManualHours("");
      setManualMinutes("");
      setManualPopoverOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'ajout du temps");
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
        if (elapsedSeconds > 0) {
          total += elapsedSeconds;
        }
      }

      setCurrentTime(Math.max(0, total));
    };

    updateTime();

    if (timeTracking.isRunning) {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [timeTracking, timeTracking?.isRunning, timeTracking?.currentStartTime, timeTracking?.totalSeconds]);

  // Formater le temps en heures:minutes:secondes
  const formatTime = (seconds) => {
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

  const handleReset = async () => {
    try {
      await resetTimer({ variables: { taskId, workspaceId } });
    } catch (error) {
      console.error("Erreur reset timer:", error);
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

  const handleAddManualTime = async () => {
    const h = parseInt(manualHours) || 0;
    const m = parseInt(manualMinutes) || 0;
    const totalSeconds = h * 3600 + m * 60;
    if (totalSeconds <= 0) {
      toast.error("Veuillez entrer un temps valide");
      return;
    }
    try {
      await addManualTime({
        variables: { taskId, seconds: totalSeconds, workspaceId },
      });
    } catch (error) {
      console.error("Erreur ajout temps manuel:", error);
    }
  };

  const isRunning = timeTracking?.isRunning;
  const price = calculatePrice();
  const hasTime = currentTime > 0;

  return (
    <div className="space-y-2">
      {/* Ligne principale : timer + contrôles */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Label avec icône */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-normal">Gestion du temps</span>
        </div>

        {/* Bouton rouge circulaire */}
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

        {/* Affichage du temps + icône modifier */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-md border border-border flex-shrink-0">
          <span className="text-sm font-mono tabular-nums">
            {formatTime(currentTime)}
          </span>
          {!isRunning && (
            <Popover open={manualPopoverOpen} onOpenChange={setManualPopoverOpen}>
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
                      <Label htmlFor="manual-hours" className="text-xs text-muted-foreground">Heures</Label>
                      <Input
                        id="manual-hours"
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
                      <Label htmlFor="manual-minutes" className="text-xs text-muted-foreground">Minutes</Label>
                      <Input
                        id="manual-minutes"
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
                    disabled={addingManualTime || (!manualHours && !manualMinutes)}
                  >
                    {addingManualTime ? "Ajout..." : "Ajouter"}
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
                disabled={resetting}
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
                  Le temps enregistré ({formatTime(currentTime)}) sera remis à zéro. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
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
            onChange={(e) => setHourlyRate(e.target.value)}
            onBlur={handleSaveSettings}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveSettings();
              }
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
        <Select value={roundingOption} onValueChange={(value) => {
          setRoundingOption(value);
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

      {/* Ligne secondaire : Lancé par (en dessous) */}
      {isRunning && timeTracking?.startedBy && (
        <div className="flex items-center gap-2 pl-6 text-xs text-muted-foreground">
          <span>Lancé par</span>
          <Avatar className="h-5 w-5">
            <AvatarImage src={timeTracking.startedBy.userImage} alt={timeTracking.startedBy.userName} className="object-cover" />
            <AvatarFallback className="text-[9px]">
              {timeTracking.startedBy.userName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{timeTracking.startedBy.userName}</span>
        </div>
      )}
    </div>
  );
}
