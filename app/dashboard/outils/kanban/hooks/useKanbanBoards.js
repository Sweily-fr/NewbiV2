import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_BOARDS, CREATE_BOARD, UPDATE_BOARD, DELETE_BOARD } from '@/src/graphql/kanbanQueries';
import { toast } from 'sonner';

export const useKanbanBoards = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [boardToEdit, setBoardToEdit] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });

  // GraphQL queries and mutations
  const { data, refetch } = useQuery(GET_BOARDS, {
    errorPolicy: "all",
  });

  const [createBoard, { loading: creating }] = useMutation(CREATE_BOARD, {
    onCompleted: () => {
      toast.success("Tableau créé avec succès");
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "" });
      refetch();
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
      refetch();
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
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
      console.error("Delete board error:", error);
      setBoardToDelete(null);
    },
    refetchQueries: [{ query: GET_BOARDS }],
    awaitRefetchQueries: true,
    update: (cache, { data }) => {
      if (data?.deleteBoard && boardToDelete) {
        try {
          const existingBoards = cache.readQuery({ query: GET_BOARDS });
          if (existingBoards) {
            cache.writeQuery({
              query: GET_BOARDS,
              data: {
                boards: existingBoards.boards.filter(
                  (board) => board.id !== boardToDelete.id
                ),
              },
            });
          }
        } catch (error) {
          console.warn("Erreur lors de la mise à jour du cache:", error);
        }
      }
    },
  });

  const boards = data?.boards || [];

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
        variables: { id: boardToDelete.id },
      });
    } catch (error) {
      console.error("Error in handleConfirmDelete:", error);
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
    creating,
    updating,
    deleting,
    
    // Handlers
    handleCreateBoard,
    handleUpdateBoard,
    handleDeleteClick,
    handleEditClick,
    handleConfirmDelete,
    formatDate,
  };
};
