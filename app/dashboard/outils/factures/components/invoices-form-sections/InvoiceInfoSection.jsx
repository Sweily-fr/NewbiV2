"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import {
  Calendar as CalendarIcon,
  Clock,
  Building,
  Info,
  Search,
  FileText,
  Receipt,
  ChevronDown,
  ClipboardList,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLazyQuery, useQuery } from "@apollo/client";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemWithDescription,
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
import { cn } from "@/src/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import {
  generateInvoicePrefix,
  parseInvoicePrefix,
  formatInvoicePrefix,
  getCurrentMonthYear,
} from "@/src/utils/invoiceUtils";
import { useInvoiceNumber } from "../../hooks/use-invoice-number";
import {
  useLastInvoicePrefix,
  GET_SITUATION_INVOICES_BY_QUOTE_REF,
  GET_SITUATION_REFERENCES,
} from "@/src/graphql/invoiceQueries";
import {
  GET_QUOTE_BY_NUMBER,
  SEARCH_QUOTES_FOR_REFERENCE,
} from "@/src/graphql/quoteQueries";
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

const PAYMENT_TERMS_SUGGESTIONS = [
  { value: 0, label: "Paiement à réception" },
  { value: 15, label: "15 jours" },
  { value: 30, label: "30 jours" },
  { value: 45, label: "45 jours" },
  { value: 60, label: "60 jours" },
];

