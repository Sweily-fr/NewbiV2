import { Plus, Edit, Trash2, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DroppableColumn } from './DroppableColumn';
import { TaskCard } from './TaskCard';

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
  onToggleCollapse 
}) {
  return (
    <DroppableColumn column={column}>
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-6 w-6 p-0 mr-1"
          >
            {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-foreground">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask(column.id)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditColumn(column)}>
                <Edit className="mr-2 h-3 w-3" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteColumn(column.id)} className="text-red-600">
                <Trash2 className="mr-2 h-3 w-3" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-2 space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
              {tasks.length === 0 && (
                <div className="w-full py-4 text-center text-sm text-muted-foreground">
                  Aucune tâche
                </div>
              )}
            </div>
          </SortableContext>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask(column.id)}
            className="w-full border-dashed border-2 border-border hover:border-foreground/30 text-muted-foreground hover:bg-accent/50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une tâche
          </Button>
        </>
      )}
    </DroppableColumn>
  );
}
