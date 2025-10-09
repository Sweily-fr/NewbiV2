"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { useFormContext } from "react-hook-form";
import {
  AlertCircle,
  Building,
  FileText,
  CreditCard,
  Calendar,
  User,
  Receipt,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Calculator,
  Percent,
  Clock,
  Tag,
  Search,
  Zap,
  Package,
  CheckIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_PRODUCTS } from "@/src/graphql/productQueries";

import { Button } from "@/src/components/ui/button";
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
import { Calendar as CalendarComponent } from "@/src/components/ui/calendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

import ItemsSection from "./invoices-form-sections/ItemsSection";
import DiscountsAndTotalsSection from "./invoices-form-sections/DiscountsAndTotalsSection";
import ClientSelector from "./invoices-form-sections/client-selector";
import { CREDIT_TYPE, REFUND_METHOD } from "@/src/graphql/creditNoteQueries";

// Labels for display
const CREDIT_TYPE_LABELS = {
  [CREDIT_TYPE.CORRECTION]: "Correction d'erreur",
  [CREDIT_TYPE.COMMERCIAL_GESTURE]: "Geste commercial",
  [CREDIT_TYPE.REFUND]: "Remboursement",
  [CREDIT_TYPE.CANCELLATION]: "Annulation",
  [CREDIT_TYPE.DISCOUNT]: "Remise supplémentaire",
  [CREDIT_TYPE.OTHER]: "Autre",
};

const REFUND_METHOD_LABELS = {
  [REFUND_METHOD.NEXT_INVOICE]: "Déduction sur prochaine facture",
  [REFUND_METHOD.BANK_TRANSFER]: "Virement bancaire",
  [REFUND_METHOD.CHECK]: "Chèque",
  [REFUND_METHOD.CASH]: "Espèces",
  [REFUND_METHOD.OTHER]: "Autre méthode",
};

// Composant de recherche de produits pour les avoirs
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
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: {
      search: debouncedSearchTerm && debouncedSearchTerm.trim() !== "" ? debouncedSearchTerm : undefined,
      limit: 20,
    },
    fetchPolicy: "network-only",
    skip: !open, // Ne pas exécuter la requête si le dropdown n'est pas ouvert
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
        className="p-0"
        align="start"
        sideOffset={4}
        style={{
          width: "calc(var(--radix-popover-trigger-width) + 12rem)",
        }}
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

export default function EnhancedCreditNoteForm({
  mode,
  originalInvoice,
  organization,
  onSave,
  onSubmit,
  loading,
  saving,
}) {
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const formData = watch();
  const isReadOnly = mode === "view";
  const canEdit = !isReadOnly && !loading;

  // Date handlers
  const handleDateChange = (field, date) => {
    if (date) {
      setValue(field, format(date, "yyyy-MM-dd"));
    }
  };

  const parseDate = (dateString) => {
    if (!dateString) return undefined;
    return new Date(dateString);
  };

  // Navigation functions
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

  const handleCreateCreditNote = () => {
    setValue("status", "CREATED", { shouldDirty: true });
    if (onSubmit) {
      onSubmit();
    }
  };

  const isStep1Valid = () => {
    return true; // Allow navigation without strict validation
  };

  const isStep2Valid = () => {
    return (
      formData.items &&
      formData.items.length > 0 &&
      formData.items.every(
        (item) => item.description && item.quantity && item.unitPrice
      )
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Form Content */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-auto-hide min-h-0">
        <div className="space-y-6">
          {/* Étape 1: Informations de l'avoir */}
          {currentStep === 1 && (
            <>
              {/* Credit Note Information */}
              <Card className="shadow-none p-2 border-none bg-transparent">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2 font-normal text-lg">
                    Informations de l'avoir
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-0">
                  {/* Original Invoice Reference */}
                  {originalInvoice && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-normal">
                          Facture d'origine
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {originalInvoice.number} •{" "}
                        {originalInvoice.client?.name}
                        {originalInvoice.finalTotalTTC && (
                          <span>
                            {" "}
                            • {originalInvoice.finalTotalTTC.toFixed(2)} €
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Credit Type and Refund Method - 50/50 */}
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <Label className="font-normal">Type d'avoir</Label>
                      <Select
                        value={formData.creditType}
                        onValueChange={(value) => setValue("creditType", value)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CREDIT_TYPE_LABELS).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-normal">
                        Méthode de remboursement
                      </Label>
                      <Select
                        value={formData.refundMethod}
                        onValueChange={(value) =>
                          setValue("refundMethod", value)
                        }
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner la méthode" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(REFUND_METHOD_LABELS).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="font-normal">
                      Motif de l'avoir
                    </Label>
                    <Textarea
                      id="reason"
                      {...register("reason")}
                      placeholder="Expliquez la raison de cet avoir..."
                      disabled={isReadOnly}
                      rows={3}
                    />
                  </div>

                  {/* Date d'émission */}
                  <div className="space-y-2">
                    <Label className="font-normal">Date d'émission</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.issueDate && "text-muted-foreground"
                          )}
                          disabled={isReadOnly}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.issueDate
                            ? format(
                                parseDate(formData.issueDate),
                                "dd MMMM yyyy",
                                { locale: fr }
                              )
                            : "Sélectionner une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={parseDate(formData.issueDate)}
                          onSelect={(date) =>
                            handleDateChange("issueDate", date)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Étape 2: Articles et totaux */}
          {currentStep === 2 && (
            <>
              {/* Items Section */}
              <ItemsSection
                mode={mode}
                canEdit={canEdit}
                ProductSearchCombobox={ProductSearchCombobox}
                isCreditNote={true}
              />
            </>
          )}
        </div>
      </div>

      {/* Footer avec boutons d'action */}
      <div className="pt-6 mt-6 border-t bg-background sticky bottom-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={loading || saving}
              className="text-sm font-normal"
            >
              Annuler
            </Button>

            <div className="flex gap-3">
              {currentStep === 1 && (
                <Button
                  onClick={handleNextStep}
                  disabled={!isStep1Valid() || !canEdit}
                  className="px-6 text-sm font-normal"
                >
                  Suivant
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
                    Précédent
                  </Button>
                  <Button
                    onClick={handleCreateCreditNote}
                    disabled={!isStep2Valid() || !canEdit || saving}
                    className="px-6 text-sm font-normal"
                  >
                    {saving ? "Création..." : "Créer l'avoir"}
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
