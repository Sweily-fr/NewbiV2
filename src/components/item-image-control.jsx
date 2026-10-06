"use client";

import { useId } from "react";
import { EyeOff } from "lucide-react";
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
    <div className="flex items-center gap-3 rounded-lg border bg-background px-2.5 py-2">
      <span className="relative shrink-0">
        <ProductThumbnail
          src={imageUrl}
          className={cn(
            "size-10 rounded-md ring-1 ring-border transition-all",
            !shown && "opacity-40 grayscale",
          )}
        />
        {!shown && (
          <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <EyeOff className="size-4" />
          </span>
        )}
      </span>
      <label
        htmlFor={id}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
      >
        <span className="truncate text-sm font-medium">
          Image sur le document
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
            shown
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {shown ? "Affichée" : "Masquée"}
        </span>
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
