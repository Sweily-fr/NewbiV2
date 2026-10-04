"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ProductThumbnail } from "@/src/components/product-thumbnail";

/**
 * Image d'une ligne de document, reprise du produit du catalogue. La retirer
 * ne touche qu'à cette ligne : la fiche produit garde son image.
 */
export function ItemImageControl({ imageUrl, onRemove, disabled = false }) {
  if (!imageUrl) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-2">
      <ProductThumbnail src={imageUrl} className="size-12" />
      <div className="min-w-0 flex-1">
        <div className="text-sm">Image du produit</div>
        <div className="text-xs text-muted-foreground">
          Affichée sur le document
        </div>
      </div>
      {!disabled && (
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="size-3.5" />
          Retirer
        </Button>
      )}
    </div>
  );
}
