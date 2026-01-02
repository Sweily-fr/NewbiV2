import { useState, useEffect } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { useSession } from "@/src/lib/auth-client";
import {
  GET_BOARDS,
  CREATE_BOARD,
  UPDATE_BOARD,
  DELETE_BOARD,
  BOARD_UPDATED_SUBSCRIPTION,
} from "@/src/graphql/kanbanQueries";
import { toast } from "@/src/utils/debouncedToast";
import { useWorkspace } from "@/src/hooks/useWorkspace";

export const useKanbanBoards = () => {
  const { workspaceId } = useWorkspace();
  const { data: session, isPending: sessionLoading } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [boardToEdit, setBoardToEdit] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Attendre que la session soit chargée avant d'activer la subscription
  useEffect(() => {
    if (!sessionLoading && session?.user) {
      console.log('✅ [useKanbanBoards] Session chargée, activation subscription');
      setIsReady(true);
    }
  }, [sessionLoading, session]);

  // GraphQL queries and mutations
  const { data, loading: queryLoading } = useQuery(GET_BOARDS, {
    variables: { workspaceId },
    skip: !workspaceId,
    errorPolicy: "all",
  });

  // Subscription pour les mises à jour temps réel
  useSubscription(BOARD_UPDATED_SUBSCRIPTION, {
    variables: { workspaceId },
    skip: !workspaceId || !isReady || sessionLoading,
    onData: ({ data: subscriptionData, client }) => {
      if (subscriptionData?.data?.boardUpdated) {
        const { type, board, boardId } = subscriptionData.data.boardUpdated;
        
        console.log("🔄 [Kanban] Mise à jour temps réel:", type, board || boardId);
        
        // Mettre à jour le cache Apollo automatiquement
        const cache = client.cache;
        const existingBoards = cache.readQuery({
          query: GET_BOARDS,
          variables: { workspaceId },
        });

        if (existingBoards) {
          if (type === 'CREATED' && board) {
            // Vérifier si le board n'existe pas déjà pour éviter les doublons
            const boardExists = existingBoards.boards.some(b => b.id === board.id);
            if (!boardExists) {
              // Ajouter le nouveau board au cache
              cache.writeQuery({
                query: GET_BOARDS,
                variables: { workspaceId },
                data: {
                  boards: [...existingBoards.boards, board],
                },
              });
              toast.success(`Nouveau tableau créé: ${board.title}`, {
                description: "Mis à jour automatiquement"
              });
            }
          } else if (type === 'UPDATED' && board) {
            // Mettre à jour le board existant
            cache.writeQuery({
              query: GET_BOARDS,
              variables: { workspaceId },
              data: {
                boards: existingBoards.boards.map(b =>
                  b.id === board.id ? { ...b, ...board } : b
                ),
              },
            });
            toast.info(`Tableau modifié: ${board.title}`, {
              description: "Mis à jour automatiquement"
            });
          } else if (type === 'DELETED' && boardId) {
            // Supprimer le board du cache
            cache.writeQuery({
              query: GET_BOARDS,
              variables: { workspaceId },
              data: {
                boards: existingBoards.boards.filter(b => b.id !== boardId),
              },
            });
            toast.info("Tableau supprimé", {
              description: "Mis à jour automatiquement"
            });
          }
        }
      }
    },
    onError: (error) => {
      // Ne pas afficher d'erreur si c'est un problème d'authentification (changement d'organisation)
      if (error.message?.includes('connecté')) {
        // Silencieux - c'est normal pendant un changement d'organisation
        return;
      }
      console.error("❌ [Kanban] Erreur subscription:", error);
    }
  });

  const [createBoard, { loading: creating }] = useMutation(CREATE_BOARD, {
    onCompleted: () => {
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "" });
      // La subscription s'occupe de mettre à jour le cache et d'afficher le toast
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du tableau");
      console.error("Create board error:", error);
    },
  });

  const [updateBoard, { loading: updating }] = useMutation(UPDATE_BOARD, {
    onCompleted: () => {
      toast.success("Tableau modifié avec succès");
      setIsEditDialogOpen(false);
      setBoardToEdit(null);
      setFormData({ title: "", description: "" });
      // La subscription s'occupe de mettre à jour le cache
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification du tableau");
      console.error("Update board error:", error);
    },
  });

  const [deleteBoard, { loading: deleting }] = useMutation(DELETE_BOARD, {
    onCompleted: () => {
      toast.success("Tableau supprimé avec succès");
      setBoardToDelete(null);
      // La subscription s'occupe de mettre à jour le cache
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
      console.error("Delete board error:", error);
      setBoardToDelete(null);
    },
  });

  const boards = data?.boards || [];

  // Gérer l'état de chargement initial
  useEffect(() => {
    // Si on a un workspaceId et que la requête n'est plus en loading, on peut arrêter le loading initial
    if (workspaceId && !queryLoading && data !== undefined) {
      // Petit délai pour éviter les flashs trop rapides
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
    // Si on n'a pas de workspaceId, on continue d'afficher le skeleton jusqu'à ce qu'il soit disponible
  }, [workspaceId, queryLoading, data]);

  // Filter boards based on search term
  const filteredBoards = boards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (board.description &&
        board.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    await createBoard({
      variables: {
        input: {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
        },
        workspaceId,
      },
    });
  };

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    await updateBoard({
      variables: {
        input: {
          id: boardToEdit.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
        },
        workspaceId,
      },
    });
  };

  const handleDeleteClick = (board, e) => {
    e.stopPropagation();
    e.preventDefault();
    setBoardToDelete(board);
  };

  const handleEditClick = (board, e) => {
    e.stopPropagation();
    e.preventDefault();
    setBoardToEdit(board);
    setFormData({
      title: board.title,
      description: board.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!boardToDelete) return;

    try {
      await deleteBoard({
        variables: { id: boardToDelete.id, workspaceId },
      });
    } catch (error) {
      console.error("Error in handleConfirmDelete:", error);
    }
  };

  // Fonction pour supprimer directement par ID (utilisée pour la suppression multiple)
  const deleteBoardById = async (boardId) => {
    try {
      await deleteBoard({
        variables: { id: boardId, workspaceId },
      });
      return true;
    } catch (error) {
      console.error("Error in deleteBoardById:", error);
      return false;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return {
    // State
    searchTerm,
    setSearchTerm,
    boardToDelete,
    setBoardToDelete,
    boardToEdit,
    setBoardToEdit,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    formData,
    setFormData,

    // Data & Loading States
    boards: filteredBoards,
    loading: creating || updating || deleting,
    queryLoading,
    isInitialLoading,
    creating,
    updating,
    deleting,

    // Handlers
    handleCreateBoard,
    handleUpdateBoard,
    handleDeleteClick,
    handleEditClick,
    handleConfirmDelete,
    deleteBoardById,
    formatDate,
  };
};
