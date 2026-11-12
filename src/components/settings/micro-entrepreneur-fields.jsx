"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Info } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Calendar as ShadcnCalendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";

/**
 * Micro-entrepreneur : ce que la page Déclaration Urssaf a besoin de savoir
 * pour ranger les encaissements dans les cases du formulaire et estimer les
 * cotisations. Rien n'est supposé : une question sans réponse reste vide et
 * la page la demande.
 */

// Même liste que l'API (src/services/urssaf/urssafDeclarationCalculation.js)
export const MICRO_ACTIVITIES = [
  {
    value: "sales",
    label: "Vente de marchandises",
    hint: "Achat-revente, vente de denrées à emporter ou à consommer sur place.",
  },
  {
    value: "services-commercial",
    label: "Prestations de services commerciales (BIC)",
    hint: "Location de matériel, transport, agence immobilière…",
  },
  {
    value: "services-artisanal",
    label: "Prestations de services artisanales (BIC)",
    hint: "Activité inscrite au registre des métiers : coiffure, bâtiment, réparation…",
  },
  {
    value: "services-liberal",
    label: "Prestations de services libérales (BNC)",
    hint: "Conseil, formation, développement, graphisme… relevant de la Sécurité sociale des indépendants.",
  },
  {
    value: "cipav",
    label: "Profession libérale relevant de la Cipav",
    hint: "Architecte, géomètre, psychologue, ostéopathe… affilié à la Cipav pour la retraite.",
  },
  {
    value: "mixed-commercial",
    label: "Vente et prestations commerciales",
    hint: "Activité mixte : chaque facture est rangée selon sa nature de l'opération.",
  },
  {
    value: "mixed-artisanal",
    label: "Vente et prestations artisanales",
    hint: "Activité mixte : chaque facture est rangée selon sa nature de l'opération.",
  },
];

const YES_NO = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
];

function FieldLabel({ htmlFor, children, tooltip }) {
  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
      >
        {children}
      </Label>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function YesNoSelect({ id, value, onChange, disabled }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Sélectionnez" />
      </SelectTrigger>
      <SelectContent>
        {YES_NO.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MicroEntrepreneurFields({ disabled = false }) {
  const { watch, setValue } = useFormContext();
  const [startDateOpen, setStartDateOpen] = useState(false);

  const legal = watch("legal") || {};
  const activity = legal.microActivity || "";
  const acre = legal.microAcre || "";
  const startDate = legal.microActivityStartDate || "";
  const incomeTax = legal.microIncomeTaxWithholding || "";
  const activityHint = MICRO_ACTIVITIES.find((a) => a.value === activity)?.hint;

  const set = (field) => (value) =>
    setValue(`legal.${field}`, value, { shouldDirty: true });
  const parsedStart = startDate
    ? parse(startDate, "yyyy-MM-dd", new Date())
    : undefined;

  return (
    <>
      <div className="flex flex-col gap-1">
        <FieldLabel
          htmlFor="microActivity"
          tooltip="Catégorie de votre activité auprès de l'Urssaf. Elle décide de la case où déclarer votre chiffre d'affaires et du taux de vos cotisations."
        >
          Nature de l&apos;activité (Urssaf)
        </FieldLabel>
        <Select
          value={activity}
          onValueChange={set("microActivity")}
          disabled={disabled}
        >
          <SelectTrigger id="microActivity" className="w-full">
            <SelectValue placeholder="Sélectionnez la nature de l'activité" />
          </SelectTrigger>
          <SelectContent>
            {MICRO_ACTIVITIES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activityHint && (
          <p className="text-xs text-muted-foreground">{activityHint}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <FieldLabel
            htmlFor="microAcre"
            tooltip="Aide à la création ou à la reprise d'entreprise : cotisations réduites pendant les premiers trimestres d'activité."
          >
            Bénéficiez-vous de l&apos;ACRE ?
          </FieldLabel>
          <YesNoSelect
            id="microAcre"
            value={acre}
            onChange={set("microAcre")}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-1">
          <FieldLabel
            htmlFor="microActivityStartDate"
            tooltip="Date de début d'activité indiquée à votre immatriculation. Elle fixe la période de votre première déclaration, ainsi que le taux et la fin de l'ACRE."
          >
            Début d&apos;activité
          </FieldLabel>
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                id="microActivityStartDate"
                type="button"
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {parsedStart ? (
                  format(parsedStart, "dd MMM yyyy", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <ShadcnCalendar
                mode="single"
                captionLayout="dropdown"
                startMonth={new Date(1990, 0)}
                endMonth={new Date(new Date().getFullYear() + 1, 11)}
                defaultMonth={parsedStart || new Date()}
                selected={parsedStart}
                onSelect={(date) => {
                  set("microActivityStartDate")(
                    date ? format(date, "yyyy-MM-dd") : "",
                  );
                  setStartDateOpen(false);
                }}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <FieldLabel
          htmlFor="microIncomeTaxWithholding"
          tooltip="Option qui fait payer l'impôt sur le revenu avec les cotisations, en pourcentage du chiffre d'affaires."
        >
          Versement libératoire de l&apos;impôt sur le revenu
        </FieldLabel>
        <YesNoSelect
          id="microIncomeTaxWithholding"
          value={incomeTax}
          onChange={set("microIncomeTaxWithholding")}
          disabled={disabled}
        />
      </div>
    </>
  );
}
