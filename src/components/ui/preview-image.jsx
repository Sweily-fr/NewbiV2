"use client";

import { useState, useEffect } from "react";
import { LoaderCircle, FileImage } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function PreviewImage({
  src,
  alt,
  className,
  containerClassName,
  loaderSize = "h-10 w-10",
  loaderClassName,
  style,
  draggable,
  ...imgProps
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-[120px]",
          containerClassName,
        )}
      >
        <FileImage className={cn(loaderSize, "text-muted-foreground")} />
      </div>
    );
  }

  return (
    <div className={cn("relative", containerClassName)}>
      {!loaded && (
        <div
          className={cn(
            "flex items-center justify-center min-h-[200px] w-full",
            loaderClassName,
          )}
        >
          <LoaderCircle
            className={cn(loaderSize, "animate-spin text-muted-foreground")}
          />
        </div>
      )}
      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        draggable={draggable}
        style={style}
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "h-0 overflow-hidden opacity-0",
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        {...imgProps}
      />
    </div>
  );
}
