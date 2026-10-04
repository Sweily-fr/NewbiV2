"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Miniature de l'image d'un produit du catalogue (catalogue, sélecteur de
 * produit, lignes des éditeurs). Une image introuvable laisse place à une
 * icône neutre plutôt qu'à une image cassée.
 */
export function ProductThumbnail({ src, alt = "", className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = !src || failedSrc === src;

  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted",
        className,
      )}
    >
      {failed ? (
        <ImageIcon className="size-1/2 text-muted-foreground" aria-hidden />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      )}
    </span>
  );
}
