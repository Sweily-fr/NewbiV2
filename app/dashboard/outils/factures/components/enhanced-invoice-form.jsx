"use client";

import { useState, useEffect, useCallback, useId } from "react";
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
import { ItemsSection } from "./invoices-form-sections/ItemsSection";
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
  data, 
  onChange, 
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

  // Initialiser discountType par défaut si pas défini
  useEffect(() => {
    if (!data.discountType) {
      updateField("discountType", "percentage");
    }
  }, []);

  // Calculs automatiques
  const calculateTotals = useCallback(() => {
    const subtotal = data.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountAmount = data.discountType === "percentage" 
      ? (subtotal * (data.discount || 0)) / 100
      : (data.discount || 0);
    const totalHT = subtotal - discountAmount;
    const totalVAT = data.items.reduce((sum, item) => {
      const itemTotal = item.total || 0;
      const itemDiscount = data.discountType === "percentage" 
        ? (itemTotal * (data.discount || 0)) / 100
        : (itemTotal / subtotal) * (data.discount || 0);
      const itemTotalAfterDiscount = itemTotal - itemDiscount;
      return sum + (itemTotalAfterDiscount * (item.taxRate || 0)) / 100;
    }, 0);
    const totalTTC = totalHT + totalVAT;

    return { subtotal, discountAmount, totalHT, totalVAT, totalTTC };
  }, [data.items, data.discount, data.discountType]);

  const totals = calculateTotals();

  const updateField = (field, value) => {
    if (!canEdit) return;
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, field, value) => {
    if (!canEdit) return;
    onChange(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const addItem = (template = null) => {
    if (!canEdit) return;
    const newItem = template || {
      description: "",
      quantity: 1,
      unitPrice: 0,
      vatRate: 20,
      unit: "pièce",
      discount: 0,
      discountType: "percentage",
      details: "",
      vatExemptionText: "",
      total: 0,
    };
    onChange(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (index, field, value) => {
    if (!canEdit) return;
    onChange(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      
      // Recalcul automatique du total avec remise individuelle
      if (field === "quantity" || field === "unitPrice" || field === "discount" || field === "discountType") {
        const quantity = field === "quantity" ? value : (newItems[index].quantity || 0);
        const unitPrice = field === "unitPrice" ? value : (newItems[index].unitPrice || 0);
        const discount = field === "discount" ? value : (newItems[index].discount || 0);
        const discountType = field === "discountType" ? value : (newItems[index].discountType || "percentage");
        
        // Calcul du sous-total avant remise
        const subtotal = quantity * unitPrice;
        
        // Calcul de la remise
        let discountAmount = 0;
        if (discount > 0) {
          if (discountType === "percentage") {
            discountAmount = subtotal * (discount / 100);
          } else {
            discountAmount = discount;
          }
        }
        
        // Total après remise
        newItems[index].total = Math.max(0, subtotal - discountAmount);
      }
      
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (index) => {
    if (!canEdit) return;
    onChange(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const applyTemplate = (template) => {
    if (!canEdit) return;
    onChange(prev => ({
      ...prev,
      items: [...prev.items, ...template.items.map(item => ({ ...item, total: item.quantity * item.unitPrice }))]
    }));
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
    const draftData = { ...data, status: 'DRAFT' };
    onChange(draftData);
    onSave();
  };

  const handleCreateInvoice = () => {
    // Créer la facture finale
    const finalData = { ...data, status: 'PENDING' };
    onChange(finalData);
    onSubmit();
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
              data={data} 
              updateField={updateField} 
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
                  onClientSelect={(client) => updateField("client", client)}
                  disabled={!canEdit}
                />
              </CardContent>
            </Card>
            <Separator />

            {/* Section 4: Notes et bas de page */}
            <NotesAndFooterSection 
              data={data} 
              updateField={updateField} 
              updateNestedField={updateNestedField} 
              canEdit={canEdit} 
            />
          </>
        )}

        {/* Étape 2: Produits et services */}
        {currentStep === 2 && (
          <>
            {/* Section 1: Articles et produits */}
            <ItemsSection 
              items={data.items}
              addItem={addItem}
              removeItem={removeItem}
              updateItem={updateItem}
              formatCurrency={formatCurrency}
              canEdit={canEdit}
              ProductSearchCombobox={ProductSearchCombobox}
            />

            <Separator className="my-8" />

            {/* Section 2: Remises et totaux */}
            <Card className="shadow-none border-none bg-transparent p-4 overflow-visible">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Remises et totaux
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                {/* Configuration de la remise */}
                <div className="flex gap-4">
                  {/* Type de remise - 50% de la largeur */}
                  <div className="w-1/2 space-y-2">
                    <Label className="text-sm font-medium">
                      Type de remise
                    </Label>
                    <Select
                      value={data.discountType || "percentage"}
                      onValueChange={(value) => updateField("discountType", value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="h-10 rounded-lg px-3 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                        <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Valeur de la remise - 50% de la largeur */}
                  <div className="w-1/2 space-y-2">
                    <Label htmlFor="discount-value" className="text-sm font-medium">
                      Valeur de la remise
                    </Label>
                    <Input
                      id="discount-value"
                      type="number"
                      value={data.discount || 0}
                      onChange={(e) => updateField("discount", parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      disabled={!canEdit}
                      placeholder={data.discountType === "percentage" ? "Ex: 10" : "Ex: 100"}
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Champs personnalisés */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">
                    Champs personnalisés
                  </Label>
                  {data.customFields && data.customFields.length > 0 ? (
                    <div className="space-y-3">
                      {data.customFields.map((field, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 rounded-lg">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Nom du champ
                            </Label>
                            <Input
                              value={field.name || ""}
                              onChange={(e) => {
                                const newFields = [...(data.customFields || [])];
                                newFields[index] = { ...newFields[index], name: e.target.value };
                                updateField("customFields", newFields);
                              }}
                              placeholder="Ex: Référence projet"
                              disabled={!canEdit}
                              className="h-10 rounded-lg text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Valeur
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                value={field.value || ""}
                                onChange={(e) => {
                                  const newFields = [...(data.customFields || [])];
                                  newFields[index] = { ...newFields[index], value: e.target.value };
                                  updateField("customFields", newFields);
                                }}
                                placeholder="Ex: PROJ-2024-001"
                                disabled={!canEdit}
                                className="h-10 rounded-lg text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newFields = data.customFields.filter((_, i) => i !== index);
                                  updateField("customFields", newFields);
                                }}
                                disabled={!canEdit}
                                className="h-10 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm">Aucun champ personnalisé ajouté</p>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newFields = [...(data.customFields || []), { name: "", value: "" }];
                      updateField("customFields", newFields);
                    }}
                    disabled={!canEdit}
                    className="w-full h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un champ personnalisé
                  </Button>
                </div>


              </CardContent>
            </Card>
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
                    Créer la facture
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
