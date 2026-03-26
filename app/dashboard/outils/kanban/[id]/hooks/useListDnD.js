import { useRef, useEffect } from 'react';

const DRAG_THRESHOLD = 5;
const TOUCH_DELAY = 200;
const EDGE_ZONE = 80;
const MAX_SCROLL_SPEED = 18;

/**
 * Custom drag-and-drop for Kanban list view.
 * Same behavior as board view: original fades to ghost, clone follows cursor,
 * colored indicator line shows drop position.
 *
 * Produces result objects compatible with @hello-pangea/dnd format.
 */
export function useListDnD({
  onDragStart,
  onDragEnd,
  scrollElementRef,
  enabled = true,
}) {
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);

  useEffect(() => { onDragStartRef.current = onDragStart; }, [onDragStart]);
  useEffect(() => { onDragEndRef.current = onDragEnd; }, [onDragEnd]);

  useEffect(() => {
    if (!enabled) return;

    let drag = null;
    let raf = null;
    let touchTimer = null;
    let indicator = null;

    function getPointer(e) {
      const t = e.touches?.[0];
      return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY };
    }

    function findDraggable(target) {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl || !scrollEl.contains(target)) return null;
      if (target.closest(
        'button, a, input, textarea, select, [role="button"], [role="checkbox"], [data-radix-collection-item], [data-radix-popover-trigger], [data-radix-dropdown-menu-trigger]'
      )) return null;

      const rowEl = target.closest('[data-dnd-list-task]');
      if (rowEl) {
        return {
          type: 'task',
          id: rowEl.dataset.dndListTask,
          columnId: rowEl.dataset.dndListColumn,
          index: parseInt(rowEl.dataset.dndListIndex, 10),
          element: rowEl,
        };
      }
      return null;
    }

    // ─── Clone ───
    function createClone(element) {
      const rect = element.getBoundingClientRect();
      const clone = element.cloneNode(true);

      // Strip DnD data-attrs
      [clone, ...clone.querySelectorAll('*')].forEach(el => {
        if (el.dataset) {
          Object.keys(el.dataset).forEach(k => {
            if (k.startsWith('dnd')) delete el.dataset[k];
          });
        }
      });

      // Preserve the original grid layout
      const computed = window.getComputedStyle(element);
      clone.style.cssText = [
        'position:fixed',
        `left:${rect.left}px`,
        `top:${rect.top}px`,
        `width:${rect.width}px`,
        `height:${rect.height}px`,
        'z-index:10000',
        'pointer-events:none',
        'opacity:.7',
        'cursor:grabbing',
        'border:1px solid rgba(0,0,0,.1)',
        'border-radius:6px',
        'background:var(--background, #fff)',
        'overflow:hidden',
        `display:${computed.display}`,
        `grid-template-columns:${computed.gridTemplateColumns}`,
        `gap:${computed.gap}`,
        `padding:${computed.padding}`,
        `align-items:${computed.alignItems}`,
      ].join(';');

      document.body.appendChild(clone);
      return clone;
    }

    // ─── Indicator ───
    function ensureIndicator() {
      if (indicator) return indicator;
      indicator = document.createElement('div');
      indicator.style.cssText =
        'position:fixed;z-index:9999;pointer-events:none;display:none;' +
        'border-radius:2px;' +
        'transition:top 60ms ease-out,left 60ms ease-out,width 60ms ease-out;';
      document.body.appendChild(indicator);
      return indicator;
    }

    function setIndicatorColor(ind, color) {
      ind.style.background = color;
      ind.style.boxShadow = `0 0 8px ${color}66`;
    }

    // ─── Target detection ───
    function findTargetSection(x, y) {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return null;

      // Find all drop zones (sections/columns)
      const zones = scrollEl.querySelectorAll('[data-dnd-list-zone]');
      for (const zone of zones) {
        const r = zone.getBoundingClientRect();
        if (y >= r.top && y <= r.bottom && x >= r.left && x <= r.right) {
          return zone;
        }
      }

      // Fallback: closest zone by Y distance
      let best = null;
      let bestDist = Infinity;
      for (const zone of zones) {
        const r = zone.getBoundingClientRect();
        const cy = Math.max(r.top, Math.min(y, r.bottom));
        const d = Math.abs(y - cy);
        if (d < bestDist) { bestDist = d; best = zone; }
      }
      return bestDist < 200 ? best : null;
    }

    function computeInsertIndex(zone, cursorY) {
      const rows = Array.from(zone.querySelectorAll(':scope > [data-dnd-list-task]'))
        .filter(el => !(drag && el.dataset.dndListTask === drag.id));

      let idx = 0;
      for (const row of rows) {
        const r = row.getBoundingClientRect();
        if (cursorY > r.top + r.height / 2) idx++;
        else break;
      }
      return idx;
    }

    // ─── Visual feedback ───
    function updateFeedback(x, y) {
      const ind = ensureIndicator();
      const zone = findTargetSection(x, y);

      if (!zone) { ind.style.display = 'none'; return null; }

      const columnId = zone.dataset.dndListZone;
      const columnColor = zone.dataset.dndListZoneColor || '#5A50FF';
      const insertIndex = computeInsertIndex(zone, y);

      // Position indicator
      const rows = Array.from(zone.querySelectorAll(':scope > [data-dnd-list-task]'))
        .filter(el => el.dataset.dndListTask !== drag.id);
      const zoneRect = zone.getBoundingClientRect();
      let top;

      if (rows.length === 0) {
        top = zoneRect.top + 4;
      } else if (insertIndex >= rows.length) {
        top = rows[rows.length - 1].getBoundingClientRect().bottom;
      } else {
        top = rows[insertIndex].getBoundingClientRect().top;
      }

      setIndicatorColor(ind, columnColor);
      Object.assign(ind.style, {
        display: 'block',
        top: (top - 1) + 'px',
        left: (zoneRect.left + 24) + 'px',
        width: (zoneRect.width - 48) + 'px',
        height: '2px',
      });

      return { columnId, insertIndex };
    }

    // ─── Auto-scroll (vertical) ───
    function autoScroll(x, y) {
      const el = scrollElementRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (x < r.left || x > r.right) return;
      const dT = y - r.top;
      const dB = r.bottom - y;
      if (dT >= 0 && dT < EDGE_ZONE) {
        el.scrollTop -= ((1 - dT / EDGE_ZONE) ** 2) * MAX_SCROLL_SPEED;
      } else if (dB >= 0 && dB < EDGE_ZONE) {
        el.scrollTop += ((1 - dB / EDGE_ZONE) ** 2) * MAX_SCROLL_SPEED;
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
        drag.clone.style.left = (x - drag.offsetX) + 'px';
        drag.clone.style.top = (y - drag.offsetY) + 'px';
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

      if (!wasStarted) return;

      const result = {
        type: 'task',
        draggableId: info.id,
        source: { droppableId: info.columnId, index: info.index },
        destination: target
          ? { droppableId: target.columnId, index: target.insertIndex }
          : null,
      };
      onDragEndRef.current?.(result);
    }

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
