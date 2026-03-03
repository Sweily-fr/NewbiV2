/**
 * @deprecated Ce hook est OBSOLÈTE — les subscriptions temps réel
 * sont gérées dans useKanbanBoard.js.
 * Conservé uniquement pour éviter les erreurs d'import.
 */
export function useKanbanRealtimeSync() {
  return {
    isConnected: false,
    error: null,
    markAsUpdating: () => {},
  };
}
