"use client";

import React, { useState } from "react";
import { cn } from "@/src/lib/utils";
import { WIDGET_PALETTE } from "../../utils/block-registry";
import {
  User,
  Phone,
  Share2,
  Type,
  Building2,
  Minus,
  MoveVertical,
  Image,
  UserCircle,
  GripVertical,
  LayoutGrid,
} from "lucide-react";

// Icon mapping for widget types
const WIDGET_ICONS = {
  User: User,
  Phone: Phone,
  Share2: Share2,
  Type: Type,
  Building2: Building2,
  Minus: Minus,
  Space: MoveVertical,
  Image: Image,
  UserCircle: UserCircle,
  LayoutGrid: LayoutGrid,
};

/**
 * BlockPalette - Library of widgets that can be added to the signature
 * Features:
 * - Displays available widgets
 * - Drag to add widget to canvas (creates a container)
 * - Click to add widget (fallback)
 */
export default function BlockPalette({ onAddWidget }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="px-1">
        <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
          Bibliothèque de widgets
        </h3>
        <p className="text-[11px] text-neutral-500 mt-1">
          Glissez un widget vers votre signature
        </p>
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-2 gap-2">
        {WIDGET_PALETTE.map((widget) => (
          <DraggableWidgetItem
            key={widget.id}
            widget={widget}
            onAdd={() => onAddWidget(widget.id)}
          />
        ))}
      </div>

      {/* Tips */}
      <div className="mt-6 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
        <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
          Conseils
        </h4>
        <ul className="text-[11px] text-neutral-500 space-y-1.5">
          <li className="flex items-start gap-2">
            <span style={{ color: '#5a50ff' }}>•</span>
            Glissez les widgets vers la signature
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: '#5a50ff' }}>•</span>
            Cliquez sur un élément pour le modifier
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: '#5a50ff' }}>•</span>
            Double-cliquez pour éditer le texte
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Draggable widget item in the palette (using native HTML5 drag)
 */
export function DraggableWidgetItem({ widget, onAdd }) {
  const [isDragging, setIsDragging] = useState(false);
  const IconComponent = WIDGET_ICONS[widget.icon] || User;

  const handleDragStart = (e) => {
    setIsDragging(true);
    // Store widget ID in dataTransfer for cross-component communication
    e.dataTransfer.setData("application/x-widget-id", widget.id);
    e.dataTransfer.effectAllowed = "copy";

    // Create a clean, fixed-size drag image to prevent deformation
    const dragImage = document.createElement("div");
    dragImage.style.cssText = `
      width: 120px;
      height: 80px;
      background: white;
      border: 1px solid #5a50ff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
      color: #5a50ff;
      box-shadow: 0 4px 12px rgba(90, 80, 255, 0.2);
      position: absolute;
      top: -1000px;
      left: -1000px;
    `;
    dragImage.textContent = widget.label;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 60, 40);
    // Clean up after a short delay
    requestAnimationFrame(() => {
      document.body.removeChild(dragImage);
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      data-palette-item
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative flex flex-col items-center justify-center p-3 rounded-lg border",
        "bg-white dark:bg-neutral-800",
        "transition-all duration-150 w-full cursor-grab active:cursor-grabbing select-none",
        isDragging
          ? "border-[#5a50ff] shadow-lg opacity-50 scale-95"
          : "border-neutral-200 dark:border-neutral-700 hover:border-[#5a50ff]/50 hover:shadow-sm"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
          isDragging ? "bg-[#5a50ff]/20" : "bg-[#5a50ff]/10"
        )}
      >
        <IconComponent
          className="w-4 h-4"
          style={{ color: '#5a50ff' }}
        />
      </div>
      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {widget.label}
      </span>
      <span className="text-[10px] text-neutral-400 mt-0.5 text-center line-clamp-1">
        {widget.description}
      </span>

      {/* Drag indicator */}
      <div className="absolute top-1 right-1 opacity-30">
        <GripVertical className="w-3 h-3 text-neutral-400" />
      </div>
    </div>
  );
}
