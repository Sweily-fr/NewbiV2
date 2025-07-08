"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Package, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";

// Mock product data - In real app, this would come from GraphQL
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Développement site web",
    description: "Création d'un site web responsive avec React/Next.js",
    unitPrice: 2500.00,
    taxRate: 20,
    category: "Développement",
    unit: "forfait"
  },
  {
    id: "2",
    name: "Maintenance mensuelle",
    description: "Maintenance et mise à jour mensuelle du site web",
    unitPrice: 150.00,
    taxRate: 20,
    category: "Maintenance",
    unit: "mois"
  },
  {
    id: "3",
    name: "Formation utilisateur",
    description: "Formation à l'utilisation du CMS et des outils",
    unitPrice: 80.00,
    taxRate: 20,
    category: "Formation",
    unit: "heure"
  },
  {
    id: "4",
    name: "Hébergement annuel",
    description: "Hébergement web professionnel avec SSL",
    unitPrice: 120.00,
    taxRate: 20,
    category: "Hébergement",
    unit: "année"
  },
  {
    id: "5",
    name: "Consultation SEO",
    description: "Audit et optimisation SEO du site web",
    unitPrice: 300.00,
    taxRate: 20,
    category: "Consulting",
    unit: "forfait"
  }
];

export default function ProductAutocomplete({ 
  onSelect, 
  placeholder = "Rechercher un produit...",
  className 
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter products based on search query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredProducts([]);
      return;
    }

    setLoading(true);
    // Simulate API delay
    const timer = setTimeout(() => {
      const filtered = MOCK_PRODUCTS.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
  };

  const handleProductSelect = (product) => {
    const item = {
      description: product.name,
      quantity: 1,
      unitPrice: product.unitPrice,
      taxRate: product.taxRate,
      total: product.unitPrice,
      productId: product.id,
      unit: product.unit,
    };
    
    onSelect?.(item);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="pl-10"
        />
      </div>

      {isOpen && (
        <Card 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto shadow-lg"
        >
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Recherche...</span>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="py-2">
                {filteredProducts.map((product, index) => (
                  <div key={product.id}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 focus:bg-muted/50 focus:outline-none transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm truncate">
                              {product.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {product.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {product.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                              }).format(product.unitPrice)} / {product.unit}
                            </span>
                            <span>TVA {product.taxRate}%</span>
                          </div>
                        </div>
                      </div>
                    </button>
                    {index < filteredProducts.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-4 text-center">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Aucun produit trouvé pour "{query}"
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // In real app, this would open a product creation modal
                    console.log("Create new product:", query);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Créer ce produit
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for product search and management
export function useProductSearch() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(false);

  const searchProducts = async (query) => {
    setLoading(true);
    try {
      // In real app, this would be a GraphQL query
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const filtered = MOCK_PRODUCTS.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      );
      
      return filtered;
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    setLoading(true);
    try {
      // In real app, this would be a GraphQL mutation
      const newProduct = {
        id: Date.now().toString(),
        ...productData,
        taxRate: productData.taxRate || 20,
        unit: productData.unit || "unité",
      };
      
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } finally {
      setLoading(false);
    }
  };

  const getRecentProducts = () => {
    // Return most recently used products
    return products.slice(0, 5);
  };

  const getProductsByCategory = (category) => {
    return products.filter(product => product.category === category);
  };

  return {
    products,
    loading,
    searchProducts,
    createProduct,
    getRecentProducts,
    getProductsByCategory,
  };
}
