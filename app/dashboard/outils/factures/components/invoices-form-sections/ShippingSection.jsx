"use client";

import { useFormContext } from "react-hook-form";
import { Truck, MapPin } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";

// Fonctions de validation qui accèdent aux données du formulaire
const createValidationFunction = (fieldName, errorMessage) => {
  return (value, formValues) => {
    const billShipping = formValues?.shipping?.billShipping;
    if (billShipping && (!value || !value.toString().trim())) {
      return errorMessage;
    }
    return true;
  };
};

const createAmountValidation = () => {
  return (value, formValues) => {
    const billShipping = formValues?.shipping?.billShipping;
    if (billShipping && (!value || value <= 0)) {
      return "Le montant de livraison est requis et doit être positif";
    }
    return true;
  };
};

export default function ShippingSection({ canEdit, validationErrors = {} }) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();
  
  // Helper pour vérifier si un champ a une erreur de validation
  const hasValidationError = (fieldName) => {
    if (!validationErrors.shipping) return false;
    const message = validationErrors.shipping.message || "";
    return message.toLowerCase().includes(fieldName.toLowerCase());
  };

  const data = watch();
  const shipping = data.shipping || {};
  const billShipping = shipping.billShipping || false;
  const client = data.client;

  // Fonction pour remplir automatiquement les informations de livraison du client
  const fillFromClientShipping = () => {
    if (client?.shippingAddress) {
      setValue(
        "shipping.shippingAddress",
        {
          fullName: client.shippingAddress.fullName || "",
          street: client.shippingAddress.street || "",
          city: client.shippingAddress.city || "",
          postalCode: client.shippingAddress.postalCode || "",
          country: client.shippingAddress.country || "",
        },
        { shouldDirty: true }
      );
    }
  };

  // Fonction pour vider les champs de livraison
  const clearShippingFields = () => {
    setValue(
      "shipping.shippingAddress",
      {
        fullName: "",
        street: "",
        city: "",
        postalCode: "",
        country: "",
      },
      { shouldDirty: true }
    );
    setValue("shipping.shippingAmountHT", 0, { shouldDirty: true });
    setValue("shipping.shippingVatRate", 20, { shouldDirty: true });
  };

  // Gérer le changement de la case à cocher
  const handleBillShippingChange = (checked) => {
    setValue("shipping.billShipping", checked, { shouldDirty: true });

    if (!checked) {
      clearShippingFields();
    } else if (client?.shippingAddress) {
      // Auto-remplir avec les informations du client si disponibles
      fillFromClientShipping();
    }
  };

  return (
    <Card className="border-0 shadow-none bg-transparent mb-0 p-0">
      <CardContent className="space-y-6 p-0">
        <div className="flex items-center gap-2 my-8">
          <Separator className="flex-1" />
          <div className="flex items-center gap-2 px-3 text-sm font-normal text-muted-foreground">
            <Truck className="h-4 w-4" />
            Facturer la livraison
          </div>
          <Separator className="flex-1" />
        </div>

        {/* Case à cocher pour activer la facturation de livraison */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="billShipping"
            checked={billShipping}
            onCheckedChange={handleBillShippingChange}
            disabled={!canEdit}
          />
          <Label
            htmlFor="billShipping"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Facturer la livraison
          </Label>
        </div>

        {/* Champs de livraison (affichés seulement si la case est cochée) */}
        {billShipping && (
          <div className="space-y-4 pl-6 border-l-2 border-muted">
            {/* Bouton pour remplir depuis les informations client */}
            {client?.shippingAddress && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillFromClientShipping}
                  disabled={!canEdit}
                  className="text-xs"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Utiliser l'adresse du client
                </Button>
              </div>
            )}

            {/* Nom complet */}
            <div className="space-y-2">
              <Label htmlFor="shippingFullName" className="font-normal">Nom complet *</Label>
              <Input
                id="shippingFullName"
                placeholder="Nom complet du destinataire"
                disabled={!canEdit}
                {...register("shipping.shippingAddress.fullName")}
                className={hasValidationError("nom complet") ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {(errors?.shipping?.shippingAddress?.fullName || hasValidationError("nom complet")) && (
                <p className="text-xs text-destructive">
                  {errors?.shipping?.shippingAddress?.fullName?.message || "Le nom complet est requis"}
                </p>
              )}
            </div>

            {/* Adresse de livraison */}
            <div className="space-y-2">
              <Label htmlFor="shippingStreet" className="font-normal">Adresse de livraison *</Label>
              <Textarea
                id="shippingStreet"
                placeholder="Adresse complète de livraison"
                disabled={!canEdit}
                rows={2}
                {...register("shipping.shippingAddress.street", {
                  validate: createValidationFunction(
                    "street",
                    "L'adresse de livraison est requise"
                  ),
                })}
                className={hasValidationError("adresse") ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {(errors?.shipping?.shippingAddress?.street || hasValidationError("adresse")) && (
                <p className="text-xs text-destructive">
                  {errors?.shipping?.shippingAddress?.street?.message || "L'adresse est requise"}
                </p>
              )}
            </div>

            {/* Ville et Code postal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingCity" className="font-normal">Ville *</Label>
                <Input
                  id="shippingCity"
                  placeholder="Ville"
                  disabled={!canEdit}
                  {...register("shipping.shippingAddress.city", {
                    validate: createValidationFunction(
                      "city",
                      "La ville est requise"
                    ),
                  })}
                  className={hasValidationError("ville") ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {(errors?.shipping?.shippingAddress?.city || hasValidationError("ville")) && (
                  <p className="text-xs text-destructive">
                    {errors?.shipping?.shippingAddress?.city?.message || "La ville est requise"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingPostalCode" className="font-normal">Code postal *</Label>
                <Input
                  id="shippingPostalCode"
                  placeholder="Code postal"
                  disabled={!canEdit}
                  {...register("shipping.shippingAddress.postalCode", {
                    validate: createValidationFunction(
                      "postalCode",
                      "Le code postal est requis"
                    ),
                  })}
                  className={hasValidationError("code postal") ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {(errors?.shipping?.shippingAddress?.postalCode || hasValidationError("code postal")) && (
                  <p className="text-xs text-destructive">
                    {errors?.shipping?.shippingAddress?.postalCode?.message || "Le code postal est requis"}
                  </p>
                )}
              </div>
            </div>

            {/* Pays */}
            <div className="space-y-2">
              <Label htmlFor="shippingCountry" className="font-normal">Pays *</Label>
              <Input
                id="shippingCountry"
                placeholder="Pays"
                disabled={!canEdit}
                {...register("shipping.shippingAddress.country", {
                  validate: createValidationFunction(
                    "country",
                    "Le pays est requis"
                  ),
                })}
                className={hasValidationError("pays") ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {(errors?.shipping?.shippingAddress?.country || hasValidationError("pays")) && (
                <p className="text-xs text-destructive">
                  {errors?.shipping?.shippingAddress?.country?.message || "Le pays est requis"}
                </p>
              )}
            </div>

            {/* Montant et TVA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingAmountHT" className="font-normal">Montant HT (€) *</Label>
                <Input
                  id="shippingAmountHT"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={!canEdit}
                  {...register("shipping.shippingAmountHT", {
                    valueAsNumber: true,
                    validate: createAmountValidation(),
                  })}
                  className={hasValidationError("coût") ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {hasValidationError("coût") && (
                  <p className="text-xs text-destructive">
                    Le coût de livraison est requis
                  </p>
                )}
                {errors?.shipping?.shippingAmountHT && (
                  <p className="text-sm text-destructive">
                    {errors.shipping.shippingAmountHT.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingVatRate" className="font-normal">TVA (%)</Label>
                <Select
                  value={shipping.shippingVatRate?.toString() || "20"}
                  onValueChange={(value) =>
                    setValue("shipping.shippingVatRate", parseFloat(value), {
                      shouldDirty: true,
                    })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Taux de TVA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5.5">5,5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
                {errors?.shipping?.shippingVatRate && (
                  <p className="text-sm text-destructive">
                    {errors.shipping.shippingVatRate.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
