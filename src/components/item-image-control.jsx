"use client";

import { useId } from "react";
import { Switch } from "@/src/components/ui/switch";
import { ProductThumbnail } from "@/src/components/product-thumbnail";
import { cn } from "@/src/lib/utils";

/**
 * Image d'une ligne de document, reprise du produit du catalogue. Son
 * affichage par défaut vient de la fiche produit (« Afficher sur les
 * documents ») ; l'interrupteur ne touche qu'à cette ligne : la fiche produit
 * et les autres documents restent inchangés.
 */
export function ItemImageControl({
  imageUrl,
  showImage,
  onShowImageChange,
  disabled = false,
}) {
  const id = useId();
  if (!imageUrl) return null;

  const shown = showImage !== false;

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-background p-2.5 pr-3">
      <ProductThumbnail
        src={imageUrl}
        className={cn(
          "size-16 rounded-lg transition-opacity",
          !shown && "opacity-40 grayscale",
        )}
      />
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer space-y-0.5">
        <div className="text-sm font-medium">Afficher l'image sur le document</div>
        <div className="text-xs text-muted-foreground">
          {shown
            ? "Imprimée à côté du libellé de cette ligne"
            : "Masquée sur ce document, gardée sur la ligne"}
        </div>
      </label>
      <Switch
        id={id}
        checked={shown}
        onCheckedChange={onShowImageChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  );
}
