"use client";

import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { useCreateProduct, useUpdateProduct } from "@/src/hooks/useProducts";
import { toast } from "@/src/components/ui/sonner";
import { useState } from "react";
import { PackagePlusIcon } from "lucide-react";

// Options prédéfinies pour les champs select
const VAT_RATES = [
  { value: "0", label: "0%" },
  { value: "5.5", label: "5.5%" },
  { value: "10", label: "10%" },
  { value: "20", label: "20%" },
];

// Unités utilisées dans les devis
const UNITS = [
  { value: "unité", label: "unité" },
  { value: "heure", label: "heure" },
  { value: "jour", label: "jour" },
  { value: "mois", label: "mois" },
  { value: "g", label: "g - gramme" },
  { value: "kg", label: "kg - kilogramme" },
  { value: "l", label: "l - litre" },
  { value: "m", label: "m - mètre" },
  { value: "m²", label: "m² - mètre carré" },
  { value: "m³", label: "m³ - mètre cube" },
  { value: "ampère", label: "ampère" },
  { value: "article", label: "article" },
  { value: "cm", label: "cm - centimètre" },
  { value: "m³/h", label: "m³/h - mètre cube par heure" },
  { value: "gigajoule", label: "gigajoule" },
  { value: "gigawatt", label: "gigawatt" },
  { value: "gigawattheure", label: "gigawattheure" },
  { value: "semestre", label: "semestre" },
  { value: "joule", label: "joule" },
  { value: "kilojoule", label: "kilojoule" },
  { value: "kilovar", label: "kilovar" },
  { value: "kilowatt", label: "kilowatt" },
  { value: "kilowattheure", label: "kilowattheure" },
  { value: "mégajoule", label: "mégajoule" },
  { value: "mégawatt", label: "mégawatt" },
  { value: "mégawattheure", label: "mégawattheure" },
  { value: "mg", label: "mg - milligramme" },
  { value: "ml", label: "ml - millilitre" },
  { value: "mm", label: "mm - millimètre" },
  { value: "minute", label: "minute" },
  { value: "paire", label: "paire" },
  { value: "trimestre", label: "trimestre" },
  { value: "seconde", label: "seconde" },
  { value: "ensemble", label: "ensemble" },
  { value: "t", label: "t - tonne" },
  { value: "deux semaines", label: "deux semaines" },
  { value: "wattheure", label: "wattheure" },
  { value: "semaine", label: "semaine" },
  { value: "année", label: "année" },
];

