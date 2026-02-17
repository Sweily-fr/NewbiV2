"use client";

import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Filter, Users } from "lucide-react";
import { cn } from "@/src/lib/utils";

// Types de clients (en majuscules pour correspondre aux données)
const CLIENT_TYPE_LABELS = {
  COMPANY: "Entreprise",
  INDIVIDUAL: "Particulier",
};

export default function ClientFilters({
  selectedTypes = [],
  setSelectedTypes,
  table,
  className,
}) {
  const [open, setOpen] = useState(false);

  // Calculer le nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    return selectedTypes.length;
  }, [selectedTypes.length]);

  // Gérer le toggle d'un type
  const toggleType = (type) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];

    setSelectedTypes(newTypes);

    // Mettre à jour le filtre de la table si disponible
    if (table) {
      table
        .getColumn("type")
        ?.setFilterValue(newTypes.length ? newTypes : undefined);
    }
  };

  // Tout sélectionner / tout désélectionner les types
  const allTypesSelected =
    selectedTypes.length === Object.keys(CLIENT_TYPE_LABELS).length;

  const toggleAllTypes = () => {
    const newTypes = allTypesSelected ? [] : Object.keys(CLIENT_TYPE_LABELS);
    setSelectedTypes(newTypes);

    // Mettre à jour le filtre de la table si disponible
    if (table) {
      table
        .getColumn("type")
        ?.setFilterValue(newTypes.length ? newTypes : undefined);
    }
  };

  // Obtenir les colonnes cachables (seulement si table est disponible)
  const hideableColumns = useMemo(() => {
    if (!table) return [];
    return table
      .getAllColumns()
      .filter(
        (column) =>
          typeof column.accessorFn !== "undefined" && column.getCanHide()
      );
  }, [table]);

  // Calculer le nombre de colonnes visibles
  const visibleColumnsCount = hideableColumns.filter((column) =>
    column.getIsVisible()
  ).length;

  // Vérifier si toutes les colonnes sont visibles
  const allColumnsVisible =
    hideableColumns.length > 0 &&
    hideableColumns.every((column) => column.getIsVisible());

  // Traductions des colonnes
  const columnTranslations = {
    name: "Nom",
    email: "Email",
    phone: "Téléphone",
    type: "Type",
    address: "Adresse",
    siret: "SIRET",
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 font-normal", className)}
        >
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        {/* Effacer tous les filtres */}
        <DropdownMenuItem
          onClick={() => {
            setSelectedTypes([]);
            if (table) {
              table.getColumn("type")?.setFilterValue(undefined);
            }
          }}
          className="cursor-pointer"
        >
          Effacer tous les filtres
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Type Filter - Nested Dropdown */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="whitespace-nowrap">
            <Users className="h-4 w-4 mr-2" />
            Filtrer par type
            {selectedTypes.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {selectedTypes.length}
              </Badge>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[250px]">
            {/* Checkbox Tout sélectionner */}
            <div
              className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
              onClick={toggleAllTypes}
            >
              <Checkbox
                checked={allTypesSelected}
                className="mr-2 pointer-events-none"
              />
              <span>Tout sélectionner</span>
            </div>
            <DropdownMenuSeparator />
            {Object.entries(CLIENT_TYPE_LABELS).map(([value, label]) => (
              <div
                key={value}
                className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                onClick={() => toggleType(value)}
              >
                <Checkbox
                  checked={selectedTypes.includes(value)}
                  className="mr-2 pointer-events-none"
                />
                <Badge variant="outline">{label}</Badge>
              </div>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {table && hideableColumns.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="whitespace-nowrap">
                Colonnes visibles
                <Badge variant="secondary" className="ml-auto">
                  {visibleColumnsCount}
                </Badge>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[250px] max-h-[400px] overflow-y-auto">
                {/* Checkbox Tout sélectionner */}
                <div
                  className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                  onClick={() => {
                    table.toggleAllColumnsVisible(!allColumnsVisible);
                  }}
                >
                  <Checkbox
                    checked={allColumnsVisible}
                    className="mr-2 pointer-events-none"
                  />
                  <span>Tout sélectionner</span>
                </div>
                <DropdownMenuSeparator />

                {hideableColumns.map((column) => (
                  <div
                    key={column.id}
                    className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                    onClick={() => column.toggleVisibility()}
                  >
                    <Checkbox
                      checked={column.getIsVisible()}
                      className="mr-2 pointer-events-none"
                    />
                    <span>{columnTranslations[column.id] || column.id}</span>
                  </div>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
