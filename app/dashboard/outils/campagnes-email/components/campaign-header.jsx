"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import { CAMPAIGNS_URL, FOCUS_RING, StatusBadge } from "./shared";

/** Nom de la campagne modifiable sur place (enregistré à la sortie du champ). */
function NameInput({ name, onRename }) {
  const [value, setValue] = useState(name);
  useEffect(() => setValue(name), [name]);
  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(name);
      return;
    }
    if (trimmed !== name) onRename(trimmed);
  };
  // Le champ prend la largeur de son texte : une copie invisible donne la
  // largeur, le champ la recouvre (en absolu, il ne compte pas dans le
  // calcul) et le statut reste collé au nom
  const field =
    "h-10 border border-transparent px-2 text-2xl font-medium tracking-[-0.01em]";
  return (
    <span className="relative -ml-2 inline-block max-w-full min-w-0">
      <span
        aria-hidden
        className={cn(field, "invisible block overflow-hidden whitespace-pre")}
      >
        {value || " "}
      </span>
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setValue(name);
            requestAnimationFrame(() => event.target.blur());
          }
        }}
        maxLength={120}
        aria-label="Nom de la campagne"
        className={cn(
          field,
          "absolute inset-0 w-full min-w-0 shadow-none hover:border-[#e6e7ea] focus:border-[#D1D3D8] dark:border-transparent dark:hover:border-[#2E2E32] dark:focus:border-[#44444A]",
        )}
      />
    </span>
  );
}

/**
 * En-tête de la page d'une campagne (préparation ou rapport) : retour à la
 * liste, nom (modifiable pour un brouillon), statut, ligne d'information et
 * actions.
 */
export function CampaignHeader({
  campaign,
  meta,
  actions,
  onRename,
  className,
}) {
  return (
    <header className={cn("flex flex-col gap-3", className)}>
      <Link
        href={CAMPAIGNS_URL}
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground",
          FOCUS_RING,
        )}
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Campagnes e-mail
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-4">
        <div className="min-w-0 sm:flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            {onRename ? (
              <NameInput name={campaign.name} onRename={onRename} />
            ) : (
              <h1 className="min-w-0 text-xl font-medium [overflow-wrap:anywhere] sm:text-2xl">
                {campaign.name}
              </h1>
            )}
            <StatusBadge status={campaign.status} />
          </div>
          {meta && <p className="mt-1 text-sm text-muted-foreground">{meta}</p>}
        </div>
        {actions && (
          // Téléphone : actions en grille sous le titre, pleine largeur
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto [&>span>button]:w-full sm:[&>span>button]:w-auto">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
