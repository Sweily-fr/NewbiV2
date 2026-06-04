"use client";

/**
 * TagSelector — saisie de tags avec autocomplétion + création colorée.
 *
 * Affiche les tags courants (badges colorés, supprimables) et une popup épurée
 * qui propose les tags déjà enregistrés dans le workspace et permet d'en créer
 * de nouveaux en choisissant leur couleur.
 *
 * Ajout optimiste : `onAdd` est appelé immédiatement (le badge apparaît sans
 * attendre le réseau) ; l'enregistrement de la couleur au registre se fait en
 * arrière-plan.
 *
 * Props :
 *  - value:     string[]  tags actuellement posés
 *  - onAdd:     (name) => void | Promise
 *  - onRemove:  (name) => void | Promise
 *  - disabled?: bool
 *  - placeholder?: string
 *  - size?: "sm" | "default"
 */

import * as React from "react";
import { Plus, Tag as TagIcon, X, Check } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";
import {
  useDocumentTags,
  useCreateDocumentTag,
} from "@/src/hooks/useSharedDocuments";

// Palette (alignée sur le backend)
export const TAG_PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
];

export function fallbackColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

/**
 * Résout la couleur d'un tag : couleur du registre si connue, sinon couleur de
 * repli déterministe (même tag → même couleur).
 */
export function resolveTagColor(name, tags = []) {
  const found = tags.find((t) => t.name === name);
  return found?.color || fallbackColor(name);
}

/**
 * Affiche une liste de tags en pills colorées, tronquée à `max`, avec un badge
 * « +N » qui révèle les tags cachés au survol (comme la vue liste du kanban).
 *
 * Props :
 *  - tags:     string[]  noms des tags
 *  - registry: SharedTag[] (pour résoudre les couleurs)
 *  - max:      nombre de pills visibles avant le « +N » (défaut 2)
 *  - variant:  "list" | "grid"
 *  - justify:  classe d'alignement optionnelle (ex. "justify-center")
 */
