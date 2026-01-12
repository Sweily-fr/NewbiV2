import { useState, useCallback, useRef } from 'react';
import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { Send, Edit2, Trash2, ChevronDown, ChevronUp, ImagePlus, X, ZoomIn, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/src/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { UserAvatar } from '@/src/components/ui/user-avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/src/components/ui/alert-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMutation, useQuery, gql } from '@apollo/client';
import { ADD_COMMENT, UPDATE_COMMENT, DELETE_COMMENT, GET_ORGANIZATION_MEMBERS } from '@/src/graphql/kanbanQueries';
import { useSession } from '@/src/lib/auth-client';
import { useAssignedMembersInfo } from '@/src/hooks/useAssignedMembersInfo';

const TaskActivityComponent = ({ task: initialTask, workspaceId, currentUser, boardMembers = [], columns = [], onTaskUpdate }) => {
  const [task, setTask] = useState(initialTask);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const { data: session } = useSession();

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

  // Récupérer les membres de l'organisation directement via GraphQL (même procédé que MemberSelector)
  const { data: membersData } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  React.useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  // Récupérer les IDs des utilisateurs des commentaires et activités
  const allUserIds = React.useMemo(() => {
    const ids = new Set();
    if (task?.comments) {
      task.comments.forEach(c => c.userId && ids.add(c.userId));
    }
    if (task?.activity) {
      task.activity.forEach(a => a.userId && ids.add(a.userId));
    }
    // Ajouter aussi l'utilisateur actuel
    if (session?.user?.id) {
      ids.add(session.user.id);
    }
    return Array.from(ids);
  }, [task?.comments, task?.activity, session?.user?.id]);

  // Récupérer les infos complètes des utilisateurs (avec avatars)
  const { members: usersInfo } = useAssignedMembersInfo(allUserIds);

  const enrichUserData = (item) => {
    // Si on a déjà le nom et l'image, retourner l'item
    if (item.userName && !item.userName.includes('@') && item.userImage) {
      return item;
    }
    
    // Chercher dans usersInfo d'abord (qui a les avatars depuis la collection user)
    const userInfo = usersInfo.find(u => u.id === item.userId);
    if (userInfo) {
      return {
        ...item,
        userName: userInfo.name || item.userName,
        userImage: userInfo.image || item.userImage
      };
    }
    
    // Fallback sur l'utilisateur actuel
    if (session?.user && item.userId === session.user.id) {
      return {
        ...item,
        userName: session.user.name || session.user.email,
        userImage: session.user.image || null
      };
    }
    
    return item;
  };

  // Mutation pour uploader les images de commentaires
  const UPLOAD_COMMENT_IMAGE = gql`
    mutation UploadCommentImage($taskId: ID!, $commentId: ID!, $file: Upload!, $workspaceId: ID) {
      uploadCommentImage(taskId: $taskId, commentId: $commentId, file: $file, workspaceId: $workspaceId) {
        success
        image {
          id
          key
          url
          fileName
          fileSize
          contentType
          uploadedBy
          uploadedAt
        }
        message
      }
    }
  `;

  const [uploadCommentImage] = useMutation(UPLOAD_COMMENT_IMAGE);

  const [addComment, { loading: addingComment }] = useMutation(ADD_COMMENT, {
    onCompleted: (data) => {
      if (data?.addComment) {
        setTask(data.addComment);
        if (onTaskUpdate) {
          onTaskUpdate(prev => ({ ...prev, comments: data.addComment.comments, activity: data.addComment.activity }));
        }
      }
    }
  });
  
  const [updateComment, { loading: updatingComment }] = useMutation(UPDATE_COMMENT, {
    onCompleted: (data) => {
      if (data?.updateComment) {
        setTask(data.updateComment);
      }
    }
  });
  
  const [deleteComment, { loading: deletingComment }] = useMutation(DELETE_COMMENT, {
    onCompleted: (data) => {
      if (data?.deleteComment) {
        setTask(data.deleteComment);
      }
    }
  });

  const handleAddComment = async () => {
    // Permettre l'envoi si texte OU images
    if (!newComment.trim() && pendingImages.length === 0) return;

    const taskId = task.id || task._id;

    if (!taskId) {
      console.error('No task ID found!', task);
      return;
    }

    try {
      setIsUploadingImage(true);
      
      // 1. Créer le commentaire (avec texte vide si seulement des images)
      const result = await addComment({
        variables: {
          taskId,
          input: { content: newComment || ' ' }, // Espace si vide pour éviter erreur
          workspaceId
        },
        refetchQueries: ['GetBoard'],
        awaitRefetchQueries: true,
      });

      // 2. Si des images sont en attente, les uploader
      if (pendingImages.length > 0 && result.data?.addComment?.comments) {
        // Trouver le commentaire qu'on vient de créer (le dernier)
        const comments = result.data.addComment.comments;
        const newCommentData = comments[comments.length - 1];
        
        if (newCommentData?.id) {
          // Collecter les images uploadées
          const uploadedImages = [];
          
          // Uploader chaque image
          for (const img of pendingImages) {
            try {
              const uploadResult = await uploadCommentImage({
                variables: {
                  taskId,
                  commentId: newCommentData.id,
                  file: img.file,
                  workspaceId
                },
                refetchQueries: ['GetBoard'],
              });
              
              // Collecter l'image uploadée
              if (uploadResult.data?.uploadCommentImage?.success) {
                uploadedImages.push(uploadResult.data.uploadCommentImage.image);
              }
            } catch (uploadError) {
              console.error('Error uploading comment image:', uploadError);
            }
            // Libérer l'URL de preview
            URL.revokeObjectURL(img.preview);
          }
          
          // Mettre à jour le state local avec les images uploadées
          if (uploadedImages.length > 0) {
            setTask(prevTask => {
              const updatedComments = prevTask.comments.map(c => {
                if (c.id === newCommentData.id) {
                  return {
                    ...c,
                    images: [...(c.images || []), ...uploadedImages]
                  };
                }
                return c;
              });
              return { ...prevTask, comments: updatedComments };
            });
          }
        }
      }

      // 3. Nettoyer
      setNewComment('');
      setPendingImages([]);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingContent.trim()) return;

    const taskId = task.id || task._id;
    if (!taskId) return;

    try {
      await updateComment({
        variables: {
          taskId,
          commentId,
          content: editingContent,
          workspaceId
        }
      });
      setEditingCommentId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const taskId = task.id || task._id;
    if (!taskId) return;

    try {
      await deleteComment({
        variables: {
          taskId,
          commentId,
          workspaceId
        }
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

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

  const getActivityDisplay = (activity) => {
    const icons = {
      created: '✨',
      updated: '📝',
      moved: '🔄',
      assigned: '👤',
      unassigned: '👤',
      completed: '✅',
      reopened: '🔓'
    };
    
    const fieldIcons = {
      title: '✏️',
      description: '📄',
      priority: '🎯',
      dueDate: '📅',
      tags: '🏷️',
      assignedTo: '👤',
      checklist: '✅'
    };
    
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
      const memberIds = [];
      
      if (activity.type === 'assigned' && Array.isArray(activity.newValue)) {
        memberIds.push(...activity.newValue);
      } else if (activity.type === 'unassigned' && Array.isArray(activity.oldValue)) {
        memberIds.push(...activity.oldValue);
      }
      
      const memberNames = memberIds
        .map(id => {
          const member = boardMembers.find(m => m.userId === id || m.id === id);
          return member ? member.name : null;
        })
        .filter(Boolean);
      
      if (memberNames.length > 0) {
        if (activity.type === 'assigned') {
          text = `a assigné ${memberNames.join(', ')}`;
        } else {
          text = `a désassigné ${memberNames.join(', ')}`;
        }
      }
    }
    
    let icon = icons[activity.type] || '📝';
    if (activity.type !== 'moved' && activity.field && fieldIcons[activity.field]) {
      icon = fieldIcons[activity.field];
    }
    
    return {
      icon: icon,
      text: text,
      moveDetails: moveDetails
    };
  };

  // Recalculer les commentaires et activités enrichis quand usersInfo change
  const comments = React.useMemo(() => {
    return [...(task.comments || [])]
      .map(enrichUserData)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [task?.comments, usersInfo, session?.user]);

  const activities = React.useMemo(() => {
    return [...(task.activity || [])]
      .filter(a => a.type !== 'comment_added')
      .map(enrichUserData)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [task?.activity, usersInfo, session?.user]);
  
  const allActivity = React.useMemo(() => {
    return [
      ...comments.map(c => ({ ...c, type: 'comment' })),
      ...activities.map(a => ({ ...a, type: 'activity' }))
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [comments, activities]);

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="all" className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pl-2 px-4 py-4">
          <TabsContent value="all" className="space-y-3 mt-0">
            {allActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune activité
              </p>
            ) : (
              <>
                {allActivity.length > 3 && !showAllActivities && (
                  <button
                    onClick={() => setShowAllActivities(true)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors"
                  >
                    <ChevronDown className="h-3 w-3" />
                    Voir plus ({allActivity.length - 3} activités)
                  </button>
                )}
                {allActivity.length > 3 && showAllActivities && (
                  <button
                    onClick={() => setShowAllActivities(false)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors"
                  >
                    <ChevronUp className="h-3 w-3" />
                    Voir moins
                  </button>
                )}
                {(showAllActivities ? allActivity : allActivity.slice(-3)).map((item, index) => {
                const display = item.type === 'activity' ? getActivityDisplay(item) : null;
                return (
                  <div key={`${item.type}-${item.id || index}`} className="flex gap-3">
                    {item.type === 'comment' ? (
                      <div className="bg-background rounded-lg p-3 flex-1 border border-border">
                        <div className="flex gap-3">
                          <UserAvatar
                            src={item.userImage}
                            name={item.userName}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 space-y-2">
                            {editingCommentId === item.id ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{item.userName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(item.createdAt)}
                                  </span>
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
                                      onClick={() => handleUpdateComment(item.id)}
                                      disabled={updatingComment}
                                      className="text-white hover:opacity-90"
                                      style={{ backgroundColor: '#5b50FF' }}
                                    >
                                      Enregistrer
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingContent('');
                                      }}
                                    >
                                      Annuler
                                    </Button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">{item.userName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(item.createdAt)}
                                    </span>
                                  </div>
                                  {item.userId === currentUser?.id && (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-muted-foreground"
                                        style={{ '--hover-color': '#5b50FF' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#5b50FF'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = ''}
                                        onClick={() => {
                                          setEditingCommentId(item.id);
                                          setEditingContent(item.content);
                                        }}
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <AlertDialog open={commentToDelete === item.id} onOpenChange={(open) => !open && setCommentToDelete(null)}>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => setCommentToDelete(item.id)}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogTitle>Supprimer le commentaire</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action ne peut pas être annulée.
                                          </AlertDialogDescription>
                                          <div className="flex gap-2 justify-end">
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => {
                                                handleDeleteComment(item.id);
                                                setCommentToDelete(null);
                                              }}
                                              disabled={deletingComment}
                                              className="bg-destructive text-white hover:bg-destructive/90"
                                            >
                                              Supprimer
                                            </AlertDialogAction>
                                          </div>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                                {/* Affichage des images du commentaire dans le fil "Tout" */}
                                {item.images && item.images.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    {item.images.map((image) => (
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
                                          <VisuallyHidden>
                                            <DialogTitle>Aperçu de l'image</DialogTitle>
                                          </VisuallyHidden>
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
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-8 flex items-start justify-center flex-shrink-0 pt-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                        </div>
                        <div className="flex-1 space-y-2">
                          {display ? (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap flex-1">
                                  <span className="text-xs font-normal">{item.userName}</span>
                                  <span className="text-xs text-muted-foreground">{display.text}</span>
                                  {display.moveDetails && (
                                    <>
                                      <div className="flex items-center gap-1">
                                        <div 
                                          className="w-2 h-2 rounded-full flex-shrink-0"
                                          style={{ backgroundColor: display.moveDetails.from.color }}
                                        />
                                        <span className="text-xs text-foreground">
                                          {display.moveDetails.from.title}
                                        </span>
                                      </div>
                                      <span className="text-muted-foreground text-xs">→</span>
                                      <div className="flex items-center gap-1">
                                        <div 
                                          className="w-2 h-2 rounded-full flex-shrink-0"
                                          style={{ backgroundColor: display.moveDetails.to.color }}
                                        />
                                        <span className="text-xs text-foreground">
                                          {display.moveDetails.to.title}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(item.createdAt)}
                                </span>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              </>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-3 mt-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun commentaire
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-background rounded-lg p-3 border border-border">
                  <div className="flex gap-3">
                    <UserAvatar
                      src={comment.userImage}
                      name={comment.userName}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      {editingCommentId === comment.id ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </span>
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
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={updatingComment}
                                className="text-white hover:opacity-90"
                                style={{ backgroundColor: '#5b50FF' }}
                              >
                                Enregistrer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingContent('');
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{comment.userName}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            {comment.userId === currentUser?.id && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-muted-foreground"
                                  style={{ '--hover-color': '#5b50FF' }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#5b50FF'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = ''}
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditingContent(comment.content);
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog open={commentToDelete === comment.id} onOpenChange={(open) => !open && setCommentToDelete(null)}>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => setCommentToDelete(comment.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogTitle>Supprimer le commentaire</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action ne peut pas être annulée.
                                    </AlertDialogDescription>
                                    <div className="flex gap-2 justify-end">
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          handleDeleteComment(comment.id);
                                          setCommentToDelete(null);
                                        }}
                                        disabled={deletingComment}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Supprimer
                                      </AlertDialogAction>
                                    </div>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
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
                                    <VisuallyHidden>
                                      <DialogTitle>Aperçu de l'image</DialogTitle>
                                    </VisuallyHidden>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-3 mt-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune activité
              </p>
            ) : (
              <>
                {activities.length > 3 && !showAllActivities && (
                  <button
                    onClick={() => setShowAllActivities(true)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors"
                  >
                    <ChevronDown className="h-3 w-3" />
                    Voir plus ({activities.length - 3} activités)
                  </button>
                )}
                {activities.length > 3 && showAllActivities && (
                  <button
                    onClick={() => setShowAllActivities(false)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-start gap-1 py-2 transition-colors"
                  >
                    <ChevronUp className="h-3 w-3" />
                    Voir moins
                  </button>
                )}
                {(showAllActivities ? activities : activities.slice(-3)).map((activity, index) => {
                const display = getActivityDisplay(activity);
                return (
                  <div key={activity.id || index} className="flex gap-3">
                    <div className="w-8 flex items-start justify-center flex-shrink-0 pt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap flex-1">
                          <span className="text-xs font-normal">{activity.userName}</span>
                          <span className="text-xs text-muted-foreground">{display.text}</span>
                          {display.moveDetails && (
                            <>
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: display.moveDetails.from.color }}
                                />
                                <span className="text-xs text-foreground">
                                  {display.moveDetails.from.title}
                                </span>
                              </div>
                              <span className="text-muted-foreground text-xs">→</span>
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: display.moveDetails.to.color }}
                                />
                                <span className="text-xs text-foreground">
                                  {display.moveDetails.to.title}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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

        {/* Zone de saisie de commentaire - Sticky en bas */}
        <div className="pb-3 pl-3 pr-3 pt-1 space-y-2 flex-shrink-0">
          <div
            className={`relative transition-all ${isDragOver ? 'ring-2 ring-primary ring-offset-2 rounded-md' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Textarea
              ref={textareaRef}
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
                disabled={isUploadingImage}
                className="h-8 px-2"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                Cmd/Ctrl + Entrée pour envoyer
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={(!newComment.trim() && pendingImages.length === 0) || addingComment || isUploadingImage}
            >
              <Send className="h-3 w-3 mr-2" />
              Envoyer
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export const TaskActivity = React.memo(TaskActivityComponent, (prevProps, nextProps) => {
  return (
    prevProps.task?.id === nextProps.task?.id &&
    prevProps.task?.comments === nextProps.task?.comments &&
    prevProps.task?.activity === nextProps.task?.activity &&
    prevProps.boardMembers === nextProps.boardMembers &&
    prevProps.columns === nextProps.columns
  );
});
