"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Inbox,
  FolderClosed,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
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

const getFileIcon = (
  mimeType,
  ext,
  cls = "size-3.5 text-muted-foreground/70",
) => {
  if (mimeType?.startsWith("image/")) return <FileImage className={cls} />;
  if (mimeType === "application/pdf") return <FileText className={cls} />;
  if (
    mimeType?.includes("spreadsheet") ||
    mimeType?.includes("excel") ||
    ext === "csv"
  )
    return <FileSpreadsheet className={cls} />;
  if (mimeType?.includes("word") || mimeType?.includes("document"))
    return <FileText className={cls} />;
  return <File className={cls} />;
};

function getScrollParent(el) {
  let n = el?.parentElement;
  while (n) {
    if (/(auto|scroll)/.test(getComputedStyle(n).overflowY)) return n;
    n = n.parentElement;
  }
  return null;
}

const DRAG_THRESHOLD = 5;
const EDGE_ZONE = 50;
const MAX_SCROLL_SPEED = 14;
const EXPAND_DELAY = 500;

/**
 * Manual tree DnD — same pattern as useKanbanDnD.
 * Attaches to document, uses pointer-events:none on clone (no hide/show trick),
 * updateFeedback called in moveDrag (not in RAF tick).
 */
function useTreeDnD({
  containerRef,
  treeDataRef,
  foldersRef,
  setExpandedFolders,
  onMoveRef,
  onMoveFolderRef,
  getSiblingsRef,
  setDragId,
  enabled = true,
}) {
  useEffect(() => {
    if (!enabled) return;
    let drag = null;
    let raf = null;
    let touchTimer = null;
    let indicator = null;
    let highlightedEl = null;
    let hoverTimer = null;
    let currentInsideId = null;
    let autoExpanded = new Set();
    let scrollParent = null;

    function items() {
      return treeDataRef.current.items;
    }

    // ── Find draggable ──────────────────────────────────────────
    function findDraggable(target) {
      const container = containerRef.current;
      if (!container || !container.contains(target)) return null;
      if (
        target.closest(
          'button, a, input, textarea, select, [role="button"], [data-radix-collection-item]',
        )
      )
        return null;
      const el = target.closest("[data-tree-item-id]");
      if (!el) return null;
      const id = el.dataset.treeItemId;
      const item = items()[id];
      if (!item || item.isInbox) return null;
      return { id, type: item.isFolder ? "folder" : "document", element: el };
    }

    // ── Indicator ───────────────────────────────────────────────
    function ensureIndicator() {
      if (indicator) return indicator;
      indicator = document.createElement("div");
      indicator.style.cssText =
        "position:fixed;z-index:9999;pointer-events:none;display:none;" +
        "border-radius:2px;" +
        "transition:top 60ms ease-out,left 60ms ease-out,width 60ms ease-out;";
      document.body.appendChild(indicator);
      return indicator;
    }

    function clearHighlight() {
      if (highlightedEl) {
        highlightedEl.style.removeProperty("background-color");
        highlightedEl.style.removeProperty("outline");
        highlightedEl.style.removeProperty("outline-offset");
        highlightedEl = null;
      }
    }

    // ── Build sorted list of ALL visible rows (folders + docs) ──
    function getVisibleRows() {
      const container = containerRef.current;
      if (!container) return [];
      const allEls = container.querySelectorAll("[data-tree-item-id]");
      const result = [];
      for (const el of allEls) {
        const id = el.dataset.treeItemId;
        if (drag && id === drag.id) continue;
        const item = items()[id];
        if (!item) continue;
        const r = el.getBoundingClientRect();
        if (r.height === 0) continue;
        result.push({
          el,
          id,
          item,
          isFolder: item.isFolder,
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          width: r.width,
        });
      }
      result.sort((a, b) => a.top - b.top);
      return result;
    }

    // ── Find the previous/next sibling at the same level ──────
    // Walks the visual rows to find the adjacent folder with the same parentId
    function findPrevSibling(rows, idx, parentId) {
      for (let j = idx - 1; j >= 0; j--) {
        if (!rows[j].isFolder) continue;
        if (rows[j].id === drag?.id) continue;
        if ((rows[j].item.parentId || null) === parentId) return rows[j];
      }
      return null;
    }

    function findNextSibling(rows, idx, parentId) {
      for (let j = idx + 1; j < rows.length; j++) {
        if (!rows[j].isFolder) continue;
        if (rows[j].id === drag?.id) continue;
        if ((rows[j].item.parentId || null) === parentId) return rows[j];
      }
      return null;
    }

    // ── Compute the exact order for a before/after drop ─────────
    function computeDropOrder(rows, idx, position) {
      const target = rows[idx];
      const parentId = getRowParentId(target);

      // If the target is a folder, use its order directly.
      // If it's a document, find the nearest folder sibling for reference.
      let refOrder;
      if (target.isFolder) {
        refOrder = target.item.order ?? 0;
      } else {
        // Find nearest folder sibling in the same parent
        const above = findPrevSibling(rows, idx, parentId);
        const below = findNextSibling(rows, idx, parentId);
        if (position === "before" && above)
          refOrder = (above.item.order ?? 0) + 0.5;
        else if (position === "after" && below)
          refOrder = (below.item.order ?? 0) - 0.5;
        else if (above) refOrder = (above.item.order ?? 0) + 1;
        else if (below) refOrder = (below.item.order ?? 0) - 1;
        else refOrder = 0;
        return refOrder;
      }

      if (position === "before") {
        const prev = findPrevSibling(rows, idx, parentId);
        if (prev) {
          const pOrd = prev.item.order ?? 0;
          const mid = pOrd + (refOrder - pOrd) / 2;
          return Math.abs(mid - pOrd) < 0.001 ? refOrder - 1 : mid;
        }
        return refOrder - 1;
      } else {
        const next = findNextSibling(rows, idx, parentId);
        if (next) {
          const nOrd = next.item.order ?? 0;
          const mid = refOrder + (nOrd - refOrder) / 2;
          return Math.abs(mid - nOrd) < 0.001 ? refOrder + 1 : mid;
        }
        return refOrder + 1;
      }
    }

    // ── Get the parent folder ID for any row ──────────────────
    function getRowParentId(row) {
      if (row.isFolder) return row.item.parentId || null;
      // Document: folderId is the parent
      return row.item.folderId || null;
    }

    // ── Build result with pre-computed drop info ─────────────────
    function makeResult(row, position, rows, rowIdx) {
      const result = {
        targetId: row.id,
        position,
        item: row.item,
        isFolder: row.isFolder,
        el: row.el,
        top: row.top,
        bottom: row.bottom,
        left: row.left,
        width: row.width,
      };

      if (position !== "inside") {
        // The item will go into the same parent as the target row
        result.dropParentId = getRowParentId(row);
        result.dropOrder = computeDropOrder(rows, rowIdx, position);
      }
      return result;
    }

    // ── Find target + position from cursor Y ────────────────────
    // Every row (folder or document) can show before/after lines.
    // "inside" is only for folders.
    function computeTarget(y) {
      const rows = getVisibleRows();
      if (rows.length === 0) return null;

      const isDraggingFolder = drag?.type === "folder";

      // 1. Check if cursor is directly on a row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (y < row.top || y > row.bottom) continue;

        const h = row.bottom - row.top;

        if (row.isFolder && !row.item.isInbox) {
          // Folder: 3 zones — before / inside / after
          if (!isDraggingFolder) {
            // Documents can only go "inside" folders
            return makeResult(row, "inside", rows, i);
          }
          if (y < row.top + h * 0.3) return makeResult(row, "before", rows, i);
          if (y > row.bottom - h * 0.3)
            return makeResult(row, "after", rows, i);
          return makeResult(row, "inside", rows, i);
        }

        if (row.isFolder && row.item.isInbox) {
          // Inbox: always "inside"
          return makeResult(row, "inside", rows, i);
        }

        // Document row: 2 zones — before / after (50/50)
        if (isDraggingFolder) {
          const mid = row.top + h / 2;
          return makeResult(row, y < mid ? "before" : "after", rows, i);
        }
        // Document dragging over document: find parent folder
        const parentId = row.item.folderId || null;
        // Return "inside" parent folder
        return {
          targetId: parentId || "inbox",
          position: "inside",
          item: items()[parentId] || items()["inbox"],
          isFolder: true,
          el: row.el,
          top: row.top,
          bottom: row.bottom,
          left: row.left,
          width: row.width,
        };
      }

      // 2. Cursor is between rows — find nearest row edge
      let bestIdx = -1,
        bestDist = Infinity,
        bestPos = "after";
      for (let i = 0; i < rows.length; i++) {
        const dTop = Math.abs(y - rows[i].top);
        if (dTop < bestDist) {
          bestDist = dTop;
          bestIdx = i;
          bestPos = "before";
        }
        const dBot = Math.abs(y - rows[i].bottom);
        if (dBot < bestDist) {
          bestDist = dBot;
          bestIdx = i;
          bestPos = "after";
        }
      }
      if (bestIdx === -1 || bestDist > 50) return null;

      const bestRow = rows[bestIdx];
      if (!isDraggingFolder && bestRow.isFolder) {
        return makeResult(bestRow, "inside", rows, bestIdx);
      }
      return makeResult(bestRow, bestPos, rows, bestIdx);
    }

    // ── Visual feedback (called every mousemove) ────────────────
    function updateFeedback(x, y) {
      const ind = ensureIndicator();
      const target = computeTarget(y);
      clearHighlight();

      if (!target) {
        ind.style.display = "none";
        return null;
      }

      if (target.position === "inside") {
        ind.style.display = "none";
        target.el.style.setProperty(
          "background-color",
          "rgba(59,130,246,0.15)",
          "important",
        );
        target.el.style.setProperty(
          "outline",
          "2px solid #3b82f6",
          "important",
        );
        target.el.style.setProperty("outline-offset", "-2px", "important");
        highlightedEl = target.el;
      } else {
        const lineY =
          target.position === "before" ? target.top - 1 : target.bottom + 1;
        Object.assign(ind.style, {
          display: "block",
          top: lineY + "px",
          left: target.left + 8 + "px",
          width: target.width - 16 + "px",
          height: "3px",
          background: "#3b82f6",
          boxShadow: "0 0 8px rgba(59,130,246,0.5)",
          zIndex: "99999",
        });
      }

      // Return the full target including pre-computed dropParentId + dropOrder
      return target;
    }

    // ── Auto-expand / auto-close ────────────────────────────────
    // Build the full ancestor chain for any target (not just "inside").
    // Keep auto-expanded folders open if cursor is on them or any descendant.
    function updateAutoExpand(fb) {
      const targetId = fb?.targetId || null;
      const insideId = fb?.position === "inside" ? targetId : null;

      // Build ancestor chain of current target (regardless of position)
      // For documents, use folderId to get the parent folder
      const ancestorChain = new Set();
      if (targetId) {
        let cur = targetId;
        while (cur) {
          ancestorChain.add(cur);
          const it = items()[cur];
          if (!it) break;
          cur = it.isFolder ? it.parentId || null : it.folderId || null;
        }
      }

      // Close auto-expanded folders that are NOT in the ancestor chain
      if (autoExpanded.size > 0) {
        const toClose = [...autoExpanded].filter(
          (id) => !ancestorChain.has(id),
        );
        if (toClose.length > 0) {
          setExpandedFolders((prev) => {
            const next = new Set(prev);
            for (const id of toClose) {
              next.delete(id);
              autoExpanded.delete(id);
            }
            return next;
          });
        }
      }

      // Auto-expand: only when position is "inside" a folder
      if (insideId !== currentInsideId) {
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }

        if (insideId) {
          hoverTimer = setTimeout(() => {
            hoverTimer = null;
            setExpandedFolders((prev) => {
              if (prev.has(insideId)) return prev;
              autoExpanded.add(insideId);
              const next = new Set(prev);
              next.add(insideId);
              return next;
            });
          }, EXPAND_DELAY);
        }

        currentInsideId = insideId;
      }
    }

    // ── Auto-scroll (in RAF tick, like kanban) ──────────────────
    function autoScroll(y) {
      if (!scrollParent) return;
      const r = scrollParent.getBoundingClientRect();
      const dTop = y - r.top;
      const dBot = r.bottom - y;
      if (dTop >= 0 && dTop < EDGE_ZONE)
        scrollParent.scrollTop -=
          (1 - dTop / EDGE_ZONE) ** 2 * MAX_SCROLL_SPEED;
      else if (dBot >= 0 && dBot < EDGE_ZONE)
        scrollParent.scrollTop +=
          (1 - dBot / EDGE_ZONE) ** 2 * MAX_SCROLL_SPEED;
    }

    function tick() {
      if (!drag?.started) return;
      autoScroll(drag.cy);
      raf = requestAnimationFrame(tick);
    }

    // ── Drag lifecycle ──────────────────────────────────────────
    function beginDrag() {
      if (!drag || drag.started) return;
      drag.started = true;
      drag.element.style.opacity = "0.4";
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
      scrollParent = getScrollParent(containerRef.current);

      // Collapse the dragged folder if it's expanded (frees space for drop targets)
      drag.wasExpanded = false;
      if (drag.type === "folder") {
        setExpandedFolders((prev) => {
          if (prev.has(drag.id)) {
            drag.wasExpanded = true;
            const next = new Set(prev);
            next.delete(drag.id);
            return next;
          }
          return prev;
        });
      }

      setDragId(drag.id);
    }

    function moveDrag(x, y) {
      if (!drag?.started) return;
      drag.cx = x;
      drag.cy = y;
      drag.lastFeedback = updateFeedback(x, y);
      updateAutoExpand(drag.lastFeedback);
    }

    async function endDrag() {
      if (!drag) return;
      const wasStarted = drag.started;
      const fb = drag.lastFeedback;
      const info = { id: drag.id, type: drag.type };

      // Cleanup
      drag.element.style.opacity = "";
      drag.element.style.transition = "";
      if (indicator) {
        indicator.remove();
        indicator = null;
      }
      clearHighlight();
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }

      window.removeEventListener("mousemove", onMouseMove, true);
      window.removeEventListener("mouseup", onMouseUp, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("touchcancel", onTouchEnd, true);

      // Determine which folders to keep open after drop
      const restoreId = drag.wasExpanded ? drag.id : null;
      const fb2 = fb; // capture before clearing drag

      currentInsideId = null;
      scrollParent = null;
      drag = null;
      setDragId(null);

      if (!wasStarted || !fb2) {
        // No drop — close auto-expanded, restore dragged
        if (autoExpanded.size > 0 || restoreId) {
          setExpandedFolders((prev) => {
            const next = new Set(prev);
            for (const id of autoExpanded) next.delete(id);
            if (restoreId) next.add(restoreId);
            return next;
          });
        }
        autoExpanded.clear();
        return;
      }

      // ── Execute drop ──
      const { targetId, position } = fb2;
      if (targetId === info.id) {
        // Dropped on itself — just restore state
        if (autoExpanded.size > 0 || restoreId) {
          setExpandedFolders((prev) => {
            const next = new Set(prev);
            for (const id of autoExpanded) next.delete(id);
            if (restoreId) next.add(restoreId);
            return next;
          });
        }
        autoExpanded.clear();
        return;
      }

      // Keep auto-expanded folders open after a successful drop
      // (the user navigated into them, so keep the tree open)
      // Just restore the dragged folder's expanded state
      if (restoreId) {
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          next.add(restoreId);
          return next;
        });
      }
      // Don't close autoExpanded — keep the tree open as the user left it
      autoExpanded.clear();

      if (position === "inside") {
        const folderId = targetId === "inbox" ? null : targetId;
        // Also expand the target folder so the user sees where the item went
        if (folderId) {
          setExpandedFolders((prev) => {
            const next = new Set(prev);
            next.add(folderId);
            return next;
          });
        }
        if (info.type === "document") {
          await onMoveRef.current?.([info.id.replace("doc-", "")], folderId);
        } else {
          const flds = foldersRef.current;
          let cur = folderId;
          while (cur) {
            if (cur === info.id) return;
            cur = flds.find((f) => f.id === cur)?.parentId;
          }
          await onMoveFolderRef.current?.(info.id, folderId);
        }
        return;
      }

      // before/after — use pre-computed dropParentId and dropOrder
      const dropParentId = fb2.dropParentId ?? null;
      const dropOrder = fb2.dropOrder;

      if (info.type === "document") {
        await onMoveRef.current?.([info.id.replace("doc-", "")], dropParentId);
        return;
      }

      // Circular reference check
      if (dropParentId) {
        const flds = foldersRef.current;
        let cur = dropParentId;
        while (cur) {
          if (cur === info.id) return;
          cur = flds.find((f) => f.id === cur)?.parentId;
        }
      }

      await onMoveFolderRef.current?.(info.id, dropParentId, {
        order: dropOrder,
      });
    }

    // ── Mouse ───────────────────────────────────────────────────
    function onMouseDown(e) {
      if (e.button !== 0) return;
      const d = findDraggable(e.target);
      if (!d) return;
      const r = d.element.getBoundingClientRect();
      drag = {
        ...d,
        sx: e.clientX,
        sy: e.clientY,
        cx: e.clientX,
        cy: e.clientY,
        ox: e.clientX - r.left,
        oy: e.clientY - r.top,
        started: false,
        lastFeedback: null,
      };
      window.addEventListener("mousemove", onMouseMove, true);
      window.addEventListener("mouseup", onMouseUp, true);
    }

    function onMouseMove(e) {
      if (!drag) return;
      if (!drag.started) {
        if (
          Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < DRAG_THRESHOLD
        )
          return;
        beginDrag();
        raf = requestAnimationFrame(tick);
      }
      e.preventDefault();
      moveDrag(e.clientX, e.clientY);
    }

    function onMouseUp() {
      endDrag();
    }

    // ── Touch ───────────────────────────────────────────────────
    function onTouchStart(e) {
      const d = findDraggable(e.target);
      if (!d) return;
      const t = e.touches[0];
      const r = d.element.getBoundingClientRect();
      drag = {
        ...d,
        sx: t.clientX,
        sy: t.clientY,
        cx: t.clientX,
        cy: t.clientY,
        ox: t.clientX - r.left,
        oy: t.clientY - r.top,
        started: false,
        touchReady: false,
        lastFeedback: null,
      };
      touchTimer = setTimeout(() => {
        if (drag && !drag.started) {
          drag.touchReady = true;
          navigator.vibrate?.(50);
        }
      }, 200);
      window.addEventListener("touchmove", onTouchMove, {
        capture: true,
        passive: false,
      });
      window.addEventListener("touchend", onTouchEnd, true);
      window.addEventListener("touchcancel", onTouchEnd, true);
    }

    function onTouchMove(e) {
      if (!drag) return;
      const t = e.touches[0];
      drag.cx = t.clientX;
      drag.cy = t.clientY;
      if (!drag.started) {
        const dist = Math.hypot(t.clientX - drag.sx, t.clientY - drag.sy);
        if (!drag.touchReady) {
          if (dist > DRAG_THRESHOLD) {
            clearTimeout(touchTimer);
            touchTimer = null;
            window.removeEventListener("touchmove", onTouchMove, true);
            window.removeEventListener("touchend", onTouchEnd, true);
            window.removeEventListener("touchcancel", onTouchEnd, true);
            drag = null;
          }
          return;
        }
        if (dist < DRAG_THRESHOLD) return;
        e.preventDefault();
        beginDrag();
        raf = requestAnimationFrame(tick);
        return;
      }
      e.preventDefault();
      moveDrag(t.clientX, t.clientY);
    }

    function onTouchEnd() {
      endDrag();
    }

    // ── Attach to document (like kanban) ────────────────────────
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("touchstart", onTouchStart, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", onMouseDown, true);
      document.removeEventListener("touchstart", onTouchStart, true);
      if (drag) {
        drag.element.style.opacity = "";
        drag.element.style.transition = "";
        drag = null;
      }
      if (indicator) {
        indicator.remove();
        indicator = null;
      }
      clearHighlight();
      if (raf) cancelAnimationFrame(raf);
      if (hoverTimer) clearTimeout(hoverTimer);
      if (touchTimer) clearTimeout(touchTimer);
      window.removeEventListener("mousemove", onMouseMove, true);
      window.removeEventListener("mouseup", onMouseUp, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("touchcancel", onTouchEnd, true);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      autoExpanded.clear();
    };
  }, [enabled, containerRef]);
}

