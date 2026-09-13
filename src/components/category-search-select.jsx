"use client";

import { useId, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/src/lib/utils";
import {
  EXPENSE_CATEGORY_GROUPS,
  INCOME_CATEGORY_GROUPS,
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
 */
export default function CategorySearchSelect({
  value,
  onValueChange,
  label,
  className,
  triggerClassName,
  placeholder = "Sélectionner une catégorie",
  type = "EXPENSE",
}) {
  const id = useId();
  const [open, setOpen] = useState(false);

  const groups =
    type === "INCOME" ? INCOME_CATEGORY_GROUPS : EXPENSE_CATEGORY_GROUPS;
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
      <Popover open={open} onOpenChange={setOpen}>
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
          className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
          align="start"
          sideOffset={4}
          style={{ maxHeight: "var(--radix-popper-available-height, 300px)" }}
        >
          <Command>
            <CommandInput placeholder="Rechercher une catégorie..." />
            <CommandList
              className="max-h-[250px] overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
            >
              <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.heading} heading={group.heading}>
                  {group.options.map((category) => (
                    <CommandItem
                      key={category.value}
                      value={category.value}
                      keywords={[category.label, group.heading]}
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
