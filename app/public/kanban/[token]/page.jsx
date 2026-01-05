"use client";

import { use, useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useLazyQuery, useSubscription } from "@apollo/client";
import { 
  GET_PUBLIC_BOARD, 
  VALIDATE_PUBLIC_TOKEN,
  ADD_EXTERNAL_COMMENT,
  UPDATE_VISITOR_PROFILE,
  PUBLIC_TASK_UPDATED_SUBSCRIPTION,
  REQUEST_ACCESS,
  ACCESS_APPROVED_SUBSCRIPTION,
  ACCESS_REVOKED_SUBSCRIPTION
} from "@/src/graphql/kanbanQueries";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Textarea } from "@/src/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { Card, CardContent } from "@/src/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/components/ui/tooltip";
import { UserAvatar, AvatarGroup } from "@/src/components/ui/user-avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { 
  Mail, Eye, Calendar, CheckSquare, Flag, User, Send, Loader2, AlertCircle, ExternalLink,
  LayoutGrid, List, AlignLeft, Search, X, GanttChart, ChevronLeft, ChevronRight, Users,
  Tag, Columns, Clock, CheckCircle, ChevronUp, ChevronDown, Settings, Edit2, Camera, Upload
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, differenceInDays, startOfDay, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

const scrollbarStyles = `
  .kanban-column-scroll::-webkit-scrollbar { width: 6px; }
  .kanban-column-scroll::-webkit-scrollbar-track { background: transparent; }
  .kanban-column-scroll::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.2); border-radius: 3px; }
  .kanban-column-scroll::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.4); }
  .kanban-column-scroll { scrollbar-width: thin; scrollbar-color: hsl(var(--muted-foreground) / 0.2) transparent; }
`;

