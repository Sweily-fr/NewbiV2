"use client";

import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
} from "react";
import { useFormContext } from "react-hook-form";
import { Calendar as CalendarIcon, Clock, Info } from "lucide-react";
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
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
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
import {
  generateQuotePrefix,
  parseQuotePrefix,
  formatQuotePrefix,
  getCurrentMonthYear,
  validateQuoteNumber,
  formatQuoteNumber,
  getQuoteDisplayNumber,
} from "@/src/utils/quoteUtils";
import { useLastQuotePrefix } from "@/src/graphql/quoteQueries";

const VALIDITY_PERIOD_SUGGESTIONS = [
  { value: 15, label: "15 jours" },
  { value: 30, label: "30 jours" },
  { value: 45, label: "45 jours" },
  { value: 60, label: "60 jours" },
  { value: 90, label: "90 jours" },
];

export default function QuoteInfoSection({
  canEdit = true,
  nextQuoteNumber = null,
  validateQuoteNumber: validateQuoteNumberProp = null,
  hasExistingQuotes = false,
  validationErrors = {},
}) {
  const {
    setValue,
    register,
    formState: { errors },
    getValues,
  } = useFormContext();
  
  // Helper pour vérifier si les dates ont une erreur
  const hasQuoteInfoError = validationErrors?.quoteInfo;

  // Use getValues instead of watch to prevent re-renders
  const [, forceUpdate] = useState({});
  const data = getValues();

  // Simple state for selected period without complex calculations
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Handle prefix changes with auto-fill for MM and AAAA
  const handlePrefixChange = (e) => {
    const { value } = e.target;
    const cursorPosition = e.target.selectionStart;

    // Check if user is typing MM or AAAA
    if (value.includes("MM")) {
      const { month } = getCurrentMonthYear();
      const newValue = value.replace("MM", month);
      setValue("prefix", newValue, { shouldValidate: true });
      // Move cursor after the inserted month
      setTimeout(() => {
        e.target.setSelectionRange(
          cursorPosition + month.length - 2,
          cursorPosition + month.length - 2
        );
      }, 0);
      return;
    }

    if (value.includes("AAAA")) {
      const { year } = getCurrentMonthYear();
      const newValue = value.replace("AAAA", year);
      setValue("prefix", newValue, { shouldValidate: true });
      // Move cursor after the inserted year
      setTimeout(() => {
        e.target.setSelectionRange(
          cursorPosition + year.length - 4,
          cursorPosition + year.length - 4
        );
      }, 0);
      return;
    }

    // For normal typing, just update the value
    setValue("prefix", value, { shouldValidate: true });
  };

  // Get the last quote prefix
  const { prefix: lastQuotePrefix, loading: loadingLastPrefix } = useLastQuotePrefix();
  
  // Flag pour savoir si le préfixe a déjà été initialisé
  const prefixInitialized = useRef(false);

  // Initialize defaults only once on mount
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    setInitialized(true);

    // Initialize without causing re-renders
    const currentData = getValues();

    if (!currentData.issueDate) {
      const today = new Date();
      setValue("issueDate", today.toISOString().split("T")[0], {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, []);

  // Set default prefix from last quote only once on mount (only for new quotes)
  useEffect(() => {
    // Ne pré-remplir que si :
    // 1. Les données sont chargées
    // 2. Pas encore initialisé
    // 3. Le champ prefix est vide
    // 4. Il existe un préfixe de dernier devis
    // 5. C'est un nouveau devis (pas d'ID)
    const isNewQuote = !data.id;
    
    if (!loadingLastPrefix && !prefixInitialized.current && !data.prefix && lastQuotePrefix && isNewQuote) {
      setValue("prefix", lastQuotePrefix, { shouldValidate: false, shouldDirty: false });
      prefixInitialized.current = true;
    }
  }, [lastQuotePrefix, loadingLastPrefix, data.id]);

  // Fonction utilitaire pour créer une date sans l'heure
  const createDateWithoutTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // Crée une nouvelle date en ne gardant que l'année, le mois et le jour
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const validateValidUntil = (value) => {
    if (!value) return "La date de validité est requise";

    // Créer des dates sans l'heure pour la comparaison
    const validUntilDate = createDateWithoutTime(value);
    const issueDateValue = data.issueDate;

    if (!validUntilDate || isNaN(validUntilDate.getTime())) {
      return "La date de validité n'est pas valide";
    }

    if (issueDateValue) {
      const issueDate = createDateWithoutTime(issueDateValue);

      if (!issueDate || isNaN(issueDate.getTime())) {
        return "La date d'émission n'est pas valide";
      }

      // Comparaison des timestamps des dates sans heure
      if (validUntilDate.getTime() < issueDate.getTime()) {
        return "La date de validité doit être postérieure ou égale à la date d'émission";
      }
    }

    return true;
  };

  return (
    <Card className="shadow-none p-2 border-none bg-transparent">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-normal text-lg">
          {/* <Clock className="h-5 w-5" /> */}
          Informations du devis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Préfixe et numéro de devis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="quote-prefix" className="text-sm font-normal">
                Préfixe de devis
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Préfixe personnalisable pour identifier vos devis. Tapez{" "}
                    <span className="font-mono">MM</span> pour insérer le mois actuel
                    ou <span className="font-mono">AAAA</span> pour l'année.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-1">
              <div className="relative">
                <Input
                  id="quote-prefix"
                  {...register("prefix", {
                    required: "Le préfixe est requis",
                    maxLength: {
                      value: 20,
                      message: "Le préfixe ne doit pas dépasser 20 caractères",
                    },
                    pattern: {
                      value: /^D-\d{6}$/,
                      message: "Format attendu : D-MMAAAA (ex: D-022025)",
                    },
                  })}
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
                        setValue(
                          "prefix",
                          formatQuotePrefix(parsed.month, parsed.year),
                          { shouldValidate: true }
                        );
                      }
                    }
                  }}
                  placeholder="D-MMAAAA"
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
              <Label htmlFor="quote-number" className="text-sm font-normal">
                Numéro de devis
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Numéro unique et séquentiel de votre devis. Il sera automatiquement
                    formaté avec des zéros (ex: 000001). La numérotation doit être
                    continue sans saut.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-1">
              <Input
                id="quote-number"
                {...register("number", {
                  required: "Le numéro de devis est requis",
                  validate: {
                    isValid: (value) => {
                      // Skip validation for DRAFT- prefixed numbers
                      if (value && value.startsWith("DRAFT-")) {
                        return true;
                      }

                      // Use the new validation function if provided
                      if (validateQuoteNumberProp) {
                        const validation = validateQuoteNumberProp(value);
                        return validation.isValid || validation.message;
                      }

                      // Fallback to old validation
                      if (!validateQuoteNumber(value)) {
                        return "Le numéro doit contenir entre 1 et 6 chiffres uniquement";
                      }
                      return true;
                    },
                  },
                })}
                value={data.number || ""}
                placeholder="000001"
                disabled={!canEdit}
                readOnly={data.number && data.number.startsWith("DRAFT-")}
                onBlur={(e) => {
                  // Don't format DRAFT- numbers
                  if (e.target.value && e.target.value.startsWith("DRAFT-")) {
                    return;
                  }

                  // Format with leading zeros when leaving the field
                  if (e.target.value && validateQuoteNumber(e.target.value)) {
                    const formattedNum = formatQuoteNumber(e.target.value);
                    setValue("number", formattedNum, { shouldValidate: true });
                  }
                }}
              />
              {errors?.number && (
                <p className="text-xs text-red-500">{errors.number.message}</p>
              )}
              {data.number && data.number.startsWith("DRAFT-") && (
                <p className="text-xs text-blue-600">
                  Numéro de brouillon - sera remplacé lors de la validation
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Référence projet */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="project-reference" className="text-sm font-normal">
              Référence projet
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                <p>
                  Référence du projet associé à ce devis (optionnel). Utile pour
                  organiser et retrouver facilement vos devis par projet.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <Input
              id="project-reference"
              value={data.projectReference || ""}
              onChange={(e) =>
                setValue("projectReference", e.target.value, {
                  shouldDirty: true,
                })
              }
              placeholder="PROJ-2025-001"
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-normal">Date d'émission *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Date à laquelle le devis est créé et envoyé au client. Par défaut,
                    c'est la date du jour. Cette date sert de référence pour calculer
                    la validité du devis.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <input
              type="hidden"
              {...register("issueDate", {
                required: "La date d'émission est requise",
              })}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!canEdit}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.issueDate && "text-muted-foreground",
                    hasQuoteInfoError && "border-destructive focus-visible:ring-destructive"
                  )}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.issueDate ? (
                    (() => {
                      try {
                        const date = new Date(data.issueDate);
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
                    data.issueDate ? new Date(data.issueDate) : undefined
                  }
                  onSelect={(date) => {
                    setValue("issueDate", format(date, "yyyy-MM-dd"), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            {(errors?.issueDate || hasQuoteInfoError) && (
              <p className="text-xs text-destructive">
                {errors?.issueDate?.message || (hasQuoteInfoError && "Veuillez vérifier la date d'émission")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-normal">Valide jusqu'au *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>
                    Date limite de validité du devis. Après cette date, les conditions
                    et tarifs proposés ne seront plus garantis. Utilisez le sélecteur
                    pour ajouter automatiquement 15, 30, 45, 60 ou 90 jours.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <input
                type="hidden"
                {...register("validUntil", {
                  required: "La date de validité est requise",
                  validate: validateValidUntil,
                })}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.validUntil && "text-muted-foreground",
                      hasQuoteInfoError && "border-destructive focus-visible:ring-destructive"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {(() => {
                      try {
                        // Si la valeur est vide, afficher le texte par défaut
                        if (!data.validUntil && data.validUntil !== 0) {
                          return <span>Choisir une date</span>;
                        }

                        let date;
                        const value = data.validUntil;

                        // 1. Vérifier si c'est une chaîne au format YYYY-MM-DD
                        if (
                          typeof value === "string" &&
                          /^\d{4}-\d{2}-\d{2}$/.test(value)
                        ) {
                          date = new Date(value);
                        }
                        // 2. Vérifier si c'est un timestamp numérique (nombre ou chaîne de chiffres)
                        else if (
                          (typeof value === "string" && /^\d+$/.test(value)) ||
                          (typeof value === "number" && !isNaN(value))
                        ) {
                          const timestamp = parseInt(value, 10);
                          // Convertir en millisecondes si c'est en secondes (10 chiffres)
                          date = new Date(
                            timestamp.toString().length === 10
                              ? timestamp * 1000
                              : timestamp
                          );
                        }
                        // 3. Vérifier si c'est une chaîne ISO (2024-09-25T00:00:00.000Z)
                        else if (
                          typeof value === "string" &&
                          value.includes("T")
                        ) {
                          date = new Date(value);
                        }
                        // 4. Vérifier si c'est un objet Date
                        else if (value instanceof Date) {
                          date = value;
                        }
                        // 5. Si aucun des formats ci-dessus, essayer de créer une date à partir de la valeur
                        else {
                          date = new Date(value);
                        }

                        // Vérifier que la date est valide
                        if (!date || isNaN(date.getTime())) {
                          return <span>Date invalide</span>;
                        }

                        // Formater la date pour l'affichage
                        const formattedDate = format(date, "PPP", {
                          locale: fr,
                        });

                        return formattedDate;
                      } catch (error) {
                        return <span>Date invalide</span>;
                      }
                    })()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={(() => {
                      if (!data.validUntil) return undefined;

                      try {
                        let date;
                        // Si c'est un timestamp (nombre ou chaîne de chiffres)
                        if (
                          (typeof data.validUntil === "string" &&
                            /^\d+$/.test(data.validUntil)) ||
                          typeof data.validUntil === "number"
                        ) {
                          const timestamp = parseInt(data.validUntil, 10);
                          // Vérifier si c'est un timestamp en secondes (10 chiffres) ou millisecondes (13 chiffres)
                          date = new Date(
                            timestamp.toString().length === 10
                              ? timestamp * 1000
                              : timestamp
                          );
                        }
                        // Si c'est une chaîne de date ISO (2024-09-25T00:00:00.000Z)
                        else if (
                          typeof data.validUntil === "string" &&
                          data.validUntil.includes("T")
                        ) {
                          date = new Date(data.validUntil.split("T")[0]);
                        }
                        // Si c'est déjà une chaîne de date au format YYYY-MM-DD
                        else if (typeof data.validUntil === "string") {
                          date = new Date(data.validUntil);
                        }
                        // Si c'est déjà un objet Date
                        else if (data.validUntil instanceof Date) {
                          date = data.validUntil;
                        }

                        return date && !isNaN(date.getTime())
                          ? date
                          : undefined;
                      } catch (error) {
                        return undefined;
                      }
                    })()}
                    onSelect={(date) => {
                      if (!date) return;
                      const dateStr = format(date, "yyyy-MM-dd");
                      setValue("validUntil", dateStr, {
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
                value={selectedPeriod || ""}
                onValueChange={(value) => {
                  if (!value || value === "custom") return;
                  const days = parseInt(value);
                  const issueDate = new Date(data.issueDate || new Date());
                  const validUntil = new Date(issueDate);
                  validUntil.setDate(validUntil.getDate() + days);

                  setValue(
                    "validUntil",
                    validUntil.toISOString().split("T")[0],
                    { shouldDirty: true, shouldValidate: false }
                  );
                  setSelectedPeriod(value);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez une valeur" />
                </SelectTrigger>
                <SelectContent>
                  {VALIDITY_PERIOD_SUGGESTIONS.map((period) => (
                    <SelectItem
                      key={period.value}
                      value={period.value.toString()}
                    >
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(errors?.validUntil || hasQuoteInfoError) && (
              <p className="text-xs text-destructive">
                {errors?.validUntil?.message || (hasQuoteInfoError && "Veuillez vérifier la date de validité")}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Utilisez le sélecteur pour ajouter des jours automatiquement
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
