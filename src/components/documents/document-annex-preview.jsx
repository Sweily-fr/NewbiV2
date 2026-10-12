"use client";

import { Paperclip } from "lucide-react";
import { PdfPreview } from "@/src/components/pdf/pdf-preview";
import { cn } from "@/src/lib/utils";
import {
  annexProxyUrl,
  formatAnnexSummary,
  normalizeAnnex,
} from "@/src/utils/document-annex";

/**
 * Pages de l'annexe PDF affichées sous l'aperçu du document, telles qu'elles
 * seront ajoutées à la fin du PDF.
 *
 * tone="dark" : libellé clair, pour un fond sombre (sidebars).
 *
 * À placer HORS de l'élément capturé pour les PDF navigateur (pdfRef) : ces
 * replis ajoutent déjà l'annexe au PDF, la capturer en plus la doublerait.
 */
export default function DocumentAnnexPreview({
  annex,
  tone = "light",
  className,
}) {
  const normalized = normalizeAnnex(annex);
  const src = annexProxyUrl(normalized);
  if (!src) return null;

  const summary = formatAnnexSummary(normalized);

  return (
    <div className={cn("mt-10", className)} data-annex-preview>
      <div
        className={`mb-3 flex min-w-0 items-center gap-2 text-xs ${
          tone === "dark" ? "text-white/70" : "text-muted-foreground"
        }`}
      >
        <Paperclip className="size-3.5 shrink-0" />
        <span className="shrink-0">Annexe</span>
        <span
          className={`truncate font-medium ${
            tone === "dark" ? "text-white" : "text-foreground/80"
          }`}
        >
          {normalized.fileName}
        </span>
        {summary && <span className="shrink-0">· {summary}</span>}
      </div>
      <PdfPreview
        key={src}
        src={src}
        pageClassName="bg-white shadow-lg"
        pageGap={32}
        placeholder={<div className="h-full w-full animate-pulse bg-white" />}
        fallback={
          <div className="flex aspect-[210/297] w-full items-center justify-center bg-white text-xs text-muted-foreground shadow-lg">
            Aperçu de l'annexe indisponible
          </div>
        }
      />
    </div>
  );
}
