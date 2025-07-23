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

export default function QuoteSettingsView({ canEdit, onCancel, onSave }) {
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
    if (data.showBankDetails && (!data.bankDetails || !data.bankDetails.iban)) {
      // Importer depuis companyInfo si disponible
      if (data.companyInfo?.bankDetails) {
        setValue("bankDetails", {
          iban: data.companyInfo.bankDetails.iban || "",
          bic: data.companyInfo.bankDetails.bic || "",
          bankName: data.companyInfo.bankDetails.bankName || "",
        });
      }
    }
  }, [data.showBankDetails, data.companyInfo, data.bankDetails, setValue]);

  const handleSave = () => {
    if (onSave) {
      onSave(data);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-auto-hide">
        <div className="space-y-6">
          {/* Section Notes et bas de page */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                <Tag className="h-5 w-5" />
                Notes et bas de page
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {/* Notes d'en-tête */}
              <div className="space-y-2">
                <Label htmlFor="headerNotes" className="text-sm font-medium">
                  Notes d'en-tête
                </Label>
                <Textarea
                  id="headerNotes"
                  placeholder="Notes qui apparaîtront en haut du devis..."
                  className="min-h-[80px] resize-none"
                  disabled={!canEdit}
                  {...register("headerNotes")}
                />
                <p className="text-xs text-muted-foreground">
                  Ces notes apparaîtront en haut de votre devis, après les informations client.
                </p>
              </div>

              {/* Notes de bas de page */}
              <div className="space-y-2">
                <Label htmlFor="footerNotes" className="text-sm font-medium">
                  Notes de bas de page
                </Label>
                <Textarea
                  id="footerNotes"
                  placeholder="Conditions générales, modalités de paiement..."
                  className="min-h-[80px] resize-none"
                  disabled={!canEdit}
                  {...register("footerNotes")}
                />
                <p className="text-xs text-muted-foreground">
                  Ces notes apparaîtront en bas de votre devis, après le tableau des articles.
                </p>
              </div>

              {/* Conditions générales */}
              <div className="space-y-2">
                <Label htmlFor="termsAndConditions" className="text-sm font-medium">
                  Conditions générales
                </Label>
                <Textarea
                  id="termsAndConditions"
                  placeholder="Conditions générales de vente, garanties..."
                  className="min-h-[100px] resize-none"
                  disabled={!canEdit}
                  {...register("termsAndConditions")}
                />
                <p className="text-xs text-muted-foreground">
                  Conditions générales qui s'appliquent à ce devis.
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Section Coordonnées bancaires */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                <Settings className="h-5 w-5" />
                Coordonnées bancaires
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {/* Checkbox pour afficher les coordonnées bancaires */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showBankDetails"
                  checked={data.showBankDetails || false}
                  onCheckedChange={(checked) =>
                    setValue("showBankDetails", checked)
                  }
                  disabled={!canEdit}
                />
                <Label htmlFor="showBankDetails" className="text-sm font-medium">
                  Afficher les coordonnées bancaires sur le devis
                </Label>
              </div>

              {/* Coordonnées bancaires conditionnelles */}
              {data.showBankDetails && (
                <div className="space-y-4 pl-6 border-l-2 border-muted">
                  <Alert>
                    <AlertDescription>
                      Les coordonnées bancaires seront affichées en bas du devis pour faciliter les paiements.
                    </AlertDescription>
                  </Alert>

                  {/* IBAN */}
                  <div className="space-y-2">
                    <Label htmlFor="bankDetails.iban" className="text-sm font-medium">
                      IBAN <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bankDetails.iban"
                      placeholder="FR76 1234 5678 9012 3456 7890 123"
                      disabled={!canEdit}
                      {...register("bankDetails.iban", {
                        required: data.showBankDetails ? "IBAN requis" : false,
                        validate: validateIBAN,
                      })}
                      className={errors.bankDetails?.iban ? "border-red-500" : ""}
                    />
                    {errors.bankDetails?.iban && (
                      <p className="text-sm text-red-500">
                        {errors.bankDetails.iban.message}
                      </p>
                    )}
                  </div>

                  {/* BIC */}
                  <div className="space-y-2">
                    <Label htmlFor="bankDetails.bic" className="text-sm font-medium">
                      BIC/SWIFT <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bankDetails.bic"
                      placeholder="BNPAFRPPXXX"
                      disabled={!canEdit}
                      {...register("bankDetails.bic", {
                        required: data.showBankDetails ? "BIC/SWIFT requis" : false,
                        validate: validateBIC,
                      })}
                      className={errors.bankDetails?.bic ? "border-red-500" : ""}
                    />
                    {errors.bankDetails?.bic && (
                      <p className="text-sm text-red-500">
                        {errors.bankDetails.bic.message}
                      </p>
                    )}
                  </div>

                  {/* Nom de la banque */}
                  <div className="space-y-2">
                    <Label htmlFor="bankDetails.bankName" className="text-sm font-medium">
                      Nom de la banque
                    </Label>
                    <Input
                      id="bankDetails.bankName"
                      placeholder="BNP Paribas"
                      disabled={!canEdit}
                      {...register("bankDetails.bankName")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Nom de votre établissement bancaire (optionnel).
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Boutons d'action fixes en bas */}
      <div className="flex-shrink-0 pt-6 border-t bg-background">
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={!canEdit}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canEdit}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
}
