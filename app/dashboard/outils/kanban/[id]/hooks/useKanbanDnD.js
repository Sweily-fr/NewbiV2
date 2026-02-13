import { useRef, useEffect } from 'react';

const DRAG_THRESHOLD = 5;
const TOUCH_DELAY = 200;
const EDGE_ZONE = 120;
const MAX_SCROLL_SPEED = 25;

/**
 * Custom drag-and-drop for Kanban board.
 * Recalculates positions every frame via getBoundingClientRect() —
 * works correctly with CSS zoom + horizontal auto-scroll.
 *
 * Produces result objects compatible with @hello-pangea/dnd format
 * so the existing useKanbanDnDSimple handler works unchanged.
 */
export function useKanbanDnD({
  onDragStart,
  onDragEnd,
  scrollElementRef,
  zoomLevel = 1,
  enabled = true,
}) {
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  const zoomRef = useRef(zoomLevel);

  useEffect(() => { onDragStartRef.current = onDragStart; }, [onDragStart]);
  useEffect(() => { onDragEndRef.current = onDragEnd; }, [onDragEnd]);
  useEffect(() => { zoomRef.current = zoomLevel; }, [zoomLevel]);

  useEffect(() => {
    if (!enabled) return;

    // ─── Mutable state ───
    let drag = null;
    let raf = null;
    let touchTimer = null;
    let indicator = null;
    let highlightedDZ = null;

    // ─── Helpers ───
    function getPointer(e) {
      const t = e.touches?.[0];
      return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY };
    }

    function findDraggable(target) {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl || !scrollEl.contains(target)) return null;
      if (target.closest(
        'button, a, input, textarea, select, [role="button"], [data-radix-collection-item]'
      )) return null;

      const taskEl = target.closest('[data-dnd-task]');
      if (taskEl) {
        return {
          type: 'task',
          id: taskEl.dataset.dndTask,
          columnId: taskEl.dataset.dndColumnId,
          index: parseInt(taskEl.dataset.dndIndex, 10),
          element: taskEl,
        };
      }

      const handleEl = target.closest('[data-dnd-column-handle]');
      if (handleEl) {
        const colEl = handleEl.closest('[data-dnd-column]');
        if (colEl) {
          return {
            type: 'column',
            id: colEl.dataset.dndColumn,
            index: parseInt(colEl.dataset.dndColumnIndex, 10),
            element: colEl,
          };
        }
      }
      return null;
    }

    // ─── Clone ───
    function createClone(element) {
      const rect = element.getBoundingClientRect();
      const zoom = zoomRef.current;
      const clone = element.cloneNode(true);

      // Strip DnD data-attrs so clone is never a target
      [clone, ...clone.querySelectorAll('*')].forEach(el => {
        if (el.dataset) {
          Object.keys(el.dataset).forEach(k => {
            if (k.startsWith('dnd')) delete el.dataset[k];
          });
        }
      });

      clone.style.cssText = [
        'position:fixed',
        `left:${rect.left / zoom}px`,
        `top:${rect.top / zoom}px`,
        `width:${rect.width / zoom}px`,
        `zoom:${zoom}`,
        'z-index:10000',
        'pointer-events:none',
        'opacity:.85',
        'cursor:grabbing',
        'box-shadow:0 12px 28px rgba(0,0,0,.15),0 4px 10px rgba(0,0,0,.1)',
        'border-radius:8px',
        'transform:rotate(1.5deg) scale(1.02)',
      ].join(';');

      document.body.appendChild(clone);
      return clone;
    }

    // ─── Indicator helpers ───
    function ensureIndicator() {
      if (indicator) return indicator;
      indicator = document.createElement('div');
      indicator.style.cssText =
        'position:fixed;z-index:9999;pointer-events:none;display:none;' +
        'background:hsl(221.2 83.2% 53.3%);border-radius:2px;' +
        'box-shadow:0 0 8px hsl(221.2 83.2% 53.3%/.4);' +
        'transition:top 60ms ease-out,left 60ms ease-out,width 60ms ease-out,height 60ms ease-out;';
      document.body.appendChild(indicator);
      return indicator;
    }

    function clearHighlight() {
      if (highlightedDZ) {
        highlightedDZ.style.backgroundColor = '';
        highlightedDZ.style.outline = '';
        highlightedDZ.style.outlineOffset = '';
        highlightedDZ = null;
      }
    }

    // ─── Target detection (recalculated every frame) ───
    function findTargetColumn(x, y) {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return null;

      // elementFromPoint handles CSS zoom correctly (native browser hit-testing)
      // Clone and indicator have pointer-events:none so they're transparent to this
      const hit = document.elementFromPoint(x, y);
      if (hit) {
        const colEl = hit.closest('[data-dnd-column]');
        if (colEl && scrollEl.contains(colEl)) {
          if (!(drag?.type === 'column' && colEl.dataset.dndColumn === drag.id)) {
            return colEl;
          }
        }
      }

      // Fallback: closest column by distance (for when cursor is outside columns)
      const cols = scrollEl.querySelectorAll('[data-dnd-column]');
      let best = null;
      let bestDist = Infinity;

      for (const col of cols) {
        if (drag?.type === 'column' && col.dataset.dndColumn === drag.id) continue;
        const r = col.getBoundingClientRect();
        const cx = Math.max(r.left, Math.min(x, r.right));
        const cy = Math.max(r.top, Math.min(y, r.bottom));
        const d = Math.hypot(x - cx, y - cy);
        if (d < bestDist) { bestDist = d; best = col; }
      }
      return bestDist < 300 ? best : null;
    }

    function computeTaskIndex(columnEl, cursorY) {
      const dz = columnEl.querySelector('[data-dnd-drop-zone]');
      if (!dz) return 0;
      // Exclude the dragged task for same-column reorder
      const tasks = Array.from(dz.querySelectorAll(':scope > [data-dnd-task]'))
        .filter(el => !(drag && el.dataset.dndTask === drag.id));

      let idx = 0;
      for (const t of tasks) {
        const r = t.getBoundingClientRect();
        if (cursorY > r.top + r.height / 2) idx++;
        else break;
      }
      return idx;
    }

    function computeColumnIndex(cursorX) {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return 0;
      const remaining = Array.from(scrollEl.querySelectorAll('[data-dnd-column]'))
        .filter(el => !(drag && el.dataset.dndColumn === drag.id));
      let idx = 0;
      for (const c of remaining) {
        const r = c.getBoundingClientRect();
        if (cursorX > r.left + r.width / 2) idx++;
        else break;
      }
      return idx;
    }

    // ─── Visual feedback ───
    function updateFeedback(x, y) {
      const ind = ensureIndicator();

      // ── Task drag ──
      if (drag.type === 'task') {
        const colEl = findTargetColumn(x, y);

        // Column highlight
        clearHighlight();
        if (colEl) {
          const dz = colEl.querySelector('[data-dnd-drop-zone]');
          if (dz) {
            dz.style.backgroundColor = 'hsl(var(--accent)/.12)';
            dz.style.outline = '2px solid hsl(var(--accent))';
            dz.style.outlineOffset = '-2px';
            highlightedDZ = dz;
          }
        }

        if (!colEl) { ind.style.display = 'none'; return null; }

        const columnId = colEl.dataset.dndColumn;
        const insertIndex = computeTaskIndex(colEl, y);

        // Position indicator line
        const dz = colEl.querySelector('[data-dnd-drop-zone]');
        if (!dz) { ind.style.display = 'none'; return { columnId, insertIndex }; }

        const tasks = Array.from(dz.querySelectorAll(':scope > [data-dnd-task]'))
          .filter(el => el.dataset.dndTask !== drag.id);
        const dzRect = dz.getBoundingClientRect();
        let top;

        if (tasks.length === 0) {
          top = dzRect.top + 8;
        } else if (insertIndex >= tasks.length) {
          top = tasks[tasks.length - 1].getBoundingClientRect().bottom + 4;
        } else {
          top = tasks[insertIndex].getBoundingClientRect().top - 4;
        }

        Object.assign(ind.style, {
          display: 'block',
          top: top + 'px',
          left: (dzRect.left + 4) + 'px',
          width: (dzRect.width - 8) + 'px',
          height: '3px',
        });

        return { columnId, insertIndex };
      }

      // ── Column drag ──
      if (drag.type === 'column') {
        const insertIndex = computeColumnIndex(x);
        const scrollEl = scrollElementRef.current;
        const remaining = Array.from(scrollEl.querySelectorAll('[data-dnd-column]'))
          .filter(el => el.dataset.dndColumn !== drag.id);

        if (remaining.length === 0) { ind.style.display = 'none'; return { insertIndex }; }

        let left, refRect;
        if (insertIndex >= remaining.length) {
          refRect = remaining[remaining.length - 1].getBoundingClientRect();
          left = refRect.right + 4;
        } else {
          refRect = remaining[insertIndex].getBoundingClientRect();
          left = refRect.left - 6;
        }

        Object.assign(ind.style, {
          display: 'block',
          left: left + 'px',
          top: refRect.top + 'px',
          width: '3px',
          height: refRect.height + 'px',
        });

        return { insertIndex };
      }

      return null;
    }

    // ─── Auto-scroll (speed scaled by zoom so it doesn't overshoot at low zoom) ───
    function autoScroll(x, y) {
      const el = scrollElementRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (y < r.top || y > r.bottom) return;
      const dL = x - r.left;
      const dR = r.right - x;
      const zoom = zoomRef.current;
      const speed = MAX_SCROLL_SPEED * zoom;
      if (dL >= 0 && dL < EDGE_ZONE) {
        el.scrollLeft -= ((1 - dL / EDGE_ZONE) ** 2) * speed;
      } else if (dR >= 0 && dR < EDGE_ZONE) {
        el.scrollLeft += ((1 - dR / EDGE_ZONE) ** 2) * speed;
      }
    }

    // ─── Drag lifecycle ───
    function beginDrag() {
      if (!drag || drag.started) return;
      drag.started = true;
      drag.clone = createClone(drag.element);
      drag.element.style.opacity = '0.25';
      drag.element.style.transition = 'opacity 150ms';
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.cursor = 'grabbing';
      onDragStartRef.current?.({ type: drag.type });
    }

    function moveDrag(x, y) {
      if (!drag?.started) return;
      drag.currentX = x;
      drag.currentY = y;
      if (drag.clone) {
        const zoom = zoomRef.current;
        drag.clone.style.left = ((x - drag.offsetX) / zoom) + 'px';
        drag.clone.style.top = ((y - drag.offsetY) / zoom) + 'px';
      }
      drag.lastTarget = updateFeedback(x, y);
    }

    function endDrag() {
      if (!drag) return;
      const wasStarted = drag.started;
      const target = drag.lastTarget;
      const info = { type: drag.type, id: drag.id, columnId: drag.columnId, index: drag.index };

      // Restore
      drag.element.style.opacity = '';
      drag.element.style.transition = '';
      if (drag.clone) drag.clone.remove();
      if (indicator) { indicator.remove(); indicator = null; }
      clearHighlight();
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.cursor = '';
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }

      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);
      window.removeEventListener('touchmove', onTouchMove, true);
      window.removeEventListener('touchend', onTouchEnd, true);
      window.removeEventListener('touchcancel', onTouchEnd, true);

      drag = null;

      // Build @hello-pangea/dnd–compatible result
      if (!wasStarted) return;

      let result;
      if (info.type === 'task') {
        result = {
          type: 'task',
          draggableId: info.id,
          source: { droppableId: info.columnId, index: info.index },
          destination: target
            ? { droppableId: target.columnId, index: target.insertIndex }
            : null,
        };
      } else {
        result = {
          type: 'column',
          draggableId: `column-${info.id}`,
          source: { droppableId: 'all-columns', index: info.index },
          destination: target
            ? { droppableId: 'all-columns', index: target.insertIndex }
            : null,
        };
      }
      onDragEndRef.current?.(result);
    }

    // ─── RAF loop (auto-scroll during drag) ───
    function tick() {
      if (!drag?.started) return;
      autoScroll(drag.currentX, drag.currentY);
      raf = requestAnimationFrame(tick);
    }

    // ═══════ Mouse events ═══════
    function onMouseDown(e) {
      if (e.button !== 0) return;
      const d = findDraggable(e.target);
      if (!d) return;

      const p = getPointer(e);
      const r = d.element.getBoundingClientRect();
      drag = {
        ...d,
        startX: p.x, startY: p.y,
        currentX: p.x, currentY: p.y,
        offsetX: p.x - r.left, offsetY: p.y - r.top,
        started: false, clone: null, lastTarget: null,
      };
      // Don't preventDefault here — let clicks pass through if no drag starts
      window.addEventListener('mousemove', onMouseMove, true);
      window.addEventListener('mouseup', onMouseUp, true);
    }

    function onMouseMove(e) {
      if (!drag) return;
      const p = getPointer(e);
      if (!drag.started) {
        if (Math.hypot(p.x - drag.startX, p.y - drag.startY) < DRAG_THRESHOLD) return;
        beginDrag();
        raf = requestAnimationFrame(tick);
      }
      e.preventDefault();
      moveDrag(p.x, p.y);
    }

    function onMouseUp() { endDrag(); }

    // ═══════ Touch events ═══════
    function onTouchStart(e) {
      const d = findDraggable(e.target);
      if (!d) return;

      const p = getPointer(e);
      const r = d.element.getBoundingClientRect();
      drag = {
        ...d,
        startX: p.x, startY: p.y,
        currentX: p.x, currentY: p.y,
        offsetX: p.x - r.left, offsetY: p.y - r.top,
        started: false, touchReady: false,
        clone: null, lastTarget: null,
      };
      // Hold timer — don't drag until held for TOUCH_DELAY ms
      touchTimer = setTimeout(() => {
        if (drag && !drag.started) {
          drag.touchReady = true;
          if (navigator.vibrate) navigator.vibrate(50);
        }
      }, TOUCH_DELAY);

      window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
      window.addEventListener('touchend', onTouchEnd, true);
      window.addEventListener('touchcancel', onTouchEnd, true);
    }

    function onTouchMove(e) {
      if (!drag) return;
      const p = getPointer(e);
      drag.currentX = p.x;
      drag.currentY = p.y;

      if (!drag.started) {
        const dist = Math.hypot(p.x - drag.startX, p.y - drag.startY);
        if (!drag.touchReady) {
          // Moved before hold delay → it's a scroll, abort drag
          if (dist > DRAG_THRESHOLD) {
            clearTimeout(touchTimer);
            touchTimer = null;
            window.removeEventListener('touchmove', onTouchMove, true);
            window.removeEventListener('touchend', onTouchEnd, true);
            window.removeEventListener('touchcancel', onTouchEnd, true);
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
      moveDrag(p.x, p.y);
    }

    function onTouchEnd() { endDrag(); }

    // ═══════ Attach ═══════
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });

    return () => {
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('touchstart', onTouchStart, true);
      if (drag) {
        if (drag.clone) drag.clone.remove();
        drag.element.style.opacity = '';
        drag.element.style.transition = '';
        drag = null;
      }
      if (indicator) { indicator.remove(); indicator = null; }
      clearHighlight();
      if (raf) cancelAnimationFrame(raf);
      if (touchTimer) clearTimeout(touchTimer);
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);
      window.removeEventListener('touchmove', onTouchMove, true);
      window.removeEventListener('touchend', onTouchEnd, true);
      window.removeEventListener('touchcancel', onTouchEnd, true);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.cursor = '';
    };
  }, [enabled, scrollElementRef]);
}
