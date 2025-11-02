import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

/**
 * Composant pour rendre une colonne draggable avec dnd-kit
 * Le header de la colonne est draggable pour réorganiser les colonnes
 */
export function SortableColumn({ column, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      column,
    },
    transition: {
      duration: 200, // Durée de la transition en ms
      easing: "cubic-bezier(0.25, 1, 0.5, 1)", // Courbe d'accélération fluide
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    willChange: "transform",
  };

  // Cloner l'enfant et ajouter les props de drag au header + isOver
  const childWithDragProps = React.cloneElement(children, {
    dragHandleProps: { ...attributes, ...listeners },
    isDragging,
    isOver,
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0"
    >
      {childWithDragProps}
    </div>
  );
}
