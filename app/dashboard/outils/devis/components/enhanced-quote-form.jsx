"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  Plus,
  Trash2,
  Calculator,
  Building,
  Percent,
  Clock,
  Tag,
  Search,
  Zap,
  Package,
  CheckIcon,
  ChevronDownIcon,
  Download,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_PRODUCTS } from "@/src/graphql/queries/products";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Timeline,
  TimelineHeader,
  TimelineItem,
  TimelineIndicator,
  TimelineSeparator,
  TimelineTitle,
} from "@/src/components/ui/timeline";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";

import QuoteInfoSection from "./quote-form-sections/QuoteInfoSection";
import ItemsSection from "./quote-form-sections/ItemsSection";
import DiscountAndTotalsSection from "./quote-form-sections/DiscountsAndTotalsSection";
import ShippingSection from "./quote-form-sections/ShippingSection";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import ClientSelector from "./quote-form-sections/client-selector";
import { toast } from "@/src/components/ui/sonner";

// Composant de recherche de produits basé sur Origin UI
function ProductSearchCombobox({
  onSelect,
  placeholder = "Rechercher un produit...",
  disabled = false,
  className = "",
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debouncing pour éviter trop de requêtes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Délai de 300ms

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Requête GraphQL pour récupérer les produits
  const { workspaceId } = useRequiredWorkspace();
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: {
      workspaceId,
      search:
        debouncedSearchTerm && debouncedSearchTerm.trim() !== ""
          ? debouncedSearchTerm
          : undefined,
      limit: 20,
    },
    fetchPolicy: "network-only",
    skip: !open || !workspaceId, // Ne pas exécuter la requête si le dropdown n'est pas ouvert
  });

  // Transformation des données pour le composant
  const products =
    data?.products?.products?.map((product) => ({
      value: product.id,
      label: product.name,
      description: product.description,
      price: product.unitPrice,
      vatRate: product.vatRate,
      unit: product.unit,
      category: product.category,
      reference: product.reference,
    })) || [];

  const handleSelect = (currentValue) => {
    const selectedProduct = products.find((p) => p.value === currentValue);
    if (selectedProduct && onSelect) {
      onSelect({
        description: selectedProduct.label,
        quantity: 1,
        unitPrice: selectedProduct.price,
        vatRate:
          selectedProduct.vatRate !== undefined ? selectedProduct.vatRate : 20,
        productId: selectedProduct.value,
        unit: selectedProduct.unit || "unité(s)",
      });
    }
    setValue("");
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setOpen(false);
  };

  // Fonction pour gérer la recherche
  const handleSearchChange = (search) => {
    setSearchTerm(search);
  };

  // Réinitialiser la recherche quand le dropdown se ferme
  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchTerm("");
      setDebouncedSearchTerm("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value
            ? products.find((product) => product.value === value)?.label
            : placeholder}
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)] sm:w-[calc(var(--radix-popover-trigger-width)+12rem)] bg-popover text-popover-foreground"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
        sticky="always"
      >
        <Command
          shouldFilter={false}
          className="bg-popover text-popover-foreground"
        >
          <CommandInput
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onValueChange={handleSearchChange}
            className="bg-transparent"
          />
          <CommandList className="bg-popover">
            {loading && <CommandEmpty>Recherche en cours...</CommandEmpty>}
            {!loading && !debouncedSearchTerm && (
              <CommandEmpty>Tapez pour rechercher un produit...</CommandEmpty>
            )}
            {!loading && debouncedSearchTerm && products.length === 0 && (
              <CommandEmpty>
                Aucun produit trouvé pour "{debouncedSearchTerm}".
              </CommandEmpty>
            )}
            {!loading && products.length > 0 && (
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.value}
                    value={product.value}
                    onSelect={() => handleSelect(product.value)}
                    className="flex flex-col items-start gap-1 p-3"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-normal">{product.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {product.price ? `${product.price}€` : ""}
                      </span>
                    </div>
                    {product.description && (
                      <span className="text-sm text-muted-foreground">
                        {product.description}
                      </span>
                    )}
                    {product.reference && (
                      <span className="text-xs text-muted-foreground">
                        Réf: {product.reference}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function EnhancedQuoteForm({
  onSave,
  onSubmit,
  loading,
  saving,
  readOnly,
  errors,
  nextQuoteNumber,
  validateQuoteNumber,
  hasExistingQuotes,
  validationErrors = {},
  setValidationErrors,
  currentStep: externalCurrentStep,
  onStepChange,
  onEditClient,
  documentType = "quote",
}) {
  const { watch, setValue, getValues, control } = useFormContext();
  const data = watch();
  const [internalCurrentStep, setInternalCurrentStep] = useState(1);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Utiliser l'état externe si fourni, sinon utiliser l'état interne
  const currentStep =
    externalCurrentStep !== undefined
      ? externalCurrentStep
      : internalCurrentStep;
  const setCurrentStep = onStepChange || setInternalCurrentStep;

  const canEdit = !readOnly;

  // Gestion des champs du formulaire
  const updateField = (field, value) => {
    setValue(field, value, { shouldDirty: true });
  };

  const updateNestedField = (parent, field, value) => {
    const current = getValues(parent) || {};
    setValue(`${parent}.${field}`, value, { shouldDirty: true });
  };

  const addItem = (template = null) => {
    const items = getValues("items") || [];
    const newItem = template || {
      description: "",
      details: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      unit: "unité",
    };
    setValue("items", [...items, newItem], { shouldDirty: true });
  };

  const updateItem = (index, field, value) => {
    const items = getValues("items") || [];
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setValue("items", updatedItems, { shouldDirty: true });
  };

  const removeItem = (index) => {
    const items = getValues("items") || [];
    setValue(
      "items",
      items.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  const applyTemplate = (template) => {
    if (template.headerNotes) updateField("headerNotes", template.headerNotes);
    if (template.footerNotes) updateField("footerNotes", template.footerNotes);
    if (template.termsAndConditions)
      updateField("termsAndConditions", template.termsAndConditions);
  };

  const applyDiscount = (discount) => {
    updateField("discountType", discount.type);
    updateField("discountValue", discount.value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleSaveDraft = () => {
    if (onSave) {
      onSave({ ...data, status: "DRAFT" });
    }
  };

  const handleCreateQuote = () => {
    if (onSubmit) {
      onSubmit({ ...data, status: "PENDING" });
    }
  };

  const isStep1Valid = () => {
    // Bloquer si des erreurs de validation sont présentes
    const hasValidationErrors =
      validationErrors && Object.keys(validationErrors).length > 0;
    if (hasValidationErrors) return false;

    // Vérifier que les champs obligatoires sont remplis
    const hasClient = data.client && data.client.id;
    const hasIssueDate = data.issueDate;
    const hasValidUntil = data.validUntil;
    const hasNumber = data.number && data.number.trim() !== "";
    const hasPrefix = data.prefix !== undefined; // Le préfixe peut être vide mais doit exister

    // Tous les champs obligatoires doivent être remplis
    return hasClient && hasIssueDate && hasValidUntil && hasNumber && hasPrefix;
  };

  const isStep2Valid = () => {
    return (
      data.items &&
      data.items.length > 0 &&
      data.items.every(
        (item) => item.description && item.quantity && item.unitPrice
      )
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Form Content */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0">
        <div className="space-y-4 pb-20">
          {/* Étape 1: Détails du document */}
          {currentStep === 1 && (
            <>
              {/* Section 1: Sélection d'un client (en premier comme pour les factures) */}
              <div className="pl-2 pr-2 pt-2">
                <h3 className="font-normal text-lg">
                  Sélection d'un client
                </h3>
                <ClientSelector
                  selectedClient={data.client}
                  onSelect={(client) => updateField("client", client)}
                  disabled={!canEdit}
                  setValidationErrors={setValidationErrors}
                  onEditClient={onEditClient}
                  validationErrors={validationErrors}
                  clientPositionRight={data.clientPositionRight || false}
                  onClientPositionChange={(checked) =>
                    updateField("clientPositionRight", checked)
                  }
                />
              </div>

              {/* Section 2: Informations du document */}
              <QuoteInfoSection
                canEdit={canEdit}
                nextQuoteNumber={nextQuoteNumber}
                validateQuoteNumber={validateQuoteNumber}
                hasExistingQuotes={hasExistingQuotes}
                validationErrors={validationErrors}
              />
            </>
          )}

          {/* Étape 2: Produits et services */}
          {currentStep === 2 && (
            <>
              {/* Section 1: Articles et produits */}
              <ItemsSection
                formatCurrency={formatCurrency}
                canEdit={canEdit}
                ProductSearchCombobox={ProductSearchCombobox}
                validationErrors={validationErrors}
              />

              {/* Section 2: Facturation de livraison */}
              <ShippingSection
                canEdit={canEdit}
                validationErrors={validationErrors}
              />

              {/* Section 3: Remises et totaux */}
              <DiscountAndTotalsSection
                canEdit={canEdit}
                validationErrors={validationErrors}
              />
            </>
          )}
        </div>
      </div>

      {/* Footer avec boutons d'action - Positionné en dehors du flux normal */}
      <div
        className="pt-4 z-50 border-t lg:relative lg:bottom-auto lg:pt-4 fixed bottom-0 left-0 right-0 bg-background lg:bg-transparent p-4 lg:p-0"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-2xl mx-auto px-2 md:px-6 lg:px-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={loading || saving}
                className="text-sm font-normal hidden md:flex"
              >
                Annuler
              </Button>

              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!canEdit || saving}
                className="text-sm font-normal"
              >
                {saving ? "Sauvegarde..." : "Brouillon"}
              </Button>
            </div>

            <div className="flex gap-3">
              {currentStep === 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          onClick={handleNextStep}
                          disabled={!isStep1Valid() || !canEdit}
                          className="px-6 text-sm font-normal"
                        >
                          <span className="hidden sm:inline">Suivant</span>
                          <ChevronRight className="h-4 w-4 sm:ml-2" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isStep1Valid() && (
                      <TooltipContent>
                        <p className="text-xs">
                          {validationErrors &&
                          Object.keys(validationErrors).length > 0
                            ? "Corrigez les erreurs avant de continuer"
                            : "Remplissez tous les champs obligatoires"}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}

              {currentStep === 2 && (
                <>
                  <Button
                    className="text-sm font-normal"
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousStep}
                    disabled={!canEdit}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleCreateQuote}
                    disabled={!isStep2Valid() || !canEdit || saving}
                    className="px-6 text-sm font-normal"
                  >
                    {saving ? "Création..." : documentType === "purchaseOrder" ? "Créer le bon de commande" : "Créer le devis"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter l'éditeur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir quitter ? Les modifications non
              enregistrées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rester</AlertDialogCancel>
            <AlertDialogAction onClick={() => window.history.back()}>
              Quitter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
