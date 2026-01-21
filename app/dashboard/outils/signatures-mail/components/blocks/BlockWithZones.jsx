"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import BlockElement from "./BlockElement";
import { createElement, ELEMENT_TYPES, WIDGET_PALETTE } from "../../utils/block-registry";

/**
 * BlockWithZones - Container with drop zone detection
 * SIMPLIFIED: Uses widget IDs instead of block types
 */
export default function BlockWithZones({
  block,
  isSelected,
  onSelect,
  onDelete,
  onUpdateBlock,
  onElementSelect,
  selectedElementId,
  signatureData,
  onFieldChange,
  dropPosition,
  isDropTarget,
  onDragOver,
  onInsertInBlock,
  parentLayout,
  onMoveElement,
  clearSelection,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOverFromPalette, setIsDragOverFromPalette] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 });
  const [currentDropZone, setCurrentDropZone] = useState('center');
  const blockRef = useRef(null);
  const justDroppedRef = useRef(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    // Disable automatic layout changes to prevent other blocks from jumping during drag
    animateLayoutChanges: () => false,
  });

  const style = {
    // Only apply transform to the dragged item, not to other items
    transform: isDragging && transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isDragging ? transition : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  // For single-element containers, clicking selects the element directly
  const handleBlockClick = (e) => {
    e.stopPropagation();
    if (justDroppedRef.current) {
      justDroppedRef.current = false;
      return;
    }

    // For single-element containers, select the element for a better UX
    if (block.elements.length === 1 && onElementSelect) {
      // Clear block selection first, then select element
      onSelect(null);
      onElementSelect(block.elements[0].id, block.id);
    } else {
      // Clear element selection when selecting the block
      if (onElementSelect) onElementSelect(null, null);
      onSelect(block.id);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(block.id);
  };

  // Handle reordering elements within the same block
  const handleReorderElement = (draggedId, targetId, dropPos = 'before') => {
    const elements = block.elements;
    const draggedIndex = elements.findIndex(el => el.id === draggedId);
    const targetIndex = elements.findIndex(el => el.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const newElements = [...elements];
    const [removed] = newElements.splice(draggedIndex, 1);

    let insertIndex = targetIndex;
    if (draggedIndex < targetIndex) {
      insertIndex = targetIndex - 1;
    }
    if (dropPos === 'after') {
      insertIndex += 1;
    }

    newElements.splice(insertIndex, 0, removed);
    onUpdateBlock(block.id, { elements: newElements });
  };

  // Zone detection for dnd-kit drag
  const handleMouseMove = (e) => {
    if (!blockRef.current || !onDragOver) return;

    const rect = blockRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    let zone = 'center';
    if (relY < 0.2) zone = 'top';
    else if (relY > 0.8) zone = 'bottom';
    else if (relX < 0.2) zone = 'left';
    else if (relX > 0.8) zone = 'right';

    onDragOver(block.id, zone);
  };

  // Block is visually selected only if it's selected AND no element within it is selected
  // This prevents the block from appearing selected when an element inside is selected
  const isBlockVisuallySelected = isSelected && !selectedElementId;

  // For single-element blocks, show controls when the element is selected
  // because the element doesn't have its own drag/delete buttons
  const hasSingleElement = block.elements.length === 1;
  const isSingleElementSelected = hasSingleElement && selectedElementId && block.elements[0]?.id === selectedElementId;

  const showControls = !isDragging && (isBlockVisuallySelected || isSingleElementSelected || isHovered) && !isResizing;

  // Resize handlers
  const handleResizeStart = (e, direction = 'right') => {
    e.preventDefault();
    e.stopPropagation();
    if (!blockRef.current) return;

    const rect = blockRef.current.getBoundingClientRect();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      width: block.width || rect.width,
      direction,
    });
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeStart.x;
      const adjustedDelta = resizeStart.direction === 'left' ? -deltaX : deltaX;
      const container = blockRef.current?.closest('[data-signature-container]');
      const containerWidth = container ? container.clientWidth - 32 : 600;
      const newWidth = Math.min(containerWidth, Math.max(60, resizeStart.width + adjustedDelta));
      onUpdateBlock(block.id, { width: Math.round(newWidth) });
    };

    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, block.id, onUpdateBlock]);

  // Handle native drag over from palette (widget-id) or element
  const handleNativeDragOver = (e) => {
    const isWidgetDrag = e.dataTransfer.types.includes("application/x-widget-id");
    const isElementDrag = e.dataTransfer.types.includes("application/x-element-id");

    if (isWidgetDrag || isElementDrag) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = isWidgetDrag ? "copy" : "move";

      // Only show visual feedback (purple overlay) for widget drags from palette
      // Element drags have their own drop indicators at the element level
      if (isWidgetDrag) {
        setIsDragOverFromPalette(true);

        if (blockRef.current) {
          const rect = blockRef.current.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / rect.width;
          const relY = (e.clientY - rect.top) / rect.height;

          let zone = 'center';
          if (relY < 0.15) zone = 'top';
          else if (relY > 0.85) zone = 'bottom';
          else if (relX < 0.15) zone = 'left';
          else if (relX > 0.85) zone = 'right';

          setCurrentDropZone(zone);
        }
      }
    }
  };

  const handleNativeDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverFromPalette(false);
    }
  };

  // Map widget IDs to element types for dropping into containers
  const widgetToElementMap = {
    'widget-separator': ELEMENT_TYPES.SEPARATOR_LINE,
    'widget-spacer': ELEMENT_TYPES.SPACER,
    'widget-photo': ELEMENT_TYPES.PHOTO,
    'widget-logo': ELEMENT_TYPES.LOGO,
    'widget-social': ELEMENT_TYPES.SOCIAL_ICONS,
    'widget-text': ELEMENT_TYPES.TEXT,
  };

  const handleNativeDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFromPalette(false);
    justDroppedRef.current = true;

    // Clear all selections first
    if (clearSelection) {
      clearSelection();
    }

    // Handle widget drop from palette
    const widgetId = e.dataTransfer.getData("application/x-widget-id");
    if (widgetId) {
      // If dropping in the CENTER, add element to this container
      if (currentDropZone === 'center' && onUpdateBlock) {
        const elementType = widgetToElementMap[widgetId];
        if (elementType) {
          const newElement = createElement(elementType);
          if (newElement) {
            // Adjust separator orientation based on container layout
            // Container with vertical layout (elements stacked) → horizontal separator
            // Container with horizontal layout (elements side by side) → vertical separator
            if (elementType === ELEMENT_TYPES.SEPARATOR_LINE) {
              const containerLayout = block.layout || 'vertical';
              const separatorOrientation = containerLayout === 'horizontal' ? 'vertical' : 'horizontal';
              newElement.props = {
                ...newElement.props,
                orientation: separatorOrientation,
                ...(separatorOrientation === 'vertical'
                  ? { width: undefined }
                  : { width: '100%', height: undefined }
                ),
              };
            }
            const newElements = [...block.elements, newElement];
            onUpdateBlock(block.id, { elements: newElements });
            // Select the newly added element
            if (onElementSelect) {
              setTimeout(() => {
                onElementSelect(newElement.id, block.id);
              }, 0);
            }
            return;
          }
        }
      }

      // If not center, insert as new container next to this one
      if (onInsertInBlock) {
        const orientation = parentLayout === 'horizontal' ? 'vertical' : 'horizontal';
        onInsertInBlock(block.id, widgetId, orientation);
      }
      return;
    }

    // Handle element drop from another block
    const elementId = e.dataTransfer.getData("application/x-element-id");
    const sourceBlockId = e.dataTransfer.getData("application/x-source-block-id");
    if (elementId && sourceBlockId && onMoveElement) {
      if (sourceBlockId !== block.id) {
        // Note: clearSelection was already called at the beginning of handleNativeDrop
        onMoveElement(elementId, sourceBlockId, block.id);
      }
    }
  };

  // Check if container has only separator elements (for full-width behavior)
  const hasSeparatorOnly = block.elements.length === 1 && block.elements[0].type === 'separator-line';
  const shouldBeFullWidth = hasSeparatorOnly && parentLayout !== 'horizontal';

  const dimensionStyle = block.width && !shouldBeFullWidth
    ? { width: `${block.width}px`, flexShrink: 0 }
    : {};

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        blockRef.current = node;
      }}
      style={{ ...style, ...dimensionStyle }}
      className={cn(
        "relative group",
        shouldBeFullWidth ? "w-full" : block.width ? "" : "w-fit",
        isDragging && "z-50 cursor-grabbing",
        isResizing && "select-none"
      )}
      data-block-id={block.id}
      onMouseEnter={() => !isDragging && setIsHovered(true)}
      onMouseLeave={() => !isDragging && setIsHovered(false)}
      onClick={!isDragging ? handleBlockClick : undefined}
      onMouseMove={handleMouseMove}
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
    >
      {/* Drop indicators for dnd-kit */}
      {isDropTarget && dropPosition === 'top' && (
        <div className="absolute -top-0.5 left-0 right-0 h-px z-30 bg-[#5a50ff]" />
      )}
      {isDropTarget && dropPosition === 'bottom' && (
        <div className="absolute -bottom-0.5 left-0 right-0 h-px z-30 bg-[#5a50ff]" />
      )}
      {isDropTarget && dropPosition === 'left' && (
        <div className="absolute top-0 -left-0.5 bottom-0 w-px z-30 bg-[#5a50ff]" />
      )}
      {isDropTarget && dropPosition === 'right' && (
        <div className="absolute top-0 -right-0.5 bottom-0 w-px z-30 bg-[#5a50ff]" />
      )}
      {isDropTarget && dropPosition === 'center' && (
        <div className="absolute inset-0 z-20 rounded-lg bg-[#5a50ff]/10" />
      )}

      {/* Drop indicators for palette drag */}
      {isDragOverFromPalette && currentDropZone === 'center' && (
        <div className="absolute inset-0 z-20 rounded-lg bg-[#5a50ff]/15 pointer-events-none" />
      )}
      {isDragOverFromPalette && currentDropZone === 'top' && (
        <div className="absolute -top-0.5 left-0 right-0 h-0.5 z-30 bg-[#5a50ff] pointer-events-none" />
      )}
      {isDragOverFromPalette && currentDropZone === 'bottom' && (
        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 z-30 bg-[#5a50ff] pointer-events-none" />
      )}
      {isDragOverFromPalette && currentDropZone === 'left' && (
        <div className="absolute top-0 -left-0.5 bottom-0 w-0.5 z-30 bg-[#5a50ff] pointer-events-none" />
      )}
      {isDragOverFromPalette && currentDropZone === 'right' && (
        <div className="absolute top-0 -right-0.5 bottom-0 w-0.5 z-30 bg-[#5a50ff] pointer-events-none" />
      )}

      {/* Container */}
      <div
        className={cn(
          "relative p-3 rounded-lg border border-dashed transition-colors duration-150",
          isDragging
            ? "bg-white shadow-lg border-[#5a50ff]"
            : isDragOverFromPalette
            ? "border-[#5a50ff]"
            : isBlockVisuallySelected
            ? "border-[#5a50ff] bg-[rgba(90,80,255,0.03)]"
            : "border-neutral-300/70"
        )}
      >
        {/* Controls - positioned closer to the block */}
        {showControls && (
          <div className="absolute -left-7 top-0 flex flex-col gap-0.5 z-10">
            <div
              {...attributes}
              {...listeners}
              className="p-1 rounded bg-white border border-neutral-200 cursor-grab active:cursor-grabbing hover:bg-neutral-100 shadow-sm"
              title="Glisser pour réorganiser"
            >
              <GripVertical className="w-3 h-3 text-neutral-500" />
            </div>
            <button
              onClick={handleDeleteClick}
              className="p-1 rounded bg-white border border-neutral-200 hover:bg-red-50 hover:border-red-300 text-neutral-500 hover:text-red-500 shadow-sm"
              title="Supprimer ce conteneur"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Container label indicator when selected */}
        {isBlockVisuallySelected && (
          <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-[#5a50ff] text-white text-[10px] font-medium rounded z-20 flex items-center gap-1">
            <span>{block.label || 'Conteneur'}</span>
            <span className="opacity-70">•</span>
            <span className="opacity-70">{block.layout === 'horizontal' ? '↔' : '↕'}</span>
          </div>
        )}

        {/* Resize handles */}
        {(isHovered || isBlockVisuallySelected || isResizing) && !isDragging && !hasSeparatorOnly && (
          <>
            <div
              className="absolute top-0 -right-0.5 w-2 h-full cursor-ew-resize z-20 group/resize"
              onMouseDown={(e) => handleResizeStart(e, 'right')}
            >
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 right-0 w-0.5 h-6 rounded-full transition-all",
                isResizing ? "bg-[#5a50ff] h-full" : "bg-[#5a50ff] opacity-0 group-hover/resize:opacity-100"
              )} />
            </div>
            <div
              className="absolute top-0 -left-0.5 w-2 h-full cursor-ew-resize z-20 group/resize"
              onMouseDown={(e) => handleResizeStart(e, 'left')}
            >
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 left-0 w-0.5 h-6 rounded-full transition-all",
                isResizing ? "bg-[#5a50ff] h-full" : "bg-[#5a50ff] opacity-0 group-hover/resize:opacity-100"
              )} />
            </div>
          </>
        )}

        {/* Width indicator */}
        {isResizing && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#5a50ff] text-white text-[10px] font-medium rounded z-30 whitespace-nowrap">
            {block.width}px
          </div>
        )}

        {/* Elements */}
        <div
          className={cn(
            "flex",
            block.layout === "horizontal"
              ? "flex-row flex-wrap items-center gap-2"
              : "flex-col gap-1"
          )}
        >
          {block.elements.map((element) => (
            <BlockElement
              key={element.id}
              element={element}
              blockId={block.id}
              isSelected={selectedElementId === element.id}
              onSelect={(elementId, bId) => {
                // Clear block selection when selecting an element
                if (onSelect) onSelect(null);
                if (onElementSelect) onElementSelect(elementId, bId);
              }}
              signatureData={signatureData}
              onFieldChange={onFieldChange}
              isSingleElement={block.elements.length === 1}
              onMoveElement={onMoveElement}
              onReorderElement={handleReorderElement}
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

        {/* Empty state */}
        {block.elements.length === 0 && (
          <div className="py-4 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 rounded">
            Conteneur vide
          </div>
        )}
      </div>
    </div>
  );
}
