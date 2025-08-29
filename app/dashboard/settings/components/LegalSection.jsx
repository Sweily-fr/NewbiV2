import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  validateField,
  sanitizeInput,
  detectInjectionAttempt,
  getRequiredFields,
  getVisibleFields,
  VALIDATION_PATTERNS,
} from "@/src/lib/validation";
import { FileText, Building, Euro } from "lucide-react";

const LEGAL_FORMS = [
  { value: "SARL", label: "SARL - Société à Responsabilité Limitée" },
  { value: "SAS", label: "SAS - Société par Actions Simplifiée" },
  {
    value: "SASU",
    label: "SASU - Société par Actions Simplifiée Unipersonnelle",
  },
  {
    value: "EURL",
    label: "EURL - Entreprise Unipersonnelle à Responsabilité Limitée",
  },
  { value: "SA", label: "SA - Société Anonyme" },
  { value: "SNC", label: "SNC - Société en Nom Collectif" },
  { value: "Auto-entrepreneur", label: "Auto-entrepreneur / Micro-entreprise" },
  { value: "EI", label: "EI - Entreprise Individuelle" },
];

const TAX_REGIMES = [
  { value: "reel-normal", label: "Régime réel normal" },
  { value: "reel-simplifie", label: "Régime réel simplifié" },
  { value: "micro-entreprise", label: "Régime micro-entreprise" },
  { value: "micro-bic", label: "Régime micro-BIC" },
  { value: "micro-bnc", label: "Régime micro-BNC" },
];

const ACTIVITY_CATEGORIES = [
  { value: "commerciale", label: "Activité commerciale" },
  { value: "artisanale", label: "Activité artisanale" },
  { value: "liberale", label: "Profession libérale" },
  { value: "agricole", label: "Activité agricole" },
  { value: "industrielle", label: "Activité industrielle" },
];

