"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Inbox,
  FolderClosed,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  GripVertical,
  Check,
  Lock,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

// Icône selon le type de fichier
const getFileIcon = (mimeType, extension, className = "size-3.5 text-muted-foreground/70") => {
  if (mimeType?.startsWith("image/")) {
    return <FileImage className={className} />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className={className} />;
  }
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel") || extension === "csv") {
    return <FileSpreadsheet className={className} />;
  }
  if (mimeType?.includes("word") || mimeType?.includes("document")) {
    return <FileText className={className} />;
  }
  return <File className={className} />;
};

// Composant d'item draggable
function DraggableItem({ id, item, level, isExpanded, onToggle, onClick, onContextMenu, isChecked, onCheckChange, children }) {
  const isFolder = item.isFolder;
  const isInbox = item.isInbox;
  const canDrag = !isInbox;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
    data: { item, type: isFolder ? "folder" : "document" },
    disabled: !canDrag,
  });

  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: `drop-${id}`,
    data: { item, acceptDrop: isFolder },
    disabled: !isFolder,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    paddingLeft: `${level * 16 + 8}px`,
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        x: 0,
      }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="overflow-hidden w-full"
    >
      <div
        ref={(node) => {
          setDragRef(node);
          if (isFolder) setDropRef(node);
        }}
        style={style}
        className={cn(
          "flex items-center gap-2 py-1.5 pr-2 rounded select-none min-w-0 w-full",
          "transition-colors duration-100",
          "hover:bg-accent/40",
          isOver && isFolder && "bg-accent/60 ring-1 ring-primary/30",
          isDragging && "opacity-40",
          canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        )}
        onClick={onClick}
        onContextMenu={onContextMenu}
        {...(canDrag ? { ...attributes, ...listeners } : {})}
      >
        {isFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            <ChevronRight
              className={cn(
                "size-3 text-muted-foreground/60 transition-transform duration-150",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        )}

        {!isFolder && <div className="w-4" />}

        {/* Folder selection checkbox */}
        {isFolder && !isInbox && onCheckChange && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckChange?.();
            }}
            className={cn(
              "size-4 rounded border flex items-center justify-center shrink-0 transition-colors",
              isChecked
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/40 hover:border-primary/60"
            )}
          >
            {isChecked && <Check className="size-3" strokeWidth={2.5} />}
          </button>
        )}

        {isFolder ? (
          isInbox ? (
            <Inbox className="size-3.5 text-[#5a50ff]/80 shrink-0" />
          ) : (
            <FolderClosed
              className="size-3.5 shrink-0"
              style={{ color: item.color || "currentColor", opacity: 0.7 }}
            />
          )
        ) : (
          getFileIcon(item.mimeType, item.fileExtension)
        )}

        {isFolder && !isInbox && item.data?.visibility === "private" && (
          <Lock className="size-3 text-muted-foreground/60 shrink-0" />
        )}

        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <span className="truncate text-sm flex-1 min-w-0">{item.name}</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs break-all">
            {item.name}
          </TooltipContent>
        </Tooltip>

        {item.count !== undefined && item.count > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {item.count}
          </span>
        )}
      </div>

      {children}
    </motion.div>
  );
}

// Overlay affiché pendant le drag - compact et léger
function DragOverlayContent({ item }) {
  if (!item) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-background/95 border border-border/40 shadow-sm rounded text-xs max-w-[140px]">
      {item.isFolder ? (
        item.isInbox ? (
          <Inbox className="size-3 text-[#5a50ff]/80 shrink-0" />
        ) : (
          <FolderClosed
            className="size-3 shrink-0"
            style={{ color: item.color || "currentColor", opacity: 0.7 }}
          />
        )
      ) : (
        getFileIcon(item.mimeType, item.fileExtension, "size-3 text-muted-foreground/70 shrink-0")
      )}
      <span className="font-medium truncate">{item.name}</span>
    </div>
  );
}

