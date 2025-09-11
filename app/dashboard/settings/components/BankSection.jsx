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
import { CreditCard, Building2, Hash, Info, Shield } from "lucide-react";
import {
  VALIDATION_PATTERNS,
  sanitizeInput,
  detectInjectionAttempt,
} from "@/src/lib/validation";
import { Alert, AlertDescription } from "@/src/components/ui/alert";

export default function BankSection({ register, errors, watch }) {
  // Surveiller individuellement chaque champ pour une détection plus fiable
  const ibanValue = watch("bankDetails.iban") || "";
  const bicValue = watch("bankDetails.bic") || "";
  const bankNameValue = watch("bankDetails.bankName") || "";
  
  const hasIban = ibanValue.trim() !== "";
  const hasBic = bicValue.trim() !== "";
  const hasBankName = bankNameValue.trim() !== "";
  const hasAnyBankField = hasIban || hasBic || hasBankName;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-none backdrop-blur-sm">
        <CardContent className="space-y-4">
          {/* Information sur la validation conditionnelle */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Coordonnées bancaires optionnelles</strong>
              <br />
              Vous pouvez laisser tous les champs vides. Si vous renseignez une information bancaire, 
              les trois champs (IBAN, BIC et nom de banque) deviennent obligatoires.
            </AlertDescription>
          </Alert>

          {/* IBAN */}
          <div className="space-y-2">
            <Label
              htmlFor="bankDetails.iban"
              className="flex items-center gap-2"
            >
              <Hash className="h-4 w-4" />
              IBAN {hasAnyBankField && "*"}
            </Label>
            <Input
              id="bankDetails.iban"
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              {...register("bankDetails.iban", {
                required: hasAnyBankField ? "L'IBAN est requis si vous renseignez des coordonnées bancaires" : false,
                pattern: {
                  value: VALIDATION_PATTERNS.iban.pattern,
                  message: VALIDATION_PATTERNS.iban.message,
                },
                validate: (value) => {
                  if (value && detectInjectionAttempt(value)) {
                    return "Caractères non autorisés détectés";
                  }
                  return true;
                },
              })}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value, "alphanumeric");
                e.target.value = sanitized.toUpperCase();
              }}
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
              BIC/SWIFT {hasAnyBankField && "*"}
            </Label>
            <Input
              id="bankDetails.bic"
              placeholder="BNPAFRPP"
              {...register("bankDetails.bic", {
                required: hasAnyBankField ? "Le BIC est requis si vous renseignez des coordonnées bancaires" : false,
                pattern: {
                  value: VALIDATION_PATTERNS.bic.pattern,
                  message: VALIDATION_PATTERNS.bic.message,
                },
                validate: (value) => {
                  if (value && detectInjectionAttempt(value)) {
                    return "Caractères non autorisés détectés";
                  }
                  return true;
                },
              })}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value, "alphanumeric");
                e.target.value = sanitized.toUpperCase();
              }}
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
            <Label htmlFor="bankDetails.bankName">
              Nom de la banque {hasAnyBankField && "*"}
            </Label>
            <Input
              id="bankDetails.bankName"
              placeholder="BNP Paribas"
              {...register("bankDetails.bankName", {
                required: hasAnyBankField ? "Le nom de la banque est requis si vous renseignez des coordonnées bancaires" : false,
                pattern: {
                  value: VALIDATION_PATTERNS.bankName.pattern,
                  message: VALIDATION_PATTERNS.bankName.message,
                },
                validate: (value) => {
                  if (value && detectInjectionAttempt(value)) {
                    return "Caractères non autorisés détectés";
                  }
                  return true;
                },
              })}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value);
                e.target.value = sanitized;
              }}
            />
            <p className="text-xs text-muted-foreground">
              Nom de votre établissement bancaire
            </p>
          </div>

          {/* Information de sécurité */}
          <Alert>
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Sécurité des données bancaires</strong>
              <br />
              Vos informations bancaires sont chiffrées et stockées de
              manière sécurisée. Elles ne seront utilisées que pour les
              virements et facturations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
