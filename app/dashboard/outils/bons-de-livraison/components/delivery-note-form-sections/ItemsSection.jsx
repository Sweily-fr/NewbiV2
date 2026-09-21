"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { useQuery } from "@apollo/client";
import { ChevronDownIcon, Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GET_PRODUCTS } from "@/src/graphql/queries/products";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { TextareaNew } from "@/src/components/ui/textarea-new";
import { QuantityInput } from "@/src/components/ui/quantity-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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

// Mêmes unités que les devis / factures / bons de commande (une valeur hors
// liste, ex. produit du catalogue, est affichée via une option de secours).
const UNIT_OPTIONS = [
  { value: "none", label: "Aucune unité" },
  { value: "unité", label: "Unité" },
  { value: "pièce", label: "Pièce" },
  { value: "carton", label: "Carton" },
  { value: "palette", label: "Palette" },
  { value: "lot", label: "Lot" },
  { value: "kg", label: "Kilogramme" },
  { value: "m", label: "Mètre" },
  { value: "m²", label: "Mètre carré" },
  { value: "m³", label: "Mètre cube" },
  { value: "litre", label: "Litre" },
  { value: "ensemble", label: "Ensemble" },
];

const formatQuantity = (value) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(
    parseFloat(value) || 0,
  );

/**
 * Recherche dans le catalogue (même combobox que les devis) : on ne reprend
 * que la désignation, la référence et l'unité. Aucun prix n'est affiché ni
 * copié : le tarif sera récupéré du catalogue si une facture est générée.
 */
function ProductSearchCombobox({
  onSelect,
  placeholder = "Rechercher un produit...",
  disabled = false,
  className = "",
}) {
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
        unit: product.unit || "unité",
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
          {placeholder}
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)] sm:w-[calc(var(--radix-popover-trigger-width)+12rem)] bg-popover text-popover-foreground"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
        sticky="always"
      >
        <Command
          shouldFilter={false}
          className="bg-popover text-popover-foreground"
        >
          <CommandInput
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="bg-transparent"
          />
          <CommandList className="bg-popover">
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
                    {product.description && (
                      <span className="text-sm text-muted-foreground">
                        {product.description}
                      </span>
                    )}
                    {product.reference && (
                      <span className="text-xs text-muted-foreground">
                        Réf: {product.reference}
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

function SortableItem({ id, disabled, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ listeners, attributes, isDragging })}
    </div>
  );
}

/**
 * Lignes du bon de livraison, même présentation que la section « Articles et
 * produits » des devis (accordéon, tri par glisser-déposer), mais sans aucun
 * champ prix / TVA / remise : désignation, détails, quantité, unité, référence.
 */
