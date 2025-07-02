import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  GET_BOARD,
  GET_BOARDS,
  GET_TASKS,
  CREATE_BOARD,
  UPDATE_BOARD,
  DELETE_BOARD,
  CREATE_COLUMN,
  UPDATE_COLUMN,
  DELETE_COLUMN,
  REORDER_COLUMNS,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  MOVE_TASK
} from '../graphql/kanbanQueries';

// Hook pour gérer les tableaux
export const useBoards = () => {
  const { data, loading, error, refetch } = useQuery(GET_BOARDS);
  return {
    boards: data?.boards || [],
    loading,
    error,
    refetch
  };
};

export const useBoard = (id) => {
  const { data, loading, error, refetch } = useQuery(GET_BOARD, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network'
  });

  return {
    board: data?.board,
    loading,
    error,
    refetch
  };
};

export const useCreateBoard = () => {
  const [createBoard, { loading, error }] = useMutation(CREATE_BOARD, {
    update(cache, { data: { createBoard: newBoard } }) {
      cache.modify({
        fields: {
          boards(existingBoards = []) {
            return [...existingBoards, newBoard];
          }
        }
      });
    }
  });

  return { createBoard, loading, error };
};

export const useUpdateBoard = () => {
  const [updateBoard, { loading, error }] = useMutation(UPDATE_BOARD);
  return { updateBoard, loading, error };
};

export const useDeleteBoard = () => {
  const [deleteBoard, { loading, error }] = useMutation(DELETE_BOARD);
  return { deleteBoard, loading, error };
};

// Hook pour gérer les colonnes
export const useCreateColumn = () => {
  const [createColumn, { loading, error }] = useMutation(CREATE_COLUMN);
  return { createColumn, loading, error };
};

export const useUpdateColumn = () => {
  const [updateColumn, { loading, error }] = useMutation(UPDATE_COLUMN);
  return { updateColumn, loading, error };
};

export const useDeleteColumn = () => {
  const [deleteColumn, { loading, error }] = useMutation(DELETE_COLUMN);
  return { deleteColumn, loading, error };
};

export const useReorderColumns = () => {
  const [reorderColumns, { loading, error }] = useMutation(REORDER_COLUMNS);
  return { reorderColumns, loading, error };
};

// Hook pour gérer les tâches
export const useTasks = (boardId, columnId = null) => {
  const { data, loading, error, refetch } = useQuery(GET_TASKS, {
    variables: { boardId, columnId },
    skip: !boardId,
    fetchPolicy: 'cache-and-network'
  });

  return {
    tasks: data?.tasks || [],
    loading,
    error,
    refetch
  };
};

export const useCreateTask = () => {
  const [createTask, { loading, error }] = useMutation(CREATE_TASK);
  return { createTask, loading, error };
};

export const useUpdateTask = () => {
  const [updateTask, { loading, error }] = useMutation(UPDATE_TASK);
  return { updateTask, loading, error };
};

export const useDeleteTask = () => {
  const [deleteTask, { loading, error }] = useMutation(DELETE_TASK);
  return { deleteTask, loading, error };
};

export const useMoveTask = () => {
  const [moveTask, { loading, error }] = useMutation(MOVE_TASK);
  return { moveTask, loading, error };
};

// Hook personnalisé pour gérer les opérations de drag and drop
export const useTaskDragAndDrop = () => {
  const { moveTask } = useMoveTask();
  const client = useApolloClient();

  const onDragEnd = async (result, boardId) => {
    const { destination, source, draggableId, type } = result;

    // Si on ne peut pas déposer l'élément à la destination
    if (!destination) return;

    // Si l'élément est déposé au même endroit
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Si on déplace une colonne
    if (type === 'COLUMN') {
      try {
        // Récupérer les colonnes actuelles
        const { data } = await client.query({
          query: GET_BOARD,
          variables: { id: boardId },
          fetchPolicy: 'network-only'
        });

        // Créer une copie profonde du tableau des colonnes
        const columns = data.board.columns.map(col => ({ ...col }));
        const [movedColumn] = columns.splice(source.index, 1);
        columns.splice(destination.index, 0, movedColumn);

        // Mettre à jour l'ordre des colonnes
        await client.mutate({
          mutation: REORDER_COLUMNS,
          variables: {
            columns: columns.map(col => col.id)
          },
          optimisticResponse: {
            reorderColumns: true
          },
          update: (cache) => {
            cache.modify({
              id: `Board:${boardId}`,
              fields: {
                columns: () => columns
              }
            });
          }
        });
      } catch (error) {
        console.error('Error reordering columns:', error);
      }
      return;
    }

    // Si on déplace une tâche
    try {
      await moveTask({
        variables: {
          id: draggableId,
          columnId: destination.droppableId,
          position: destination.index
        },
        optimisticResponse: {
          moveTask: {
            __typename: 'Task',
            id: draggableId,
            columnId: destination.droppableId,
            position: destination.index
          }
        },
        update: (cache, { data: { moveTask: updatedTask } }) => {
          // Mettre à jour le cache pour refléter le déplacement
          cache.modify({
            id: `Task:${draggableId}`,
            fields: {
              columnId: () => updatedTask.columnId,
              position: () => destination.index
            }
          });
        }
      });
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  return { onDragEnd };
};
