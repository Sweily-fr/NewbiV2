import { useState } from 'react';
import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { Send, Edit2, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { UserAvatar } from '@/src/components/ui/user-avatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMutation } from '@apollo/client';
import { ADD_COMMENT, UPDATE_COMMENT, DELETE_COMMENT } from '@/src/graphql/kanbanQueries';
import { useSession } from '@/src/lib/auth-client';

const TaskActivityComponent = ({ task: initialTask, workspaceId, currentUser, boardMembers = [], columns = [], onTaskUpdate }) => {
  const [task, setTask] = useState(initialTask);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const { data: session } = useSession();

  React.useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  const enrichUserData = (item) => {
    if (item.userName && !item.userName.includes('@') && item.userImage) {
      return item;
    }
    
    if (session?.user && item.userId === session.user.id) {
      return {
        ...item,
        userName: session.user.name || session.user.email,
        userImage: session.user.image || null
      };
    }
    
    const member = boardMembers.find(m => m.userId === item.userId || m.id === item.userId);
    if (member) {
      return {
        ...item,
        userName: member.name || item.userName,
        userImage: member.image || item.userImage
      };
    }
    
    return item;
  };

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
    if (!newComment.trim()) return;

    const taskId = task.id || task._id;

    if (!taskId) {
      console.error('No task ID found!', task);
      return;
    }

    try {
      await addComment({
        variables: {
          taskId,
          input: { content: newComment },
          workspaceId
        },
        refetchQueries: ['GetBoard'],
        awaitRefetchQueries: true,
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;

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

  const comments = [...(task.comments || [])]
    .map(enrichUserData)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const activities = [...(task.activity || [])]
    .filter(a => a.type !== 'comment_added')
    .map(enrichUserData)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  const allActivity = [
    ...comments.map(c => ({ ...c, type: 'comment' })),
    ...activities.map(a => ({ ...a, type: 'activity' }))
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="all" className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <TabsContent value="all" className="space-y-3 mt-0">
            {allActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune activité
              </p>
            ) : (
              allActivity.map((item, index) => {
                const display = item.type === 'activity' ? getActivityDisplay(item) : null;
                return (
                  <div key={`${item.type}-${item.id || index}`} className="flex gap-3">
                    <UserAvatar
                      src={item.userImage}
                      name={item.userName}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      {item.type === 'comment' ? (
                        editingCommentId === item.id ? (
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
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                      setEditingCommentId(item.id);
                                      setEditingContent(item.content);
                                    }}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteComment(item.id)}
                                    disabled={deletingComment}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                            </div>
                          </>
                        )
                      ) : display ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="mr-1">{display.icon}</span>
                            {display.text}
                            {display.moveDetails && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1.5">
                                  <div 
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: display.moveDetails.from.color }}
                                  />
                                  <span className="text-xs text-foreground">
                                    {display.moveDetails.from.title}
                                  </span>
                                </div>
                                <span className="text-muted-foreground text-xs">→</span>
                                <div className="flex items-center gap-1.5">
                                  <div 
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: display.moveDetails.to.color }}
                                  />
                                  <span className="text-xs text-foreground">
                                    {display.moveDetails.to.title}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-3 mt-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun commentaire
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
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
                          <span className="text-sm font-medium">{comment.userName}</span>
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
                            <span className="text-sm font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          {comment.userId === currentUser?.id && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingContent(comment.content);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingComment}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </>
                    )}
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
              activities.map((activity, index) => {
                const display = getActivityDisplay(activity);
                return (
                  <div key={activity.id || index} className="flex gap-3">
                    <UserAvatar
                      src={activity.userImage}
                      name={activity.userName}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{activity.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="mr-1">{display.icon}</span>
                        {display.text}
                        {display.moveDetails && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: display.moveDetails.from.color }}
                              />
                              <span className="text-xs text-foreground">
                                {display.moveDetails.from.title}
                              </span>
                            </div>
                            <span className="text-muted-foreground text-xs">→</span>
                            <div className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: display.moveDetails.to.color }}
                              />
                              <span className="text-xs text-foreground">
                                {display.moveDetails.to.title}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </div>

        {/* Tabs juste au-dessus du textarea */}
        <TabsList className="grid w-full grid-cols-3 bg-transparent rounded-none h-auto p-0 border-t border-border">
          <TabsTrigger value="all" className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent">
            Tout ({allActivity.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent">
            Commentaires ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent">
            Activité ({activities.length})
          </TabsTrigger>
        </TabsList>

        {/* Zone de saisie de commentaire - Sticky en bas */}
        <div className="bg-background pb-3 pl-3 pr-3 pt-1 space-y-2 flex-shrink-0">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="min-h-[80px] text-sm"
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
            disabled={!newComment.trim() || addingComment}
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
