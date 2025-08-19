"use client";

import { useFormContext } from "react-hook-form";
import { Percent, Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";

// Fonction de validation pour la valeur de remise
const validateDiscount = (value, { discountType }) => {
  if (discountType && value === undefined) {
    return "Une valeur de remise est requise";
  }
  if (value < 0) {
    return "La remise ne peut pas être négative";
  }
  if (discountType === "PERCENTAGE" && value > 100) {
    return "La remise ne peut pas dépasser 100%";
  }
  return true;
};

export default function DiscountsAndTotalsSection({ canEdit }) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();
  const data = watch();
  return (
    <Card className="shadow-none border-none bg-transparent p-4 overflow-visible">
      <CardContent className="space-y-6 p-0">
        <div className="flex items-center gap-2 my-8">
          <Separator className="flex-1" />
          <div className="flex items-center gap-2 px-3 text-sm font-normal text-muted-foreground">
            <Percent className="h-4 w-4" />
            Remises et totaux
          </div>
          <Separator className="flex-1" />
        </div>
        {/* Configuration de la remise */}
        <div className="flex gap-4">
          {/* Type de remise - 50% de la largeur */}
          <div className="w-1/2 space-y-2">
            <Label className="text-sm font-normal">Type de remise</Label>
            <div className="space-y-1">
              <Select
                value={data.discountType || "PERCENTAGE"}
                onValueChange={(value) => {
                  setValue("discountType", value, { shouldDirty: true });
                  // Réinitialiser la valeur de la remise lors du changement de type
                  if (data.discount !== undefined) {
                    setValue("discount", data.discount, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
                disabled={!canEdit}
              >
                <SelectTrigger
                  className={`w-full text-sm ${
                    errors?.discountType ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Pourcentage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
                  <SelectItem value="FIXED">Montant fixe (€)</SelectItem>
                </SelectContent>
              </Select>
              {errors?.discountType && (
                <p className="text-xs text-red-500">
                  {errors.discountType.message}
                </p>
              )}
            </div>
          </div>

          {/* Valeur de la remise - 50% de la largeur */}
          <div className="w-1/2 space-y-2">
            <Label htmlFor="discount-value" className="text-sm font-normal">
              Valeur de la remise
            </Label>
            <div className="space-y-1">
              <Input
                id="discount-value"
                type="number"
                {...register("discount", {
                  required: data.discountType
                    ? "Une valeur de remise est requise"
                    : false,
                  min: {
                    value: 0,
                    message: "La remise ne peut pas être négative",
                  },
                  max:
                    data.discountType === "PERCENTAGE"
                      ? {
                          value: 100,
                          message: "La remise ne peut pas dépasser 100%",
                        }
                      : undefined,
                  valueAsNumber: true,
                  validate: (value) =>
                    validateDiscount(value, {
                      discountType: data.discountType,
                    }),
                })}
                defaultValue={data.discount || 0}
                min="0"
                step="0.01"
                disabled={!canEdit || !data.discountType}
                placeholder={
                  data.discountType === "PERCENTAGE" ? "Ex: 10" : "Ex: 100"
                }
                className={`text-sm ${
                  errors?.discount ? "border-red-500" : ""
                }`}
              />
              {errors?.discount && (
                <p className="text-xs text-red-500">
                  {errors.discount.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Champs personnalisés */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal">Champs personnalisés</Label>
            <span className="text-xs text-muted-foreground">
              *Informations supplémentaires à afficher sur la facture
            </span>
          </div>
          {data.customFields && data.customFields.length > 0 ? (
            <div className="space-y-3">
              {data.customFields.map((field, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 rounded-lg"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Nom du champ</Label>
                    <Input
                      value={field.name || ""}
                      onChange={(e) => {
                        const newFields = [...(data.customFields || [])];
                        newFields[index] = {
                          ...newFields[index],
                          name: e.target.value,
                        };
                        setValue("customFields", newFields, {
                          shouldDirty: true,
                        });
                      }}
                      placeholder="Ex: Référence projet"
                      disabled={!canEdit}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Valeur</Label>
                    <div className="flex gap-2">
                      <div className="space-y-1 flex-1">
                        <Input
                          {...register(`customFields.${index}.value`, {
                            required: "La valeur du champ est requise",
                            maxLength: {
                              value: 100,
                              message:
                                "La valeur ne doit pas dépasser 100 caractères",
                            },
                          })}
                          defaultValue={field.value || ""}
                          onChange={(e) => {
                            const newFields = [...(data.customFields || [])];
                            newFields[index] = {
                              ...newFields[index],
                              value: e.target.value,
                            };
                            setValue("customFields", newFields, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          placeholder="Ex: PROJ-2024-001"
                          disabled={!canEdit}
                          className={`text-sm ${
                            errors?.customFields?.[index]?.value
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        {errors?.customFields?.[index]?.value && (
                          <p className="text-xs text-red-500">
                            {errors.customFields[index].value.message}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFields = data.customFields.filter(
                            (_, i) => i !== index
                          );
                          setValue("customFields", newFields, {
                            shouldDirty: true,
                          });
                        }}
                        disabled={!canEdit}
                        className="h-auto bg-red-50 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                Aucun champ personnalisé ajouté
              </p>
            </div>
          )}

          <Button
            variant="default"
            onClick={() => {
              const newFields = [
                ...(data.customFields || []),
                { name: "", value: "" },
              ];
              setValue("customFields", newFields, { shouldDirty: true });
            }}
            disabled={!canEdit}
            size="lg"
            className="w-full h-10 font-normal"
          >
            Ajouter un champ personnalisé
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
