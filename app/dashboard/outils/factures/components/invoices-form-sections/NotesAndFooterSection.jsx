"use client";

import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { Tag, Download, Settings, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import Link from "next/link";

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
  
  // Import automatique des coordonnées bancaires lors du chargement initial
  useEffect(() => {
    // Si showBankDetails est true et qu'il n'y a pas encore de données dans bankDetails
    // mais qu'il y a des données dans companyInfo.bankDetails (facture existante) ou userBankDetails (utilisateur actuel), les importer
    if (data.showBankDetails && 
        (!data.bankDetails?.iban && !data.bankDetails?.bic && !data.bankDetails?.bankName)) {
      
      // Priorité aux données de la facture existante, sinon utiliser celles de l'utilisateur actuel
      const sourceData = (data.companyInfo?.bankDetails && 
                         (data.companyInfo.bankDetails.iban || data.companyInfo.bankDetails.bic || data.companyInfo.bankDetails.bankName)) 
                        ? data.companyInfo.bankDetails 
                        : data.userBankDetails;
      
      if (sourceData && (sourceData.iban || sourceData.bic || sourceData.bankName)) {
        console.log('🏦 Import automatique des coordonnées bancaires lors du chargement:', sourceData);
        setValue("bankDetails.iban", sourceData.iban || "", { shouldDirty: true });
        setValue("bankDetails.bic", sourceData.bic || "", { shouldDirty: true });
        setValue("bankDetails.bankName", sourceData.bankName || "", { shouldDirty: true });
      }
    }
  }, [data.showBankDetails, data.companyInfo?.bankDetails, data.userBankDetails, data.bankDetails, setValue]);
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

        {/* Séparateur avec titre de section */}
        <div className="relative my-10">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-background px-3 text-sm font-medium text-muted-foreground">
              Coordonnées bancaires
            </span>
          </div>
        </div>

        {/* Coordonnées bancaires */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-bank-details"
              checked={data.showBankDetails || false}
              onCheckedChange={(checked) => {
                setValue("showBankDetails", checked, { shouldDirty: true });
                
                // Import automatique des coordonnées bancaires lors du check
                if (checked) {
                  // Priorité aux données de la facture existante, sinon utiliser celles de l'utilisateur actuel
                  const sourceData = (data.companyInfo?.bankDetails && 
                                     (data.companyInfo.bankDetails.iban || data.companyInfo.bankDetails.bic || data.companyInfo.bankDetails.bankName)) 
                                    ? data.companyInfo.bankDetails 
                                    : data.userBankDetails;
                  
                  if (sourceData && (sourceData.iban || sourceData.bic || sourceData.bankName)) {
                    console.log('🏦 Import manuel des coordonnées bancaires:', sourceData);
                    setValue("bankDetails.iban", sourceData.iban || "", { shouldDirty: true });
                    setValue("bankDetails.bic", sourceData.bic || "", { shouldDirty: true });
                    setValue("bankDetails.bankName", sourceData.bankName || "", { shouldDirty: true });
                  }
                }
              }}
              disabled={!canEdit}
            />
            <Label htmlFor="show-bank-details" className="text-sm font-medium">
              Afficher les coordonnées bancaires
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            Cochez cette case pour afficher vos coordonnées bancaires sur la facture
          </p>

          {/* Affichage des coordonnées importées (lecture seule) */}
          {data.showBankDetails && (data.bankDetails?.iban || data.bankDetails?.bic || data.bankDetails?.bankName) && (
            <div className="ml-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Coordonnées bancaires configurées
                  </span>
                </div>
                <Link href="/dashboard/parametres/profil">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Modifier
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">IBAN</Label>
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <p className="font-mono text-sm">{data.bankDetails?.iban || 'Non renseigné'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">BIC/SWIFT</Label>
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <p className="font-mono text-sm">{data.bankDetails?.bic || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Nom de la banque</Label>
                <div className="p-3 bg-muted/50 rounded-md border">
                  <p className="text-sm">{data.bankDetails?.bankName || 'Non renseigné'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
