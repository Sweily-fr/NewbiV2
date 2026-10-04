"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Miniature de l'image d'un produit du catalogue (catalogue, sélecteur de
 * produit, lignes des éditeurs). Sans image, ou si elle est introuvable,
 * une case neutre garde l'alignement des listes.
 */
export function ProductThumbnail({ src, alt = "", className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = !src || failedSrc === src;

  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md",
        failed
          ? "border border-dashed bg-muted/60 text-muted-foreground/60"
          : "bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]",
        className,
      )}
    >
      {failed ? (
        <ImageIcon className="size-[45%]" aria-hidden />
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