export default function LegalSection({ register, errors, watch, setValue }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [isVatSubject, setIsVatSubject] = useState(false);
  const [hasCommercialActivity, setHasCommercialActivity] = useState(false);

  const selectedLegalForm = watch("legal.legalForm");
  const selectedRegime = watch("legal.regime");
  const selectedCategory = watch("legal.category");

  // Surveiller les changements de forme juridique
  const legalForm = watch("legal.legalForm") || "";

  // Calculer les champs requis et visibles en fonction de la forme juridique
  const requiredFields = getRequiredFields(
    legalForm,
    isVatSubject,
    hasCommercialActivity
  );
  const visibleFields = getVisibleFields(
    legalForm,
    isVatSubject,
    hasCommercialActivity
  );

  const handleInputChange = (fieldName, value) => {
    // Détecter les tentatives d'injection
    if (detectInjectionAttempt(value)) {
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: "Caractères non autorisés détectés",
      }));
      return;
    }

    // Nettoyer la valeur
    const sanitizedValue = sanitizeInput(value);

    // Déterminer si le champ est requis
    const isRequired = requiredFields[fieldName] || false;

    // Valider le champ
    const validation = validateField(sanitizedValue, fieldName, isRequired);

    if (!validation.isValid) {
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: validation.message,
      }));
    } else {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Mettre à jour la valeur dans le formulaire
    setValue(fieldName, sanitizedValue);
  };

  // Composant pour afficher les labels avec astérisque rouge si requis
  const RequiredLabel = ({ htmlFor, children, isRequired }) => (
    <Label htmlFor={htmlFor} className="text-sm font-normal">
      {children}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-none backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-medium">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            Informations légales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cases à cocher pour conditions spéciales */}
          {visibleFields.commercialActivityCheckbox && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasCommercialActivity"
                  checked={hasCommercialActivity}
                  onCheckedChange={setHasCommercialActivity}
                />
                <Label
                  htmlFor="hasCommercialActivity"
                  className="text-sm font-normal"
                >
                  Exercez-vous une activité commerciale ?
                </Label>
              </div>
            </div>
          )}

          <div className="space-y-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVatSubject"
                checked={isVatSubject}
                onCheckedChange={setIsVatSubject}
              />
              <Label htmlFor="isVatSubject" className="text-sm font-normal">
                Êtes-vous assujetti à la TVA ?
              </Label>
            </div>
          </div>

          {/* Forme juridique */}
          <div className="space-y-2">
            <RequiredLabel
              htmlFor="legal.legalForm"
              className="font-normal"
              isRequired={true}
            >
              <Building className="h-4 w-4 inline mr-2" />
              Forme juridique
            </RequiredLabel>
            <Select
              value={selectedLegalForm}
              onValueChange={(value) => setValue("legal.legalForm", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez la forme juridique" />
              </SelectTrigger>
              <SelectContent>
                {LEGAL_FORMS.map((form) => (
                  <SelectItem key={form.value} value={form.value}>
                    {form.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.legal?.legalForm && (
              <p className="text-sm text-red-500">
                {errors.legal.legalForm.message}
              </p>
            )}
          </div>

          {/* SIRET et RCS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <RequiredLabel
                htmlFor="legal.siret"
                isRequired={requiredFields.siret}
              >
                Numéro SIRET
              </RequiredLabel>
              <Input
                id="legal.siret"
                placeholder="12345678901234"
                value={watch("legal.siret")}
                onChange={(e) =>
                  handleInputChange("legal.siret", e.target.value)
                }
              />
              {fieldErrors["legal.siret"] && (
                <p className="text-sm text-red-500">
                  {fieldErrors["legal.siret"]}
                </p>
              )}
            </div>

            {visibleFields.rcs && (
              <div className="space-y-2">
                <RequiredLabel
                  htmlFor="legal.rcs"
                  isRequired={requiredFields.rcs}
                >
                  Numéro RCS
                  {!requiredFields.rcs &&
                    ["EI", "Auto-entrepreneur/Micro"].includes(legalForm) && (
                      <span className="text-gray-500 text-xs ml-2">
                        (si activité commerciale)
                      </span>
                    )}
                </RequiredLabel>
                <Input
                  id="legal.rcs"
                  placeholder="RCS Paris 123 456 789"
                  {...register("legal.rcs", {
                    pattern: {
                      value: VALIDATION_PATTERNS.rcs.pattern,
                      message: VALIDATION_PATTERNS.rcs.message,
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
                {errors.legal?.rcs && (
                  <p className="text-sm text-red-500">
                    {errors.legal.rcs.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Numéro de TVA et Capital social */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleFields.vatNumber && (
              <div className="space-y-2">
                <RequiredLabel
                  htmlFor="legal.vatNumber"
                  isRequired={requiredFields.vatNumber}
                >
                  Numéro de TVA intracommunautaire
                </RequiredLabel>
                <Input
                  id="legal.vatNumber"
                  placeholder="FR12345678901"
                  {...register("legal.vatNumber", {
                    pattern: {
                      value: VALIDATION_PATTERNS.vatNumber.pattern,
                      message: VALIDATION_PATTERNS.vatNumber.message,
                    },
                    validate: (value) => {
                      if (value && detectInjectionAttempt(value)) {
                        return "Caractères non autorisés détectés";
                      }
                      return true;
                    },
                  })}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(
                      e.target.value,
                      "alphanumeric"
                    );
                    e.target.value = sanitized.toUpperCase();
                  }}
                />
                {errors.legal?.vatNumber && (
                  <p className="text-sm text-red-500">
                    {errors.legal.vatNumber.message}
                  </p>
                )}
              </div>
            )}

            {visibleFields.capital && (
              <div className="space-y-2">
                <RequiredLabel
                  htmlFor="legal.capital"
                  isRequired={requiredFields.capital}
                >
                  <Euro className="h-4 w-4 inline mr-2" />
                  Capital social (€)
                </RequiredLabel>
                <Input
                  id="legal.capital"
                  placeholder="10000"
                  type="number"
                  {...register("legal.capital", {
                    pattern: {
                      value: VALIDATION_PATTERNS.capital.pattern,
                      message: VALIDATION_PATTERNS.capital.message,
                    },
                    validate: (value) => {
                      if (value && detectInjectionAttempt(value)) {
                        return "Caractères non autorisés détectés";
                      }
                      return true;
                    },
                  })}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value, "numeric");
                    e.target.value = sanitized;
                  }}
                />
                {errors.legal?.capital && (
                  <p className="text-sm text-red-500">
                    {errors.legal.capital.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Régime fiscal */}
          <div className="space-y-2">
            <RequiredLabel
              htmlFor="legal.regime"
              isRequired={requiredFields.fiscalRegime}
            >
              Régime fiscal
            </RequiredLabel>
            <Select
              value={selectedRegime}
              onValueChange={(value) => setValue("legal.regime", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez le régime fiscal" />
              </SelectTrigger>
              <SelectContent>
                {TAX_REGIMES.map((regime) => (
                  <SelectItem key={regime.value} value={regime.value}>
                    {regime.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Catégorie d'activité */}
          <div className="space-y-2">
            <RequiredLabel
              htmlFor="legal.category"
              isRequired={requiredFields.activityCategory}
            >
              Catégorie d'activité
            </RequiredLabel>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setValue("legal.category", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez la catégorie d'activité" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Information légale */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-100">
                  Informations légales
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Ces informations sont utilisées pour la génération automatique
                  de vos mentions légales et documents officiels. Assurez-vous
                  qu'elles sont exactes et à jour.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