export default function InvoiceInfoSection({
  canEdit,
  validateInvoiceNumber: validateInvoiceNumberExists,
  onSituationNumberChange,
  onPreviousSituationInvoicesChange,
  itemsInitializedForRef,
}) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
    trigger,
  } = useFormContext();
  const data = watch();
  const { workspaceId } = useRequiredWorkspace();

  // Get the next invoice number and validation function
  const {
    nextInvoiceNumber,
    validateInvoiceNumber,
    isLoading: isLoadingInvoiceNumber,
    getFormattedNextNumber,
    hasExistingInvoices,
  } = useInvoiceNumber();

  // Get the last invoice prefix
  const { prefix: lastInvoicePrefix, loading: loadingLastPrefix } =
    useLastInvoicePrefix();

  // Query pour rechercher les factures de situation par référence devis
  const [
    fetchSituationInvoices,
    { data: situationData, loading: loadingSituation },
  ] = useLazyQuery(GET_SITUATION_INVOICES_BY_QUOTE_REF, {
    fetchPolicy: "network-only",
  });

  // Query pour récupérer le devis par son numéro (pour le total du contrat)
  const [fetchQuoteByNumber, { data: quoteData, loading: loadingQuote }] =
    useLazyQuery(GET_QUOTE_BY_NUMBER, { fetchPolicy: "network-only" });

  // State pour la recherche de références
  const [referenceSearchOpen, setReferenceSearchOpen] = React.useState(false);
  const [referenceSearchTerm, setReferenceSearchTerm] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");
  const [referenceFilter, setReferenceFilter] = React.useState("all"); // "all", "quotes", "situations"

  // Debounce pour la recherche
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(referenceSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [referenceSearchTerm]);

  // Query pour rechercher les devis acceptés
  const { data: quotesData, loading: loadingQuotes } = useQuery(
    SEARCH_QUOTES_FOR_REFERENCE,
    {
      variables: {
        workspaceId,
        search: debouncedSearchTerm || undefined,
        limit: 10,
      },
      skip: !referenceSearchOpen || !workspaceId,
      fetchPolicy: "network-only",
    }
  );

  // Debug: afficher les devis reçus
  React.useEffect(() => {
    if (quotesData?.quotes?.quotes) {
      console.log(
        "📋 [QUOTES SEARCH] Devis reçus:",
        quotesData.quotes.quotes.map((q) => ({
          id: q.id,
          number: q.number,
          prefix: q.prefix,
          fullRef: q.prefix ? `${q.prefix}-${q.number}` : q.number,
          finalTotalTTC: q.finalTotalTTC,
          client: q.client?.name,
        }))
      );
    }
  }, [quotesData]);

  // Query pour rechercher les références de situation existantes
  const { data: situationRefsData, loading: loadingSituationRefs } = useQuery(
    GET_SITUATION_REFERENCES,
    {
      variables: {
        workspaceId,
        search: debouncedSearchTerm || undefined,
      },
      skip: !referenceSearchOpen || !workspaceId,
      fetchPolicy: "network-only",
    }
  );

  // State pour stocker le numéro de situation
  const [situationNumber, setSituationNumber] = React.useState(1);

  // Flag pour savoir si le préfixe a déjà été initialisé
  const prefixInitialized = React.useRef(false);
  // Flag pour éviter la validation au premier montage
  const isInitialMount = React.useRef(true);

  // Marquer que le montage initial est terminé après le premier rendu
  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // Rechercher les factures de situation et le devis quand le type est "situation" et qu'il y a une référence
  React.useEffect(() => {
    if (data.invoiceType === "situation" && workspaceId) {
      // Utiliser situationReference en priorité, sinon purchaseOrderNumber
      const reference = data.situationReference || data.purchaseOrderNumber;

      if (reference) {
        console.log(
          `🔍 Recherche des factures de situation pour la référence: ${reference}`
        );
        fetchSituationInvoices({
          variables: {
            workspaceId,
            purchaseOrderNumber: reference,
          },
        });
      }

      // Récupérer aussi le devis si purchaseOrderNumber est fourni
      if (data.purchaseOrderNumber) {
        fetchQuoteByNumber({
          variables: {
            workspaceId,
            number: data.purchaseOrderNumber,
          },
        });
      }
    }
  }, [
    data.invoiceType,
    data.situationReference,
    data.purchaseOrderNumber,
    workspaceId,
    fetchSituationInvoices,
    fetchQuoteByNumber,
  ]);

  // Copier les articles du devis quand il est récupéré (si pas de factures de situation existantes)
  React.useEffect(() => {
    if (
      data.invoiceType === "situation" &&
      quoteData?.quoteByNumber &&
      data.purchaseOrderNumber
    ) {
      const quote = quoteData.quoteByNumber;
      const quoteFullRef = quote.prefix
        ? `${quote.prefix}-${quote.number}`
        : quote.number;

      console.log("📋 [QUOTE COPY] Devis récupéré:", {
        quoteFullRef,
        purchaseOrderNumber: data.purchaseOrderNumber,
        match: quoteFullRef === data.purchaseOrderNumber,
        itemsCount: quote.items?.length,
        finalTotalTTC: quote.finalTotalTTC,
      });

      // Vérifier que le devis récupéré correspond bien à la référence sélectionnée
      if (quoteFullRef !== data.purchaseOrderNumber) {
        return;
      }

      const existingInvoices = situationData?.situationInvoicesByQuoteRef || [];

      // Ne copier les articles du devis que s'il n'y a pas de factures de situation existantes
      if (
        existingInvoices.length === 0 &&
        quote.items &&
        quote.items.length > 0
      ) {
        // Ne pas re-copier si les articles ont déjà été initialisés pour cette référence
        const currentRef = data.situationReference || data.purchaseOrderNumber;
        if (itemsInitializedForRef?.current === currentRef) return;

        console.log("📋 [QUOTE COPY] Copie des articles:", quote.items);

        const copiedItems = quote.items.map((item) => ({
          description: item.description || "",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          vatRate: item.vatRate ?? 20,
          unit: item.unit || "unité",
          discount: item.discount || 0,
          discountType: item.discountType || "PERCENTAGE",
          progressPercentage: 0,
        }));

        setValue("items", copiedItems, { shouldDirty: true });

        // Synchroniser globalProgressPercentage avec les items (0% pour la première situation)
        setValue("globalProgressPercentage", 0, { shouldDirty: true });

        // Copier aussi le client si disponible
        if (quote.client) {
          const clientData = quote.client;
          setValue(
            "client",
            {
              id: clientData.id || "",
              name: clientData.name || "",
              email: clientData.email || "",
              type: clientData.type || "COMPANY",
              vatNumber: clientData.vatNumber || "",
              siret: clientData.siret || "",
              address: {
                fullName: clientData.address?.fullName || "",
                street: clientData.address?.street || "",
                city: clientData.address?.city || "",
                postalCode: clientData.address?.postalCode || "",
                country: clientData.address?.country || "",
              },
            },
            { shouldDirty: true }
          );
        }

        // Marquer comme initialisé pour cette référence
        if (itemsInitializedForRef) itemsInitializedForRef.current = currentRef;
      }
    }
  }, [
    quoteData,
    situationData,
    data.invoiceType,
    data.purchaseOrderNumber,
    setValue,
  ]);

  // Calculer le numéro de situation et copier les articles de la dernière facture de situation
  React.useEffect(() => {
    if (data.invoiceType === "situation") {
      const existingInvoices = situationData?.situationInvoicesByQuoteRef || [];
      // Exclure la facture actuelle si elle est en mode édition
      const otherInvoices = data.id
        ? existingInvoices.filter((inv) => inv.id !== data.id)
        : existingInvoices;
      const newSituationNumber = otherInvoices.length + 1;
      setSituationNumber(newSituationNumber);
      // Mettre à jour le numéro de situation dans le formulaire
      setValue("situationNumber", newSituationNumber, { shouldDirty: false });
      // Notifier le parent si callback fourni
      if (onSituationNumberChange) {
        onSituationNumberChange(newSituationNumber);
      }
      // Notifier le parent des factures de situation précédentes pour le récapitulatif
      if (onPreviousSituationInvoicesChange) {
        onPreviousSituationInvoicesChange(otherInvoices);
      }

      // Copier les articles de la dernière facture de situation
      // (priorité sur le devis car les factures de situation peuvent avoir des modifications)
      if (otherInvoices.length > 0) {
        // Ne pas re-copier si les articles ont déjà été initialisés pour cette référence
        const currentRef = data.situationReference || data.purchaseOrderNumber;
        if (itemsInitializedForRef?.current === currentRef) return;

        // Calculer l'avancement cumulé des factures précédentes
        let cumulativeProgress = 0;
        otherInvoices.forEach((invoice) => {
          if (invoice.items && invoice.items.length > 0) {
            const avgProgress =
              invoice.items.reduce((sum, item) => {
                return sum + (item.progressPercentage || 0);
              }, 0) / invoice.items.length;
            cumulativeProgress += avgProgress;
          }
        });
        cumulativeProgress = Math.min(cumulativeProgress, 100);
        const remaining = Math.max(0, 100 - cumulativeProgress);

        // Pré-remplir le pourcentage restant pour la nouvelle situation (seulement en création)
        if (!data.id && cumulativeProgress > 0) {
          setValue("globalProgressPercentage", remaining, { shouldDirty: true });
        } else if (!data.id) {
          setValue("globalProgressPercentage", 0, { shouldDirty: true });
        }

        // Prendre la dernière facture de situation (triée par date croissante, donc la dernière est à la fin)
        const lastSituationInvoice = otherInvoices[otherInvoices.length - 1];

        if (
          lastSituationInvoice.items &&
          lastSituationInvoice.items.length > 0
        ) {
          console.log(
            "📋 [SITUATION COPY] Copie des articles de la dernière facture de situation:",
            lastSituationInvoice.items.length,
            "articles"
          );

          // Pré-remplir avec le pourcentage restant (ou 0 si pas de cumul)
          const itemProgress = !data.id && cumulativeProgress > 0 ? remaining : 0;

          // Copier les articles avec progressPercentage pré-rempli
          const copiedItems = lastSituationInvoice.items.map((item) => ({
            description: item.description || "",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            vatRate: item.vatRate ?? 20,
            unit: item.unit || "unité",
            discount: item.discount || 0,
            discountType: item.discountType || "PERCENTAGE",
            progressPercentage: itemProgress,
          }));

          setValue("items", copiedItems, { shouldDirty: true });

          // Copier aussi le client si disponible
          if (lastSituationInvoice.client) {
            const clientData = lastSituationInvoice.client;
            setValue(
              "client",
              {
                id: clientData.id || "",
                name: clientData.name || "",
                email: clientData.email || "",
                type: clientData.type || "COMPANY",
                vatNumber: clientData.vatNumber || "",
                siret: clientData.siret || "",
                address: {
                  fullName: clientData.address?.fullName || "",
                  street: clientData.address?.street || "",
                  city: clientData.address?.city || "",
                  postalCode: clientData.address?.postalCode || "",
                  country: clientData.address?.country || "",
                },
              },
              { shouldDirty: true }
            );
          }

          // Copier les informations financières supplémentaires
          if (lastSituationInvoice.escompte !== undefined) {
            setValue("escompte", lastSituationInvoice.escompte, {
              shouldDirty: true,
            });
          }
          if (lastSituationInvoice.retenueGarantie !== undefined) {
            setValue("retenueGarantie", lastSituationInvoice.retenueGarantie, {
              shouldDirty: true,
            });
          }
          if (lastSituationInvoice.isReverseCharge !== undefined) {
            setValue("isReverseCharge", lastSituationInvoice.isReverseCharge, {
              shouldDirty: true,
            });
          }

          // Copier la remise globale
          if (lastSituationInvoice.discount !== undefined) {
            setValue("discount", lastSituationInvoice.discount, {
              shouldDirty: true,
            });
          }
          if (lastSituationInvoice.discountType !== undefined) {
            setValue("discountType", lastSituationInvoice.discountType, {
              shouldDirty: true,
            });
          }

          // Copier les notes et conditions
          if (lastSituationInvoice.headerNotes !== undefined) {
            setValue("headerNotes", lastSituationInvoice.headerNotes, {
              shouldDirty: true,
            });
          }
          if (lastSituationInvoice.footerNotes !== undefined) {
            setValue("footerNotes", lastSituationInvoice.footerNotes, {
              shouldDirty: true,
            });
          }
          if (lastSituationInvoice.termsAndConditions !== undefined) {
            setValue(
              "termsAndConditions",
              lastSituationInvoice.termsAndConditions,
              { shouldDirty: true }
            );
          }

          // Copier les préférences d'affichage
          if (lastSituationInvoice.showBankDetails !== undefined) {
            setValue("showBankDetails", lastSituationInvoice.showBankDetails, {
              shouldDirty: true,
            });
          }
          if (lastSituationInvoice.clientPositionRight !== undefined) {
            setValue(
              "clientPositionRight",
              lastSituationInvoice.clientPositionRight,
              { shouldDirty: true }
            );
          }

          console.log("💰 [SITUATION COPY] Informations complètes copiées:", {
            escompte: lastSituationInvoice.escompte,
            retenueGarantie: lastSituationInvoice.retenueGarantie,
            isReverseCharge: lastSituationInvoice.isReverseCharge,
            discount: lastSituationInvoice.discount,
            discountType: lastSituationInvoice.discountType,
            showBankDetails: lastSituationInvoice.showBankDetails,
            clientPositionRight: lastSituationInvoice.clientPositionRight,
          });
        }

        // Marquer comme initialisé pour cette référence
        if (itemsInitializedForRef) itemsInitializedForRef.current = currentRef;
      }
      // Note: Si pas de factures de situation existantes, les articles seront copiés depuis le devis
      // par l'autre useEffect (QUOTE COPY)
    } else {
      // Si ce n'est plus une facture de situation, vider les factures précédentes
      if (onPreviousSituationInvoicesChange) {
        onPreviousSituationInvoicesChange([]);
      }
    }
  }, [
    situationData,
    data.invoiceType,
    data.id,
    data.situationReference,
    data.purchaseOrderNumber,
    setValue,
    onSituationNumberChange,
    onPreviousSituationInvoicesChange,
  ]);

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

    console.log("[InvoiceInfoSection] handlePrefixChange - New value:", value);

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

    console.log(
      "[InvoiceInfoSection] useEffect - Current prefix:",
      data.prefix
    );
    console.log(
      "[InvoiceInfoSection] useEffect - Last invoice prefix:",
      lastInvoicePrefix
    );
    console.log(
      "[InvoiceInfoSection] useEffect - Will set?",
      !loadingLastPrefix &&
        !prefixInitialized.current &&
        !data.prefix &&
        lastInvoicePrefix &&
        isNewInvoice
    );

    if (
      !loadingLastPrefix &&
      !prefixInitialized.current &&
      !data.prefix &&
      lastInvoicePrefix &&
      isNewInvoice
    ) {
      console.log("[InvoiceInfoSection] Setting prefix to:", lastInvoicePrefix);
      setValue("prefix", lastInvoicePrefix, {
        shouldValidate: false,
        shouldDirty: false,
      });
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
  // Construire le numéro de facture complet pour l'affichage
  const fullInvoiceNumber = React.useMemo(() => {
    const prefix = data.prefix || "";
    const number =
      data.number ||
      (nextInvoiceNumber ? String(nextInvoiceNumber).padStart(4, "0") : "0001");
    return prefix ? `${prefix}-${number}` : number;
  }, [data.prefix, data.number, nextInvoiceNumber]);

  return (
    <>
      {/* Section Informations de la facture */}
      <Card className="shadow-none p-2 border-none bg-transparent">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 font-normal text-lg">
            Informations de la facture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {/* Numéro automatique de facture - Affiché en premier */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            <span className="text-muted-foreground whitespace-nowrap">
              Numéro automatique de facture :
            </span>
            <span className="font-medium break-all">{fullInvoiceNumber}</span>
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
                      Date à laquelle la facture est créée et envoyée au client.
                      Cette date sert de référence pour calculer la date
                      d'échéance.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <input
                type="hidden"
                {...register("issueDate", { required: false })}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "w-full justify-start font-normal text-left",
                      !data.issueDate && "text-muted-foreground",
                      errors?.issueDate && "border-red-500"
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
                      const dateStr = format(date, "yyyy-MM-dd");
                      setValue("issueDate", dateStr, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
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

            {/* Date d'échéance */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-light">Date d'échéance</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[280px] sm:max-w-xs"
                  >
                    <p>
                      Date limite de paiement de la facture. Au-delà de cette
                      date, des pénalités de retard peuvent s'appliquer.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <input
                type="hidden"
                {...register("dueDate", { validate: validateDueDate })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
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
                      selected={
                        data.dueDate ? new Date(data.dueDate) : undefined
                      }
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
                      shouldValidate: true,
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
                      <SelectItem
                        key={term.value}
                        value={term.value.toString()}
                      >
                        {term.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors?.dueDate && (
                <p className="text-xs text-red-500">{errors.dueDate.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Utilisez le sélecteur pour ajouter des jours automatiquement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Type de facture - Séparée */}
      <Card className="shadow-none p-2 mb-2 border-none bg-transparent">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 font-normal text-lg">
            Type de facture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {/* Sélecteur de type */}
          <div className="space-y-2">
            <Select
              value={data.invoiceType || "standard"}
              onValueChange={(value) => {
                setValue("invoiceType", value, { shouldDirty: true });
                setValue("isDepositInvoice", value === "deposit", {
                  shouldDirty: true,
                });

                if (value === "situation") {
                  if (!data.situationReference && !data.id) {
                    const year = new Date().getFullYear();
                    const randomNum = String(
                      Math.floor(Math.random() * 1000)
                    ).padStart(3, "0");
                    const autoRef = `SIT-${year}-${randomNum}`;
                    setValue("situationReference", autoRef, {
                      shouldDirty: true,
                    });
                  }
                }
              }}
              disabled={!canEdit}
            >
              <SelectTrigger id="invoice-type" className="w-full">
                <SelectValue placeholder="Sélectionner le type de facture" />
              </SelectTrigger>
              <SelectContent>
                <SelectItemWithDescription
                  value="standard"
                  description="Facturer le montant total en une seule facture."
                >
                  Facture
                </SelectItemWithDescription>
                <SelectItemWithDescription
                  value="deposit"
                  description="Facturer le paiement anticipé avec la première facture."
                >
                  Facture d'acompte
                </SelectItemWithDescription>
                <SelectItemWithDescription
                  value="situation"
                  description="Facturer une partie du montant total d'un projet en cours."
                >
                  Facture de situation
                </SelectItemWithDescription>
              </SelectContent>
            </Select>
            {data.invoiceType === "situation" && (
              <p className="text-xs text-muted-foreground">
                Une référence unique est générée automatiquement. Vous pouvez la
                modifier ou utiliser une référence de devis existante pour lier
                plusieurs factures de situation.
                {situationData?.situationInvoicesByQuoteRef?.length > 0 && (
                  <span className="block mt-1 text-primary font-medium">
                    {situationData.situationInvoicesByQuoteRef.length}{" "}
                    facture(s) de situation existante(s) avec cette référence.
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Référence de situation - Combobox unifié */}
          {data.invoiceType === "situation" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="situation-reference"
                    className="text-sm font-light"
                  >
                    Référence de situation{" "}
                    <span className="text-red-500">*</span>
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
                        Tapez une nouvelle référence ou sélectionnez un projet
                        existant pour continuer la facturation progressive.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {canEdit && data.situationReference && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-muted/50 hover:bg-muted rounded-md"
                        onClick={() => {
                          setValue("situationReference", "", {
                            shouldDirty: true,
                          });
                          setValue("purchaseOrderNumber", "", {
                            shouldDirty: true,
                          });
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Effacer pour saisir manuellement</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <input type="hidden" {...register("situationReference")} />
              <Popover
                open={referenceSearchOpen}
                onOpenChange={setReferenceSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={referenceSearchOpen}
                    className={cn(
                      "w-full justify-between font-normal",
                      errors?.situationReference && "border-red-500"
                    )}
                    disabled={!canEdit}
                  >
                    {data.situationReference ? (
                      <span className="flex items-center gap-2">
                        {situationData?.situationInvoicesByQuoteRef?.length >
                        0 ? (
                          <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                        ) : data.purchaseOrderNumber ? (
                          <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : null}
                        {data.situationReference}
                        {situationData?.situationInvoicesByQuoteRef?.length >
                          0 && (
                          <span className="text-xs text-muted-foreground">
                            ({situationData.situationInvoicesByQuoteRef.length}{" "}
                            facture(s))
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Tapez ou sélectionnez une référence...
                      </span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[490px] p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant={
                          referenceFilter === "all" ? "default" : "ghost"
                        }
                        size="sm"
                        className="h-8 text-sm font-normal"
                        onClick={() => setReferenceFilter("all")}
                      >
                        Tout
                      </Button>
                      <Button
                        type="button"
                        variant={
                          referenceFilter === "situations" ? "default" : "ghost"
                        }
                        size="sm"
                        className="h-8 text-sm font-normal"
                        onClick={() => setReferenceFilter("situations")}
                      >
                        <ClipboardList className="h-4 w-4 mr-1.5" />
                        Projets (
                        {situationRefsData?.situationReferences?.length || 0})
                      </Button>
                      <Button
                        type="button"
                        variant={
                          referenceFilter === "quotes" ? "default" : "ghost"
                        }
                        size="sm"
                        className="h-8 text-sm font-normal"
                        onClick={() => setReferenceFilter("quotes")}
                      >
                        <FileText className="h-4 w-4 mr-1.5" />
                        Devis ({quotesData?.quotes?.quotes?.length || 0})
                      </Button>
                    </div>
                  </div>
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Tapez une nouvelle référence ou recherchez..."
                      value={referenceSearchTerm}
                      onValueChange={setReferenceSearchTerm}
                    />
                    <CommandList className="max-h-[280px]">
                      <CommandEmpty>
                        {loadingQuotes || loadingSituationRefs ? (
                          <span className="text-muted-foreground">
                            Recherche en cours...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Aucun projet existant. Tapez pour créer une nouvelle
                            référence.
                          </span>
                        )}
                      </CommandEmpty>

                      {/* Option pour créer une nouvelle référence avec le texte saisi */}
                      {referenceSearchTerm && (
                        <CommandGroup heading="Nouvelle référence">
                          <CommandItem
                            value={`new-${referenceSearchTerm}`}
                            onSelect={() => {
                              setValue(
                                "situationReference",
                                referenceSearchTerm,
                                { shouldDirty: true }
                              );
                              setValue("purchaseOrderNumber", "", {
                                shouldDirty: true,
                              });
                              setReferenceSearchOpen(false);
                              setReferenceSearchTerm("");
                              setReferenceFilter("all");
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Search className="h-4 w-4 text-green-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                Créer "{referenceSearchTerm}"
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Nouveau projet de situation
                              </div>
                            </div>
                          </CommandItem>
                        </CommandGroup>
                      )}

                      {/* Projets de situation existants */}
                      {(referenceFilter === "all" ||
                        referenceFilter === "situations") &&
                        situationRefsData?.situationReferences?.length > 0 &&
                        (() => {
                          const availableRefs =
                            situationRefsData.situationReferences.filter(
                              (ref) => {
                                if (
                                  !ref.contractTotal ||
                                  ref.contractTotal === 0
                                )
                                  return true;
                                return ref.totalTTC < ref.contractTotal;
                              }
                            );

                          if (availableRefs.length === 0) return null;

                          return (
                            <>
                              {referenceSearchTerm && <CommandSeparator />}
                              <CommandGroup
                                heading={`Projets existants (${availableRefs.length})`}
                              >
                                {availableRefs.map((ref) => {
                                  const remaining = ref.contractTotal
                                    ? ref.contractTotal - ref.totalTTC
                                    : null;
                                  return (
                                    <CommandItem
                                      key={ref.reference}
                                      value={ref.reference}
                                      onSelect={() => {
                                        setValue(
                                          "situationReference",
                                          ref.reference,
                                          { shouldDirty: true }
                                        );
                                        setValue("purchaseOrderNumber", "", {
                                          shouldDirty: true,
                                        });
                                        setReferenceSearchOpen(false);
                                        setReferenceSearchTerm("");
                                        setReferenceFilter("all");
                                      }}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-normal truncate">
                                          {ref.reference}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {ref.count} facture(s) • Facturé:{" "}
                                          {formatCurrency(ref.totalTTC)}
                                          {remaining !== null && (
                                            <>
                                              {" • "}
                                              <span
                                                style={{ color: "#5a50ff" }}
                                              >
                                                Reste:{" "}
                                                {formatCurrency(remaining)}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </>
                          );
                        })()}

                      {/* Devis acceptés */}
                      {(referenceFilter === "all" ||
                        referenceFilter === "quotes") &&
                        quotesData?.quotes?.quotes?.length > 0 &&
                        (() => {
                          const availableQuotes =
                            quotesData.quotes.quotes.filter((quote) => {
                              const invoicedTotal =
                                quote.situationInvoicedTotal || 0;
                              const contractTotal = quote.finalTotalTTC || 0;
                              return invoicedTotal < contractTotal;
                            });

                          if (availableQuotes.length === 0) return null;

                          return (
                            <>
                              {(referenceSearchTerm ||
                                situationRefsData?.situationReferences?.length >
                                  0) && <CommandSeparator />}
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
                                    const invoicedTotal =
                                      quote.situationInvoicedTotal || 0;
                                    const remaining =
                                      invoicedTotal > 0
                                        ? quote.finalTotalTTC - invoicedTotal
                                        : quote.finalTotalTTC;

                                    return (
                                      <CommandItem
                                        key={quote.id}
                                        value={fullRef}
                                        onSelect={() => {
                                          // Pour un devis, on utilise la référence du devis comme situationReference
                                          // et on garde aussi purchaseOrderNumber pour le lien avec le devis
                                          setValue(
                                            "situationReference",
                                            fullRef,
                                            { shouldDirty: true }
                                          );
                                          setValue(
                                            "purchaseOrderNumber",
                                            fullRef,
                                            { shouldDirty: true }
                                          );
                                          setReferenceSearchOpen(false);
                                          setReferenceSearchTerm("");
                                          setReferenceFilter("all");
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
                                            {formatCurrency(
                                              quote.finalTotalTTC
                                            )}
                                            {invoicedTotal > 0 && (
                                              <>
                                                {" • "}
                                                <span
                                                  style={{ color: "#5a50ff" }}
                                                >
                                                  Reste:{" "}
                                                  {formatCurrency(remaining)}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
                              </CommandGroup>
                            </>
                          );
                        })()}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors?.situationReference && (
                <p className="text-xs text-red-500">
                  {errors.situationReference.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {situationData?.situationInvoicesByQuoteRef?.length > 0 ? (
                  <span className="text-primary font-medium">
                    {situationData.situationInvoicesByQuoteRef.length}{" "}
                    facture(s) existante(s) • Les articles seront copiés
                    automatiquement
                  </span>
                ) : data.purchaseOrderNumber ? (
                  <span className="text-blue-600 font-medium">
                    Basé sur le devis {data.purchaseOrderNumber} • Les articles
                    seront copiés automatiquement
                  </span>
                ) : (
                  "Tapez une nouvelle référence ou sélectionnez un projet existant"
                )}
              </p>
            </div>
          )}

          {/* Montant total du contrat (pour situations sans devis) */}
          {/* {data.invoiceType === "situation" && !quoteData?.quoteByNumber && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="contract-total" className="text-sm font-light">
                  Montant total du contrat (€)
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
                      Montant total TTC du contrat. Ce montant servira de
                      référence pour valider que le total de toutes les factures
                      de situation ne dépasse pas le contrat.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="contract-total"
                type="number"
                step="0.01"
                min="0"
                {...register("contractTotal", {
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "Le montant doit être positif",
                  },
                })}
                placeholder="Ex: 50000.00"
                disabled={!canEdit}
                className={errors?.contractTotal ? "border-red-500" : ""}
              />
              {errors?.contractTotal && (
                <p className="text-xs text-red-500">
                  {errors.contractTotal.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Optionnel. Si non renseigné, aucune validation du montant total
                ne sera effectuée.
              </p>
            </div>
          )} */}

          {/* Référence devis - uniquement pour les factures standard et acompte */}
          {data.invoiceType !== "situation" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
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
                    <TooltipContent
                      side="top"
                      className="max-w-[280px] sm:max-w-xs"
                    >
                      <p>
                        Référence du devis qui a été accepté et transformé en
                        facture (optionnel). Permet de faire le lien entre devis
                        et facture.
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
                                  // Trier par numéro décroissant pour avoir les plus récents en premier
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
                                  Utiliser "{referenceSearchTerm}"
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
