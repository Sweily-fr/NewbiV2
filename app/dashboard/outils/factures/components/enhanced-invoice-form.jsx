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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_PRODUCTS } from "@/src/graphql/queries/products";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

import { Button } from "@/src/components/ui/button";
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
import DiscountsAndTotalsSection from "./invoices-form-sections/DiscountsAndTotalsSection";
import ShippingSection from "./invoices-form-sections/ShippingSection";
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
import ClientSelector from "./invoices-form-sections/client-selector";
import CompanyImport, { QuickCompanyImport } from "./company-import";
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
      search: debouncedSearchTerm && debouncedSearchTerm.trim() !== "" ? debouncedSearchTerm : undefined,
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
        vatRate: selectedProduct.vatRate !== undefined ? selectedProduct.vatRate : 20,
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
          className={cn(
            "bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px] h-10",
            className
          )}
        >
          <span className={cn("truncate text-left", "text-muted-foreground")}>
            {placeholder}
          </span>
          <ChevronDownIcon
            size={16}
            className="text-muted-foreground/80 shrink-0"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-[var(--radix-popover-trigger-width)] sm:w-[calc(var(--radix-popover-trigger-width)+12rem)]" 
        align="start" 
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
        sticky="always"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {loading && <CommandEmpty>Recherche en cours...</CommandEmpty>}
            {!loading && !debouncedSearchTerm && (
              <CommandEmpty>Tapez pour rechercher un produit...</CommandEmpty>
            )}
            {!loading && debouncedSearchTerm && products.length === 0 && (
              <CommandEmpty>Aucun produit trouvé pour "{debouncedSearchTerm}".</CommandEmpty>
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

export default function EnhancedInvoiceForm({
  onSave,
  onSubmit,
  loading,
  saving,
  readOnly,
  errors,
  validationErrors = {},
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const canEdit = !readOnly && !loading;

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
  } = useFieldArray({
    name: "items",
  });

  // Watch les données du formulaire
  const data = watch();

  // Calculer les totaux
  const subtotalHT =
    data.items?.reduce((sum, item) => {
      const itemTotal =
        (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
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
      const itemTotal =
        (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
      const itemDiscount =
        item.discountType === "FIXED"
          ? parseFloat(item.discount) || 0
          : itemTotal * ((parseFloat(item.discount) || 0) / 100);
      const itemTotalAfterDiscount = itemTotal - itemDiscount;
      return (
        sum + itemTotalAfterDiscount * ((parseFloat(item.taxRate) || 0) / 100)
      );
    }, 0) || 0;

  // Si totalHT <= 0 (remise >= 100%), la TVA doit être 0
  const adjustedTotalTVA = totalHT > 0 && subtotalHT > 0 ? totalTVA * (totalHT / subtotalHT) : 0;
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
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
    // Déblocage du bouton pour permettre l'accès à l'étape 2 sans validation
    return true;
    // Ancienne validation : return data.client?.name && data.companyInfo?.name && data.issueDate;
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
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0 pb-20 lg:pb-0">
        <div className="space-y-6">
          {/* Étape 1: Détails de la facture */}
          {currentStep === 1 && (
            <>
              {/* Section 1: Informations de la facture */}
              <InvoiceInfoSection canEdit={canEdit} />
              <Separator />

              {/* Section 2: Sélection d'un client */}
              <Card className="gap-0 shadow-none border-none pt-2 pb-6 pr-2 pl-2 bg-transparent">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center font-normal text-lg">
                    Sélection d'un client
                  </CardTitle>
                </CardHeader>
                <ClientSelector
                  selectedClient={data.client}
                  onSelect={(client) => updateField("client", client)}
                  disabled={!canEdit}
                  className="p-0"
                  error={
                    validationErrors?.client && !validationErrors.client.canEdit
                      ? (validationErrors.client.message || validationErrors.client)
                      : null
                  }
                />
              </Card>
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
              />

              {/* Section 2: Facturation de livraison */}
              <ShippingSection canEdit={canEdit} validationErrors={validationErrors} />

              {/* Section 3: Remises et totaux */}
              <DiscountsAndTotalsSection canEdit={canEdit} validationErrors={validationErrors} />
            </>
          )}
        </div>
      </div>

      {/* Footer avec boutons d'action - Positionné en dehors du flux normal */}
      <div className="pt-4 z-50 border-t lg:relative lg:bottom-auto lg:pt-4 fixed bottom-0 left-0 right-0 bg-background lg:bg-transparent p-4 lg:p-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto px-2 md:px-6 lg:px-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
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
                <Button
                  onClick={handleNextStep}
                  disabled={!isStep1Valid() || !canEdit}
                  className="px-6 text-sm font-normal"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="h-4 w-4 sm:ml-2" />
                </Button>
              )}

              {currentStep === 2 && (
                <>
                  <Button
                    className="text-sm font-normal"
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={!canEdit}
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Précédent</span>
                  </Button>
                  <Button
                    onClick={handleCreateInvoice}
                    disabled={!isStep2Valid() || !canEdit || saving}
                    className="px-6 text-sm font-normal"
                  >
                    {saving ? "Création..." : "Créer la facture"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
