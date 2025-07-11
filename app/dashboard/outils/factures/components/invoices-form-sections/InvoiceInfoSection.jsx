"use client";

import { useFormContext } from "react-hook-form";
import { Calendar as CalendarIcon, Clock, Building } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/src/components/ui/calendar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";

const PAYMENT_TERMS_SUGGESTIONS = [
  { value: 0, label: "Paiement à réception" },
  { value: 15, label: "15 jours" },
  { value: 30, label: "30 jours" },
  { value: 45, label: "45 jours" },
  { value: 60, label: "60 jours" }
];

export default function InvoiceInfoSection({ canEdit }) {
  const { watch, setValue, register, formState: { errors } } = useFormContext();
  const data = watch();
  
  // Fonction pour valider la date d'échéance
  const validateDueDate = (value) => {
    if (!value) return true; // Optionnel
    const dueDate = new Date(value);
    const issueDate = new Date(data.issueDate);
    return dueDate >= issueDate || "La date d'échéance doit être postérieure à la date d'émission";
  };
  
  // Fonction pour valider la date d'exécution
  const validateExecutionDate = (value) => {
    if (!value) return true; // Optionnel
    const executionDate = new Date(value);
    const issueDate = new Date(data.issueDate);
    return executionDate >= issueDate || "La date d'exécution doit être postérieure ou égale à la date d'émission";
  };
  return (
    <Card className="shadow-none p-2 border-none bg-transparent">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Informations de la facture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Facture d'acompte */}
        <div className="flex items-center space-x-3">
          <Checkbox
            id="deposit-invoice"
            checked={data.isDepositInvoice || false}
            onCheckedChange={(checked) => setValue("isDepositInvoice", checked, { shouldDirty: true })}
            disabled={!canEdit}
            className="h-5 w-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="deposit-invoice"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Facture d'acompte
            </Label>
            <p className="text-xs text-muted-foreground">
              Cochez si cette facture correspond à un acompte
            </p>
          </div>
        </div>

        {/* Préfixe et numéro de facture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-prefix" className="text-sm font-medium">
              Préfixe de facture
            </Label>
            <div className="space-y-1">
              <Input
                id="invoice-prefix"
                {...register("prefix", {
                  maxLength: {
                    value: 10,
                    message: "Le préfixe ne doit pas dépasser 10 caractères"
                  }
                })}
                defaultValue={data.prefix || "F-"}
                placeholder="F-"
                disabled={!canEdit}
                className={`h-10 rounded-lg px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  errors?.prefix ? 'border-red-500' : ''
                }`}
              />
              {errors?.prefix && (
                <p className="text-xs text-red-500">
                  {errors.prefix.message}
                </p>
              )}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="invoice-number" className="text-sm font-medium">
              Numéro de facture
            </Label>
            <div className="space-y-1">
              <Input
                id="invoice-number"
                {...register("number", {
                  required: "Le numéro de facture est requis",
                  pattern: {
                    value: /^[A-Za-z0-9-]+$/,
                    message: "Format de numéro invalide (utilisez des lettres, chiffres et tirets)"
                  },
                  minLength: {
                    value: 3,
                    message: "Le numéro doit contenir au moins 3 caractères"
                  }
                })}
                defaultValue={data.number || ""}
                placeholder="202501-001"
                disabled={!canEdit}
                className={`h-10 rounded-lg px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  errors?.number ? 'border-red-500' : ''
                }`}
              />
              {errors?.number && (
                <p className="text-xs text-red-500">
                  {errors.number.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Référence devis */}
        <div className="space-y-2">
          <Label htmlFor="quote-reference" className="text-sm font-medium">
            Référence devis
          </Label>
          <div className="relative">
            <Input
              id="quote-reference"
              value={data.quoteReference || ""}
              onChange={(e) => setValue("quoteReference", e.target.value, { shouldDirty: true })}
              placeholder="DEV-2025-001"
              disabled={!canEdit}
              className="h-10 rounded-lg px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <p className="text-xs text-gray-500">
            Référence du devis associé à cette facture (optionnel)
          </p>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Date d'émission <span className="text-red-500">*</span>
              </Label>
              <input
                type="hidden"
                {...register("issueDate", {
                  required: "La date d'émission est requise",
                  validate: {
                    notInFuture: (value) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selectedDate = new Date(value);
                      return selectedDate <= today || "La date ne peut pas être dans le futur";
                    }
                  }
                })}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 rounded-lg px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                      !data.issueDate && "text-muted-foreground",
                      errors?.issueDate && "border-red-500"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.issueDate ? (
                      format(new Date(data.issueDate), "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.issueDate ? new Date(data.issueDate) : undefined}
                    onSelect={(date) => {
                      setValue("issueDate", date?.toISOString().split('T')[0], { shouldDirty: true, shouldValidate: true });
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
              <Label className="text-sm font-medium">
                Date d'exécution
              </Label>
              <input
                type="hidden"
                {...register("executionDate", {
                  validate: validateExecutionDate
                })}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 rounded-lg px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                      !data.executionDate && "text-muted-foreground",
                      errors?.executionDate && "border-red-500"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.executionDate ? (
                      format(new Date(data.executionDate), "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.executionDate ? new Date(data.executionDate) : undefined}
                    onSelect={(date) => {
                      setValue("executionDate", date?.toISOString().split('T')[0], { shouldDirty: true, shouldValidate: true });
                    }}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors?.executionDate && (
                <p className="text-xs text-red-500">
                  {errors.executionDate.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Date d'échéance
            </Label>
            <div className="grid grid-cols-2 gap-2 w-full">
              <input
                type="hidden"
                {...register("dueDate", {
                  validate: validateDueDate
                })}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 rounded-lg px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                      !data.dueDate && "text-muted-foreground",
                      errors?.dueDate && "border-red-500"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.dueDate ? (
                      format(new Date(data.dueDate), "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.dueDate ? new Date(data.dueDate) : undefined}
                    onSelect={(date) => {
                      const dateStr = date?.toISOString().split('T')[0];
                      setValue("dueDate", dateStr, { shouldDirty: true, shouldValidate: true });
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
                  const dueDate = new Date(issueDate);
                  dueDate.setDate(dueDate.getDate() + days);
                  setValue("dueDate", dueDate.toISOString().split('T')[0], { shouldDirty: true });
                }}
                disabled={!canEdit}
              >
                <SelectTrigger className="h-10 rounded-lg px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full">
                  <SelectValue placeholder="+" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS_SUGGESTIONS.map((term) => (
                    <SelectItem key={term.value} value={term.value.toString()}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs">
              Utilisez le sélecteur "+" pour ajouter des jours automatiquement
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
