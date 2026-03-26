import React from "react";
import { ChevronUp, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function TaskModalHeader({
  isEditing,
  board,
  taskForm,
  prevTask,
  nextTask,
  currentIndex,
  totalTasks,
  goToPrev,
  goToNext,
}) {
  if (!isEditing) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 flex-shrink-0 bg-card">
      <div className="flex items-center gap-1">
        {/* Navigation prev/next */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={goToPrev}
          disabled={!prevTask}
          title="Tâche précédente (Alt+↑)"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rotate-180"
          onClick={goToNext}
          disabled={!nextTask}
          title="Tâche suivante (Alt+↓)"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        {/* Séparateur */}
        <div className="h-4 w-px bg-border/60 mx-1" />

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
          <span>{board?.title}</span>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: board?.columns?.find(c => c.id === taskForm.columnId)?.color || '#94a3b8' }}>
            {board?.columns?.find(c => c.id === taskForm.columnId)?.title || 'Status'}
          </span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground/80 font-medium truncate max-w-[200px]">{taskForm.title}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mr-8">
        {taskForm.createdAt && (
          <span className="text-[11px] text-muted-foreground/40">
            Créé le {new Date(taskForm.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground/50">
          {currentIndex + 1} / {totalTasks}
        </span>
      </div>
    </div>
  );
}
