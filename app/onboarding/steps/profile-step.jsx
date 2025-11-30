"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

const activitySectors = [
  "Conseil & Services",
  "Commerce & E-commerce",
  "Artisanat",
  "Santé & Bien-être",
  "Technologie & IT",
  "Marketing & Communication",
  "Immobilier",
  "BTP & Construction",
  "Restauration & Hôtellerie",
  "Éducation & Formation",
  "Autre",
];

const employeeCounts = [
  "Juste moi",
  "2-5 employés",
  "6-10 employés",
  "11-50 employés",
  "Plus de 50 employés",
];

export default function ProfileStep({
  formData,
  updateFormData,
  onNext,
  onBack,
  onSkip,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">
          Parlez-nous de vous
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ces informations nous aident à personnaliser votre expérience
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Prénom */}
          <div className="space-y-2">
            <Label htmlFor="name">Prénom</Label>
            <Input
              id="name"
              type="text"
              placeholder="Votre prénom"
              value={formData.name || ""}
              onChange={(e) => updateFormData({ name: e.target.value })}
            />
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Votre nom"
              value={formData.lastName || ""}
              onChange={(e) => updateFormData({ lastName: e.target.value })}
            />
          </div>
        </div>

        {/* Secteur d'activité */}
        <div className="space-y-2">
          <Label htmlFor="activitySector">Secteur d'activité</Label>
          <Select
            value={formData.activitySector || ""}
            onValueChange={(value) => updateFormData({ activitySector: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              {activitySectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nombre d'employés */}
        <div className="space-y-2">
          <Label htmlFor="employeeCount">Nombre de salariés</Label>
          <Select
            value={formData.employeeCount || ""}
            onValueChange={(value) => updateFormData({ employeeCount: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              {employeeCounts.map((count) => (
                <SelectItem key={count} value={count}>
                  {count}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="text-slate-600 dark:text-slate-400"
            >
              Retour
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Passer
            </Button>
          </div>
          <Button
            type="submit"
            className="bg-[#5b4fff] hover:bg-[#4a3fee] text-white px-8"
          >
            Continuer
          </Button>
        </div>
      </form>
    </div>
  );
}
