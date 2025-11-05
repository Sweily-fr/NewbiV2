"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Composant pour afficher le logo d'un marchand
 * Affiche le logo si disponible, sinon affiche les initiales ou une icône par défaut
 */
export function MerchantLogo({ 
  merchant, 
  fallbackText, 
  size = "md",
  className 
}) {
  const [imageError, setImageError] = useState(false);

  // Tailles prédéfinies
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const logoSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const containerSize = sizes[size] || sizes.md;
  const logoSize = logoSizes[size] || logoSizes.md;
  const textSize = textSizes[size] || textSizes.md;

  // Si on a un marchand avec un logo et pas d'erreur de chargement
  if (merchant?.logo && !imageError) {
    return (
      <div
        className={cn(
          "rounded-full overflow-hidden flex-shrink-0 relative border border-border bg-white",
          containerSize,
          className
        )}
      >
        <img
          src={merchant.logo}
          alt={merchant.name}
          className="w-full h-full object-cover absolute inset-0"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback : afficher les initiales ou une icône
  const initials = fallbackText
    ?.split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0 bg-muted",
        containerSize,
        className
      )}
    >
      {initials ? (
        <span className={cn("font-medium text-muted-foreground", textSize)}>
          {initials}
        </span>
      ) : (
        <Building2 className={cn("text-muted-foreground", logoSize)} />
      )}
    </div>
  );
}

/**
 * Composant pour afficher le marchand avec son logo et son nom
 */
export function MerchantDisplay({ 
  merchant, 
  description, 
  category,
  size = "md",
  showCategory = true,
  className 
}) {
  const displayName = merchant?.name || description || "Transaction";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <MerchantLogo
        merchant={merchant}
        fallbackText={displayName}
        size={size}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {displayName}
        </p>
        {showCategory && category && (
          <p className="text-xs text-muted-foreground truncate">
            {category}
          </p>
        )}
      </div>
    </div>
  );
}
