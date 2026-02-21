"use client";

import { useState, useEffect, useId } from "react";
import { useFormContext } from "react-hook-form";
import {
  ChevronDownIcon,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_PRODUCTS } from "@/src/graphql/queries/products";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import PercentageSliderInput from "@/src/components/percentage-slider-input";
import CustomFieldsSection from "./quote-form-sections/CustomFieldsSection";
import QuoteInfoSection from "./quote-form-sections/QuoteInfoSection";
import ItemsSection from "./quote-form-sections/ItemsSection";
import DiscountAndTotalsSection from "./quote-form-sections/DiscountsAndTotalsSection";
import ShippingSection from "./quote-form-sections/ShippingSection";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { cn } from "@/src/lib/utils";
import ClientSelector from "./quote-form-sections/client-selector";

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
            "w-full justify-between",
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
  const [advancedOpen, setAdvancedOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("quote-advanced-options-open") === "true";
  });

  // Auto-open si options avancées déjà utilisées
  useEffect(() => {
    const hasAdvanced =
      data.retenueGarantie > 0 ||
      data.escompte > 0 ||
      data.shipping?.billShipping;
    if (hasAdvanced) setAdvancedOpen(true);
  }, [data.retenueGarantie, data.escompte, data.shipping?.billShipping]);

  const handleAdvancedToggle = (open) => {
    setAdvancedOpen(open);
    localStorage.setItem("quote-advanced-options-open", String(open));
  };

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
        (item) => item.description && item.quantity && item.unitPrice != null && item.unitPrice !== ""
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
              <div>
                <h3 className="font-medium text-lg">
                  Sélection d'un client
                </h3>
                <ClientSelector
                  selectedClient={data.client}
                  onSelect={(client) => updateField("client", client)}
                  disabled={!canEdit}
                  className="p-0"
                  error={
                    validationErrors?.client && !validationErrors.client.canEdit
                      ? validationErrors.client.message ||
                        validationErrors.client
                      : null
                  }
                  setValidationErrors={setValidationErrors}
                  clientPositionRight={data.clientPositionRight || false}
                  onClientPositionChange={(checked) =>
                    updateField("clientPositionRight", checked)
                  }
                  onEditClient={onEditClient}
                />
              </div>

              {/* Section 2: Informations du document */}
              <QuoteInfoSection
                canEdit={canEdit}
                nextQuoteNumber={nextQuoteNumber}
                validateQuoteNumber={validateQuoteNumber}
                hasExistingQuotes={hasExistingQuotes}
                validationErrors={validationErrors}
                documentType={documentType}
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

              {/* Section 2: Remises */}
              <DiscountAndTotalsSection
                canEdit={canEdit}
                validationErrors={validationErrors}
              />

              {/* Options avancées (retenue, escompte, livraison) */}
              <Collapsible open={advancedOpen} onOpenChange={handleAdvancedToggle}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-3"
                  >
                    <ChevronRight
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        advancedOpen && "rotate-90"
                      )}
                    />
                    Options avancées
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-6 pt-2">
                    {/* Retenue de garantie + Escompte */}
                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <PercentageSliderInput
                          label="Retenue de garantie"
                          value={data.retenueGarantie || 0}
                          onChange={(value) => {
                            setValue("retenueGarantie", value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          disabled={!canEdit}
                          minValue={0}
                          maxValue={100}
                          step={1}
                          gaugeColor="#5b50FF"
                          id="retenue-garantie"
                        />
                      </div>
                      <div className="w-1/2">
                        <PercentageSliderInput
                          label="Escompte"
                          value={data.escompte || 0}
                          onChange={(value) => {
                            setValue("escompte", value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          disabled={!canEdit}
                          minValue={0}
                          maxValue={100}
                          step={1}
                          gaugeColor="#5b50FF"
                          id="escompte"
                        />
                      </div>
                    </div>

                    {/* Livraison */}
                    <ShippingSection
                      canEdit={canEdit}
                      validationErrors={validationErrors}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Champs personnalisés */}
              <CustomFieldsSection
                canEdit={canEdit}
                validationErrors={validationErrors}
              />
            </>
          )}
        </div>
      </div>

      {/* Footer avec boutons d'action - Positionné en dehors du flux normal */}
      <div
        className="pt-4 pb-6 z-50 border-t lg:relative lg:bottom-auto lg:pt-4 lg:pb-0 fixed bottom-0 left-0 right-0 bg-background lg:bg-transparent px-4 lg:p-0"
      >
        <div className="max-w-2xl mx-auto px-2 md:px-6 lg:px-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={loading || saving}
                className="hidden md:flex"
              >
                Annuler
              </Button>

              {documentType !== "purchaseOrder" && (
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={!canEdit || saving}
                >
                  {saving ? "Sauvegarde..." : "Brouillon"}
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              {currentStep === 1 && (
                <Button
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={!isStep1Valid() || !canEdit}
                  className="px-6"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="h-4 w-4 sm:ml-2" />
                </Button>
              )}

              {currentStep === 2 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousStep}
                    disabled={!canEdit}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateQuote}
                    disabled={!isStep2Valid() || !canEdit || saving}
                    className="px-6"
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
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Rester
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowCancelDialog(false);
                window.history.back();
              }}
            >
              Quitter
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
