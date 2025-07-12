"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

// Composant de recherche de produits pour les devis
export default function ProductSearchCombobox({ 
  onSelect, 
  placeholder = "Rechercher un produit...", 
  disabled = false, 
  className = "" 
}) {
  const [searchValue, setSearchValue] = useState("");

  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleAddProduct = () => {
    if (searchValue.trim() && onSelect) {
      onSelect({
        description: searchValue,
        quantity: 1,
        unitPrice: 0,
        taxRate: 20,
        unit: 'unité'
      });
      setSearchValue("");
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleInputChange}
        disabled={disabled}
        className="flex-1"
      />
      <Button
        type="button"
        onClick={handleAddProduct}
        disabled={disabled || !searchValue.trim()}
        variant="outline"
      >
        Ajouter
      </Button>
    </div>
  );
}
