"use client";

import { useRef, useState } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Package, Plus, Trash2, Percent, GripVertical } from "lucide-react";
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { VatRateSelect } from "@/src/components/vat-rate-select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { CurrencyInput } from "@/src/components/ui/currency-input";
import { QuantityInput } from "@/src/components/ui/quantity-input";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import PercentageSliderInput from "@/src/components/percentage-slider-input";
// Utilisation du composant ProductSearchCombobox défini dans enhanced-invoice-form.jsx

// Convertir une quantité décimale en { hours, minutes }
const decimalToHM = (decimal) => {
  const total = Math.max(0, decimal || 0);
  const hours = Math.floor(total);
  const minutes = Math.round((total - hours) * 60);
  return { hours, minutes: minutes >= 60 ? 59 : minutes };
};

// Convertir { hours, minutes } en décimal pour le calcul
const hmToDecimal = (hours, minutes) => {
  return (
    Math.max(0, parseInt(hours) || 0) +
    Math.max(0, Math.min(59, parseInt(minutes) || 0)) / 60
  );
};

// Formater une quantité décimale en "Xh Ymin"
const formatHourMinute = (decimal) => {
  const { hours, minutes } = decimalToHM(decimal);
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, "0")}min`;
};

// Fonction utilitaire pour calculer le total d'un article en prenant en compte la remise et l'avancement
const calculateItemTotal = (
  quantity,
  unitPrice,
  discount,
  discountType,
  progressPercentage = 100,
) => {
  let subtotal = (quantity || 1) * (unitPrice || 0);

  // Appliquer le pourcentage d'avancement
  const progress = Math.min(Math.max(progressPercentage ?? 100, 0), 100);
  subtotal = subtotal * (progress / 100);

  // Appliquer la remise si elle existe
  if (discount && discount > 0) {
    if (discountType === "PERCENTAGE" || discountType === "percentage") {
      subtotal = subtotal * (1 - Math.min(discount, 100) / 100);
    } else {
      subtotal = Math.max(0, subtotal - discount);
    }
  }

  return subtotal;
};

// Fonction utilitaire pour formater les montants en euros
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

// Wrapper sortable autour de chaque AccordionItem.
// Reçoit les enfants via render-prop avec listeners/attributes pour la drag handle.
function SortableInvoiceItem({ id, disabled, children }) {
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

export default function ItemsSection({
  mode,
  canEdit,
  ProductSearchCombobox,
  isCreditNote = false,
  validationErrors = [],
  markFieldAsEditing,
  unmarkFieldAsEditing,
  isLinkedToQuote = false,
}) {
  // Déterminer si c'est un avoir
  const isCreditNoteContext =
    isCreditNote ||
    (typeof window !== "undefined" &&
      window.location.pathname.includes("/avoir")) ||
    (typeof window !== "undefined" &&
      window.location.pathname.includes("/credit-note")) ||
    mode === "creditNote" ||
    mode === "credit" ||
    mode === "avoir";
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();
  const {
    fields: items,
    append,
    remove,
    move,
  } = useFieldArray({
    name: "items",
  });

  // Sensors DnD : pointeur (souris/stylet), touch (mobile avec délai pour ne pas
  // bloquer le scroll), clavier (a11y).
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // État contrôlé de l'accordion (pour pouvoir le fermer dès qu'on touche la
  // drag handle, puis restaurer l'état initial à la fin).
  const [openItems, setOpenItems] = useState([]);
  // Mémorise quels items étaient ouverts au début du press sur leur handle,
  // pour les rouvrir après drop ou après tap-sans-drag.
  const wasOpenRef = useRef(new Map());

  // Appelé sur pointerdown de la drag handle : ferme immédiatement l'item.
  const handleHandlePointerDown = (itemId) => {
    if (openItems.includes(itemId)) {
      wasOpenRef.current.set(itemId, true);
      setOpenItems((prev) => prev.filter((v) => v !== itemId));
    } else {
      wasOpenRef.current.delete(itemId);
    }
  };

  // Appelé sur click de la drag handle (= tap sans drag) : rouvre si besoin.
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
      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
    // Restaure l'état ouvert si l'item l'était avant le press
    if (wasOpenRef.current.get(active.id)) {
      setOpenItems((prev) =>
        prev.includes(active.id) ? prev : [...prev, active.id],
      );
    }
    wasOpenRef.current.delete(active.id);
  };

  // Observer les changements en temps réel pour tous les items
  const watchedItems = watch("items") || [];
  const invoiceType = watch("invoiceType");

  // Déterminer si les champs des articles sont verrouillés (facture de situation liée à un devis)
  const isItemFieldLocked = isLinkedToQuote && invoiceType === "situation";

  // État pour gérer l'affichage des champs optionnels par article
  const [showDiscount, setShowDiscount] = useState({});

  // Helper pour vérifier si un champ a une erreur
  const hasFieldError = (itemIndex, fieldName) => {
    return validationErrors.some(
      (error) => error.index === itemIndex && error.fields.includes(fieldName),
    );
  };

  const addItem = (productData = {}) => {
    const quantity = productData.quantity || 1;
    const unitPrice = productData.unitPrice || 0;
    const discount = productData.discount || 0;
    const discountType =
      (productData.discountType === "percentage"
        ? "PERCENTAGE"
        : productData.discountType) || "PERCENTAGE";

    // Si auto-liquidation ou exonération de TVA globale est activée, forcer la TVA à 0%
    const isReverseCharge = watch("isReverseCharge");
    const isVatExempt = watch("isVatExempt");
    const forceZeroVat = isReverseCharge || isVatExempt;
    const defaultVatRate = forceZeroVat ? 0 : 20;

    append({
      description: productData.description || "",
      details: productData.details || "",
      quantity: quantity,
      unitPrice: unitPrice,
      vatRate:
        productData.vatRate !== undefined
          ? forceZeroVat
            ? 0
            : productData.vatRate
          : defaultVatRate,
      unit: productData.unit !== undefined ? productData.unit : "",
      discount: discount,
      discountType: discountType === "percentage" ? "PERCENTAGE" : discountType,
      vatExemptionText: productData.vatExemptionText || "",
      progressPercentage: productData.progressPercentage ?? 100,
      total: calculateItemTotal(
        quantity,
        unitPrice,
        discount,
        discountType,
        100,
      ),
    });
  };

  const removeItem = (index) => {
    remove(index);
  };

  return (
    <Card className="shadow-none border-none bg-transparent mb-0 p-0">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-medium text-lg">
          Articles et produits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Checkboxes Auto-liquidation / Exonération de TVA - Masquées pour les avoirs car copiées automatiquement depuis la facture */}
        {!isCreditNoteContext && (
          <div className="space-y-1">
            <div className="flex items-center space-x-2 py-1">
              <Controller
                name="isReverseCharge"
                render={({ field }) => (
                  <Checkbox
                    id="isReverseCharge"
                    checked={field.value || false}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);

                      // Si auto-liquidation activée, mettre tous les taux de TVA à 0%
                      if (checked) {
                        // Exclusion mutuelle avec l'exonération de TVA globale
                        setValue("isVatExempt", false, { shouldDirty: true });
                        const currentItems = watch("items") || [];
                        currentItems.forEach((_, index) => {
                          setValue(`items.${index}.vatRate`, 0, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        });
                      }
                    }}
                    disabled={!canEdit}
                  />
                )}
              />
              <label
                htmlFor="isReverseCharge"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Auto-liquidation (TVA non applicable - Article 283 du CGI)
              </label>
            </div>

            {/* Checkbox Exonération de TVA globale */}
            <div className="flex items-center space-x-2 py-1">
              <Controller
                name="isVatExempt"
                render={({ field }) => (
                  <Checkbox
                    id="isVatExempt"
                    checked={field.value || false}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);

                      // Si exonération activée, mettre tous les taux de TVA à 0%
                      if (checked) {
                        // Exclusion mutuelle avec l'auto-liquidation
                        setValue("isReverseCharge", false, {
                          shouldDirty: true,
                        });
                        const currentItems = watch("items") || [];
                        currentItems.forEach((_, index) => {
                          setValue(`items.${index}.vatRate`, 0, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        });
                      }
                    }}
                    disabled={!canEdit}
                  />
                )}
              />
              <label
                htmlFor="isVatExempt"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Exonéré de TVA global (TVA à 0% par défaut sur tous les
                articles)
              </label>
            </div>
          </div>
        )}

        {/* Bouton ajouter article - Masqué pour les factures de situation liées à un devis */}
        {!(isLinkedToQuote && invoiceType === "situation") && (
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            {ProductSearchCombobox ? (
              <>
                <div className="flex-1 min-w-0">
                  <ProductSearchCombobox
                    onSelect={addItem}
                    placeholder="Rechercher un produit..."
                    disabled={!canEdit}
                  />
                </div>
                <div className="flex-shrink-0">
                  <Button
                    onClick={() => addItem()}
                    disabled={!canEdit}
                    className="gap-2 w-full md:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="md:inline">Ajouter un article</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full">
                <Button
                  onClick={() => addItem()}
                  disabled={!canEdit}
                  className="gap-2 w-full"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un article
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Message informatif pour les factures de situation liées à un devis ou à une facture de situation existante */}
        {isLinkedToQuote && invoiceType === "situation" && (
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              Les articles sont importés depuis le document lié. Seuls le
              pourcentage d'avancement et la remise sont modifiables.
            </p>
          </div>
        )}

        {/* Liste des articles avec Accordion */}
        {items.length > 0 && (
          <div className="space-y-4 mb-6">
            <Accordion
              type="multiple"
              value={openItems}
              onValueChange={setOpenItems}
              className="w-full space-y-3"
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
                    // Utiliser les valeurs observées en temps réel
                    const currentItem = watchedItems[index] || item;
                    const quantity = currentItem.quantity || 1;
                    const unitPrice = currentItem.unitPrice || 0;
                    const vatRate = currentItem.vatRate || 0;
                    const discount = currentItem.discount || 0;
                    const discountType =
                      currentItem.discountType || "percentage";
                    const unit = currentItem.unit || "unité";
                    const progressPercentage =
                      currentItem.progressPercentage ?? 100;
                    const description =
                      currentItem.description || `Article ${index + 1}`;

                    // Calculer le total en temps réel avec avancement
                    let subtotal = quantity * unitPrice;

                    // Appliquer le pourcentage d'avancement
                    subtotal = subtotal * (progressPercentage / 100);

                    if (discount > 0) {
                      if (
                        discountType === "PERCENTAGE" ||
                        discountType === "percentage"
                      ) {
                        subtotal =
                          subtotal * (1 - Math.min(discount, 100) / 100);
                      } else {
                        subtotal = Math.max(0, subtotal - discount);
                      }
                    }
                    const totalTTC = subtotal * (1 + vatRate / 100);

                    return (
                      <SortableInvoiceItem
                        key={item.id}
                        id={item.id}
                        disabled={isItemFieldLocked || !canEdit}
                      >
                        {({ listeners, attributes }) => (
                          <AccordionItem
                            value={item.id}
                            className="rounded-xl px-4 py-1 overflow-visible border last:border-b-1 bg-[#F5F5F5] dark:bg-neutral-900"
                          >
                            <AccordionTrigger className="w-full justify-start gap-3 text-[15px] leading-6 hover:no-underline focus-visible:ring-0 py-3 [&[data-state=open]>svg]:rotate-180">
                              <div className="flex items-center justify-between w-full gap-3">
                                <div className="flex-1 text-left min-w-0 overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    {items.length > 1 && (
                                      <span
                                        {...attributes}
                                        {...(isItemFieldLocked || !canEdit
                                          ? {}
                                          : listeners)}
                                        onPointerDown={(e) => {
                                          if (isItemFieldLocked || !canEdit)
                                            return;
                                          handleHandlePointerDown(item.id);
                                          listeners?.onPointerDown?.(e);
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleHandleClick(item.id);
                                        }}
                                        role="button"
                                        aria-label="Réorganiser cet article"
                                        tabIndex={
                                          isItemFieldLocked || !canEdit ? -1 : 0
                                        }
                                        className={`inline-flex items-center shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors ${
                                          isItemFieldLocked || !canEdit
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
                                  <div className="text-sm mt-1 space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      {/* Ligne "1 unité • x/unité" masquée à la demande */}
                                      {/*
                              <span className="font-normal">
                                {unit === "heure"
                                  ? formatHourMinute(quantity)
                                  : `${quantity}${unit ? ` ${unit}` : ""}`}
                              </span>
                              <span className="font-normal">•</span>
                              <span className="font-normal">
                                {formatCurrency(unitPrice)}/
                                {unit === "heure"
                                  ? "h"
                                  : unit === "jour"
                                    ? "j"
                                    : unit
                                      ? "unité"
                                      : ""}
                              </span>
                              */}
                                      {discount > 0 && (
                                        <span className="text-amber-600 dark:text-amber-400">
                                          {discountType === "PERCENTAGE" ||
                                          discountType === "percentage"
                                            ? `-${discount}%`
                                            : `-${formatCurrency(discount)}`}
                                        </span>
                                      )}
                                      {progressPercentage !== 100 && (
                                        <>
                                          <span className="font-normal">•</span>
                                          <span
                                            style={{ color: "#5b50ff" }}
                                            className="font-normal"
                                          >
                                            {progressPercentage}% avancement
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <div className="font-normal">
                                      {progressPercentage !== 100 ? (
                                        <>
                                          <span className="text-muted-foreground">
                                            {formatCurrency(
                                              quantity * unitPrice,
                                            )}{" "}
                                            HT
                                          </span>
                                          <span className="mx-1">→</span>
                                          <span style={{ color: "#5b50ff" }}>
                                            {formatCurrency(subtotal)} HT
                                          </span>
                                          <span> • {vatRate}% TVA • </span>
                                          <span style={{ color: "#5b50ff" }}>
                                            {formatCurrency(totalTTC)} TTC
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          {formatCurrency(subtotal)} HT •{" "}
                                          {vatRate}% TVA •{" "}
                                          {formatCurrency(totalTTC)} TTC
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Bouton de suppression - Masqué pour les factures de situation liées à un devis */}
                                {!isItemFieldLocked && (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (canEdit) {
                                        removeItem(index);
                                      }
                                    }}
                                    className={`h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors ${!canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.stopPropagation();
                                        if (canEdit) {
                                          removeItem(index);
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 pt-2 px-2 overflow-visible [&_input]:bg-background [&_textarea]:bg-background [&_[role=combobox]]:bg-background">
                              <div className="space-y-4 pt-2">
                                {/* Description */}
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
                                    ></span>
                                  </div>
                                  <div className="space-y-1">
                                    <Input
                                      id={`item-description-${index}`}
                                      {...register(
                                        `items.${index}.description`,
                                        {
                                          required:
                                            "La description est requise",
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
                                          pattern: {
                                            value:
                                              /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s\.,;:!?@#$%&*()\[\]\-_+='"/\\]+$/,
                                            message:
                                              "La description contient des caractères non autorisés",
                                          },
                                        },
                                      )}
                                      placeholder="Décrivez votre produit ou service"
                                      disabled={!canEdit || isItemFieldLocked}
                                      onFocus={() =>
                                        markFieldAsEditing?.(
                                          index,
                                          "description",
                                        )
                                      }
                                      onBlur={() =>
                                        unmarkFieldAsEditing?.(
                                          index,
                                          "description",
                                        )
                                      }
                                      className={`w-full ${
                                        errors?.items?.[index]?.description ||
                                        hasFieldError(index, "description")
                                          ? "border-destructive"
                                          : ""
                                      }`}
                                    />
                                    {errors?.items?.[index]?.description && (
                                      <p className="text-xs text-red-500">
                                        {
                                          errors.items[index].description
                                            .message
                                        }
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
                                    ></span>
                                  </div>
                                  <Textarea
                                    id={`item-details-${index}`}
                                    {...register(`items.${index}.details`, {
                                      maxLength: {
                                        value: 500,
                                        message:
                                          "Les détails ne doivent pas dépasser 500 caractères",
                                      },
                                    })}
                                    placeholder="Informations complémentaires sur l'article"
                                    disabled={!canEdit || isItemFieldLocked}
                                    rows={2}
                                    onFocus={() =>
                                      markFieldAsEditing?.(index, "details")
                                    }
                                    onBlur={() =>
                                      unmarkFieldAsEditing?.(index, "details")
                                    }
                                    className={`rounded-lg text-sm w-full placeholder:text-[rgba(0,0,0,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)] placeholder:font-medium placeholder:tracking-[-0.01em] ${
                                      errors?.items?.[index]?.details ||
                                      hasFieldError(index, "details")
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
                                      ></span>
                                    </div>
                                    <div className="space-y-1">
                                      <Controller
                                        name={`items.${index}.quantity`}
                                        rules={{
                                          required: "La quantité est requise",
                                          ...(isCreditNoteContext
                                            ? {}
                                            : {
                                                min: {
                                                  value: 0.5,
                                                  message:
                                                    "La quantité doit être au minimum de 0.5",
                                                },
                                              }),
                                        }}
                                        render={({ field }) => {
                                          const currentUnit = watch(
                                            `items.${index}.unit`,
                                          );
                                          const recalcTotal = (newQuantity) => {
                                            field.onChange(newQuantity);
                                            const unitPrice =
                                              watch(
                                                `items.${index}.unitPrice`,
                                              ) || 0;
                                            const discount =
                                              watch(
                                                `items.${index}.discount`,
                                              ) || 0;
                                            const discountType =
                                              watch(
                                                `items.${index}.discountType`,
                                              ) || "percentage";
                                            const progressPercentage =
                                              watch(
                                                `items.${index}.progressPercentage`,
                                              ) ?? 100;
                                            const total = calculateItemTotal(
                                              newQuantity,
                                              unitPrice,
                                              discount,
                                              discountType,
                                              progressPercentage,
                                            );
                                            setValue(
                                              `items.${index}.total`,
                                              total,
                                              {
                                                shouldDirty: true,
                                              },
                                            );
                                          };

                                          if (currentUnit === "heure") {
                                            const { hours: h, minutes: m } =
                                              decimalToHM(field.value);
                                            return (
                                              <div className="flex items-center gap-1.5">
                                                <div className="relative flex-1">
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    value={h}
                                                    onChange={(e) => {
                                                      const newH = Math.max(
                                                        0,
                                                        parseInt(
                                                          e.target.value,
                                                        ) || 0,
                                                      );
                                                      recalcTotal(
                                                        hmToDecimal(newH, m),
                                                      );
                                                    }}
                                                    onBlur={() => {
                                                      field.onBlur();
                                                      unmarkFieldAsEditing?.(
                                                        index,
                                                        "quantity",
                                                      );
                                                    }}
                                                    onFocus={() =>
                                                      markFieldAsEditing?.(
                                                        index,
                                                        "quantity",
                                                      )
                                                    }
                                                    disabled={
                                                      !canEdit ||
                                                      isItemFieldLocked
                                                    }
                                                    className={`w-full h-8 rounded-[9px] border border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-2 pr-6 text-center text-sm font-medium tabular-nums outline-none transition-[border] duration-[80ms] ${
                                                      errors?.items?.[index]
                                                        ?.quantity ||
                                                      hasFieldError(
                                                        index,
                                                        "quantity",
                                                      )
                                                        ? "border-destructive"
                                                        : ""
                                                    }`}
                                                  />
                                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                                    h
                                                  </span>
                                                </div>
                                                <div className="relative flex-1">
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    max={59}
                                                    value={m}
                                                    onChange={(e) => {
                                                      const newM = Math.max(
                                                        0,
                                                        Math.min(
                                                          59,
                                                          parseInt(
                                                            e.target.value,
                                                          ) || 0,
                                                        ),
                                                      );
                                                      recalcTotal(
                                                        hmToDecimal(h, newM),
                                                      );
                                                    }}
                                                    onBlur={() => {
                                                      field.onBlur();
                                                      unmarkFieldAsEditing?.(
                                                        index,
                                                        "quantity",
                                                      );
                                                    }}
                                                    onFocus={() =>
                                                      markFieldAsEditing?.(
                                                        index,
                                                        "quantity",
                                                      )
                                                    }
                                                    disabled={
                                                      !canEdit ||
                                                      isItemFieldLocked
                                                    }
                                                    className={`w-full h-8 rounded-[9px] border border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-2 pr-8 text-center text-sm font-medium tabular-nums outline-none transition-[border] duration-[80ms] ${
                                                      errors?.items?.[index]
                                                        ?.quantity ||
                                                      hasFieldError(
                                                        index,
                                                        "quantity",
                                                      )
                                                        ? "border-destructive"
                                                        : ""
                                                    }`}
                                                  />
                                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                                    min
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          }

                                          return (
                                            <QuantityInput
                                              id={`item-quantity-${index}`}
                                              value={field.value}
                                              onChange={(e) => {
                                                const newQuantity =
                                                  parseFloat(e.target.value) ||
                                                  1;
                                                recalcTotal(newQuantity);
                                              }}
                                              onBlur={() => {
                                                field.onBlur();
                                                unmarkFieldAsEditing?.(
                                                  index,
                                                  "quantity",
                                                );
                                              }}
                                              disabled={
                                                !canEdit || isItemFieldLocked
                                              }
                                              onFocus={() =>
                                                markFieldAsEditing?.(
                                                  index,
                                                  "quantity",
                                                )
                                              }
                                              className={`w-full ${
                                                errors?.items?.[index]
                                                  ?.quantity ||
                                                hasFieldError(index, "quantity")
                                                  ? "border-destructive"
                                                  : ""
                                              }`}
                                            />
                                          );
                                        }}
                                      />
                                      {errors?.items?.[index]?.quantity && (
                                        <p className="text-xs text-destructive">
                                          {errors.items[index].quantity.message}
                                        </p>
                                      )}
                                      {!errors?.items?.[index]?.quantity &&
                                        hasFieldError(index, "quantity") && (
                                          <p className="text-xs text-destructive">
                                            La quantité doit être supérieure à 0
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
                                      ></span>
                                    </div>
                                    <div className="space-y-1">
                                      <Controller
                                        name={`items.${index}.unit`}
                                        defaultValue="none"
                                        render={({ field }) => (
                                          <Select
                                            value={field.value || "none"}
                                            onValueChange={(value) =>
                                              field.onChange(
                                                value === "none" ? "" : value,
                                              )
                                            }
                                            disabled={
                                              !canEdit || isItemFieldLocked
                                            }
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Aucune unité" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">
                                                Aucune unité
                                              </SelectItem>
                                              <SelectItem value="unité">
                                                Unité
                                              </SelectItem>
                                              <SelectItem value="pièce">
                                                Pièce
                                              </SelectItem>
                                              <SelectItem value="heure">
                                                Heure
                                              </SelectItem>
                                              <SelectItem value="jour">
                                                Jour
                                              </SelectItem>
                                              <SelectItem value="mois">
                                                Mois
                                              </SelectItem>
                                              <SelectItem value="kg">
                                                Kilogramme
                                              </SelectItem>
                                              <SelectItem value="m">
                                                Mètre
                                              </SelectItem>
                                              <SelectItem value="m²">
                                                Mètre carré
                                              </SelectItem>
                                              <SelectItem value="m³">
                                                Mètre cube
                                              </SelectItem>
                                              <SelectItem value="litre">
                                                Litre
                                              </SelectItem>
                                              <SelectItem value="forfait">
                                                Forfait
                                              </SelectItem>
                                              <SelectItem value="ensemble">
                                                Ensemble
                                              </SelectItem>
                                              <SelectItem value="personne(s)">
                                                Personne(s)
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        )}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Prix unitaire et Taux de TVA - Taux de TVA masqué en auto-liquidation */}
                                <div
                                  className={`grid gap-3 md:gap-4 ${
                                    watch("isReverseCharge")
                                      ? "grid-cols-1"
                                      : "grid-cols-1 md:grid-cols-2"
                                  }`}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Label
                                        htmlFor={`item-price-${index}`}
                                        className="text-sm font-normal"
                                      >
                                        Prix unitaire (€)
                                      </Label>
                                      <span
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      ></span>
                                    </div>
                                    <div className="space-y-1">
                                      <CurrencyInput
                                        id={`item-price-${index}`}
                                        {...register(
                                          `items.${index}.unitPrice`,
                                          {
                                            valueAsNumber: true,
                                            required: "Le prix est requis",
                                            onChange: (e) => {
                                              const unitPrice =
                                                parseFloat(e.target.value) || 0;
                                              const quantity =
                                                watch(
                                                  `items.${index}.quantity`,
                                                ) || 1;
                                              const discount =
                                                watch(
                                                  `items.${index}.discount`,
                                                ) || 0;
                                              const discountType =
                                                watch(
                                                  `items.${index}.discountType`,
                                                ) || "percentage";
                                              const progressPercentage =
                                                watch(
                                                  `items.${index}.progressPercentage`,
                                                ) ?? 100;

                                              const total = calculateItemTotal(
                                                quantity,
                                                unitPrice,
                                                discount,
                                                discountType,
                                                progressPercentage,
                                              );
                                              setValue(
                                                `items.${index}.total`,
                                                total,
                                                {
                                                  shouldDirty: true,
                                                },
                                              );
                                            },
                                          },
                                        )}
                                        disabled={!canEdit || isItemFieldLocked}
                                        onFocus={() =>
                                          markFieldAsEditing?.(
                                            index,
                                            "unitPrice",
                                          )
                                        }
                                        onBlur={() =>
                                          unmarkFieldAsEditing?.(
                                            index,
                                            "unitPrice",
                                          )
                                        }
                                        className={`w-full ${
                                          errors?.items?.[index]?.unitPrice ||
                                          hasFieldError(index, "unitPrice")
                                            ? "border-destructive"
                                            : ""
                                        }`}
                                      />
                                      {errors?.items?.[index]?.unitPrice && (
                                        <p className="text-xs text-destructive">
                                          {
                                            errors.items[index].unitPrice
                                              .message
                                          }
                                        </p>
                                      )}
                                      {!errors?.items?.[index]?.unitPrice &&
                                        hasFieldError(index, "unitPrice") && (
                                          <p className="text-xs text-destructive">
                                            Le prix unitaire doit être positif
                                            ou nul
                                          </p>
                                        )}
                                    </div>
                                  </div>
                                  {!watch("isReverseCharge") && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Label className="text-sm font-normal">
                                          Taux de TVA
                                        </Label>
                                        <span
                                          className="h-4 w-4"
                                          aria-hidden="true"
                                        ></span>
                                      </div>
                                      <Controller
                                        name={`items.${index}.vatRate`}
                                        defaultValue={20}
                                        render={({ field }) => (
                                          <VatRateSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={
                                              !canEdit || isItemFieldLocked
                                            }
                                          />
                                        )}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Texte d'exonération TVA (affiché seulement si TVA = 0% et pas d'auto-liquidation) */}
                                {watch(`items.${index}.vatRate`) === 0 &&
                                  !watch("isReverseCharge") && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Label
                                          htmlFor={`item-vat-exemption-${index}`}
                                          className="text-sm font-normal"
                                        >
                                          Texte d'exonération de TVA
                                        </Label>
                                        <span
                                          className="h-4 w-4"
                                          aria-hidden="true"
                                        ></span>
                                      </div>
                                      <div className="space-y-1">
                                        <Controller
                                          name={`items.${index}.vatExemptionText`}
                                          render={({ field }) => (
                                            <Select
                                              value={field.value || "none"}
                                              onValueChange={field.onChange}
                                              disabled={
                                                !canEdit || isItemFieldLocked
                                              }
                                            >
                                              <SelectTrigger
                                                className={`w-full ${
                                                  hasFieldError(
                                                    index,
                                                    "vatExemptionText",
                                                  )
                                                    ? "border-destructive"
                                                    : ""
                                                }`}
                                              >
                                                <SelectValue placeholder="Sélectionner une mention" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">
                                                  Sélectionner une mention
                                                </SelectItem>
                                                <SelectItem value="Article 259-1 du CGI">
                                                  Article 259-1 du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 259 B du CGI">
                                                  Article 259 B du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 261 du CGI">
                                                  Article 261 du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 261 D du CGI">
                                                  Article 261 D du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 261 D-4° du CGI">
                                                  Article 261 D-4° du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 261 2-4° du CGI">
                                                  Article 261 2-4° du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 261-4 du CGI">
                                                  Article 261-4 du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 261 4-4° du CGI">
                                                  Article 261 4-4° du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 262 du CGI">
                                                  Article 262 du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 262 ter-I du CGI">
                                                  Article 262 ter-I du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 275 du CGI">
                                                  Article 275 du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 283 du CGI">
                                                  Article 283 du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 283-2 du CGI">
                                                  Article 283-2 du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 293 B du CGI">
                                                  Article 293 B du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 298 sexies du CGI">
                                                  Article 298 sexies du CGI
                                                </SelectItem>
                                                <SelectItem value="Article 44 de la Directive 2006/112/CE">
                                                  Article 44 de la Directive
                                                  2006/112/CE
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          )}
                                        />
                                        {hasFieldError(
                                          index,
                                          "vatExemptionText",
                                        ) && (
                                          <p className="text-xs text-destructive">
                                            Le texte d'exonération de TVA est
                                            requis lorsque la TVA est à 0%
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Remise sur l'article - Affichage conditionnel */}
                                {!showDiscount[index] ? (
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowDiscount((prev) => ({
                                          ...prev,
                                          [index]: true,
                                        }));
                                        setValue(`items.${index}.discount`, 0);
                                        setValue(
                                          `items.${index}.discountType`,
                                          "PERCENTAGE",
                                        );
                                      }}
                                      disabled={!canEdit}
                                      className="text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                      style={{ color: "#5b50FF" }}
                                    >
                                      + Ajouter une remise à l'article
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <Separator className="flex-1" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowDiscount((prev) => ({
                                            ...prev,
                                            [index]: false,
                                          }));
                                          setValue(
                                            `items.${index}.discount`,
                                            0,
                                          );
                                          setValue(
                                            `items.${index}.discountType`,
                                            "PERCENTAGE",
                                          );
                                          // Recalculer le total
                                          const quantity =
                                            watch(`items.${index}.quantity`) ||
                                            1;
                                          const unitPrice =
                                            watch(`items.${index}.unitPrice`) ||
                                            0;
                                          const progressPercentage =
                                            watch(
                                              `items.${index}.progressPercentage`,
                                            ) ?? 100;
                                          const total = calculateItemTotal(
                                            quantity,
                                            unitPrice,
                                            0,
                                            "PERCENTAGE",
                                            progressPercentage,
                                          );
                                          setValue(
                                            `items.${index}.total`,
                                            total,
                                            {
                                              shouldDirty: true,
                                            },
                                          );
                                        }}
                                        disabled={!canEdit}
                                        className="text-xs hover:text-destructive transition-colors px-3 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                                        style={{ color: "#5b50FF" }}
                                      >
                                        Retirer la remise
                                      </button>
                                      <Separator className="flex-1" />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Label
                                          htmlFor={`item-discount-${index}`}
                                          className="text-sm font-normal"
                                        >
                                          Remise
                                        </Label>
                                        <span
                                          className="h-4 w-4"
                                          aria-hidden="true"
                                        ></span>
                                      </div>
                                      <div className="relative flex rounded-md shadow-xs">
                                        <Input
                                          id={`item-discount-${index}`}
                                          type="text"
                                          inputMode="decimal"
                                          value={
                                            watch(`items.${index}.discount`) ??
                                            0
                                          }
                                          onChange={(e) => {
                                            // Sanitize input
                                            let sanitizedValue =
                                              e.target.value.replace(/,/g, ".");
                                            sanitizedValue =
                                              sanitizedValue.replace(
                                                /[^\d.]/g,
                                                "",
                                              );
                                            const parts =
                                              sanitizedValue.split(".");
                                            if (parts.length > 2) {
                                              sanitizedValue =
                                                parts[0] +
                                                "." +
                                                parts.slice(1).join("");
                                            }

                                            let discountValue =
                                              parseFloat(sanitizedValue);
                                            if (isNaN(discountValue))
                                              discountValue = 0;
                                            if (discountValue < 0)
                                              discountValue = 0;

                                            const discountType =
                                              watch(
                                                `items.${index}.discountType`,
                                              ) || "PERCENTAGE";
                                            // Limiter à 100 si pourcentage
                                            if (
                                              (discountType === "PERCENTAGE" ||
                                                discountType ===
                                                  "percentage") &&
                                              discountValue > 100
                                            ) {
                                              discountValue = 100;
                                            }

                                            setValue(
                                              `items.${index}.discount`,
                                              discountValue,
                                              {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                              },
                                            );

                                            const quantity =
                                              watch(
                                                `items.${index}.quantity`,
                                              ) || 1;
                                            const unitPrice =
                                              watch(
                                                `items.${index}.unitPrice`,
                                              ) || 0;
                                            const progressPercentage =
                                              watch(
                                                `items.${index}.progressPercentage`,
                                              ) ?? 100;

                                            const total = calculateItemTotal(
                                              quantity,
                                              unitPrice,
                                              discountValue,
                                              discountType,
                                              progressPercentage,
                                            );
                                            setValue(
                                              `items.${index}.total`,
                                              total,
                                              {
                                                shouldDirty: true,
                                              },
                                            );
                                          }}
                                          disabled={!canEdit}
                                          className={`rounded-e-none border-e-0 w-full ${
                                            errors?.items?.[index]?.discount
                                              ? "border-destructive"
                                              : ""
                                          }`}
                                        />
                                        <Controller
                                          name={`items.${index}.discountType`}
                                          defaultValue="PERCENTAGE"
                                          render={({ field }) => (
                                            <Select
                                              value={
                                                field.value || "PERCENTAGE"
                                              }
                                              onValueChange={(value) => {
                                                field.onChange(value);
                                                setValue(
                                                  `items.${index}.discountType`,
                                                  value,
                                                  {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                  },
                                                );

                                                // Recalculer le total
                                                const discount =
                                                  parseFloat(
                                                    watch(
                                                      `items.${index}.discount`,
                                                    ),
                                                  ) || 0;
                                                const quantity =
                                                  parseFloat(
                                                    watch(
                                                      `items.${index}.quantity`,
                                                    ),
                                                  ) || 1;
                                                const unitPrice =
                                                  parseFloat(
                                                    watch(
                                                      `items.${index}.unitPrice`,
                                                    ),
                                                  ) || 0;
                                                const progressPercentage =
                                                  (() => {
                                                    const p = parseFloat(
                                                      watch(
                                                        `items.${index}.progressPercentage`,
                                                      ),
                                                    );
                                                    return isNaN(p) ? 100 : p;
                                                  })();

                                                const total =
                                                  calculateItemTotal(
                                                    quantity,
                                                    unitPrice,
                                                    discount,
                                                    value,
                                                    progressPercentage,
                                                  );
                                                setValue(
                                                  `items.${index}.total`,
                                                  total,
                                                  {
                                                    shouldDirty: true,
                                                  },
                                                );
                                              }}
                                              disabled={!canEdit}
                                            >
                                              <SelectTrigger className="h-8 w-auto min-w-[60px] rounded-s-none rounded-e-[9px] border border-solid border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] [box-shadow:none] dark:[box-shadow:none] hover:bg-transparent active:bg-transparent dark:hover:bg-transparent dark:active:bg-transparent">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="PERCENTAGE">
                                                  %
                                                </SelectItem>
                                                <SelectItem value="FIXED">
                                                  €
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          )}
                                        />
                                      </div>
                                      {errors?.items?.[index]?.discount && (
                                        <p className="text-xs text-destructive">
                                          {errors.items[index].discount.message}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </SortableInvoiceItem>
                    );
                  })}
                </SortableContext>
              </DndContext>
            </Accordion>
          </div>
        )}

        {/* Bouton ajouter article en bas - Masqué pour les factures de situation liées à un devis */}
        {items.length > 0 && !isItemFieldLocked && (
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
