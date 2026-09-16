"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { PreviewImage } from "@/src/components/ui/preview-image";

// Volet d'aperçu à gauche d'un tiroir (même rendu que le tiroir transaction) :
// fond sombre + page A4 avec le PDF (iframe via le proxy same-origin
// /api/document-preview, la CSP interdit les URL R2) ou l'image. Rendu dans un
// portail sur <body> : les tiroirs vaul/Radix appliquent un transform sur leur
// contenu, un `fixed` interne y resterait enfermé. Ces tiroirs ferment au clic
// hors contenu : ils doivent ignorer les clics dans ce volet via
// `isDocumentPreviewTarget` (onInteractOutside / onPointerDownOutside).

export const DOCUMENT_PREVIEW_ATTR = "data-document-preview-panel";

export function isDocumentPreviewTarget(target) {
  return Boolean(target?.closest?.(`[${DOCUMENT_PREVIEW_ATTR}]`));
}

export function inferDocumentKind(doc) {
  if (!doc) return { isPdf: false, isImage: false };
  const mime = (doc.mimeType || doc.mimetype || "").toLowerCase();
  const name = (doc.filename || doc.originalFileName || doc.originalFilename || "")
    .toLowerCase();
  const url = (doc.url || "").toLowerCase().split("?")[0];
  const isPdf = mime === "application/pdf" || name.endsWith(".pdf") || url.endsWith(".pdf");
  const isImage =
    mime.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name) ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(url);
  return { isPdf, isImage };
}

// Bouton œil commun aux lignes de documents des tiroirs (violet si affiché).
export function DocumentEyeButton({ active, onClick, disabled, label, className = "" }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 shrink-0 ${active ? "text-[#5A50FF]" : "text-muted-foreground"} ${className}`}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={
        disabled
          ? "Aucun fichier à afficher"
          : active
            ? "Masquer l'aperçu"
            : label || "Voir à gauche"
      }
    >
      <Eye className="h-4 w-4" />
    </Button>
  );
}

/**
 * @param {object} props
 * @param {Array<{url?: string, pdfSrc?: string, filename?: string, mimeType?: string}>} props.items
 * @param {number} props.index index du document affiché ; le volet est masqué si aucun item
 * @param {(index: number) => void} props.onIndexChange
 * @param {() => void} props.onClose
 * @param {number} [props.sidebarWidth] largeur du tiroir à droite (px, ≥ md)
 * @param {number} [props.zIndex] base z-index (au-dessus de l'overlay du tiroir)
 */
export function DocumentPreviewPanel({
  items = [],
  index = 0,
  onIndexChange,
  onClose,
  sidebarWidth = 500,
  zIndex = 60,
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const safeIndex = Math.min(Math.max(index, 0), Math.max(items.length - 1, 0));
  const doc = items.length > 0 ? items[safeIndex] : null;
  const open = Boolean(doc && (doc.url || doc.pdfSrc));

  // Échap ferme le volet avant le tiroir.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  // Les tiroirs Radix/vaul (react-remove-scroll) annulent la molette hors du
  // tiroir : on fait défiler le volet à la main, en capture et non passif
  // pour rester avant leur écouteur sur document.
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!open || !el) return undefined;
    const onWheel = (e) => {
      if (!el.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      el.scrollTop += e.deltaY;
      el.scrollLeft += e.deltaX;
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () =>
      window.removeEventListener("wheel", onWheel, { capture: true });
  }, [open]);

  if (!mounted) return null;

  const { isPdf, isImage } = inferDocumentKind(doc);
  const pdfSrc = doc?.pdfSrc || doc?.url;
  const title = doc?.filename || "Document";
  const rightStyle = { "--dpp-sidebar": `${sidebarWidth}px` };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          {...{ [DOCUMENT_PREVIEW_ATTR]: "" }}
          className="pointer-events-auto"
          style={rightStyle}
        >
          <motion.div
            className="fixed inset-y-0 left-0 right-0 md:right-[var(--dpp-sidebar)] bg-black/60 cursor-pointer pointer-events-auto"
            style={{ zIndex }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />

          <motion.div
            className="fixed inset-y-0 left-0 right-0 md:right-[var(--dpp-sidebar)] pointer-events-none"
            style={{ zIndex: zIndex + 1 }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{
              x: "-100%",
              transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
            }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-auto max-w-[calc(100%-2rem)]">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
                onClick={onClose}
                title="Fermer l'aperçu"
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium truncate">
                {title}
              </span>
            </div>

            <div
              ref={scrollRef}
              className="absolute inset-0 flex items-start justify-center overflow-y-auto py-16 px-2 md:px-24"
            >
              <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white pointer-events-auto overflow-hidden shadow-2xl">
                {isPdf && pdfSrc ? (
                  <iframe
                    src={`${pdfSrc}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    title={title}
                    className="w-full h-full min-h-[297mm] border-0 block"
                  />
                ) : isImage && doc?.url ? (
                  <PreviewImage
                    src={doc.url}
                    alt={title}
                    className="w-full h-auto object-contain"
                    containerClassName="w-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-12 min-h-[calc(100vh-6rem)]">
                    <FileText className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-sm mb-4">Aperçu non disponible</p>
                    {doc?.url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ouvrir le fichier
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {items.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-medium pointer-events-auto shadow-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/15 hover:text-white rounded-full"
                  disabled={safeIndex === 0}
                  onClick={() => onIndexChange?.(safeIndex - 1)}
                  title="Précédent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="tabular-nums select-none">
                  {safeIndex + 1} / {items.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/15 hover:text-white rounded-full"
                  disabled={safeIndex >= items.length - 1}
                  onClick={() => onIndexChange?.(safeIndex + 1)}
                  title="Suivant"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
