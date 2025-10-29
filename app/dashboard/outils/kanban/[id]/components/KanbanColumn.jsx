import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import { TaskCardSkeleton } from "./TaskCardSkeleton";

/**
 * Composant pour une colonne avec ses tâches dans le tableau Kanban
 */
export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
  isCollapsed,
  onToggleCollapse,
  dragHandleProps, // Props pour rendre le header draggable
  isDragging, // État de drag pour le feedback visuel
  isLoading = false, // État de chargement pour afficher les skeletons
}) {
  // Zone droppable pour les tâches
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-muted/30 rounded-xl p-2 sm:p-3 min-w-[240px] max-w-[240px] sm:min-w-[300px] sm:max-w-[300px] border border-border transition-colors duration-150 flex-shrink-0 ${
        isOver ? "bg-accent/50 border-primary/50" : ""
      } ${isDragging ? "border-primary shadow-lg" : ""}`}
    >
      <div
        {...dragHandleProps}
        className={`flex items-center justify-between py-2 ${
          isDragging ? "cursor-grabbing" : "cursor-grab hover:bg-accent/30 rounded-lg px-2 -mx-2 transition-colors duration-150"
        }`}
      >
        <div className="flex items-center gap-2 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-4 w-4 p-0 mr-1"
          >
            {isCollapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
          <button
            {...dragHandleProps}
            className={`text-muted-foreground/70 hover:text-foreground p-1 rounded hover:bg-accent/30 transition-colors touch-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            title="Faire glisser pour réorganiser"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <div
            className="w-[2px] h-4"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-medium text-foreground">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask(column.id)}
            className="h-6 w-6 p-0 text-muted-foreground cursor-pointer"
            title="Ajouter une tâche"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onEditColumn(column)}>
                <Edit className="mr-2 h-3 w-3" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteColumn(column.id)}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="mt-2 flex flex-col">
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto overflow-x-hidden pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-border/80">
              <SortableContext
                items={tasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {isLoading ? (
                    // Afficher 3 skeletons lors du chargement
                    <>
                      <TaskCardSkeleton />
                      <TaskCardSkeleton />
                      <TaskCardSkeleton />
                    </>
                  ) : (
                    <>
                      {tasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={task.position || index}
                          onEdit={onEditTask}
                          onDelete={onDeleteTask}
                        />
                      ))}
                      {tasks.length === 0 && (
                        <div className="w-full py-4 text-center text-sm text-muted-foreground">
                          Aucune tâche
                        </div>
                      )}
                    </>
                  )}
                </div>
              </SortableContext>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddTask(column.id)}
              className="w-full cursor-pointer border-dashed border-2 border-border hover:border-foreground/30 text-muted-foreground hover:bg-accent/50 mt-2 flex-shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une tâche
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
