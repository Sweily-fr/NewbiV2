"use client";

import { useState, useId } from "react";
import { ChevronDownIcon } from "lucide-react";
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '@/src/graphql/productQueries';
import { Button } from "@/src/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { cn } from "@/src/lib/utils";

// Composant de recherche de produits basé sur Origin UI
export default function ProductSearchCombobox({ onSelect, placeholder = "Rechercher un produit...", disabled = false }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Requête GraphQL pour récupérer les produits
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: {
      search: searchTerm || undefined,
      limit: 20
    },
    fetchPolicy: 'cache-and-network'
  });
  
  // Transformation des données pour le composant
  const products = data?.products?.products?.map(product => ({
    value: product.id,
    label: product.name,
    description: product.description,
    price: product.unitPrice,
    vatRate: product.vatRate,
    unit: product.unit,
    category: product.category,
    reference: product.reference
  })) || [];

  const handleSelect = (currentValue) => {
    const selectedProduct = products.find(p => p.value === currentValue);
    if (selectedProduct && onSelect) {
      onSelect({
        description: selectedProduct.label,
        quantity: 1,
        unitPrice: selectedProduct.price,
        taxRate: selectedProduct.vatRate || 20,
        productId: selectedProduct.value,
        unit: selectedProduct.unit || 'unité'
      });
    }
    setValue("");
    setOpen(false);
  };

  // Fonction pour gérer la recherche
  const handleSearchChange = (search) => {
    setSearchTerm(search);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-disabled={disabled}
          className={cn(
            "flex items-center justify-between px-3 h-10 rounded-md border border-input bg-background text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            "w-full hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => !disabled && setOpen(true)}
        >
          <span className={cn("truncate text-left", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronDownIcon
            size={16}
            className="text-muted-foreground/80 shrink-0"
            aria-hidden="true"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput 
            placeholder="Rechercher un produit..." 
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-muted-foreground">Recherche en cours...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600">
                <span className="text-sm">Erreur lors du chargement des produits</span>
              </div>
            ) : products.length === 0 ? (
              <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
            ) : (
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.value}
                    value={product.value}
                    onSelect={handleSelect}
                    className="flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{product.label}</span>
                      {product.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </span>
                      )}
                      {product.category && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-1">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-sm font-medium">{product.price}€</span>
                      <span className="text-xs text-muted-foreground">/{product.unit}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
