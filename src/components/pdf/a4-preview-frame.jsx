"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/src/lib/utils";

// Largeur d'une page A4 à 96 dpi (210 mm), celle des PDF générés
export const A4_WIDTH_PX = 794;

/**
 * Aperçu d'un document à la taille d'une page A4.
 *
 * Les gabarits (UniversalPreviewPDF, DeliveryNotePreview) prennent toute la
 * largeur de leur parent avec un texte fixe à 10 px : dans la colonne d'un
 * éditeur sur grand écran, la page s'étirait sur plus de 1 300 px, presque
 * vide et sans rapport avec le PDF. Ici la page est rendue à sa largeur réelle
 * (794 px, mise en page identique au PDF) puis réduite par transform quand la
 * colonne est plus étroite, jamais agrandie.
 *
 * transform ne change pas la place occupée dans la mise en page : la hauteur
 * du cadre est donc calculée ici. La page garde au moins la hauteur d'une A4,
 * pied de page en bas comme sur le PDF (le min-h-screen des gabarits ne vaut
 * qu'en pleine largeur).
 */
export default function A4PreviewFrame({ children, className }) {
  const frameRef = useRef(null);
  const pageRef = useRef(null);
  const [frame, setFrame] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    const el = frameRef.current;
    const page = pageRef.current;
    if (!el || !page) return;
    const measure = () => {
      const scale = Math.min(1, el.clientWidth / A4_WIDTH_PX);
      const height = page.offsetHeight * scale;
      setFrame((prev) =>
        prev.scale === scale && prev.height === height
          ? prev
          : { scale, height },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(page);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className={cn("mx-auto w-full max-w-[794px]", className)}
      style={frame.height ? { height: frame.height } : undefined}
    >
      <div
        ref={pageRef}
        className="w-[794px] origin-top-left [&_[data-pdf-root]]:min-h-[1123px]"
        style={{ transform: `scale(${frame.scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
