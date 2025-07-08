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
import ClientSelector from "./client-selector";
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

// Suggestions et templates prédéfinis
const INVOICE_TEMPLATES = [
  {
    id: "web-dev",
    name: "Développement Web",
    items: [
      { description: "Développement site web", quantity: 1, unitPrice: 2500, taxRate: 20 },
      { description: "Hébergement annuel", quantity: 1, unitPrice: 120, taxRate: 20 }
    ]
  },
  {
    id: "consulting",
    name: "Consulting",
    items: [
      { description: "Consultation stratégique", quantity: 4, unitPrice: 150, taxRate: 20 },
      { description: "Rapport d'audit", quantity: 1, unitPrice: 500, taxRate: 20 }
    ]
  },
  {
    id: "maintenance",
    name: "Maintenance",
    items: [
      { description: "Maintenance mensuelle", quantity: 12, unitPrice: 150, taxRate: 20 }
    ]
  }
];

const PAYMENT_TERMS_SUGGESTIONS = [
  { value: 0, label: "Paiement à réception" },
  { value: 15, label: "15 jours" },
  { value: 30, label: "30 jours" },
  { value: 45, label: "45 jours" },
  { value: 60, label: "60 jours" }
];

const DISCOUNT_SUGGESTIONS = [
  { value: 5, type: "percentage", label: "5% - Remise fidélité" },
  { value: 10, type: "percentage", label: "10% - Remise volume" },
  { value: 15, type: "percentage", label: "15% - Remise partenaire" },
  { value: 100, type: "fixed", label: "100€ - Remise forfaitaire" },
  { value: 250, type: "fixed", label: "250€ - Remise importante" }
];

