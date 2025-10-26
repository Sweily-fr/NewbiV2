import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LoaderCircle, Trash2, X, CalendarIcon, Clock, User, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { Calendar } from '@/src/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checklist } from '@/src/components/Checklist';
import { MemberSelector } from './MemberSelector';
import { TaskActivity } from './TaskActivity';
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
      <DialogContent className="sm:max-w-[1000px] max-w-[95vw] h-[90vh] p-0 bg-card text-card-foreground overflow-hidden flex flex-col">
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
            <div className="w-[400px] flex flex-col bg-muted/20">
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
