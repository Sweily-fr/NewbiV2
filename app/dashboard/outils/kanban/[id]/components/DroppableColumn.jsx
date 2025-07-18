import { useDroppable } from "@dnd-kit/core";

/**
 * Composant pour une zone de drop (colonne) dans le tableau Kanban
 */
export function DroppableColumn({ column, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-muted/30 rounded-xl p-3 min-w-[300px] max-w-[300px] border border-border transition-colors ${
        isOver ? "bg-accent/50 border-primary/50" : ""
      }`}
    >
      {children}
    </div>
  );
}
