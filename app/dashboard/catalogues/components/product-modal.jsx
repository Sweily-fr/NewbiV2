"use client";

import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
          Ajouter un produit / service
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`flex flex-col p-0 overflow-hidden ${
          isMobile
            ? "!fixed !inset-0 !w-screen !max-w-none !m-0 !rounded-none !translate-x-0 !translate-y-0"
            : "max-h-[90vh] my-4 sm:max-w-lg"
        }`}
        style={isMobile ? { height: '100dvh' } : {}}
      >
        {/* Header fixe */}
        <div className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-left">
              {product ? "Modifier le produit et/ou service" : "Ajouter un produit et/ou service"}
            </DialogTitle>
            <DialogDescription className="text-left">
              {product
                ? "Modifiez les informations du produit et/ou service"
                : "Créez un nouveau produit et/ou service pour votre catalogue"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Contenu scrollable */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-4">
            {/* Nom du produit */}
            <div className="space-y-2">
              <Label className="font-normal">Nom du produit *</Label>
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
              <Label className="font-normal">Référence</Label>
              <Input
                placeholder="Ex: DELL-XPS13-2024"
                {...register("reference")}
              />
              <p className="text-xs text-muted-foreground">
                Référence interne pour identifier le produit
              </p>
            </div>


            {/* Prix unitaire, TVA et Unité */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-normal">Prix unitaire (HT) *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pr-8"
                    {...register("unitPrice", { 
                      required: "Le prix unitaire est requis",
                      min: {
                        value: 0,
                        message: "Le prix doit être positif"
                      }
                    })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    €
                  </span>
                </div>
                {errors.unitPrice && (
                  <p className="text-sm text-red-500">{errors.unitPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-normal">Taux de TVA (%) *</Label>
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
                <Label className="font-normal">Unité *</Label>
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
              <Label className="font-normal">Catégorie</Label>
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
              <Label className="font-normal">Description</Label>
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
          </div>

          {/* Footer dans le flux flex - s'adapte automatiquement à Safari */}
          <div 
            className="flex-shrink-0 flex gap-3 px-6 py-4 border-t bg-background"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit(onSubmit)} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Enregistrement..." : isEditing ? "Modifier le produit et/ou service" : "Créer le produit et/ou service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