export function DraggableTree({
  folders,
  documents,
  pendingCount,
  onMove,
  onMoveFolder,
  onSelectFolder,
  onSelectDocument,
  selectedFolder,
  onContextMenu,
  selectedFolders = [],
  onToggleFolderSelection,
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set(["inbox", "my-folders"]));
  const [activeItem, setActiveItem] = useState(null);
  const hoverTimerRef = useRef(null);
  const lastHoveredFolderRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after 8px movement
      },
    })
  );

  // Build tree structure
  const treeData = useMemo(() => {
    const items = {};

    // Inbox
    items["inbox"] = {
      id: "inbox",
      name: "Documents à classer",
      isFolder: true,
      isInbox: true,
      count: pendingCount,
      parentId: null,
      children: documents
        .filter((d) => !d.folderId)
        .map((d) => `doc-${d.id}`),
    };

    // Folders
    folders.forEach((folder) => {
      items[folder.id] = {
        id: folder.id,
        name: folder.name,
        isFolder: true,
        isSystem: folder.isSystem || false,
        color: folder.color,
        parentId: folder.parentId,
        data: folder,
        children: [
          ...folders.filter((f) => f.parentId === folder.id).map((f) => f.id),
          ...documents.filter((d) => d.folderId === folder.id).map((d) => `doc-${d.id}`),
        ],
      };
    });

    // Documents
    documents.forEach((doc) => {
      items[`doc-${doc.id}`] = {
        id: `doc-${doc.id}`,
        name: doc.name,
        isFolder: false,
        mimeType: doc.mimeType,
        fileExtension: doc.fileExtension,
        folderId: doc.folderId,
        data: doc,
        children: [],
      };
    });

    // Root level items
    const rootItems = [
      "inbox",
      ...folders.filter((f) => !f.parentId).map((f) => f.id),
    ];

    return { items, rootItems };
  }, [folders, documents, pendingCount]);

  const toggleFolder = useCallback((folderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveItem(active.data.current?.item || null);
  }, []);

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveItem(null);

      // Clear hover timer
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      lastHoveredFolderRef.current = null;

      if (!over) return;

      const draggedId = active.id;
      const droppedOnId = over.id.toString().replace("drop-", "");

      // Don't drop on itself
      if (draggedId === droppedOnId) return;

      const draggedItem = treeData.items[draggedId];
      const targetItem = treeData.items[droppedOnId];

      if (!draggedItem || !targetItem || !targetItem.isFolder) return;

      // Determine target folder ID
      const targetFolderId = droppedOnId === "inbox" ? null : droppedOnId;

      // Check if it's a document or folder being moved
      if (draggedId.startsWith("doc-")) {
        const docId = draggedId.replace("doc-", "");
        await onMove?.([docId], targetFolderId);
      } else {
        // It's a folder
        // Prevent circular reference
        let currentId = targetFolderId;
        while (currentId) {
          if (currentId === draggedId) {
            return; // Would create circular reference
          }
          const folder = folders.find((f) => f.id === currentId);
          currentId = folder?.parentId;
        }
        await onMoveFolder?.(draggedId, targetFolderId);
      }
    },
    [treeData, onMove, onMoveFolder, folders]
  );

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
    // Clear hover timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    lastHoveredFolderRef.current = null;
  }, []);

  const handleDragOver = useCallback((event) => {
    const { over } = event;

    if (!over) {
      // Clear timer if not over anything
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      lastHoveredFolderRef.current = null;
      return;
    }

    const folderId = over.id.toString().replace("drop-", "");
    const item = treeData.items[folderId];

    // Only handle folders
    if (!item?.isFolder) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      lastHoveredFolderRef.current = null;
      return;
    }

    // If it's a different folder than before, reset timer
    if (lastHoveredFolderRef.current !== folderId) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      lastHoveredFolderRef.current = folderId;

      // Only start timer if folder is closed
      if (!expandedFolders.has(folderId)) {
        hoverTimerRef.current = setTimeout(() => {
          setExpandedFolders((prev) => {
            const next = new Set(prev);
            next.add(folderId);
            return next;
          });
          hoverTimerRef.current = null;
        }, 500); // Open after 500ms
      }
    }
  }, [treeData, expandedFolders]);

  // Render tree items recursively
  const renderItem = useCallback(
    (itemId, level = 0) => {
      const item = treeData.items[itemId];
      if (!item) return null;

      const isExpanded = expandedFolders.has(itemId);
      const isSelected = item.isFolder && !item.isInbox && itemId === selectedFolder;
      const isFolderChecked = item.isFolder && !item.isInbox && selectedFolders.includes(itemId);

      return (
        <DraggableItem
          key={itemId}
          id={itemId}
          item={item}
          level={level}
          isExpanded={isExpanded}
          isChecked={isFolderChecked}
          onCheckChange={
            item.isFolder && !item.isInbox && onToggleFolderSelection
              ? () => onToggleFolderSelection(itemId)
              : undefined
          }
          onToggle={() => toggleFolder(itemId)}
          onClick={() => {
            if (item.isFolder) {
              if (item.isInbox) {
                onSelectFolder?.(null);
              } else {
                onSelectFolder?.(itemId);
              }
              if (!expandedFolders.has(itemId)) {
                toggleFolder(itemId);
              }
            } else {
              const docId = itemId.replace("doc-", "");
              onSelectDocument?.(docId);
            }
          }}
          onContextMenu={(e) => onContextMenu?.(e, itemId, item)}
        >
          <AnimatePresence initial={false}>
            {isExpanded && item.children && item.children.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                {item.children.map((childId) => renderItem(childId, level + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </DraggableItem>
      );
    },
    [treeData, expandedFolders, selectedFolder, selectedFolders, toggleFolder, onSelectFolder, onSelectDocument, onContextMenu, onToggleFolderSelection]
  );

  // Custom collision detection that prefers folders
  const collisionDetection = useCallback((args) => {
    // First check pointer intersection
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      // Filter to only droppable folders
      const folderCollisions = pointerCollisions.filter((collision) => {
        const id = collision.id.toString().replace("drop-", "");
        const item = treeData.items[id];
        return item?.isFolder;
      });

      if (folderCollisions.length > 0) {
        return folderCollisions;
      }
    }

    // Fallback to rect intersection
    return rectIntersection(args);
  }, [treeData]);

  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="py-1 overflow-hidden">
          <AnimatePresence initial={false}>
            {/* Inbox */}
            {renderItem("inbox", 0)}

            {/* Mes dossiers section */}
            {treeData.rootItems.filter((id) => id !== "inbox").length > 0 && (
              <motion.div
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                <button
                  onClick={() => toggleFolder("my-folders")}
                  className="flex items-center gap-2 w-full px-2 pt-4 pb-1"
                >
                  <ChevronRight
                    className={cn(
                      "size-3 text-muted-foreground/60 transition-transform duration-150",
                      expandedFolders.has("my-folders") && "rotate-90"
                    )}
                  />
                  <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
                    Mes dossiers
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {expandedFolders.has("my-folders") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      {treeData.rootItems
                        .filter((id) => id !== "inbox")
                        .map((itemId) => renderItem(itemId, 0))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DragOverlay dropAnimation={{
          duration: 150,
          easing: "ease-out",
        }}>
          {activeItem && <DragOverlayContent item={activeItem} />}
        </DragOverlay>
      </DndContext>
    </TooltipProvider>
  );
}
