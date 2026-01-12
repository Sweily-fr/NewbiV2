"use client";

import { use, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation, useLazyQuery, useSubscription } from "@apollo/client";
import { 
  GET_PUBLIC_BOARD, 
  VALIDATE_PUBLIC_TOKEN,
  ADD_EXTERNAL_COMMENT,
  UPDATE_VISITOR_PROFILE,
  PUBLIC_TASK_UPDATED_SUBSCRIPTION,
  REQUEST_ACCESS,
  ACCESS_APPROVED_SUBSCRIPTION,
  ACCESS_REVOKED_SUBSCRIPTION,
  UPLOAD_EXTERNAL_COMMENT_IMAGE,
  UPLOAD_VISITOR_IMAGE
} from "@/src/graphql/kanbanQueries";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Textarea } from "@/src/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/src/components/ui/dialog";
import { Card, CardContent } from "@/src/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/components/ui/tooltip";
import { UserAvatar, AvatarGroup } from "@/src/components/ui/user-avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { 
  Mail, Eye, Calendar, CheckSquare, Flag, User, Send, Loader2, AlertCircle, ExternalLink,
  LayoutGrid, List, AlignLeft, Search, X, GanttChart, ChevronLeft, ChevronRight, Users,
  Tag, Columns, Clock, CheckCircle, ChevronUp, ChevronDown, Settings, Edit2, Camera, Upload,
  ImagePlus, ZoomIn
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, differenceInDays, startOfDay, isWithinInterval, isSameDay, getWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { TimerDisplay } from "@/app/dashboard/outils/kanban/[id]/components/TimerDisplay";

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
function ProfileModal({ isOpen, onClose, visitorProfile, onSave, loading, token, visitorEmail }) {
  const [firstName, setFirstName] = useState(visitorProfile?.firstName || "");
  const [lastName, setLastName] = useState(visitorProfile?.lastName || "");
  const [imagePreview, setImagePreview] = useState(visitorProfile?.image || null);
  const [imageUrl, setImageUrl] = useState(visitorProfile?.image || null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [uploadVisitorImage] = useMutation(UPLOAD_VISITOR_IMAGE);

  useEffect(() => {
    setFirstName(visitorProfile?.firstName || "");
    setLastName(visitorProfile?.lastName || "");
    setImagePreview(visitorProfile?.image || null);
    setImageUrl(visitorProfile?.image || null);
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
      // Afficher un aperçu local pendant l'upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Uploader directement sur Cloudflare
      const result = await uploadVisitorImage({
        variables: {
          token,
          email: visitorEmail,
          file
        }
      });

      if (result.data?.uploadVisitorImage?.success) {
        const cloudflareUrl = result.data.uploadVisitorImage.imageUrl;
        setImageUrl(cloudflareUrl);
        setImagePreview(cloudflareUrl);
        toast.success("Image uploadée avec succès");
      } else {
        toast.error(result.data?.uploadVisitorImage?.message || "Erreur lors de l'upload");
        setImagePreview(visitorProfile?.image || null);
      }
    } catch (error) {
      console.error("Erreur upload image:", error);
      toast.error("Erreur lors de l'upload de l'image");
      setImagePreview(visitorProfile?.image || null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = () => {
    // On envoie l'URL Cloudflare (pas de base64)
    onSave({ 
      firstName, 
      lastName, 
      image: imageUrl
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
                  <UserAvatar name={displayName} colorKey={visitorEmail} size="lg" className="w-full h-full" />
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

// TaskCard Component - Style identique à l'interface utilisateur connecté
function PublicTaskCard({ task, onEdit }) {
  const [showDescPopover, setShowDescPopover] = useState(false);
  const checklistProgress = useMemo(() => {
    if (!task.checklist?.length) return { completed: 0, total: 0 };
    return { completed: task.checklist.filter(i => i.completed).length, total: task.checklist.length };
  }, [task.checklist]);

  return (
    <div 
      onClick={() => onEdit(task)} 
      className="bg-card text-card-foreground rounded-lg border border-border p-3 sm:p-4 shadow-xs hover:shadow-sm hover:bg-accent/10 flex flex-col cursor-pointer transition-opacity"
    >
      {/* En-tête avec titre */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="font-medium text-sm text-foreground line-clamp-2">{task.title}</h4>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">{task.title}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Pied de carte - Organisé sur 2 lignes */}
      <div className="mt-auto pt-2 sm:pt-3 space-y-1.5">
        {/* Ligne 1: Icônes (description, checklist) */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Icône description avec Popover */}
          {task.description && (
            <Popover open={showDescPopover} onOpenChange={setShowDescPopover}>
              <PopoverTrigger asChild>
                <div 
                  className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors" 
                  onClick={(e) => { e.stopPropagation(); setShowDescPopover(!showDescPopover); }}
                >
                  <AlignLeft className="h-4 w-4" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="top">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{task.description}</p>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Checklist */}
          {checklistProgress.total > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{checklistProgress.completed}/{checklistProgress.total}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">Checklist: {checklistProgress.completed}/{checklistProgress.total}</TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {/* Ligne 2: Timer + Avatar + Date d'échéance + Priorité */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {/* Timer Display */}
          <TimerDisplay timeTracking={task.timeTracking} />
          
          {/* Membres assignés */}
          {task.assignedMembers?.length > 0 && (
            <AvatarGroup users={task.assignedMembers} max={2} size="xs" />
          )}
          
          {/* Date d'échéance */}
          {task.dueDate && (() => { 
            try { 
              const d = new Date(task.dueDate); 
              if (isNaN(d.getTime())) return null; 
              return (
                <Badge variant="outline" className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                </Badge>
              ); 
            } catch { return null; } 
          })()}
          
          {/* Priorité */}
          {task.priority && task.priority !== "none" && (
            <Badge variant="outline" className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground">
              <Flag className={`h-4 w-4 ${
                task.priority.toLowerCase() === "high" ? "text-red-500 fill-red-500" : 
                task.priority.toLowerCase() === "medium" ? "text-yellow-500 fill-yellow-500" : 
                "text-green-500 fill-green-500"
              }`} />
              <span>{task.priority.toLowerCase() === "high" ? "Urgent" : task.priority.toLowerCase() === "medium" ? "Moyen" : "Faible"}</span>
            </Badge>
          )}
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
  const [pendingImages, setPendingImages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  
  const [addExternalComment] = useMutation(ADD_EXTERNAL_COMMENT);
  const [uploadExternalCommentImage] = useMutation(UPLOAD_EXTERNAL_COMMENT_IMAGE);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Gestion du drag-and-drop sur le textarea
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setPendingImages(prev => [...prev, ...newImages]);
    }
  }, []);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push({
            file,
            preview: URL.createObjectURL(file)
          });
        }
      }
    }

    if (imageFiles.length > 0) {
      setPendingImages(prev => [...prev, ...imageFiles]);
    }
  }, []);

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
    if ((!newComment.trim() && pendingImages.length === 0) || !canComment) return;
    setAddingComment(true);
    
    try {
      // Upload des images en premier si présentes
      let uploadedImageUrls = [];
      if (pendingImages.length > 0) {
        setUploadingImages(true);
        for (const imageData of pendingImages) {
          try {
            const result = await uploadExternalCommentImage({
              variables: { 
                token, 
                taskId: task.id, 
                file: imageData.file, 
                visitorEmail 
              }
            });
            if (result.data?.uploadExternalCommentImage?.success) {
              uploadedImageUrls.push(result.data.uploadExternalCommentImage.image);
            }
          } catch (uploadError) {
            console.error('Erreur upload image:', uploadError);
          }
        }
        setUploadingImages(false);
      }

      // Construire le contenu du commentaire avec les images
      let commentContent = newComment.trim();
      if (uploadedImageUrls.length > 0) {
        const imageMarkdown = uploadedImageUrls.map(img => `![${img.fileName}](${img.url})`).join('\n');
        commentContent = commentContent ? `${commentContent}\n\n${imageMarkdown}` : imageMarkdown;
      }

      if (!commentContent) {
        toast.error("Veuillez ajouter du texte ou des images");
        return;
      }

      const result = await addExternalComment({
        variables: { token, taskId: task.id, content: commentContent, visitorEmail }
      });
      if (result.data?.addExternalComment?.success) {
        setNewComment("");
        setPendingImages([]);
        toast.success("Commentaire ajouté");
        onCommentAdded?.(result.data.addExternalComment.task);
      } else {
        toast.error(result.data?.addExternalComment?.message || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setAddingComment(false);
      setUploadingImages(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setPendingImages(prev => [...prev, ...newImages]);
    }
    e.target.value = '';
  };

  const removeImage = (index) => {
    setPendingImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const getDisplayName = (item) => {
    // Si c'est un commentaire externe du visiteur actuel
    if (item.isExternal && item.userEmail === visitorEmail && visitorProfile?.name) {
      return visitorProfile.name;
    }
    // Si le userName est déjà défini et valide
    if (item.userName && item.userName !== 'Utilisateur' && item.userName !== 'unknown') {
      return item.userName;
    }
    // Pour les commentaires non-externes, chercher dans boardMembers
    if (!item.isExternal && item.userId && boardMembers.length > 0) {
      const member = boardMembers.find(m => m.id === item.userId || m.userId === item.userId);
      if (member?.name) return member.name;
    }
    // Fallback: utiliser l'email si disponible
    if (item.userEmail) {
      return item.userEmail.split('@')[0];
    }
    return "Utilisateur";
  };

  const getDisplayImage = (item) => {
    // Si c'est un commentaire externe du visiteur actuel, utiliser le profil local
    if (item.isExternal && item.userEmail === visitorEmail && visitorProfile?.image) {
      return visitorProfile.image;
    }
    // Si l'image est déjà définie
    if (item.userImage) {
      return item.userImage;
    }
    // Pour les commentaires non-externes, chercher dans boardMembers
    if (!item.isExternal && item.userId && boardMembers.length > 0) {
      const member = boardMembers.find(m => m.id === item.userId || m.userId === item.userId);
      if (member?.image) return member.image;
    }
    return null;
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
        <UserAvatar src={getDisplayImage(comment)} name={getDisplayName(comment)} colorKey={comment.userEmail} size="sm" className="flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{getDisplayName(comment)}</span>
              {comment.isExternal && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Invité</Badge>}
              <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          {/* Affichage des images du commentaire */}
          {comment.images && comment.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {comment.images.map((image) => (
                <Dialog key={image.id}>
                  <DialogTrigger asChild>
                    <div className="relative cursor-pointer group overflow-hidden rounded-md border border-border hover:border-primary/50 transition-colors">
                      <img
                        src={image.url}
                        alt={image.fileName}
                        className="w-full h-20 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 overflow-hidden">
                    <DialogTitle className="sr-only">Aperçu de l'image</DialogTitle>
                    <img
                      src={image.url}
                      alt={image.fileName}
                      className="w-full h-auto max-h-[80vh] object-contain"
                    />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
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
            <div
              className={`relative transition-all ${isDragOver ? 'ring-2 ring-primary ring-offset-2 rounded-md' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Textarea 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                onPaste={handlePaste}
                placeholder={isDragOver ? "Déposez vos images ici..." : "Ajouter un commentaire... (glissez-déposez des images)"} 
                className={`min-h-[80px] text-sm bg-background border-border ${isDragOver ? 'border-primary' : ''}`}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { 
                    e.preventDefault(); 
                    handleAddComment(); 
                  } 
                }} 
              />
              {isDragOver && (
                <div className="absolute inset-0 bg-primary/10 rounded-md flex items-center justify-center pointer-events-none">
                  <div className="text-primary font-medium text-sm flex items-center gap-2">
                    <ImagePlus className="h-5 w-5" />
                    Déposez vos images ici
                  </div>
                </div>
              )}
            </div>
            
            {/* Images en attente */}
            {pendingImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={img.file.name}
                      className="w-16 h-16 object-cover rounded-md border border-border"
                    />
                    <button
                      onClick={() => {
                        setPendingImages(prev => prev.filter((_, i) => i !== index));
                        URL.revokeObjectURL(img.preview);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-black border border-gray-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newImages = files.map(file => ({
                      file,
                      preview: URL.createObjectURL(file)
                    }));
                    setPendingImages(prev => [...prev, ...newImages]);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={addingComment}
                  className="h-8 px-2"
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">Cmd/Ctrl + Entrée pour envoyer</span>
              </div>
              <Button size="sm" onClick={handleAddComment} disabled={(!newComment.trim() && pendingImages.length === 0) || addingComment || uploadingImages}>
                {uploadingImages ? (
                  <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Upload...</>
                ) : addingComment ? (
                  <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Envoi...</>
                ) : (
                  <><Send className="h-3 w-3 mr-2" />Envoyer</>
                )}
              </Button>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}

// ListView Component - Style identique à l'interface utilisateur connecté
function PublicListView({ columns, tasksByColumn, onEditTask }) {
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  const toggleCollapse = (columnId) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getPriorityBadge = (priority) => {
    if (!priority || priority.toLowerCase() === "none") return null;
    const isHigh = priority.toLowerCase() === "high";
    const isMedium = priority.toLowerCase() === "medium";
    const label = isHigh ? "Urgent" : isMedium ? "Moyen" : "Faible";
    const flagColor = isHigh ? "text-red-500 fill-red-500" : isMedium ? "text-yellow-500 fill-yellow-500" : "text-green-500 fill-green-500";
    return (
      <Badge variant="outline" className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground">
        <Flag className={`h-4 w-4 ${flagColor}`} />
        <span className="text-muted-foreground">{label}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-4 bg-background pb-24 md:pb-12 lg:pb-16">
      {columns.map((column) => {
        const tasks = tasksByColumn[column.id] || [];
        const isCollapsed = collapsedColumns.has(column.id) || (tasks.length === 0 && !collapsedColumns.has(column.id));

        return (
          <div key={column.id} className="space-y-0">
            {/* En-tête de colonne */}
            <div 
              className={`flex items-center gap-3 py-2 ${isCollapsed ? 'bg-muted/10 hover:bg-muted/20' : 'bg-muted/5 hover:bg-muted/10'} cursor-pointer transition-all group`}
              onClick={() => toggleCollapse(column.id)}
            >
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent">
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </Button>
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1"
                  style={{
                    backgroundColor: `${column.color || "#94a3b8"}20`,
                    borderColor: `${column.color || "#94a3b8"}20`,
                    color: column.color || "#94a3b8"
                  }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color || "#94a3b8" }} />
                  <span>{column.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-medium" style={{ color: column.color || "#94a3b8" }}>
                  {tasks.length}
                </span>
              </div>
            </div>

            {/* Contenu de la colonne */}
            {!isCollapsed && (
              <div className="w-full overflow-x-auto scrollbar-hide">
                <div className="w-max min-w-full">
                  {/* Header de section avec colonnes */}
                  <div className="grid px-2 py-2 text-xs font-normal text-muted-foreground/70 tracking-wide border-b border-border/60" style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', gap: '2rem' }}>
                    <div className="flex items-center gap-2">Nom de la tâche</div>
                    <div className="flex items-center">Assigné à</div>
                    <div className="flex items-center">Status</div>
                    <div className="flex items-center">Échéance</div>
                    <div className="flex items-center">Priorité</div>
                  </div>

                  {/* Liste des tâches */}
                  {tasks.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune tâche</div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className="grid px-2 py-1.5 items-center hover:bg-accent/5 cursor-pointer group relative overflow-hidden border-b border-border/60"
                        style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', gap: '2rem' }}
                        onClick={() => onEditTask(task)}
                      >
                        {/* Nom */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex-shrink-0 w-3.5 h-3.5 rounded-full"
                              style={{ 
                                backgroundColor: column.color || "#94a3b8",
                                border: `2px solid ${column.color || "#94a3b8"}60`,
                                outline: `2px solid ${column.color || "#94a3b8"}30`,
                                outlineOffset: '2px'
                              }}
                            />
                            <div className="flex-1 w-0 flex items-center gap-1 min-w-0">
                              <p className="text-sm truncate font-normal text-foreground/90 group-hover:text-foreground">{task.title}</p>
                              {task.description && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors flex-shrink-0 ml-4"
                                      onClick={(e) => e.stopPropagation()}
                                      title="Afficher la description"
                                    >
                                      <AlignLeft className="h-4 w-4" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80" side="top">
                                    <div className="space-y-2">
                                      <h4 className="font-medium text-sm">Description</h4>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{task.description}</p>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Assignée */}
                        <div className="flex items-center gap-0.5 min-w-0">
                          {task.assignedMembers && task.assignedMembers.length > 0 ? (
                            <AvatarGroup users={task.assignedMembers} max={3} size="xs" />
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">-</span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-1 min-w-0">
                          <div 
                            className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1"
                            style={{
                              backgroundColor: `${column.color || "#94a3b8"}20`,
                              borderColor: `${column.color || "#94a3b8"}20`,
                              color: column.color || "#94a3b8"
                            }}
                          >
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color || "#94a3b8" }} />
                            <span>{column.title}</span>
                          </div>
                        </div>

                        {/* Échéance */}
                        <div className="flex items-center min-w-0">
                          {task.dueDate ? (
                            <Badge variant="outline" className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(task.dueDate)}</span>
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">-</span>
                          )}
                        </div>

                        {/* Priorité */}
                        <div className="flex items-center min-w-0">
                          {getPriorityBadge(task.priority) || <span className="text-muted-foreground/50 text-xs">-</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// GanttView Component - Style identique à l'interface utilisateur connecté
function PublicGanttView({ columns, tasksByColumn, onEditTask, boardMembers = [] }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState("week");
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const scrollContainerRef = useRef(null);
  const leftColumnRef = useRef(null);
  const headerTimelineRef = useRef(null);

  // Récupérer toutes les tâches
  const allTasks = useMemo(() => {
    const tasks = [];
    columns.forEach(column => {
      const columnTasks = tasksByColumn[column.id] || [];
      columnTasks.forEach(task => {
        tasks.push({ ...task, column });
      });
    });
    return tasks.sort((a, b) => {
      const hasBothDatesA = a.startDate && a.dueDate;
      const hasBothDatesB = b.startDate && b.dueDate;
      const hasOneDateA = (a.startDate || a.dueDate) && !hasBothDatesA;
      const hasOneDateB = (b.startDate || b.dueDate) && !hasBothDatesB;
      
      if (hasBothDatesA && !hasBothDatesB) return -1;
      if (!hasBothDatesA && hasBothDatesB) return 1;
      if (hasBothDatesA && hasBothDatesB) {
        return new Date(a.startDate) - new Date(b.startDate);
      }
      if (hasOneDateA && !hasOneDateB && !hasBothDatesB) return -1;
      if (!hasOneDateA && !hasBothDatesA && hasOneDateB) return 1;
      if (hasOneDateA && hasOneDateB) {
        const dateA = a.startDate ? new Date(a.startDate) : new Date(a.dueDate);
        const dateB = b.startDate ? new Date(b.startDate) : new Date(b.dueDate);
        return dateA - dateB;
      }
      return 0;
    });
  }, [columns, tasksByColumn]);

  // Générer les jours à afficher selon le mode
  const daysToDisplay = useMemo(() => {
    if (viewMode === "week") {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
    } else if (viewMode === "month") {
      return eachDayOfInterval({ start: currentWeekStart, end: addDays(currentWeekStart, 29) });
    } else {
      return eachDayOfInterval({ start: currentWeekStart, end: addDays(currentWeekStart, 89) });
    }
  }, [currentWeekStart, viewMode]);

  // Grouper les jours par semaine pour l'affichage de l'en-tête
  const weekGroups = useMemo(() => {
    const groups = [];
    let currentGroup = null;
    daysToDisplay.forEach((day, index) => {
      const weekNum = getWeek(day, { weekStartsOn: 1 });
      const weekStart = startOfWeek(day, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(day, { weekStartsOn: 1 });
      if (!currentGroup || currentGroup.weekNum !== weekNum) {
        currentGroup = { weekNum, weekStart, weekEnd, startIndex: index, days: [] };
        groups.push(currentGroup);
      }
      currentGroup.days.push(day);
    });
    return groups;
  }, [daysToDisplay]);

  // Navigation
  const goToPrevious = () => {
    if (viewMode === "week") setCurrentWeekStart(prev => addDays(prev, -7));
    else if (viewMode === "month") setCurrentWeekStart(prev => addDays(prev, -30));
    else setCurrentWeekStart(prev => addDays(prev, -90));
  };

  const goToNext = () => {
    if (viewMode === "week") setCurrentWeekStart(prev => addDays(prev, 7));
    else if (viewMode === "month") setCurrentWeekStart(prev => addDays(prev, 30));
    else setCurrentWeekStart(prev => addDays(prev, 90));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const dayWidth = viewMode === "week" ? 120 : viewMode === "month" ? 40 : 30;

  // Calculer la position et la largeur d'une barre de tâche
  const getTaskBarStyle = (task) => {
    let startDate = task.startDate ? startOfDay(parseISO(task.startDate)) : null;
    let endDate = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;
    if (!startDate && !endDate) return null;

    const firstDay = daysToDisplay[0];
    const lastDay = daysToDisplay[daysToDisplay.length - 1];
    const taskStart = startDate || endDate;
    const taskEnd = endDate || startDate;

    const isVisible = isWithinInterval(taskStart, { start: firstDay, end: lastDay }) ||
                      isWithinInterval(taskEnd, { start: firstDay, end: lastDay }) ||
                      (taskStart < firstDay && taskEnd > lastDay);
    if (!isVisible) return null;

    const startOffset = Math.max(0, differenceInDays(taskStart, firstDay));
    const duration = startDate && endDate ? Math.max(1, differenceInDays(taskEnd, taskStart) + 1) : 1;
    const visibleDuration = Math.min(duration, daysToDisplay.length - startOffset);
    const horizontalMargin = 12;

    return {
      left: `${startOffset * dayWidth + horizontalMargin}px`,
      width: `${visibleDuration * dayWidth - (horizontalMargin * 2)}px`,
      visible: true
    };
  };

  const formatDateRange = (task) => {
    const start = task.startDate ? format(parseISO(task.startDate), "d MMM", { locale: fr }) : null;
    const end = task.dueDate ? format(parseISO(task.dueDate), "d MMM", { locale: fr }) : null;
    if (start && end) return `${start} - ${end}`;
    else if (start) return `Début: ${start}`;
    else if (end) return `Fin: ${end}`;
    return "";
  };

  const getPriorityLabel = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "Urgent";
      case "medium": return "Moyen";
      case "low": return "Faible";
      default: return "Aucune";
    }
  };

  // Récupérer les infos d'un membre
  const getMemberInfo = (memberId) => {
    if (typeof memberId === 'object') return memberId;
    return boardMembers?.find(m => m.id === memberId || m.userId === memberId) || { id: memberId, name: memberId };
  };

  // Synchroniser le scroll horizontal entre header et timeline
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const headerTimeline = headerTimelineRef.current;
    if (!scrollContainer || !headerTimeline) return;

    const handleScroll = () => {
      headerTimeline.scrollLeft = scrollContainer.scrollLeft;
    };
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-10rem)] bg-background">
      {/* Header avec contrôles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 gap-2 sm:gap-0 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPrevious} className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday} className="h-7 px-3 text-xs">
              Aujourd'hui
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNext} className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm font-semibold text-foreground">
            {viewMode === "week" && format(currentWeekStart, "MMMM yyyy", { locale: fr })}
            {viewMode === "month" && format(currentWeekStart, "MMMM yyyy", { locale: fr })}
            {viewMode === "quarter" && `Q${Math.floor(currentWeekStart.getMonth() / 3) + 1} ${currentWeekStart.getFullYear()}`}
          </div>
        </div>
        <div className="flex items-center gap-2 mr-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-hidden border-t border-border">
        {/* Headers fixes */}
        <div className="flex border-b border-border">
          {/* Header gauche */}
          <div className="w-32 sm:w-48 md:w-72 border-r border-border bg-background px-2 sm:px-3 md:px-4 flex items-start pt-2 flex-shrink-0" style={{ height: '74px' }}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tâches · {allTasks.length}
            </div>
          </div>
          
          {/* Header timeline - semaines et jours */}
          <div ref={headerTimelineRef} className="flex-1 overflow-x-auto bg-background" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: `${daysToDisplay.length * dayWidth}px` }}>
              {/* Ligne des semaines */}
              <div className="flex border-b border-border">
                {weekGroups.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="border-r border-border px-3 h-9 bg-background flex items-center justify-between"
                    style={{ width: `${week.days.length * dayWidth}px` }}
                  >
                    <div className="text-[10px] text-muted-foreground/80">
                      {format(week.weekStart, "MMM d", { locale: fr })} - {format(week.weekEnd, "d", { locale: fr })}
                    </div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      S{week.weekNum}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Ligne des jours */}
              <div className="flex">
                {daysToDisplay.map((day, index) => {
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={index}
                      className={`border-r border-border flex-shrink-0 px-2 h-9 flex items-center justify-center text-center transition-colors ${isToday ? "bg-primary/5" : ""} ${isWeekend ? "bg-muted/30" : ""}`}
                      style={{ width: `${dayWidth}px` }}
                    >
                      <div className={`text-sm font-normal ${isToday ? "text-primary" : "text-foreground"}`}>
                        {format(day, "d", { locale: fr })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Conteneur de scroll partagé */}
        <div className="grid grid-cols-[128px_1fr] sm:grid-cols-[192px_1fr] md:grid-cols-[288px_1fr] h-[calc(100%-74px)] overflow-y-auto" ref={leftColumnRef}>
          {/* Colonne des tâches */}
          <div className="border-r border-border bg-muted/20" style={{ minHeight: `${Math.max(allTasks.length, 20) * 45}px` }}>
            <div className="divide-y divide-border">
              {allTasks.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune tâche</p>
                </div>
              ) : (
                allTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`h-[45px] cursor-pointer transition-all group overflow-x-auto scrollbar-hide ${hoveredTaskId === task.id ? "bg-primary/2" : "hover:bg-accent/5"}`}
                    onClick={() => onEditTask(task)}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-full min-w-max">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.column.color }} />
                      <div className="text-[10px] sm:text-xs font-medium whitespace-nowrap group-hover:text-primary transition-colors truncate max-w-[80px] sm:max-w-none">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {task.priority && task.priority.toLowerCase() !== 'none' && (
                          <Flag className={`h-2.5 w-2.5 ${
                            task.priority.toLowerCase() === 'high' ? 'text-red-500 fill-red-500' :
                            task.priority.toLowerCase() === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                            'text-green-500 fill-green-500'
                          }`} />
                        )}
                        {task.assignedMembers && task.assignedMembers.length > 0 && (
                          <div className="flex -space-x-1">
                            {task.assignedMembers.slice(0, 2).map((memberId) => {
                              const memberInfo = getMemberInfo(memberId);
                              return (
                                <UserAvatar
                                  key={memberInfo.id || memberId}
                                  src={memberInfo?.image}
                                  name={memberInfo?.name || memberId}
                                  size="xs"
                                  className="border border-background w-4 h-4"
                                />
                              );
                            })}
                            {task.assignedMembers.length > 2 && (
                              <div className="w-4 h-4 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-semibold text-muted-foreground">
                                +{task.assignedMembers.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-background overflow-x-auto" ref={scrollContainerRef}>
            <div className="relative" style={{ minWidth: `${daysToDisplay.length * dayWidth}px`, minHeight: `${Math.max(allTasks.length, 20) * 45}px` }}>
              {/* Grille de fond */}
              <div className="absolute inset-0 top-0 flex pointer-events-none" style={{ minHeight: `${Math.max(allTasks.length, 20) * 45}px` }}>
                {daysToDisplay.map((day, index) => {
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={index}
                      className={`border-r border-dashed border-border flex-shrink-0 h-full ${isWeekend ? "bg-muted/10" : ""} ${isToday ? "bg-primary/5 border-primary/20" : ""}`}
                      style={{ width: `${dayWidth}px` }}
                    />
                  );
                })}
              </div>

              {/* Barres de tâches */}
              <div className="relative min-h-full">
                {/* Lignes de fond pour toutes les tâches avec hover */}
                <div className="absolute inset-0">
                  {allTasks.map((task) => (
                    <div 
                      key={`line-${task.id}`} 
                      className={`h-[45px] transition-colors ${hoveredTaskId === task.id ? "bg-primary/2" : ""}`}
                      onMouseEnter={() => setHoveredTaskId(task.id)}
                      onMouseLeave={() => setHoveredTaskId(null)}
                    />
                  ))}
                  {Array.from({ length: Math.max(0, 20 - allTasks.length) }).map((_, index) => (
                    <div key={`empty-line-${index}`} className="h-[45px]" />
                  ))}
                </div>

                {/* Barres de tâches par-dessus */}
                <div className="relative pointer-events-none">
                  {allTasks.map((task) => {
                    const barStyle = getTaskBarStyle(task);
                    if (!barStyle || !barStyle.visible) {
                      return <div key={task.id} className="relative h-[45px]" />;
                    }

                    return (
                      <div key={task.id} className="relative h-[45px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-1/2 -translate-y-1/2 h-9 rounded-md cursor-pointer transition-all hover:shadow-md group border pointer-events-auto"
                              style={{
                                left: barStyle.left,
                                width: barStyle.width,
                                backgroundColor: `${task.column.color}20`,
                                borderColor: `${task.column.color}60`,
                              }}
                              onClick={() => onEditTask(task)}
                              onMouseEnter={() => setHoveredTaskId(task.id)}
                              onMouseLeave={() => setHoveredTaskId(null)}
                            >
                              <div className="px-2 py-0.5 flex items-center gap-1.5 h-full overflow-hidden">
                                {task.assignedMembers && task.assignedMembers.length > 0 && (
                                  <div className="flex -space-x-1 flex-shrink-0">
                                    {task.assignedMembers.slice(0, 1).map((memberId) => {
                                      const memberInfo = getMemberInfo(memberId);
                                      return (
                                        <UserAvatar
                                          key={memberInfo.id || memberId}
                                          src={memberInfo?.image}
                                          name={memberInfo?.name || memberId}
                                          size="xs"
                                          className="border border-background w-5 h-5"
                                        />
                                      );
                                    })}
                                    {task.assignedMembers.length > 1 && (
                                      <div className="w-5 h-5 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-semibold text-muted-foreground">
                                        +{task.assignedMembers.length - 1}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <span className="text-[11px] font-semibold truncate" style={{ color: task.column.color }}>
                                  {task.title}
                                </span>
                                {task.priority && task.priority.toLowerCase() !== 'none' && (
                                  <Flag className={`h-2.5 w-2.5 flex-shrink-0 ${
                                    task.priority.toLowerCase() === 'high' ? 'text-red-500 fill-red-500' :
                                    task.priority.toLowerCase() === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                                    'text-green-500 fill-green-500'
                                  }`} />
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-2">
                              <div className="font-normal text-sm">{task.title}</div>
                              <div className="flex items-center gap-3">
                                {task.assignedMembers && task.assignedMembers.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {task.assignedMembers.map((memberId) => {
                                      const memberInfo = getMemberInfo(memberId);
                                      return (
                                        <UserAvatar
                                          key={memberInfo.id || memberId}
                                          src={memberInfo?.image}
                                          name={memberInfo?.name || memberId}
                                          size="sm"
                                          className="border border-background"
                                        />
                                      );
                                    })}
                                  </div>
                                )}
                                <div className="text-xs opacity-70 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDateRange(task)}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div 
                                  className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1"
                                  style={{
                                    backgroundColor: `${task.column.color || "#94a3b8"}20`,
                                    borderColor: `${task.column.color || "#94a3b8"}20`,
                                    color: task.column.color || "#94a3b8"
                                  }}
                                >
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.column.color || "#94a3b8" }} />
                                  <span>{task.column.title}</span>
                                </div>
                                {task.priority && task.priority.toLowerCase() !== 'none' && (
                                  <Badge variant="outline" className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground">
                                    <Flag className={`h-4 w-4 ${
                                      task.priority.toLowerCase() === 'high' ? 'text-red-500 fill-red-500' :
                                      task.priority.toLowerCase() === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                                      'text-green-500 fill-green-500'
                                    }`} />
                                    <span className="text-muted-foreground">{getPriorityLabel(task.priority)}</span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour afficher le timer en temps réel
function LiveTimer({ timeTracking }) {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!timeTracking) return;

    const updateTime = () => {
      let total = timeTracking.totalSeconds || 0;
      if (timeTracking.isRunning && timeTracking.currentStartTime) {
        const startTime = new Date(timeTracking.currentStartTime);
        const now = new Date();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        if (elapsedSeconds > 0) total += elapsedSeconds;
      }
      setCurrentTime(Math.max(0, total));
    };

    updateTime();

    if (timeTracking.isRunning) {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [timeTracking]);

  const hours = Math.floor(currentTime / 3600);
  const minutes = Math.floor((currentTime % 3600) / 60);
  const seconds = currentTime % 60;

  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Composant pour afficher le prix en temps réel
function LivePrice({ timeTracking }) {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!timeTracking) return;

    const updateTime = () => {
      let total = timeTracking.totalSeconds || 0;
      if (timeTracking.isRunning && timeTracking.currentStartTime) {
        const startTime = new Date(timeTracking.currentStartTime);
        const now = new Date();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        if (elapsedSeconds > 0) total += elapsedSeconds;
      }
      setCurrentTime(Math.max(0, total));
    };

    updateTime();

    if (timeTracking.isRunning) {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [timeTracking]);

  if (!timeTracking?.hourlyRate) return null;
  
  const price = (currentTime / 3600 * timeTracking.hourlyRate).toFixed(2);
  return `${price}€`;
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

              {/* Images de la tâche (lecture seule) */}
              {task.images?.length > 0 && (
                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Images</span>
                    <span className="text-xs text-muted-foreground">({task.images.length})</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-6">
                    {task.images.map((image, index) => (
                      <Dialog key={image.id || index}>
                        <DialogTrigger asChild>
                          <div className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
                            <img
                              src={image.url}
                              alt={image.fileName || `Image ${index + 1}`}
                              className="w-full h-24 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0">
                          <img
                            src={image.url}
                            alt={image.fileName || `Image ${index + 1}`}
                            className="w-full h-auto max-h-[80vh] object-contain"
                          />
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Gestion du temps (lecture seule) - Style identique à TimerControls */}
              {task.timeTracking && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Label avec icône */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal">Gestion du temps</span>
                    </div>

                    {/* Indicateur d'état (cercle rouge si actif) */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      task.timeTracking.isRunning 
                        ? 'bg-red-500 animate-pulse' 
                        : 'bg-gray-300'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${task.timeTracking.isRunning ? 'bg-white' : 'bg-gray-600'}`} />
                    </div>
                    
                    {/* Affichage du temps en temps réel */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border border-border flex-shrink-0">
                      <span className="text-sm font-mono tabular-nums">
                        <LiveTimer timeTracking={task.timeTracking} />
                      </span>
                    </div>

                    {/* Prix à l'heure */}
                    {task.timeTracking.hourlyRate && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border border-border flex-shrink-0">
                        <span className="text-sm text-muted-foreground">{task.timeTracking.hourlyRate}€/h</span>
                      </div>
                    )}

                    {/* Lancé par - Affiché quand le timer est actif */}
                    {task.timeTracking.isRunning && task.timeTracking.startedBy && (
                      <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground flex-shrink-0">
                        <span>Lancé par</span>
                        <UserAvatar
                          src={task.timeTracking.startedBy.userImage}
                          name={task.timeTracking.startedBy.userName}
                          size="xs"
                          className="w-5 h-5"
                        />
                        <span className="font-medium text-foreground">{task.timeTracking.startedBy.userName}</span>
                      </div>
                    )}

                    {/* Prix estimé en temps réel */}
                    {task.timeTracking.hourlyRate && (
                      <div className="px-3 py-1.5 bg-muted/50 rounded-md border border-border inline-flex items-center gap-1.5 flex-shrink-0 ml-auto">
                        <span className="text-sm font-semibold">
                          <LivePrice timeTracking={task.timeTracking} />
                        </span>
                      </div>
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
      
      // Gérer les mises à jour de profil visiteur
      if (payload.type === 'VISITOR_PROFILE_UPDATED' && payload.visitor) {
        const visitor = payload.visitor;
        setBoardData(prev => {
          if (!prev?.tasks) return prev;
          // Mettre à jour les commentaires de toutes les tâches avec le nouveau profil visiteur
          const updatedTasks = prev.tasks.map(t => ({
            ...t,
            comments: (t.comments || []).map(c => 
              c.userEmail?.toLowerCase() === visitor.email?.toLowerCase()
                ? { ...c, userName: visitor.name, userImage: visitor.image }
                : c
            )
          }));
          return { ...prev, tasks: updatedTasks };
        });
        
        // Mettre à jour la tâche sélectionnée si elle a des commentaires de ce visiteur
        if (selectedTask) {
          setSelectedTask(prev => ({
            ...prev,
            comments: (prev.comments || []).map(c => 
              c.userEmail?.toLowerCase() === visitor.email?.toLowerCase()
                ? { ...c, userName: visitor.name, userImage: visitor.image }
                : c
            )
          }));
        }
        
        console.log('✅ [Public] Profil visiteur mis à jour:', visitor.name);
        return;
      }
      
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
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} visitorProfile={visitorProfile} onSave={handleProfileSave} loading={updatingProfile} token={token} visitorEmail={visitorEmail} />
      
      {boardData && (
        <>
          {/* Header - Style identique à l'interface utilisateur connecté */}
          <div className="sticky top-0 bg-background z-40">
            {/* Ligne 1: Titre du board */}
            <div className="flex items-center gap-2 pt-2 pb-2 border-b px-4 sm:px-6">
              <h1 className="text-base font-semibold">{boardData.title}</h1>
              {boardData.description && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlignLeft className="h-4 w-4 text-muted-foreground/70 hover:text-foreground cursor-pointer transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">{boardData.description}</TooltipContent>
                </Tooltip>
              )}
            </div>
            
            {/* Ligne 2: Onglets Board/List + Profil visiteur */}
            <div className="flex items-center justify-between gap-3 py-3 border-b px-4 sm:px-6">
              <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto items-center">
                <TabsList className="h-auto rounded-none bg-transparent p-0">
                  <TabsTrigger
                    value="board"
                    className="data-[state=active]:after:bg-primary cursor-pointer relative rounded-none py-2 px-3 md:px-4 after:absolute after:inset-x-0 after:-bottom-3 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-normal text-xs md:text-sm gap-2 hidden md:inline-flex hover:bg-[#5b50ff]/10 hover:text-[#5b50ff] rounded-md transition-colors"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span>Board</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    className="data-[state=active]:after:bg-primary cursor-pointer relative rounded-none py-2 px-3 md:px-4 after:absolute after:inset-x-0 after:-bottom-3 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-normal text-xs md:text-sm gap-2 hover:bg-[#5b50ff]/10 hover:text-[#5b50ff] rounded-md transition-colors"
                  >
                    <List className="h-4 w-4 md:inline hidden" />
                    <span>List</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="gantt"
                    className="data-[state=active]:after:bg-primary cursor-pointer relative rounded-none py-2 px-3 md:px-4 after:absolute after:inset-x-0 after:-bottom-3 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-normal text-xs md:text-sm gap-2 hidden md:inline-flex hover:bg-[#5b50ff]/10 hover:text-[#5b50ff] rounded-md transition-colors"
                  >
                    <GanttChart className="h-4 w-4" />
                    <span>Gantt</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-2">
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
                  <UserAvatar src={visitorProfile?.image} name={visitorProfile?.name || visitorEmail} colorKey={visitorEmail} size="sm" />
                  <span className="text-sm text-muted-foreground hidden sm:inline">{visitorProfile?.name || visitorEmail}</span>
                </div>
              </div>
            </div>
            
            {/* Ligne 3: Barre de recherche (visible en mode board) */}
            {viewMode === "board" && (
              <div className="px-4 sm:px-6 py-3 bg-background flex items-center gap-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher des tâches..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="pl-9 h-9" 
                  />
                  {searchQuery && (
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearchQuery("")}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
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
            ) : viewMode === "list" ? (
              <PublicListView columns={columns} tasksByColumn={filteredTasksByColumn} onEditTask={setSelectedTask} />
            ) : (
              <PublicGanttView columns={columns} tasksByColumn={filteredTasksByColumn} onEditTask={setSelectedTask} boardMembers={boardData?.members || []} />
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
