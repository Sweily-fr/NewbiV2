"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Calculator, Building, Percent, Clock, Tag, Search, Zap, Package, CheckIcon, ChevronDownIcon, Download } from "lucide-react";
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '@/src/graphql/productQueries';

import { Button } from "@/src/components/ui/button";
import {
  Timeline,
  TimelineHeader,
  TimelineItem,
  TimelineIndicator,
  TimelineSeparator,
  TimelineTitle
} from "@/src/components/ui/timeline";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import NotesAndFooterSection from "./invoices-form-sections/NotesAndFooterSection";
import InvoiceInfoSection from "./invoices-form-sections/InvoiceInfoSection";
import ItemsSection from "./invoices-form-sections/ItemsSection";
import DiscountsAndTotalsSection from "./invoices-form-sections/DiscountsAndTotalsSection";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Calendar } from "@/src/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
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
import { toast } from "sonner";

// Composant de recherche de produits basé sur Origin UI
function ProductSearchCombobox({ onSelect, placeholder = "Rechercher un produit...", disabled = false }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Requête GraphQL pour récupérer les produits
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: {
      search: searchTerm || undefined,
      limit: 20
    },
    fetchPolicy: 'cache-and-network'
  });
  
  // Transformation des données pour le composant
  const products = data?.products?.products?.map(product => ({
    value: product.id,
    label: product.name,
    description: product.description,
    price: product.unitPrice,
    vatRate: product.vatRate,
    unit: product.unit,
    category: product.category,
    reference: product.reference
  })) || [];

  const handleSelect = (currentValue) => {
    const selectedProduct = products.find(p => p.value === currentValue);
    if (selectedProduct && onSelect) {
      onSelect({
        description: selectedProduct.label,
        quantity: 1,
        unitPrice: selectedProduct.price,
        taxRate: selectedProduct.vatRate || 20,
        productId: selectedProduct.value,
        unit: selectedProduct.unit || 'unité'
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
          className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px] h-10"
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
        className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput 
            placeholder="Rechercher un produit..." 
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-muted-foreground">Recherche en cours...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600">
                <span className="text-sm">Erreur lors du chargement des produits</span>
              </div>
            ) : products.length === 0 ? (
              <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
            ) : (
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.value}
                    value={product.value}
                    onSelect={handleSelect}
                    className="flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{product.label}</span>
                      {product.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </span>
                      )}
                      {product.category && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-1">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-sm font-medium">{product.price}€</span>
                      <span className="text-xs text-muted-foreground">/{product.unit}</span>
                    </div>
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
  errors
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const canEdit = !readOnly && !loading;
  
  // Utiliser react-hook-form context
  const { watch, setValue, getValues, formState: { errors: formErrors } } = useFormContext();
  const { fields: items, append, remove, update } = useFieldArray({
    name: "items"
  });
  
  // Watch les données du formulaire
  const data = watch();

  // Calculer les totaux
  const subtotalHT = data.items?.reduce((sum, item) => {
    const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    const itemDiscount = item.discountType === 'FIXED' 
      ? (parseFloat(item.discount) || 0)
      : itemTotal * ((parseFloat(item.discount) || 0) / 100);
    return sum + (itemTotal - itemDiscount);
  }, 0) || 0;

  const globalDiscount = data.discountType === 'FIXED' 
    ? (parseFloat(data.discount) || 0)
    : subtotalHT * ((parseFloat(data.discount) || 0) / 100);

  const totalHT = subtotalHT - globalDiscount;
  const totalTVA = data.items?.reduce((sum, item) => {
    const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    const itemDiscount = item.discountType === 'FIXED' 
      ? (parseFloat(item.discount) || 0)
      : itemTotal * ((parseFloat(item.discount) || 0) / 100);
    const itemTotalAfterDiscount = itemTotal - itemDiscount;
    return sum + (itemTotalAfterDiscount * ((parseFloat(item.taxRate) || 0) / 100));
  }, 0) || 0;
  
  const adjustedTotalTVA = totalTVA * (totalHT / subtotalHT);
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
      vatExemptionText: ""
    };
    append(newItem);
  };

  const updateItem = (index, field, value) => {
    if (!canEdit) return;
    setValue(`items.${index}.${field}`, value, { shouldDirty: true });
    
    // Recalculer le total de l'article si nécessaire
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount' || field === 'discountType') {
      const currentItems = getValues('items');
      const item = currentItems[index];
      const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
      const discountAmount = item.discountType === 'FIXED' 
        ? (parseFloat(item.discount) || 0)
        : subtotal * ((parseFloat(item.discount) || 0) / 100);
      setValue(`items.${index}.total`, subtotal - discountAmount, { shouldDirty: true });
    }
  };

  const removeItem = (index) => {
    if (!canEdit) return;
    remove(index);
  };

  const applyTemplate = (template) => {
    if (!canEdit) return;
    const currentItems = getValues('items') || [];
    const newItems = template.items.map(item => ({ 
      ...item, 
      total: item.quantity * item.unitPrice 
    }));
    setValue('items', [...currentItems, ...newItems], { shouldDirty: true });
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
    setValue('status', 'DRAFT', { shouldDirty: true });
    if (onSave) {
      onSave();
    }
  };

  const handleCreateInvoice = () => {
    // Créer la facture finale
    setValue('status', 'PENDING', { shouldDirty: true });
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
    return data.items && data.items.length > 0 && data.items.every(item => item.description && item.quantity && item.unitPrice);
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full relative">
      {/* Form Content */}
      <div className="space-y-6 pb-24 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 transition-colors duration-200">
        {/* Étape 1: Détails de la facture */}
        {currentStep === 1 && (
          <>
            {/* Section 1: Informations de la facture */}
            <InvoiceInfoSection 
              canEdit={canEdit} 
            />
            <Separator />

            {/* Section 2: Sélection d'un client */}
            <Card className="shadow-none border-none p-2 bg-transparent">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
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
            <Separator />

            {/* Section 4: Notes et bas de page */}
            <NotesAndFooterSection 
              canEdit={canEdit} 
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
            />

            <Separator className="my-8" />

            {/* Section 2: Remises et totaux */}
            <DiscountsAndTotalsSection 
              canEdit={canEdit} 
            />
          </>
        )}

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
                  Étape suivante
                </Button>
              )}
              
              {currentStep === 2 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={!canEdit}
                  >
                    Étape précédente
                  </Button>
                  <Button
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
    </div>
  );
}
