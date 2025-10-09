import { useRef, useEffect } from 'react';

/**
 * Hook pour gérer le scroll horizontal par glissement (drag-to-scroll)
 * @param {Object} options - Options de configuration
 * @param {boolean} options.enabled - Active/désactive le drag-to-scroll
 * @param {number} options.scrollSpeed - Multiplicateur de vitesse de scroll (défaut: 1)
 * @returns {Object} - Ref à attacher au conteneur scrollable
 */
export function useDragToScroll({ enabled = true, scrollSpeed = 1 } = {}) {
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !enabled) return;

    const handleMouseDown = (e) => {
      // Ignorer si on clique sur un élément interactif
      const target = e.target;
      const isInteractive = 
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('[role="button"]') ||
        target.closest('[draggable="true"]') ||
        target.closest('[data-sortable-handle]') ||
        target.closest('[data-dnd-kit-draggable]');

      if (isInteractive) return;

      isDraggingRef.current = true;
      startXRef.current = e.pageX - element.offsetLeft;
      scrollLeftRef.current = element.scrollLeft;
      
      // Changer le curseur
      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
      
      // Empêcher la sélection de texte
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      
      e.preventDefault();
      
      const x = e.pageX - element.offsetLeft;
      const walk = (x - startXRef.current) * scrollSpeed;
      element.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      
      isDraggingRef.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = '';
    };

    const handleMouseLeave = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        element.style.cursor = 'grab';
        element.style.userSelect = '';
      }
    };

    // Définir le curseur initial
    element.style.cursor = 'grab';

    // Ajouter les écouteurs d'événements
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.style.cursor = '';
      element.style.userSelect = '';
    };
  }, [enabled, scrollSpeed]);

  return scrollRef;
}
