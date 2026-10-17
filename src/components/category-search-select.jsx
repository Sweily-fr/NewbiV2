"use client";

import { useId, useMemo, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/src/lib/utils";
import {
  EXPENSE_CATEGORY_GROUPS,
  INCOME_CATEGORY_GROUPS,
  EXPENSE_BROAD_CATEGORY_CODES,
  getCategoryConfig,
} from "@/lib/category-icons-config";
import { Button } from "@/src/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

/**
 * Sélecteur de catégorie commun aux pages Transactions, Factures d'achat et
 * Prévision : mêmes sous-catégories fines (lib/category-icons-config.js),
 * regroupées et filtrables. `value` peut aussi être une catégorie large
 * héritée (ex. "SERVICES") : son libellé est résolu par getCategoryConfig,
 * la même source que la colonne Catégorie des tableaux.
 *
 * `type="ALL"` propose les sorties puis les entrées (filtre de la page
 * Transactions, qui mélange les deux sens). `includeBroadCategories` ajoute un
 * groupe « Catégories larges » (enum ExpenseCategory) pour retrouver les
 * transactions anciennes ou bancaires qui n'ont qu'une catégorie large.
 */
// Normalise pour une recherche insensible à la casse et aux accents
// (« telephone » trouve « Téléphone »).
const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/**
 * Score de recherche : correspondance par sous-chaîne contiguë uniquement (le
 * filtre fuzzy par défaut de cmdk faisait remonter des dizaines de catégories
 * sans rapport, ex. « tel » → Hôtel, Électricité, Transport...). Un libellé qui
 * commence par la saisie passe devant un libellé qui la contient seulement.
 */
export const filterCategory = (value, search, keywords = []) => {
  const query = normalize(search);
  if (!query) return 1;
  const candidates = [value, ...keywords].map(normalize);
  if (candidates.some((c) => c.startsWith(query))) return 1;
  if (candidates.some((c) => c.includes(query))) return 0.5;
  return 0;
};

/**
 * Groupes affichés pour une saisie : catégories triées par score, groupes
 * triés par leur meilleur score (à score égal, l'ordre du référentiel). Fait
 * ici et non par cmdk, qui trie dans chaque groupe mais jamais les groupes
 * entre eux (il les cherche par leur id interne dans data-value, qui porte le
 * titre) : le premier élément, surligné et choisi par Entrée, restait celui du
 * premier groupe (« tel » → Hôtel au lieu de Téléphone).
 */
export const searchCategoryGroups = (groups, search) => {
  if (!normalize(search)) return groups;
  return groups
    .map((group) => {
      const scored = group.options
        .map((option) => ({
          option,
          score: filterCategory(option.value, search, [option.label]),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);
      return {
        ...group,
        options: scored.map((entry) => entry.option),
        score: scored[0]?.score ?? 0,
      };
    })
    .filter((group) => group.score > 0)
    .sort((a, b) => b.score - a.score);
};

export default function CategorySearchSelect({
  value,
  onValueChange,
  label,
  className,
  triggerClassName,
  placeholder = "Sélectionner une catégorie",
  type = "EXPENSE",
  includeBroadCategories = false,
  contentClassName,
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const base =
      type === "ALL"
        ? [...EXPENSE_CATEGORY_GROUPS, ...INCOME_CATEGORY_GROUPS]
        : type === "INCOME"
          ? INCOME_CATEGORY_GROUPS
          : EXPENSE_CATEGORY_GROUPS;
    if (!includeBroadCategories) return base;
    return [
      ...base,
      {
        heading: "Catégories larges",
        options: EXPENSE_BROAD_CATEGORY_CODES.map((code) => ({
          value: code,
          label: getCategoryConfig(code).label,
        })),
      },
    ];
  }, [type, includeBroadCategories]);
  const visibleGroups = useMemo(
    () => searchCategoryGroups(groups, search),
    [groups, search],
  );
  const otherGroups =
    type === "INCOME" ? EXPENSE_CATEGORY_GROUPS : INCOME_CATEGORY_GROUPS;

  const findLabel = (list) =>
    list.flatMap((g) => g.options).find((c) => c.value === value)?.label;
  const resolvedLabel = value
    ? findLabel(groups) ||
      findLabel(otherGroups) ||
      getCategoryConfig(value).label
    : null;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label
          htmlFor={id}
          className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide"
        >
          {label}
        </Label>
      )}
      <Popover
        open={open}
        onOpenChange={(next) => {
          // Recherche vide à chaque ouverture (pas à la fermeture : la liste se
          // redéplierait pendant l'animation de sortie)
          if (next) setSearch("");
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-56 justify-between border-input bg-background px-3 font-normal outline-offset-0 outline-none hover:bg-background focus-visible:outline-[3px]",
              triggerClassName,
            )}
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {resolvedLabel || placeholder}
            </span>
            <ChevronDownIcon
              size={16}
              className="shrink-0 text-muted-foreground/80"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0",
            contentClassName,
          )}
          align="start"
          sideOffset={4}
          style={{ maxHeight: "var(--radix-popper-available-height, 300px)" }}
        >
          {/* Filtre et tri par searchCategoryGroups : cmdk garde l'ordre rendu
              et surligne le premier élément à chaque saisie */}
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher une catégorie..."
              value={search}
              onValueChange={setSearch}
            />
            {/* Molette et doigt : la liste défile même sous le verrou de
                défilement d'un Dialog ou d'un tiroir parent */}
            <CommandList
              className="max-h-[250px] overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
              {visibleGroups.map((group) => (
                <CommandGroup key={group.heading} heading={group.heading}>
                  {group.options.map((category) => (
                    <CommandItem
                      key={category.value}
                      value={category.value}
                      onSelect={(currentValue) => {
                        onValueChange(
                          currentValue === value ? "" : currentValue,
                        );
                        setOpen(false);
                      }}
                    >
                      {category.label}
                      {value === category.value && (
                        <CheckIcon size={16} className="ml-auto" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
