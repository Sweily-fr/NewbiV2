import React, { useState } from 'react';
import { Loader2, Trash2, X, CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { Calendar } from '@/src/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checklist } from '@/src/components/Checklist';
import { MemberSelector } from './MemberSelector';
import { cn } from '@/src/lib/utils';

/**
 * Modal pour créer ou modifier une tâche
 */
export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  isEditing = false,
  taskForm,
  setTaskForm,
  board,
  workspaceId,
  addTag,
  removeTag,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem
}) {
  // Convert priority to uppercase for the Select component
  const getDisplayPriority = (priority) => {
    if (!priority) return 'MEDIUM';
    return priority.toUpperCase();
  };

  // Convert priority to lowercase for submission
  const getSubmitPriority = (priority) => {
    if (!priority) return 'medium';
    return priority.toLowerCase();
  };

  const handleSubmit = () => {
    if (!taskForm.title.trim()) {
      return;
    }
    
    // Convert priority to lowercase before submission
    const formData = {
      ...taskForm,
      priority: getSubmitPriority(taskForm.priority)
    };
    
    // Call the parent's onSubmit with the updated form data
    onSubmit(formData);
  };

  // Gestion de la date d'échéance
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const handleDateChange = (date) => {
    if (!date) {
      setTaskForm({ ...taskForm, dueDate: '' });
      return;
    }
    
    // Si une date est déjà définie, on conserve l'heure existante
    if (taskForm.dueDate) {
      const existingDate = new Date(taskForm.dueDate);
      date.setHours(existingDate.getHours(), existingDate.getMinutes());
    } else {
      // Par défaut, on met 18h00 comme heure
      date.setHours(18, 0, 0, 0);
    }
    
    setTaskForm({ ...taskForm, dueDate: date.toISOString() });
  };
  
  // Gestion de l'heure
  const handleTimeChange = (e) => {
    const time = e.target.value;
    if (!time || !taskForm.dueDate) return;
    
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(taskForm.dueDate);
    newDate.setHours(hours, minutes);
    
    setTaskForm({ ...taskForm, dueDate: newDate.toISOString() });
  };
  
  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return 'Choisir une date';
    const date = new Date(dateString);
    return format(date, 'PPP', { locale: fr });
  };
  
  // Formater l'heure pour l'affichage
  const formatTimeDisplay = (dateString) => {
    if (!dateString) return '18:00';
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
  };
  
  // Formater pour l'input time (HH:MM)
  const formatTimeInput = (dateString) => {
    if (!dateString) return '18:00';
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] p-0 bg-card text-card-foreground overflow-hidden flex flex-col">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b border-border relative flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">
              {isEditing ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 h-0 min-h-0">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="task-title" className="text-sm font-medium">
                Titre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full bg-background text-foreground border-input focus:border-primary"
                placeholder="Titre de la tâche"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="task-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full min-h-[100px] resize-none bg-card text-foreground border-input focus:border-primary focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Description de la tâche (optionnel)"
                rows={4}
              />
            </div>

            {/* Priorité et Colonne */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Priorité</Label>
                <Select
                  value={getDisplayPriority(taskForm.priority)}
                  onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Moyenne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        Faible
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        Moyenne
                      </div>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        Élevée
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Colonne</Label>
                <Select
                  value={taskForm.columnId}
                  onValueChange={(value) => setTaskForm({ ...taskForm, columnId: value })}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      {taskForm.columnId && board?.columns?.find(c => c.id === taskForm.columnId) ? (
                        <>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: board.columns.find(c => c.id === taskForm.columnId)?.color || '#8b5cf6' }}></div>
                          <span>{board.columns.find(c => c.id === taskForm.columnId)?.title}</span>
                        </>
                      ) : (
                        <SelectValue placeholder="Sélectionner une colonne" />
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {board?.columns?.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }}></div>
                          {column.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date d'échéance */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date d'échéance</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !taskForm.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {taskForm.dueDate ? (
                      <span>
                        {formatDate(taskForm.dueDate)} à {formatTimeDisplay(taskForm.dueDate)}
                      </span>
                    ) : (
                      <span>Choisir une date et une heure</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex flex-col">
                    <div className="border-b p-4">
                      <Calendar
                        mode="single"
                        selected={taskForm.dueDate ? new Date(taskForm.dueDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            handleDateChange(date);
                          }
                        }}
                        initialFocus
                        locale={fr}
                        fromDate={new Date()}
                        className="border-0"
                      />
                    </div>
                    <div className="p-4 flex items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Clock className="h-4 w-4 text-gray-500" />
                        </div>
                        <Input
                          type="time"
                          value={taskForm.dueDate ? formatTimeInput(taskForm.dueDate) : '18:00'}
                          onChange={handleTimeChange}
                          className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                          step="300" // Pas de 5 minutes
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={() => setTaskForm({ ...taskForm, dueDate: '' })}
                        disabled={!taskForm.dueDate}
                      >
                        Effacer
                      </Button>
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={() => setCalendarOpen(false)}
                      >
                        Valider
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Membres assignés */}
            <MemberSelector
              workspaceId={workspaceId}
              selectedMembers={taskForm.assignedMembers || []}
              onMembersChange={(members) => setTaskForm({ ...taskForm, assignedMembers: members })}
            />

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={taskForm.newTag}
                    onChange={(e) => setTaskForm({ ...taskForm, newTag: e.target.value })}
                    placeholder="Ajouter un tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 bg-background"
                  />
                  <Button 
                    type="button" 
                    onClick={addTag} 
                    size="sm" 
                    variant="outline"
                    className="border-input"
                  >
                    ↵ Entrée
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {taskForm.tags.map((tag, index) => (
                    <div key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => removeTag(tag.name)}
                        className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <Checklist 
                items={taskForm.checklist}
                onChange={(updatedItems) => setTaskForm({ ...taskForm, checklist: updatedItems })}
              />
            </div>
          </div>
          
          {/* Footer fixe */}
          <div className="border-t border-border bg-card px-6 py-4 flex-shrink-0">
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
                className="px-6 border-input"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || !taskForm.title.trim()}
                className="px-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Enregistrement...' : 'Création...'}
                  </>
                ) : isEditing ? 'Enregistrer les modifications' : 'Créer la tâche'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
