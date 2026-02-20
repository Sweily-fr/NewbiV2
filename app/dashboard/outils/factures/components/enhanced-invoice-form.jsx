"use client";

import { useState, useEffect, useCallback, useId, useRef } from "react";
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
  LoaderCircle,
  Download,
  ChevronLeft,
  ChevronRight,
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

import InvoiceInfoSection from "./invoices-form-sections/InvoiceInfoSection";
import ItemsSection from "./invoices-form-sections/ItemsSection";
import ProgressSection from "./invoices-form-sections/ProgressSection";
import DiscountsAndTotalsSection from "./invoices-form-sections/DiscountsAndTotalsSection";
import ShippingSection from "./invoices-form-sections/ShippingSection";
import CustomFieldsSection from "./invoices-form-sections/CustomFieldsSection";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/src/components/ui/collapsible";
import PercentageSliderInput from "@/src/components/percentage-slider-input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import ClientSelector from "./invoices-form-sections/client-selector";
import CompanyImport, { QuickCompanyImport } from "./company-import";
import { toast } from "@/src/components/ui/sonner";
import { ValidationCallout } from "./validation-callout";

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
        unit: selectedProduct.unit || "unité",
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
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate text-muted-foreground">
            {placeholder}
          </span>
          <ChevronDownIcon className="size-3.5 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 overflow-hidden rounded-xl"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        {/* Search header */}
        <div className="flex items-center gap-2.5 px-2.5 h-10 border-b border-[#e6e7ea] dark:border-[#232323]">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <Input
            variant="ghost"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            autoFocus
          />
        </div>

        {/* Items list */}
        <div className="max-h-[280px] overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-4">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Recherche...</span>
            </div>
          ) : !debouncedSearchTerm ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Tapez pour rechercher un produit...
            </div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun produit trouvé pour &quot;{debouncedSearchTerm}&quot;.
            </div>
          ) : (
            products.map((product) => (
              <button
                key={product.value}
                type="button"
                onClick={() => handleSelect(product.value)}
                className="flex w-full flex-col items-start gap-1 rounded-md p-2.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{product.label}</span>
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
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function EnhancedInvoiceForm({
  onSave,
  onSubmit,
  loading,
  saving,
  readOnly,
  errors,
  validationErrors = {},
  setValidationErrors,
  validateInvoiceNumber,
  currentStep: externalCurrentStep,
  onStepChange,
  onEditClient,
  markFieldAsEditing,
  unmarkFieldAsEditing,
  onPreviousSituationInvoicesChange,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [internalCurrentStep, setInternalCurrentStep] = useState(1);
  const scrollContainerRef = useRef(null);
  // Ref pour éviter la re-copie des articles quand on revient à l'étape 1
  const itemsInitializedForRef = useRef(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLinkedToQuote, setIsLinkedToQuote] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("invoice-advanced-options-open") === "true";
  });
  const canEdit = !readOnly && !loading;

  // Utiliser l'état externe si fourni, sinon utiliser l'état interne
  const currentStep =
    externalCurrentStep !== undefined
      ? externalCurrentStep
      : internalCurrentStep;
  const setCurrentStep = onStepChange || setInternalCurrentStep;

  // Utiliser react-hook-form context
  const {
    watch,
    setValue,
    getValues,
    formState: { errors: formErrors },
  } = useFormContext();
  const {
    fields: items,
    append,
    remove,
    update,
    replace: replaceItems,
  } = useFieldArray({
    name: "items",
  });

  // Fonction pour réinitialiser les articles (utilisée par InvoiceInfoSection)
  const resetItems = useCallback(() => {
    console.log(
      "📋 [RESET ITEMS] Réinitialisation des articles, items actuels:",
      items.length
    );
    replaceItems([]);
    console.log("📋 [RESET ITEMS] Articles vidés");
  }, [replaceItems, items.length]);

  // Watch les données du formulaire
  const data = watch();

  // Auto-open advanced options if any advanced field is already set
  useEffect(() => {
    const hasAdvanced =
      data.retenueGarantie > 0 ||
      data.escompte > 0 ||
      data.shipping?.billShipping;
    if (hasAdvanced) setAdvancedOpen(true);
  }, [data.retenueGarantie, data.escompte, data.shipping?.billShipping]);

  const handleAdvancedToggle = (open) => {
    setAdvancedOpen(open);
    localStorage.setItem("invoice-advanced-options-open", String(open));
  };

  // Calculer les totaux (en tenant compte de l'avancement pour les factures de situation)
  const isSituationInvoice = data.invoiceType === "situation";
  const subtotalHT =
    data.items?.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      let itemTotal = quantity * unitPrice;

      // Appliquer le pourcentage d'avancement
      const progressPercentage =
        item.progressPercentage !== undefined && item.progressPercentage !== null
          ? parseFloat(item.progressPercentage)
          : isSituationInvoice ? 0 : 100;
      itemTotal = itemTotal * (progressPercentage / 100);

      const itemDiscount =
        item.discountType === "FIXED"
          ? parseFloat(item.discount) || 0
          : itemTotal * ((parseFloat(item.discount) || 0) / 100);
      return sum + (itemTotal - itemDiscount);
    }, 0) || 0;

  const globalDiscount =
    data.discountType === "FIXED"
      ? parseFloat(data.discount) || 0
      : subtotalHT * ((parseFloat(data.discount) || 0) / 100);

  const totalHT = subtotalHT - globalDiscount;
  const totalTVA =
    data.items?.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      let itemTotal = quantity * unitPrice;

      // Appliquer le pourcentage d'avancement
      const progressPercentage =
        item.progressPercentage !== undefined && item.progressPercentage !== null
          ? parseFloat(item.progressPercentage)
          : isSituationInvoice ? 0 : 100;
      itemTotal = itemTotal * (progressPercentage / 100);

      const itemDiscount =
        item.discountType === "FIXED"
          ? parseFloat(item.discount) || 0
          : itemTotal * ((parseFloat(item.discount) || 0) / 100);
      const itemTotalAfterDiscount = itemTotal - itemDiscount;
      return (
        sum + itemTotalAfterDiscount * ((parseFloat(item.vatRate) || 0) / 100)
      );
    }, 0) || 0;

  // Si totalHT <= 0 (remise >= 100%), la TVA doit être 0
  const adjustedTotalTVA =
    totalHT > 0 && subtotalHT > 0 ? totalTVA * (totalHT / subtotalHT) : 0;
  const totalTTC = totalHT + adjustedTotalTVA;

  const updateField = (field, value) => {
    if (!canEdit) return;
    setValue(field, value, { shouldDirty: true });
  };

  const updateNestedField = (parent, field, value) => {
    if (!canEdit) return;
    const currentParent = getValues(parent) || {};
    setValue(`${parent}.${field}`, value, { shouldDirty: true });
  };

  const addItem = (template = null) => {
    if (!canEdit) return;
    const newItem = template || {
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      unit: "pièce",
      discount: 0,
      discountType: "PERCENTAGE",
      details: "",
      vatExemptionText: "",
    };
    append(newItem);
  };

  const updateItem = (index, field, value) => {
    if (!canEdit) return;
    setValue(`items.${index}.${field}`, value, { shouldDirty: true });

    // Recalculer le total de l'article si nécessaire
    if (
      field === "quantity" ||
      field === "unitPrice" ||
      field === "discount" ||
      field === "discountType"
    ) {
      const currentItems = getValues("items");
      const item = currentItems[index];
      const subtotal =
        (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
      const discountAmount =
        item.discountType === "FIXED"
          ? parseFloat(item.discount) || 0
          : subtotal * ((parseFloat(item.discount) || 0) / 100);
      setValue(`items.${index}.total`, subtotal - discountAmount, {
        shouldDirty: true,
      });
    }
  };

  const removeItem = (index) => {
    if (!canEdit) return;
    remove(index);
  };

  const applyTemplate = (template) => {
    if (!canEdit) return;
    const currentItems = getValues("items") || [];
    const newItems = template.items.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));
    setValue("items", [...currentItems, ...newItems], { shouldDirty: true });
    toast.success(`Template "${template.name}" appliqué`);
  };

  const applyDiscount = (discount) => {
    if (!canEdit) return;
    updateField("discount", discount.value);
    updateField("discountType", discount.type);
    toast.success(`Remise de ${discount.label} appliquée`);
  };

  const handleCompanyImport = (companyInfo) => {
    updateNestedField("companyInfo", "name", companyInfo.name);
    updateNestedField("companyInfo", "address", companyInfo.address);
    updateNestedField("companyInfo", "email", companyInfo.email);
    updateNestedField("companyInfo", "phone", companyInfo.phone);
    updateNestedField("companyInfo", "siret", companyInfo.siret);
    updateNestedField("companyInfo", "vatNumber", companyInfo.vatNumber);
    updateNestedField("companyInfo", "website", companyInfo.website);
    updateNestedField("companyInfo", "bankDetails", companyInfo.bankDetails);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      // Scroll vers le haut du conteneur
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Scroll vers le haut du conteneur
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleSaveDraft = () => {
    // Sauvegarder en tant que brouillon
    setValue("status", "DRAFT", { shouldDirty: true });
    if (onSave) {
      onSave();
    }
  };

  const handleCreateInvoice = () => {
    // Créer la facture finale
    setValue("status", "PENDING", { shouldDirty: true });
    if (onSubmit) {
      onSubmit();
    }
  };

  const isStep1Valid = () => {
    // Vérifier qu'il n'y a pas d'erreurs de validation pour l'étape 1
    const hasClientError = validationErrors?.client;
    const hasCompanyError = validationErrors?.companyInfo;
    const hasIssueDateError = validationErrors?.issueDate;
    const hasDueDateError = validationErrors?.dueDate;
    const hasInvoiceNumberError = validationErrors?.invoiceNumber;
    const hasPrefixError = validationErrors?.prefix;
    const hasPurchaseOrderError = validationErrors?.purchaseOrderNumber;

    // Vérifier que les champs requis sont remplis
    const hasClient = data.client?.id;
    const hasCompanyName = data.companyInfo?.name;
    const hasIssueDate = data.issueDate;

    return (
      hasClient &&
      hasCompanyName &&
      hasIssueDate &&
      !hasClientError &&
      !hasCompanyError &&
      !hasIssueDateError &&
      !hasDueDateError &&
      !hasInvoiceNumberError &&
      !hasPrefixError &&
      !hasPurchaseOrderError
    );
  };

  const isStep2Valid = () => {
    // Vérifier qu'il n'y a pas d'erreurs de validation pour l'étape 2
    const hasItemsError = validationErrors?.items;
    const hasShippingError = validationErrors?.shipping;
    const hasDiscountError = validationErrors?.discount;

    // Vérifier que les articles sont valides
    const hasItems = data.items && data.items.length > 0;
    const itemsAreValid =
      hasItems &&
      data.items.every(
        (item) => item.description && item.quantity && item.unitPrice
      );

    return (
      itemsAreValid && !hasItemsError && !hasShippingError && !hasDiscountError
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Validation Callout - Fixe en haut */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="sticky top-0 z-10 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <ValidationCallout errors={validationErrors} />
        </div>
      )}

      {/* Form Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0 pb-20 lg:pb-0"
      >
        <div className="space-y-4">
          {/* Étape 1: Détails de la facture */}
          {currentStep === 1 && (
            <>
              {/* Section 1: Sélection d'un client (en premier) */}
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

              {/* Section 2: Informations de la facture */}
              <InvoiceInfoSection
                canEdit={canEdit}
                validateInvoiceNumber={validateInvoiceNumber}
                onPreviousSituationInvoicesChange={
                  onPreviousSituationInvoicesChange
                }
                setValidationErrors={setValidationErrors}
                onLinkedToQuoteChange={setIsLinkedToQuote}
                onResetItems={resetItems}
                itemsInitializedForRef={itemsInitializedForRef}
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
                isLinkedToQuote={isLinkedToQuote}
              />

              {/* Section 2: Facturation partielle (uniquement pour factures de situation) */}
              <ProgressSection canEdit={canEdit} />

              {/* Section 3: Remises */}
              <DiscountsAndTotalsSection
                canEdit={canEdit}
                validationErrors={validationErrors}
              />

              {/* Options avancées (retenue, escompte, livraison, champs perso) */}
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

              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!canEdit || saving}
              >
                {saving ? "Sauvegarde..." : "Brouillon"}
              </Button>
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
                    onClick={handleCreateInvoice}
                    disabled={!isStep2Valid() || !canEdit || saving}
                    className="px-6"
                  >
                    {saving ? "Création..." : "Créer la facture"}
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
