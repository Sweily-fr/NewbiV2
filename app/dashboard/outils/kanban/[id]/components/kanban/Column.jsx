'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { useDeleteColumn } from '@/src/hooks/useKanban';
import TaskCard from './TaskCard';

export default function Column({ column, tasks, onAddTask, onMoveTask }) {
  const [isHovered, setIsHovered] = useState(false);
  const { deleteColumn } = useDeleteColumn();
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette colonne ? Cette action est irréversible.')) {
      try {
        setIsDeleting(true);
        await deleteColumn({
          variables: { id: column.id },
          update: (cache) => {
            // Supprimer la colonne du cache
            cache.modify({
              id: `Board:${column.boardId}`,
              fields: {
                columns(existingColumns = [], { readField }) {
                  return existingColumns.filter(
                    (colRef) => column.id !== readField('id', colRef)
                  );
                },
              },
            });
          },
        });
      } catch (error) {
        console.error('Erreur lors de la suppression de la colonne:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Définir les couleurs et icônes selon le statut
  const getColumnIcon = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('attente') || titleLower.includes('pending')) {
      return { icon: '⏳', color: '#f59e0b' }; // amber
    } else if (titleLower.includes('faire') || titleLower.includes('todo') || titleLower.includes('à faire')) {
      return { icon: '🔵', color: '#3b82f6' }; // blue
    } else if (titleLower.includes('cours') || titleLower.includes('progress') || titleLower.includes('en cours')) {
      return { icon: '🟡', color: '#eab308' }; // yellow
    } else if (titleLower.includes('terminé') || titleLower.includes('done') || titleLower.includes('fini')) {
      return { icon: '🟢', color: '#22c55e' }; // green
    }
    return { icon: '⚪', color: column.color || '#6b7280' };
  };

  const { icon, color } = getColumnIcon(column.title);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col w-80 bg-white rounded-lg shadow-sm border border-gray-200 transition-all ${
        isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-gray-900 text-sm">{column.title}</h3>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        
        {(isHovered || isDeleting) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {}}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Modifier</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <span className="h-4 w-4 mr-2 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    Suppression...
                  </span>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Supprimer</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] bg-gray-50">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            onMoveTask={onMoveTask}
          />
        ))}
      </div>

      <div className="p-3 bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg py-2"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une tâche
        </Button>
      </div>
    </div>
  );
}