"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

// Garde-fou mémoire pour les très gros documents
const MAX_PAGES = 50;

/**
 * Rendu d'un PDF via pdfjs-dist (canvas), à la place d'une iframe
 * (illisible sur iOS : seul le coin haut-gauche non zoomé s'affiche).
 *
 * - firstPageOnly : ne rend que la première page (miniature)
 * - fallback : nœud affiché si le chargement/rendu échoue
 */
export function PdfPreview({ src, firstPageOnly = false, fallback = null }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    let pdfDoc = null;

    (async () => {
      try {
        setStatus("loading");
        const pdfjs = await import("pdfjs-dist");
        // Worker servi depuis /public : évite les aléas de résolution d'asset
        // du bundler (copie de node_modules/pdfjs-dist/build/pdf.worker.min.mjs)
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        pdfDoc = await pdfjs.getDocument({ url: src }).promise;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        const containerWidth = container.clientWidth || 320;
        const pageCount = firstPageOnly
          ? 1
          : Math.min(pdfDoc.numPages, MAX_PAGES);
        const dpr = window.devicePixelRatio || 1;

        for (let i = 1; i <= pageCount; i++) {
          const page = await pdfDoc.getPage(i);
          if (cancelled) return;

          // Ajuster la page à la largeur du conteneur (netteté: échelle x dpr)
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: scale * dpr });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          if (!firstPageOnly && i > 1) canvas.style.marginTop = "8px";

          await page.render({
            canvasContext: canvas.getContext("2d"),
            viewport,
          }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
        }
        setStatus("ready");
      } catch (error) {
        console.error("Erreur rendu PDF:", error);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      pdfDoc?.destroy?.();
    };
  }, [src, firstPageOnly]);

  if (status === "error") return fallback;

  return (
    <div
      className={`relative w-full h-full ${status === "loading" ? "min-h-[160px]" : ""}`}
    >
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
