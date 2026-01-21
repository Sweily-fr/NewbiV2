"use client";

import React, { useState } from "react";
import { GripVertical, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * RowWithControls - A row container that can be selected and controlled
 * Features:
 * - Clickable header to select the entire row
 * - Shows controls (drag, delete) on hover/selection
 * - Accepts widgets via drag & drop
 */
export default function RowWithControls({
  row,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
  onInsertInRow,
  onClearElementSelection,
  children,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Direct click handler for selecting the row
  const handleSelectRow = (e) => {
    e.stopPropagation();
    if (onClearElementSelection) {
      onClearElementSelection();
    }
    onSelect(row.id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(row.id);
  };

  const handleDragOver = (e) => {
    if (e.dataTransfer.types.includes("application/x-widget-id")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const widgetId = e.dataTransfer.getData("application/x-widget-id");
    if (widgetId && onInsertInRow) {
      onInsertInRow(row.id, widgetId);
    }
  };

  const showControls = isSelected || isHovered;

  return (
    <div
      data-row-id={row.id}
      className={cn(
        "relative group"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelectRow}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Row container - layout based on row.layout property */}
      <div
        data-row-border
        className={cn(
          "flex gap-4 p-3 border border-dashed rounded-lg transition-colors duration-150",
          row.layout === 'vertical' ? "flex-col" : "flex-row items-stretch",
          isDragOver
            ? "border-[#5a50ff] bg-[#5a50ff]/5"
            : isSelected
            ? "border-[#5a50ff] bg-[rgba(90,80,255,0.03)]"
            : "border-neutral-300/70 hover:border-neutral-400"
        )}
      >
        {/* Controls - positioned closer to the row */}
        {showControls && (
          <div className="absolute -left-7 top-0 flex flex-col gap-0.5 z-10">
            <div
              className="p-1 rounded bg-white border border-neutral-200 cursor-grab active:cursor-grabbing hover:bg-neutral-100 shadow-sm"
              title="Glisser pour réorganiser la ligne"
            >
              <GripVertical className="w-3 h-3 text-neutral-500" />
            </div>
            <button
              onClick={handleDeleteClick}
              className="p-1 rounded bg-white border border-neutral-200 hover:bg-red-50 hover:border-red-300 text-neutral-500 hover:text-red-500 shadow-sm"
              title="Supprimer cette ligne"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Row header bar - clickable to select the row */}
        <div
          onClick={handleSelectRow}
          className={cn(
            "absolute -top-2.5 left-3 px-2 py-0.5 text-[10px] font-medium rounded z-20 flex items-center gap-1 cursor-pointer transition-all",
            isSelected
              ? "bg-[#5a50ff] text-white"
              : showControls
              ? "bg-neutral-200 text-neutral-600 hover:bg-[#5a50ff] hover:text-white"
              : "bg-neutral-100 text-neutral-400 opacity-0 group-hover:opacity-100 hover:bg-[#5a50ff] hover:text-white"
          )}
        >
          <span>{row.label || 'Ligne'}</span>
          <span className="opacity-70">•</span>
          <span className="opacity-70">{row.layout === 'vertical' ? '↕' : '↔'}</span>
        </div>

        {/* Children (BlockWithZones components) */}
        {children}
      </div>
    </div>
  );
}
