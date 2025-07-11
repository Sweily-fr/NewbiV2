"use client";

import { useFormContext } from "react-hook-form";
import { Tag, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

// Fonction de validation de l'IBAN
const validateIBAN = (value) => {
  if (!value) return true; // Optionnel si les coordonnées bancaires ne sont pas affichées
  // Format IBAN de base - validation simplifiée
  const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
  return ibanRegex.test(value.replace(/\s/g, '')) || "Format IBAN invalide";
};

// Fonction de validation du BIC/SWIFT
const validateBIC = (value) => {
  if (!value) return true; // Optionnel si les coordonnées bancaires ne sont pas affichées
  // Format BIC/SWIFT - 8 ou 11 caractères alphanumériques
  const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
  return bicRegex.test(value) || "Format BIC/SWIFT invalide (8 ou 11 caractères alphanumériques)";
};

export default function NotesAndFooterSection({ canEdit }) {
  const { watch, setValue, register, formState: { errors } } = useFormContext();
  const data = watch();
  return (
    <Card className="shadow-none border-none p-2 bg-transparent">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
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
              className={`mt-2 ${errors?.headerNotes ? 'border-red-500' : ''}`}
              {...register("headerNotes", {
                maxLength: {
                  value: 1000,
                  message: "Les notes d'en-tête ne doivent pas dépasser 1000 caractères"
                }
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
              className={`mt-2 ${errors?.footerNotes ? 'border-red-500' : ''}`}
              {...register("footerNotes", {
                maxLength: {
                  value: 1000,
                  message: "Les notes de bas de page ne doivent pas dépasser 1000 caractères"
                }
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
              className={`mt-2 ${errors?.termsAndConditions ? 'border-red-500' : ''}`}
              {...register("termsAndConditions", {
                maxLength: {
                  value: 2000,
                  message: "Les conditions générales ne doivent pas dépasser 2000 caractères"
                }
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

        {/* Coordonnées bancaires */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="show-bank-details"
              checked={data.showBankDetails || false}
              onCheckedChange={(checked) => setValue("showBankDetails", checked, { shouldDirty: true })}
              disabled={!canEdit}
              className="h-5 w-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="show-bank-details"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Afficher les coordonnées bancaires
              </Label>
              <p className="text-xs text-muted-foreground">
                Cochez pour inclure vos coordonnées bancaires dans la facture
              </p>
            </div>
          </div>

          {data.showBankDetails && (
            <div className="space-y-4 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Coordonnées bancaires</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Importer les coordonnées bancaires depuis les données utilisateur
                    if (data.companyInfo?.bankDetails) {
                      setValue("bankDetails.iban", data.companyInfo.bankDetails.iban || "", { shouldDirty: true });
                      setValue("bankDetails.bic", data.companyInfo.bankDetails.bic || "", { shouldDirty: true });
                      setValue("bankDetails.bankName", data.companyInfo.bankDetails.bankName || "", { shouldDirty: true });
                    }
                  }}
                  disabled={!canEdit}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Importer mes coordonnées
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-iban" className="text-sm font-medium">
                    IBAN
                  </Label>
                  <div className="space-y-1">
                    <Input
                      id="bank-iban"
                      {...register("bankDetails.iban", {
                        validate: validateIBAN,
                        required: data.showBankDetails ? "L'IBAN est requis lorsque les coordonnées bancaires sont affichées" : false
                      })}
                      defaultValue={data.bankDetails?.iban || ""}
                      placeholder="FR76 1234 5678 9012 3456 7890 123"
                      disabled={!canEdit}
                      className={`h-10 rounded-lg text-sm w-full ${
                        errors?.bankDetails?.iban ? 'border-red-500' : ''
                      }`}
                    />
                    {errors?.bankDetails?.iban && (
                      <p className="text-xs text-red-500">
                        {errors.bankDetails.iban.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-bic" className="text-sm font-medium">
                    BIC/SWIFT
                  </Label>
                  <div className="space-y-1">
                    <Input
                      id="bank-bic"
                      {...register("bankDetails.bic", {
                        validate: validateBIC,
                        required: data.showBankDetails ? "Le BIC/SWIFT est requis lorsque les coordonnées bancaires sont affichées" : false
                      })}
                      defaultValue={data.bankDetails?.bic || ""}
                      placeholder="BNPAFRPPXXX"
                      disabled={!canEdit}
                      className={`h-10 rounded-lg text-sm w-full ${
                        errors?.bankDetails?.bic ? 'border-red-500' : ''
                      }`}
                    />
                    {errors?.bankDetails?.bic && (
                      <p className="text-xs text-red-500">
                        {errors.bankDetails.bic.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-name" className="text-sm font-medium">
                  Nom de la banque
                </Label>
                <div className="space-y-1">
                  <Input
                    id="bank-name"
                    {...register("bankDetails.bankName", {
                      required: data.showBankDetails ? "Le nom de la banque est requis lorsque les coordonnées bancaires sont affichées" : false,
                      maxLength: {
                        value: 100,
                        message: "Le nom de la banque ne doit pas dépasser 100 caractères"
                      }
                    })}
                    defaultValue={data.bankDetails?.bankName || ""}
                    placeholder="BNP Paribas"
                    disabled={!canEdit}
                    className={`h-10 rounded-lg text-sm w-full ${
                      errors?.bankDetails?.bankName ? 'border-red-500' : ''
                    }`}
                  />
                  {errors?.bankDetails?.bankName && (
                    <p className="text-xs text-red-500">
                      {errors.bankDetails.bankName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