export default function ProductModal({ product, onSave, open, onOpenChange }) {
  const { createProduct, loading: createLoading } = useCreateProduct();
  const { updateProduct, loading: updateLoading } = useUpdateProduct();
  const isEditing = !!product;
  const loading = createLoading || updateLoading;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      reference: "",
      unitPrice: "",
      vatRate: "20",
      unit: "unité",
      category: "",
      description: "",
    },
  });

  // Observer les valeurs pour les calculs en temps réel
  const watchedUnitPrice = watch("unitPrice");
  const watchedVatRate = watch("vatRate");

  // Calculer le prix TTC
  const priceWithVat = useMemo(() => {
    const unitPrice = parseFloat(watchedUnitPrice) || 0;
    const vatRate = parseFloat(watchedVatRate) || 0;
    return unitPrice * (1 + vatRate / 100);
  }, [watchedUnitPrice, watchedVatRate]);

  // Calculer le montant de la TVA
  const vatAmount = useMemo(() => {
    const unitPrice = parseFloat(watchedUnitPrice) || 0;
    const vatRate = parseFloat(watchedVatRate) || 0;
    return unitPrice * (vatRate / 100);
  }, [watchedUnitPrice, watchedVatRate]);

  // Effet pour pré-remplir le formulaire quand on édite un produit
  useEffect(() => {
    if (product && open) {
      reset({
        name: product.name || "",
        reference: product.reference || "",
        unitPrice: product.unitPrice?.toString() || "",
        vatRate: product.vatRate?.toString() || "20",
        unit: product.unit || "unité",
        category: product.category || "",
        description: product.description || "",
      });
    } else if (!product && open) {
      // Reset pour nouveau produit
      reset({
        name: "",
        reference: "",
        unitPrice: "",
        vatRate: "20",
        unit: "unité",
        category: "",
        description: "",
      });
    }
  }, [product, open, reset]);

  const onSubmit = async (formData) => {
    try {
      const productData = {
        ...formData,
        unitPrice: parseFloat(formData.unitPrice),
        vatRate: parseFloat(formData.vatRate),
      };

      let result;
      if (isEditing) {
        result = await updateProduct(product.id, productData);
      } else {
        result = await createProduct(productData);
      }

      if (result) {
        onSave?.(result);
        onOpenChange(false);
        // Reset sera fait automatiquement par l'useEffect quand le modal se ferme
      }
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden">
          Ajouter un produit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="flex flex-col gap-2">
          <DialogHeader>
            <DialogTitle className="text-left">
              {product ? "Modifier le produit" : "Ajouter un produit"}
            </DialogTitle>
            <DialogDescription className="text-left">
              {product
                ? "Modifiez les informations du produit"
                : "Créez un nouveau produit pour votre catalogue"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 max-h-[70vh] p-1 overflow-y-auto"
        >
          <div className="space-y-4">
            {/* Nom du produit */}
            <div className="space-y-2">
              <Label>Nom du produit *</Label>
              <Input
                placeholder="Ex: Ordinateur portable Dell XPS 13"
                {...register("name", { 
                  required: "Le nom du produit est requis",
                  minLength: {
                    value: 2,
                    message: "Le nom doit contenir au moins 2 caractères"
                  }
                })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Référence */}
            <div className="space-y-2">
              <Label>Référence</Label>
              <Input
                placeholder="Ex: DELL-XPS13-2024"
                {...register("reference")}
              />
              <p className="text-xs text-muted-foreground">
                Référence interne pour identifier le produit
              </p>
            </div>


            {/* Prix unitaire, TVA et Unité */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prix unitaire (HT) *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("unitPrice", { 
                      required: "Le prix unitaire est requis",
                      min: {
                        value: 0,
                        message: "Le prix doit être positif"
                      }
                    })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    €
                  </span>
                </div>
                {errors.unitPrice && (
                  <p className="text-sm text-red-500">{errors.unitPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Taux de TVA (%) *</Label>
                <Controller
                  name="vatRate"
                  control={control}
                  rules={{ required: "Le taux de TVA est requis" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="TVA" />
                      </SelectTrigger>
                      <SelectContent>
                        {VAT_RATES.map((rate) => (
                          <SelectItem key={rate.value} value={rate.value}>
                            {rate.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.vatRate && (
                  <p className="text-sm text-red-500">{errors.vatRate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Unité *</Label>
                <Controller
                  name="unit"
                  control={control}
                  rules={{ required: "L'unité est requise" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.unit && (
                  <p className="text-sm text-red-500">{errors.unit.message}</p>
                )}
              </div>
            </div>


            {/* Catégorie */}
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input
                placeholder="Ex: Matériel informatique, Fournitures de bureau..."
                {...register("category")}
              />
              <p className="text-xs text-muted-foreground">
                Séparez les catégories par des virgules si nécessaire
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Description détaillée du produit..."
                rows={4}
                {...register("description")}
              />
              <p className="text-xs text-muted-foreground">
                Description qui apparaîtra sur vos devis et factures
              </p>
            </div>

            {/* Aperçu du prix TTC */}
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Aperçu des prix
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Prix HT :</span>
                  <span className="font-mono">
                    {(watchedUnitPrice && parseFloat(watchedUnitPrice) > 0) ? 
                      `${parseFloat(watchedUnitPrice).toFixed(2)} €` : '0.00 €'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>TVA ({watchedVatRate}%) :</span>
                  <span className="font-mono">
                    {(watchedUnitPrice && parseFloat(watchedUnitPrice) > 0) ? 
                      `${vatAmount.toFixed(2)} €` : '0.00 €'}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Prix TTC :</span>
                  <span className="font-mono text-primary">
                    {(watchedUnitPrice && parseFloat(watchedUnitPrice) > 0) ? 
                      `${priceWithVat.toFixed(2)} €` : '0.00 €'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
