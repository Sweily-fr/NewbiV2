import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { CreditCard, Building2, Hash } from "lucide-react";

export default function BankSection({ register, errors }) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            Coordonnées bancaires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* IBAN */}
          <div className="space-y-2">
            <Label
              htmlFor="bankDetails.iban"
              className="flex items-center gap-2"
            >
              <Hash className="h-4 w-4" />
              IBAN *
            </Label>
            <Input
              id="bankDetails.iban"
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              {...register("bankDetails.iban", {
                required: "L'IBAN est requis",
                pattern: {
                  value:
                    /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/,
                  message: "Format IBAN invalide",
                },
              })}
            />
            {errors.bankDetails?.iban && (
              <p className="text-sm text-red-500">
                {errors.bankDetails.iban.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Format international (ex: FR76 1234 5678 9012 3456 7890 123)
            </p>
          </div>

          {/* BIC */}
          <div className="space-y-2">
            <Label
              htmlFor="bankDetails.bic"
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              BIC/SWIFT *
            </Label>
            <Input
              id="bankDetails.bic"
              placeholder="BNPAFRPP"
              {...register("bankDetails.bic", {
                required: "Le BIC est requis",
                pattern: {
                  value: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
                  message: "Format BIC invalide",
                },
              })}
            />
            {errors.bankDetails?.bic && (
              <p className="text-sm text-red-500">
                {errors.bankDetails.bic.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Code d'identification de votre banque (8 ou 11 caractères)
            </p>
          </div>

          {/* Nom de la banque */}
          <div className="space-y-2">
            <Label htmlFor="bankDetails.bankName">Nom de la banque</Label>
            <Input
              id="bankDetails.bankName"
              placeholder="BNP Paribas"
              {...register("bankDetails.bankName")}
            />
            <p className="text-xs text-muted-foreground">
              Nom de votre établissement bancaire
            </p>
          </div>

          {/* Information de sécurité */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Sécurité des données bancaires
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Vos informations bancaires sont chiffrées et stockées de
                  manière sécurisée. Elles ne seront utilisées que pour les
                  virements et facturations.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
