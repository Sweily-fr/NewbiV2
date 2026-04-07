import { useState } from "react";
import { toast } from "@/src/utils/debouncedToast";
import { useMutation } from "@apollo/client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  CREATE_COLUMN,
  UPDATE_COLUMN,
  DELETE_COLUMN,
  GET_BOARD,
} from "@/src/graphql/kanbanQueries";

export const useKanbanColumns = (boardId, refetchBoard) => {
  const { workspaceId } = useWorkspace();
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false);
  const [isDeleteColumnDialogOpen, setIsDeleteColumnDialogOpen] =
    useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnForm, setColumnForm] = useState({ title: "", color: "#3b82f6" });

  // Column mutations
  const [createColumn, { loading: createLoading }] = useMutation(
    CREATE_COLUMN,
    {
      update: (cache, { data }) => {
        if (!data?.createColumn) return;
        const newColumn = data.createColumn;
        try {
          const cacheData = cache.readQuery({
            query: GET_BOARD,
            variables: { id: boardId, workspaceId },
          });
          if (!cacheData?.board) return;
          const columnExists = cacheData.board.columns.some(
            (c) => c.id === newColumn.id,
          );
          if (!columnExists) {
            cache.writeQuery({
              query: GET_BOARD,
              variables: { id: boardId, workspaceId },
              data: {
                board: {
                  ...cacheData.board,
                  columns: [...cacheData.board.columns, newColumn].sort(
                    (a, b) => a.order - b.order,
                  ),
                },
              },
            });
          }
        } catch {
          // Cache miss — pas grave, la subscription prendra le relais
        }
      },
      onCompleted: () => {
        setIsAddColumnOpen(false);
        setColumnForm({ title: "", color: "#3b82f6" });
        toast.success("Colonne créée avec succès");
      },
      onError: (error) => {
        console.error("Erreur lors de la création de la colonne:", error);
        toast.error("Erreur lors de la création de la colonne");
      },
    },
  );

  const [updateColumn, { loading: updateLoading }] = useMutation(
    UPDATE_COLUMN,
    {
      update: (cache, { data }) => {
        if (!data?.updateColumn) return;
        const updatedCol = data.updateColumn;
        try {
          const cacheData = cache.readQuery({
            query: GET_BOARD,
            variables: { id: boardId, workspaceId },
          });
          if (!cacheData?.board) return;
          cache.writeQuery({
            query: GET_BOARD,
            variables: { id: boardId, workspaceId },
            data: {
              board: {
                ...cacheData.board,
                columns: cacheData.board.columns.map((c) =>
                  c.id === updatedCol.id ? { ...c, ...updatedCol } : c,
                ),
              },
            },
          });
        } catch {
          // Cache miss
        }
      },
      onCompleted: () => {
        toast.success("Colonne modifiée avec succès");
        setIsEditColumnOpen(false);
        setEditingColumn(null);
        setColumnForm({ title: "", color: "#3b82f6" });
      },
      onError: (error) => {
        console.error("Erreur lors de la modification de la colonne:", error);
        toast.error("Erreur lors de la modification de la colonne");
      },
    },
  );

  const [deleteColumn, { loading: deleteLoading }] = useMutation(
    DELETE_COLUMN,
    {
      onCompleted: () => {
        toast.success("Colonne supprimée avec succès");
      },
      onError: (error) => {
        console.error("Erreur lors de la suppression de la colonne:", error);
        toast.error("Erreur lors de la suppression de la colonne");
      },
    },
  );

  // Column form handlers
  const handleColumnFormChange = (field, value) => {
    setColumnForm((prev) => ({
      ...prev,
      [field]: value,
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
      const maxOrder =
        columns.length > 0
          ? Math.max(...columns.map((col) => col.order || 0))
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
          workspaceId,
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
          workspaceId,
        },
      });
    } catch (error) {
      console.error("Error updating column:", error);
    }
  };

  const handleDeleteColumn = (column) => {
    const columnToStore = typeof column === "object" ? column : { id: column };
    setColumnToDelete(columnToStore);
    setIsDeleteColumnDialogOpen(true);
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;

    try {
      const columnId = columnToDelete.id.toString();
      await deleteColumn({
        variables: {
          id: columnId,
          workspaceId,
        },
        update: (cache) => {
          try {
            const cacheData = cache.readQuery({
              query: GET_BOARD,
              variables: { id: boardId, workspaceId },
            });
            if (!cacheData?.board) return;
            cache.writeQuery({
              query: GET_BOARD,
              variables: { id: boardId, workspaceId },
              data: {
                board: {
                  ...cacheData.board,
                  columns: cacheData.board.columns.filter(
                    (c) => c.id !== columnId,
                  ),
                },
              },
            });
          } catch {
            // Cache miss
          }
        },
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
