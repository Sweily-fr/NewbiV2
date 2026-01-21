"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * DraggableElement - Wrapper for signature elements that enables drag & drop
 * and element visibility controls
 */
export default function DraggableElement({
  id,
  children,
  isSelected,
  isHidden,
  onSelect,
  onToggleVisibility,
  isDraggable = true,
  className,
  elementType,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable || isHidden });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isHidden ? 0.3 : 1,
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect?.(id);
  };

  // If hidden, show a placeholder
  if (isHidden) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "relative group py-1 px-2 -mx-2 rounded border border-dashed border-neutral-300 dark:border-neutral-600",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <EyeOff className="w-3 h-3" />
            {elementType || "Élément"} masqué
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.(id, false);
            }}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Afficher"
          >
            <Eye className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isSelected && "ring-2 ring-blue-500 ring-offset-1 rounded -m-1 p-1",
        isDragging && "z-50",
        className
      )}
      onClick={handleClick}
    >
      {/* Controls - visible on hover or when selected */}
      <div
        className={cn(
          "absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-0.5",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          isSelected && "opacity-100"
        )}
      >
        {/* Drag handle */}
        {isDraggable && (
          <div
            {...attributes}
            {...listeners}
            className="p-1 rounded cursor-grab hover:bg-neutral-100 dark:hover:bg-neutral-800 active:cursor-grabbing"
            title="Glisser pour réorganiser"
          >
            <GripVertical className="w-3 h-3 text-neutral-400" />
          </div>
        )}

        {/* Hide button */}
        {onToggleVisibility && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.(id, true);
            }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500"
            title="Masquer cet élément"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Element content */}
      {children}
    </div>
  );
}
