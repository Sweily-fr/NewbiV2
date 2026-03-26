import React, { useState, useMemo } from "react";
import { Trash2, Edit2, Send } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";
import { useSession } from "@/src/lib/auth-client";

export function PendingCommentsView({
  pendingComments,
  addPendingComment,
  removePendingComment,
  updatePendingComment,
  currentUser,
}) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const userIds = useMemo(() => {
    return session?.user?.id ? [session.user.id] : [];
  }, [session?.user?.id]);

  const { members: usersInfo } = useAssignedMembersInfo(userIds);

  const currentUserInfo = useMemo(() => {
    if (usersInfo && usersInfo.length > 0) return usersInfo[0];
    return {
      name: session?.user?.name || currentUser?.name || "Utilisateur",
      image: session?.user?.image || currentUser?.avatarUrl || null,
    };
  }, [usersInfo, session?.user, currentUser]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addPendingComment?.(newComment);
    setNewComment("");
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleSaveEdit = (commentId) => {
    if (!editingContent.trim()) return;
    updatePendingComment?.(commentId, editingContent.trim());
    setEditingCommentId(null);
    setEditingContent("");
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
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
                                  style={{ backgroundColor: "#5b50FF", color: "white" }}
                                  className="hover:opacity-90"
                                >
                                  Enregistrer
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
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

      <div className="pb-3 pl-3 pr-3 pt-3 space-y-2 flex-shrink-0 border-t border-border">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="min-h-[80px] text-sm bg-background border-border"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Cmd/Ctrl + Entrée pour envoyer</span>
          <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
            <Send className="h-3 w-3 mr-2" />
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
