"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { 
  GET_PUBLIC_SHARES, 
  CREATE_PUBLIC_SHARE, 
  DELETE_PUBLIC_SHARE,
  REVOKE_PUBLIC_SHARE 
} from "@/src/graphql/kanbanQueries";
import { toast } from "@/src/components/ui/sonner";

// UI Components
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { ScrollArea } from "@/src/components/ui/scroll-area";

// Icons
import { 
  Share2, 
  Copy, 
  Check, 
  Link2, 
  Trash2, 
  Eye, 
  EyeOff,
  MessageSquare,
  Users,
  Plus,
  Loader2,
  ExternalLink,
  MoreHorizontal
} from "lucide-react";

export function ShareBoardDialog({ boardId, boardTitle, workspaceId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [deleteShareId, setDeleteShareId] = useState(null);
  
  // État du formulaire de création
  const [newShareName, setNewShareName] = useState("");
  const [permissions, setPermissions] = useState({
    canViewTasks: true,
    canComment: true,
    canViewComments: true,
    canViewAssignees: true,
    canViewDueDates: true,
    canViewAttachments: true
  });

  // Query pour récupérer les liens existants
  const { data, loading, refetch } = useQuery(GET_PUBLIC_SHARES, {
    variables: { boardId, workspaceId },
    skip: !isOpen || !boardId
  });

  // Mutation pour créer un lien
  const [createShare, { loading: creating }] = useMutation(CREATE_PUBLIC_SHARE, {
    onCompleted: () => {
      toast.success("Lien de partage créé !");
      setShowCreateForm(false);
      setNewShareName("");
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    }
  });

  // Mutation pour supprimer un lien
  const [deleteShare, { loading: deleting }] = useMutation(DELETE_PUBLIC_SHARE, {
    onCompleted: () => {
      toast.success("Lien supprimé");
      setDeleteShareId(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    }
  });

  // Mutation pour révoquer un lien
  const [revokeShare] = useMutation(REVOKE_PUBLIC_SHARE, {
    onCompleted: () => {
      toast.success("Lien désactivé");
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    }
  });

  const handleCreateShare = () => {
    createShare({
      variables: {
        input: {
          boardId,
          name: newShareName || `Lien partagé - ${new Date().toLocaleDateString('fr-FR')}`,
          permissions
        },
        workspaceId
      }
    });
  };

  const handleCopyLink = async (shareUrl, shareId) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(shareId);
      toast.success("Lien copié !");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleToggleActive = (share) => {
    if (share.isActive) {
      revokeShare({
        variables: { id: share.id, workspaceId }
      });
    }
  };

  const shares = data?.getPublicShares || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Partager
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Partager "{boardTitle}"
            </DialogTitle>
            <DialogDescription>
              Créez un lien pour permettre à des utilisateurs externes de voir ce tableau 
              et d'ajouter des commentaires.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Bouton pour créer un nouveau lien */}
            {!showCreateForm && (
              <Button 
                onClick={() => setShowCreateForm(true)} 
                className="w-full gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Créer un nouveau lien de partage
              </Button>
            )}

            {/* Formulaire de création */}
            {showCreateForm && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="shareName">Nom du lien (optionnel)</Label>
                  <Input
                    id="shareName"
                    placeholder="Ex: Lien client, Lien équipe..."
                    value={newShareName}
                    onChange={(e) => setNewShareName(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Les visiteurs pourront voir le tableau et ajouter des commentaires
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateShare}
                    disabled={creating}
                    className="flex-1"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Créer le lien
                  </Button>
                </div>
              </div>
            )}

            {/* Liste des liens existants */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : shares.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Liens existants</Label>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {shares.map((share) => (
                      <div 
                        key={share.id} 
                        className={`border rounded-lg p-3 space-y-2 ${
                          !share.isActive ? 'opacity-60 bg-muted/50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {share.name || "Lien de partage"}
                            </span>
                            {!share.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Désactivé
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCopyLink(share.shareUrl, share.id)}
                              disabled={!share.isActive}
                            >
                              {copiedId === share.id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(share.shareUrl, '_blank')}
                              disabled={!share.isActive}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48 p-2" align="end">
                                {share.isActive && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2"
                                    onClick={() => handleToggleActive(share)}
                                  >
                                    <EyeOff className="h-4 w-4" />
                                    Désactiver
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteShareId(share.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Supprimer
                                </Button>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Statistiques */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {share.stats?.totalViews || 0} vues
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {share.stats?.uniqueVisitors || 0} visiteurs
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {share.stats?.totalComments || 0} commentaires
                          </span>
                        </div>

                        {/* Permission commentaires */}
                        <Badge variant="outline" className="text-xs">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Commentaires activés
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : !showCreateForm && (
              <div className="text-center py-8 text-muted-foreground">
                <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucun lien de partage</p>
                <p className="text-xs mt-1">
                  Créez un lien pour partager ce tableau avec des utilisateurs externes
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteShareId} onOpenChange={() => setDeleteShareId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce lien de partage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les personnes ayant ce lien ne pourront 
              plus accéder au tableau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteShare({ 
                variables: { id: deleteShareId, workspaceId } 
              })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
