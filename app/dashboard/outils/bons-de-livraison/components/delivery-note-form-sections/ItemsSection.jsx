"use client";

import { useState, useEffect, useId } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@apollo/client";
import { ChevronDownIcon, Plus, Trash2, Package } from "lucide-react";
import { GET_PRODUCTS } from "@/src/graphql/queries/products";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { TextareaNew } from "@/src/components/ui/textarea-new";
import { QuantityInput } from "@/src/components/ui/quantity-input";
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

const LABEL_CLASS =
  "text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55";

/**
 * Recherche dans le catalogue (même requête que les devis) : on ne reprend
 * que la désignation, la référence et l'unité. Aucun prix n'est affiché ni
 * copié : le tarif sera récupéré du catalogue si une facture est générée.
 */
function ProductSearchCombobox({ onSelect, disabled = false, className = "" }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { workspaceId } = useRequiredWorkspace();
  const { data, loading } = useQuery(GET_PRODUCTS, {
    variables: {
      workspaceId,
      search:
        debouncedSearchTerm && debouncedSearchTerm.trim() !== ""
          ? debouncedSearchTerm
          : undefined,
      limit: 20,
    },
    fetchPolicy: "cache-and-network",
    skip: !open || !workspaceId,
  });

  const products =
    data?.products?.products?.map((product) => ({
      value: product.id,
      label: product.name,
      description: product.description,
      unit: product.unit,
      reference: product.reference,
    })) || [];

  const handleSelect = (value) => {
    const product = products.find((p) => p.value === value);
    if (product && onSelect) {
      onSelect({
        description: product.label,
        details: "",
        reference: product.reference || "",
        productId: product.value,
        quantity: 1,
        unit: product.unit || "unité(s)",
      });
    }
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearchTerm("");
          setDebouncedSearchTerm("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between text-muted-foreground",
            className,
          )}
        >
          Rechercher un produit du catalogue...
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)] bg-popover text-popover-foreground"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading && <CommandEmpty>Recherche en cours...</CommandEmpty>}
            {!loading && !debouncedSearchTerm && (
              <CommandEmpty>Tapez pour rechercher un produit...</CommandEmpty>
            )}
            {!loading && debouncedSearchTerm && products.length === 0 && (
              <CommandEmpty>
                Aucun produit trouvé pour "{debouncedSearchTerm}".
              </CommandEmpty>
            )}
            {!loading && products.length > 0 && (
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.value}
                    value={product.value}
                    onSelect={() => handleSelect(product.value)}
                    className="flex flex-col items-start gap-1 p-3"
                  >
                    <span className="font-normal">{product.label}</span>
                    {product.reference && (
                      <span className="text-xs text-muted-foreground">
                        Réf: {product.reference}
                      </span>
                    )}
                    {product.description && (
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {product.description}
                      </span>
                    )}
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

/**
 * Lignes du bon de livraison : référence, désignation, quantité, unité.
 * Aucune colonne prix / TVA / remise.
 */
export default function ItemsSection({ canEdit, validationErrors = {} }) {
  const { watch, setValue, getValues } = useFormContext();
  const items = watch("items") || [];
  const itemErrors = validationErrors?.items?.details || [];
  const [openDetails, setOpenDetails] = useState({});

  const fieldHasError = (index, field) =>
    itemErrors.some((e) => e.index === index && e.fields?.includes(field));

  const addItem = (template = null) => {
    const current = getValues("items") || [];
    setValue(
      "items",
      [
        ...current,
        template || {
          description: "",
          details: "",
          reference: "",
          productId: "",
          quantity: 1,
          unit: "unité(s)",
        },
      ],
      { shouldDirty: true },
    );
  };

  const updateItem = (index, field, value) => {
    const current = getValues("items") || [];
    const next = [...current];
    next[index] = { ...next[index], [field]: value };
    setValue("items", next, { shouldDirty: true });
  };

  const removeItem = (index) => {
    const current = getValues("items") || [];
    setValue(
      "items",
      current.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  return (
    <div className="space-y-4" data-error-field="items">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          Articles livrés
        </h3>
        <span className="text-xs text-muted-foreground">
          Quantités uniquement, sans prix
        </span>
      </div>

      <ProductSearchCombobox onSelect={addItem} disabled={!canEdit} />

      {validationErrors?.items?.message && (
        <p className="text-xs text-destructive">
          {validationErrors.items.message}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun article. Recherchez un produit du catalogue ou ajoutez une
          ligne libre.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border bg-background p-3 md:p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <span className="mt-2 text-xs text-muted-foreground w-5 shrink-0">
                  {index + 1}.
                </span>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-3">
                    <div className="space-y-1.5">
                      <Label className={LABEL_CLASS}>
                        Désignation <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name={`items.${index}.description`}
                        value={item.description || ""}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        placeholder="Nom du produit"
                        disabled={!canEdit}
                        maxLength={2000}
                        className={cn(
                          fieldHasError(index, "description") &&
                            "border-destructive",
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={LABEL_CLASS}>Référence</Label>
                      <Input
                        name={`items.${index}.reference`}
                        value={item.reference || ""}
                        onChange={(e) =>
                          updateItem(index, "reference", e.target.value)
                        }
                        placeholder="Réf."
                        disabled={!canEdit}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className={LABEL_CLASS}>
                        Quantité <span className="text-red-500">*</span>
                      </Label>
                      <QuantityInput
                        name={`items.${index}.quantity`}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", e.target.value)
                        }
                        min={0.01}
                        step={1}
                        disabled={!canEdit}
                        className={cn(
                          fieldHasError(index, "quantity") &&
                            "border-destructive",
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={LABEL_CLASS}>Unité</Label>
                      <Input
                        name={`items.${index}.unit`}
                        value={item.unit || ""}
                        onChange={(e) =>
                          updateItem(index, "unit", e.target.value)
                        }
                        placeholder="unité(s), carton, palette…"
                        disabled={!canEdit}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  {openDetails[index] || item.details ? (
                    <div className="space-y-1.5">
                      <Label className={LABEL_CLASS}>Détails</Label>
                      <TextareaNew
                        name={`items.${index}.details`}
                        value={item.details || ""}
                        onChange={(e) =>
                          updateItem(index, "details", e.target.value)
                        }
                        placeholder="Précisions (lot, couleur, numéro de série…)"
                        rows={2}
                        disabled={!canEdit}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setOpenDetails((prev) => ({ ...prev, [index]: true }))
                      }
                      disabled={!canEdit}
                    >
                      + Ajouter des détails
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                  onClick={() => removeItem(index)}
                  disabled={!canEdit}
                  title="Supprimer la ligne"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() => addItem()}
        disabled={!canEdit}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une ligne libre
      </Button>
    </div>
  );
}
