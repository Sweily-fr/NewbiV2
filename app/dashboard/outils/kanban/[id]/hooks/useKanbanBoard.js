import { useQuery } from '@apollo/client';
import { GET_BOARD } from '@/src/graphql/kanbanQueries';

export const useKanbanBoard = (id) => {
  const { data, loading, error, refetch } = useQuery(GET_BOARD, {
    variables: { id },
    errorPolicy: "all",
  });

  const board = data?.board;
  const columns = board?.columns || [];

  // Get tasks by column
  const getTasksByColumn = (columnId) => {
    if (!board?.tasks) return [];
    return board.tasks
      .filter((task) => task.columnId === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  return {
    board,
    columns,
    loading,
    error,
    refetch,
    getTasksByColumn,
  };
};
