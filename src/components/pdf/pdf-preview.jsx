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
 * Squelette de page A4 affiché pendant le chargement d'un PDF archivé.
 * Volontairement neutre : le rendu HTML du document ne peut pas servir de
 * placeholder car il est reconstruit avec les données actuelles alors que le
 * PDF archivé est figé à la finalisation — sur les anciens documents les deux
 * diffèrent visiblement et la bascule ressemble à un bug.
 */
export function PdfPageSkeleton() {
  return (
    <div className="h-full w-full animate-pulse bg-white p-10">
      <div className="flex items-start justify-between">
        <div className="h-10 w-28 rounded bg-gray-200" />
        <div className="flex flex-col items-end gap-2">
          <div className="h-6 w-32 rounded bg-gray-200" />
          <div className="h-3 w-44 rounded bg-gray-100" />
          <div className="h-3 w-36 rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-14 grid grid-cols-2 gap-10">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-3 w-40 rounded bg-gray-100" />
          <div className="h-3 w-36 rounded bg-gray-100" />
          <div className="h-3 w-32 rounded bg-gray-100" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-3 w-40 rounded bg-gray-100" />
          <div className="h-3 w-36 rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-14 h-8 w-full rounded bg-gray-200" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-5/6 rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
      <div className="ml-auto mt-12 w-1/3 space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
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
          mesurable pendant le chargement. En absolu sous l'overlay tant que
          le placeholder est affiché : la page 1 peut s'y dessiner sans
          modifier la hauteur du wrapper (zéro saut de mise en page). */}
      <div
        ref={containerRef}
        className={`w-full ${status === "loading" && placeholder ? "absolute inset-x-0 top-0" : ""}`}
      />
      {status === "loading" && placeholder && (
        <>
          {/* Réserve la hauteur d'une page A4 pendant le chargement pour que
              la bascule placeholder → canvas ne fasse pas sauter la mise en
              page (le canvas d'une page fait exactement cette hauteur). */}
          <div className="w-full" style={{ aspectRatio: "210 / 297" }} />
          {/* Overlay au-dessus du canvas (même emplacement, pas d'empilement
              vertical) : le placeholder recouvre la page le temps du rendu. */}
          <div className="absolute inset-0 z-10 overflow-hidden bg-white">
            {placeholder}
          </div>
        </>
      )}
      {status === "loading" && !placeholder && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      )}
    </div>
  );
}
