import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { LoaderCircle, Trash2, X, CalendarIcon, Clock, FileText, MessageSquare, ChevronDown, Flag, Users, UserPlus, Columns, Tag, Send, Edit2, Paperclip, Bold, Italic, Underline, List, ListOrdered, Quote, Code, Link } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from '@/src/components/ui/dropdown-menu';
import { Badge } from '@/src/components/ui/badge';
import { Calendar } from '@/src/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/components/ui/tooltip';
import { UserAvatar } from '@/src/components/ui/user-avatar';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checklist } from '@/src/components/Checklist';
import { MemberSelector } from './MemberSelector';
import { TaskActivity } from './TaskActivity';
import { TimerControls } from './TimerControls';
import { TaskImageUpload } from './TaskImageUpload';
import { useTaskImageUpload } from '../hooks/useTaskImageUpload';
import { useAssignedMembersInfo } from '@/src/hooks/useAssignedMembersInfo';
import MultipleSelector from '@/src/components/ui/multiple-selector';
import { cn } from '@/src/lib/utils';
import { useSession } from '@/src/lib/auth-client';

/**
 * Composant pour afficher les commentaires en attente avant la création de la tâche
 */
function PendingCommentsView({ pendingComments, addPendingComment, removePendingComment, updatePendingComment, currentUser }) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  // Récupérer les infos complètes de l'utilisateur actuel (avec avatar)
  const userIds = React.useMemo(() => {
    return session?.user?.id ? [session.user.id] : [];
  }, [session?.user?.id]);
  
  const { members: usersInfo } = useAssignedMembersInfo(userIds);
  
  // Récupérer les infos de l'utilisateur actuel
  const currentUserInfo = React.useMemo(() => {
    if (usersInfo && usersInfo.length > 0) {
      return usersInfo[0];
    }
    return {
      name: session?.user?.name || currentUser?.name || 'Utilisateur',
      image: session?.user?.image || currentUser?.avatarUrl || null
    };
  }, [usersInfo, session?.user, currentUser]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addPendingComment?.(newComment);
    setNewComment('');
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleSaveEdit = (commentId) => {
    if (!editingContent.trim()) return;
    
    // Mettre à jour le commentaire en attente
    updatePendingComment?.(commentId, editingContent.trim());
    
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pl-2 px-4 py-4">
        <div className="space-y-3">
          {pendingComments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun commentaire en attente
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                Ces commentaires seront ajoutés à la création de la tâche
              </p>
              {pendingComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="bg-background rounded-lg p-3 flex-1 border border-border">
                      <div className="flex gap-3">
                        <UserAvatar
                          src={currentUserInfo.image}
                          name={currentUserInfo.name}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 space-y-2">
                          {editingCommentId === comment.id ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{currentUserInfo.name}</span>
                                <span className="text-xs text-muted-foreground">En attente</span>
                              </div>
                              <div className="space-y-2">
                                <Textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="text-sm"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveEdit(comment.id)}
                                    disabled={!editingContent.trim()}
                                    style={{ backgroundColor: '#5b50FF', color: 'white' }}
                                    className="hover:opacity-90"
                                  >
                                    Enregistrer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{currentUserInfo.name}</span>
                                  <span className="text-xs text-muted-foreground">En attente</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-[#5b50FF]"
                                    onClick={() => handleEditComment(comment)}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                    onClick={() => removePendingComment?.(comment.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
        </div>
      </div>

      {/* Zone de saisie de commentaire - Sticky en bas */}
      <div className="pb-3 pl-3 pr-3 pt-3 space-y-2 flex-shrink-0 border-t border-border">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="min-h-[80px] text-sm bg-background border-border"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Cmd/Ctrl + Entrée pour envoyer
          </span>
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
          >
            <Send className="h-3 w-3 mr-2" />
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Éditeur rich text pour la description (style NoteComposer des notes client)
 */
const descriptionToolbarItems = [
  { icon: Bold, tooltip: "Gras", command: "bold" },
  { icon: Italic, tooltip: "Italique", command: "italic" },
  { icon: Underline, tooltip: "Souligné", command: "underline" },
  { icon: List, tooltip: "Liste à puces", command: "insertUnorderedList" },
  { icon: ListOrdered, tooltip: "Liste numérotée", command: "insertOrderedList" },
  { icon: Quote, tooltip: "Citation", command: "formatBlock", value: "blockquote" },
  { icon: Code, tooltip: "Code", command: "formatBlock", value: "pre" },
  { icon: Link, tooltip: "Lien", command: "createLink" },
];

function DescriptionEditor({ value, onChange, placeholder = "Ajouter une description..." }) {
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const lastValueRef = useRef(null);

  // Initialiser le contenu au montage + sync quand value change de l'extérieur
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value || "";
      const text = editorRef.current.textContent || "";
      setIsEmpty(text.trim().length === 0);
    }
  }, [value]);

  const syncValue = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.textContent || "";
    const newValue = text.trim().length === 0 ? "" : html;
    setIsEmpty(text.trim().length === 0);
    if (newValue !== lastValueRef.current) {
      lastValueRef.current = newValue;
      onChange(newValue);
    }
  }, [onChange]);

  const applyFormat = useCallback((item) => {
    if (item.command === "createLink") {
      const url = prompt("URL du lien :");
      if (url) document.execCommand("createLink", false, url);
    } else if (item.value) {
      document.execCommand(item.command, false, item.value);
    } else {
      document.execCommand(item.command, false, null);
    }
    editorRef.current?.focus();
    syncValue();
  }, [syncValue]);

  const handleInput = useCallback(() => {
    syncValue();
  }, [syncValue]);

  const handleClear = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      setIsEmpty(true);
      lastValueRef.current = "";
      onChange("");
      editorRef.current.focus();
    }
  }, [onChange]);

  return (
    <div
      className="flex flex-col rounded-xl border border-[#eeeff1] dark:border-[#232323] bg-white dark:bg-[#1a1a1a] shadow-xs cursor-text overflow-hidden min-w-0"
      onClick={() => editorRef.current?.focus()}
    >
      {/* Formatting toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#eeeff1] dark:border-[#232323]">
        <div className="flex items-center gap-0.5">
          {descriptionToolbarItems.map((item, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    applyFormat(item);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#606164] dark:text-muted-foreground hover:bg-[#f8f9fa] dark:hover:bg-[#232323] hover:text-[#242529] dark:hover:text-foreground transition-colors"
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{item.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#606164] hover:bg-red-50 hover:text-red-500 transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Effacer</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Rich text editor */}
      <div className="relative px-4 py-3 min-h-[100px] max-h-[200px] overflow-y-auto overflow-x-hidden">
        {isEmpty && (
          <span className="absolute top-3 left-4 text-sm text-muted-foreground pointer-events-none">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={syncValue}
          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
          className="w-full max-w-full text-sm text-foreground focus:outline-none min-h-[80px] whitespace-pre-wrap [&_b]:font-bold [&_i]:italic [&_u]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#eeeff1] [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:bg-[#f8f9fa] [&_pre]:rounded [&_pre]:px-2 [&_pre]:py-1 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:whitespace-pre-wrap [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#5a50ff] [&_a]:underline"
        />
      </div>
    </div>
  );
}

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
  removeChecklistItem,
  addPendingComment,
  removePendingComment,
  updatePendingComment
}) {
  // Optimisation: handlers mémorisés pour éviter les re-renders
  const handleTitleChange = useCallback((e) => {
    setTaskForm(prev => ({ ...prev, title: e.target.value }));
  }, [setTaskForm]);

  const handleNewTagChange = useCallback((e) => {
    setTaskForm(prev => ({ ...prev, newTag: e.target.value }));
  }, [setTaskForm]);

  const handleChecklistChange = useCallback((updatedItems) => {
    setTaskForm(prev => ({ ...prev, checklist: updatedItems }));
  }, [setTaskForm]);

  // Hook pour l'upload d'images (uniquement en mode édition avec un taskId)
  const taskId = taskForm.id || taskForm._id;
  const boardId = board?.id;
  const {
    isUploading: isUploadingImage,
    uploadProgress,
    uploadImage,
    deleteImage,
    handleDrop: handleImageDrop
  } = useTaskImageUpload(taskId, workspaceId, boardId);

  // Handler pour l'upload de fichiers dans la description (mode édition)
  const handleDescriptionImageUpload = useCallback(async (files) => {
    if (!taskId) return;

    const uploadedImages = [];
    for (const file of files) {
      const result = await uploadImage(file, 'description');
      if (result) {
        uploadedImages.push(result);
      }
    }

    // Mettre à jour le formulaire avec les nouvelles images
    if (uploadedImages.length > 0) {
      setTaskForm(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedImages]
      }));
    }
  }, [taskId, uploadImage, setTaskForm]);

  // Handlers pour le mode local (création de tâche - fichiers en attente)
  const handleAddPendingFiles = useCallback((files) => {
    setTaskForm(prev => ({
      ...prev,
      pendingFiles: [...(prev.pendingFiles || []), ...files]
    }));
  }, [setTaskForm]);

  const handleRemovePendingFile = useCallback((index) => {
    setTaskForm(prev => ({
      ...prev,
      pendingFiles: (prev.pendingFiles || []).filter((_, i) => i !== index)
    }));
  }, [setTaskForm]);

  // Handler pour supprimer une image
  const handleDeleteImage = useCallback(async (imageId) => {
    const success = await deleteImage(imageId);
    if (success) {
      setTaskForm(prev => ({
        ...prev,
        images: (prev.images || []).filter(img => img.id !== imageId)
      }));
    }
  }, [deleteImage, setTaskForm]);

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
    if (!priority) return 'NONE';
    return priority.toUpperCase();
  };

  // Convert priority to lowercase for submission
  const getSubmitPriority = (priority) => {
    if (!priority) return '';
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
  const [showDescription, setShowDescription] = useState(!!taskForm.description);
  const [tagsInputFocused, setTagsInputFocused] = useState(false);

  // Synchroniser showDescription quand la description change (ex: chargement async)
  useEffect(() => {
    if (taskForm.description) {
      setShowDescription(true);
    }
  }, [taskForm.description]);

  // Récupérer les infos des membres assignés
  const { members: membersInfo } = useAssignedMembersInfo(taskForm.assignedMembers || []);
  
  // Générer une couleur pour un tag basée sur son nom
  const getTagColor = (tagName) => {
    const colors = [
      { bg: '#3b82f620', border: '#3b82f640', text: '#3b82f6' }, // blue
      { bg: '#10b98120', border: '#10b98140', text: '#10b981' }, // green
      { bg: '#f59e0b20', border: '#f59e0b40', text: '#f59e0b' }, // amber
      { bg: '#ef444420', border: '#ef444440', text: '#ef4444' }, // red
      { bg: '#8b5cf620', border: '#8b5cf640', text: '#8b5cf6' }, // violet
      { bg: '#ec489920', border: '#ec489940', text: '#ec4899' }, // pink
      { bg: '#06b6d420', border: '#06b6d440', text: '#06b6d4' }, // cyan
      { bg: '#f97316 20', border: '#f9731640', text: '#f97316' }, // orange
    ];
    
    // Utiliser le hash du nom pour choisir une couleur de façon consistante
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
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

  // Formater la date de création
  const formatCreatedDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  // Trouver le créateur de la tâche
  const getCreatorInfo = () => {
    if (!taskForm.userId || !board?.members) {
      return { name: 'Inconnu', image: null };
    }

    const creator = board.members.find(m =>
      String(m.id) === String(taskForm.userId)
    );

    return creator ? { name: creator.name, image: creator.image } : { name: 'Inconnu', image: null };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="!max-w-[calc(100vw-2rem)] !w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] p-0 bg-card text-card-foreground overflow-hidden flex flex-col">
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
              <Label htmlFor="task-title" className="text-sm font-normal">
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
            <div className="space-y-2 mb-12">
              {!showDescription ? (
                <button
                  type="button"
                  onClick={() => setShowDescription(true)}
                  className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity bg-transparent border-0 p-0 cursor-pointer"
                  style={{ color: '#5b50FF' }}
                >
                  + Ajouter une description
                </button>
              ) : (
                <>
                  <Label className="text-sm font-normal">
                    Description
                  </Label>
                  <DescriptionEditor
                    value={taskForm.description}
                    onChange={(html) => setTaskForm(prev => ({ ...prev, description: html }))}
                    placeholder="Ajouter une description..."
                  />
                </>
              )}
            </div>

            {/* Grille 2 colonnes : Status à Tags */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {/* Colonne 1 */}
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                    <Columns className="h-4 w-4 text-muted-foreground" />
                    Status
                  </Label>
                  <div className="flex-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: `${board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8"}20`,
                            borderColor: `${board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8"}20`,
                            color: board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8"
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8" }}
                          />
                          <span>{board?.columns?.find(c => c.id === taskForm.columnId)?.title || 'Sélectionner un status'}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
                        {board?.columns?.map((column) => (
                          <DropdownMenuItem
                            key={column.id}
                            onClick={() => setTaskForm({ ...taskForm, columnId: column.id })}
                            className={cn(
                              "flex items-center gap-2 cursor-pointer",
                              taskForm.columnId === column.id && "bg-accent"
                            )}
                          >
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: column.color }}
                            />
                            <span>{column.title}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Date de début */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    Date de début
                  </Label>
                  <div className="flex-1">
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <div
                          className={cn(
                            "text-sm cursor-pointer hover:opacity-70 transition-opacity",
                            !taskForm.startDate && "text-muted-foreground"
                          )}
                        >
                          {taskForm.startDate ? (
                            <span>
                              {formatDate(taskForm.startDate)} à {formatTimeDisplay(taskForm.startDate)}
                            </span>
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" side="bottom" align="start">
                        <div className="flex flex-col">
                          <div className="border-b p-4">
                            <Calendar
                              mode="single"
                              selected={taskForm.startDate ? new Date(taskForm.startDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const [hours, minutes] = taskForm.startDate 
                                    ? [new Date(taskForm.startDate).getHours(), new Date(taskForm.startDate).getMinutes()]
                                    : [9, 0];
                                  date.setHours(hours, minutes, 0, 0);
                                  setTaskForm({ ...taskForm, startDate: date.toISOString() });
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
                                value={taskForm.startDate ? formatTimeInput(taskForm.startDate) : '09:00'}
                                onChange={(e) => {
                                  const time = e.target.value;
                                  if (!time || !taskForm.startDate) return;
                                  const [hours, minutes] = time.split(':').map(Number);
                                  const newDate = new Date(taskForm.startDate);
                                  newDate.setHours(hours, minutes, 0, 0);
                                  setTaskForm({ ...taskForm, startDate: newDate.toISOString() });
                                }}
                                className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                                step="300"
                              />
                            </div>
                            <Button 
                              type="button" 
                              variant="outline"
                              size="sm"
                              onClick={() => setTaskForm({ ...taskForm, startDate: '' })}
                              disabled={!taskForm.startDate}
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
                  <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    Priorité
                  </Label>
                  <div className="flex-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
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
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
                        {[
                          { value: 'HIGH', label: 'Urgent', color: 'text-red-500 fill-red-500' },
                          { value: 'MEDIUM', label: 'Moyen', color: 'text-yellow-500 fill-yellow-500' },
                          { value: 'LOW', label: 'Faible', color: 'text-green-500 fill-green-500' },
                          { value: 'NONE', label: 'Aucune', color: 'text-gray-400 fill-gray-400' }
                        ].map((priority) => (
                          <DropdownMenuItem
                            key={priority.value}
                            onClick={() => setTaskForm({ ...taskForm, priority: priority.value })}
                            className={cn(
                              "flex items-center gap-2 cursor-pointer",
                              taskForm.priority?.toUpperCase() === priority.value && "bg-accent"
                            )}
                          >
                            <Flag className={`h-4 w-4 ${priority.color}`} />
                            <span>{priority.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Date de fin */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Date de fin
                  </Label>
                  <div className="flex-1">
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <div
                          className={cn(
                            "text-sm cursor-pointer hover:opacity-70 transition-opacity",
                            !taskForm.dueDate && "text-muted-foreground"
                          )}
                        >
                          {taskForm.dueDate ? (
                            <span>
                              {formatDate(taskForm.dueDate)} à {formatTimeDisplay(taskForm.dueDate)}
                            </span>
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" side="bottom" align="start">
                        <div className="flex flex-col">
                          <div className="border-b p-4">
                            <Calendar
                              mode="single"
                              selected={taskForm.dueDate ? new Date(taskForm.dueDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const [hours, minutes] = taskForm.dueDate 
                                    ? [new Date(taskForm.dueDate).getHours(), new Date(taskForm.dueDate).getMinutes()]
                                    : [18, 0];
                                  date.setHours(hours, minutes, 0, 0);
                                  setTaskForm({ ...taskForm, dueDate: date.toISOString() });
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
                                onChange={(e) => {
                                  const time = e.target.value;
                                  if (!time || !taskForm.dueDate) return;
                                  const [hours, minutes] = time.split(':').map(Number);
                                  const newDate = new Date(taskForm.dueDate);
                                  newDate.setHours(hours, minutes, 0, 0);
                                  setTaskForm({ ...taskForm, dueDate: newDate.toISOString() });
                                }}
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
            </div>

            {/* Tags et Membres sur une ligne */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {/* Tags */}
              <div className="flex items-start gap-4">
                <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2 pt-1.5">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Tags
                </Label>
                <div className="flex-1 relative">
                  {taskForm.tags.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTaskForm({ ...taskForm, tags: [] })}
                      className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                      title="Supprimer tous les tags"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                  <div 
                    className="min-h-10 rounded-md border border-input px-3 py-2 text-sm ring-offset-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                    onClick={() => {
                      if (!tagsInputFocused) {
                        setTagsInputFocused(true);
                      }
                    }}
                  >
                    {taskForm.tags.length > 0 || tagsInputFocused ? (
                      <div className="flex flex-wrap gap-2 items-center min-h-full">
                        {taskForm.tags.map((tag, index) => {
                          const color = getTagColor(tag.name);
                          return (
                            <div
                              key={index}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                              style={{
                                backgroundColor: color.bg,
                                borderColor: color.border,
                                color: color.text
                              }}
                            >
                              {tag.name}
                              <button
                                type="button"
                                onClick={() => {
                                  const newTags = taskForm.tags.filter((_, i) => i !== index);
                                  setTaskForm({ ...taskForm, tags: newTags });
                                }}
                                className="ml-1.5 rounded-full outline-none hover:opacity-70 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                        {tagsInputFocused && (
                          <Input
                            autoFocus
                            placeholder={taskForm.tags.length === 0 ? "Ajouter des tags..." : ""}
                            className="flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 px-0 h-6"
                            onFocus={() => setTagsInputFocused(true)}
                            onBlur={() => setTagsInputFocused(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                e.preventDefault();
                                const newTag = e.currentTarget.value.trim();
                                if (!taskForm.tags.find(t => t.name === newTag)) {
                                  setTaskForm({
                                    ...taskForm,
                                    tags: [...taskForm.tags, { name: newTag }]
                                  });
                                }
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Ajouter des tags...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Membres assignés */}
              <div className="flex items-start gap-4">
                <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2 pt-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Membres
                </Label>
                <div className="flex-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      {taskForm.assignedMembers && taskForm.assignedMembers.length > 0 ? (
                        <div 
                          className="flex -space-x-2 cursor-pointer"
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
                          title="Ajouter des membres"
                        >
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72 max-h-[400px] overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
                      {board?.members?.map((member) => (
                        <DropdownMenuCheckboxItem
                          key={member.id}
                          checked={(taskForm.assignedMembers || []).includes(member.id)}
                          onCheckedChange={() => {
                            const currentMembers = taskForm.assignedMembers || [];
                            const newMembers = currentMembers.includes(member.id)
                              ? currentMembers.filter(id => id !== member.id)
                              : [...currentMembers, member.id];
                            setTaskForm({ ...taskForm, assignedMembers: newMembers });
                          }}
                          className="flex items-center gap-3 cursor-pointer"
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
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Timer et facturation (uniquement en mode édition) */}
            {isEditing && (taskForm.id || taskForm._id) && (
              <div className="mt-12">
                <TimerControls
                  taskId={taskForm.id || taskForm._id}
                  timeTracking={taskForm.timeTracking}
                  onTimerUpdate={(newTimeTracking) => {
                    setTaskForm(prev => ({
                      ...prev,
                      timeTracking: newTimeTracking
                    }));
                  }}
                />
              </div>
            )}

            {/* Checklist */}
            <div className="space-y-3 mt-6">
              <Checklist 
                items={taskForm.checklist}
                onChange={handleChecklistChange}
              />
            </div>

            {/* Pièces jointes */}
            <div className="space-y-2 mt-6">
              <Label className="text-sm font-normal flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                Pièces jointes
              </Label>
              {isEditing && taskId ? (
                <TaskImageUpload
                  images={taskForm.images || []}
                  onUpload={handleDescriptionImageUpload}
                  onDelete={handleDeleteImage}
                  isUploading={isUploadingImage}
                  uploadProgress={uploadProgress}
                  maxImages={10}
                  placeholder="Glissez des fichiers ici ou cliquez pour sélectionner"
                />
              ) : (
                <TaskImageUpload
                  localMode
                  pendingFiles={taskForm.pendingFiles || []}
                  onAddFiles={handleAddPendingFiles}
                  onRemoveFile={handleRemovePendingFile}
                  maxImages={10}
                  placeholder="Glissez des fichiers ici ou cliquez pour sélectionner"
                />
              )}
            </div>
            </div>
            
            {/* Footer fixe */}
            <div className="border-t border-border bg-card px-6 py-4 flex-shrink-0 space-y-3">
            {/* Informations de création (uniquement en mode édition) */}
            {isEditing && taskForm.createdAt && (() => {
              const creator = getCreatorInfo();
              return (
                <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <UserAvatar src={creator.image} name={creator.name} size="xs" />
                    <span>Créé par <span className="font-medium text-foreground">{creator.name}</span></span>
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
              );
            })()}
            
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
                className="px-6 text-white hover:opacity-90"
                style={{ backgroundColor: '#5b50FF' }}
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
          <div className="w-[500px] flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-background">
              <h3 className="text-lg font-semibold">Activité</h3>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden px-2 bg-muted/40">
              {isEditing && (taskForm.id || taskForm._id) ? (
                <TaskActivity
                  task={taskActivityData}
                  workspaceId={workspaceId}
                  currentUser={board?.members?.find(m => m.userId === taskActivityData.userId)}
                  boardMembers={board?.members || []}
                  columns={board?.columns || []}
                  onTaskUpdate={setTaskForm}
                />
              ) : (
                <PendingCommentsView 
                  pendingComments={taskForm.pendingComments || []}
                  addPendingComment={addPendingComment}
                  removePendingComment={removePendingComment}
                  updatePendingComment={updatePendingComment}
                  currentUser={board?.members?.[0]}
                />
              )}
            </div>
          </div>
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
              <TabsTrigger value="activity" className="flex-1 data-[state=active]:bg-background">
                <MessageSquare className="h-4 w-4 mr-2" />
                Activité
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=active]:flex">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Contenu du formulaire (même que desktop) */}
                {/* Titre */}
                <div className="space-y-2">
                  <Label htmlFor="task-title-mobile" className="text-sm font-normal">
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

                {/* Description - Collapse comme sur desktop */}
                <div className="space-y-2">
                  {!showDescription ? (
                    <button
                      type="button"
                      onClick={() => setShowDescription(true)}
                      className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity bg-transparent border-0 p-0 cursor-pointer"
                      style={{ color: '#5b50FF' }}
                    >
                      + Ajouter une description
                    </button>
                  ) : (
                    <>
                      <Label className="text-sm font-normal">
                        Description
                      </Label>
                      <DescriptionEditor
                        value={taskForm.description}
                        onChange={(html) => setTaskForm(prev => ({ ...prev, description: html }))}
                        placeholder="Ajouter une description..."
                      />
                    </>
                  )}
                </div>

                {/* Status et Priorité - Une seule colonne */}
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                      <Columns className="h-4 w-4 text-muted-foreground" />
                      Status
                    </Label>
                    <div className="flex-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button 
                            className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: `${board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8"}20`,
                              borderColor: `${board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8"}20`,
                              color: board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8"
                            }}
                          >
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: board?.columns?.find(c => c.id === taskForm.columnId)?.color || "#94a3b8" }}
                            />
                            <span className="truncate">{board?.columns?.find(c => c.id === taskForm.columnId)?.title || 'Status'}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
                          {board?.columns?.map((column) => (
                            <DropdownMenuItem
                              key={column.id}
                              onClick={() => setTaskForm({ ...taskForm, columnId: column.id })}
                              className={cn(
                                "flex items-center gap-2 cursor-pointer",
                                taskForm.columnId === column.id && "bg-accent"
                              )}
                            >
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: column.color }}
                              />
                              <span>{column.title}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Priorité */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                      <Flag className="h-4 w-4 text-muted-foreground" />
                      Priorité
                    </Label>
                    <div className="flex-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button 
                            className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
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
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
                          {[
                            { value: 'HIGH', label: 'Urgent', color: 'text-red-500 fill-red-500' },
                            { value: 'MEDIUM', label: 'Moyen', color: 'text-yellow-500 fill-yellow-500' },
                            { value: 'LOW', label: 'Faible', color: 'text-green-500 fill-green-500' },
                            { value: 'NONE', label: 'Aucune', color: 'text-gray-400 fill-gray-400' }
                          ].map((priority) => (
                            <DropdownMenuItem
                              key={priority.value}
                              onClick={() => setTaskForm({ ...taskForm, priority: priority.value })}
                              className={cn(
                                "flex items-center gap-2 cursor-pointer",
                                taskForm.priority?.toUpperCase() === priority.value && "bg-accent"
                              )}
                            >
                              <Flag className={`h-4 w-4 ${priority.color}`} />
                              <span>{priority.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Date de début */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    Date de début
                  </Label>
                  <div className="flex-1">
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <div
                          className={cn(
                            "text-sm cursor-pointer hover:opacity-70 transition-opacity",
                            !taskForm.startDate && "text-muted-foreground"
                          )}
                        >
                          {taskForm.startDate ? (
                            <span>
                              {formatDate(taskForm.startDate)} à {formatTimeDisplay(taskForm.startDate)}
                            </span>
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </div>
                      </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" side="bottom" align="start">
                      <div className="flex flex-col">
                        <div className="border-b p-4">
                          <Calendar
                            mode="single"
                            selected={taskForm.startDate ? new Date(taskForm.startDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const [hours, minutes] = taskForm.startDate 
                                  ? [new Date(taskForm.startDate).getHours(), new Date(taskForm.startDate).getMinutes()]
                                  : [9, 0];
                                date.setHours(hours, minutes, 0, 0);
                                setTaskForm({ ...taskForm, startDate: date.toISOString() });
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
                              value={taskForm.startDate ? formatTimeInput(taskForm.startDate) : '09:00'}
                              onChange={(e) => {
                                const time = e.target.value;
                                if (!time || !taskForm.startDate) return;
                                const [hours, minutes] = time.split(':').map(Number);
                                const newDate = new Date(taskForm.startDate);
                                newDate.setHours(hours, minutes, 0, 0);
                                setTaskForm({ ...taskForm, startDate: newDate.toISOString() });
                              }}
                              className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                              step="300"
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            onClick={() => setTaskForm({ ...taskForm, startDate: '' })}
                            disabled={!taskForm.startDate}
                          >
                            Effacer
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Date de fin */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Date de fin
                  </Label>
                  <div className="flex-1">
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <div
                          className={cn(
                            "text-sm cursor-pointer hover:opacity-70 transition-opacity",
                            !taskForm.dueDate && "text-muted-foreground"
                          )}
                        >
                          {taskForm.dueDate ? (
                            <span>
                              {formatDate(taskForm.dueDate)} à {formatTimeDisplay(taskForm.dueDate)}
                            </span>
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </div>
                      </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" side="bottom" align="start">
                      <div className="flex flex-col">
                        <div className="border-b p-4">
                          <Calendar
                            mode="single"
                            selected={taskForm.dueDate ? new Date(taskForm.dueDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const [hours, minutes] = taskForm.dueDate 
                                  ? [new Date(taskForm.dueDate).getHours(), new Date(taskForm.dueDate).getMinutes()]
                                  : [18, 0];
                                date.setHours(hours, minutes, 0, 0);
                                setTaskForm({ ...taskForm, dueDate: date.toISOString() });
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
                              onChange={(e) => {
                                const time = e.target.value;
                                if (!time || !taskForm.dueDate) return;
                                const [hours, minutes] = time.split(':').map(Number);
                                const newDate = new Date(taskForm.dueDate);
                                newDate.setHours(hours, minutes, 0, 0);
                                setTaskForm({ ...taskForm, dueDate: newDate.toISOString() });
                              }}
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

                {/* Tags et Membres - Une seule colonne */}
                <div className="space-y-4">
                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-sm font-normal flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Tags
                    </Label>
                    <div className="relative">
                      {taskForm.tags.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTaskForm({ ...taskForm, tags: [] })}
                          className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                          title="Supprimer tous les tags"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                      <div 
                        className="min-h-10 rounded-md border border-input px-3 py-2 text-sm ring-offset-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                        onClick={() => {
                          if (!tagsInputFocused) {
                            setTagsInputFocused(true);
                          }
                        }}
                      >
                        {taskForm.tags.length > 0 || tagsInputFocused ? (
                          <div className="flex flex-wrap gap-2 items-center min-h-full">
                            {taskForm.tags.map((tag, index) => {
                              const color = getTagColor(tag.name);
                              return (
                                <div
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                                  style={{
                                    backgroundColor: color.bg,
                                    borderColor: color.border,
                                    color: color.text
                                  }}
                                >
                                  {tag.name}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTags = taskForm.tags.filter((_, i) => i !== index);
                                      setTaskForm({ ...taskForm, tags: newTags });
                                    }}
                                    className="ml-1.5 rounded-full outline-none hover:opacity-70 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                            {tagsInputFocused && (
                              <Input
                                autoFocus
                                placeholder={taskForm.tags.length === 0 ? "Ajouter des tags..." : ""}
                                className="flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 px-0 h-6"
                                onFocus={() => setTagsInputFocused(true)}
                                onBlur={() => setTagsInputFocused(false)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    e.preventDefault();
                                    const newTag = e.currentTarget.value.trim();
                                    if (!taskForm.tags.find(t => t.name === newTag)) {
                                      setTaskForm({
                                        ...taskForm,
                                        tags: [...taskForm.tags, { name: newTag }]
                                      });
                                    }
                                    e.currentTarget.value = '';
                                  }
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Ajouter des tags...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Membres assignés */}
                  <div className="space-y-2">
                    <Label className="text-sm font-normal flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Membres
                    </Label>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          {taskForm.assignedMembers && taskForm.assignedMembers.length > 0 ? (
                            <div 
                              className="flex -space-x-2 cursor-pointer"
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
                              type="button"
                              className="w-7 h-7 rounded-full border border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/10 flex items-center justify-center cursor-pointer transition-colors bg-transparent p-0"
                              title="Ajouter des membres"
                            >
                              <UserPlus className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-72 max-h-[400px] overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
                          {board?.members?.map((member) => (
                            <DropdownMenuCheckboxItem
                              key={member.id}
                              checked={(taskForm.assignedMembers || []).includes(member.id)}
                              onCheckedChange={() => {
                                const currentMembers = taskForm.assignedMembers || [];
                                const newMembers = currentMembers.includes(member.id)
                                  ? currentMembers.filter(id => id !== member.id)
                                  : [...currentMembers, member.id];
                                setTaskForm({ ...taskForm, assignedMembers: newMembers });
                              }}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <UserAvatar 
                                src={member.image} 
                                name={member.name} 
                                size="sm"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{member.name}</div>
                                <div className="text-xs text-muted-foreground">{member.email}</div>
                              </div>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Timer et facturation (uniquement en mode édition) */}
                {isEditing && (taskForm.id || taskForm._id) && (
                  <div className="mt-6">
                    <TimerControls
                      taskId={taskForm.id || taskForm._id}
                      timeTracking={taskForm.timeTracking}
                      onTimerUpdate={(newTimeTracking) => {
                        setTaskForm(prev => ({
                          ...prev,
                          timeTracking: newTimeTracking
                        }));
                      }}
                    />
                  </div>
                )}

                {/* Checklist */}
                <div className="space-y-3 mt-6">
                  <Checklist 
                    items={taskForm.checklist}
                    onChange={handleChecklistChange}
                  />
                </div>

                {/* Pièces jointes */}
                <div className="space-y-2 mt-6">
                  <Label className="text-sm font-normal flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    Pièces jointes
                  </Label>
                  {isEditing && (taskForm.id || taskForm._id) ? (
                    <TaskImageUpload
                      images={taskForm.images || []}
                      onUpload={handleDescriptionImageUpload}
                      onDelete={handleDeleteImage}
                      isUploading={isUploadingImage}
                      uploadProgress={uploadProgress}
                      maxImages={10}
                      placeholder="Glissez des fichiers ici ou cliquez pour sélectionner"
                    />
                  ) : (
                    <TaskImageUpload
                      localMode
                      pendingFiles={taskForm.pendingFiles || []}
                      onAddFiles={handleAddPendingFiles}
                      onRemoveFile={handleRemovePendingFile}
                      maxImages={10}
                      placeholder="Glissez des fichiers ici ou cliquez pour sélectionner"
                    />
                  )}
                </div>
              </div>

              {/* Footer fixe mobile */}
              <div className="border-t border-border bg-card px-4 py-3 flex-shrink-0 space-y-3">
                {/* Informations de création */}
                {isEditing && taskForm.createdAt && (() => {
                  const creator = getCreatorInfo();
                  return (
                    <div className="flex flex-col gap-2 text-xs text-muted-foreground pb-2 border-b border-border">
                      <div className="flex items-center gap-1.5">
                        <UserAvatar src={creator.image} name={creator.name} size="xs" />
                        <span>Créé par <span className="font-medium text-foreground">{creator.name}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{formatCreatedDate(taskForm.createdAt)}</span>
                      </div>
                    </div>
                  );
                })()}
                
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
            <TabsContent value="activity" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=active]:flex bg-muted/40">
              <div className="flex-1 min-h-0 overflow-hidden">
                {isEditing && (taskForm.id || taskForm._id) ? (
                  <TaskActivity
                    task={taskActivityData}
                    workspaceId={workspaceId}
                    currentUser={board?.members?.find(m => m.userId === taskActivityData.userId)}
                    boardMembers={board?.members || []}
                    columns={board?.columns || []}
                    onTaskUpdate={setTaskForm}
                  />
                ) : (
                  <PendingCommentsView 
                    pendingComments={taskForm.pendingComments || []}
                    addPendingComment={addPendingComment}
                    removePendingComment={removePendingComment}
                    updatePendingComment={updatePendingComment}
                    currentUser={board?.members?.[0]}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
