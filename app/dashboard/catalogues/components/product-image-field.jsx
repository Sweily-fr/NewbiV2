"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, RefreshCw } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";
import { useUploadProductImage } from "@/src/hooks/useProducts";
import { cn } from "@/src/lib/utils";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|hei[cf])$/i;

/**
 * Image facultative d'un produit : envoyée sur R2 dès qu'elle est choisie,
 * l'URL est enregistrée avec la fiche. Elle s'affiche ensuite sur les lignes
 * des devis, factures, bons de commande, avoirs et bons de livraison.
 */
export default function ProductImageField({
  value,
  onChange,
  onUploadingChange,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const { uploadProductImage, loading } = useUploadProductImage();

  useEffect(() => {
    onUploadingChange?.(loading);
  }, [loading, onUploadingChange]);

  const handleFile = async (file) => {
    if (!file) return;
    if (
      !file.type.startsWith("image/") &&
      !ACCEPTED_EXTENSIONS.test(file.name)
    ) {
      toast.error("Formats acceptés : JPEG, PNG, WebP, HEIC");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image trop volumineuse (10 Mo maximum)");
      return;
    }
    const url = await uploadProductImage(file);
    if (url) onChange(url);
  };

  const openPicker = () => {
    if (!loading) inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label className="font-normal">Image</Label>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={loading ? -1 : 0}
        aria-label={
          value ? "Remplacer l'image du produit" : "Ajouter une image"
        }
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring",
          value
            ? "bg-muted"
            : "border-dashed bg-muted/40 hover:border-foreground/30 hover:bg-muted/70",
          dragging && "border-primary bg-primary/5 ring-4 ring-primary/15",
          loading && "cursor-wait",
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Image du produit"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button
                type="button"
                title="Remplacer"
                aria-label="Remplacer l'image"
                onClick={(e) => {
                  e.stopPropagation();
                  openPicker();
                }}
                disabled={loading}
                className="flex size-8 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
              >
                <RefreshCw className="size-3.5" />
              </button>
              <button
                type="button"
                title="Retirer"
                aria-label="Retirer l'image"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                disabled={loading}
                className="flex size-8 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-destructive hover:text-white"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-6 text-center">
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-transform",
                dragging ? "scale-110 text-primary" : "group-hover:scale-105",
              )}
            >
              <ImagePlus className="size-5" />
            </span>
            <span className="text-sm font-medium">
              {dragging ? "Déposez l'image" : "Glissez une photo ici"}
            </span>
            <span className="text-xs text-muted-foreground">
              ou cliquez pour parcourir
            </span>
            <span className="mt-1 text-[11px] text-muted-foreground/80">
              JPEG, PNG, WebP, HEIC · 10 Mo max
            </span>
          </span>
        )}
        {loading && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/75 text-xs text-muted-foreground backdrop-blur-sm">
            <LoaderCircle className="size-5 animate-spin" />
            Envoi de l'image...
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Affichée sur les lignes des devis, factures, bons de commande, avoirs et
        bons de livraison.
      </p>
    </div>
  );
}
