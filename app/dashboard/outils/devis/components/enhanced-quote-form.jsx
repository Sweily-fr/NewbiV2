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
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_PRODUCTS } from "@/src/graphql/productQueries";

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

import QuoteInfoSection from "./quote-form-sections/QuoteInfoSection";
import ItemsSection from "./quote-form-sections/ItemsSection";
import DiscountAndTotalsSection from "./quote-form-sections/DiscountsAndTotalsSection";
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
import ClientSelector from "./quote-form-sections/client-selector";
import { toast } from "sonner";

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

  // Requête GraphQL pour récupérer les produits
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: {
      search: searchTerm || undefined,
      limit: 20,
    },
    fetchPolicy: "cache-and-network",
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
        taxRate: selectedProduct.vatRate || 20,
        productId: selectedProduct.value,
        unit: selectedProduct.unit || "unité(s)",
      });
    }
    setValue("");
    setOpen(false);
  };

  // Fonction pour gérer la recherche
  const handleSearchChange = (search) => {
    setSearchTerm(search);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Rechercher un produit..."
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {loading && <CommandEmpty>Recherche en cours...</CommandEmpty>}
            {!loading && products.length === 0 && (
              <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
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
}) {
  const { watch, setValue, getValues, control } = useFormContext();
  const data = watch();
  const [currentStep, setCurrentStep] = useState(1);

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
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-auto-hide min-h-0">
        <div className="space-y-6 pb-20">
          {/* Étape 1: Détails du devis */}
          {currentStep === 1 && (
            <>
              {/* Section 1: Informations du devis */}
              <QuoteInfoSection
                canEdit={canEdit}
                nextQuoteNumber={nextQuoteNumber}
              />
              <Separator />

              {/* Section 2: Sélection d'un client */}
              <Card className="shadow-none border-none p-2 bg-transparent">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2 font-medium text-lg">
                    Sélection d'un client
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ClientSelector
                    selectedClient={data.client}
                    onSelect={(client) => updateField("client", client)}
                    disabled={!canEdit}
                  />
                </CardContent>
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
              />

              {/* Section 2: Remises et totaux */}
              <DiscountAndTotalsSection canEdit={canEdit} />
            </>
          )}
        </div>
      </div>

      {/* Footer avec boutons d'action - Positionné en dehors du flux normal */}
      <div className="pt-4 z-50 border-t">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                disabled={loading || saving}
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
                  onClick={handleNextStep}
                  disabled={!isStep1Valid() || !canEdit}
                  className="px-6"
                >
                  Suivant
                </Button>
              )}

              {currentStep === 2 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={!canEdit}
                  >
                    Précédent
                  </Button>
                  <Button
                    onClick={handleCreateQuote}
                    disabled={!isStep2Valid() || !canEdit || saving}
                    className="px-6"
                  >
                    {saving ? "Création..." : "Créer le devis"}
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