export default function ItemsSection({ canEdit, validationErrors = {} }) {
  const {
    watch,
    register,
    formState: { errors },
  } = useFormContext();
  const {
    fields: items,
    append,
    remove,
    move,
  } = useFieldArray({ name: "items" });
  const itemErrors = validationErrors?.items?.details || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Accordéon contrôlé : replié pendant un glisser-déposer, rouvert ensuite
  const [openItems, setOpenItems] = useState([]);
  const wasOpenRef = useRef(new Map());

  const handleHandlePointerDown = (itemId) => {
    if (openItems.includes(itemId)) {
      wasOpenRef.current.set(itemId, true);
      setOpenItems((prev) => prev.filter((v) => v !== itemId));
    } else {
      wasOpenRef.current.delete(itemId);
    }
  };

  const handleHandleClick = (itemId) => {
    if (wasOpenRef.current.get(itemId)) {
      setOpenItems((prev) =>
        prev.includes(itemId) ? prev : [...prev, itemId],
      );
      wasOpenRef.current.delete(itemId);
    }
  };

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex);
    }
    if (wasOpenRef.current.get(active.id)) {
      setOpenItems((prev) =>
        prev.includes(active.id) ? prev : [...prev, active.id],
      );
      wasOpenRef.current.delete(active.id);
    }
  };

  // Ouvre automatiquement les articles en erreur (le contenu replié est
  // démonté, l'erreur resterait invisible)
  const itemErrorsKey = JSON.stringify(
    itemErrors.map((error) => [error.index, ...(error.fields || [])]),
  );
  useEffect(() => {
    if (itemErrors.length === 0) return;
    const closedErrors = itemErrors.filter((error) => {
      const id = items[error.index]?.id;
      return id && !openItems.includes(id);
    });
    if (closedErrors.length === 0) return;
    setOpenItems((prev) => [
      ...prev,
      ...closedErrors
        .map((error) => items[error.index].id)
        .filter((id) => !prev.includes(id)),
    ]);
    const { index, fields: errorFields } = closedErrors[0];
    const field = errorFields?.[0] || "description";
    const timer = setTimeout(() => {
      const el =
        document.querySelector(`[name="items.${index}.${field}"]`) ||
        document.querySelector(`[data-item-index="${index}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus?.({ preventScroll: true });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemErrorsKey]);

  const watchedItems = watch("items") || [];

  const hasFieldError = (itemIndex, fieldName) =>
    itemErrors.some(
      (error) => error.index === itemIndex && error.fields?.includes(fieldName),
    );

  const addItem = (productData = {}) => {
    append({
      description: productData.description || "",
      details: productData.details || "",
      reference: productData.reference || "",
      productId: productData.productId || "",
      quantity: productData.quantity || 1,
      unit: productData.unit !== undefined ? productData.unit : "unité",
    });
  };

  return (
    <Card className="shadow-none border-none bg-transparent mb-0 p-0">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-medium text-lg">
          Articles et produits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        <p className="text-sm text-muted-foreground">
          Un bon de livraison liste les produits et les quantités remises :
          aucun prix ni TVA n'y figure.
        </p>

        {/* Recherche catalogue + ajout d'un article */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <div className="flex-1 min-w-0 order-1 md:order-1">
            <div className="h-full">
              <ProductSearchCombobox
                onSelect={addItem}
                placeholder="Rechercher un produit..."
                disabled={!canEdit}
                className="h-full"
              />
            </div>
          </div>
          <div className="flex-shrink-0 order-2 md:order-2 md:w-auto">
            <Button
              onClick={() => addItem()}
              disabled={!canEdit}
              className="gap-2 w-full h-full"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              <span className="md:inline">Ajouter un article</span>
            </Button>
          </div>
        </div>

        {validationErrors?.items?.message && items.length === 0 && (
          <p className="text-xs text-destructive" data-error-field="items">
            {validationErrors.items.message}
          </p>
        )}

        {/* Liste des articles : accordéon + glisser-déposer */}
        {items.length > 0 && (
          <Accordion
            type="multiple"
            value={openItems}
            onValueChange={setOpenItems}
            className="w-full space-y-3 mb-6"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={items.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item, index) => {
                  const currentItem = watchedItems[index] || item;
                  const quantity = currentItem.quantity || 1;
                  const unit = currentItem.unit || "";
                  const description =
                    currentItem.description || `Article ${index + 1}`;

                  return (
                    <SortableItem
                      key={item.id}
                      id={item.id}
                      disabled={!canEdit}
                    >
                      {({ listeners, attributes }) => (
                        <AccordionItem
                          value={item.id}
                          data-item-index={index}
                          className="rounded-xl px-4 py-1 overflow-visible border last:border-b-1 bg-[#F5F5F5] dark:bg-neutral-900"
                        >
                          <AccordionTrigger className="w-full justify-start gap-3 text-[15px] leading-6 hover:no-underline focus-visible:ring-0 py-3 [&[data-state=open]>svg]:rotate-180">
                            <div className="flex items-center justify-between w-full gap-3">
                              <div className="flex-1 text-left min-w-0 overflow-hidden">
                                <div className="flex items-center gap-2">
                                  {items.length > 1 && (
                                    <span
                                      {...attributes}
                                      {...(canEdit ? listeners : {})}
                                      onPointerDown={(e) => {
                                        if (!canEdit) return;
                                        handleHandlePointerDown(item.id);
                                        listeners?.onPointerDown?.(e);
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleHandleClick(item.id);
                                      }}
                                      role="button"
                                      aria-label="Réorganiser cet article"
                                      tabIndex={canEdit ? 0 : -1}
                                      className={`inline-flex items-center shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors ${
                                        !canEdit
                                          ? "opacity-30 cursor-not-allowed"
                                          : ""
                                      }`}
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </span>
                                  )}
                                  <div className="font-normal break-all [overflow-wrap:anywhere]">
                                    {description}
                                  </div>
                                </div>
                                <div className="text-sm mt-1 font-normal text-muted-foreground">
                                  {formatQuantity(quantity)}
                                  {unit ? ` ${unit}` : ""}
                                  {currentItem.reference
                                    ? ` • Réf. ${currentItem.reference}`
                                    : ""}
                                </div>
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canEdit) remove(index);
                                }}
                                className={`h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors ${!canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.stopPropagation();
                                    if (canEdit) remove(index);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-6 pt-2 px-2 overflow-visible [&_input]:bg-background [&_textarea]:bg-background [&_[role=combobox]]:bg-background">
                            <div className="space-y-4 pt-2">
                              {/* Nom */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`item-description-${index}`}
                                    className="text-sm font-normal"
                                  >
                                    Nom
                                  </Label>
                                  <span
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Input
                                    id={`item-description-${index}`}
                                    {...register(`items.${index}.description`, {
                                      required: "La description est requise",
                                      minLength: {
                                        value: 2,
                                        message:
                                          "La description doit contenir au moins 2 caractères",
                                      },
                                      maxLength: {
                                        value: 2000,
                                        message:
                                          "La description ne doit pas dépasser 2000 caractères",
                                      },
                                    })}
                                    placeholder="Décrivez le produit livré"
                                    disabled={!canEdit}
                                    className={`w-full ${
                                      errors?.items?.[index]?.description ||
                                      hasFieldError(index, "description")
                                        ? "border-destructive"
                                        : ""
                                    }`}
                                  />
                                  {(errors?.items?.[index]?.description ||
                                    hasFieldError(index, "description")) && (
                                    <p className="text-xs text-destructive">
                                      {errors?.items?.[index]?.description
                                        ?.message ||
                                        "La description est requise"}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Détails supplémentaires */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`item-details-${index}`}
                                    className="text-sm font-normal"
                                  >
                                    Détails supplémentaires (optionnel)
                                  </Label>
                                  <span
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </div>
                                <TextareaNew
                                  id={`item-details-${index}`}
                                  {...register(`items.${index}.details`, {
                                    maxLength: {
                                      value: 500,
                                      message:
                                        "Les détails ne doivent pas dépasser 500 caractères",
                                    },
                                  })}
                                  placeholder="Lot, couleur, numéro de série, conditionnement..."
                                  disabled={!canEdit}
                                  rows={2}
                                  className={`text-sm w-full min-h-0 ${
                                    errors?.items?.[index]?.details
                                      ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
                                      : ""
                                  }`}
                                />
                                {errors?.items?.[index]?.details && (
                                  <p className="text-xs text-red-500">
                                    {errors.items[index].details.message}
                                  </p>
                                )}
                              </div>

                              {/* Quantité et Unité */}
                              <div className="grid grid-cols-2 gap-2 md:gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Label
                                      htmlFor={`item-quantity-${index}`}
                                      className="text-sm font-normal"
                                    >
                                      Quantité
                                    </Label>
                                    <span
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <QuantityInput
                                      id={`item-quantity-${index}`}
                                      {...register(`items.${index}.quantity`, {
                                        valueAsNumber: true,
                                        required: "La quantité est requise",
                                        min: {
                                          value: 0.01,
                                          message:
                                            "La quantité doit être supérieure à 0",
                                        },
                                      })}
                                      disabled={!canEdit}
                                      className={
                                        errors?.items?.[index]?.quantity ||
                                        hasFieldError(index, "quantity")
                                          ? "border-destructive"
                                          : ""
                                      }
                                    />
                                    {(errors?.items?.[index]?.quantity ||
                                      hasFieldError(index, "quantity")) && (
                                      <p className="text-xs text-destructive">
                                        {errors?.items?.[index]?.quantity
                                          ?.message ||
                                          "La quantité est requise"}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm font-normal">
                                      Unité
                                    </Label>
                                    <span
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                    />
                                  </div>
                                  <Controller
                                    name={`items.${index}.unit`}
                                    defaultValue="none"
                                    render={({ field }) => {
                                      const currentUnit = field.value || "none";
                                      const isCustomUnit = !UNIT_OPTIONS.some(
                                        (option) =>
                                          option.value === currentUnit,
                                      );
                                      return (
                                        <Select
                                          value={currentUnit}
                                          onValueChange={(value) =>
                                            field.onChange(
                                              value === "none" ? "" : value,
                                            )
                                          }
                                          disabled={!canEdit}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Aucune unité" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {isCustomUnit && (
                                              <SelectItem value={currentUnit}>
                                                {currentUnit}
                                              </SelectItem>
                                            )}
                                            {UNIT_OPTIONS.map((option) => (
                                              <SelectItem
                                                key={option.value}
                                                value={option.value}
                                              >
                                                {option.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      );
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Référence produit */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`item-reference-${index}`}
                                    className="text-sm font-normal"
                                  >
                                    Référence (optionnel)
                                  </Label>
                                  <span
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </div>
                                <Input
                                  id={`item-reference-${index}`}
                                  {...register(`items.${index}.reference`, {
                                    maxLength: {
                                      value: 100,
                                      message:
                                        "La référence ne doit pas dépasser 100 caractères",
                                    },
                                  })}
                                  placeholder="Référence produit imprimée sur le bon"
                                  disabled={!canEdit}
                                  className="w-full"
                                />
                                {errors?.items?.[index]?.reference && (
                                  <p className="text-xs text-red-500">
                                    {errors.items[index].reference.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </SortableItem>
                  );
                })}
              </SortableContext>
            </DndContext>
          </Accordion>
        )}

        {/* Bouton "Ajouter un article" en bas (style lien) */}
        {items.length > 0 && (
          <div className="pt-2">
            <Button
              variant="link"
              onClick={() => addItem()}
              disabled={!canEdit}
              className="p-0 h-auto justify-start no-underline hover:no-underline"
            >
              <span className="inline-flex items-center gap-1 border-b border-current pb-0.5">
                <Plus className="h-4 w-4" />
                Ajouter un article
              </span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
