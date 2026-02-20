"use client";

import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

export default function DiscountsAndTotalsSection({ canEdit, validationErrors = {} }) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();
  const data = watch();

  // Helper pour vérifier si la remise a une erreur
  const hasDiscountError = validationErrors?.discount;

  return (
    <Card className="border-0 shadow-none bg-transparent mb-0 mt-8 p-0">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-medium text-lg">
          Remises et totaux
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">

        {/* Configuration de la remise globale */}
        <div className="flex gap-4">
          <div className="w-1/2 space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-normal">
                Type de remise globale
              </Label>
              <span className="h-4 w-4" aria-hidden="true"></span>
            </div>
            <div className="space-y-1">
              <Select
                value={data.discountType || "PERCENTAGE"}
                onValueChange={(value) => {
                  setValue("discountType", value, { shouldDirty: true });
                  if (data.discount !== undefined) {
                    setValue("discount", data.discount, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pourcentage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
                  <SelectItem value="FIXED">Montant fixe (€)</SelectItem>
                </SelectContent>
              </Select>
              {errors?.discountType && (
                <p className="text-xs text-destructive">
                  {errors.discountType.message}
                </p>
              )}
            </div>
          </div>

          <div className="w-1/2 space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="discount-value" className="text-sm font-normal">
                Valeur de la remise
              </Label>
              <span className="h-4 w-4" aria-hidden="true"></span>
            </div>
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
                })}
                min="0"
                max={data.discountType === "PERCENTAGE" ? "100" : undefined}
                step="0.01"
                disabled={!canEdit}
                placeholder={
                  data.discountType === "PERCENTAGE" ? "Ex: 10" : "Ex: 50.00"
                }
                className={hasDiscountError ? "border-destructive" : ""}
              />
              {(errors?.discount || hasDiscountError) && (
                <p className="text-xs text-destructive">
                  {errors?.discount?.message || hasDiscountError?.message || "La remise ne peut pas dépasser 100%"}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
