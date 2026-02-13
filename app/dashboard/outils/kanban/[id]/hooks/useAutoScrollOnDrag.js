import { useRef, useEffect } from 'react';

/**
 * Hook pour auto-scroller le conteneur horizontal pendant un drag-and-drop actif.
 * Quand le curseur s'approche des bords gauche/droit du conteneur, le scroll
 * s'active automatiquement avec une vitesse progressive.
 *
 * @param {Object} options
 * @param {React.RefObject} options.scrollElementRef - Ref vers le conteneur scrollable
 * @param {boolean} options.isDragging - true quand un drag DnD est en cours
 */
export function useAutoScrollOnDrag({ scrollElementRef, isDragging }) {
  const pointerXRef = useRef(0);
  const pointerYRef = useRef(0);
  const rafIdRef = useRef(null);

  useEffect(() => {
    if (!isDragging) return;

    const EDGE_ZONE = 120; // px depuis le bord pour activer le scroll
    const MAX_SPEED = 25;  // px par frame max

    const handlePointerMove = (e) => {
      const touch = e.touches?.[0];
      pointerXRef.current = touch ? touch.clientX : e.clientX;
      pointerYRef.current = touch ? touch.clientY : e.clientY;
    };

    const tick = () => {
      const el = scrollElementRef.current;
      if (!el) {
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const rect = el.getBoundingClientRect();
      const x = pointerXRef.current;

      // Vérifier que le curseur est dans la zone verticale du conteneur
      const y = pointerYRef.current;
      if (y < rect.top || y > rect.bottom) {
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const distFromLeft = x - rect.left;
      const distFromRight = rect.right - x;

      let speed = 0;

      if (distFromLeft < EDGE_ZONE && distFromLeft >= 0) {
        // Scroll vers la gauche — vitesse quadratique
        const ratio = 1 - distFromLeft / EDGE_ZONE; // 0 au seuil, 1 au bord
        speed = -(ratio * ratio * MAX_SPEED);
      } else if (distFromRight < EDGE_ZONE && distFromRight >= 0) {
        // Scroll vers la droite — vitesse quadratique
        const ratio = 1 - distFromRight / EDGE_ZONE;
        speed = ratio * ratio * MAX_SPEED;
      }

      if (speed !== 0) {
        el.scrollLeft += speed;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    // Écouter les mouvements (capture phase pour capter même pendant le drag)
    window.addEventListener('mousemove', handlePointerMove, true);
    window.addEventListener('touchmove', handlePointerMove, true);

    // Démarrer la boucle
    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove, true);
      window.removeEventListener('touchmove', handlePointerMove, true);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isDragging, scrollElementRef]);
}
