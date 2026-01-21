"use client";

import React, { useCallback } from "react";
import { cn } from "@/src/lib/utils";
import ContainerNode from "./ContainerNode";
import { createContainerFromWidget } from "../../utils/block-registry";

/**
 * BlockCanvasAdvanced - Canvas for the signature editor
 *
 * Uses the unified container architecture:
 * - Single rootContainer that holds the entire signature structure
 * - ContainerNode handles recursive rendering
 * - All containers are selectable and configurable
 */
export default function BlockCanvasAdvanced({
  rootContainer,
  onRootContainerChange,
  selectedContainerId,
  onContainerSelect,
  selectedElementId,
  onElementSelect,
  hoveredContainerId,
  onContainerHover,
  onContainerUpdate,
  onContainerDelete,
  onElementUpdate,
  onElementDelete,
  onAddContainer,
  onMoveContainer,
  onMoveElement,
  onReorderContainer,
  onReorderElement,
  signatureData,
  onFieldChange,
}) {
  // Handle widget drop - adds a new container as child of the target
  const handleWidgetDrop = useCallback((targetContainerId, widgetId) => {
    const newContainer = createContainerFromWidget(widgetId);
    if (newContainer && onAddContainer) {
      onAddContainer(targetContainerId, newContainer);
      // Select the new container
      onContainerSelect(newContainer.id);
    }
  }, [onAddContainer, onContainerSelect]);

  // Clear all selections when clicking on empty canvas area
  const handleCanvasClick = useCallback((e) => {
    // Only clear if clicking directly on the canvas background
    if (e.target === e.currentTarget) {
      onContainerSelect(null);
      onElementSelect(null, null);
    }
  }, [onContainerSelect, onElementSelect]);

  // Handle native drag over from palette
  const handleNativeDragOver = useCallback((e) => {
    if (e.dataTransfer.types.includes("application/x-widget-id")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  // Handle native drop from palette (on empty canvas)
  const handleNativeDrop = useCallback((e) => {
    e.preventDefault();

    // Only handle if root container exists and we're dropping on canvas
    if (!rootContainer) return;

    const widgetId = e.dataTransfer.getData("application/x-widget-id");
    if (widgetId) {
      // Add to root container
      handleWidgetDrop(rootContainer.id, widgetId);
    }
  }, [rootContainer, handleWidgetDrop]);

  // Render empty state when no root container
  if (!rootContainer) {
    return (
      <div
        className="w-full h-full p-4"
        onClick={handleCanvasClick}
        onDragOver={handleNativeDragOver}
        onDrop={handleNativeDrop}
      >
        <div className="w-full border border-dashed rounded-lg p-4 border-neutral-300/70">
          <EmptyState />
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full p-4"
      onClick={handleCanvasClick}
      onDragOver={handleNativeDragOver}
      onDrop={handleNativeDrop}
    >
      <ContainerNode
        container={rootContainer}
        depth={0}
        parentLayout="vertical"
        selectedContainerId={selectedContainerId}
        selectedElementId={selectedElementId}
        hoveredContainerId={hoveredContainerId}
        onHover={onContainerHover}
        onSelect={onContainerSelect}
        onDelete={onContainerDelete}
        onUpdate={onContainerUpdate}
        onElementSelect={onElementSelect}
        onElementUpdate={onElementUpdate}
        onElementDelete={onElementDelete}
        onDrop={handleWidgetDrop}
        onMoveContainer={onMoveContainer}
        onMoveElement={onMoveElement}
        onReorderContainer={onReorderContainer}
        onReorderElement={onReorderElement}
        signatureData={signatureData}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg border-neutral-200 w-full">
      <p className="text-sm text-neutral-500">
        Sélectionnez un modèle ou ajoutez des widgets depuis la bibliothèque
      </p>
    </div>
  );
}
