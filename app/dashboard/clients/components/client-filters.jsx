"use client";

import { useState } from "react";
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
import { ListFilterIcon, Users } from "lucide-react";
import { cn } from "@/src/lib/utils";

// Types de clients (en majuscules pour correspondre aux données)
const CLIENT_TYPE_LABELS = {
  COMPANY: "Entreprise",
  INDIVIDUAL: "Particulier",
};

export default function ClientFilters({
  selectedTypes = [],
  setSelectedTypes,
  columnVisibility = {},
  onColumnVisibilityChange,
  allColumns = [],
  customFieldNames = {},
  className,
}) {
  const [open, setOpen] = useState(false);

  // Calculer le nombre de filtres actifs
  const activeFiltersCount = selectedTypes.length;

  // Gérer le toggle d'un type
  const toggleType = (type) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];

    setSelectedTypes(newTypes);
  };

  // Tout sélectionner / tout désélectionner les types
  const allTypesSelected =
    selectedTypes.length === Object.keys(CLIENT_TYPE_LABELS).length;

  const toggleAllTypes = () => {
    const newTypes = allTypesSelected ? [] : Object.keys(CLIENT_TYPE_LABELS);
    setSelectedTypes(newTypes);
  };

  // Colonnes visibles (basé sur props)
  const visibleColumnsCount = allColumns.filter(
    (col) => columnVisibility[col.id] !== false
  ).length;

  const allColumnsVisible =
    allColumns.length > 0 &&
    allColumns.every((col) => columnVisibility[col.id] !== false);

  const toggleAllColumnsVisible = () => {
    if (!onColumnVisibilityChange) return;
    const newVisibility = {};
    for (const col of allColumns) {
      newVisibility[col.id] = !allColumnsVisible;
    }
    onColumnVisibilityChange(newVisibility);
  };

  const toggleColumnVisibility = (colId) => {
    if (!onColumnVisibilityChange) return;
    onColumnVisibilityChange((prev) => ({
      ...prev,
      [colId]: prev[colId] === false ? true : false,
    }));
  };

  // Traductions des colonnes
  const columnTranslations = {
    email: "Email",
    type: "Type",
    invoiceCount: "Factures",
    address: "Adresse",
    phone: "Téléphone",
    firstName: "Prénom",
    lastName: "Nom de famille",
    siret: "SIRET",
    vatNumber: "N° TVA",
    isInternational: "International",
    ...customFieldNames,
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={activeFiltersCount > 0 ? "primary" : "filter"}
          className={cn("cursor-pointer", className)}
        >
          <ListFilterIcon className="h-3.5 w-3.5" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0 text-[10px] font-medium">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {/* Effacer tous les filtres */}
        <DropdownMenuItem
          onClick={() => {
            setSelectedTypes([]);
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

        {allColumns.length > 0 && (
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
                  onClick={toggleAllColumnsVisible}
                >
                  <Checkbox
                    checked={allColumnsVisible}
                    className="mr-2 pointer-events-none"
                  />
                  <span>Tout sélectionner</span>
                </div>
                <DropdownMenuSeparator />

                {allColumns.map((col) => (
                  <div
                    key={col.id}
                    className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                    onClick={() => toggleColumnVisibility(col.id)}
                  >
                    <Checkbox
                      checked={columnVisibility[col.id] !== false}
                      className="mr-2 pointer-events-none"
                    />
                    <span>{columnTranslations[col.id] || col.label || col.id}</span>
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
