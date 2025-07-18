import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
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
  const selectedLegalForm = watch("legal.legalForm");
  const selectedRegime = watch("legal.regime");
  const selectedCategory = watch("legal.category");

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            Informations légales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Forme juridique */}
          <div className="space-y-2">
            <Label
              htmlFor="legal.legalForm"
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              Forme juridique *
            </Label>
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
              <Label htmlFor="legal.siret">Numéro SIRET</Label>
              <Input
                id="legal.siret"
                placeholder="12345678901234"
                {...register("legal.siret", {
                  pattern: {
                    value: /^[0-9]{14}$/,
                    message: "Le SIRET doit contenir 14 chiffres",
                  },
                })}
              />
              {errors.legal?.siret && (
                <p className="text-sm text-red-500">
                  {errors.legal.siret.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal.rcs">Numéro RCS</Label>
              <Input
                id="legal.rcs"
                placeholder="RCS Paris 123 456 789"
                {...register("legal.rcs")}
              />
            </div>
          </div>

          {/* Numéro de TVA et Capital social */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legal.vatNumber">
                Numéro de TVA intracommunautaire
              </Label>
              <Input
                id="legal.vatNumber"
                placeholder="FR12345678901"
                {...register("legal.vatNumber", {
                  pattern: {
                    value: /^[A-Z]{2}[0-9A-Z]+$/,
                    message: "Format de TVA invalide",
                  },
                })}
              />
              {errors.legal?.vatNumber && (
                <p className="text-sm text-red-500">
                  {errors.legal.vatNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="legal.capital"
                className="flex items-center gap-2"
              >
                <Euro className="h-4 w-4" />
                Capital social
              </Label>
              <Input
                id="legal.capital"
                placeholder="10000"
                type="number"
                {...register("legal.capital")}
              />
            </div>
          </div>

          {/* Régime fiscal */}
          <div className="space-y-2">
            <Label htmlFor="legal.regime">Régime fiscal</Label>
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
            <Label htmlFor="legal.category">Catégorie d'activité</Label>
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
