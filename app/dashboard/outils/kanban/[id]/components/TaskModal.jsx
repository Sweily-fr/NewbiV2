import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LoaderCircle, Trash2, X, CalendarIcon, Clock, User, FileText, MessageSquare, ChevronDown, Flag, Users, UserPlus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { Badge } from '@/src/components/ui/badge';
import { Calendar } from '@/src/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Checkbox } from '@/src/components/ui/checkbox';
import { UserAvatar } from '@/src/components/ui/user-avatar';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checklist } from '@/src/components/Checklist';
import { MemberSelector } from './MemberSelector';
import { TaskActivity } from './TaskActivity';
import { useAssignedMembersInfo } from '@/src/hooks/useAssignedMembersInfo';
import MultipleSelector from '@/src/components/ui/multiple-selector';
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
  // Optimisation: handlers mémorisés pour éviter les re-renders
  const handleTitleChange = useCallback((e) => {
    setTaskForm(prev => ({ ...prev, title: e.target.value }));
  }, [setTaskForm]);

  const handleDescriptionChange = useCallback((e) => {
    setTaskForm(prev => ({ ...prev, description: e.target.value }));
  }, [setTaskForm]);

  const handleNewTagChange = useCallback((e) => {
    setTaskForm(prev => ({ ...prev, newTag: e.target.value }));
  }, [setTaskForm]);

  const handleChecklistChange = useCallback((updatedItems) => {
    setTaskForm(prev => ({ ...prev, checklist: updatedItems }));
  }, [setTaskForm]);

  const handleTimeChange = useCallback((e) => {
    const time = e.target.value;
    if (!time) return;
    
    setTaskForm(prev => {
      if (!prev.dueDate) return prev;
      
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(prev.dueDate);
      newDate.setHours(hours, minutes, 0, 0);
      return { ...prev, dueDate: newDate.toISOString() };
    });
  }, [setTaskForm]);

  const handleDateChange = useCallback((date) => {
    if (!date) {
      setTaskForm(prev => ({ ...prev, dueDate: '' }));
      return;
    }
    
    setTaskForm(prev => {
      // Si une date est déjà définie, on conserve l'heure existante
      if (prev.dueDate) {
        const existingDate = new Date(prev.dueDate);
        date.setHours(existingDate.getHours(), existingDate.getMinutes(), 0, 0);
      } else {
        // Par défaut, on met 18h00 comme heure
        date.setHours(18, 0, 0, 0);
      }
      
      const isoDate = date.toISOString();
      
      return { ...prev, dueDate: isoDate };
    });
  }, [setTaskForm]);

  // Mémoriser les props pour TaskActivity (ne change que si comments/activity changent)
  const taskActivityData = useMemo(() => ({
    id: taskForm.id || taskForm._id,
    comments: taskForm.comments || [],
    activity: taskForm.activity || [],
    userId: taskForm.userId
  }), [taskForm.id, taskForm._id, taskForm.comments, taskForm.activity, taskForm.userId]);

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
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [priorityPopoverOpen, setPriorityPopoverOpen] = useState(false);
  const [membersPopoverOpen, setMembersPopoverOpen] = useState(false);
  
  // Récupérer les infos des membres assignés
  const { members: membersInfo } = useAssignedMembersInfo(taskForm.assignedMembers || []);
  
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

  // Formater la date de création
  const formatCreatedDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  // Trouver le créateur de la tâche
  const getCreatorName = () => {
    if (!taskForm.userId || !board?.members) {
      return 'Inconnu';
    }
    
    const creator = board.members.find(m =>
      String(m.id) === String(taskForm.userId)
    );
    
    return creator ? creator.name : 'Inconnu';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[calc(100vw-2rem)] !w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] p-0 bg-card text-card-foreground overflow-hidden flex flex-col">
        {/* Version Desktop : 2 colonnes */}
        <div className="hidden lg:flex h-full">
          {/* Partie gauche : Formulaire */}
          <div className="flex-1 flex flex-col border-r">
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
                onChange={handleTitleChange}
                onFocus={(e) => e.target.setSelectionRange(0, 0)}
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
                onChange={handleDescriptionChange}
                className="w-full min-h-[100px] resize-none bg-card text-foreground border-input focus:border-primary focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Description de la tâche (optionnel)"
                rows={4}
              />
            </div>

            {/* Grille 2 colonnes : Status à Tags */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {/* Colonne 1 */}
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium w-24 flex-shrink-0">Status</Label>
                  <div className="flex-1">
                    <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button 
                          className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: `${board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8"}20`,
                            borderColor: `${board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8"}20`,
                            color: board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8"
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8" }}
                          />
                          <span>{board?.columns?.find(c => c.id === taskForm.columnId)?.title || 'Sélectionner un status'}</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="start">
                        <div className="space-y-1">
                          {board?.columns?.map((column) => (
                            <button
                              key={column.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskForm({ ...taskForm, columnId: column.id });
                                setStatusPopoverOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                                taskForm.columnId === column.id
                                  ? "bg-accent"
                                  : "hover:bg-accent/50"
                              )}
                            >
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: column.color }}
                              />
                              <span className="font-medium">{column.title}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Date d'échéance */}
                <div className="flex items-start gap-4">
                  <Label className="text-sm font-medium w-24 pt-2 flex-shrink-0">Date d'échéance</Label>
                  <div className="flex-1">
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
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
                            <span>Choisir une date</span>
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
                                step="300"
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
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Colonne 2 */}
              <div className="space-y-6">
                {/* Priorité */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium w-24 flex-shrink-0">Priorité</Label>
                  <div className="flex-1">
                    <Popover open={priorityPopoverOpen} onOpenChange={setPriorityPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button 
                          className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {taskForm.priority && taskForm.priority.toLowerCase() !== 'none' ? (
                            <Badge
                              variant="outline"
                              className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                            >
                              <Flag className={`h-4 w-4 ${
                                taskForm.priority.toLowerCase() === 'high' ? 'text-red-500 fill-red-500' :
                                taskForm.priority.toLowerCase() === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                                'text-green-500 fill-green-500'
                              }`} />
                              <span className="text-muted-foreground">
                                {taskForm.priority.toLowerCase() === 'high' ? 'Urgent' :
                                 taskForm.priority.toLowerCase() === 'medium' ? 'Moyen' :
                                 'Faible'}
                              </span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                            >
                              <Flag className="h-4 w-4 text-gray-400 fill-gray-400" />
                              <span className="text-muted-foreground">-</span>
                            </Badge>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="start">
                        <div className="space-y-1">
                          {[
                            { value: 'HIGH', label: 'Urgent', color: 'text-red-500 fill-red-500' },
                            { value: 'MEDIUM', label: 'Moyen', color: 'text-yellow-500 fill-yellow-500' },
                            { value: 'LOW', label: 'Faible', color: 'text-green-500 fill-green-500' },
                            { value: 'NONE', label: 'Aucune', color: 'text-gray-400 fill-gray-400' }
                          ].map((priority) => (
                            <button
                              key={priority.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskForm({ ...taskForm, priority: priority.value });
                                setPriorityPopoverOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer",
                                taskForm.priority?.toUpperCase() === priority.value ? 'bg-accent' : ''
                              )}
                            >
                              <Flag className={`h-4 w-4 ${priority.color}`} />
                              <span className="text-sm">{priority.label}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Date de fin */}
                <div className="flex items-start gap-4">
                  <Label className="text-sm font-medium w-24 pt-2 flex-shrink-0">Date de fin</Label>
                  <div className="flex-1">
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !taskForm.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {taskForm.endDate ? (
                            <span>
                              {formatDate(taskForm.endDate)} à {formatTimeDisplay(taskForm.endDate)}
                            </span>
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex flex-col">
                          <div className="border-b p-4">
                            <Calendar
                              mode="single"
                              selected={taskForm.endDate ? new Date(taskForm.endDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const [hours, minutes] = taskForm.endDate 
                                    ? [new Date(taskForm.endDate).getHours(), new Date(taskForm.endDate).getMinutes()]
                                    : [18, 0];
                                  date.setHours(hours, minutes, 0, 0);
                                  setTaskForm({ ...taskForm, endDate: date.toISOString() });
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
                                value={taskForm.endDate ? formatTimeInput(taskForm.endDate) : '18:00'}
                                onChange={(e) => {
                                  const time = e.target.value;
                                  if (!time || !taskForm.endDate) return;
                                  const [hours, minutes] = time.split(':').map(Number);
                                  const newDate = new Date(taskForm.endDate);
                                  newDate.setHours(hours, minutes, 0, 0);
                                  setTaskForm({ ...taskForm, endDate: newDate.toISOString() });
                                }}
                                className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                                step="300"
                              />
                            </div>
                            <Button 
                              type="button" 
                              variant="outline"
                              size="sm"
                              onClick={() => setTaskForm({ ...taskForm, endDate: '' })}
                              disabled={!taskForm.endDate}
                            >
                              Effacer
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags et Membres sur une ligne */}
            <div className="grid grid-cols-2 gap-x-6">
              {/* Tags */}
              <div className="flex items-start gap-4">
                <Label className="text-sm font-medium w-24 pt-2 flex-shrink-0">Tags</Label>
                <div className="flex-1">
                  <MultipleSelector
                    value={taskForm.tags.map(tag => ({ value: tag.name, label: tag.name }))}
                    onChange={(options) => {
                      setTaskForm({
                        ...taskForm,
                        tags: options.map(opt => ({ name: opt.value }))
                      });
                    }}
                    placeholder="Ajouter des tags..."
                    creatable
                    emptyIndicator={
                      <p className="text-center text-sm text-muted-foreground">Aucun tag trouvé</p>
                    }
                  />
                </div>
              </div>

              {/* Membres assignés */}
              <div className="flex items-start gap-4">
                <Label className="text-sm font-medium w-24 pt-1 flex-shrink-0">Membres</Label>
                <div className="flex-1">
                  <Popover open={membersPopoverOpen} onOpenChange={setMembersPopoverOpen}>
                    <PopoverTrigger asChild>
                      {taskForm.assignedMembers && taskForm.assignedMembers.length > 0 ? (
                        <div 
                          className="flex -space-x-2 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {taskForm.assignedMembers.slice(0, 3).map((memberId, idx) => {
                            const memberInfo = membersInfo.find(m => m.id === memberId);
                            return (
                              <div key={memberId} className="relative group/avatar">
                                <UserAvatar
                                  src={memberInfo?.image}
                                  name={memberInfo?.name || memberId}
                                  size="sm"
                                  className="border border-background ring-1 ring-border/10 hover:ring-primary/50 transition-all"
                                  style={{ zIndex: taskForm.assignedMembers.length - idx }}
                                />
                              </div>
                            );
                          })}
                          {taskForm.assignedMembers.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-muted/80 border border-background flex items-center justify-center text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                              +{taskForm.assignedMembers.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          className="w-7 h-7 rounded-full border border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/10 flex items-center justify-center cursor-pointer transition-colors bg-transparent p-0"
                          onClick={(e) => e.stopPropagation()}
                          title="Ajouter des membres"
                        >
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="start">
                      <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                        {board?.members?.map((member) => (
                          <div
                            key={member.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentMembers = taskForm.assignedMembers || [];
                              const newMembers = currentMembers.includes(member.id)
                                ? currentMembers.filter(id => id !== member.id)
                                : [...currentMembers, member.id];
                              setTaskForm({ ...taskForm, assignedMembers: newMembers });
                            }}
                            className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer ${
                              (taskForm.assignedMembers || []).includes(member.id) ? 'bg-accent' : ''
                            }`}
                          >
                            <UserAvatar 
                              src={member.image} 
                              name={member.name} 
                              size="sm"
                            />
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium">{member.name}</div>
                              <div className="text-xs text-muted-foreground">{member.email}</div>
                            </div>
                            <Checkbox
                              checked={(taskForm.assignedMembers || []).includes(member.id)}
                              onCheckedChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0"
                            />
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <Checklist 
                items={taskForm.checklist}
                onChange={handleChecklistChange}
              />
            </div>
            </div>
            
            {/* Footer fixe */}
            <div className="border-t border-border bg-card px-6 py-4 flex-shrink-0 space-y-3">
            {/* Informations de création (uniquement en mode édition) */}
            {isEditing && taskForm.createdAt && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  <span>Créé par <span className="font-medium text-foreground">{getCreatorName()}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>{formatCreatedDate(taskForm.createdAt)}</span>
                </div>
                {taskForm.updatedAt && taskForm.updatedAt !== taskForm.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/70">• Modifié le {formatCreatedDate(taskForm.updatedAt)}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Boutons d'action */}
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
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Enregistrement...' : 'Création...'}
                  </>
                ) : isEditing ? 'Enregistrer les modifications' : 'Créer la tâche'}
              </Button>
            </div>
            </div>
          </div>

          {/* Partie droite : Activité et commentaires */}
          {isEditing && (taskForm.id || taskForm._id) && (
            <div className="w-[500px] flex flex-col bg-muted/20">
              <div className="px-4 py-4 border-b border-border">
                <h3 className="text-sm font-semibold">Activité</h3>
              </div>
              <div className="flex-1 overflow-y-auto px-4">
                <TaskActivity 
                  task={taskActivityData} 
                  workspaceId={workspaceId}
                  currentUser={board?.members?.find(m => m.userId === taskActivityData.userId)}
                  boardMembers={board?.members || []}
                  columns={board?.columns || []}
                  onTaskUpdate={setTaskForm}
                />
              </div>
            </div>
          )}
        </div>

        {/* Version Mobile/Tablette : Onglets */}
        <div className="flex lg:hidden flex-col h-full">
          <DialogHeader className="px-4 py-3 border-b border-border flex-shrink-0">
            <DialogTitle className="text-base font-semibold">
              {isEditing ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full rounded-none border-b bg-muted/20 h-12 flex-shrink-0">
              <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-background">
                <FileText className="h-4 w-4 mr-2" />
                Détails
              </TabsTrigger>
              {isEditing && (taskForm.id || taskForm._id) && (
                <TabsTrigger value="activity" className="flex-1 data-[state=active]:bg-background">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Activité
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=active]:flex">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Contenu du formulaire (même que desktop) */}
                {/* Titre */}
                <div className="space-y-2">
                  <Label htmlFor="task-title-mobile" className="text-sm font-medium">
                    Titre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="task-title-mobile"
                    value={taskForm.title}
                    onChange={handleTitleChange}
                    onFocus={(e) => e.target.setSelectionRange(0, 0)}
                    className="w-full bg-background text-foreground border-input focus:border-primary"
                    placeholder="Titre de la tâche"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="task-description-mobile" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="task-description-mobile"
                    value={taskForm.description}
                    onChange={handleDescriptionChange}
                    className="w-full min-h-[80px] resize-none bg-card text-foreground border-input focus:border-primary focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Description de la tâche (optionnel)"
                    rows={3}
                  />
                </div>

                {/* Priorité et Colonne */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Select
                      value={getDisplayPriority(taskForm.priority)}
                      onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner une priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            Aucune
                          </div>
                        </SelectItem>
                        <SelectItem value="LOW">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Faible
                          </div>
                        </SelectItem>
                        <SelectItem value="MEDIUM">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            Moyen
                          </div>
                        </SelectItem>
                        <SelectItem value="HIGH">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            Urgent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Select
                      value={taskForm.columnId}
                      onValueChange={(value) => setTaskForm({ ...taskForm, columnId: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner une colonne" />
                      </SelectTrigger>
                      <SelectContent>
                        {board.columns.map((column) => (
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
                  
                  {/* Popover avec calendrier pour tous les appareils */}
                  <Popover modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
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
                              step="300"
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
                        onChange={handleNewTagChange}
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
                        ↵
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
                    onChange={handleChecklistChange}
                  />
                </div>
              </div>

              {/* Footer fixe mobile */}
              <div className="border-t border-border bg-card px-4 py-3 flex-shrink-0 space-y-3">
                {/* Informations de création */}
                {isEditing && taskForm.createdAt && (
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground pb-2 border-b border-border">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span>Créé par <span className="font-medium text-foreground">{getCreatorName()}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatCreatedDate(taskForm.createdAt)}</span>
                    </div>
                  </div>
                )}
                
                {/* Boutons d'action */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={isLoading}
                    className="flex-1 border-input"
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading || !taskForm.title.trim()}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        {isEditing ? 'Enregistrement...' : 'Création...'}
                      </>
                    ) : isEditing ? 'Enregistrer' : 'Créer'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Activité (mobile) */}
            {isEditing && (taskForm.id || taskForm._id) && (
              <TabsContent value="activity" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=active]:flex">
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <TaskActivity 
                    task={taskActivityData} 
                    workspaceId={workspaceId}
                    currentUser={board?.members?.find(m => m.userId === taskActivityData.userId)}
                    boardMembers={board?.members || []}
                    columns={board?.columns || []}
                    onTaskUpdate={setTaskForm}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
