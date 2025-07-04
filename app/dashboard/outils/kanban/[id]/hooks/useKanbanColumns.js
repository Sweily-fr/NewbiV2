import { useState } from 'react';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { GET_BOARD, CREATE_COLUMN, UPDATE_COLUMN, DELETE_COLUMN } from '@/src/graphql/kanbanQueries';

export const useKanbanColumns = (boardId, refetchBoard) => {
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false);
  const [isDeleteColumnDialogOpen, setIsDeleteColumnDialogOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnForm, setColumnForm] = useState({ title: "", color: "#3b82f6" });

  // Column mutations
  const [createColumn, { loading: createLoading }] = useMutation(CREATE_COLUMN, {
    refetchQueries: [{ query: GET_BOARD, variables: { id: boardId } }],
    onCompleted: () => {
      toast.success("Colonne créée avec succès");
      setIsAddColumnOpen(false);
      setColumnForm({ title: "", color: "#3b82f6" });
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de la colonne");
    },
  });

  const [updateColumn, { loading: updateLoading }] = useMutation(UPDATE_COLUMN, {
    refetchQueries: [{ query: GET_BOARD, variables: { id: boardId } }],
    onCompleted: () => {
      toast.success("Colonne modifiée avec succès");
      setIsEditColumnOpen(false);
      setEditingColumn(null);
      setColumnForm({ title: "", color: "#3b82f6" });
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification de la colonne");
    },
  });

  const [deleteColumn, { loading: deleteLoading }] = useMutation(DELETE_COLUMN, {
    refetchQueries: [{ query: GET_BOARD, variables: { id: boardId } }],
    onCompleted: () => {
      toast.success("Colonne supprimée avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression de la colonne");
    },
  });

  // Column form handlers
  const handleColumnFormChange = (field, value) => {
    setColumnForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Column CRUD operations
  const handleCreateColumn = async () => {
    if (!columnForm.title.trim()) {
      toast.error("Le titre de la colonne est requis");
      return;
    }

    try {
      // Get current board data to determine the next order position
      const { data } = await refetchBoard();
      const columns = data?.board?.columns || [];
      
      // Calculate the next order position (highest order + 1)
      const maxOrder = columns.length > 0 
        ? Math.max(...columns.map(col => col.order || 0)) 
        : -1;
      const newOrder = maxOrder + 1;

      await createColumn({
        variables: {
          input: {
            title: columnForm.title,
            color: columnForm.color,
            boardId: boardId,
            order: newOrder,
          },
        },
      });
    } catch (error) {
      console.error("Error creating column:", error);
      toast.error("Erreur lors de la création de la colonne");
    }
  };

  const handleUpdateColumn = async () => {
    if (!columnForm.title.trim()) {
      toast.error("Le titre de la colonne est requis");
      return;
    }

    try {
      await updateColumn({
        variables: {
          input: {
            id: editingColumn.id,
            title: columnForm.title,
            color: columnForm.color,
          },
        },
      });
    } catch (error) {
      console.error("Error updating column:", error);
    }
  };

  const handleDeleteColumn = (column) => {
    const columnToStore = typeof column === 'object' ? column : { id: column };
    setColumnToDelete(columnToStore);
    setIsDeleteColumnDialogOpen(true);
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;

    try {
      const columnId = columnToDelete.id.toString();
      await deleteColumn({ 
        variables: { 
          id: columnId
        } 
      });
      setIsDeleteColumnDialogOpen(false);
      setColumnToDelete(null);
    } catch (error) {
      console.error("Error deleting column:", error);
      toast.error("Erreur lors de la suppression de la colonne");
    }
  };

  // Modal handlers
  const openEditModal = (column) => {
    setEditingColumn(column);
    setColumnForm({ title: column.title, color: column.color });
    setIsEditColumnOpen(true);
  };

  const openAddModal = () => {
    setColumnForm({ title: "", color: "#3b82f6" });
    setIsAddColumnOpen(true);
  };

  return {
    // State
    isAddColumnOpen,
    isEditColumnOpen,
    isDeleteColumnDialogOpen,
    columnToDelete,
    editingColumn,
    columnForm,
    loading: createLoading || updateLoading || deleteLoading,
    
    // Setters
    setIsAddColumnOpen,
    setIsEditColumnOpen,
    setIsDeleteColumnDialogOpen,
    setColumnToDelete,
    setEditingColumn,
    setColumnForm,
    
    // Handlers
    handleColumnFormChange,
    handleCreateColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    confirmDeleteColumn,
    openEditModal,
    openAddModal,
  };
};