export function TagPills({
  tags = [],
  registry = [],
  max = 2,
  variant = "list",
  justify,
}) {
  if (!tags || tags.length === 0) return null;

  const shown = tags.slice(0, max);
  const hidden = tags.slice(max);

  const pillCls =
    variant === "grid"
      ? "px-1 py-0 rounded text-[9px] gap-0.5"
      : "px-1.5 py-0.5 rounded-md text-[10px] gap-1";

  const Pill = ({ name }) => {
    const c = resolveTagColor(name, registry);
    return (
      <span
        className={cn(
          "inline-flex items-center font-medium max-w-full",
          pillCls,
        )}
        style={{ backgroundColor: `${c}1a`, color: c }}
      >
        <span
          className="h-1 w-1 rounded-full shrink-0"
          style={{ backgroundColor: c }}
        />
        <span className="truncate">{name}</span>
      </span>
    );
  };

  return (
    <div className={cn("flex items-center gap-1 min-w-0", justify)}>
      {shown.map((name) => (
        <Pill key={name} name={name} />
      ))}
      {hidden.length > 0 && (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex items-center justify-center font-medium bg-muted text-muted-foreground border border-border cursor-default shrink-0",
                  pillCls,
                )}
              >
                +{hidden.length}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="tooltip-light p-2 border border-border shadow-md"
            >
              <div className="flex flex-wrap gap-1 max-w-[220px]">
                {hidden.map((name) => (
                  <Pill key={name} name={name} />
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export function TagSelector({
  value = [],
  onAdd,
  onRemove,
  disabled = false,
  placeholder = "Ajouter un tag",
  size = "default",
  // Tags à ne jamais proposer (ex. déjà présents sur les documents ciblés)
  excludeNames = [],
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [colorOverride, setColorOverride] = React.useState(null);
  const inputRef = React.useRef(null);

  const { tags: registry } = useDocumentTags();
  const { createTag } = useCreateDocumentTag();

  const colorOf = React.useCallback(
    (name) => resolveTagColor(name, registry),
    [registry],
  );

  // Noms exclus (déjà posés sur le doc courant + exclusions explicites)
  const excluded = new Set([...value, ...excludeNames]);
  const selected = new Set(value);
  const trimmed = query.trim();

  const suggestions = registry
    .filter((t) => !excluded.has(t.name))
    .filter((t) =>
      trimmed ? t.name.toLowerCase().includes(trimmed.toLowerCase()) : true,
    );

  const exactExists = registry.some(
    (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const canCreate =
    trimmed.length > 0 && !exactExists && !excluded.has(trimmed);
  const newColor = colorOverride || fallbackColor(trimmed || "tag");

  const reset = () => {
    setQuery("");
    setColorOverride(null);
  };

  // Ajout d'un tag existant — optimiste. On garde la popup ouverte pour
  // enchaîner plusieurs ajouts (le tag posé disparaît de la liste).
  const handleAdd = (name) => {
    if (!name || selected.has(name)) return;
    onAdd?.(name);
    reset();
    inputRef.current?.focus();
  };

  // Création d'un nouveau tag avec sa couleur — optimiste
  const handleCreate = () => {
    const clean = trimmed;
    if (!clean || selected.has(clean)) return;
    const color = newColor;
    onAdd?.(clean); // affichage immédiat
    reset();
    // Enregistrement de la couleur au registre en arrière-plan
    createTag(clean, color).catch(() => {});
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      {/* Tags courants */}
      <div className="flex flex-wrap gap-1.5">
        {value.length > 0 ? (
          value.map((tag) => {
            const c = colorOf(tag);
            return (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full pl-2 pr-1 py-0.5 text-xs font-medium border"
                style={{
                  backgroundColor: `${c}14`,
                  color: c,
                  borderColor: `${c}33`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: c }}
                />
                {tag}
                <button
                  type="button"
                  onClick={() => onRemove?.(tag)}
                  className="inline-flex items-center justify-center rounded-full h-4 w-4 hover:bg-black/10 transition-colors"
                  disabled={disabled}
                  aria-label={`Retirer le tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })
        ) : (
          <span className="text-xs text-muted-foreground">Aucun tag</span>
        )}
      </div>

      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={size === "sm" ? "sm" : "default"}
            className={cn(
              "justify-start gap-1.5 border-dashed text-muted-foreground font-normal",
              size === "sm" && "h-8 text-sm",
            )}
            disabled={disabled}
          >
            <Plus className="h-3.5 w-3.5" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-0 overflow-hidden rounded-xl"
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          {/* Champ de recherche / création */}
          <div className="flex items-center gap-2 border-b px-3 py-2.5">
            <TagIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setColorOverride(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canCreate) handleCreate();
                  else if (suggestions[0]) handleAdd(suggestions[0].name);
                }
              }}
              placeholder="Rechercher ou créer…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Bloc création avec choix de couleur */}
          {canCreate && (
            <div className="border-b p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Nouveau tag
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${newColor}1a`, color: newColor }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: newColor }}
                  />
                  {trimmed}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {TAG_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorOverride(c)}
                    className="h-5 w-5 rounded-full flex items-center justify-center transition hover:scale-110"
                    style={{ backgroundColor: c }}
                    aria-label={`Couleur ${c}`}
                  >
                    {newColor === c && (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full h-8 gap-1.5"
                onClick={handleCreate}
              >
                <Plus className="h-3.5 w-3.5" />
                Créer « {trimmed} »
              </Button>
            </div>
          )}

          {/* Tags existants */}
          <div className="max-h-56 overflow-y-auto p-1.5">
            {suggestions.length > 0 ? (
              suggestions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleAdd(t.name)}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors text-left"
                >
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium max-w-full truncate"
                    style={{
                      backgroundColor: `${t.color}14`,
                      color: t.color,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="truncate">{t.name}</span>
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    {t.usageCount > 0 && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {t.usageCount}
                      </span>
                    )}
                    <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
              ))
            ) : !canCreate ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Aucun tag
              </p>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default TagSelector;
