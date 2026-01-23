"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { 
  GET_PUBLIC_SHARES, 
  CREATE_PUBLIC_SHARE, 
  DELETE_PUBLIC_SHARE,
  REVOKE_PUBLIC_SHARE,
  REVOKE_VISITOR_ACCESS,
  UNBAN_VISITOR,
  APPROVE_ACCESS_REQUEST,
  REJECT_ACCESS_REQUEST,
  ACCESS_REQUESTED_SUBSCRIPTION,
  VISITOR_PRESENCE_SUBSCRIPTION
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
  MoreHorizontal,
  UserX,
  ChevronDown,
  ChevronUp,
  Mail,
  Calendar,
  Ban,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Wifi
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";

export function ShareBoardDialog({ boardId, boardTitle, workspaceId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [deleteShareId, setDeleteShareId] = useState(null);
  const [expandedVisitors, setExpandedVisitors] = useState({});
  const [expandedBanned, setExpandedBanned] = useState({});
  const [expandedRequests, setExpandedRequests] = useState({});
  const [revokeVisitorInfo, setRevokeVisitorInfo] = useState(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [connectedVisitors, setConnectedVisitors] = useState([]);
  
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

  // Mutation pour révoquer l'accès d'un visiteur (le bannit)
  const [revokeVisitor, { loading: revokingVisitor }] = useMutation(REVOKE_VISITOR_ACCESS, {
    onCompleted: () => {
      toast.success("Accès révoqué et visiteur banni");
      setRevokeVisitorInfo(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    }
  });

  // Mutation pour débannir un visiteur
  const [unbanVisitor, { loading: unbanning }] = useMutation(UNBAN_VISITOR, {
    onCompleted: () => {
      toast.success("Visiteur débanni");
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    }
  });

  // Mutation pour approuver une demande d'accès
  const [approveRequest, { loading: approving }] = useMutation(APPROVE_ACCESS_REQUEST, {
    onCompleted: () => {
      toast.success("Demande approuvée");
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    }
  });

  // Mutation pour rejeter une demande d'accès
  const [rejectRequest, { loading: rejecting }] = useMutation(REJECT_ACCESS_REQUEST, {
    onCompleted: () => {
      toast.success("Demande rejetée");
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    }
  });

  // Subscription pour les nouvelles demandes d'accès (temps réel)
  useSubscription(ACCESS_REQUESTED_SUBSCRIPTION, {
    variables: { boardId },
    skip: !boardId,
    onData: ({ data }) => {
      const payload = data?.data?.accessRequested;
      if (payload) {
        console.log('📩 [ShareDialog] Nouvelle demande d\'accès:', payload);
        toast.info(`Nouvelle demande d'accès de ${payload.name || payload.email}`);
        setPendingRequestsCount(prev => prev + 1);
        refetch();
      }
    }
  });

  // Subscription pour la présence des visiteurs (temps réel)
  useSubscription(VISITOR_PRESENCE_SUBSCRIPTION, {
    variables: { boardId },
    skip: !boardId,
    onData: ({ data }) => {
      const payload = data?.data?.visitorPresence;
      if (payload) {
        console.log('👤 [ShareDialog] Présence visiteur:', payload);
        if (payload.isConnected) {
          setConnectedVisitors(prev => {
            if (!prev.find(v => v.email === payload.email)) {
              return [...prev, payload];
            }
            return prev;
          });
        } else {
          setConnectedVisitors(prev => prev.filter(v => v.email !== payload.email));
        }
      }
    }
  });

  // Calculer le nombre de demandes en attente à partir des données
  useEffect(() => {
    if (data?.getPublicShares) {
      const totalPending = data.getPublicShares.reduce((acc, share) => {
        return acc + (share.accessRequests?.filter(r => r.status === 'pending').length || 0);
      }, 0);
      setPendingRequestsCount(totalPending);
    }
  }, [data]);

  const toggleVisitors = (shareId) => {
    setExpandedVisitors(prev => ({
      ...prev,
      [shareId]: !prev[shareId]
    }));
  };

  const toggleBanned = (shareId) => {
    setExpandedBanned(prev => ({
      ...prev,
      [shareId]: !prev[shareId]
    }));
  };

  const toggleRequests = (shareId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [shareId]: !prev[shareId]
    }));
  };

  const handleUnban = (shareId, email) => {
    unbanVisitor({
      variables: { shareId, visitorEmail: email, workspaceId }
    });
  };

  const handleApproveRequest = (shareId, requestId) => {
    approveRequest({
      variables: { shareId, requestId, workspaceId }
    });
  };

  const handleRejectRequest = (shareId, requestId) => {
    rejectRequest({
      variables: { shareId, requestId, workspaceId }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <Button variant="outline" className="gap-2 relative">
            <Share2 className="h-4 w-4" />
            Partager
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
              </span>
            )}
            {connectedVisitors.length > 0 && (
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
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
            {/* Visiteurs connectés en temps réel */}
            {connectedVisitors.length > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {connectedVisitors.length} visiteur{connectedVisitors.length > 1 ? 's' : ''} connecté{connectedVisitors.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {connectedVisitors.map((visitor) => (
                    <div key={visitor.email} className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-background rounded-full border border-green-200 dark:border-green-700">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={visitor.image} />
                        <AvatarFallback className="text-[10px]">
                          {(visitor.name || visitor.email || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{visitor.name || visitor.email?.split('@')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                <ScrollArea className="max-h-[350px]">
                  <div className="space-y-2 pb-4">
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

                        {/* Section visiteurs */}
                        {share.visitors && share.visitors.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-between p-0 h-auto hover:bg-transparent"
                              onClick={() => toggleVisitors(share.id)}
                            >
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {share.visitors.length} visiteur{share.visitors.length > 1 ? 's' : ''} avec accès
                              </span>
                              {expandedVisitors[share.id] ? (
                                <ChevronUp className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Button>
                            
                            {expandedVisitors[share.id] && (
                              <div className="mt-2 space-y-2">
                                {share.visitors.map((visitor) => (
                                  <div 
                                    key={visitor.id || visitor.email} 
                                    className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={visitor.image} />
                                        <AvatarFallback className="text-xs">
                                          {(visitor.name || visitor.email || '?')[0].toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium">
                                          {visitor.name || visitor.firstName || visitor.email?.split('@')[0]}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {visitor.email}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Eye className="h-3 w-3" />
                                          {visitor.visitCount || 1} visite{(visitor.visitCount || 1) > 1 ? 's' : ''}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {formatDate(visitor.lastVisitAt)}
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setRevokeVisitorInfo({ shareId: share.id, email: visitor.email, name: visitor.name || visitor.email })}
                                      >
                                        <UserX className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Section demandes d'accès en attente */}
                        {share.accessRequests?.filter(r => r.status === 'pending').length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-between p-0 h-auto hover:bg-transparent"
                              onClick={() => toggleRequests(share.id)}
                            >
                              <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                <Clock className="h-3 w-3" />
                                {share.accessRequests.filter(r => r.status === 'pending').length} demande{share.accessRequests.filter(r => r.status === 'pending').length > 1 ? 's' : ''} en attente
                              </span>
                              {expandedRequests[share.id] ? (
                                <ChevronUp className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Button>
                            
                            {expandedRequests[share.id] && (
                              <div className="mt-2 space-y-2">
                                {share.accessRequests.filter(r => r.status === 'pending').map((request) => (
                                  <div 
                                    key={request.id} 
                                    className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">
                                            {request.name || request.email?.split('@')[0]}
                                          </span>
                                          <Badge variant="outline" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300">
                                            En attente
                                          </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                          <Mail className="h-3 w-3" />
                                          {request.email}
                                        </span>
                                        {request.message && (
                                          <p className="text-xs text-muted-foreground mt-2 italic">
                                            "{request.message}"
                                          </p>
                                        )}
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                          <Clock className="h-3 w-3" />
                                          Demandé le {formatDate(request.requestedAt)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                                          onClick={() => handleApproveRequest(share.id, request.id)}
                                          disabled={approving}
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => handleRejectRequest(share.id, request.id)}
                                          disabled={rejecting}
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Section emails bannis */}
                        {share.bannedEmails && share.bannedEmails.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-between p-0 h-auto hover:bg-transparent"
                              onClick={() => toggleBanned(share.id)}
                            >
                              <span className="flex items-center gap-1 text-xs text-destructive">
                                <Ban className="h-3 w-3" />
                                {share.bannedEmails.length} accès révoqué{share.bannedEmails.length > 1 ? 's' : ''}
                              </span>
                              {expandedBanned[share.id] ? (
                                <ChevronUp className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Button>
                            
                            {expandedBanned[share.id] && (
                              <div className="mt-2 space-y-2">
                                {share.bannedEmails.map((banned, index) => (
                                  <div 
                                    key={banned.email || index} 
                                    className="flex items-center justify-between p-2 bg-destructive/5 border border-destructive/20 rounded-md"
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-destructive">
                                        {banned.email}
                                      </span>
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Banni le {formatDate(banned.bannedAt)}
                                      </span>
                                      {banned.reason && (
                                        <span className="text-xs text-muted-foreground italic mt-0.5">
                                          {banned.reason}
                                        </span>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                                      onClick={() => handleUnban(share.id, banned.email)}
                                      disabled={unbanning}
                                    >
                                      <UserCheck className="h-3 w-3 mr-1" />
                                      Débannir
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
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
              className="bg-destructive text-white hover:bg-destructive/90"
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

      {/* Dialog de confirmation de révocation d'accès visiteur */}
      <AlertDialog open={!!revokeVisitorInfo} onOpenChange={() => setRevokeVisitorInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer l'accès de ce visiteur ?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{revokeVisitorInfo?.name}</span> ne pourra plus accéder 
              au tableau via ce lien de partage. Il devra se reconnecter avec son email pour 
              retrouver l'accès.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeVisitor({ 
                variables: { 
                  shareId: revokeVisitorInfo?.shareId, 
                  visitorEmail: revokeVisitorInfo?.email,
                  workspaceId 
                } 
              })}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {revokingVisitor ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserX className="h-4 w-4 mr-2" />
              )}
              Révoquer l'accès
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
