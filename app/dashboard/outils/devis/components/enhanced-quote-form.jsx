"use client";

import { useState, useEffect, useId, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { ChevronDownIcon, ChevronRight, ChevronLeft } from "lucide-react";
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
    fetchPolicy: "cache-and-network",
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
            className,
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
  onLeave,
  hasUserChanges,
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
  mode = "create",
  markFieldAsEditing,
  unmarkFieldAsEditing,
}) {
  const { watch, setValue, getValues, control } = useFormContext();
  const data = watch();
  const [internalCurrentStep, setInternalCurrentStep] = useState(1);
  const scrollContainerRef = useRef(null);
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
      { shouldDirty: true },
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

  // Trouve le premier champ en erreur et y scroll + focus
  const scrollToFirstError = () => {
    // Priorité aux erreurs d'articles (avec index + champ précis)
    if (validationErrors?.items?.details?.[0]) {
      const { index, fields } = validationErrors.items.details[0];
      const field = fields?.[0] || "description";
      const el = document.querySelector(`[name="items.${index}.${field}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.focus?.(), 300);
        return;
      }
    }

    // Sinon, première clé d'erreur top-level
    const firstKey = Object.keys(validationErrors || {})[0];
    if (firstKey) {
      const el =
        document.querySelector(`[name="${firstKey}"]`) ||
        document.querySelector(`[name^="${firstKey}."]`) ||
        document.querySelector(`[data-error-field="${firstKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.focus?.(), 300);
        return;
      }
    }

    // Fallback : scroll en haut du formulaire
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextStep = () => {
    if (!isStep1Valid()) {
      if (!data.client?.id) {
        toast.error("Veuillez sélectionner un client pour continuer");
      }
      scrollToFirstError();
      return;
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleSaveDraft = () => {
    setValue("status", "DRAFT", { shouldDirty: true });
    if (onSave) {
      onSave();
    }
  };

  const handleCreateQuote = () => {
    if (!isStep2Valid()) {
      scrollToFirstError();
      return;
    }
    setValue("status", "PENDING", { shouldDirty: true });
    if (onSubmit) {
      onSubmit();
    }
  };

  const isStep1Valid = () => {
    // Vérifier qu'il n'y a pas d'erreurs de validation pour l'étape 1
    const hasClientError = validationErrors?.client;
    const hasIssueDateError = validationErrors?.issueDate;
    const hasValidUntilError = validationErrors?.validUntil;
    const hasNumberError =
      validationErrors?.number || validationErrors?.quoteNumber;
    const hasPrefixError = validationErrors?.prefix;

    // Seul un client + une date d'émission sont strictement requis pour
    // passer à l'étape suivante. number / prefix / validUntil ont des
    // valeurs par défaut (string vide ou +30 jours) et seront validés
    // au moment de la création finale.
    const hasClient = data.client?.id;
    const hasIssueDate = data.issueDate;

    return (
      hasClient &&
      hasIssueDate &&
      !hasClientError &&
      !hasIssueDateError &&
      !hasValidUntilError &&
      !hasNumberError &&
      !hasPrefixError
    );
  };

  const isStep2Valid = () => {
    // Vérifier qu'il n'y a pas d'erreurs de validation pour l'étape 2
    const hasItemsError = validationErrors?.items;
    const hasShippingError = validationErrors?.shipping;
    const hasDiscountError = validationErrors?.discount;

    const hasItems = data.items && data.items.length > 0;
    const itemsAreValid =
      hasItems &&
      data.items.every(
        (item) =>
          item.description &&
          item.quantity &&
          item.unitPrice != null &&
          item.unitPrice !== "",
      );

    return (
      itemsAreValid && !hasItemsError && !hasShippingError && !hasDiscountError
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Form Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-20 lg:pb-12"
      >
        <div className="space-y-6 px-2">
          {/* Étape 1: Détails du document */}
          {currentStep === 1 && (
            <>
              {/* Section 1: Sélection d'un client (en premier comme pour les factures) */}
              <div>
                <h3 className="font-medium text-lg">Sélection d'un client</h3>
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
                validationErrors={validationErrors?.items?.details || []}
                markFieldAsEditing={markFieldAsEditing}
                unmarkFieldAsEditing={unmarkFieldAsEditing}
              />

              {/* Section 2: Remises */}
              <DiscountAndTotalsSection
                canEdit={canEdit}
                validationErrors={validationErrors}
              />

              {/* Options avancées (retenue, escompte, livraison) */}
              <Collapsible
                open={advancedOpen}
                onOpenChange={handleAdvancedToggle}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-3"
                  >
                    <ChevronRight
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        advancedOpen && "rotate-90",
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
      <div className="pt-4 pb-6 z-50 border-t lg:relative lg:bottom-auto lg:pt-4 lg:pb-0 fixed bottom-0 left-0 right-0 bg-background lg:bg-transparent px-4 lg:p-0">
        <div className="max-w-2xl mx-auto px-2 md:px-6 lg:px-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (hasUserChanges) {
                    setShowCancelDialog(true);
                  } else if (onLeave) {
                    onLeave();
                  } else {
                    window.history.back();
                  }
                }}
                disabled={loading || saving}
                className="hidden md:flex"
              >
                Annuler
              </Button>
            </div>

            <div className="flex gap-3">
              {currentStep === 2 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousStep}
                  disabled={!canEdit}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!canEdit || saving}
              >
                {saving ? "Sauvegarde..." : "Enregistrer brouillon"}
              </Button>
              {currentStep === 1 && (
                <Button
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={!canEdit}
                  className="px-6"
                >
                  <span className="hidden sm:inline">Continuer</span>
                  <ChevronRight className="h-4 w-4 sm:ml-2" />
                </Button>
              )}
              {currentStep === 2 && (
                <Button
                  variant="primary"
                  onClick={handleCreateQuote}
                  disabled={!canEdit || saving}
                  className="px-6"
                >
                  {saving
                    ? mode === "edit"
                      ? "Mise à jour..."
                      : "Création..."
                    : documentType === "purchaseOrder"
                      ? mode === "edit"
                        ? "Modifier le bon de commande"
                        : "Créer le bon de commande"
                      : mode === "edit"
                        ? "Modifier le devis"
                        : "Créer le devis"}
                </Button>
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
                if (onLeave) {
                  onLeave();
                } else {
                  window.history.back();
                }
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
