"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Calendar as CalendarIcon, Clock, Building, Info } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/src/components/ui/calendar";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Switch } from "@/src/components/ui/switch";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  generateInvoicePrefix,
  parseInvoicePrefix,
  formatInvoicePrefix,
  getCurrentMonthYear,
} from "@/src/utils/invoiceUtils";
import { useInvoiceNumber } from "../../hooks/use-invoice-number";
import { useLastInvoicePrefix } from "@/src/graphql/invoiceQueries";

const PAYMENT_TERMS_SUGGESTIONS = [
  { value: 0, label: "Paiement à réception" },
  { value: 15, label: "15 jours" },
  { value: 30, label: "30 jours" },
  { value: 45, label: "45 jours" },
  { value: 60, label: "60 jours" },
];

export default function InvoiceInfoSection({ canEdit }) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
    trigger,
  } = useFormContext();
  const data = watch();

  // Get the next invoice number and validation function
  const {
    nextInvoiceNumber,
    validateInvoiceNumber,
    isLoading: isLoadingInvoiceNumber,
    getFormattedNextNumber,
    hasExistingInvoices,
  } = useInvoiceNumber();

  // Get the last invoice prefix
  const { prefix: lastInvoicePrefix, loading: loadingLastPrefix } = useLastInvoicePrefix();
  
  // Flag pour savoir si le préfixe a déjà été initialisé
  const prefixInitialized = React.useRef(false);

  // Set default invoice number when nextInvoiceNumber is available
  React.useEffect(() => {
    if (!isLoadingInvoiceNumber && nextInvoiceNumber) {
      const formattedNumber = getFormattedNextNumber();

      if (hasExistingInvoices()) {
        // Case 1: Existing invoices - set next sequential number
        if (!data.number || data.number === "") {
          setValue("number", formattedNumber, { shouldValidate: true });
        }
      } else {
        // Case 2: No existing invoices - set to 000001
        if (!data.number || data.number === "" || data.number === "1") {
          setValue("number", "000001", { shouldValidate: true });
        }
        // If user has already entered a number, don't override it
      }

      // Set default due date to today + 30 days for new invoices
      if (!data.dueDate) {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 30);
        setValue("dueDate", dueDate.toISOString().split("T")[0], {
          shouldValidate: true,
        });
      }
    }
  }, [
    nextInvoiceNumber,
    isLoadingInvoiceNumber,
    data.number,
    data.dueDate,
    setValue,
    getFormattedNextNumber,
    hasExistingInvoices,
  ]);

  // Handle prefix changes with auto-fill for MM and AAAA
  const handlePrefixChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    console.log('[InvoiceInfoSection] handlePrefixChange - New value:', value);

    // Auto-fill MM (month)
    if (value.includes("MM")) {
      const { month } = getCurrentMonthYear();
      const newValue = value.replace("MM", month);
      setValue("prefix", newValue, { shouldValidate: true });
      // Position cursor after the inserted month
      const newPosition = cursorPosition + month.length - 2;
      setTimeout(() => {
        e.target.setSelectionRange(newPosition, newPosition);
      }, 0);
      return;
    }

    // Auto-fill AAAA (year)
    if (value.includes("AAAA")) {
      const { year } = getCurrentMonthYear();
      const newValue = value.replace("AAAA", year);
      setValue("prefix", newValue, { shouldValidate: true });
      // Position cursor after the inserted year
      const newPosition = cursorPosition + year.length - 4;
      setTimeout(() => {
        e.target.setSelectionRange(newPosition, newPosition);
      }, 0);
      return;
    }

    // Default behavior
    setValue("prefix", value, { shouldValidate: true });
  };

  // Set default prefix from last invoice only once on mount (only for new invoices)
  React.useEffect(() => {
    const isNewInvoice = !data.id;
    
    console.log('[InvoiceInfoSection] useEffect - Current prefix:', data.prefix);
    console.log('[InvoiceInfoSection] useEffect - Last invoice prefix:', lastInvoicePrefix);
    console.log('[InvoiceInfoSection] useEffect - Will set?', !loadingLastPrefix && !prefixInitialized.current && !data.prefix && lastInvoicePrefix && isNewInvoice);
    
    if (!loadingLastPrefix && !prefixInitialized.current && !data.prefix && lastInvoicePrefix && isNewInvoice) {
      console.log('[InvoiceInfoSection] Setting prefix to:', lastInvoicePrefix);
      setValue("prefix", lastInvoicePrefix, { shouldValidate: false, shouldDirty: false });
      prefixInitialized.current = true;
    }
  }, [lastInvoicePrefix, loadingLastPrefix, data.id]);

  // Set default issue date to today if not already set
  React.useEffect(() => {
    if (!data.issueDate) {
      const today = new Date().toISOString().split("T")[0];
      setValue("issueDate", today, { shouldValidate: true });
    }
  }, [data.issueDate, setValue]);

  // Fonction pour valider la date d'échéance
  const validateDueDate = (value) => {
    if (!value) return true; // Optionnel
    const dueDate = new Date(value);
    const issueDate = new Date(data.issueDate);
    return (
      dueDate >= issueDate ||
      "La date d'échéance doit être postérieure à la date d'émission"
    );
  };

  // Fonction pour valider la date d'exécution
  const validateExecutionDate = (value) => {
    if (!value) return true; // Optionnel
    const executionDate = new Date(value);
    const issueDate = new Date(data.issueDate);
    return (
      executionDate >= issueDate ||
      "La date d'exécution doit être postérieure ou égale à la date d'émission"
    );
  };
  return (
    <Card className="shadow-none p-2 border-none bg-transparent">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-normal text-lg">
          {/* <Clock className="h-5 w-5" /> */}
          Informations de la facture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Facture d'acompte */}
        <div className="flex items-center space-x-3">
          <Switch
            id="deposit-invoice"
            checked={data.isDepositInvoice || false}
            onCheckedChange={(checked) =>
              setValue("isDepositInvoice", checked, { shouldDirty: true })
            }
            disabled={!canEdit}
          />
          <div className="space-y-0.5">
            <Label htmlFor="deposit-invoice" className="text-sm font-light">
              Il s'agit d'une facture d'acompte
            </Label>
          </div>
        </div>

        {/* Préfixe et numéro de facture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="invoice-prefix" className="text-sm font-light">
                Préfixe de facture
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Préfixe personnalisable pour identifier vos factures. Tapez{" "}
                    <span className="font-mono">MM</span> pour insérer le mois actuel
                    ou <span className="font-mono">AAAA</span> pour l'année.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-1">
              <div className="relative">
                <Input
                  id="invoice-prefix"
                  {...register("prefix", {
                    maxLength: {
                      value: 20,
                      message: "Le préfixe ne doit pas dépasser 20 caractères",
                    },
                  })}
                  onChange={handlePrefixChange}
                  placeholder="F-MMYYYY"
                  disabled={!canEdit}
                />
              </div>
              {errors?.prefix && (
                <p className="text-xs text-red-500">{errors.prefix.message}</p>
              )}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="invoice-number" className="text-sm font-light">
                Numéro de facture
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Numéro unique et séquentiel de votre facture. Il sera automatiquement
                    formaté avec des zéros (ex: 000001). La numérotation doit être
                    continue sans saut pour respecter les obligations légales.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-1">
              <Input
                id="invoice-number"
                {...register("number", {
                  required: "Le numéro de facture est requis",
                  validate: {
                    isNumeric: (value) => {
                      if (!/^\d+$/.test(value)) {
                        return "Le numéro doit contenir uniquement des chiffres";
                      }
                      return true;
                    },
                    isValidSequence: (value) => {
                      if (isLoadingInvoiceNumber) return true; // Skip validation while loading
                      const result = validateInvoiceNumber(parseInt(value, 10));
                      return result.isValid || result.message;
                    },
                  },
                  minLength: {
                    value: 1,
                    message: "Le numéro est requis",
                  },
                  maxLength: {
                    value: 6,
                    message: "Le numéro ne peut pas dépasser 6 chiffres",
                  },
                })}
                value={
                  data.number ||
                  (nextInvoiceNumber
                    ? String(nextInvoiceNumber).padStart(6, "0")
                    : "")
                }
                onChange={(e) => {
                  // Allow only numbers and update the value
                  const value = e.target.value.replace(/\D/g, "");
                  setValue("number", value, { shouldValidate: true });
                }}
                placeholder={
                  nextInvoiceNumber
                    ? String(nextInvoiceNumber).padStart(6, "0")
                    : "000001"
                }
                disabled={!canEdit || isLoadingInvoiceNumber}
                onBlur={(e) => {
                  // Format with leading zeros when leaving the field
                  if (e.target.value) {
                    const num = e.target.value.padStart(6, "0");
                    setValue("number", num, { shouldValidate: true });
                  } else if (nextInvoiceNumber) {
                    // If field is empty, set to next invoice number
                    const num = String(nextInvoiceNumber).padStart(6, "0");
                    setValue("number", num, { shouldValidate: true });
                  }
                }}
                className={`${errors?.number ? "border-red-500" : ""}`}
              />
              {errors?.number ? (
                <p className="text-xs text-red-500">{errors.number.message}</p>
              ) : (
                <></>
                // <p className="text-xs text-muted-foreground">
                //   {isLoadingInvoiceNumber
                //     ? "Chargement du prochain numéro..."
                //     : `Prochain numéro suggéré: ${nextInvoiceNumber ? String(nextInvoiceNumber).padStart(6, "0") : "000001"} (numérotation séquentielle)`}
                // </p>
              )}
            </div>
          </div>
        </div>

        {/* Référence devis */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="purchase-order-number"
              className="text-sm font-light"
            >
              Référence devis
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                <p>
                  Référence du devis qui a été accepté et transformé en facture
                  (optionnel). Permet de faire le lien entre devis et facture.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <Input
              id="purchase-order-number"
              value={data.purchaseOrderNumber || ""}
              onChange={(e) =>
                setValue("purchaseOrderNumber", e.target.value, {
                  shouldDirty: true,
                })
              }
              placeholder="D-202501-001"
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-light">
                  Date d'émission <span className="text-red-500">*</span>
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                    <p>
                      Date à laquelle la facture est créée et envoyée au client.
                      Cette date est automatiquement définie lors de la création et
                      sert de référence pour calculer la date d'échéance.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <input
                type="hidden"
                {...register("issueDate", {
                  required: false, // On ne veut plus de message d'erreur
                })}
              />
              <div className="relative">
                <Input
                  value={(() => {
                    if (!data.issueDate) return "";
                    try {
                      const date = new Date(data.issueDate);
                      if (isNaN(date.getTime())) return "";
                      return format(date, "PPP", { locale: fr });
                    } catch (error) {
                      return "";
                    }
                  })()}
                  disabled={true}
                  placeholder="Date automatique"
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors?.issueDate && (
                <p className="text-xs text-red-500">
                  {errors.issueDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-light">Date d'exécution</Label>
                <span className="h-4 w-4" aria-hidden="true"></span>
              </div>
              <input
                type="hidden"
                {...register("executionDate", {
                  validate: validateExecutionDate,
                })}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full font-normal justify-start",
                      !data.executionDate && "text-muted-foreground",
                      errors?.executionDate && "border-red-500"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.executionDate ? (
                      (() => {
                        try {
                          const date = new Date(data.executionDate);
                          if (isNaN(date.getTime()))
                            return <span>Date invalide</span>;
                          return format(date, "PPP", { locale: fr });
                        } catch (error) {
                          return <span>Date invalide</span>;
                        }
                      })()
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      data.executionDate
                        ? new Date(data.executionDate)
                        : undefined
                    }
                    onSelect={(date) => {
                      setValue("executionDate", format(date, "yyyy-MM-dd"), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
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
            <div className="flex items-center gap-2">
              <Label className="text-sm font-light">Date d'échéance</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Date limite de paiement de la facture. Au-delà de cette date,
                    des pénalités de retard peuvent s'appliquer. Utilisez le sélecteur
                    pour ajouter automatiquement 15, 30, 45 ou 60 jours.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
              <input
                type="hidden"
                {...register("dueDate", {
                  validate: validateDueDate,
                })}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start font-normal text-left",
                      !data.dueDate && "text-muted-foreground",
                      errors?.dueDate && "border-red-500"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.dueDate ? (
                      (() => {
                        try {
                          const date = new Date(data.dueDate);
                          if (isNaN(date.getTime()))
                            return <span>Date invalide</span>;
                          return format(date, "PPP", { locale: fr });
                        } catch (error) {
                          return <span>Date invalide</span>;
                        }
                      })()
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
                      const dateStr = format(date, "yyyy-MM-dd");
                      setValue("dueDate", dateStr, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
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
                  setValue("dueDate", dueDate.toISOString().split("T")[0], {
                    shouldDirty: true,
                    shouldValidate: true, // Ajout de la validation
                  });
                }}
                disabled={!canEdit}
                defaultValue="30"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="30 jours" />
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
            {errors?.dueDate && (
              <p className="text-xs text-red-500">{errors.dueDate.message}</p>
            )}
            <p className="text-xs">
              Utilisez le sélecteur "+" pour ajouter des jours automatiquement
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
