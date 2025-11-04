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
import { Filter, Tag } from "lucide-react";
import { cn } from "@/src/lib/utils";

export default function ProductFilters({
  selectedCategories = [],
  setSelectedCategories,
  uniqueCategories = [],
  table,
  className,
}) {
  const [open, setOpen] = useState(false);

  // Calculer le nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    return selectedCategories.length;
  }, [selectedCategories.length]);

  // Gérer le toggle d'une catégorie
  const toggleCategory = (category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newCategories);
    
    // Mettre à jour le filtre de la table
    table
      .getColumn("category")
      ?.setFilterValue(newCategories.length ? newCategories : undefined);
  };

  // Tout sélectionner / tout désélectionner les catégories
  const allCategoriesSelected = selectedCategories.length === uniqueCategories.length && uniqueCategories.length > 0;
  
  const toggleAllCategories = () => {
    const newCategories = allCategoriesSelected ? [] : [...uniqueCategories];
    setSelectedCategories(newCategories);
    
    // Mettre à jour le filtre de la table
    table
      .getColumn("category")
      ?.setFilterValue(newCategories.length ? newCategories : undefined);
  };

  // Obtenir les colonnes cachables
  const hideableColumns = useMemo(() => {
    return table
      .getAllColumns()
      .filter(
        (column) =>
          typeof column.accessorFn !== "undefined" &&
          column.getCanHide()
      );
  }, [table]);

  // Calculer le nombre de colonnes visibles
  const visibleColumnsCount = hideableColumns.filter((column) => 
    column.getIsVisible()
  ).length;

  // Vérifier si toutes les colonnes sont visibles
  const allColumnsVisible = hideableColumns.length > 0 && 
    hideableColumns.every((column) => column.getIsVisible());

  // Traductions des colonnes
  const columnTranslations = {
    name: "Nom",
    reference: "Référence",
    unitPrice: "Prix unitaire",
    vatRate: "TVA",
    unit: "Unité",
    category: "Catégorie",
    description: "Description",
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 font-normal", className)}
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
            setSelectedCategories([]);
            table.getColumn("category")?.setFilterValue(undefined);
          }}
          className="cursor-pointer"
        >
          Effacer tous les filtres
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Category Filter - Nested Dropdown */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="whitespace-nowrap">
            <Tag className="h-4 w-4 mr-2" />
            Filtrer par catégorie
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {selectedCategories.length}
              </Badge>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[250px] max-h-[400px] overflow-y-auto">
            {uniqueCategories.length > 0 ? (
              <>
                {/* Checkbox Tout sélectionner */}
                <div 
                  className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                  onClick={toggleAllCategories}
                >
                  <Checkbox
                    checked={allCategoriesSelected}
                    className="mr-2 pointer-events-none"
                  />
                  <span>Tout sélectionner</span>
                </div>
                <DropdownMenuSeparator />
                {uniqueCategories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                    onClick={() => toggleCategory(category)}
                  >
                    <Checkbox
                      checked={selectedCategories.includes(category)}
                      className="mr-2 pointer-events-none"
                    />
                    <span>{category}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                Aucune catégorie trouvée
              </div>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Column Visibility - Nested Dropdown */}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
