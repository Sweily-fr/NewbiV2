"use client";

import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { Tag, Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { ColorPicker } from "@/src/components/ui/color-picker";

// Fonction de validation de l'IBAN
const validateIBAN = (value) => {
  if (!value) return true; // Optionnel si les coordonnées bancaires ne sont pas affichées
  // Format IBAN de base - validation simplifiée
  const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
  return ibanRegex.test(value.replace(/\s/g, "")) || "Format IBAN invalide";
};

// Fonction de validation du BIC/SWIFT
const validateBIC = (value) => {
  if (!value) return true; // Optionnel si les coordonnées bancaires ne sont pas affichées
  // Format BIC/SWIFT - 8 ou 11 caractères alphanumériques
  const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
  return (
    bicRegex.test(value) ||
    "Format BIC/SWIFT invalide (8 ou 11 caractères alphanumériques)"
  );
};

export default function InvoiceSettingsView({ canEdit, onCancel, onSave }) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();
  const data = watch();

  // Import automatique des coordonnées bancaires lors du chargement initial
  useEffect(() => {
    // Si showBankDetails est true et qu'il n'y a pas encore de données dans bankDetails
    // mais qu'il y a des données dans companyInfo.bankDetails (facture existante) ou userBankDetails (utilisateur actuel), les importer
    if (
      data.showBankDetails &&
      !data.bankDetails?.iban &&
      !data.bankDetails?.bic &&
      !data.bankDetails?.bankName
    ) {
      // Priorité aux données de la facture existante, sinon utiliser celles de l'utilisateur actuel
      const sourceData =
        data.companyInfo?.bankDetails &&
        (data.companyInfo.bankDetails.iban ||
          data.companyInfo.bankDetails.bic ||
          data.companyInfo.bankDetails.bankName)
          ? data.companyInfo.bankDetails
          : data.userBankDetails;

      if (
        sourceData &&
        (sourceData.iban || sourceData.bic || sourceData.bankName)
      ) {
        console.log(
          "🏦 Import automatique des coordonnées bancaires lors du chargement:",
          sourceData
        );
        setValue("bankDetails.iban", sourceData.iban || "", {
          shouldDirty: true,
        });
        setValue("bankDetails.bic", sourceData.bic || "", {
          shouldDirty: true,
        });
        setValue("bankDetails.bankName", sourceData.bankName || "", {
          shouldDirty: true,
        });
      }
    }
  }, [
    data.showBankDetails,
    data.companyInfo?.bankDetails,
    data.userBankDetails,
    data.bankDetails,
    setValue,
  ]);

  return (
    <div className="h-full flex flex-col">
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto pl-2 pr-2">
          {/* Notes et bas de page */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Notes et bas de page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Notes d'en-tête */}
              <div>
                <Label htmlFor="header-notes">Notes d'en-tête</Label>
                <div className="space-y-1">
                  <Textarea
                    id="header-notes"
                    className={`mt-2 ${errors?.headerNotes ? "border-red-500" : ""}`}
                    {...register("headerNotes", {
                      maxLength: {
                        value: 1000,
                        message:
                          "Les notes d'en-tête ne doivent pas dépasser 1000 caractères",
                      },
                    })}
                    defaultValue={data.headerNotes || ""}
                    placeholder="Notes qui apparaîtront en haut de la facture..."
                    rows={3}
                    disabled={!canEdit}
                  />
                  {errors?.headerNotes && (
                    <p className="text-xs text-red-500">
                      {errors.headerNotes.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes de bas de page */}
              <div>
                <Label htmlFor="footer-notes">Notes de bas de page</Label>
                <div className="space-y-1">
                  <Textarea
                    id="footer-notes"
                    className={`mt-2 ${errors?.footerNotes ? "border-red-500" : ""}`}
                    {...register("footerNotes", {
                      maxLength: {
                        value: 1000,
                        message:
                          "Les notes de bas de page ne doivent pas dépasser 1000 caractères",
                      },
                    })}
                    defaultValue={data.footerNotes || ""}
                    placeholder="Notes qui apparaîtront en bas de la facture..."
                    rows={3}
                    disabled={!canEdit}
                  />
                  {errors?.footerNotes && (
                    <p className="text-xs text-red-500">
                      {errors.footerNotes.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Conditions générales */}
              <div>
                <Label htmlFor="terms-conditions">Conditions générales</Label>
                <div className="space-y-1">
                  <Textarea
                    id="terms-conditions"
                    className={`mt-2 ${errors?.termsAndConditions ? "border-red-500" : ""}`}
                    {...register("termsAndConditions", {
                      maxLength: {
                        value: 2000,
                        message:
                          "Les conditions générales ne doivent pas dépasser 2000 caractères",
                      },
                    })}
                    defaultValue={data.termsAndConditions || ""}
                    placeholder="Conditions générales de vente..."
                    rows={4}
                    disabled={!canEdit}
                  />
                  {errors?.termsAndConditions && (
                    <p className="text-xs text-red-500">
                      {errors.termsAndConditions.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coordonnées bancaires */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Coordonnées bancaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Séparateur avec titre de section */}
              <div className="relative">
                <Separator />
              </div>

              {/* Afficher les coordonnées bancaires */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="show-bank-details"
                  checked={data.showBankDetails || false}
                  onCheckedChange={(checked) => {
                    setValue("showBankDetails", checked, { shouldDirty: true });

                    // Si on active l'affichage et qu'il n'y a pas encore de données, importer depuis l'utilisateur actuel
                    if (
                      checked &&
                      !data.bankDetails?.iban &&
                      !data.bankDetails?.bic &&
                      !data.bankDetails?.bankName
                    ) {
                      const sourceData = data.userBankDetails;
                      if (
                        sourceData &&
                        (sourceData.iban ||
                          sourceData.bic ||
                          sourceData.bankName)
                      ) {
                        console.log(
                          "🏦 Import automatique des coordonnées bancaires:",
                          sourceData
                        );
                        setValue("bankDetails.iban", sourceData.iban || "", {
                          shouldDirty: true,
                        });
                        setValue("bankDetails.bic", sourceData.bic || "", {
                          shouldDirty: true,
                        });
                        setValue(
                          "bankDetails.bankName",
                          sourceData.bankName || "",
                          { shouldDirty: true }
                        );
                      }
                    }
                  }}
                  disabled={!canEdit}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="show-bank-details"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Afficher les coordonnées bancaires
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Cochez pour inclure vos coordonnées bancaires sur la facture
                  </p>
                </div>
              </div>

              {/* Coordonnées bancaires - Affichage conditionnel */}
              {data.showBankDetails && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  {/* Nom de la banque */}
                  <div>
                    <Label htmlFor="bank-name">Nom de la banque</Label>
                    <div className="space-y-1">
                      <Input
                        id="bank-name"
                        className={`mt-2 ${errors?.bankDetails?.bankName ? "border-red-500" : ""}`}
                        {...register("bankDetails.bankName", {
                          maxLength: {
                            value: 100,
                            message:
                              "Le nom de la banque ne doit pas dépasser 100 caractères",
                          },
                        })}
                        defaultValue={data.bankDetails?.bankName || ""}
                        placeholder="Ex: Crédit Agricole"
                        disabled={!canEdit}
                      />
                      {errors?.bankDetails?.bankName && (
                        <p className="text-xs text-red-500">
                          {errors.bankDetails.bankName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* IBAN */}
                  <div>
                    <Label htmlFor="iban">IBAN</Label>
                    <div className="space-y-1">
                      <Input
                        id="iban"
                        className={`mt-2 ${errors?.bankDetails?.iban ? "border-red-500" : ""}`}
                        {...register("bankDetails.iban", {
                          validate: validateIBAN,
                          maxLength: {
                            value: 34,
                            message:
                              "L'IBAN ne doit pas dépasser 34 caractères",
                          },
                        })}
                        defaultValue={data.bankDetails?.iban || ""}
                        placeholder="FR76 1234 5678 9012 3456 7890 123"
                        disabled={!canEdit}
                      />
                      {errors?.bankDetails?.iban && (
                        <p className="text-xs text-red-500">
                          {errors.bankDetails.iban.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BIC/SWIFT */}
                  <div>
                    <Label htmlFor="bic">BIC/SWIFT</Label>
                    <div className="space-y-1">
                      <Input
                        id="bic"
                        className={`mt-2 ${errors?.bankDetails?.bic ? "border-red-500" : ""}`}
                        {...register("bankDetails.bic", {
                          validate: validateBIC,
                          maxLength: {
                            value: 11,
                            message:
                              "Le BIC/SWIFT ne doit pas dépasser 11 caractères",
                          },
                        })}
                        defaultValue={data.bankDetails?.bic || ""}
                        placeholder="AGRIFRPP123"
                        disabled={!canEdit}
                      />
                      {errors?.bankDetails?.bic && (
                        <p className="text-xs text-red-500">
                          {errors.bankDetails.bic.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Alerte informative */}
                  <Alert>
                    <AlertDescription>
                      Ces coordonnées bancaires apparaîtront sur votre facture
                      pour faciliter les paiements de vos clients.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Apparence */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Apparence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Couleurs côte à côte */}
              <div className="grid grid-cols-2 gap-4">
                {/* Couleur du texte */}
                <div className="space-y-2">
                  <Label htmlFor="text-color">Couleur du texte</Label>
                  <ColorPicker
                    className="w-full"
                    color={data.appearance?.textColor || "#000000"}
                    onChange={(color) => {
                      setValue("appearance.textColor", color, {
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>

                {/* Couleur des titres du header */}
                <div className="space-y-2">
                  <Label htmlFor="header-text-color">
                    Couleur des titres du tableau
                  </Label>
                  <ColorPicker
                    className="w-full"
                    color={data.appearance?.headerTextColor || "#000000"}
                    onChange={(color) => {
                      setValue("appearance.headerTextColor", color, {
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>
              </div>

              {/* Couleur de fond du header */}
              <div className="space-y-2">
                <Label htmlFor="header-bg-color">
                  Couleur de fond du tableau
                </Label>
                <ColorPicker
                  className="w-full"
                  color={data.appearance?.headerBgColor || "#f8f9fa"}
                  onChange={(color) => {
                    setValue("appearance.headerBgColor", color, {
                      shouldDirty: true,
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Boutons fixes en bas */}
      <div className="flex-shrink-0 border-t bg-background pt-4">
        <div className="max-w-2xl mx-auto flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={!canEdit}>
            Annuler
          </Button>
          <Button onClick={onSave} disabled={!canEdit}>
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
}
