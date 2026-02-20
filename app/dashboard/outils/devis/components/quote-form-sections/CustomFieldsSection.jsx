"use client";

import { useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";

export default function CustomFieldsSection({
  canEdit,
  validationErrors = {},
}) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();
  const data = watch();

  // Helper pour vérifier si un champ personnalisé a une erreur
  const getCustomFieldError = (index) => {
    if (!validationErrors?.customFields?.details) return null;
    return validationErrors.customFields.details.find(
      (detail) => detail.index === index
    );
  };

  return (
    <Card className="border-0 shadow-none bg-transparent mb-0 mt-8 p-0">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-medium text-lg">
          Champs personnalisés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {data.customFields && data.customFields.length > 0 ? (
          <div className="space-y-3">
            {data.customFields.map((field, index) => {
              const fieldError = getCustomFieldError(index);
              const hasNameError = fieldError?.errors?.includes(
                "nom du champ manquant"
              );
              const hasValueError =
                fieldError?.errors?.includes("valeur manquante");

              return (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 rounded-lg"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Nom du champ</Label>
                    <div className="space-y-1">
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
                        className={
                          hasNameError
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {hasNameError && (
                        <p className="text-xs text-destructive">
                          Le nom du champ est requis
                        </p>
                      )}
                    </div>
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
                          className={
                            errors?.customFields?.[index]?.value ||
                            hasValueError
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {(errors?.customFields?.[index]?.value ||
                          hasValueError) && (
                          <p className="text-xs text-destructive">
                            {errors?.customFields?.[index]?.value?.message ||
                              "La valeur du champ est requise"}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="danger"
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              Aucun champ personnalisé ajouté
            </p>
          </div>
        )}

        <Button
          onClick={() => {
            const newFields = [
              ...(data.customFields || []),
              { name: "", value: "" },
            ];
            setValue("customFields", newFields, { shouldDirty: true });
          }}
          disabled={!canEdit}
          size="lg"
          className="w-full"
        >
          Ajouter un champ personnalisé
        </Button>
      </CardContent>
    </Card>
  );
}