const NOTES_TEMPLATES = [
  "Merci pour votre confiance. N'hésitez pas à nous contacter pour toute question.",
  "Paiement par virement bancaire ou chèque à l'ordre de [Nom de l'entreprise].",
  "TVA non applicable, art. 293 B du CGI (auto-entrepreneur).",
  "Facture à régler sous 30 jours. Pénalités de retard : 3 fois le taux légal."
];

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
      <div className="space-y-6 pb-24 overflow-y-auto pr-4">
        {/* Étape 1: Détails de la facture */}
        {currentStep === 1 && (
          <>
            {/* Section 1: Informations de la facture */}
            <Card className="shadow-none p-2 border-none">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Informations de la facture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                {/* Facture d'acompte */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="deposit-invoice"
                    checked={data.isDepositInvoice || false}
                    onCheckedChange={(checked) => updateField("isDepositInvoice", checked)}
                    disabled={!canEdit}
                    className="h-5 w-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="deposit-invoice"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Facture d'acompte
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cochez si cette facture correspond à un acompte
                    </p>
                  </div>
                </div>

                {/* Préfixe et numéro de facture */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-prefix" className="text-sm font-medium text-gray-900">
                      Préfixe de facture
                    </Label>
                    <div className="relative">
                      <Input
                        id="invoice-prefix"
                        value={data.prefix || "F-"}
                        onChange={(e) => updateField("prefix", e.target.value)}
                        placeholder="F-"
                        disabled={!canEdit}
                        className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="invoice-number" className="text-sm font-medium text-gray-900">
                      Numéro de facture
                    </Label>
                    <div className="relative">
                      <Input
                        id="invoice-number"
                        value={data.number || ""}
                        onChange={(e) => updateField("number", e.target.value)}
                        placeholder="202501-001"
                        disabled={!canEdit}
                        className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Référence devis */}
                <div className="space-y-2">
                  <Label htmlFor="quote-reference" className="text-sm font-medium text-gray-900">
                    Référence devis
                  </Label>
                  <div className="relative">
                    <Input
                      id="quote-reference"
                      value={data.quoteReference || ""}
                      onChange={(e) => updateField("quoteReference", e.target.value)}
                      placeholder="DEV-2025-001"
                      disabled={!canEdit}
                      className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Référence du devis associé à cette facture (optionnel)
                  </p>
                </div>

                {/* Dates */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-900">
                        Date d'émission
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={!canEdit}
                            className={cn(
                              "w-full justify-start text-left font-normal h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                              !data.issueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {data.issueDate ? (
                              format(new Date(data.issueDate), "PPP", { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={data.issueDate ? new Date(data.issueDate) : undefined}
                            onSelect={(date) => updateField("issueDate", date?.toISOString().split('T')[0])}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-900">
                        Date d'exécution
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={!canEdit}
                            className={cn(
                              "w-full justify-start text-left font-normal h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                              !data.executionDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {data.executionDate ? (
                              format(new Date(data.executionDate), "PPP", { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={data.executionDate ? new Date(data.executionDate) : undefined}
                            onSelect={(date) => updateField("executionDate", date?.toISOString().split('T')[0])}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">
                      Date d'échéance
                    </Label>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={!canEdit}
                            className={cn(
                              "w-full justify-start text-left font-normal h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                              !data.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {data.dueDate ? (
                              format(new Date(data.dueDate), "PPP", { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={data.dueDate ? new Date(data.dueDate) : undefined}
                            onSelect={(date) => updateField("dueDate", date?.toISOString().split('T')[0])}
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
                          updateField("dueDate", dueDate.toISOString().split('T')[0]);
                        }}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full">
                          <SelectValue placeholder="+" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TERMS_SUGGESTIONS.map((term) => (
                            <SelectItem key={term.value} value={term.value.toString()}>
                              {term.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-gray-500">
                      Utilisez le sélecteur "+" pour ajouter des jours automatiquement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Separator />

            {/* Section 2: Sélection d'un client */}
            <Card className="shadow-none border-none p-2">
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
            <Card className="shadow-none border-none p-2">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Notes et bas de page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">

                {/* Notes d'en-tête */}
                <div>
                  <Label htmlFor="header-notes">Notes d'en-tête</Label>
                  <Textarea
                    id="header-notes"
                    className="mt-2"
                    value={data.headerNotes || ""}
                    onChange={(e) => updateField("headerNotes", e.target.value)}
                    placeholder="Notes qui apparaîtront en haut de la facture..."
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>

                {/* Notes de bas de page */}
                <div>
                  <Label htmlFor="footer-notes">Notes de bas de page</Label>
                  <Textarea
                    id="footer-notes"
                    className="mt-2"
                    value={data.footerNotes || ""}
                    onChange={(e) => updateField("footerNotes", e.target.value)}
                    placeholder="Notes qui apparaîtront en bas de la facture..."
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>

                {/* Conditions générales */}
                <div>
                  <Label htmlFor="terms-conditions">Conditions générales</Label>
                  <Textarea
                    id="terms-conditions"
                    className="mt-2"
                    value={data.termsAndConditions || ""}
                    onChange={(e) => updateField("termsAndConditions", e.target.value)}
                    placeholder="Conditions générales de vente..."
                    rows={4}
                    disabled={!canEdit}
                  />
                </div>

                {/* Coordonnées bancaires */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="show-bank-details"
                      checked={data.showBankDetails || false}
                      onCheckedChange={(checked) => updateField("showBankDetails", checked)}
                      disabled={!canEdit}
                      className="h-5 w-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="show-bank-details"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Afficher les coordonnées bancaires
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Cochez pour inclure vos coordonnées bancaires dans la facture
                      </p>
                    </div>
                  </div>

                  {data.showBankDetails && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Coordonnées bancaires</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Importer les coordonnées bancaires depuis les données utilisateur
                            if (data.companyInfo?.bankDetails) {
                              updateNestedField("bankDetails", "iban", data.companyInfo.bankDetails.iban || "");
                              updateNestedField("bankDetails", "bic", data.companyInfo.bankDetails.bic || "");
                              updateNestedField("bankDetails", "bankName", data.companyInfo.bankDetails.bankName || "");
                            }
                          }}
                          disabled={!canEdit}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Importer mes coordonnées
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bank-iban" className="text-sm font-medium text-gray-900">
                            IBAN
                          </Label>
                          <Input
                            id="bank-iban"
                            value={data.bankDetails?.iban || ""}
                            onChange={(e) => updateNestedField("bankDetails", "iban", e.target.value)}
                            placeholder="FR76 1234 5678 9012 3456 7890 123"
                            disabled={!canEdit}
                            className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank-bic" className="text-sm font-medium text-gray-900">
                            BIC/SWIFT
                          </Label>
                          <Input
                            id="bank-bic"
                            value={data.bankDetails?.bic || ""}
                            onChange={(e) => updateNestedField("bankDetails", "bic", e.target.value)}
                            placeholder="BNPAFRPPXXX"
                            disabled={!canEdit}
                            className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank-name" className="text-sm font-medium text-gray-900">
                          Nom de la banque
                        </Label>
                        <Input
                          id="bank-name"
                          value={data.bankDetails?.bankName || ""}
                          onChange={(e) => updateNestedField("bankDetails", "bankName", e.target.value)}
                          placeholder="BNP Paribas"
                          disabled={!canEdit}
                          className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Étape 2: Produits et services */}
        {currentStep === 2 && (
          <>
            {/* Section 1: Articles et produits */}
            <Card className="shadow-none border-none">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Articles et produits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                {/* Bouton ajouter article */}
                <div className="flex gap-3">
                  <div className="flex-1" style={{flexBasis: '75%'}}>
                    <ProductSearchCombobox
                      onSelect={addItem}
                      placeholder="Rechercher un produit..."
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="flex-shrink-0" style={{flexBasis: '25%'}}>
                    <Button
                      onClick={() => addItem()}
                      disabled={!canEdit}
                      className="gap-2 w-full"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter un article
                    </Button>
                  </div>
                </div>

                {/* Liste des articles avec Accordion */}
                {data.items.length > 0 && (
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full space-y-3 mb-6"
                  >
                    {data.items.map((item, index) => (
                      <AccordionItem
                        key={index}
                        value={`item-${index}`}
                        className="bg-background border border-b border-gray-200 rounded-lg px-4 py-1 outline-none overflow-visible last:border-b last:border-gray-200"
                      >
                        <AccordionTrigger className="justify-between gap-3 py-3 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900">
                                {item.description || `Article ${index + 1}`}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {item.quantity || 1} × {formatCurrency(item.unitPrice || 0)} = {formatCurrency(item.total || 0)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeItem(index);
                                }}
                                disabled={!canEdit}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-2 px-2 overflow-visible">
                          <div className="space-y-4 pt-2">
                            {/* Description */}
                            <div className="space-y-2">
                              <Label htmlFor={`item-description-${index}`} className="text-sm font-medium text-gray-900">
                                Description de l'article
                              </Label>
                              <Input
                                id={`item-description-${index}`}
                                value={item.description || ""}
                                onChange={(e) => updateItem(index, "description", e.target.value)}
                                placeholder="Décrivez votre produit ou service"
                                disabled={!canEdit}
                                className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>

                            {/* Détails supplémentaires */}
                            <div className="space-y-2">
                              <Label htmlFor={`item-details-${index}`} className="text-sm font-medium text-gray-900">
                                Détails supplémentaires (optionnel)
                              </Label>
                              <Textarea
                                id={`item-details-${index}`}
                                value={item.details || ""}
                                onChange={(e) => updateItem(index, "details", e.target.value)}
                                placeholder="Informations complémentaires sur l'article"
                                disabled={!canEdit}
                                rows={2}
                                className="rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>

                            {/* Quantité et Unité */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`item-quantity-${index}`} className="text-sm font-medium text-gray-900">
                                  Quantité
                                </Label>
                                <Input
                                  id={`item-quantity-${index}`}
                                  type="number"
                                  value={item.quantity || 1}
                                  onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  disabled={!canEdit}
                                  className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-900">
                                  Unité
                                </Label>
                                <Select
                                  value={item.unit || "pièce"}
                                  onValueChange={(value) => updateItem(index, "unit", value)}
                                  disabled={!canEdit}
                                >
                                  <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pièce">Pièce</SelectItem>
                                    <SelectItem value="heure">Heure</SelectItem>
                                    <SelectItem value="jour">Jour</SelectItem>
                                    <SelectItem value="mois">Mois</SelectItem>
                                    <SelectItem value="kg">Kilogramme</SelectItem>
                                    <SelectItem value="m">Mètre</SelectItem>
                                    <SelectItem value="m²">Mètre carré</SelectItem>
                                    <SelectItem value="m³">Mètre cube</SelectItem>
                                    <SelectItem value="litre">Litre</SelectItem>
                                    <SelectItem value="forfait">Forfait</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Prix unitaire et Taux de TVA */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`item-price-${index}`} className="text-sm font-medium text-gray-900">
                                  Prix unitaire (€)
                                </Label>
                                <Input
                                  id={`item-price-${index}`}
                                  type="number"
                                  value={item.unitPrice || 0}
                                  onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  disabled={!canEdit}
                                  className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-900">
                                  Taux de TVA
                                </Label>
                                <Select
                                  value={item.vatRate?.toString() || "20"}
                                  onValueChange={(value) => updateItem(index, "vatRate", parseFloat(value))}
                                  disabled={!canEdit}
                                >
                                  <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0% - Exonéré</SelectItem>
                                    <SelectItem value="5.5">5,5% - Taux réduit</SelectItem>
                                    <SelectItem value="10">10% - Taux intermédiaire</SelectItem>
                                    <SelectItem value="20">20% - Taux normal</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Total HT */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-900">
                                Total HT
                              </Label>
                              <div className="h-10 rounded-lg border border-gray-300 bg-gray-100 px-3 flex items-center text-sm font-medium text-gray-700">
                                {formatCurrency(item.total || 0)}
                              </div>
                            </div>

                            {/* Texte d'exonération TVA (affiché seulement si TVA = 0%) */}
                            {item.vatRate === 0 && (
                              <div className="space-y-2">
                                <Label htmlFor={`item-vat-exemption-${index}`} className="text-sm font-medium text-gray-900">
                                  Texte d'exonération de TVA
                                </Label>
                                <Input
                                  id={`item-vat-exemption-${index}`}
                                  value={item.vatExemptionText || ""}
                                  onChange={(e) => updateItem(index, "vatExemptionText", e.target.value)}
                                  placeholder="Ex: TVA non applicable, art. 293 B du CGI"
                                  disabled={!canEdit}
                                  className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                            )}

                            {/* Remise sur l'article */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Percent className="h-4 w-4 text-gray-500" />
                                <Label className="text-sm font-medium text-gray-900">
                                  Remise sur cet article (optionnel)
                                </Label>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-900">
                                    Type de remise
                                  </Label>
                                  <Select
                                    value={item.discountType || "percentage"}
                                    onValueChange={(value) => updateItem(index, "discountType", value)}
                                    disabled={!canEdit}
                                  >
                                    <SelectTrigger className="w-full h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                                      <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`item-discount-${index}`} className="text-sm font-medium text-gray-900">
                                    {item.discountType === "percentage" ? "Pourcentage (%)" : "Montant (€)"}
                                  </Label>
                                  <Input
                                    id={`item-discount-${index}`}
                                    type="number"
                                    value={item.discount || 0}
                                    onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                                    min="0"
                                    max={item.discountType === "percentage" ? "100" : undefined}
                                    step="0.01"
                                    disabled={!canEdit}
                                    className="w-full h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
                
                {/* État vide */}
                {data.items.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">Aucun article ajouté</h3>
                    <p className="text-sm mb-4">Commencez par ajouter un article à votre facture</p>
                  </div>
                )}

                {/* Bouton ajouter article en bas */}
                {data.items.length > 0 && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => addItem()}
                      disabled={!canEdit}
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter un article
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Section 2: Remises et totaux */}
            <Card className="shadow-none border-none">
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
                      className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Champs personnalisés */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-900">
                    Champs personnalisés
                  </Label>
                  {data.customFields && data.customFields.length > 0 ? (
                    <div className="space-y-3">
                      {data.customFields.map((field, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 rounded-lg">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
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
                              className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
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
                                className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                    <div className="text-center py-8 text-gray-500">
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
                    className="w-full h-10 border-dashed border-gray-300 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
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
      <div className="pt-4 border-t border-gray-200 z-50">
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