// ── TreeItem ──────────────────────────────────────────────────────────
function TreeItem({
  id,
  item,
  level,
  isExpanded,
  onToggle,
  onClick,
  onContextMenu,
  isChecked,
  onCheckChange,
  isDragging,
  children,
}) {
  const isFolder = item.isFolder;
  const isInbox = item.isInbox;
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: isDragging ? 0.3 : 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="w-full relative"
    >
      <div
        data-tree-item-id={id}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        className={cn(
          "flex items-center gap-2 py-1.5 pr-2 rounded select-none min-w-0 w-full",
          "transition-colors duration-100",
          "hover:bg-accent/40",
          !isInbox && "cursor-grab active:cursor-grabbing",
          isInbox && "cursor-pointer",
        )}
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        {isFolder ? (
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
                isExpanded && "rotate-90",
              )}
            />
          </button>
        ) : (
          <div className="w-4" />
        )}

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
                : "border-muted-foreground/40 hover:border-primary/60",
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

// ══════════════════════════════════════════════════════════════════════
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
  const [expandedFolders, setExpandedFolders] = useState(
    new Set(["inbox", "my-folders"]),
  );
  const [dragId, setDragId] = useState(null);
  const containerRef = useRef(null);

  const treeData = useMemo(() => {
    const items = {};
    items["inbox"] = {
      id: "inbox",
      name: "Documents à classer",
      isFolder: true,
      isInbox: true,
      count: pendingCount,
      parentId: null,
      order: -1,
      children: documents.filter((d) => !d.folderId).map((d) => `doc-${d.id}`),
    };
    folders.forEach((folder) => {
      const childFolders = folders
        .filter((f) => f.parentId === folder.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((f) => f.id);
      const childDocs = documents
        .filter((d) => d.folderId === folder.id)
        .map((d) => `doc-${d.id}`);
      items[folder.id] = {
        id: folder.id,
        name: folder.name,
        isFolder: true,
        isSystem: folder.isSystem || false,
        color: folder.color,
        parentId: folder.parentId,
        order: folder.order || 0,
        data: folder,
        children: [...childFolders, ...childDocs],
      };
    });
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
    const rootFolders = folders
      .filter((f) => !f.parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((f) => f.id);
    return { items, rootItems: ["inbox", ...rootFolders] };
  }, [folders, documents, pendingCount]);

  const treeDataRef = useRef(treeData);
  treeDataRef.current = treeData;
  const foldersRef = useRef(folders);
  foldersRef.current = folders;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onMoveFolderRef = useRef(onMoveFolder);
  onMoveFolderRef.current = onMoveFolder;
  const getSiblings = useCallback((folderId) => {
    const td = treeDataRef.current;
    const item = td.items[folderId];
    if (!item) return [];
    if (!item.parentId)
      return td.rootItems
        .filter((id) => id !== "inbox")
        .map((id) => td.items[id])
        .filter(Boolean);
    const parent = td.items[item.parentId];
    if (!parent) return [];
    return parent.children.map((id) => td.items[id]).filter((i) => i?.isFolder);
  }, []);
  const getSiblingsRef = useRef(getSiblings);
  getSiblingsRef.current = getSiblings;
  const setDragIdRef = useRef(setDragId);
  setDragIdRef.current = setDragId;

  const toggleFolder = useCallback((folderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(folderId) ? next.delete(folderId) : next.add(folderId);
      return next;
    });
  }, []);

  useTreeDnD({
    containerRef,
    treeDataRef,
    foldersRef,
    setExpandedFolders,
    onMoveRef,
    onMoveFolderRef,
    getSiblingsRef,
    setDragId: (id) => setDragIdRef.current(id),
  });

  const renderItem = useCallback(
    (itemId, level = 0) => {
      const item = treeData.items[itemId];
      if (!item) return null;
      const isExpanded = expandedFolders.has(itemId);
      const isFolderChecked =
        item.isFolder && !item.isInbox && selectedFolders.includes(itemId);
      return (
        <TreeItem
          key={itemId}
          id={itemId}
          item={item}
          level={level}
          isExpanded={isExpanded}
          isChecked={isFolderChecked}
          isDragging={dragId === itemId}
          onCheckChange={
            item.isFolder && !item.isInbox && onToggleFolderSelection
              ? () => onToggleFolderSelection(itemId)
              : undefined
          }
          onToggle={() => toggleFolder(itemId)}
          onClick={() => {
            if (item.isFolder) {
              onSelectFolder?.(item.isInbox ? null : itemId);
              if (!expandedFolders.has(itemId)) toggleFolder(itemId);
            } else {
              // Ouvrir le dossier parent à droite pour voir le fichier dans son contexte
              onSelectFolder?.(item.folderId || null);
              onSelectDocument?.(itemId.replace("doc-", ""));
            }
          }}
          onContextMenu={(e) => onContextMenu?.(e, itemId, item)}
        >
          <AnimatePresence initial={false}>
            {isExpanded && item.children?.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                {item.children.map((cid) => renderItem(cid, level + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </TreeItem>
      );
    },
    [
      treeData,
      expandedFolders,
      selectedFolders,
      toggleFolder,
      onSelectFolder,
      onSelectDocument,
      onContextMenu,
      onToggleFolderSelection,
      dragId,
    ],
  );

  return (
    <TooltipProvider>
      <div ref={containerRef} className="py-1">
        <AnimatePresence initial={false}>
          {renderItem("inbox", 0)}
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
                    expandedFolders.has("my-folders") && "rotate-90",
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
                      .map((id) => renderItem(id, 0))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
