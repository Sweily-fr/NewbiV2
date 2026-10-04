"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";
import { useUploadProductImage } from "@/src/hooks/useProducts";
import { cn } from "@/src/lib/utils";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|hei[cf])$/i;

/**
 * Image facultative d'un produit : envoyée sur R2 dès qu'elle est choisie,
 * l'URL est enregistrée avec la fiche. Elle s'affiche ensuite sur les lignes
 * des devis, factures, bons de commande, avoirs et bons de livraison.
 */
export default function ProductImageField({ value, onChange, onUploadingChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const { uploadProductImage, loading } = useUploadProductImage();

  useEffect(() => {
    onUploadingChange?.(loading);
  }, [loading, onUploadingChange]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !ACCEPTED_EXTENSIONS.test(file.name)) {
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

      <button
        type="button"
        onClick={openPicker}
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
        disabled={loading}
        className={cn(
          "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/50 transition-colors",
          !value && "border-dashed hover:bg-muted",
          dragging && "border-primary bg-primary/5",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Image du produit"
            className="size-full object-contain"
          />
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-4 text-center text-sm text-muted-foreground">
            <ImagePlus className="size-5" />
            Ajouter une image
            <span className="text-xs">JPEG, PNG, WebP ou HEIC, 10 Mo max</span>
          </span>
        )}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </span>
        )}
      </button>

      {value && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={openPicker}
            disabled={loading}
          >
            <RefreshCw className="size-3.5" />
            Remplacer
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onChange(null)}
            disabled={loading}
          >
            <Trash2 className="size-3.5" />
            Retirer
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Affichée sur les lignes des devis, factures, bons de commande, avoirs et
        bons de livraison.
      </p>
    </div>
  );
}
