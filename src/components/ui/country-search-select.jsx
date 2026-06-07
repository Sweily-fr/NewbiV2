"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { cn } from "@/src/lib/utils";
import { COUNTRIES, findCountry } from "@/src/lib/countries";

/**
 * Composant select-search pour choisir un pays.
 *
 * - Affiche le drapeau emoji + nom français du pays sélectionné.
 * - Dropdown listant tous les pays (ISO-3166), avec recherche par nom OU
 *   par code à 2 lettres.
 * - Accepte en `value` soit un code ISO ("FR") soit un nom ("France"), ce
 *   qui permet une migration progressive depuis un champ texte libre.
 * - `onChange(name)` est appelé avec le NOM français du pays sélectionné
 *   (compatible avec les schémas qui stockent le nom en base).
 */
export function CountrySearchSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Sélectionner un pays",
  className,
  id,
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => findCountry(value), [value]);

  return (
    <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          {selected ? (
            <span className="inline-flex items-center gap-2 truncate">
              <span className="text-base leading-none">{selected.flag}</span>
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)] overflow-hidden"
        align="start"
        sideOffset={4}
        // Empêche le Dialog parent de "capter" l'événement wheel et de
        // bloquer le scroll de la liste de pays.
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command
          filter={(value, search) => {
            // value est le `value` du CommandItem (on y met `${name} ${code}`)
            // search est ce que l'utilisateur tape
            if (!search) return 1;
            const v = value.toLowerCase();
            const s = search.toLowerCase().trim();
            return v.includes(s) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Rechercher un pays..." />
          <CommandList className="max-h-72 overflow-y-auto overscroll-contain">
            <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => {
                const isSelected = selected?.code === country.code;
                return (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.code}`}
                    onSelect={() => {
                      onChange?.(country.name);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-base leading-none">
                      {country.flag}
                    </span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
