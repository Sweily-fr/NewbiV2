"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Trash2, Settings } from "lucide-react";
import { cn } from "@/src/lib/utils";
import BlockElement from "./BlockElement";

/**
 * Block - Container component for signature elements
 * Features:
 * - Visible border (dashed when not selected, solid when selected)
 * - Drag handle to reorder blocks
 * - Delete button
 * - Internal drag & drop for elements
 */
export default function Block({
  block,
  isSelected,
  onSelect,
  onDelete,
  onUpdateBlock,
  onElementSelect,
  selectedElementId,
  signatureData,
  onFieldChange,
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Block-level sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Sensors for internal element drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle element reorder within block
  const handleElementDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = block.elements.findIndex((el) => el.id === active.id);
    const newIndex = block.elements.findIndex((el) => el.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newElements = arrayMove(block.elements, oldIndex, newIndex);
      onUpdateBlock(block.id, { elements: newElements });
    }
  };

  const handleBlockClick = (e) => {
    e.stopPropagation();
    onSelect(block.id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(block.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all duration-200",
        isDragging && "z-50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleBlockClick}
    >
      {/* Block container with border */}
      <div
        className={cn(
          "relative p-3 rounded-lg transition-all duration-200",
          // Border styles
          isSelected
            ? "border-2 border-blue-500 bg-blue-50/30 dark:bg-blue-900/10"
            : isHovered
            ? "border border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-800/30"
            : "border border-transparent"
        )}
      >
        {/* Block controls - visible on hover or when selected */}
        <div
          className={cn(
            "absolute -left-10 top-0 flex flex-col gap-1 transition-opacity duration-200",
            isSelected || isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 cursor-grab active:cursor-grabbing hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-sm"
            title="Glisser pour réorganiser"
          >
            <GripVertical className="w-3.5 h-3.5 text-neutral-500" />
          </div>

          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 text-neutral-500 hover:text-red-500 shadow-sm transition-colors"
            title="Supprimer ce bloc"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Block label - visible when selected or hovered */}
        {(isSelected || isHovered) && (
          <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
            {block.label}
          </div>
        )}

        {/* Elements container with internal drag & drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleElementDragEnd}
        >
          <SortableContext
            items={block.elements.map((el) => el.id)}
            strategy={
              block.layout === "horizontal"
                ? horizontalListSortingStrategy
                : verticalListSortingStrategy
            }
          >
            <div
              className={cn(
                "flex gap-1",
                block.layout === "horizontal"
                  ? "flex-row flex-wrap items-center"
                  : "flex-col"
              )}
            >
              {block.elements.map((element) => (
                <BlockElement
                  key={element.id}
                  element={element}
                  blockId={block.id}
                  isSelected={selectedElementId === element.id}
                  onSelect={onElementSelect}
                  signatureData={signatureData}
                  onFieldChange={onFieldChange}
                  onUpdateElement={(elementId, newProps) => {
                    const newElements = block.elements.map((el) =>
                      el.id === elementId
                        ? { ...el, props: { ...el.props, ...newProps } }
                        : el
                    );
                    onUpdateBlock(block.id, { elements: newElements });
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Drop indicator for empty block */}
        {block.elements.length === 0 && (
          <div className="py-4 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-600 rounded">
            Bloc vide - ajoutez des éléments
          </div>
        )}
      </div>
    </div>
  );
}
