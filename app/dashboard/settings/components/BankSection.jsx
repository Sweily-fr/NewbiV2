import React, { useEffect, useState } from "react";
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

// Fonction de formatage de l'IBAN avec espaces (pour l'affichage)
const formatIban = (iban) => {
  if (!iban) return "";
  
  // Supprimer tous les espaces existants et convertir en majuscules
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Ajouter un espace tous les 4 caractères
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
};

// Fonction pour nettoyer l'IBAN (pour l'enregistrement en BDD)
const cleanIban = (iban) => {
  if (!iban) return "";
  
  // Supprimer tous les espaces et convertir en majuscules
  return iban.replace(/\s/g, '').toUpperCase();
};

export default function BankSection({ register, errors, watch, setValue, getValues }) {
  // État local pour l'affichage formaté de l'IBAN
  const [displayIban, setDisplayIban] = useState("");
  
  // Surveiller individuellement chaque champ pour une détection plus fiable
  const ibanValue = watch("bankDetails.iban") || "";
  const bicValue = watch("bankDetails.bic") || "";
  const bankNameValue = watch("bankDetails.bankName") || "";

  const hasIban = ibanValue.trim() !== "";
  const hasBic = bicValue.trim() !== "";
  const hasBankName = bankNameValue.trim() !== "";
  const hasAnyBankField = hasIban || hasBic || hasBankName;

  // Debug log
  console.log("🎯 BankSection - displayIban:", displayIban);
  console.log("📊 BankSection - ibanValue:", ibanValue);

  // Synchroniser l'affichage avec la valeur du formulaire au chargement
  useEffect(() => {
    const currentIban = getValues("bankDetails.iban");
    if (currentIban && currentIban.trim() !== "") {
      setDisplayIban(formatIban(currentIban));
    }
  }, [getValues]);

  // Synchroniser quand la valeur change depuis l'extérieur (reset du formulaire)
  useEffect(() => {
    // Seulement lors du reset du formulaire ou chargement initial
    if (ibanValue && !displayIban) {
      setDisplayIban(formatIban(ibanValue));
    }
  }, [ibanValue]);

  // Fonction utilitaire pour traiter l'IBAN (saisie ou collage)
  const handleIbanInput = (inputValue) => {
    console.log("🔍 handleIbanInput - Input:", inputValue);
    const sanitized = sanitizeInput(inputValue, "alphanumeric");
    console.log("🧹 handleIbanInput - Sanitized:", sanitized);
    const formattedForDisplay = formatIban(sanitized);
    console.log("✨ handleIbanInput - Formatted:", formattedForDisplay);
    const cleanedForStorage = cleanIban(sanitized);
    console.log("💾 handleIbanInput - Cleaned:", cleanedForStorage);
    
    // Mettre à jour l'affichage local
    setDisplayIban(formattedForDisplay);
    
    // Enregistrer la version nettoyée dans le formulaire (pour la BDD)
    setValue("bankDetails.iban", cleanedForStorage, { 
      shouldDirty: true,
      shouldValidate: true 
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-none backdrop-blur-sm pt-2">
        <CardContent className="space-y-4">
          {/* Information sur la validation conditionnelle */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>
                Coordonnées bancaires optionnelles
              </strong>
              <br />
              Vous pouvez laisser tous les champs vides. Si vous renseignez une
              information bancaire, les trois champs (IBAN, BIC et nom de
              banque) deviennent obligatoires.
            </AlertDescription>
          </Alert>

          {/* IBAN */}
          <div className="space-y-2">
            <Label
              htmlFor="bankDetails.iban"
              className="flex items-center gap-2 font-normal"
            >
              <Hash className="h-4 w-4" />
              IBAN {hasAnyBankField && "*"}
            </Label>
            <Input
              id="bankDetails.iban"
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              value={displayIban}
              onChange={(e) => {
                handleIbanInput(e.target.value);
              }}
              onPaste={(e) => {
                // Empêcher le comportement par défaut du paste
                e.preventDefault();
                
                // Récupérer le texte collé et le traiter
                const pastedText = e.clipboardData.getData('text');
                handleIbanInput(pastedText);
              }}
            />
            {/* Champ caché pour la validation React Hook Form */}
            <input
              type="hidden"
              {...register("bankDetails.iban", {
                required: hasAnyBankField
                  ? "L'IBAN est requis si vous renseignez des coordonnées bancaires"
                  : false,
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
              className="flex items-center gap-2 font-normal"
            >
              <Building2 className="h-4 w-4" />
              BIC/SWIFT {hasAnyBankField && "*"}
            </Label>
            <Input
              id="bankDetails.bic"
              placeholder="BNPAFRPP"
              {...register("bankDetails.bic", {
                required: hasAnyBankField
                  ? "Le BIC est requis si vous renseignez des coordonnées bancaires"
                  : false,
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
            <Label htmlFor="bankDetails.bankName" className="font-normal">
              Nom de la banque {hasAnyBankField && "*"}
            </Label>
            <Input
              id="bankDetails.bankName"
              placeholder="BNP Paribas"
              {...register("bankDetails.bankName", {
                required: hasAnyBankField
                  ? "Le nom de la banque est requis si vous renseignez des coordonnées bancaires"
                  : false,
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
              Vos informations bancaires sont chiffrées et stockées de manière
              sécurisée. Elles ne seront utilisées que pour les virements et
              facturations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
