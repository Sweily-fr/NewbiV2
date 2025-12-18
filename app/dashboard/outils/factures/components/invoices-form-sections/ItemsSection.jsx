"use client";

import { useState } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Package, Plus, Trash2, Percent } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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

// Fonction utilitaire pour calculer le total d'un article en prenant en compte la remise et l'avancement
const calculateItemTotal = (quantity, unitPrice, discount, discountType, progressPercentage = 100) => {
  let subtotal = (quantity || 1) * (unitPrice || 0);

  // Appliquer le pourcentage d'avancement
  const progress = Math.min(Math.max(progressPercentage || 100, 0), 100);
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
  const { fields: items, append, remove } = useFieldArray({ name: "items" });

  // Observer les changements en temps réel pour tous les items
  const watchedItems = watch("items") || [];
  const invoiceType = watch("invoiceType");
  
  // Déterminer si les champs des articles sont verrouillés (facture de situation liée à un devis)
  const isItemFieldLocked = isLinkedToQuote && invoiceType === "situation";
  
  // État pour gérer l'affichage des champs optionnels par article
  const [showProgress, setShowProgress] = useState({});
  const [showDiscount, setShowDiscount] = useState({});
  
  // Helper pour vérifier si un champ a une erreur
  const hasFieldError = (itemIndex, fieldName) => {
    return validationErrors.some(
      (error) => error.index === itemIndex && error.fields.includes(fieldName)
    );
  };

  const addItem = (productData = {}) => {
    const quantity = productData.quantity || 1;
    const unitPrice = productData.unitPrice || 0;
    const discount = productData.discount || 0;
    const discountType = (productData.discountType === "percentage" ? "PERCENTAGE" : productData.discountType) || "PERCENTAGE";
    
    // Si auto-liquidation est activée, forcer la TVA à 0%
    const isReverseCharge = watch("isReverseCharge");
    const defaultVatRate = isReverseCharge ? 0 : 20;

    append({
      description: productData.description || "",
      details: productData.details || "",
      quantity: quantity,
      unitPrice: unitPrice,
      vatRate: productData.vatRate !== undefined ? (isReverseCharge ? 0 : productData.vatRate) : defaultVatRate,
      unit: productData.unit !== undefined ? productData.unit : "",
      discount: discount,
      discountType: discountType === "percentage" ? "PERCENTAGE" : discountType,
      vatExemptionText: productData.vatExemptionText || "",
      progressPercentage: productData.progressPercentage || 100,
      total: calculateItemTotal(quantity, unitPrice, discount, discountType, 100),
    });
  };

  const removeItem = (index) => {
    remove(index);
  };

  return (
    <Card className="shadow-none border-none bg-transparent mb-0 p-0">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-normal text-lg">
          Articles et produits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Checkbox Auto-liquidation - Masquée pour les avoirs car copiée automatiquement depuis la facture */}
        {!isCreditNoteContext && (
          <div className="flex items-center space-x-2 py-2">
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
        )}

        {/* Bouton ajouter article - Masqué pour les factures de situation liées à un devis */}
        {!(isLinkedToQuote && invoiceType === "situation") && (
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            {ProductSearchCombobox ? (
              <>
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
                    className="gap-2 w-full h-full min-h-10 font-normal"
                    size="lg"
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
                  className="gap-2 w-full h-full min-h-10 font-normal"
                  size="lg"
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
            <p>Les articles sont importés depuis le document lié. Seuls le pourcentage d'avancement et la remise sont modifiables.</p>
          </div>
        )}

        {/* Liste des articles avec Accordion */}
        {items.length > 0 && (
          <div className="space-y-4 mb-6">
            <Accordion
              type="multiple"
              defaultValue={[]}
              className="w-full space-y-3"
            >
              {items.map((item, index) => {
                // Utiliser les valeurs observées en temps réel
                const currentItem = watchedItems[index] || item;
                const quantity = currentItem.quantity || 1;
                const unitPrice = currentItem.unitPrice || 0;
                const vatRate = currentItem.vatRate || 0;
                const discount = currentItem.discount || 0;
                const discountType = currentItem.discountType || "percentage";
                const unit = currentItem.unit || "unité";
                const progressPercentage = currentItem.progressPercentage ?? 100;
                const description =
                  currentItem.description || `Article ${index + 1}`;

                // Calculer le total en temps réel avec avancement
                let subtotal = quantity * unitPrice;
                
                // Appliquer le pourcentage d'avancement
                subtotal = subtotal * (progressPercentage / 100);
                
                if (discount > 0) {
                  if (discountType === "PERCENTAGE" || discountType === "percentage") {
                    subtotal = subtotal * (1 - Math.min(discount, 100) / 100);
                  } else {
                    subtotal = Math.max(0, subtotal - discount);
                  }
                }
                const totalTTC = subtotal * (1 + vatRate / 100);

                return (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="rounded-lg px-4 py-1 overflow-visible border last:border-b-1"
                  >
                    <AccordionTrigger className="w-full justify-start gap-3 text-[15px] leading-6 hover:no-underline focus-visible:ring-0 py-3 [&[data-state=open]>svg]:rotate-180">
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex-1 text-left">
                          <div className="font-normal">{description}</div>
                          <div className="text-sm mt-1 space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-normal">
                                {quantity}{unit ? ` ${unit}` : ""}
                              </span>
                              <span className="font-normal">•</span>
                              <span className="font-normal">
                                {formatCurrency(unitPrice)}/
                                {unit === "heure"
                                  ? "h"
                                  : unit === "jour"
                                    ? "j"
                                    : unit ? "unité" : ""}
                              </span>
                              {discount > 0 && (
                                <span className="text-amber-600 dark:text-amber-400">
                                  {(discountType === "PERCENTAGE" || discountType === "percentage")
                                    ? `-${discount}%`
                                    : `-${formatCurrency(discount)}`}
                                </span>
                              )}
                              {progressPercentage !== 100 && (
                                <>
                                  <span className="font-normal">•</span>
                                  <span style={{ color: "#5b50ff" }} className="font-normal">
                                    {progressPercentage}% avancement
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="font-normal">
                              {progressPercentage !== 100 ? (
                                <>
                                  <span className="text-muted-foreground">{formatCurrency(quantity * unitPrice)} HT</span>
                                  <span className="mx-1">→</span>
                                  <span style={{ color: "#5b50ff" }}>{formatCurrency(subtotal)} HT</span>
                                  <span> • {vatRate}% TVA • </span>
                                  <span style={{ color: "#5b50ff" }}>{formatCurrency(totalTTC)} TTC</span>
                                </>
                              ) : (
                                <>
                                  {formatCurrency(subtotal)} HT • {vatRate}% TVA •{" "}
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
                    <AccordionContent className="pb-6 pt-2 px-2 overflow-visible">
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
                            <span className="h-4 w-4" aria-hidden="true"></span>
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
                                  value: 255,
                                  message:
                                    "La description ne doit pas dépasser 255 caractères",
                                },
                                pattern: {
                                  value: /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s\.,;:!?@#$%&*()\[\]\-_+='"/\\]+$/,
                                  message: "La description contient des caractères non autorisés"
                                },
                              })}
                              placeholder="Décrivez votre produit ou service"
                              disabled={!canEdit || isItemFieldLocked}
                              onFocus={() => markFieldAsEditing?.(index, "description")}
                              onBlur={() => unmarkFieldAsEditing?.(index, "description")}
                              className={`h-10 rounded-lg text-sm w-full ${
                                errors?.items?.[index]?.description || hasFieldError(index, "description")
                                  ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
                                  : ""
                              }`}
                            />
                            {errors?.items?.[index]?.description && (
                              <p className="text-xs text-red-500">
                                {errors.items[index].description.message}
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
                            <span className="h-4 w-4" aria-hidden="true"></span>
                          </div>
                          <Textarea
                            id={`item-details-${index}`}
                            {...register(`items.${index}.details`, {
                              maxLength: {
                                value: 500,
                                message: "Les détails ne doivent pas dépasser 500 caractères",
                              },
                            })}
                            placeholder="Informations complémentaires sur l'article"
                            disabled={!canEdit || isItemFieldLocked}
                            rows={2}
                            onFocus={() => markFieldAsEditing?.(index, "details")}
                            onBlur={() => unmarkFieldAsEditing?.(index, "details")}
                            className={`rounded-lg text-sm w-full ${
                              errors?.items?.[index]?.details || hasFieldError(index, "details")
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
                              <span className="h-4 w-4" aria-hidden="true"></span>
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
                                render={({ field }) => (
                                  <QuantityInput
                                    id={`item-quantity-${index}`}
                                    value={field.value}
                                    onChange={(e) => {
                                      const newQuantity = parseFloat(e.target.value) || 0.5;
                                      field.onChange(newQuantity);
                                      
                                      // Recalculer le total
                                      const unitPrice = watch(`items.${index}.unitPrice`) || 0;
                                      const discount = watch(`items.${index}.discount`) || 0;
                                      const discountType = watch(`items.${index}.discountType`) || "percentage";
                                      const progressPercentage = watch(`items.${index}.progressPercentage`) || 100;

                                      const total = calculateItemTotal(
                                        newQuantity,
                                        unitPrice,
                                        discount,
                                        discountType,
                                        progressPercentage
                                      );
                                      setValue(`items.${index}.total`, total, {
                                        shouldDirty: true,
                                      });
                                    }}
                                    onBlur={() => {
                                      field.onBlur();
                                      unmarkFieldAsEditing?.(index, "quantity");
                                    }}
                                    disabled={!canEdit || isItemFieldLocked}
                                    onFocus={() => markFieldAsEditing?.(index, "quantity")}
                                    className={`h-10 text-sm w-full ${
                                      errors?.items?.[index]?.quantity || hasFieldError(index, "quantity")
                                        ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
                                        : ""
                                    }`}
                                  />
                                )}
                              />
                              {errors?.items?.[index]?.quantity && (
                                <p className="text-xs text-destructive">
                                  {errors.items[index].quantity.message}
                                </p>
                              )}
                              {!errors?.items?.[index]?.quantity && hasFieldError(index, "quantity") && (
                                <p className="text-xs text-destructive">La quantité doit être supérieure à 0</p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-normal">Unité</Label>
                              <span className="h-4 w-4" aria-hidden="true"></span>
                            </div>
                            <div className="space-y-1">
                              <Controller
                                name={`items.${index}.unit`}
                                defaultValue="none"
                                render={({ field }) => (
                                  <Select
                                    value={field.value || "none"}
                                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                                    disabled={!canEdit || isItemFieldLocked}
                                  >
                                    <SelectTrigger className="w-full text-sm">
                                      <SelectValue placeholder="Aucune unité" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Aucune unité</SelectItem>
                                      <SelectItem value="unité">Unité</SelectItem>
                                      <SelectItem value="pièce">Pièce</SelectItem>
                                      <SelectItem value="heure">Heure</SelectItem>
                                      <SelectItem value="jour">Jour</SelectItem>
                                      <SelectItem value="mois">Mois</SelectItem>
                                      <SelectItem value="kg">Kilogramme</SelectItem>
                                      <SelectItem value="m">Mètre</SelectItem>
                                      <SelectItem value="m²">Mètre carré</SelectItem>
                                      <SelectItem value="m³">Mètre cube</SelectItem>
                                      <SelectItem value="litre">Litre</SelectItem>
                                      <SelectItem value="forfait">Forfait</SelectItem>
                                      <SelectItem value="ensemble">Ensemble</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Prix unitaire et Taux de TVA - Taux de TVA masqué en auto-liquidation */}
                        <div className={`grid gap-3 md:gap-4 ${
                          watch('isReverseCharge') ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                        }`}>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`item-price-${index}`}
                                className="text-sm font-normal"
                              >
                                Prix unitaire (€)
                              </Label>
                              <span className="h-4 w-4" aria-hidden="true"></span>
                            </div>
                            <div className="space-y-1">
                              <CurrencyInput
                                id={`item-price-${index}`}
                                {...register(`items.${index}.unitPrice`, {
                                  valueAsNumber: true,
                                  required: "Le prix est requis",
                                  onChange: (e) => {
                                    const unitPrice =
                                      parseFloat(e.target.value) || 0;
                                    const quantity =
                                      watch(`items.${index}.quantity`) || 1;
                                    const discount =
                                      watch(`items.${index}.discount`) || 0;
                                    const discountType =
                                      watch(`items.${index}.discountType`) ||
                                      "percentage";
                                    const progressPercentage =
                                      watch(`items.${index}.progressPercentage`) || 100;

                                    const total = calculateItemTotal(
                                      quantity,
                                      unitPrice,
                                      discount,
                                      discountType,
                                      progressPercentage
                                    );
                                    setValue(`items.${index}.total`, total, {
                                      shouldDirty: true,
                                    });
                                  },
                                })}
                                disabled={!canEdit || isItemFieldLocked}
                                onFocus={() => markFieldAsEditing?.(index, "unitPrice")}
                                onBlur={() => unmarkFieldAsEditing?.(index, "unitPrice")}
                                className={`h-10 text-sm w-full ${
                                  errors?.items?.[index]?.unitPrice || hasFieldError(index, "unitPrice")
                                    ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
                                    : ""
                                }`}
                              />
                              {errors?.items?.[index]?.unitPrice && (
                                <p className="text-xs text-destructive">
                                  {errors.items[index].unitPrice.message}
                                </p>
                              )}
                              {!errors?.items?.[index]?.unitPrice && hasFieldError(index, "unitPrice") && (
                                <p className="text-xs text-destructive">Le prix unitaire doit être supérieur à 0€</p>
                              )}
                            </div>
                          </div>
                          {!watch('isReverseCharge') && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-normal">
                                  Taux de TVA
                                </Label>
                                <span className="h-4 w-4" aria-hidden="true"></span>
                              </div>
                              <Controller
                                name={`items.${index}.vatRate`}
                                defaultValue={20}
                                render={({ field }) => (
                                  <Select
                                    value={field.value?.toString() || "20"}
                                    onValueChange={(value) => field.onChange(parseFloat(value))}
                                    disabled={!canEdit || isItemFieldLocked}
                                  >
                                    <SelectTrigger className="w-full text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">
                                        0% - Exonéré
                                      </SelectItem>
                                      <SelectItem value="5.5">
                                        5,5% - Taux réduit
                                      </SelectItem>
                                      <SelectItem value="10">
                                        10% - Taux intermédiaire
                                      </SelectItem>
                                      <SelectItem value="20">
                                        20% - Taux normal
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          )}
                        </div>

                        {/* Texte d'exonération TVA (affiché seulement si TVA = 0% et pas d'auto-liquidation) */}
                        {watch(`items.${index}.vatRate`) === 0 && !watch('isReverseCharge') && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`item-vat-exemption-${index}`}
                                className="text-sm font-normal"
                              >
                                Texte d'exonération de TVA
                              </Label>
                              <span className="h-4 w-4" aria-hidden="true"></span>
                            </div>
                            <div className="space-y-1">
                              <Controller
                                name={`items.${index}.vatExemptionText`}
                                render={({ field }) => (
                                  <Select
                                    value={field.value || "none"}
                                    onValueChange={field.onChange}
                                    disabled={!canEdit || isItemFieldLocked}
                                  >
                                    <SelectTrigger className={`w-full text-sm ${
                                      hasFieldError(index, "vatExemptionText")
                                        ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
                                        : ""
                                    }`}>
                                      <SelectValue placeholder="Sélectionner une mention" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Sélectionner une mention</SelectItem>
                                      <SelectItem value="Article 259-1 du CGI">Article 259-1 du CGI</SelectItem>
                                      <SelectItem value="Article 259 B du CGI">Article 259 B du CGI</SelectItem>
                                      <SelectItem value="Article 261 du CGI">Article 261 du CGI</SelectItem>
                                      <SelectItem value="Article 261 D du CGI">Article 261 D du CGI</SelectItem>
                                      <SelectItem value="Article 261 D-4° du CGI">Article 261 D-4° du CGI</SelectItem>
                                      <SelectItem value="Article 261 2-4° du CGI">Article 261 2-4° du CGI</SelectItem>
                                      <SelectItem value="Article 261-4 du CGI">Article 261-4 du CGI</SelectItem>
                                      <SelectItem value="Article 261 4-4° du CGI">Article 261 4-4° du CGI</SelectItem>
                                      <SelectItem value="Article 262 du CGI">Article 262 du CGI</SelectItem>
                                      <SelectItem value="Article 262 ter-I du CGI">Article 262 ter-I du CGI</SelectItem>
                                      <SelectItem value="Article 275 du CGI">Article 275 du CGI</SelectItem>
                                      <SelectItem value="Article 283 du CGI">Article 283 du CGI</SelectItem>
                                      <SelectItem value="Article 283-2 du CGI">Article 283-2 du CGI</SelectItem>
                                      <SelectItem value="Article 293 B du CGI">Article 293 B du CGI</SelectItem>
                                      <SelectItem value="Article 298 sexies du CGI">Article 298 sexies du CGI</SelectItem>
                                      <SelectItem value="Article 44 de la Directive 2006/112/CE">Article 44 de la Directive 2006/112/CE</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {hasFieldError(index, "vatExemptionText") && (
                                <p className="text-xs text-destructive">
                                  Le texte d'exonération de TVA est requis lorsque la TVA est à 0%
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Avancement - Affichage conditionnel (uniquement pour les factures de situation) */}
                        {invoiceType === "situation" && !showProgress[index] ? (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowProgress(prev => ({ ...prev, [index]: true }));
                                setValue(`items.${index}.progressPercentage`, 100);
                              }}
                              disabled={!canEdit}
                              className="text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              style={{ color: '#5b50FF' }}
                            >
                              + Facturer partiellement (%)
                            </button>
                          </div>
                        ) : invoiceType === "situation" && showProgress[index] ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-normal">Facturation partielle</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowProgress(prev => ({ ...prev, [index]: false }));
                                  setValue(`items.${index}.progressPercentage`, 100);
                                  // Recalculer le total
                                  const quantity = watch(`items.${index}.quantity`) || 1;
                                  const unitPrice = watch(`items.${index}.unitPrice`) || 0;
                                  const discount = watch(`items.${index}.discount`) || 0;
                                  const discountType = watch(`items.${index}.discountType`) || "percentage";
                                  const total = calculateItemTotal(quantity, unitPrice, discount, discountType, 100);
                                  setValue(`items.${index}.total`, total, { shouldDirty: true });
                                }}
                                disabled={!canEdit}
                                className="text-xs hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                style={{ color: '#5b50FF' }}
                              >
                                Retirer
                              </button>
                            </div>
                            <PercentageSliderInput
                              label="Facturation partielle"
                              value={watch(`items.${index}.progressPercentage`) || 100}
                              showLabelInValue={false}
                              onChange={(value) => {
                                setValue(`items.${index}.progressPercentage`, value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                // Recalculer le total
                                const quantity = watch(`items.${index}.quantity`) || 1;
                                const unitPrice = watch(`items.${index}.unitPrice`) || 0;
                                const discount = watch(`items.${index}.discount`) || 0;
                                const discountType = watch(`items.${index}.discountType`) || "percentage";
                                const total = calculateItemTotal(
                                  quantity,
                                  unitPrice,
                                  discount,
                                  discountType,
                                  value
                                );
                                setValue(`items.${index}.total`, total, {
                                  shouldDirty: true,
                                });
                              }}
                              disabled={!canEdit}
                              minValue={0}
                              maxValue={100}
                              step={1}
                              gaugeColor="#5b50FF"
                              id={`item-progress-${index}`}
                            />
                            {errors?.items?.[index]?.progressPercentage && (
                              <p className="text-xs text-destructive mt-2">
                                {errors.items[index].progressPercentage.message}
                              </p>
                            )}
                          </div>
                        ) : null}

                        {/* Remise sur l'article - Affichage conditionnel */}
                        {!showDiscount[index] ? (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowDiscount(prev => ({ ...prev, [index]: true }));
                                setValue(`items.${index}.discount`, 0);
                                setValue(`items.${index}.discountType`, "PERCENTAGE");
                              }}
                              disabled={!canEdit}
                              className="text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              style={{ color: '#5b50FF' }}
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
                                setShowDiscount(prev => ({ ...prev, [index]: false }));
                                setValue(`items.${index}.discount`, 0);
                                setValue(`items.${index}.discountType`, "PERCENTAGE");
                                // Recalculer le total
                                const quantity = watch(`items.${index}.quantity`) || 1;
                                const unitPrice = watch(`items.${index}.unitPrice`) || 0;
                                const progressPercentage = watch(`items.${index}.progressPercentage`) || 100;
                                const total = calculateItemTotal(quantity, unitPrice, 0, "PERCENTAGE", progressPercentage);
                                setValue(`items.${index}.total`, total, { shouldDirty: true });
                              }}
                              disabled={!canEdit}
                              className="text-xs hover:text-destructive transition-colors px-3 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                              style={{ color: '#5b50FF' }}
                            >
                              Retirer la remise
                            </button>
                              <Separator className="flex-1" />
                            </div>
                            <div className="space-y-3 md:space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm font-normal">
                                    Type de remise
                                  </Label>
                                  <span className="h-4 w-4" aria-hidden="true"></span>
                                </div>
                              <Controller
                                name={`items.${index}.discountType`}
                                defaultValue="PERCENTAGE"
                                render={({ field }) => (
                                  <Select
                                    value={field.value || "PERCENTAGE"}
                                    onValueChange={(value) => {
                                      field.onChange(value);

                                      // Mettre à jour le type de remise immédiatement
                                      setValue(
                                        `items.${index}.discountType`,
                                        value,
                                        {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        }
                                      );

                                      // Mettre à jour le total avec les nouvelles valeurs
                                      const discount =
                                        parseFloat(
                                          watch(`items.${index}.discount`)
                                        ) || 0;
                                      const quantity =
                                        parseFloat(
                                          watch(`items.${index}.quantity`)
                                        ) || 1;
                                      const unitPrice =
                                        parseFloat(
                                          watch(`items.${index}.unitPrice`)
                                        ) || 0;
                                      const progressPercentage =
                                        parseFloat(
                                          watch(`items.${index}.progressPercentage`)
                                        ) || 100;

                                      const total = calculateItemTotal(
                                        quantity,
                                        unitPrice,
                                        discount,
                                        value,
                                        progressPercentage
                                      );

                                      setValue(`items.${index}.total`, total, {
                                        shouldDirty: true,
                                      });
                                    }}
                                    disabled={!canEdit}
                                  >
                                    <SelectTrigger className="w-full text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
                                      <SelectItem value="FIXED">Montant fixe (€)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`item-discount-${index}`}
                                    className="text-sm font-normal"
                                  >
                                    {(watch(`items.${index}.discountType`) === "PERCENTAGE" ||
                                     watch(`items.${index}.discountType`) === "percentage")
                                      ? "Pourcentage (%)"
                                      : "Montant (€)"}
                                  </Label>
                                  <span className="h-4 w-4" aria-hidden="true"></span>
                                </div>
                              <div className="space-y-1">
                                {(watch(`items.${index}.discountType`) === "FIXED") ? (
                                  <CurrencyInput
                                    id={`item-discount-${index}`}
                                    {...register(`items.${index}.discount`, {
                                      valueAsNumber: true,
                                      min: {
                                        value: 0,
                                        message:
                                          "La remise doit être positive ou nulle",
                                      },
                                    })}
                                    disabled={!canEdit}
                                    className={`w-full h-10 text-sm ${errors?.items?.[index]?.discount ? "border-red-500" : ""}`}
                                    onInput={(e) => {
                                      const value = e.target.value;
                                      const discountValue =
                                        parseFloat(value) || 0;
                                      const quantity =
                                        watch(`items.${index}.quantity`) || 1;
                                      const unitPrice =
                                        watch(`items.${index}.unitPrice`) || 0;
                                      const discountType =
                                        watch(`items.${index}.discountType`) ||
                                        "percentage";
                                      const progressPercentage =
                                        watch(`items.${index}.progressPercentage`) || 100;

                                      setValue(
                                        `items.${index}.discount`,
                                        discountValue,
                                        {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        }
                                      );

                                      const total = calculateItemTotal(
                                        quantity,
                                        unitPrice,
                                        discountValue,
                                        discountType,
                                        progressPercentage
                                      );

                                      setValue(`items.${index}.total`, total, {
                                        shouldDirty: true,
                                      });
                                    }}
                                  />
                                ) : (
                                  <Input
                                    id={`item-discount-${index}`}
                                    type="number"
                                    {...register(`items.${index}.discount`, {
                                      valueAsNumber: true,
                                      min: {
                                        value: 0,
                                        message:
                                          "La remise doit être positive ou nulle",
                                      },
                                      max: {
                                        value: 100,
                                        message:
                                          "La remise ne peut pas dépasser 100%",
                                      },
                                      validate: (value) => {
                                        if (value > 100) {
                                          return "La remise ne peut pas dépasser 100%";
                                        }
                                        return true;
                                      },
                                    })}
                                    max="100"
                                    step="0.01"
                                    disabled={!canEdit}
                                    className={`w-full h-10 rounded-lg text-sm ${errors?.items?.[index]?.discount ? "border-red-500" : ""}`}
                                    onInput={(e) => {
                                      const value = e.target.value;
                                      const discountValue =
                                        parseFloat(value) || 0;
                                      const quantity =
                                        watch(`items.${index}.quantity`) || 1;
                                      const unitPrice =
                                        watch(`items.${index}.unitPrice`) || 0;
                                      const discountType =
                                        watch(`items.${index}.discountType`) ||
                                        "percentage";
                                      const progressPercentage =
                                        watch(`items.${index}.progressPercentage`) || 100;

                                      setValue(
                                        `items.${index}.discount`,
                                        discountValue,
                                        {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        }
                                      );

                                      const total = calculateItemTotal(
                                        quantity,
                                        unitPrice,
                                        discountValue,
                                        discountType,
                                        progressPercentage
                                      );

                                      setValue(`items.${index}.total`, total, {
                                        shouldDirty: true,
                                      });
                                    }}
                                  />
                                )}
                                {errors?.items?.[index]?.discount && (
                                  <p className="text-xs text-red-500">
                                    {errors.items[index].discount.message}
                                  </p>
                                )}
                              </div>
                            </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}

        {/* Bouton ajouter article en bas - Masqué pour les factures de situation liées à un devis */}
        {items.length > 0 && !isItemFieldLocked && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => addItem()}
              disabled={!canEdit}
              variant="outline"
              className="gap-2 font-normal"
            >
              Ajouter un article
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
