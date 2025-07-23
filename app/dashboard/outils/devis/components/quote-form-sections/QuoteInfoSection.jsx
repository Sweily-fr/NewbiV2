"use client";

import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Calendar as CalendarIcon, Clock, Info } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/src/components/ui/calendar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";
import { 
  generateQuotePrefix, 
  parseQuotePrefix, 
  formatQuotePrefix, 
  getCurrentMonthYear,
  validateQuoteNumber,
  formatQuoteNumber,
  getQuoteDisplayNumber
} from "@/src/utils/quoteUtils";

const VALIDITY_PERIOD_SUGGESTIONS = [
  { value: 15, label: "15 jours" },
  { value: 30, label: "30 jours" },
  { value: 45, label: "45 jours" },
  { value: 60, label: "60 jours" },
  { value: 90, label: "90 jours" }
];

export default function QuoteInfoSection({ canEdit = true, nextQuoteNumber = null }) {
  const { watch, setValue, register, formState: { errors }, trigger } = useFormContext();
  const data = watch();

  // Handle prefix changes with auto-fill for MM and AAAA
  const handlePrefixChange = (e) => {
    const { value } = e.target;
    const cursorPosition = e.target.selectionStart;
    
    // Check if user is typing MM or AAAA
    if (value.includes('MM')) {
      const { month } = getCurrentMonthYear();
      const newValue = value.replace('MM', month);
      setValue("prefix", newValue, { shouldValidate: true });
      // Move cursor after the inserted month
      setTimeout(() => {
        e.target.setSelectionRange(cursorPosition + month.length - 2, cursorPosition + month.length - 2);
      }, 0);
      return;
    }
    
    if (value.includes('AAAA')) {
      const { year } = getCurrentMonthYear();
      const newValue = value.replace('AAAA', year);
      setValue("prefix", newValue, { shouldValidate: true });
      // Move cursor after the inserted year
      setTimeout(() => {
        e.target.setSelectionRange(cursorPosition + year.length - 4, cursorPosition + year.length - 4);
      }, 0);
      return;
    }
    
    // For normal typing, just update the value
    setValue("prefix", value, { shouldValidate: true });
  };

  // Set default prefix and dates on component mount
  useEffect(() => {
    // Set default prefix if not already set
    if (!data.prefix) {
      setValue("prefix", generateQuotePrefix(), { shouldValidate: true });
    }
    
    // Set default issue date to today
    if (!data.issueDate) {
      const today = new Date();
      setValue('issueDate', today.toISOString().split('T')[0], { shouldValidate: true });
    }
    
    // Set default valid until date to today + 30 days
    if (!data.validUntil) {
      const today = new Date();
      const validUntil = new Date(today);
      validUntil.setDate(today.getDate() + 30);
      setValue('validUntil', validUntil.toISOString().split('T')[0], { shouldValidate: true });
    }
  }, [data.prefix, data.issueDate, data.validUntil, setValue]);

  const validateValidUntil = (value) => {
    if (!value) return "La date de validité est requise";
    
    const validUntilDate = new Date(value);
    const issueDateValue = data.issueDate;
    
    if (issueDateValue) {
      const issueDate = new Date(issueDateValue);
      if (validUntilDate <= issueDate) {
        return "La date de validité doit être postérieure à la date d'émission";
      }
    }
    
    return true;
  };

  return (
    <Card className="shadow-none p-2 border-none bg-transparent">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-medium text-lg">
          {/* <Clock className="h-5 w-5" /> */}
          Informations du devis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Préfixe et numéro de devis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="quote-prefix" className="text-sm font-medium">
                Préfixe de devis
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="w-64">
                    <p className="w-full">
                      Astuce : Tapez <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">MM</span> pour le mois ou <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">AAAA</span> pour l'année
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1">
              <div className="relative">
                <Input
                  id="quote-prefix"
                  {...register("prefix", {
                    required: "Le préfixe est requis",
                    maxLength: {
                      value: 20,
                      message: "Le préfixe ne doit pas dépasser 20 caractères"
                    },
                    pattern: {
                      value: /^D-\d{6}$/,
                      message: "Format attendu : D-MMAAAA (ex: D-022025)"
                    }
                  })}
                  value={data.prefix || ""}
                  onChange={handlePrefixChange}
                  onFocus={(e) => {
                    // Show placeholder with current date as an example
                    if (!e.target.value) {
                      const { month, year } = getCurrentMonthYear();
                      e.target.placeholder = `D-${month}${year}`;
                    }
                  }}
                  onBlur={(e) => {
                    // Format the prefix if it's not empty
                    if (e.target.value) {
                      const parsed = parseQuotePrefix(e.target.value);
                      if (parsed) {
                        setValue("prefix", formatQuotePrefix(parsed.month, parsed.year), { shouldValidate: true });
                      }
                    }
                  }}
                  placeholder="D-MMAAAA"
                  disabled={!canEdit}
                />
              </div>
              {errors?.prefix && (
                <p className="text-xs text-red-500">
                  {errors.prefix.message}
                </p>
              )}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="quote-number" className="text-sm font-medium">
                Numéro de devis
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="w-64">
                    <p className="w-full">
                      Numéro séquentiel du devis. Il sera automatiquement formaté avec des zéros en préfixe (ex: 000001).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1">
              <Input
                id="quote-number"
                {...register("number", {
                  required: "Le numéro de devis est requis",
                  validate: {
                    isValid: (value) => {
                      if (!validateQuoteNumber(value)) {
                        return "Le numéro doit contenir entre 1 et 6 chiffres uniquement";
                      }
                      return true;
                    }
                  }
                })}
                defaultValue={data.number || ""}
                placeholder="000001"
                disabled={!canEdit}
                onBlur={(e) => {
                  // Format with leading zeros when leaving the field
                  if (e.target.value && validateQuoteNumber(e.target.value)) {
                    const formattedNum = formatQuoteNumber(e.target.value);
                    setValue('number', formattedNum, { shouldValidate: true });
                  }
                }}
              />
              {errors?.number && (
                <p className="text-xs text-red-500">
                  {errors.number.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Référence projet */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="project-reference" className="text-sm font-medium">
              Référence projet
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="w-64">
                  <p className="w-full">
                    Référence du projet associé à ce devis (optionnel). Utile pour le suivi et l'organisation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Input
              id="project-reference"
              value={data.projectReference || ""}
              onChange={(e) => setValue("projectReference", e.target.value, { shouldDirty: true })}
              placeholder="PROJ-2025-001"
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">
                Date d'émission *
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="w-64">
                    <p className="w-full">
                      Date à laquelle le devis est émis. Par défaut, c'est la date d'aujourd'hui.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <input
              type="hidden"
              {...register("issueDate", {
                required: "La date d'émission est requise"
              })}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!canEdit}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.issueDate && "text-muted-foreground"
                  )}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.issueDate ? (() => {
                    try {
                      const date = new Date(data.issueDate);
                      if (isNaN(date.getTime())) return <span>Date invalide</span>;
                      return format(date, "PPP", { locale: fr });
                    } catch (error) {
                      console.warn('Erreur de formatage de date issueDate:', data.issueDate, error);
                      return <span>Date invalide</span>;
                    }
                  })() : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.issueDate ? new Date(data.issueDate) : undefined}
                  onSelect={(date) => {
                    setValue("issueDate", format(date, 'yyyy-MM-dd'), { shouldDirty: true, shouldValidate: true });
                  }}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            {errors?.issueDate && (
              <p className="text-xs text-red-500">
                {errors.issueDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">
                Valide jusqu'au *
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="w-64">
                    <p className="w-full">
                      Date limite de validité du devis. Après cette date, le devis ne sera plus valable.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <input
                type="hidden"
                {...register("validUntil", {
                  required: "La date de validité est requise",
                  validate: validateValidUntil
                })}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.validUntil && "text-muted-foreground"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.validUntil ? (() => {
                      try {
                        const date = new Date(data.validUntil);
                        if (isNaN(date.getTime())) return <span>Date invalide</span>;
                        return format(date, "PPP", { locale: fr });
                      } catch (error) {
                        console.warn('Erreur de formatage de date validUntil:', data.validUntil, error);
                        return <span>Date invalide</span>;
                      }
                    })() : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.validUntil ? new Date(data.validUntil) : undefined}
                    onSelect={(date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      setValue("validUntil", dateStr, { shouldDirty: true, shouldValidate: true });
                    }}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              <Select
                onValueChange={(value) => {
                  const days = parseInt(value);
                  const issueDate = new Date(data.issueDate || new Date());
                  const validUntil = new Date(issueDate);
                  validUntil.setDate(validUntil.getDate() + days);
                  setValue("validUntil", validUntil.toISOString().split('T')[0], { shouldDirty: true });
                }}
                disabled={!canEdit}
                defaultValue="30"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="30 jours" />
                </SelectTrigger>
                <SelectContent>
                  {VALIDITY_PERIOD_SUGGESTIONS.map((period) => (
                    <SelectItem key={period.value} value={period.value.toString()}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Utilisez le sélecteur pour ajouter des jours automatiquement
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
