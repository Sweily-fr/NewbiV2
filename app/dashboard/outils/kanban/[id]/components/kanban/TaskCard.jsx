'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, Trash2, Edit, Check, Clock, Flag, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { useDeleteTask } from '@/src/hooks/useKanban';
import EditTaskDialog from './EditTaskDialog';

const PRIORITY_COLORS = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
};

export default function TaskCard({ task, index, onMoveTask }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteTask } = useDeleteTask();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        setIsDeleting(true);
        await deleteTask({
          variables: { id: task.id },
          update: (cache) => {
            // Supprimer la tâche du cache
            cache.modify({
              id: `Board:${task.boardId}`,
              fields: {
                tasks(existingTasks = [], { readField }) {
                  return existingTasks.filter(
                    (taskRef) => task.id !== readField('id', taskRef)
                  );
                },
              },
            });
          },
        });
      } catch (error) {
        console.error('Erreur lors de la suppression de la tâche:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const completedChecklistItems = task.checklist?.filter(item => item.completed).length || 0;
  const totalChecklistItems = task.checklist?.length || 0;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group bg-white rounded-lg border border-gray-200 p-4 space-y-3 cursor-grab active:cursor-grabbing shadow-sm',
          isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'hover:shadow-md'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm leading-tight">{task.title}</h4>
              <button
                {...attributes}
                {...listeners}
                className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {task.description && (
              <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Tags en haut */}
            {task.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: tag.bg || '#f3f4f6',
                      color: tag.text || '#374151',
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Informations en bas */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                {task.dueDate && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{format(new Date(task.dueDate), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                )}
                
                {task.priority && (
                  <div className="flex items-center">
                    <Flag className={cn(
                      'h-3 w-3 mr-1',
                      task.priority === 'HIGH' ? 'text-red-500' :
                      task.priority === 'MEDIUM' ? 'text-yellow-500' : 'text-blue-500'
                    )} />
                    <span className={cn(
                      task.priority === 'HIGH' ? 'text-red-600' :
                      task.priority === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                    )}>
                      {task.priority === 'HIGH' ? 'Haute' : 
                       task.priority === 'MEDIUM' ? 'Moyenne' : 'Basse'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-400">
                {task.assignee && (
                  <span>{task.assignee.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            {totalChecklistItems > 0 && (
              <div className="mt-2">
                <div className="flex items-center text-xs text-gray-500">
                  <Check className="h-3 w-3 mr-1" />
                  {completedChecklistItems} sur {totalChecklistItems} terminés
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{
                      width: `${(completedChecklistItems / totalChecklistItems) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {(isHovered || isDeleting) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-sm">
                  <Edit className="mr-2 h-3.5 w-3.5" />
                  <span>Modifier</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 text-sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span className="flex items-center">
                      <span className="h-3.5 w-3.5 mr-2 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      Suppression...
                    </span>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      <span>Supprimer</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <EditTaskDialog
        task={task}
        open={isEditing}
        onOpenChange={setIsEditing}
        onTaskUpdated={() => {
          // La mise à jour sera gérée par le cache d'Apollo
        }}
      />
    </>
  );
}