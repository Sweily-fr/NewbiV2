"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

// Garde-fou mémoire pour les très gros documents
const MAX_PAGES = 50;

// Cache mémoire des octets PDF déjà téléchargés (clé = src). Les réponses du
// proxy /api/document-preview sont en no-store : sans ce cache, chaque
// réouverture de sidebar retéléchargerait le document. Borné pour ne pas
// gonfler la mémoire sur une longue session.
const MAX_CACHED_PDFS = 15;
const pdfBytesCache = new Map(); // src -> Promise<ArrayBuffer>

function fetchPdfBytes(src) {
  if (!pdfBytesCache.has(src)) {
    const promise = fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .catch((error) => {
        // Ne pas mettre en cache les échecs (session expirée, réseau...)
        pdfBytesCache.delete(src);
        throw error;
      });
    if (pdfBytesCache.size >= MAX_CACHED_PDFS) {
      pdfBytesCache.delete(pdfBytesCache.keys().next().value);
    }
    pdfBytesCache.set(src, promise);
  }
  return pdfBytesCache.get(src);
}

/**
 * Rendu d'un PDF via pdfjs-dist (canvas), à la place d'une iframe
 * (illisible sur iOS : seul le coin haut-gauche non zoomé s'affiche ;
 * fond sombre du visualiseur natif sur desktop).
 *
 * - firstPageOnly : ne rend que la première page (miniature)
 * - fallback : nœud affiché si le chargement/rendu échoue
 * - placeholder : nœud affiché pendant le chargement (ex. rendu HTML du
 *   document pour un affichage instantané) ; spinner par défaut
 */
export function PdfPreview({
  src,
  firstPageOnly = false,
  fallback = null,
  placeholder = null,
}) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    let pdfDoc = null;

    (async () => {
      try {
        setStatus("loading");
        const [pdfjs, bytes] = await Promise.all([
          import("pdfjs-dist"),
          fetchPdfBytes(src),
        ]);
        // Worker servi depuis /public : évite les aléas de résolution d'asset
        // du bundler (copie de node_modules/pdfjs-dist/build/pdf.worker.min.mjs)
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        // Copie obligatoire : pdfjs transfère le buffer au worker (détaché),
        // l'original doit rester intact pour le cache.
        pdfDoc = await pdfjs.getDocument({
          data: new Uint8Array(bytes.slice(0)),
        }).promise;
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

          // Basculer sur le canvas dès la première page : les suivantes
          // s'ajoutent pendant que l'utilisateur voit déjà le document.
          if (i === 1) setStatus("ready");
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
      className={`relative w-full h-full ${status === "loading" && !placeholder ? "min-h-[160px]" : ""}`}
    >
      {/* Toujours visible (jamais display:none) : clientWidth doit être
          mesurable pendant le chargement. Vide tant qu'aucune page n'est
          rendue, donc sans impact sur le placeholder affiché en dessous. */}
      <div ref={containerRef} className="w-full" />
      {status === "loading" &&
        (placeholder || (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderCircle className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ))}
    </div>
  );
}
