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
    <div className="flex items-center gap-4 rounded-xl border bg-background p-2.5 pr-3">
      <ProductThumbnail src={imageUrl} className="size-16 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="text-sm font-medium">Image du produit</div>
        <div className="text-xs text-muted-foreground">
          Reprise du catalogue, imprimée à côté du libellé sur le document
        </div>
      </div>
      {!disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" />
          Retirer
        </Button>
      )}
    </div>
  );
}
