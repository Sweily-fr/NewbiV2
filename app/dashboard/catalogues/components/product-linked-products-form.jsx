"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { ChevronDownIcon, Link2, LoaderCircle, Search, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { GET_PRODUCTS } from "@/src/graphql/queries/products";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Section « Produits liés » de la fiche produit du catalogue.
 *
 * value : [{ productId, quantity, product: { id, name, reference, unit } }]
 * onChange(nextValue)
 * excludeId : id du produit en cours d'édition (un produit ne peut pas se lier à lui-même)
 */
export default function ProductLinkedProductsForm({
  value = [],
  onChange,
  excludeId,
}) {
  const { workspaceId } = useRequiredWorkspace();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, loading } = useQuery(GET_PRODUCTS, {
    variables: {
      workspaceId,
      search: debouncedSearchTerm.trim() !== "" ? debouncedSearchTerm : undefined,
      limit: 20,
    },
    fetchPolicy: "cache-and-network",
    skip: !open || !workspaceId,
  });

  const linkedIds = new Set(value.map((link) => link.productId));
  const candidates = (data?.products?.products || []).filter(
    (product) => product.id !== excludeId && !linkedIds.has(product.id),
  );

  const handleAdd = (product) => {
    onChange([
      ...value,
      {
        productId: product.id,
        quantity: 1,
        product: {
          id: product.id,
          name: product.name,
          reference: product.reference,
          unit: product.unit,
        },
      },
    ]);
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setOpen(false);
  };

  const handleQuantityChange = (productId, rawValue) => {
    onChange(
      value.map((link) =>
        link.productId === productId ? { ...link, quantity: rawValue } : link,
      ),
    );
  };

  const handleRemove = (productId) => {
    onChange(value.filter((link) => link.productId !== productId));
  };

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchTerm("");
      setDebouncedSearchTerm("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="flex items-center gap-1.5 font-normal">
          <Link2 className="size-3.5 text-muted-foreground" />
          Produits liés
        </Label>
        <p className="text-xs text-muted-foreground">
          Ajoutés automatiquement comme articles dans vos factures, devis et
          bons de commande quand vous sélectionnez ce produit.
        </p>
      </div>

      {value.length > 0 && (
        <div className="rounded-lg border divide-y">
          {value.map((link) => (
            <div
              key={link.productId}
              className="flex items-center gap-3 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {link.product?.name || "Produit supprimé"}
                </div>
                {link.product?.reference && (
                  <div className="text-xs text-muted-foreground truncate">
                    Réf : {link.product.reference}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={link.quantity}
                  onChange={(e) =>
                    handleQuantityChange(link.productId, e.target.value)
                  }
                  aria-label={`Quantité de ${link.product?.name || "produit lié"}`}
                  className="w-20 text-right"
                />
                {link.product?.unit && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {link.product.unit}
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(link.productId)}
                aria-label="Retirer ce produit lié"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate text-muted-foreground">
              Ajouter un produit lié
            </span>
            <ChevronDownIcon className="size-3.5 text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 overflow-hidden rounded-xl w-[var(--radix-popover-trigger-width)]"
          align="start"
          side="bottom"
          sideOffset={4}
          avoidCollisions={false}
        >
          <div className="flex items-center gap-2.5 px-2.5 h-10 border-b border-[#e6e7ea] dark:border-[#232323]">
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <Input
              variant="ghost"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            {loading && candidates.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-4">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Recherche...
                </span>
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {debouncedSearchTerm
                  ? `Aucun produit trouvé pour "${debouncedSearchTerm}".`
                  : "Aucun autre produit disponible."}
              </div>
            ) : (
              candidates.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleAdd(product)}
                  className="flex w-full flex-col items-start gap-0.5 rounded-md p-2.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {product.unitPrice ? `${product.unitPrice}€` : ""}
                    </span>
                  </div>
                  {product.reference && (
                    <span className="text-xs text-muted-foreground">
                      Réf: {product.reference}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
