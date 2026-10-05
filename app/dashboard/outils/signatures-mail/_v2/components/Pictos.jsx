"use client";

import { cn } from "@/src/lib/utils";

/**
 * Pictogrammes de mise en page pour les cartes de choix (bloc de couleur,
 * place de la photo, coordonnées, réseaux et logo…) : une signature en
 * miniature vaut mieux qu'un mot pour choisir une disposition.
 */

const PRIMARY = "bg-[#5b4fff]";

/** Ligne de texte stylisée. */
function Line({ w, h = 3, strong = false, className }) {
  return (
    <span
      className={cn(
        "block rounded-full",
        strong
          ? "bg-neutral-400 dark:bg-neutral-400"
          : "bg-neutral-300 dark:bg-neutral-600",
        className,
      )}
      style={{ width: w, height: h }}
    />
  );
}

function Photo({ size = 12, className }) {
  return (
    <span
      className={cn(
        "block shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

/** Nom, poste, société empilés. */
function TextBlock({ light = false, align = "start" }) {
  return (
    <span
      className={cn(
        "flex flex-col gap-[3px]",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      <Line w={24} strong className={light ? "bg-white/90 dark:bg-white/90" : ""} />
      <Line w={18} h={2} className={light ? "bg-white/70 dark:bg-white/70" : ""} />
      <Line w={21} h={2} className={light ? "bg-white/70 dark:bg-white/70" : ""} />
    </span>
  );
}

/** Bloc de couleur : aucun, en-tête, à gauche. */
export function ZonePicto({ zone }) {
  if (zone === "band-top") {
    return (
      <span className="flex w-16 flex-col gap-[5px]">
        <span className={cn("flex items-center gap-1 rounded-[3px] p-1", PRIMARY)}>
          <Photo size={9} className="bg-white/80 dark:bg-white/80" />
          <Line w={20} strong className="bg-white/90 dark:bg-white/90" />
        </span>
        <span className="flex flex-col gap-[3px] px-1">
          <Line w={30} h={2} />
          <Line w={22} h={2} />
        </span>
      </span>
    );
  }
  if (zone === "band-left") {
    return (
      <span className="flex w-16 items-center gap-1.5">
        <span
          className={cn(
            "flex flex-col items-center gap-1 rounded-[3px] px-1.5 py-1.5",
            PRIMARY,
          )}
        >
          <Photo size={9} className="bg-white/80 dark:bg-white/80" />
          <Line w={14} h={2} className="bg-white/90 dark:bg-white/90" />
        </span>
        <span className="flex flex-col gap-[3px]">
          <Line w={22} h={2} />
          <Line w={16} h={2} />
          <Line w={20} h={2} />
        </span>
      </span>
    );
  }
  return (
    <span className="flex w-16 items-center gap-1.5">
      <Photo size={14} />
      <TextBlock />
    </span>
  );
}

/** Photo à gauche, au-dessus ou à droite du texte. */
export function PhotoPicto({ position }) {
  if (position === "top") {
    return (
      <span className="flex w-16 flex-col items-center gap-1">
        <Photo size={11} />
        <TextBlock align="center" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex w-16 items-center justify-center gap-1.5",
        position === "right" && "flex-row-reverse",
      )}
    >
      <Photo size={14} />
      <TextBlock />
    </span>
  );
}

/** Fond de la colonne photo : aucun, teinté, couleur. */
export function FillPicto({ fill }) {
  return (
    <span className="flex w-16 items-stretch gap-1.5">
      <span
        className={cn(
          "flex items-center justify-center rounded-[3px] px-1.5 py-1.5",
          fill === "tint" && "bg-[#5b4fff]/15",
          fill === "solid" && PRIMARY,
        )}
      >
        <Photo
          size={12}
          className={fill === "solid" ? "bg-white/80 dark:bg-white/80" : ""}
        />
      </span>
      <span className="flex items-center">
        <TextBlock />
      </span>
    </span>
  );
}

/** Prénom et nom sur une ligne, ou l'un sous l'autre. */
export function NamePicto({ stacked }) {
  return stacked ? (
    <span className="flex w-14 flex-col gap-[3px]">
      <Line w={18} strong />
      <Line w={24} strong />
    </span>
  ) : (
    <span className="flex w-14 items-center gap-[3px]">
      <Line w={16} strong />
      <Line w={22} strong />
    </span>
  );
}

/** Nom, poste et société empilés, ou sur une ligne. */
export function IdentityPicto({ inline }) {
  if (!inline) {
    return (
      <span className="flex w-14 justify-center">
        <TextBlock />
      </span>
    );
  }
  const dot = (
    <span className="block h-[2px] w-[2px] rounded-full bg-neutral-400" />
  );
  return (
    <span className="flex w-14 items-center justify-center gap-[3px]">
      <Line w={14} strong />
      {dot}
      <Line w={11} h={2} />
      {dot}
      <Line w={11} h={2} />
    </span>
  );
}

/** Coordonnées : icônes, initiales, texte seul, sur une ligne. */
export function ContactPicto({ style }) {
  const widths = [22, 26, 18];
  if (style === "inline") {
    const dot = (
      <span className="block h-[2px] w-[2px] rounded-full bg-neutral-400" />
    );
    return (
      <span className="flex w-12 flex-col gap-[4px]">
        <span className="flex items-center gap-[3px]">
          <Line w={12} h={2} />
          {dot}
          <Line w={16} h={2} />
        </span>
        <span className="flex items-center gap-[3px]">
          <Line w={14} h={2} />
          {dot}
          <Line w={10} h={2} />
        </span>
      </span>
    );
  }
  return (
    <span className="flex w-12 flex-col gap-[4px]">
      {widths.map((w, i) => (
        <span key={i} className="flex items-center gap-[3px]">
          {style === "icons" && (
            <span className={cn("block h-[5px] w-[5px] rounded-[1px]", PRIMARY)} />
          )}
          {style === "labels" && (
            <span className="w-[5px] text-[6px] font-bold leading-[5px] text-[#5b4fff]">
              {"TEW"[i]}
            </span>
          )}
          <Line w={style === "plain" ? w + 6 : w} h={2} />
        </span>
      ))}
    </span>
  );
}

/**
 * Place d'un élément (réseaux ou logo) dans la signature : en-tête,
 * colonne photo, sous le texte, à droite, en bas du cadre, sous le cadre.
 */
export function PlacementPicto({ slot, kind = "social" }) {
  const mark =
    kind === "logo" ? (
      <span className={cn("block h-[5px] w-3 rounded-[1px]", PRIMARY)} />
    ) : (
      <span className="flex gap-[2px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("block h-[4px] w-[4px] rounded-[1px]", PRIMARY)}
          />
        ))}
      </span>
    );
  return (
    <span className="flex w-[68px] flex-col gap-[3px]">
      <span className="flex flex-col gap-[3px] rounded-[3px] border border-neutral-300 p-[3px] dark:border-neutral-600">
        {slot === "header" && <span className="flex">{mark}</span>}
        <span className="flex items-start gap-[4px]">
          <span className="flex flex-col items-center gap-[3px]">
            <Photo size={10} />
            {slot === "visual" && mark}
          </span>
          <span className="flex flex-1 flex-col gap-[3px]">
            <Line w={20} h={2} strong />
            <Line w={15} h={2} />
            {slot === "text" && mark}
          </span>
          {slot === "side" && <span className="self-center">{mark}</span>}
        </span>
        {slot === "footer" && (
          <span className="flex border-t border-neutral-200 pt-[3px] dark:border-neutral-700">
            {mark}
          </span>
        )}
      </span>
      {slot === "outside" && <span className="flex pl-[3px]">{mark}</span>}
    </span>
  );
}
