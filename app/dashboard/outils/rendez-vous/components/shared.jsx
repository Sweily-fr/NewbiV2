"use client";

import { useState } from "react";
import { Check, Copy, MapPin, Phone, Video } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { VIDEO_LOCATION_KINDS } from "@/src/utils/booking";

// Onglets soulignés, même rendu que les transferts et les clients
export const UNDERLINE_TAB_CLASS =
  "relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]";

export const PROVIDER_NAMES = {
  google: "Google Agenda",
  microsoft: "Outlook",
  apple: "Apple Calendrier",
};

/** Icône du lieu d'un rendez-vous. */
export function LocationKindIcon({ kind, className }) {
  const Icon = VIDEO_LOCATION_KINDS.includes(kind)
    ? Video
    : kind === "PHONE"
      ? Phone
      : MapPin;
  return <Icon className={className} aria-hidden="true" />;
}

/** Copie dans le presse-papiers, coche une seconde après. */
export async function copyText(text, label = "Lien copié") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
    return true;
  } catch {
    toast.error("Copie impossible", {
      description: "Sélectionnez le texte et copiez-le à la main.",
    });
    return false;
  }
}

export function CopyButton({
  text,
  label = "Copier le lien",
  toastLabel = "Lien copié",
  variant = "outline",
  size = "sm",
  iconOnly = false,
  className,
}) {
  const [copied, setCopied] = useState(false);
  const Icon = copied ? Check : Copy;
  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon" : size}
      className={cn("cursor-pointer", className)}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      onClick={async () => {
        if (await copyText(text, toastLabel)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {!iconOnly && label}
    </Button>
  );
}

/** Bloc de réglages : titre, aide, contenu. */
export function SettingsSection({
  title,
  description,
  action,
  children,
  className,
}) {
  return (
    <section
      className={cn("rounded-xl border bg-background p-4 sm:p-5", className)}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Pastilles de couleur (types et page). */
export function ColorSwatches({ colors, value, onChange, disabled, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {colors.map((color) => {
        const selected = value?.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            disabled={disabled}
            onClick={() => onChange(color)}
            className={cn(
              "flex size-7 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "ring-2 ring-foreground/70"
                : "hover:ring-2 hover:ring-border",
            )}
            style={{ backgroundColor: color }}
          >
            {selected && (
              <Check className="size-3.5 text-white" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
