'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Tag as TagIcon, X, Plus, Check, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Calendar } from '@/src/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useUpdateTask } from '@/src/hooks/useKanban';

const formSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  dueDate: z.date().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  tags: z.array(
    z.object({
      name: z.string(),
      className: z.string(),
      bg: z.string(),
      text: z.string(),
      border: z.string(),
    })
  ).optional(),
  checklist: z.array(
    z.object({
      id: z.string().optional(),
      text: z.string().min(1, 'Le texte est requis'),
      completed: z.boolean(),
    })
  ).optional(),
});

const TAG_OPTIONS = [
  { name: 'Bug', className: 'bug', bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  { name: 'Amélioration', className: 'improvement', bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  { name: 'Nouvelle fonctionnalité', className: 'feature', bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  { name: 'Design', className: 'design', bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
];

export default function EditTaskDialog({ task, open, onOpenChange, onTaskUpdated }) {
  const [isLoading, setIsLoading] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [selectedTags, setSelectedTags] = useState(task?.tags || []);
  const { updateTask } = useUpdateTask();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      priority: task?.priority || 'MEDIUM',
      tags: task?.tags || [],
      checklist: task?.checklist || [],
    },
  });

  const { register, handleSubmit, reset, setValue, watch } = form;

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        priority: task.priority || 'MEDIUM',
        tags: task.tags || [],
        checklist: task.checklist || [],
      });
      setSelectedTags(task.tags || []);
    }
  }, [task, reset]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await updateTask({
        variables: {
          input: {
            id: task.id,
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            priority: data.priority,
            tags: selectedTags,
            checklist: data.checklist,
          },
        },
      });
      onTaskUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    
    const currentChecklist = watch('checklist') || [];
    setValue('checklist', [
      ...currentChecklist,
      { id: Date.now().toString(), text: newChecklistItem, completed: false },
    ]);
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (index) => {
    const currentChecklist = [...(watch('checklist') || [])];
    currentChecklist.splice(index, 1);
    setValue('checklist', currentChecklist);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const isSelected = prev.some((t) => t.name === tag.name);
      if (isSelected) {
        return prev.filter((t) => t.name !== tag.name);
      } else {
        return [...prev, tag];
      }
    });
  };

  const toggleChecklistItem = (index) => {
    const currentChecklist = [...(watch('checklist') || [])];
    currentChecklist[index] = {
      ...currentChecklist[index],
      completed: !currentChecklist[index].completed,
    };
    setValue('checklist', currentChecklist);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la tâche</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titre</label>
              <Input
                {...register('title')}
                placeholder="Titre de la tâche"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                {...register('description')}
                placeholder="Décrivez la tâche..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Échéance</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watch('dueDate') && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch('dueDate') ? (
                        format(watch('dueDate'), 'PPP', { locale: fr })
                      ) : (
                        <span>Choisir une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watch('dueDate') || undefined}
                      onSelect={(date) => setValue('dueDate', date)}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priorité</label>
                <Select
                  value={watch('priority')}
                  onValueChange={(value) => setValue('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Basse</SelectItem>
                    <SelectItem value="MEDIUM">Moyenne</SelectItem>
                    <SelectItem value="HIGH">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => {
                  const isSelected = selectedTags.some((t) => t.name === tag.name);
                  return (
                    <Button
                      key={tag.name}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'h-8 px-3 text-xs',
                        isSelected && 'opacity-100'
                      )}
                      style={
                        isSelected
                          ? {
                              backgroundColor: tag.bg,
                              color: tag.text,
                              borderColor: tag.border,
                            }
                          : {}
                      }
                      onClick={() => toggleTag(tag)}
                    >
                      {tag.name}
                      {isSelected && <Check className="ml-1 h-3 w-3" />}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Checklist</label>
              <div className="space-y-2">
                {(watch('checklist') || []).map((item, index) => (
                  <div key={item.id || index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`checklist-${index}`}
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(index)}
                    />
                    <label
                      htmlFor={`checklist-${index}`}
                      className={cn(
                        'text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1',
                        item.completed && 'line-through text-gray-500'
                      )}
                    >
                      {item.text}
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveChecklistItem(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Ajouter un élément à la checklist"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddChecklistItem}
                    disabled={!newChecklistItem.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}