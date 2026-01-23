"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Widget wrapper component that handles drag & drop and selection
 */
export default function Widget({
  id,
  children,
  isSelected,
  onSelect,
  onDelete,
  isDraggable = true,
  className,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect?.(id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isSelected && "ring-2 ring-blue-500 ring-offset-1 rounded",
        isDragging && "z-50",
        className
      )}
      onClick={handleClick}
    >
      {/* Drag handle - visible on hover */}
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "absolute -left-6 top-1/2 -translate-y-1/2 p-1 rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800",
            isSelected && "opacity-100"
          )}
        >
          <GripVertical className="w-3 h-3 text-neutral-400" />
        </div>
      )}

      {/* Delete button - visible on hover when selected */}
      {isSelected && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="absolute -right-6 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      {/* Widget content */}
      {children}
    </div>
  );
}
