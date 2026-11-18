"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/src/lib/utils";
import { BLOCK_LABELS, BLOCK_TYPES } from "@/src/utils/email-campaign-design";
import { FOCUS_RING } from "../shared";
import { BLOCK_HINTS, BLOCK_ICONS } from "./block-icons";

/** Aperçu d'une tuile pendant le glisser (DragOverlay). */
export function BlockTilePreview({ type }) {
  const Icon = BLOCK_ICONS[type];
  return (
    <div className="flex h-[52px] w-[150px] cursor-grabbing items-center gap-2.5 rounded-xl border border-[#5a50ff]/40 bg-white px-3 text-sm font-medium text-[#242529] shadow-[0_10px_30px_rgba(15,23,42,0.18)] dark:bg-[#1c1c1f] dark:text-white">
      <span className="flex size-7 items-center justify-center rounded-lg bg-[#5a50ff]/10 text-[#5a50ff]">
        <Icon className="size-4" aria-hidden />
      </span>
      {BLOCK_LABELS[type]}
    </div>
  );
}

function BlockTile({ type, onAdd, disabled }) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { source: "palette", type },
    disabled,
  });
  const Icon = BLOCK_ICONS[type];
  return (
    <button
      ref={setNodeRef}
      type="button"
      // Souris : glisser vers l'e-mail ; clic ou clavier : ajout direct
      onPointerDown={listeners?.onPointerDown}
      onClick={() => onAdd(type)}
      disabled={disabled}
      title={BLOCK_HINTS[type]}
      className={cn(
        "group flex h-[84px] cursor-grab flex-col items-center justify-center gap-2 rounded-xl border border-[#e6e7ea] bg-white text-center transition-[border-color,box-shadow,transform] duration-150 select-none hover:border-[#5a50ff]/45 hover:shadow-[0_2px_8px_rgba(90,80,255,0.10)] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2E2E32] dark:bg-[#18181b] dark:hover:border-[#8b7fff]/50",
        FOCUS_RING,
        isDragging && "opacity-40",
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-[#f4f4f6] text-[#4b4d55] transition-colors group-hover:bg-[#5a50ff]/10 group-hover:text-[#5a50ff] dark:bg-white/[0.06] dark:text-white/75">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="px-1 text-xs leading-4 font-medium text-[#3f4046] dark:text-white/80">
        {BLOCK_LABELS[type]}
      </span>
    </button>
  );
}

/**
 * Onglet « Blocs » : les 8 blocs, à glisser dans l'e-mail ou à ajouter
 * d'un clic sous le bloc sélectionné (à la fin sinon).
 */
export function BlocksPanel({ onAdd, disabled }) {
  // Touches affichées selon le système (⌘ sur Mac, Ctrl ailleurs)
  const [keys] = useState(() => {
    const mac =
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || "");
    return mac
      ? { mod: "⌘", shift: "⇧", alt: "⌥" }
      : { mod: "Ctrl", shift: "Maj", alt: "Alt" };
  });
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="grid grid-cols-2 gap-2.5">
        {BLOCK_TYPES.map((type) => (
          <BlockTile key={type} type={type} onAdd={onAdd} disabled={disabled} />
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Glissez un bloc dans l&apos;e-mail, ou cliquez dessus pour
        l&apos;ajouter sous le bloc sélectionné.
      </p>
      <div className="rounded-xl bg-[#f7f7f8] px-3.5 py-3 dark:bg-white/[0.04]">
        <p className="mb-2 text-xs font-medium text-[#3f4046] dark:text-white/80">
          Raccourcis
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          {[
            [`${keys.mod} Z`, "Annuler"],
            [`${keys.shift} ${keys.mod} Z`, "Rétablir"],
            [`${keys.mod} D`, "Dupliquer le bloc"],
            [`${keys.alt} ↑ ↓`, "Déplacer le bloc"],
            ["Suppr", "Supprimer le bloc"],
            ["Échap", "Désélectionner"],
          ].map(([combo, label]) => (
            <div key={label} className="contents">
              <dt>
                <kbd className="rounded border border-[#e2e3e6] bg-white px-1.5 py-px font-sans text-[11px] text-[#3f4046] dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                  {combo}
                </kbd>
              </dt>
              <dd className="self-center">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
