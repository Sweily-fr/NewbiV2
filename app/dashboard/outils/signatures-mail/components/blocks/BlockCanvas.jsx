"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/src/lib/utils";
import Block from "./Block";

/**
 * BlockCanvas - Main canvas for the signature editor
 * Renders blocks according to template layout (horizontal or vertical)
 */
export default function BlockCanvas({
  blocks,
  onBlocksChange,
  onBlockSelect,
  selectedBlockId,
  onElementSelect,
  selectedElementId,
  signatureData,
  onFieldChange,
  onAddBlock,
  templateLayout = "auto", // 'horizontal', 'vertical', or 'auto'
}) {
  const [activeId, setActiveId] = React.useState(null);

  // Determine if we should use horizontal layout based on blocks
  const hasHorizontalRoot = blocks.some(b => b.type === 'row' && b.layout === 'horizontal');
  const effectiveLayout = templateLayout === 'auto'
    ? (hasHorizontalRoot ? 'horizontal' : 'vertical')
    : templateLayout;

  // Flatten blocks for rendering (handle nested structures)
  const flattenedBlocks = React.useMemo(() => {
    const result = [];
    blocks.forEach(block => {
      if (block.type === 'row' && block.children) {
        // It's a row container with children
        result.push({ ...block, isRow: true });
      } else {
        result.push(block);
      }
    });
    return result;
  }, [blocks]);

  // Sensors for block-level drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle block reorder
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      onBlocksChange(newBlocks);
    }
  };

  // Handle block update (element reorder, etc.)
  const handleUpdateBlock = (blockId, updates) => {
    const newBlocks = blocks.map((block) => {
      if (block.id === blockId) {
        return { ...block, ...updates };
      }
      // Check in row children
      if (block.type === 'row' && block.children) {
        const updatedChildren = block.children.map(child =>
          child.id === blockId ? { ...child, ...updates } : child
        );
        return { ...block, children: updatedChildren };
      }
      return block;
    });
    onBlocksChange(newBlocks);
  };

  // Handle block delete
  const handleDeleteBlock = (blockId) => {
    const newBlocks = blocks.filter((block) => {
      if (block.id === blockId) return false;
      // Also filter from row children
      if (block.type === 'row' && block.children) {
        block.children = block.children.filter(child => child.id !== blockId);
      }
      return true;
    });
    onBlocksChange(newBlocks);
    if (selectedBlockId === blockId) {
      onBlockSelect(null);
    }
  };

  // Deselect on canvas click
  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
      onBlockSelect(null);
      onElementSelect(null, null);
    }
  };

  // Get the active block for drag overlay
  const activeBlock = activeId
    ? blocks.find((block) => block.id === activeId)
    : null;

  // Render a row of blocks (horizontal layout)
  const renderRow = (rowBlock) => {
    if (!rowBlock.children || rowBlock.children.length === 0) return null;

    // Group children into columns based on template structure
    // For template1: [logo+social] | [separator] | [name+position, contact]
    // For template3: [logo, name+position, contact] | [photo+social]

    return (
      <div
        key={rowBlock.id}
        className="flex items-start gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {rowBlock.children.map((block, index) => (
          <Block
            key={block.id}
            block={block}
            isSelected={selectedBlockId === block.id}
            onSelect={onBlockSelect}
            onDelete={handleDeleteBlock}
            onUpdateBlock={handleUpdateBlock}
            onElementSelect={onElementSelect}
            selectedElementId={selectedElementId}
            signatureData={signatureData}
            onFieldChange={onFieldChange}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className="w-full h-full overflow-auto"
      onClick={handleCanvasClick}
    >
      {/* Signature container - no background, shadow, or border */}
      <div className="w-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={flattenedBlocks.map((block) => block.id)}
            strategy={effectiveLayout === 'horizontal' ? horizontalListSortingStrategy : verticalListSortingStrategy}
          >
            <div className={cn(
              "flex gap-3",
              effectiveLayout === 'horizontal' ? "flex-row items-start" : "flex-col"
            )}>
              {blocks.length === 0 ? (
                <EmptyState onAddBlock={onAddBlock} />
              ) : (
                flattenedBlocks.map((block) => {
                  // If it's a row with children, render horizontally
                  if (block.isRow && block.children) {
                    return renderRow(block);
                  }
                  // Otherwise render as normal block
                  return (
                    <Block
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={onBlockSelect}
                      onDelete={handleDeleteBlock}
                      onUpdateBlock={handleUpdateBlock}
                      onElementSelect={onElementSelect}
                      selectedElementId={selectedElementId}
                      signatureData={signatureData}
                      onFieldChange={onFieldChange}
                    />
                  );
                })
              )}
            </div>
          </SortableContext>

          {/* Drag overlay for smoother dragging */}
          <DragOverlay>
            {activeBlock ? (
              <div className="opacity-80 shadow-lg rounded-lg">
                <Block
                  block={activeBlock}
                  isSelected={true}
                  onSelect={() => {}}
                  onDelete={() => {}}
                  onUpdateBlock={() => {}}
                  onElementSelect={() => {}}
                  selectedElementId={null}
                  signatureData={signatureData}
                  onFieldChange={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

      </div>
    </div>
  );
}

/**
 * Empty state when no blocks exist
 */
function EmptyState({ onAddBlock }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg border-neutral-200 w-full"
    >
      <div className="text-center">
        <p className="text-sm text-neutral-500">
          Ajoutez des blocs depuis la bibliothèque
        </p>
      </div>
    </div>
  );
}
