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
import ClientSelector from "../../../factures/components/invoices-form-sections/client-selector";
import CompanyImport, {
  QuickCompanyImport,
} from "../../../factures/components/company-import";
import { toast } from "@/src/components/ui/sonner";

// Composant de recherche de produits
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
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: {
      workspaceId,
      search: searchTerm || undefined,
      limit: 20,
    },
    fetchPolicy: "network-only",
    skip: !workspaceId,
  });

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
        taxRate: selectedProduct.vatRate !== undefined ? selectedProduct.vatRate : 20,
        productId: selectedProduct.value,
        unit: selectedProduct.unit || "unité",
      });
    }
    setValue("");
    setOpen(false);
  };

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
        className="p-0" 
        align="start" 
        sideOffset={4}
        style={{ 
          width: 'calc(var(--radix-popover-trigger-width) + 12rem)'
        }}
      >
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

export default function QuoteForm({
  onSave,
  onSubmit,
  loading,
  saving,
  readOnly,
  errors,
}) {
  const { watch, setValue, getValues } = useFormContext();
  const {
    fields: items,
    append,
    remove,
    update,
  } = useFieldArray({ name: "items" });
  const [currentStep, setCurrentStep] = useState(1);

  const data = watch();
  const canEdit = !readOnly && !loading;

  const updateField = useCallback(
    (field, value) => {
      setValue(field, value, { shouldValidate: true, shouldDirty: true });
    },
    [setValue]
  );

  const updateNestedField = useCallback(
    (parent, field, value) => {
      const currentData = getValues(parent) || {};
      setValue(`${parent}.${field}`, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue, getValues]
  );

  const addItem = useCallback(
    (template = null) => {
      const newItem = template || {
        description: "",
        details: "",
        quantity: 1,
        unit: "unité",
        unitPrice: 0,
        taxRate: 20,
        discountRate: 0,
        taxExemptionText: "",
      };
      append(newItem);
    },
    [append]
  );

  const updateItem = useCallback(
    (index, field, value) => {
      const currentItem = items[index];
      const updatedItem = { ...currentItem, [field]: value };

      if (
        field === "quantity" ||
        field === "unitPrice" ||
        field === "discountRate"
      ) {
        const quantity = parseFloat(updatedItem.quantity) || 0;
        const unitPrice = parseFloat(updatedItem.unitPrice) || 0;
        const discountRate = parseFloat(updatedItem.discountRate) || 0;

        const subtotal = quantity * unitPrice;
        const discountAmount = subtotal * (discountRate / 100);
        updatedItem.total = subtotal - discountAmount;
      }

      update(index, updatedItem);
    },
    [items, update]
  );

  const removeItem = useCallback(
    (index) => {
      remove(index);
    },
    [remove]
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
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
    if (onSave) {
      onSave();
    }
  };

  const handleCreateQuote = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  const isStep1Valid = () => {
    return true; // Permettre l'accès à l'étape 2 sans validation stricte
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
      {/* Indicateur de progression */}
      <div className="mb-6">
        <Timeline>
          <TimelineHeader>
            <TimelineItem>
              <TimelineIndicator
                className={
                  currentStep >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }
              >
                1
              </TimelineIndicator>
              <TimelineSeparator
                className={currentStep > 1 ? "bg-primary" : "bg-muted"}
              />
              <TimelineTitle
                className={
                  currentStep >= 1 ? "text-foreground" : "text-muted-foreground"
                }
              >
                Détails du devis
              </TimelineTitle>
            </TimelineItem>
            <TimelineItem>
              <TimelineIndicator
                className={
                  currentStep >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }
              >
                2
              </TimelineIndicator>
              <TimelineTitle
                className={
                  currentStep >= 2 ? "text-foreground" : "text-muted-foreground"
                }
              >
                Produits et services
              </TimelineTitle>
            </TimelineItem>
          </TimelineHeader>
        </Timeline>
      </div>

      {/* Contenu du formulaire */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-auto-hide min-h-0">
        <div className="space-y-6 pb-20">
          {/* Étape 1: Détails du devis */}
          {currentStep === 1 && (
            <>
              {/* Section 1: Informations du devis */}
              <Card className="shadow-none border-none p-2 bg-transparent">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Informations du devis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prefix">Préfixe</Label>
                      <Input
                        id="prefix"
                        value={data.prefix || "D"}
                        onChange={(e) => updateField("prefix", e.target.value)}
                        disabled={!canEdit}
                        placeholder="D"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number">Numéro</Label>
                      <Input
                        id="number"
                        value={data.number || ""}
                        onChange={(e) => updateField("number", e.target.value)}
                        disabled={!canEdit}
                        placeholder="Auto-généré"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quoteReference">Référence devis</Label>
                      <Input
                        id="quoteReference"
                        value={data.quoteReference || ""}
                        onChange={(e) =>
                          updateField("quoteReference", e.target.value)
                        }
                        disabled={!canEdit}
                        placeholder="Référence optionnelle"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label>Date d'émission</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !data.issueDate && "text-muted-foreground",
                                errors?.issueDate && "border-destructive"
                              )}
                              disabled={!canEdit}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {data.issueDate
                                ? format(new Date(data.issueDate), "PPP", {
                                    locale: fr,
                                  })
                                : "Sélectionner une date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                data.issueDate
                                  ? new Date(data.issueDate)
                                  : undefined
                              }
                              onSelect={(date) =>
                                updateField("issueDate", date?.toISOString())
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {errors?.issueDate && (
                          <p className="text-sm font-medium text-destructive">
                            {errors.issueDate.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label>Valide jusqu'au</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !data.validUntil && "text-muted-foreground",
                                errors?.validUntil && "border-destructive"
                              )}
                              disabled={!canEdit}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {data.validUntil
                                ? format(new Date(data.validUntil), "PPP", {
                                    locale: fr,
                                  })
                                : "Sélectionner une date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                data.validUntil
                                  ? new Date(data.validUntil)
                                  : undefined
                              }
                              onSelect={(date) =>
                                updateField("validUntil", date?.toISOString())
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {errors?.validUntil && (
                        <p className="text-sm font-medium text-destructive mt-1">
                          {errors.validUntil.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Separator />

              {/* Section 2: Sélection d'un client */}
              <Card className="shadow-none border-none p-2 bg-transparent">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2 font-normal text-lg">
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

              {/* Section 3: Notes */}
              <Card className="shadow-none border-none p-2 bg-transparent">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Notes et conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="headerNotes">Notes d'en-tête</Label>
                    <Textarea
                      id="headerNotes"
                      value={data.headerNotes || ""}
                      onChange={(e) =>
                        updateField("headerNotes", e.target.value)
                      }
                      disabled={!canEdit}
                      placeholder="Notes affichées en haut du devis..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footerNotes">Notes de bas de page</Label>
                    <Textarea
                      id="footerNotes"
                      value={data.footerNotes || ""}
                      onChange={(e) =>
                        updateField("footerNotes", e.target.value)
                      }
                      disabled={!canEdit}
                      placeholder="Conditions particulières, modalités de paiement..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Étape 2: Produits et services */}
          {currentStep === 2 && (
            <>
              {/* Section Articles */}
              <Card className="shadow-none border-none p-2 bg-transparent">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Articles et services
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Ajoutez les produits et services de votre devis
                    </p>
                    <div className="flex gap-2">
                      <ProductSearchCombobox
                        onSelect={addItem}
                        disabled={!canEdit}
                        className="w-84"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addItem()}
                        disabled={!canEdit}
                      >
                        <Plus />
                        Ajouter
                      </Button>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun article ajouté</p>
                      <p className="text-sm">
                        Commencez par ajouter un produit ou service
                      </p>
                    </div>
                  ) : (
                    <Accordion type="multiple" className="space-y-2">
                      {items.map((item, index) => (
                        <AccordionItem
                          key={item.id || index}
                          value={`item-${index}`}
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center justify-between w-full mr-4">
                              <div className="text-left">
                                <div className="font-medium">
                                  {item.description || `Article ${index + 1}`}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {item.quantity || 1} ×{" "}
                                  {formatCurrency(item.unitPrice || 0)} ={" "}
                                  {formatCurrency(
                                    (item.quantity || 1) * (item.unitPrice || 0)
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeItem(index);
                                }}
                                disabled={!canEdit}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Description *</Label>
                                <Input
                                  value={item.description || ""}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  disabled={!canEdit}
                                  placeholder="Description du produit/service"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Détails</Label>
                                <Input
                                  value={item.details || ""}
                                  onChange={(e) =>
                                    updateItem(index, "details", e.target.value)
                                  }
                                  disabled={!canEdit}
                                  placeholder="Détails supplémentaires"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Quantité *</Label>
                                <Input
                                  type="number"
                                  value={item.quantity || ""}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "quantity",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  disabled={!canEdit}
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Unité</Label>
                                <Input
                                  value={item.unit || ""}
                                  onChange={(e) =>
                                    updateItem(index, "unit", e.target.value)
                                  }
                                  disabled={!canEdit}
                                  placeholder="unité"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Prix unitaire *</Label>
                                <Input
                                  type="number"
                                  value={item.unitPrice || ""}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "unitPrice",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  disabled={!canEdit}
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Taux TVA (%)</Label>
                                <Select
                                  value={item.taxRate?.toString() || "20"}
                                  onValueChange={(value) =>
                                    updateItem(
                                      index,
                                      "taxRate",
                                      parseFloat(value)
                                    )
                                  }
                                  disabled={!canEdit}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">
                                      0% (Exonéré)
                                    </SelectItem>
                                    <SelectItem value="5.5">5,5%</SelectItem>
                                    <SelectItem value="10">10%</SelectItem>
                                    <SelectItem value="20">20%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Footer avec boutons d'action */}
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
