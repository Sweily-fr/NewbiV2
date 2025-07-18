"use client";

import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Package, Plus, Trash2, Percent } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion";
// Utilisation du composant ProductSearchCombobox défini dans enhanced-invoice-form.jsx

// Fonction utilitaire pour calculer le total d'un article en prenant en compte la remise
const calculateItemTotal = (quantity, unitPrice, discount, discountType) => {
  let subtotal = (quantity || 1) * (unitPrice || 0);
  
  // Appliquer la remise si elle existe
  if (discount && discount > 0) {
    if (discountType === 'percentage') {
      subtotal = subtotal * (1 - Math.min(discount, 100) / 100);
    } else {
      subtotal = Math.max(0, subtotal - discount);
    }
  }
  
  return subtotal;
};

export default function ItemsSection({ 
  formatCurrency, 
  canEdit,
  ProductSearchCombobox 
}) {
  const { watch, setValue, register, formState: { errors } } = useFormContext();
  const { fields: items, append, remove } = useFieldArray({ name: "items" });
  
  // Observer les changements en temps réel pour tous les items
  const watchedItems = watch("items") || [];
  
  const addItem = (productData = {}) => {
    const quantity = productData.quantity || 1;
    const unitPrice = productData.unitPrice || 0;
    const discount = productData.discount || 0;
    const discountType = productData.discountType || 'percentage';
    
    append({
      description: productData.description || "",
      details: productData.details || "",
      quantity: quantity,
      unitPrice: unitPrice,
      vatRate: productData.vatRate || 20,
      unit: productData.unit || "pièce",
      discount: discount,
      discountType: discountType,
      vatExemptionText: productData.vatExemptionText || "",
      total: calculateItemTotal(quantity, unitPrice, discount, discountType)
    });
  };
  
  const removeItem = (index) => {
    remove(index);
  };
  

  return (
    <Card className="shadow-none border-none bg-transparent mb-0">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Articles et produits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Bouton ajouter article */}
        <div className="flex gap-3 items-stretch">
          <div className="flex-1 min-w-0" style={{flexBasis: '75%'}}>
            <div className="h-full">
              <ProductSearchCombobox
                onSelect={addItem}
                placeholder="Rechercher un produit..."
                disabled={!canEdit}
                className="h-full"
              />
            </div>
          </div>
          <div className="flex-shrink-0" style={{flexBasis: '25%'}}>
            <Button
              onClick={() => addItem()}
              disabled={!canEdit}
              className="gap-2 w-full h-full min-h-10"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              Ajouter un article
            </Button>
          </div>
        </div>

        {/* Liste des articles avec Accordion */}
        {items.length > 0 && (
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-3 mb-6"
          >
            {items.map((item, index) => {
              // Utiliser les valeurs observées en temps réel
              const currentItem = watchedItems[index] || item;
              const quantity = currentItem.quantity || 1;
              const unitPrice = currentItem.unitPrice || 0;
              const vatRate = currentItem.vatRate || 0;
              const discount = currentItem.discount || 0;
              const discountType = currentItem.discountType || 'percentage';
              const unit = currentItem.unit || 'unité';
              const description = currentItem.description || `Article ${index + 1}`;
              
              // Calculer le total en temps réel
              let subtotal = quantity * unitPrice;
              if (discount > 0) {
                if (discountType === 'percentage') {
                  subtotal = subtotal * (1 - discount / 100);
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
                        <div className="font-medium">
                          {description}
                        </div>
                        <div className="text-sm mt-1 space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{quantity} {unit}</span>
                            <span>•</span>
                            <span>{formatCurrency(unitPrice)}/{unit === 'heure' ? 'h' : unit === 'jour' ? 'j' : 'unité'}</span>
                            {discount > 0 && (
                              <span className="text-amber-600 dark:text-amber-400">
                                {discountType === 'percentage' 
                                  ? `-${discount}%` 
                                  : `-${formatCurrency(discount)}`}
                              </span>
                            )}
                          </div>
                          <div className="font-medium">
                            {formatCurrency(subtotal)} HT • {vatRate}% TVA • {formatCurrency(totalTTC)} TTC
                          </div>
                        </div>
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canEdit) {
                            removeItem(index);
                          }
                        }}
                        className={`h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            if (canEdit) {
                              removeItem(index);
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-2 px-2 overflow-visible">
                  <div className="space-y-4 pt-2">
                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor={`item-description-${index}`} className="text-sm font-medium">
                        Description de l'article
                      </Label>
                      <div className="space-y-1">
                        <Input
                          id={`item-description-${index}`}
                          {...register(`items.${index}.description`, {
                            required: 'La description est requise',
                            minLength: {
                              value: 2,
                              message: 'La description doit contenir au moins 2 caractères'
                            },
                            maxLength: {
                              value: 255,
                              message: 'La description ne doit pas dépasser 255 caractères'
                            }
                          })}
                          placeholder="Décrivez votre produit ou service"
                          disabled={!canEdit}
                          className={`h-10 rounded-lg text-sm w-full ${
                            errors?.items?.[index]?.description ? 'border-red-500' : ''
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
                      <Label htmlFor={`item-details-${index}`} className="text-sm font-medium">
                        Détails supplémentaires (optionnel)
                      </Label>
                      <Textarea
                        id={`item-details-${index}`}
                        {...register(`items.${index}.details`)}
                        placeholder="Informations complémentaires sur l'article"
                        disabled={!canEdit}
                        rows={2}
                        className="rounded-lg text-sm w-full"
                      />
                    </div>

                    {/* Quantité et Unité */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`item-quantity-${index}`} className="text-sm font-medium">
                          Quantité
                        </Label>
                        <div className="space-y-1">
                          <Input
                            id={`item-quantity-${index}`}
                            type="number"
                            {...register(`items.${index}.quantity`, { 
                              valueAsNumber: true,
                              required: 'La quantité est requise',
                              min: {
                                value: 0.01,
                                message: 'La quantité doit être supérieure à 0'
                              },
                              onChange: (e) => {
                                const quantity = parseFloat(e.target.value) || 0;
                                const unitPrice = watch(`items.${index}.unitPrice`) || 0;
                                const discount = watch(`items.${index}.discount`) || 0;
                                const discountType = watch(`items.${index}.discountType`) || 'percentage';
                                
                                const total = calculateItemTotal(quantity, unitPrice, discount, discountType);
                                setValue(`items.${index}.total`, total, { shouldDirty: true });
                              }
                            })}
                            min="0"
                            step="0.01"
                            disabled={!canEdit}
                            className={`h-10 rounded-lg text-sm w-full ${
                              errors?.items?.[index]?.quantity ? 'border-red-500' : ''
                            }`}
                          />
                          {errors?.items?.[index]?.quantity && (
                            <p className="text-xs text-red-500">
                              {errors.items[index].quantity.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Unité
                        </Label>
                        <Controller
                          name={`items.${index}.unit`}
                          defaultValue="pièce"
                          render={({ field }) => (
                            <Select
                              value={field.value || "pièce"}
                              onValueChange={field.onChange}
                              disabled={!canEdit}
                            >
                              <SelectTrigger className="h-10 w-full rounded-lg px-3 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
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
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Prix unitaire et Taux de TVA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`item-price-${index}`} className="text-sm font-medium">
                          Prix unitaire (€)
                        </Label>
                        <div className="space-y-1">
                          <Input
                            id={`item-price-${index}`}
                            type="number"
                            {...register(`items.${index}.unitPrice`, { 
                              valueAsNumber: true,
                              required: 'Le prix est requis',
                              min: {
                                value: 0,
                                message: 'Le prix doit être positif ou nul'
                              },
                              onChange: (e) => {
                                const unitPrice = parseFloat(e.target.value) || 0;
                                const quantity = watch(`items.${index}.quantity`) || 1;
                                const discount = watch(`items.${index}.discount`) || 0;
                                const discountType = watch(`items.${index}.discountType`) || 'percentage';
                                
                                const total = calculateItemTotal(quantity, unitPrice, discount, discountType);
                                setValue(`items.${index}.total`, total, { shouldDirty: true });
                              }
                            })}
                            min="0"
                            step="0.01"
                            disabled={!canEdit}
                            className={`h-10 rounded-lg text-sm w-full ${
                              errors?.items?.[index]?.unitPrice ? 'border-red-500' : ''
                            }`}
                          />
                          {errors?.items?.[index]?.unitPrice && (
                            <p className="text-xs text-red-500">
                              {errors.items[index].unitPrice.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Taux de TVA
                        </Label>
                        <Controller
                          name={`items.${index}.vatRate`}
                          defaultValue={20}
                          render={({ field }) => (
                            <Select
                              value={field.value?.toString() || "20"}
                              onValueChange={(value) => field.onChange(parseFloat(value))}
                              disabled={!canEdit}
                            >
                              <SelectTrigger className="h-10 w-full rounded-lg px-3 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0% - Exonéré</SelectItem>
                                <SelectItem value="5.5">5,5% - Taux réduit</SelectItem>
                                <SelectItem value="10">10% - Taux intermédiaire</SelectItem>
                                <SelectItem value="20">20% - Taux normal</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Texte d'exonération TVA (affiché seulement si TVA = 0%) */}
                    {watch(`items.${index}.vatRate`) === 0 && (
                      <div className="space-y-2">
                        <Label htmlFor={`item-vat-exemption-${index}`} className="text-sm font-medium">
                          Texte d'exonération de TVA
                        </Label>
                        <Controller
                          name={`items.${index}.vatExemptionText`}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!canEdit}
                            >
                              <SelectTrigger className="h-10 w-full rounded-lg px-3 text-sm">
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
                      </div>
                    )}

                    {/* Remise sur l'article */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 my-4">
                        <Separator className="flex-1" />
                        <div className="flex items-center gap-2 px-3 text-sm text-muted-foreground whitespace-nowrap">
                          <Percent className="h-4 w-4" />
                          Remise sur cet article (optionnel)
                        </div>
                        <Separator className="flex-1" />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Type de remise
                          </Label>
                          <Controller
                            name={`items.${index}.discountType`}
                            defaultValue="percentage"
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  
                                  // Mettre à jour le total lorsque le type de remise change
                                  const discount = watch(`items.${index}.discount`) || 0;
                                  const quantity = watch(`items.${index}.quantity`) || 1;
                                  const unitPrice = watch(`items.${index}.unitPrice`) || 0;
                                  
                                  const total = calculateItemTotal(quantity, unitPrice, discount, value);
                                  setValue(`items.${index}.total`, total, { shouldDirty: true });
                                }}
                                disabled={!canEdit}
                              >
                                <SelectTrigger className="w-full h-10 rounded-lg px-3 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                                  <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-discount-${index}`} className="text-sm font-medium">
                            {watch(`items.${index}.discountType`) === "percentage" ? "Pourcentage (%)" : "Montant (€)"}
                          </Label>
                          <div className="space-y-1">
                            <Input
                              id={`item-discount-${index}`}
                              type="number"
                              {...register(`items.${index}.discount`, { 
                                valueAsNumber: true,
                                min: {
                                  value: 0,
                                  message: 'La remise doit être positive ou nulle'
                                },
                                max: {
                                  value: watch(`items.${index}.discountType`) === "percentage" ? 100 : undefined,
                                  message: 'La remise ne peut pas dépasser 100%'
                                },
                                validate: (value) => {
                                  if (watch(`items.${index}.discountType`) === "percentage" && value > 100) {
                                    return 'La remise ne peut pas dépasser 100%';
                                  }
                                  return true;
                                }
                              })}
                              min="0"
                              max={watch(`items.${index}.discountType`) === "percentage" ? "100" : undefined}
                              step="0.01"
                              disabled={!canEdit}
                              className={`w-full h-10 rounded-lg text-sm ${
                                errors?.items?.[index]?.discount ? 'border-red-500' : ''
                              }`}
                              onChange={(e) => {
                                const discountValue = parseFloat(e.target.value) || 0;
                                const quantity = watch(`items.${index}.quantity`) || 1;
                                const unitPrice = watch(`items.${index}.unitPrice`) || 0;
                                const discountType = watch(`items.${index}.discountType`) || 'percentage';
                                
                                const total = calculateItemTotal(quantity, unitPrice, discountValue, discountType);
                                
                                // Mettre à jour le total HT
                                setValue(`items.${index}.total`, total, { shouldDirty: true });
                                
                                // Déclencher manuellement la validation et la mise à jour du formulaire
                                const event = { target: { value: e.target.value } };
                                register(`items.${index}.discount`).onChange(event);
                              }}
                            />
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
                </AccordionContent>
              </AccordionItem>
              );
            })}
          </Accordion>
        )}
        
        {/* État vide */}
        {items.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">Aucun article ajouté</h3>
            <p className="text-sm mb-4">Commencez par ajouter un article à votre facture</p>
          </div>
        )}

        {/* Total HT des articles */}
        {items.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total HT des articles :</span>
              <span className="text-lg font-semibold">
                {formatCurrency(
                  watchedItems.reduce((sum, item, index) => {
                    const quantity = item?.quantity || 1;
                    const unitPrice = item?.unitPrice || 0;
                    const discount = item?.discount || 0;
                    const discountType = item?.discountType || 'percentage';
                    
                    return sum + calculateItemTotal(quantity, unitPrice, discount, discountType);
                  }, 0)
                )}
              </span>
            </div>
          </div>
        )}

        {/* Bouton ajouter article en bas */}
        {items.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => addItem()}
              disabled={!canEdit}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un article
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
