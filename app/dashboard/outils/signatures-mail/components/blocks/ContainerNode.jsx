"use client";

import React, { useState, useRef, useEffect } from "react";
import { GripVertical, Trash2, Columns, Rows } from "lucide-react";
import { cn } from "@/src/lib/utils";
import BlockElement from "./BlockElement";

/**
 * ContainerNode - Recursive component for rendering containers
 *
 * A container can have:
 * - elements: direct child elements (leaf node)
 * - children: child containers (branch node)
 * - both: elements AND children
 *
 * Features:
 * - Recursive rendering of nested containers
 * - Selectable at any level
 * - Drag & drop support for containers and elements
 * - Layout toggle (horizontal/vertical)
 */
export default function ContainerNode({
  container,
  depth = 0,
  parentLayout = "vertical",
  selectedContainerId,
  selectedElementId,
  hoveredContainerId,
  onHover,
  onSelect,
  onDelete,
  onUpdate,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onDrop,
  onMoveContainer,
  onMoveElement,
  onReorderContainer,
  onReorderElement,
  signatureData,
  onFieldChange,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after' | null
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState(null); // 'right' | 'bottom' | null
  const containerRef = useRef(null);

  // Check if this container is hovered (using global state)
  const isHovered = hoveredContainerId === container.id;

  // Reset isDragOver and dropPosition when drag ends anywhere
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsDragOver(false);
      setDropPosition(null);
    };

    const handleGlobalDrop = () => {
      setIsDragOver(false);
      setDropPosition(null);
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  const isRoot = container.isRoot;
  const hasElements = container.elements && container.elements.length > 0;
  const hasChildren = container.children && container.children.length > 0;

  // Check if container only has separator elements - these need to stretch
  const hasSeparatorOnly = hasElements &&
    container.elements.length === 1 &&
    container.elements[0].type === 'separator-line';

  // Should this container stretch to fill parent?
  // Containers with separators should stretch to allow separator to fill space
  const shouldStretch = hasSeparatorOnly;

  // Check if this container is selected
  const isThisContainerSelected = selectedContainerId === container.id;

  // Visual states - show selection style only when container is selected AND no element is selected
  const isContainerSelected = isThisContainerSelected && !selectedElementId;
  // Show controls when selected, hovered, OR while dragging
  const showControls = !isRoot && (isContainerSelected || isHovered || isDragging);

  // Handle container selection
  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(container.id);
  };

  // Handle delete
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(container.id);
  };

  // Handle layout toggle
  const handleLayoutToggle = (e) => {
    e.stopPropagation();
    const newLayout = container.layout === "horizontal" ? "vertical" : "horizontal";
    onUpdate(container.id, { layout: newLayout });
  };

  // ============ DRAG START HANDLERS ============

  // Handle drag start for container
  const handleContainerDragStart = (e) => {
    if (isRoot) return;
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData("application/x-container-id", container.id);
    e.dataTransfer.effectAllowed = "move";
    console.log("🚀 [ContainerNode] Drag started for container:", container.id);
  };

  const handleContainerDragEnd = () => {
    setIsDragging(false);
    console.log("🛑 [ContainerNode] Drag ended for container:", container.id);
  };

  // ============ RESIZE HANDLERS (COMMENTED OUT FOR NOW) ============
  // TODO: Réactiver quand la fonctionnalité sera finalisée

  // // Handle resize start
  // const handleResizeStart = (edge) => (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setIsResizing(true);
  //   setResizeEdge(edge);

  //   const startX = e.clientX;
  //   const startY = e.clientY;
  //   const startWidth = container.width || containerRef.current?.offsetWidth || 100;
  //   const startHeight = container.height || containerRef.current?.offsetHeight || 100;

  //   // Get parent container's dimensions to limit resize
  //   const parentElement = containerRef.current?.parentElement?.closest('[data-container-id]');
  //   const parentWidth = parentElement?.offsetWidth || window.innerWidth;
  //   const parentPadding = parentElement ? parseInt(window.getComputedStyle(parentElement).padding) * 2 : 0;
  //   const maxWidth = parentWidth - parentPadding - 4; // 4px margin for safety

  //   const handleMouseMove = (moveEvent) => {
  //     if (edge === 'right') {
  //       const deltaX = moveEvent.clientX - startX;
  //       const newWidth = Math.min(maxWidth, Math.max(60, startWidth + deltaX));
  //       onUpdate(container.id, { width: newWidth });
  //     } else if (edge === 'bottom') {
  //       const deltaY = moveEvent.clientY - startY;
  //       const newHeight = Math.max(40, startHeight + deltaY);
  //       onUpdate(container.id, { height: newHeight });
  //     }
  //   };

  //   const handleMouseUp = () => {
  //     setIsResizing(false);
  //     setResizeEdge(null);
  //     document.removeEventListener('mousemove', handleMouseMove);
  //     document.removeEventListener('mouseup', handleMouseUp);
  //   };

  //   document.addEventListener('mousemove', handleMouseMove);
  //   document.addEventListener('mouseup', handleMouseUp);
  // };

  // ============ DROP HANDLERS ============

  // Handle drag over for drops
  const handleDragOver = (e) => {
    const hasWidget = e.dataTransfer.types.includes("application/x-widget-id");
    const hasContainer = e.dataTransfer.types.includes("application/x-container-id");
    const hasElement = e.dataTransfer.types.includes("application/x-element-id");

    if (hasWidget || hasContainer || hasElement) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = hasWidget ? "copy" : "move";

      // Calculate drop position for container reordering
      if (hasContainer && containerRef.current && !isRoot) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseY = e.clientY;
        const mouseX = e.clientX;

        // Determine position based on parent layout
        const isHorizontalParent = parentLayout === "horizontal";

        if (isHorizontalParent) {
          const midX = rect.left + rect.width / 2;
          setDropPosition(mouseX < midX ? 'before' : 'after');
        } else {
          const midY = rect.top + rect.height / 2;
          setDropPosition(mouseY < midY ? 'before' : 'after');
        }
      } else {
        setDropPosition(null);
      }

      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
      setDropPosition(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const currentDropPosition = dropPosition;
    setIsDragOver(false);
    setDropPosition(null);

    console.log("📥 [ContainerNode] Drop received on container:", container.id, "position:", currentDropPosition);

    // Handle widget drop (from palette)
    const widgetId = e.dataTransfer.getData("application/x-widget-id");
    if (widgetId && onDrop) {
      console.log("📥 [ContainerNode] Widget drop:", widgetId);
      onDrop(container.id, widgetId);
      return;
    }

    // Handle container drop (reordering or moving)
    const containerId = e.dataTransfer.getData("application/x-container-id");
    if (containerId && containerId !== container.id) {
      // Use reorderContainer if we have a drop position (sibling reorder)
      if (currentDropPosition && onReorderContainer) {
        console.log("📥 [ContainerNode] Reordering container", containerId, currentDropPosition, container.id);
        onReorderContainer(containerId, container.id, currentDropPosition);
      } else if (onMoveContainer) {
        // Fall back to moving container into this one
        console.log("📥 [ContainerNode] Moving container", containerId, "into", container.id);
        onMoveContainer(containerId, container.id);
      }
      return;
    }

    // Handle element drop (moving between containers)
    const elementData = e.dataTransfer.getData("application/x-element-id");
    if (elementData && onMoveElement) {
      const [elementId, sourceContainerId] = elementData.split("::");
      if (sourceContainerId !== container.id) {
        console.log("📥 [ContainerNode] Moving element", elementId, "from", sourceContainerId, "to", container.id);
        onMoveElement(elementId, sourceContainerId, container.id);
      }
    }
  };

  // Get border color based on state
  const getBorderColor = () => {
    if (dropPosition) return "border-[#5a50ff]/30";
    if (isDragOver) return "border-[#5a50ff] bg-[#5a50ff]/5";
    if (isContainerSelected) return "border-[#5a50ff] bg-[rgba(90,80,255,0.03)]";
    if (isHovered && !isRoot) return "border-neutral-400";
    return "border-neutral-300/70";
  };

  // Drop indicator component for container reordering
  const DropIndicator = ({ position }) => {
    const isHorizontalParent = parentLayout === "horizontal";

    if (isHorizontalParent) {
      return (
        <div
          className={cn(
            "absolute top-0 bottom-0 w-0.5 z-20 pointer-events-none",
            position === 'before' ? "-left-1.5" : "-right-1.5"
          )}
          style={{ backgroundColor: '#5a50ff' }}
        />
      );
    }

    return (
      <div
        className={cn(
          "absolute left-0 right-0 h-0.5 z-20 pointer-events-none",
          position === 'before' ? "-top-1.5" : "-bottom-1.5"
        )}
        style={{ backgroundColor: '#5a50ff' }}
      />
    );
  };

  // Get alignment classes based on layout and alignment property
  const getAlignmentClasses = () => {
    const alignment = container.alignment || 'start';

    // items-* controls cross-axis alignment:
    // - In column (vertical): horizontal alignment (left/center/right)
    // - In row (horizontal): vertical alignment (top/center/bottom)
    switch (alignment) {
      case 'center': return 'items-center';
      case 'end': return 'items-end';
      default: return 'items-start';
    }
  };

  // Get gap style
  const getGapStyle = () => {
    const gap = container.gap ?? 12;
    return { gap: `${gap}px` };
  };

  // Get padding style
  const getPaddingStyle = () => {
    const padding = container.padding ?? 12;
    return padding > 0 ? { padding: `${padding}px` } : {};
  };

  // Render elements if container has them
  const renderElements = () => {
    if (!hasElements) return null;

    // Pour un conteneur avec séparateur dans un parent horizontal,
    // ne pas forcer la largeur - laisser le séparateur définir sa propre largeur
    const isVerticalSeparatorContainer = shouldStretch && parentLayout === "horizontal";

    return (
      <div
        className={cn(
          "flex h-full",
          container.layout === "horizontal" ? "flex-row" : "flex-col",
          // Largeur 100% seulement pour les conteneurs verticaux (non-séparateur vertical)
          !isVerticalSeparatorContainer && container.layout !== "horizontal" && "w-full",
          getAlignmentClasses(),
          // Stretch when has separator
          shouldStretch && "flex-1"
        )}
        style={getGapStyle()}
      >
        {container.elements.map((element) => {
          // Pour les séparateurs seuls dans leur conteneur, utiliser le layout du parent (grandparent)
          // car le séparateur doit s'adapter à la position de son conteneur, pas à son layout interne
          const isSeparatorElement = element.type === 'separator-line';
          const effectiveParentLayout = (isSeparatorElement && container.elements.length === 1)
            ? parentLayout  // Layout du grandparent
            : container.layout;  // Layout du conteneur actuel

          return (
            <BlockElement
              key={element.id}
              element={element}
              blockId={container.id}
              isSelected={selectedElementId === element.id}
              onSelect={() => onElementSelect(element.id, container.id)}
              onUpdate={(newProps) => onElementUpdate(container.id, element.id, newProps)}
              onDelete={() => onElementDelete(container.id, element.id)}
              onMoveElement={onMoveElement}
              onReorderElement={(draggedId, targetId, position) =>
                onReorderElement && onReorderElement(container.id, draggedId, targetId, position)
              }
              signatureData={signatureData}
              onFieldChange={onFieldChange}
              isSingleElement={container.elements.length === 1}
              parentLayout={effectiveParentLayout}
            />
          );
        })}
      </div>
    );
  };

  // Render child containers recursively
  const renderChildren = () => {
    if (!hasChildren) return null;

    return (
      <div
        className={cn(
          "flex",
          container.layout === "horizontal" ? "flex-row" : "flex-col",
          getAlignmentClasses()
        )}
        style={getGapStyle()}
      >
        {container.children.map((childContainer) => (
          <ContainerNode
            key={childContainer.id}
            container={childContainer}
            depth={depth + 1}
            parentLayout={container.layout}
            selectedContainerId={selectedContainerId}
            selectedElementId={selectedElementId}
            hoveredContainerId={hoveredContainerId}
            onHover={onHover}
            onSelect={onSelect}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onElementSelect={onElementSelect}
            onElementUpdate={onElementUpdate}
            onElementDelete={onElementDelete}
            onDrop={onDrop}
            onMoveContainer={onMoveContainer}
            onMoveElement={onMoveElement}
            onReorderContainer={onReorderContainer}
            onReorderElement={onReorderElement}
            signatureData={signatureData}
            onFieldChange={onFieldChange}
          />
        ))}
      </div>
    );
  };

  // Root container
  if (isRoot) {
    // Root container uses padding from container props (default 12px)
    const rootPadding = container.padding ?? 12;

    return (
      <div
        ref={containerRef}
        data-container-id={container.id}
        className={cn(
          "relative w-full border border-dashed rounded-lg transition-all duration-150 cursor-pointer",
          getBorderColor()
        )}
        style={{ padding: `${rootPadding}px` }}
        onClick={handleSelect}
        onMouseEnter={() => onHover && onHover(container.id)}
        onMouseLeave={(e) => {
          // Only clear hover if leaving to outside, not to a child
          if (!e.currentTarget.contains(e.relatedTarget)) {
            onHover && onHover(null);
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Content */}
        <div
          className={cn(
            "flex",
            // Use items-stretch for horizontal to allow children to stretch vertically
            container.layout === "horizontal" ? "flex-row items-stretch" : "flex-col",
            getAlignmentClasses()
          )}
          style={getGapStyle()}
        >
          {hasElements && renderElements()}
          {hasChildren && renderChildren()}
        </div>
      </div>
    );
  }

  // Regular container (non-root)
  // Regular containers default to 12px padding if not specified
  const containerPadding = container.padding ?? 12;

  // For separator containers: stretch based on parent layout
  // - In horizontal parent: stretch height only, width stays minimal
  // - In vertical parent: stretch width
  const isInHorizontalParent = parentLayout === "horizontal";

  return (
    <div
      ref={containerRef}
      data-container-id={container.id}
      className={cn(
        "relative group border border-dashed rounded-lg transition-all duration-150",
        getBorderColor(),
        isDragging && "opacity-50",
        isResizing && "select-none",
        // Separators: dans un parent horizontal, stretch en hauteur seulement
        // Dans un parent vertical, stretch en largeur
        shouldStretch && (isInHorizontalParent ? "self-stretch" : "w-full"),
        // Others fit content (unless width is set)
        !shouldStretch && !container.width && "w-fit"
      )}
      style={{
        padding: `${containerPadding}px`,
        ...(container.width && { width: `${container.width}px` }),
        ...(container.height && { height: `${container.height}px` }),
      }}
      onClick={handleSelect}
      onMouseEnter={() => onHover && onHover(container.id)}
      onMouseLeave={(e) => {
        // Only clear hover if leaving to outside, not to a child
        if (!e.currentTarget.contains(e.relatedTarget)) {
          onHover && onHover(null);
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop indicators for container reordering */}
      {dropPosition === 'before' && <DropIndicator position="before" />}
      {dropPosition === 'after' && <DropIndicator position="after" />}

      {/* Resize handles - COMMENTED OUT FOR NOW
      {(isHovered || isContainerSelected || isResizing) && (
        <>
          <div
            className={cn(
              "absolute top-1 bottom-1 -right-px w-0.5 cursor-ew-resize z-20 transition-all rounded-full",
              resizeEdge === 'right' ? "bg-[#5a50ff]" : "bg-transparent hover:bg-[#5a50ff]/60"
            )}
            onMouseDown={handleResizeStart('right')}
          />
          <div
            className={cn(
              "absolute left-1 right-1 -bottom-px h-0.5 cursor-ns-resize z-20 transition-all rounded-full",
              resizeEdge === 'bottom' ? "bg-[#5a50ff]" : "bg-transparent hover:bg-[#5a50ff]/60"
            )}
            onMouseDown={handleResizeStart('bottom')}
          />
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-2 h-2 cursor-nwse-resize z-30 transition-all",
              (resizeEdge === 'corner') ? "bg-[#5a50ff]" : "bg-transparent hover:bg-[#5a50ff]",
              "rounded-full"
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsResizing(true);
              setResizeEdge('corner');
              // ... resize logic
            }}
          />
        </>
      )}
      */}

      {/* Controls */}
      {showControls && (
        <div className="absolute -left-7 top-0 flex flex-col gap-0.5 z-10">
          <div
            draggable={true}
            onDragStart={handleContainerDragStart}
            onDragEnd={handleContainerDragEnd}
            className={cn(
              "p-1 rounded cursor-grab active:cursor-grabbing",
              isDragging
                ? "bg-[#5a50ff]"
                : "bg-[#202020] hover:bg-[#303030]"
            )}
            title="Glisser pour réorganiser"
          >
            <GripVertical className="w-3 h-3 text-white" />
          </div>
          <button
            onClick={handleLayoutToggle}
            className="p-1 rounded bg-[#202020] hover:bg-[#303030] text-white"
            title={`Passer en ${container.layout === "horizontal" ? "vertical" : "horizontal"}`}
          >
            {container.layout === "horizontal" ? (
              <Rows className="w-3 h-3" />
            ) : (
              <Columns className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded bg-[#202020] hover:bg-red-500 text-white"
            title="Supprimer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "flex h-full",
          // Use items-stretch for horizontal to allow children to stretch vertically
          container.layout === "horizontal" ? "flex-row items-stretch" : "flex-col",
          getAlignmentClasses(),
          // Stretch content: largeur 100% seulement si pas un séparateur vertical
          shouldStretch && !isInHorizontalParent && "w-full"
        )}
        style={getGapStyle()}
      >
        {hasElements && renderElements()}
        {hasChildren && renderChildren()}

        {/* Empty state */}
        {!hasElements && !hasChildren && (
          <div className="py-4 px-6 text-center text-xs text-neutral-400">
            Glissez ici
          </div>
        )}
      </div>
    </div>
  );
}
