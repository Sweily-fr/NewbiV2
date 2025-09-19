"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { CreditCard, Building2, Hash, Info, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/src/components/ui/alert";

export function CoordonneesBancairesSection({
  register,
  errors,
  watch,
  setValue,
  session,
  organization,
}) {
  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h2 className="text-lg font-medium mb-1">Coordonnées bancaires</h2>
        <Separator />

        {/* Information sur la validation conditionnelle */}
        <div className="mb-8 mt-12">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Coordonnées bancaires optionnelles</strong>
              <br />
              Vous pouvez laisser tous les champs vides. Si vous renseignez une
              information bancaire, les trois champs (IBAN, BIC et nom de
              banque) deviennent obligatoires.
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        {/* Formulaire des coordonnées bancaires */}
        <div className="space-y-6 mt-8">
          {/* IBAN */}
          <div className="space-y-2">
            <Label
              htmlFor="iban"
              className="flex items-center gap-2 text-sm font-normal"
            >
              <Hash className="h-4 w-4 text-gray-500" />
              IBAN *
            </Label>
            <Input
              id="iban"
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className="w-full"
              {...register("bankDetails.iban")}
            />
            {errors.bankDetails?.iban && (
              <p className="text-sm text-red-500">
                {errors.bankDetails.iban.message}
              </p>
            )}
            <p className="text-xs text-gray-600">
              Format international (ex: FR76 1234 5678 9012 3456 7890 123)
            </p>
          </div>

          {/* BIC */}
          <div className="space-y-2">
            <Label
              htmlFor="bic"
              className="flex items-center gap-2 text-sm font-normal"
            >
              <Building2 className="h-4 w-4 text-gray-500" />
              BIC/SWIFT *
            </Label>
            <Input
              id="bic"
              placeholder="BNPAFRPP"
              className="w-full"
              {...register("bankDetails.bic")}
            />
            {errors.bankDetails?.bic && (
              <p className="text-sm text-red-500">
                {errors.bankDetails.bic.message}
              </p>
            )}
            <p className="text-xs text-gray-600">
              Code d'identification de votre banque (8 ou 11 caractères)
            </p>
          </div>

          {/* Nom de la banque */}
          <div className="space-y-2">
            <Label
              htmlFor="bankName"
              className="flex items-center gap-2 text-sm font-normal"
            >
              <CreditCard className="h-4 w-4 text-gray-500" />
              Nom de la banque *
            </Label>
            <Input
              id="bankName"
              placeholder="BNP Paribas"
              className="w-full"
              {...register("bankDetails.bankName")}
            />
            {errors.bankDetails?.bankName && (
              <p className="text-sm text-red-500">
                {errors.bankDetails.bankName.message}
              </p>
            )}
            <p className="text-xs text-gray-600">
              Nom de votre établissement bancaire
            </p>
          </div>

          <Separator />

          {/* Information de sécurité */}
          <Alert>
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Sécurité des données bancaires</strong>
              <br />
              Vos informations bancaires sont chiffrées et stockées de manière
              sécurisée. Elles ne seront utilisées que pour les virements et
              facturations.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}

export default CoordonneesBancairesSection;
