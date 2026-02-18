"use client";

import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
} from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@apollo/client";
import { Calendar as CalendarIcon, Clock, Info, Search, FileText, ChevronDown } from "lucide-react";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/src/components/ui/command";
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
import { useLastQuotePrefix, SEARCH_QUOTES_FOR_REFERENCE } from "@/src/graphql/quoteQueries";
import { useLastPurchaseOrderPrefix } from "@/src/graphql/purchaseOrderQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

// Fonction utilitaire pour formater les montants
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

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
  documentType = "quote",
}) {
  const isPurchaseOrder = documentType === "purchaseOrder";
  const documentLabel = isPurchaseOrder ? "bon de commande" : "devis";
  const {
    setValue,
    register,
    formState: { errors },
    getValues,
  } = useFormContext();
  const { workspaceId } = useRequiredWorkspace();

  // Helper pour vérifier si les dates ont une erreur
  const hasQuoteInfoError = validationErrors?.quoteInfo;

  // Use getValues instead of watch to prevent re-renders
  const [, forceUpdate] = useState({});
  const data = getValues();

  // State pour la recherche de référence devis (bons de commande uniquement)
  const [referenceSearchOpen, setReferenceSearchOpen] = useState(false);
  const [referenceSearchTerm, setReferenceSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(referenceSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [referenceSearchTerm]);

  // Query pour rechercher les devis acceptés (uniquement pour les bons de commande)
  const { data: quotesData, loading: loadingQuotes } = useQuery(
    SEARCH_QUOTES_FOR_REFERENCE,
    {
      variables: {
        workspaceId,
        search: debouncedSearchTerm || undefined,
        limit: 10,
      },
      skip: !isPurchaseOrder || !referenceSearchOpen || !workspaceId,
      fetchPolicy: "network-only",
    }
  );

  // Simple state for selected period without complex calculations
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Flag pour éviter la validation au premier montage
  const isInitialMount = React.useRef(true);

  // Marquer que le montage initial est terminé après le premier rendu
  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);

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

  // Get the last prefix (quote or purchase order depending on documentType)
  const { prefix: lastQuotePrefix, loading: loadingLastQuotePrefix } =
    useLastQuotePrefix();
  const { prefix: lastPurchaseOrderPrefix, loading: loadingLastPOPrefix } =
    useLastPurchaseOrderPrefix();

  const lastPrefix = isPurchaseOrder ? lastPurchaseOrderPrefix : lastQuotePrefix;
  const loadingLastPrefix = isPurchaseOrder ? loadingLastPOPrefix : loadingLastQuotePrefix;

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

  // Set default prefix from last document only once on mount (only for new documents)
  useEffect(() => {
    // Ne pré-remplir que si :
    // 1. Les données sont chargées
    // 2. Pas encore initialisé
    // 3. Le champ prefix est vide
    // 4. Il existe un préfixe du dernier document
    // 5. C'est un nouveau document (pas d'ID)
    const isNewDocument = !data.id;

    if (
      !loadingLastPrefix &&
      !prefixInitialized.current &&
      !data.prefix &&
      lastPrefix &&
      isNewDocument
    ) {
      setValue("prefix", lastPrefix, {
        shouldValidate: false,
        shouldDirty: false,
      });
      prefixInitialized.current = true;
    }
  }, [lastPrefix, loadingLastPrefix, data.id]);

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

  // Calculer le numéro complet du document pour l'affichage
  const fullQuoteNumber =
    data.prefix && data.number
      ? `${data.prefix}-${data.number}`
      : data.number || "...";

  return (
    <>
      {/* Section Informations du document */}
      <Card className="shadow-none p-2 border-none bg-transparent">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 font-normal text-lg">
            Informations du {documentLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {/* Numéro automatique - Affiché en premier (comme pour les factures) */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              Numéro automatique de {documentLabel} :
            </span>
            <span className="font-medium">{fullQuoteNumber}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                <p>
                  Ce numéro est généré automatiquement de manière séquentielle.
                  Vous pouvez le personnaliser dans les paramètres avancés
                  ci-dessus.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Dates - Affichées juste après le numéro (empilées verticalement) */}
          <div className="space-y-4">
            {/* Date d'émission */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-light">
                  Date d'émission <span className="text-red-500">*</span>
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[280px] sm:max-w-xs"
                  >
                    <p>
                      Date à laquelle le {documentLabel} est créé et envoyé au client. Par
                      défaut, c'est la date du jour. Cette date sert de
                      référence pour calculer la validité du {documentLabel}.
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
                      hasQuoteInfoError &&
                        "border-destructive focus-visible:ring-destructive"
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
                  {errors?.issueDate?.message ||
                    (hasQuoteInfoError &&
                      "Veuillez vérifier la date d'émission")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-light">
                  Valide jusqu'au <span className="text-red-500">*</span>
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[280px] sm:max-w-xs"
                  >
                    <p>
                      Date limite de validité du {documentLabel}. Après cette date, les
                      conditions et tarifs proposés ne seront plus garantis.
                      Utilisez le sélecteur pour ajouter automatiquement 15, 30,
                      45, 60 ou 90 jours.
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
                        hasQuoteInfoError &&
                          "border-destructive focus-visible:ring-destructive"
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
                            (typeof value === "string" &&
                              /^\d+$/.test(value)) ||
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
                  {errors?.validUntil?.message ||
                    (hasQuoteInfoError &&
                      "Veuillez vérifier la date de validité")}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Utilisez le sélecteur pour ajouter des jours automatiquement
              </p>
            </div>
          </div>

          {/* Référence - masqué pour les bons de commande (utilise "Référence devis" à la place) */}
          {!isPurchaseOrder && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="project-reference" className="text-sm font-light">
                  Référence
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[280px] sm:max-w-xs"
                  >
                    <p>
                      {`Référence du projet associé à ce ${documentLabel} (optionnel). Utile pour organiser et retrouver facilement vos devis par projet.`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
          )}

          {/* Référence devis - uniquement pour les bons de commande */}
          {isPurchaseOrder && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="quote-reference"
                    className="text-sm font-light"
                  >
                    Référence devis
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-[280px] sm:max-w-xs"
                    >
                      <p>
                        Référence du devis accepté lié à ce bon de commande
                        (optionnel). Permet de faire le lien entre devis et bon
                        de commande.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <Popover
                open={referenceSearchOpen}
                onOpenChange={setReferenceSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={referenceSearchOpen}
                    className="w-full justify-between font-normal"
                    disabled={!canEdit}
                  >
                    {data.purchaseOrderNumber || (
                      <span className="text-muted-foreground">
                        Rechercher un devis...
                      </span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[490px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Rechercher un devis..."
                      value={referenceSearchTerm}
                      onValueChange={setReferenceSearchTerm}
                    />
                    <CommandList className="max-h-[280px]">
                      <CommandEmpty>
                        {loadingQuotes ? (
                          <span className="text-muted-foreground">
                            Recherche en cours...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Aucun devis trouvé
                          </span>
                        )}
                      </CommandEmpty>

                      {/* Devis acceptés */}
                      {quotesData?.quotes?.quotes?.length > 0 &&
                        (() => {
                          const availableQuotes = quotesData.quotes.quotes;

                          if (availableQuotes.length === 0) return null;

                          return (
                            <CommandGroup
                              heading={`Devis acceptés (${availableQuotes.length})`}
                            >
                              {[...availableQuotes]
                                .sort((a, b) => {
                                  const numA = parseInt(a.number) || 0;
                                  const numB = parseInt(b.number) || 0;
                                  return numB - numA;
                                })
                                .map((quote) => {
                                  const fullRef = quote.prefix
                                    ? `${quote.prefix}-${quote.number}`
                                    : quote.number;

                                  return (
                                    <CommandItem
                                      key={quote.id}
                                      value={fullRef}
                                      onSelect={() => {
                                        setValue(
                                          "purchaseOrderNumber",
                                          fullRef,
                                          {
                                            shouldDirty: true,
                                          }
                                        );
                                        setReferenceSearchOpen(false);
                                        setReferenceSearchTerm("");
                                      }}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-normal truncate">
                                          {fullRef}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {quote.client?.name} •{" "}
                                          {formatCurrency(quote.finalTotalTTC)}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                            </CommandGroup>
                          );
                        })()}

                      {/* Option pour saisir manuellement */}
                      {referenceSearchTerm && (
                        <>
                          <CommandSeparator />
                          <CommandGroup heading="Saisie manuelle">
                            <CommandItem
                              value={referenceSearchTerm}
                              onSelect={() => {
                                setValue(
                                  "purchaseOrderNumber",
                                  referenceSearchTerm,
                                  { shouldDirty: true }
                                );
                                setReferenceSearchOpen(false);
                                setReferenceSearchTerm("");
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Search className="h-4 w-4 text-gray-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  Utiliser &quot;{referenceSearchTerm}&quot;
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Saisir cette référence manuellement
                                </div>
                              </div>
                            </CommandItem>
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Bouton pour effacer la référence */}
              {data.purchaseOrderNumber && canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setValue("purchaseOrderNumber", "", { shouldDirty: true })
                  }
                >
                  Effacer la référence
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