// EmailModal Component
function EmailModal({ isOpen, onSubmit, loading, error }) {
  const [email, setEmail] = useState("");
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Accès au tableau Kanban
          </DialogTitle>
          <DialogDescription>Veuillez renseigner votre adresse email pour accéder à ce tableau.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (isValidEmail) onSubmit(email); }} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" autoFocus required />
            </div>
          </div>
          {error && <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}
          <Button type="submit" className="w-full" disabled={!isValidEmail || loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Chargement...</> : <><ExternalLink className="mr-2 h-4 w-4" />Accéder au tableau</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// BannedAccessPage Component - Page de demande d'accès pour les utilisateurs bannis
function BannedAccessPage({ email, token, onAccessApproved }) {
  const [name, setName] = useState(email?.split('@')[0] || "");
  const [message, setMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [requestAccess] = useMutation(REQUEST_ACCESS);

  // Subscription pour être notifié en temps réel quand l'accès est approuvé
  useSubscription(ACCESS_APPROVED_SUBSCRIPTION, {
    variables: { token, email: email?.toLowerCase() },
    skip: !token || !email,
    onData: ({ data }) => {
      const payload = data?.data?.accessApproved;
      if (payload?.approved) {
        console.log('✅ [BannedAccessPage] Accès approuvé en temps réel !');
        toast.success("Votre accès a été approuvé ! Chargement du tableau...");
        // Appeler le callback pour recharger la page
        setTimeout(() => {
          onAccessApproved?.();
        }, 1500);
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await requestAccess({
        variables: { token, email, name, message }
      });
      
      if (result.data?.requestAccess?.success) {
        setRequestSent(true);
        if (result.data.requestAccess.alreadyRequested) {
          toast.info("Votre demande est déjà en attente de validation");
        } else {
          toast.success("Demande d'accès envoyée !");
        }
      } else {
        toast.error(result.data?.requestAccess?.message || "Erreur lors de la demande");
      }
    } catch (error) {
      console.error("Erreur demande d'accès:", error);
      toast.error("Erreur lors de la demande d'accès");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Accès révoqué</h1>
            <p className="text-muted-foreground">
              Votre accès à ce tableau a été révoqué par le propriétaire.
            </p>
          </div>

          {requestSent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Demande envoyée</h2>
                <p className="text-sm text-muted-foreground">
                  Votre demande d'accès a été envoyée au propriétaire du tableau. 
                  Vous serez notifié par email une fois qu'elle sera traitée.
                </p>
              </div>
              <div className="pt-4">
                <p className="text-xs text-muted-foreground">
                  Email utilisé : <span className="font-medium">{email}</span>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Vous pouvez demander un nouvel accès au propriétaire du tableau.
                </p>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">Votre nom</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Votre nom"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-sm">Message (optionnel)</Label>
                    <Textarea
                      id="message"
                      placeholder="Expliquez pourquoi vous souhaitez accéder à ce tableau..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Demander l'accès
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Email : <span className="font-medium">{email}</span>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ProfileModal Component
function ProfileModal({ isOpen, onClose, visitorProfile, onSave, loading }) {
  const [firstName, setFirstName] = useState(visitorProfile?.firstName || "");
  const [lastName, setLastName] = useState(visitorProfile?.lastName || "");
  const [imagePreview, setImagePreview] = useState(visitorProfile?.image || null);
  const [imageBase64, setImageBase64] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    setFirstName(visitorProfile?.firstName || "");
    setLastName(visitorProfile?.lastName || "");
    setImagePreview(visitorProfile?.image || null);
    setImageBase64(null);
  }, [visitorProfile]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2MB");
      return;
    }

    setUploadingImage(true);
    try {
      // Convertir en base64 pour le stockage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setImagePreview(base64);
        setImageBase64(base64);
        setUploadingImage(false);
      };
      reader.onerror = () => {
        toast.error("Erreur lors de la lecture de l'image");
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erreur lors du traitement de l'image");
      setUploadingImage(false);
    }
  };

  const handleSave = () => {
    onSave({ 
      firstName, 
      lastName, 
      image: imageBase64 || visitorProfile?.image || null 
    });
  };

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || visitorProfile?.name || 'Invité';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Mon profil</DialogTitle>
          <DialogDescription>Personnalisez votre profil pour les commentaires.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Photo de profil */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                {imagePreview ? (
                  <img src={imagePreview} alt="Photo de profil" className="w-full h-full object-cover" />
                ) : (
                  <UserAvatar name={displayName} size="lg" className="w-full h-full" />
                )}
              </div>
              <label 
                htmlFor="profile-image-upload" 
                className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md"
              >
                {uploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={uploadingImage}
              />
            </div>
            <p className="text-xs text-muted-foreground">Cliquez sur l'icône pour changer la photo</p>
          </div>

          <div className="space-y-2">
            <Label>Prénom</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Votre prénom" />
          </div>
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Votre nom" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSave} disabled={loading || uploadingImage}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// TaskCard Component
function PublicTaskCard({ task, onEdit }) {
  const [showDescPopover, setShowDescPopover] = useState(false);
  const checklistProgress = useMemo(() => {
    if (!task.checklist?.length) return { completed: 0, total: 0 };
    return { completed: task.checklist.filter(i => i.completed).length, total: task.checklist.length };
  }, [task.checklist]);

  return (
    <div onClick={() => onEdit(task)} className="bg-card text-card-foreground rounded-lg border border-border p-3 sm:p-4 shadow-xs hover:shadow-sm hover:bg-accent/10 flex flex-col cursor-pointer transition-opacity">
      <div className="flex items-start justify-between">
        <Tooltip><TooltipTrigger asChild><h4 className="font-medium text-sm text-foreground line-clamp-2">{task.title}</h4></TooltipTrigger><TooltipContent side="top" className="max-w-xs">{task.title}</TooltipContent></Tooltip>
      </div>
      <div className="mt-auto pt-2 sm:pt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.description && (
            <Popover open={showDescPopover} onOpenChange={setShowDescPopover}>
              <PopoverTrigger asChild><div className="cursor-pointer text-muted-foreground/70 hover:text-foreground" onClick={(e) => { e.stopPropagation(); setShowDescPopover(!showDescPopover); }}><AlignLeft className="h-4 w-4" /></div></PopoverTrigger>
              <PopoverContent className="w-80" side="top"><div className="space-y-2"><h4 className="font-medium text-sm">Description</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{task.description}</p></div></PopoverContent>
            </Popover>
          )}
          {checklistProgress.total > 0 && <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-0.5"><CheckCircle className="h-3.5 w-3.5" /><span>{checklistProgress.completed}/{checklistProgress.total}</span></div></TooltipTrigger><TooltipContent side="top">Checklist: {checklistProgress.completed}/{checklistProgress.total}</TooltipContent></Tooltip>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {task.assignedMembers?.length > 0 && <AvatarGroup users={task.assignedMembers} max={2} size="xs" />}
          {task.dueDate && (() => { try { const d = new Date(task.dueDate); if (isNaN(d.getTime())) return null; return <Badge variant="outline" className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"><Calendar className="h-4 w-4" /><span>{d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span></Badge>; } catch { return null; } })()}
          {task.priority && task.priority !== "none" && <Badge variant="outline" className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"><Flag className={`h-4 w-4 ${task.priority.toLowerCase() === "high" ? "text-red-500 fill-red-500" : task.priority.toLowerCase() === "medium" ? "text-yellow-500 fill-yellow-500" : "text-green-500 fill-green-500"}`} /><span>{task.priority.toLowerCase() === "high" ? "Urgent" : task.priority.toLowerCase() === "medium" ? "Moyen" : "Faible"}</span></Badge>}
        </div>
      </div>
    </div>
  );
}

// KanbanColumn Component
function PublicKanbanColumn({ column, tasks, onEditTask, isCollapsed, onToggleCollapse }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div style={{ backgroundColor: `${column.color || "#94a3b8"}08` }} className={`rounded-xl p-1.5 sm:p-2 min-w-[240px] max-w-[240px] sm:min-w-[300px] sm:max-w-[300px] flex flex-col flex-shrink-0 h-auto ${isCollapsed ? "max-w-[80px] min-w-[80px]" : ""}`}>
        <div className={`flex items-center justify-between gap-2 px-2 ${isCollapsed ? '' : 'mb-2 sm:mb-3'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1" style={{ backgroundColor: `${column.color || "#94a3b8"}20`, borderColor: `${column.color || "#94a3b8"}20`, color: column.color || "#94a3b8" }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color || "#94a3b8" }} />
              <span className="truncate">{column.title}</span>
            </div>
            <span className="ml-auto flex-shrink-0 text-xs font-medium" style={{ color: column.color || "#94a3b8" }}>{tasks.length}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: column.color || "#94a3b8" }} onClick={() => onToggleCollapse(column.id)}>
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        {!isCollapsed && (
          <div className="kanban-column-scroll p-2 rounded-lg overflow-y-auto" style={{ minHeight: tasks.length > 0 ? '50px' : '0px', maxHeight: 'calc(100vh - 320px)' }}>
            <div className="flex flex-col gap-2 sm:gap-3">
              {tasks.map((task) => <PublicTaskCard key={task.id} task={task} onEdit={onEditTask} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// TaskActivity Component - Reproduit exactement le visuel du dashboard
function PublicTaskActivity({ task, visitorEmail, visitorProfile, token, onCommentAdded, canComment, columns = [], boardMembers = [] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [newComment, setNewComment] = useState("");
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  
  const [addExternalComment] = useMutation(ADD_EXTERNAL_COMMENT);

  const comments = useMemo(() => {
    return [...(task?.comments || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [task?.comments]);

  const activities = useMemo(() => {
    return [...(task?.activity || [])]
      .filter(a => a.type !== 'comment_added')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [task?.activity]);

  const allActivity = useMemo(() => {
    return [
      ...comments.map(c => ({ ...c, itemType: 'comment' })),
      ...activities.map(a => ({ ...a, itemType: 'activity' }))
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [comments, activities]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return format(date, "'Aujourd''hui à' HH:mm", { locale: fr });
    } else if (diffInHours < 48) {
      return format(date, "'Hier à' HH:mm", { locale: fr });
    } else {
      return format(date, "d MMM 'à' HH:mm", { locale: fr });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !canComment) return;
    setAddingComment(true);
    try {
      const result = await addExternalComment({
        variables: { token, taskId: task.id, content: newComment.trim(), visitorEmail }
      });
      if (result.data?.addExternalComment?.success) {
        setNewComment("");
        toast.success("Commentaire ajouté");
        onCommentAdded?.(result.data.addExternalComment.task);
      } else {
        toast.error(result.data?.addExternalComment?.message || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setAddingComment(false);
    }
  };

  const getDisplayName = (item) => {
    // Si c'est un commentaire externe du visiteur actuel
    if (item.isExternal && item.userEmail === visitorEmail && visitorProfile?.name) {
      return visitorProfile.name;
    }
    // Sinon utiliser le userName stocké
    return item.userName || "Utilisateur";
  };

  const getDisplayImage = (item) => {
    // Si c'est un commentaire externe du visiteur actuel, utiliser le profil local
    if (item.isExternal && item.userEmail === visitorEmail && visitorProfile?.image) {
      return visitorProfile.image;
    }
    // Sinon utiliser l'image stockée dans le commentaire
    return item.userImage || null;
  };

  const getActivityDisplay = (activity) => {
    let text = activity.description || `a modifié ${activity.field}`;
    let moveDetails = null;
    
    if (activity.type === 'moved' && columns.length > 0) {
      const oldColumn = columns.find(col => col.id === activity.oldValue);
      const newColumn = columns.find(col => col.id === activity.newValue);
      if (oldColumn && newColumn) {
        text = 'a déplacé la tâche';
        moveDetails = {
          from: { title: oldColumn.title, color: oldColumn.color },
          to: { title: newColumn.title, color: newColumn.color }
        };
      }
    }
    
    if ((activity.type === 'assigned' || activity.type === 'unassigned') && boardMembers.length > 0) {
      const memberIds = activity.type === 'assigned' ? activity.newValue : activity.oldValue;
      if (Array.isArray(memberIds)) {
        const memberNames = memberIds
          .map(id => {
            const member = boardMembers.find(m => m.userId === id || m.id === id);
            return member ? member.name : null;
          })
          .filter(Boolean);
        if (memberNames.length > 0) {
          text = activity.type === 'assigned' ? `a assigné ${memberNames.join(', ')}` : `a désassigné ${memberNames.join(', ')}`;
        }
      }
    }
    
    return { text, moveDetails };
  };

  const renderCommentItem = (comment) => (
    <div key={comment.id} className="bg-background rounded-lg p-3 border border-border">
      <div className="flex gap-3">
        <UserAvatar src={getDisplayImage(comment)} name={getDisplayName(comment)} size="sm" className="flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{getDisplayName(comment)}</span>
              {comment.isExternal && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Invité</Badge>}
              <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </div>
  );

  const renderActivityItem = (activity, index) => {
    const display = getActivityDisplay(activity);
    return (
      <div key={activity.id || index} className="flex gap-3">
        <div className="w-8 flex items-start justify-center flex-shrink-0 pt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <span className="text-xs font-normal">{getDisplayName(activity)}</span>
              <span className="text-xs text-muted-foreground">{display.text}</span>
              {display.moveDetails && (
                <>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: display.moveDetails.from.color }} />
                    <span className="text-xs text-foreground">{display.moveDetails.from.title}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">→</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: display.moveDetails.to.color }} />
                    <span className="text-xs text-foreground">{display.moveDetails.to.title}</span>
                  </div>
                </>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(activity.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pl-2 px-4 py-4 space-y-3">
          <TabsContent value="all" className="space-y-3 mt-0">
            {allActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune activité</p>
            ) : (
              <>
                {allActivity.length > 3 && !showAllActivities && (
                  <button onClick={() => setShowAllActivities(true)} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors">
                    <ChevronDown className="h-3 w-3" />
                    Voir plus ({allActivity.length - 3} activités)
                  </button>
                )}
                {allActivity.length > 3 && showAllActivities && (
                  <button onClick={() => setShowAllActivities(false)} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors">
                    <ChevronUp className="h-3 w-3" />
                    Voir moins
                  </button>
                )}
                {(showAllActivities ? allActivity : allActivity.slice(-3)).map((item, index) => 
                  item.itemType === 'comment' ? renderCommentItem(item) : renderActivityItem(item, index)
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-3 mt-0">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun commentaire</p>
            ) : (
              comments.map((comment) => renderCommentItem(comment))
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-3 mt-0">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune activité</p>
            ) : (
              <>
                {activities.length > 3 && !showAllActivities && (
                  <button onClick={() => setShowAllActivities(true)} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors">
                    <ChevronDown className="h-3 w-3" />
                    Voir plus ({activities.length - 3} activités)
                  </button>
                )}
                {activities.length > 3 && showAllActivities && (
                  <button onClick={() => setShowAllActivities(false)} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors">
                    <ChevronUp className="h-3 w-3" />
                    Voir moins
                  </button>
                )}
                {(showAllActivities ? activities : activities.slice(-3)).map((activity, index) => renderActivityItem(activity, index))}
              </>
            )}
          </TabsContent>
        </div>

        {/* Tabs juste au-dessus du textarea */}
        <TabsList className="grid w-full grid-cols-3 bg-transparent rounded-none h-auto px-3 pt-3 pb-0 border-t border-border">
          <TabsTrigger value="all" className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent cursor-pointer">
            Tout ({allActivity.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent cursor-pointer">
            Commentaires ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent cursor-pointer">
            Activité ({activities.length})
          </TabsTrigger>
        </TabsList>

        {/* Zone de saisie de commentaire */}
        {canComment && (
          <div className="pb-3 pl-3 pr-3 pt-1 space-y-2 flex-shrink-0">
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
              <span className="text-xs text-muted-foreground">Cmd/Ctrl + Entrée pour envoyer</span>
              <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim() || addingComment}>
                <Send className="h-3 w-3 mr-2" />Envoyer
              </Button>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}

// ListView Component
function PublicListView({ columns, tasksByColumn, onEditTask }) {
  const [collapsedColumns, setCollapsedColumns] = useState({});
  const toggleCollapse = (columnId) => setCollapsedColumns(prev => ({ ...prev, [columnId]: !prev[columnId] }));

  return (
    <div className="space-y-4 p-4">
      {columns.map((column) => {
        const tasks = tasksByColumn[column.id] || [];
        const isCollapsed = collapsedColumns[column.id];
        return (
          <div key={column.id} className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer" onClick={() => toggleCollapse(column.id)}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                <span className="font-medium">{column.title}</span>
                <Badge variant="secondary" className="ml-2">{tasks.length}</Badge>
              </div>
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            {!isCollapsed && tasks.length > 0 && (
              <div className="divide-y divide-border">
                {tasks.map((task) => (
                  <div key={task.id} onClick={() => onEditTask(task)} className="px-4 py-3 hover:bg-muted/20 cursor-pointer flex items-center gap-4">
                    <span className="flex-1 truncate">{task.title}</span>
                    {task.priority && task.priority !== "none" && <Flag className={`h-4 w-4 ${task.priority === "high" ? "text-red-500" : task.priority === "medium" ? "text-yellow-500" : "text-green-500"}`} />}
                    {task.dueDate && <span className="text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>}
                    {task.assignedMembers?.length > 0 && <AvatarGroup users={task.assignedMembers} max={2} size="xs" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// TaskModal Component - Reproduit exactement le visuel du dashboard (mode lecture seule)
function PublicTaskModal({ task, isOpen, onClose, columns, visitorEmail, visitorProfile, token, onTaskUpdated, canComment, canViewComments, boardMembers }) {
  if (!task) return null;

  const currentColumn = columns?.find(c => c.id === task.columnId);
  const checklistProgress = useMemo(() => {
    if (!task.checklist?.length) return { completed: 0, total: 0 };
    return { completed: task.checklist.filter(i => i.completed).length, total: task.checklist.length };
  }, [task.checklist]);

  // Générer une couleur pour un tag basée sur son nom
  const getTagColor = (tagName) => {
    const colors = [
      { bg: '#3b82f620', border: '#3b82f640', text: '#3b82f6' },
      { bg: '#10b98120', border: '#10b98140', text: '#10b981' },
      { bg: '#f59e0b20', border: '#f59e0b40', text: '#f59e0b' },
      { bg: '#ef444420', border: '#ef444440', text: '#ef4444' },
      { bg: '#8b5cf620', border: '#8b5cf640', text: '#8b5cf6' },
      { bg: '#ec489920', border: '#ec489940', text: '#ec4899' },
      { bg: '#06b6d420', border: '#06b6d440', text: '#06b6d4' },
      { bg: '#f9731620', border: '#f9731640', text: '#f97316' },
    ];
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'PPP', { locale: fr });
  };

  // Formater l'heure pour l'affichage
  const formatTimeDisplay = (dateString) => {
    if (!dateString) return '';
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
    if (!task.userId || !boardMembers?.length) return 'Inconnu';
    const creator = boardMembers.find(m => String(m.id) === String(task.userId) || String(m.userId) === String(task.userId));
    return creator ? creator.name : 'Inconnu';
  };

  // Récupérer les infos des membres assignés
  const getAssignedMembersInfo = () => {
    if (!task.assignedMembers?.length) return [];
    return task.assignedMembers.map(memberId => {
      if (typeof memberId === 'object') return memberId;
      const member = boardMembers?.find(m => m.id === memberId || m.userId === memberId);
      return member || { id: memberId, name: memberId };
    });
  };

  const assignedMembersInfo = getAssignedMembersInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[calc(100vw-2rem)] !w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] p-0 bg-card text-card-foreground overflow-hidden flex flex-col">
        {/* Version Desktop : 2 colonnes */}
        <div className="hidden lg:flex h-full">
          {/* Partie gauche : Détails de la tâche (lecture seule) */}
          <div className="flex-1 flex flex-col border-r">
            <DialogHeader className="px-6 py-4 border-b border-border relative flex-shrink-0">
              <DialogTitle className="text-lg font-semibold">Voir la tâche</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 h-0 min-h-0">
              {/* Titre */}
              <div className="space-y-2">
                <Label className="text-sm font-normal">Titre</Label>
                <div className="w-full bg-muted/30 text-foreground border border-input rounded-md px-3 py-2">
                  {task.title}
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div className="space-y-2">
                  <Label className="text-sm font-normal">Description</Label>
                  <div className="w-full min-h-[100px] bg-muted/30 text-foreground border border-input rounded-md px-3 py-2 whitespace-pre-wrap">
                    {task.description}
                  </div>
                </div>
              )}

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
                      {currentColumn && (
                        <div 
                          className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1 w-fit"
                          style={{
                            backgroundColor: `${currentColumn.color || "#94a3b8"}20`,
                            borderColor: `${currentColumn.color || "#94a3b8"}20`,
                            color: currentColumn.color || "#94a3b8"
                          }}
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: currentColumn.color || "#94a3b8" }} />
                          <span>{currentColumn.title}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date de début */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Date de début
                    </Label>
                    <div className="flex-1 text-sm text-muted-foreground">
                      {task.startDate ? `${formatDate(task.startDate)}` : 'Choisir une date'}
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
                      {task.priority && task.priority.toLowerCase() !== 'none' ? (
                        <Badge variant="outline" className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground">
                          <Flag className={`h-4 w-4 ${
                            task.priority.toLowerCase() === 'high' ? 'text-red-500 fill-red-500' :
                            task.priority.toLowerCase() === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                            'text-green-500 fill-green-500'
                          }`} />
                          <span className="text-muted-foreground">
                            {task.priority.toLowerCase() === 'high' ? 'Urgent' :
                             task.priority.toLowerCase() === 'medium' ? 'Moyen' : 'Faible'}
                          </span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground">
                          <Flag className="h-4 w-4 text-gray-400 fill-gray-400" />
                          <span className="text-muted-foreground">-</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Date de fin */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Date de fin
                    </Label>
                    <div className="flex-1 text-sm text-muted-foreground">
                      {task.dueDate ? `${formatDate(task.dueDate)}` : 'Choisir une date'}
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
                  <div className="flex-1">
                    {task.tags?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => {
                          const color = tag.color ? { bg: `${tag.color}20`, border: `${tag.color}40`, text: tag.color } : getTagColor(tag.name);
                          return (
                            <div
                              key={tag.id || index}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                              style={{ backgroundColor: color.bg, borderColor: color.border, color: color.text }}
                            >
                              {tag.name}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Aucun tag</span>
                    )}
                  </div>
                </div>

                {/* Membres assignés */}
                <div className="flex items-start gap-4">
                  <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2 pt-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Membres
                  </Label>
                  <div className="flex-1">
                    {assignedMembersInfo.length > 0 ? (
                      <div className="flex -space-x-2">
                        {assignedMembersInfo.slice(0, 5).map((member, idx) => (
                          <div key={member.id || idx} className="relative group/avatar">
                            <UserAvatar
                              src={member.image}
                              name={member.name}
                              size="sm"
                              className="border border-background ring-1 ring-border/10"
                              style={{ zIndex: assignedMembersInfo.length - idx }}
                            />
                          </div>
                        ))}
                        {assignedMembersInfo.length > 5 && (
                          <div className="w-6 h-6 rounded-full bg-muted/80 border border-background flex items-center justify-center text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                            +{assignedMembersInfo.length - 5}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Aucun membre assigné</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Checklist */}
              {task.checklist?.length > 0 && (
                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Checklist</span>
                    <span className="text-xs text-muted-foreground">({checklistProgress.completed}/{checklistProgress.total})</span>
                  </div>
                  <div className="space-y-2 pl-6">
                    {task.checklist.map((item, index) => (
                      <div key={item.id || index} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${item.completed ? 'bg-primary border-primary' : 'border-input'}`}>
                          {item.completed && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gestion du temps (lecture seule) */}
              {task.timeTracking && (
                <div className="mt-6 p-4 border border-border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Gestion du temps</span>
                    {task.timeTracking.isRunning && (
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-600 rounded-full">En cours</span>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-mono font-semibold">
                        {(() => {
                          const totalSeconds = task.timeTracking.totalSeconds || 0;
                          const hours = Math.floor(totalSeconds / 3600);
                          const minutes = Math.floor((totalSeconds % 3600) / 60);
                          const seconds = totalSeconds % 60;
                          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    </div>
                    {task.timeTracking.hourlyRate && (
                      <>
                        <div className="text-sm text-muted-foreground">
                          {task.timeTracking.hourlyRate}€/h
                        </div>
                        <div className="text-sm font-medium">
                          € {((task.timeTracking.totalSeconds || 0) / 3600 * task.timeTracking.hourlyRate).toFixed(2)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer avec infos de création */}
            <div className="border-t border-border bg-card px-6 py-4 flex-shrink-0">
              {task.createdAt && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    <span>Créé par <span className="font-medium text-foreground">{getCreatorName()}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>{formatCreatedDate(task.createdAt)}</span>
                  </div>
                  {task.updatedAt && task.updatedAt !== task.createdAt && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground/70">• Modifié le {formatCreatedDate(task.updatedAt)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Partie droite : Activité et commentaires */}
          {canViewComments && (
            <div className="w-[500px] flex flex-col">
              <div className="px-6 py-4 border-b border-border bg-background">
                <h3 className="text-lg font-semibold">Activité</h3>
              </div>
              <div className="flex-1 overflow-y-auto px-2 bg-muted/40">
                <PublicTaskActivity 
                  task={task} 
                  visitorEmail={visitorEmail} 
                  visitorProfile={visitorProfile} 
                  token={token} 
                  onCommentAdded={onTaskUpdated} 
                  canComment={canComment}
                  columns={columns}
                  boardMembers={boardMembers}
                />
              </div>
            </div>
          )}
        </div>

        {/* Version Mobile/Tablette : Onglets */}
        <div className="flex lg:hidden flex-col h-full">
          <DialogHeader className="px-4 py-3 border-b border-border flex-shrink-0">
            <DialogTitle className="text-base font-semibold">Voir la tâche</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full rounded-none border-b bg-muted/20 h-12 flex-shrink-0">
              <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-background">
                <AlignLeft className="h-4 w-4 mr-2" />
                Détails
              </TabsTrigger>
              {canViewComments && (
                <TabsTrigger value="activity" className="flex-1 data-[state=active]:bg-background">
                  <Send className="h-4 w-4 mr-2" />
                  Activité
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=active]:flex">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Titre */}
                <div className="space-y-2">
                  <Label className="text-sm font-normal">Titre</Label>
                  <div className="w-full bg-muted/30 text-foreground border border-input rounded-md px-3 py-2">
                    {task.title}
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Description</Label>
                    <div className="w-full min-h-[80px] bg-muted/30 text-foreground border border-input rounded-md px-3 py-2 whitespace-pre-wrap text-sm">
                      {task.description}
                    </div>
                  </div>
                )}

                {/* Status */}
                {currentColumn && (
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-normal w-24 flex-shrink-0">Status</Label>
                    <div 
                      className="px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1"
                      style={{
                        backgroundColor: `${currentColumn.color || "#94a3b8"}20`,
                        borderColor: `${currentColumn.color || "#94a3b8"}20`,
                        color: currentColumn.color || "#94a3b8"
                      }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentColumn.color || "#94a3b8" }} />
                      <span>{currentColumn.title}</span>
                    </div>
                  </div>
                )}

                {/* Priorité */}
                {task.priority && task.priority.toLowerCase() !== 'none' && (
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-normal w-24 flex-shrink-0">Priorité</Label>
                    <Badge variant="outline" className="inline-flex items-center gap-1">
                      <Flag className={`h-3 w-3 ${
                        task.priority.toLowerCase() === 'high' ? 'text-red-500 fill-red-500' :
                        task.priority.toLowerCase() === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                        'text-green-500 fill-green-500'
                      }`} />
                      {task.priority.toLowerCase() === 'high' ? 'Urgent' :
                       task.priority.toLowerCase() === 'medium' ? 'Moyen' : 'Faible'}
                    </Badge>
                  </div>
                )}

                {/* Dates */}
                {task.dueDate && (
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-normal w-24 flex-shrink-0">Échéance</Label>
                    <span className="text-sm">{formatDate(task.dueDate)}</span>
                  </div>
                )}

                {/* Tags */}
                {task.tags?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => {
                        const color = tag.color ? { bg: `${tag.color}20`, border: `${tag.color}40`, text: tag.color } : getTagColor(tag.name);
                        return (
                          <div key={tag.id || index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border" style={{ backgroundColor: color.bg, borderColor: color.border, color: color.text }}>
                            {tag.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Membres */}
                {assignedMembersInfo.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Membres assignés</Label>
                    <div className="flex flex-wrap gap-2">
                      {assignedMembersInfo.map((member, idx) => (
                        <div key={member.id || idx} className="flex items-center gap-2 bg-muted/30 rounded-full px-2 py-1">
                          <UserAvatar src={member.image} name={member.name} size="xs" />
                          <span className="text-xs">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {task.checklist?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Checklist ({checklistProgress.completed}/{checklistProgress.total})</Label>
                    <div className="space-y-1">
                      {task.checklist.map((item, index) => (
                        <div key={item.id || index} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${item.completed ? 'bg-primary border-primary' : 'border-input'}`}>
                            {item.completed && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Onglet Activité (mobile) */}
            {canViewComments && (
              <TabsContent value="activity" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=active]:flex bg-muted/40">
                <div className="flex-1 overflow-y-auto">
                  <PublicTaskActivity 
                    task={task} 
                    visitorEmail={visitorEmail} 
                    visitorProfile={visitorProfile} 
                    token={token} 
                    onCommentAdded={onTaskUpdated} 
                    canComment={canComment}
                    columns={columns}
                    boardMembers={boardMembers}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper pour le localStorage
const getStorageKey = (token) => `public_kanban_visitor_${token}`;

// Main Page Component
export default function PublicKanbanPage({ params }) {
  const { token } = use(params);
  const [visitorEmail, setVisitorEmail] = useState(null);
  const [visitorProfile, setVisitorProfile] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const [isBanned, setIsBanned] = useState(false);
  const [boardData, setBoardData] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState("board");
  const [collapsedColumns, setCollapsedColumns] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  const [validateToken, { loading: validatingToken }] = useLazyQuery(VALIDATE_PUBLIC_TOKEN);
  const [getPublicBoard, { loading: loadingBoard }] = useLazyQuery(GET_PUBLIC_BOARD);
  const [updateVisitorProfile, { loading: updatingProfile }] = useMutation(UPDATE_VISITOR_PROFILE);

  // Subscription pour les mises à jour en temps réel
  useSubscription(PUBLIC_TASK_UPDATED_SUBSCRIPTION, {
    variables: { token, boardId: boardData?.id },
    skip: !boardData?.id || !token,
    onData: ({ data }) => {
      const payload = data?.data?.publicTaskUpdated;
      if (!payload) return;
      
      console.log('📡 [Public] Mise à jour temps réel reçue:', payload.type, payload.taskId);
      
      // Gérer la suppression
      if (payload.type === 'DELETED') {
        setBoardData(prev => {
          if (!prev?.tasks) return prev;
          return { ...prev, tasks: prev.tasks.filter(t => t.id !== payload.taskId) };
        });
        
        // Fermer le modal si la tâche supprimée est ouverte
        if (selectedTask?.id === payload.taskId) {
          setSelectedTask(null);
        }
        return;
      }
      
      if (!payload.task) return;
      
      // Mettre à jour la tâche dans boardData
      setBoardData(prev => {
        if (!prev?.tasks) return prev;
        
        const taskIndex = prev.tasks.findIndex(t => t.id === payload.task.id);
        if (taskIndex === -1) {
          // Nouvelle tâche
          if (payload.type === 'CREATED') {
            return { ...prev, tasks: [...prev.tasks, payload.task] };
          }
          return prev;
        }
        
        // Mise à jour de la tâche existante
        const updatedTasks = [...prev.tasks];
        updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], ...payload.task };
        return { ...prev, tasks: updatedTasks };
      });
      
      // Mettre à jour la tâche sélectionnée si c'est la même
      if (selectedTask?.id === payload.task.id) {
        setSelectedTask(prev => ({ ...prev, ...payload.task }));
      }
    },
    onError: (error) => {
      console.error('❌ [Public] Erreur subscription:', error);
    }
  });

  // Subscription pour détecter quand l'accès est révoqué (déconnexion temps réel)
  useSubscription(ACCESS_REVOKED_SUBSCRIPTION, {
    variables: { token, email: visitorEmail?.toLowerCase() },
    skip: !boardData?.id || !token || !visitorEmail,
    onData: ({ data }) => {
      const payload = data?.data?.accessRevoked;
      if (payload) {
        console.log('🚫 [Public] Accès révoqué en temps réel !');
        toast.error("Votre accès a été révoqué par le propriétaire du tableau.");
        
        // Supprimer la session du localStorage
        try {
          localStorage.removeItem(getStorageKey(token));
        } catch (e) {
          console.warn('Erreur suppression localStorage:', e);
        }
        
        // Marquer comme banni et afficher la page de demande d'accès
        setBoardData(null);
        setIsBanned(true);
      }
    }
  });

  // Charger la session depuis localStorage et valider le token
  useEffect(() => {
    const initSession = async () => {
      if (!token) return;
      
      // Valider le token d'abord
      const tokenResult = await validateToken({ variables: { token } });
      if (!tokenResult.data?.validatePublicToken) {
        setAccessError("Ce lien de partage n'est plus valide ou a expiré.");
        setIsInitializing(false);
        return;
      }
      
      // Vérifier si on a une session stockée
      try {
        const storedSession = localStorage.getItem(getStorageKey(token));
        if (storedSession) {
          const session = JSON.parse(storedSession);
          if (session.email) {
            // Essayer de récupérer le board avec l'email stocké
            const result = await getPublicBoard({ variables: { token, email: session.email } });
            if (result.data?.getPublicBoard?.success) {
              setVisitorEmail(session.email);
              setBoardData(result.data.getPublicBoard.board);
              setPermissions(result.data.getPublicBoard.share?.permissions);
              
              // Récupérer le profil du visiteur
              const visitor = result.data.getPublicBoard.share?.visitors?.find(v => v.email === session.email.toLowerCase());
              if (visitor) {
                setVisitorProfile({
                  firstName: visitor.firstName,
                  lastName: visitor.lastName,
                  name: visitor.name || session.email.split('@')[0],
                  image: visitor.image
                });
              } else {
                setVisitorProfile(session.profile || { name: session.email.split('@')[0] });
              }
              
              setIsInitializing(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Erreur lecture localStorage:', e);
      }
      
      // Pas de session valide, afficher le modal email
      setShowEmailModal(true);
      setIsInitializing(false);
    };
    
    initSession();
  }, [token, validateToken, getPublicBoard]);

  // Handle email submission
  const handleEmailSubmit = async (email) => {
    try {
      const result = await getPublicBoard({ variables: { token, email } });
      if (result.data?.getPublicBoard?.success) {
        setVisitorEmail(email);
        setBoardData(result.data.getPublicBoard.board);
        setPermissions(result.data.getPublicBoard.share?.permissions);
        setShowEmailModal(false);
        
        // Try to get visitor profile from share
        const visitor = result.data.getPublicBoard.share?.visitors?.find(v => v.email === email.toLowerCase());
        let profile;
        if (visitor) {
          profile = {
            firstName: visitor.firstName,
            lastName: visitor.lastName,
            name: visitor.name || email.split('@')[0],
            image: visitor.image
          };
        } else {
          profile = { name: email.split('@')[0] };
        }
        setVisitorProfile(profile);
        
        // Sauvegarder la session en localStorage
        try {
          localStorage.setItem(getStorageKey(token), JSON.stringify({
            email,
            profile,
            savedAt: Date.now()
          }));
        } catch (e) {
          console.warn('Erreur sauvegarde localStorage:', e);
        }
      } else {
        // Vérifier si l'utilisateur est banni
        if (result.data?.getPublicBoard?.isBanned) {
          setVisitorEmail(email);
          setIsBanned(true);
          setShowEmailModal(false);
        } else {
          setAccessError(result.data?.getPublicBoard?.message || "Accès refusé");
        }
      }
    } catch (error) {
      setAccessError("Une erreur est survenue");
    }
  };

  // Handle profile update
  const handleProfileSave = async (profileData) => {
    try {
      const result = await updateVisitorProfile({
        variables: {
          token,
          email: visitorEmail,
          input: { 
            firstName: profileData.firstName, 
            lastName: profileData.lastName,
            image: profileData.image || null
          }
        }
      });
      if (result.data?.updateVisitorProfile?.success) {
        const newProfile = {
          ...visitorProfile,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          name: [profileData.firstName, profileData.lastName].filter(Boolean).join(' ') || visitorEmail.split('@')[0],
          image: profileData.image || visitorProfile?.image || null
        };
        setVisitorProfile(newProfile);
        setShowProfileModal(false);
        toast.success("Profil mis à jour");
        
        // Mettre à jour le localStorage
        try {
          localStorage.setItem(getStorageKey(token), JSON.stringify({
            email: visitorEmail,
            profile: newProfile,
            savedAt: Date.now()
          }));
        } catch (e) {
          console.warn('Erreur mise à jour localStorage:', e);
        }
      } else {
        toast.error(result.data?.updateVisitorProfile?.message || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Handle task update (from comments)
  const handleTaskUpdated = (updatedTask) => {
    if (!updatedTask) return;
    setBoardData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t)
    }));
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(prev => ({ ...prev, ...updatedTask }));
    }
  };

  // Organize tasks by column
  const tasksByColumn = useMemo(() => {
    if (!boardData?.tasks || !boardData?.columns) return {};
    const result = {};
    boardData.columns.forEach(col => { result[col.id] = []; });
    boardData.tasks.forEach(task => {
      if (result[task.columnId]) {
        result[task.columnId].push(task);
      }
    });
    // Sort by position
    Object.keys(result).forEach(colId => {
      result[colId].sort((a, b) => (a.position || 0) - (b.position || 0));
    });
    return result;
  }, [boardData]);

  // Filter tasks by search
  const filteredTasksByColumn = useMemo(() => {
    if (!searchQuery.trim()) return tasksByColumn;
    const query = searchQuery.toLowerCase();
    const result = {};
    Object.keys(tasksByColumn).forEach(colId => {
      result[colId] = tasksByColumn[colId].filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    });
    return result;
  }, [tasksByColumn, searchQuery]);

  const columns = useMemo(() => 
    boardData?.columns?.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) || [],
    [boardData?.columns]
  );

  const toggleColumnCollapse = (columnId) => {
    setCollapsedColumns(prev => ({ ...prev, [columnId]: !prev[columnId] }));
  };

  // Loading state (initialisation ou validation)
  if (isInitializing || validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (accessError && !showEmailModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Accès refusé</h2>
            <p className="text-muted-foreground">{accessError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Banned state - afficher la page de demande d'accès
  if (isBanned && visitorEmail) {
    return (
      <BannedAccessPage 
        email={visitorEmail} 
        token={token} 
        onAccessApproved={async () => {
          // Recharger les données du tableau quand l'accès est approuvé
          setIsBanned(false);
          try {
            const result = await getPublicBoard({ variables: { token, email: visitorEmail } });
            if (result.data?.getPublicBoard?.success) {
              setBoardData(result.data.getPublicBoard.board);
              setPermissions(result.data.getPublicBoard.share?.permissions);
              
              // Récupérer le profil visiteur
              const visitor = result.data.getPublicBoard.share?.visitors?.find(v => v.email === visitorEmail.toLowerCase());
              if (visitor) {
                setVisitorProfile({
                  firstName: visitor.firstName,
                  lastName: visitor.lastName,
                  name: visitor.name || visitorEmail.split('@')[0],
                  image: visitor.image
                });
              }
            }
          } catch (error) {
            console.error('Erreur rechargement après approbation:', error);
            // En cas d'erreur, recharger la page
            window.location.reload();
          }
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EmailModal isOpen={showEmailModal} onSubmit={handleEmailSubmit} loading={loadingBoard} error={accessError} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} visitorProfile={visitorProfile} onSave={handleProfileSave} loading={updatingProfile} />
      
      {boardData && (
        <>
          {/* Header */}
          <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold">{boardData.title}</h1>
                {boardData.description && (
                  <Tooltip>
                    <TooltipTrigger><AlignLeft className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">{boardData.description}</TooltipContent>
                  </Tooltip>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-48" />
                  {searchQuery && (
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearchQuery("")}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* View toggle */}
                <Tabs value={viewMode} onValueChange={setViewMode}>
                  <TabsList className="h-9">
                    <TabsTrigger value="board" className="px-3"><LayoutGrid className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="list" className="px-3"><List className="h-4 w-4" /></TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Profile button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setShowProfileModal(true)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mon profil</TooltipContent>
                </Tooltip>

                {/* Visitor info */}
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <UserAvatar src={visitorProfile?.image} name={visitorProfile?.name || visitorEmail} size="sm" />
                  <span className="text-sm text-muted-foreground hidden sm:inline">{visitorProfile?.name || visitorEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {viewMode === "board" ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((column) => (
                  <PublicKanbanColumn
                    key={column.id}
                    column={column}
                    tasks={filteredTasksByColumn[column.id] || []}
                    onEditTask={setSelectedTask}
                    isCollapsed={collapsedColumns[column.id]}
                    onToggleCollapse={toggleColumnCollapse}
                  />
                ))}
              </div>
            ) : (
              <PublicListView columns={columns} tasksByColumn={filteredTasksByColumn} onEditTask={setSelectedTask} />
            )}
          </div>

          {/* Task Modal */}
          <PublicTaskModal
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            columns={columns}
            visitorEmail={visitorEmail}
            visitorProfile={visitorProfile}
            token={token}
            onTaskUpdated={handleTaskUpdated}
            canComment={permissions?.canComment}
            canViewComments={permissions?.canViewComments}
            boardMembers={boardData?.members || []}
          />
        </>
      )}
    </div>
  );
}
