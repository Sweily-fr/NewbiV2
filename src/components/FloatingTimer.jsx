"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { Clock, Square, ExternalLink } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { GET_ACTIVE_TIMERS, STOP_TIMER } from "@/src/graphql/kanbanQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/utils/debouncedToast";

/**
 * Composant flottant qui affiche les timers actifs en bas à droite de l'écran
 * Visible sur toutes les pages quand un timer est en cours
 */
export function FloatingTimer() {
  const router = useRouter();
  const { workspaceId } = useWorkspace();
  const [taskTimes, setTaskTimes] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  // Récupérer les tâches avec timer actif
  const { data, loading } = useQuery(GET_ACTIVE_TIMERS, {
    variables: { workspaceId },
    skip: !workspaceId,
    pollInterval: 30000,
    fetchPolicy: "cache-and-network",
  });

  // Mutation pour arrêter le timer
  const [stopTimer, { loading: stopping }] = useMutation(STOP_TIMER, {
    refetchQueries: ["GetActiveTimers"],
    onCompleted: () => {
      toast.success("Timer arrêté");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'arrêt du timer");
    },
  });

  const activeTasks = useMemo(() => data?.activeTimers || [], [data?.activeTimers]);

  // Calculer le temps pour chaque tâche
  useEffect(() => {
    if (activeTasks.length === 0) {
      setTaskTimes({});
      return;
    }

    const updateTimes = () => {
      const times = {};
      activeTasks.forEach((task) => {
        let total = task.timeTracking?.totalSeconds || 0;
        if (task.timeTracking?.isRunning && task.timeTracking?.currentStartTime) {
          const startTime = new Date(task.timeTracking.currentStartTime);
          const now = new Date();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          total += elapsedSeconds;
        }
        times[task.id] = total;
      });
      setTaskTimes(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [activeTasks]);

  // Trouver la tâche avec le plus de temps
  const longestTask = useMemo(() => {
    if (activeTasks.length === 0) return null;
    let maxTime = -1;
    let maxTask = null;
    activeTasks.forEach((task) => {
      const time = taskTimes[task.id] || 0;
      if (time > maxTime) {
        maxTime = time;
        maxTask = task;
      }
    });
    return maxTask;
  }, [activeTasks, taskTimes]);

  const longestTime = longestTask ? taskTimes[longestTask.id] || 0 : 0;

  // Formater le temps
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours >= 1) {
      return `${hours}h${minutes.toString().padStart(2, "0")}`;
    } else {
      return `${minutes}m${secs.toString().padStart(2, "0")}s`;
    }
  };

  // Arrêter un timer
  const handleStopTimer = async (taskId) => {
    await stopTimer({ variables: { taskId, workspaceId } });
  };

  // Ouvrir une tâche dans le Kanban
  const handleOpenTask = (task) => {
    router.push(`/dashboard/outils/kanban/${task.boardId}?taskId=${task.id}`);
    setIsOpen(false);
  };

  // Ne rien afficher si pas de timer actif
  if (loading && !data) return null;
  if (activeTasks.length === 0) return null;

  // Tronquer le titre si trop long
  const truncateTitle = (title, maxLength = 20) => {
    if (!title) return "";
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:shadow-md hover:bg-accent/50 transition-all text-sm"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-xs text-foreground truncate max-w-[150px]">
              {truncateTitle(longestTask?.title)}
            </span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {formatTime(longestTime)}
            </span>
            {activeTasks.length > 1 && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                +{activeTasks.length - 1}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-80 p-0"
        >
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Timers actifs ({activeTasks.length})
              </span>
            </div>
          </div>

          <ScrollArea className="max-h-80">
            <div className="p-2 space-y-1">
              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2.5 rounded-md hover:bg-accent/50 group"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs font-mono text-muted-foreground tabular-nums">
                      {formatTime(taskTimes[task.id] || 0)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-60 hover:opacity-100"
                      onClick={() => handleOpenTask(task)}
                      title="Voir la tâche"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleStopTimer(task.id)}
                      disabled={stopping}
                      title="Arrêter le timer"
                    >
                      <Square className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
