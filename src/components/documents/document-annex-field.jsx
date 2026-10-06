"use client";

import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Eye,
  FilePlus2,
  FileText,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { useUploadDocumentAnnex } from "@/src/hooks/useDocumentAnnex";
import {
  annexProxyUrl,
  formatAnnexSummary,
  normalizeAnnex,
} from "@/src/utils/document-annex";
import { cn } from "@/src/lib/utils";

/**
 * Annexe PDF d'un devis, d'une facture ou d'un bon de commande (champ `annex`
 * du formulaire) : ses pages sont ajoutées à la fin du PDF du document.
 * Le fichier est envoyé dès son choix ; la référence est enregistrée avec le
 * document, ou comme annexe par défaut dans les paramètres globaux.
 */
export default function DocumentAnnexField({
  documentType,
  ofDocumentLabel,
  canEdit = true,
}) {
  const { watch, setValue } = useFormContext();
  const annex = normalizeAnnex(watch("annex"));
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const { uploadAnnex, loading } = useUploadDocumentAnnex(documentType);
  const disabled = !canEdit || loading;

  const setAnnex = (value) =>
    setValue("annex", value, { shouldDirty: true });

  const handleFile = async (file) => {
    if (!file || disabled) return;
    const uploaded = await uploadAnnex(file);
    if (uploaded) setAnnex(uploaded);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div>
      <div className="mb-2">
        <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
          Annexe PDF
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Ses pages sont ajoutées à la fin du PDF {ofDocumentLabel} (ex :
          conditions générales de vente).
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {annex ? (
        <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#5b50FF]/10 text-[#5b50FF]">
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-medium">
              {annex.fileName}
            </span>
            <span className="block text-xs text-muted-foreground">
              {loading
                ? "Envoi du PDF..."
                : formatAnnexSummary(annex) || "PDF ajouté en fin de document"}
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              title="Voir l'annexe"
              aria-label="Voir l'annexe"
              onClick={() =>
                window.open(annexProxyUrl(annex), "_blank", "noopener")
              }
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Eye className="size-4" />
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  title="Remplacer"
                  aria-label="Remplacer l'annexe"
                  onClick={openPicker}
                  disabled={disabled}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw className="size-4" />
                </button>
                <button
                  type="button"
                  title="Retirer"
                  aria-label="Retirer l'annexe"
                  onClick={() => setAnnex(null)}
                  disabled={disabled}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Ajouter une annexe PDF"
          aria-disabled={disabled}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-3 py-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-foreground/30 hover:bg-muted/60",
            dragging && "border-[#5b50FF] bg-[#5b50FF]/5",
            loading && "cursor-wait",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <FilePlus2 className="size-4" />
            )}
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-medium">
              {loading
                ? "Envoi du PDF..."
                : dragging
                  ? "Déposez le PDF"
                  : "Ajouter un PDF en annexe"}
            </span>
            <span className="block text-xs text-muted-foreground">
              PDF · 2 Mo et 20 pages max
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
