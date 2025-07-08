"use client";

import { useState } from "react";
import { Plus, Trash2, Building, User, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { useInvoiceEditor } from "../hooks/use-invoice-editor";
import ClientSelector from "./client-selector";
import ProductAutocomplete from "./product-autocomplete";
import CompanyImport from "./company-import";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { 
  PAYMENT_METHOD_LABELS, 
  DISCOUNT_TYPE_LABELS,
  INVOICE_STATUS_LABELS 
} from "@/src/graphql/invoiceQueries";

export default function InvoiceForm({
  data,
  onChange,
  onSave,
  onSubmit,
  loading,
  saving,
  readOnly,
  errors = {},
}) {
  const [activeSection, setActiveSection] = useState("basic");

  const updateField = (field, value) => {
    if (readOnly) return;
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, field, value) => {
    if (readOnly) return;
    onChange(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const addItem = () => {
    if (readOnly) return;
    onChange(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: 20,
          total: 0,
        },
      ],
    }));
  };

  const updateItem = (index, field, value) => {
    if (readOnly) return;
    onChange(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      
      // Recalculate total for this item
      if (field === "quantity" || field === "unitPrice") {
        const quantity = field === "quantity" ? value : newItems[index].quantity;
        const unitPrice = field === "unitPrice" ? value : newItems[index].unitPrice;
        newItems[index].total = quantity * unitPrice;
      }
      
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (index) => {
    if (readOnly) return;
    onChange(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const isDraft = data.status === "DRAFT";
  const canEdit = !readOnly && isDraft;

  return (
    <div className="space-y-6">
      {/* Status and Type Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isDraft ? "secondary" : "default"}>
            {data.isDownPayment ? "Facture d'acompte" : 
             isDraft ? "Proformat" : "Facture"}
          </Badge>
          <Badge variant="outline">
            {INVOICE_STATUS_LABELS[data.status]}
          </Badge>
        </div>
        
        {canEdit && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDownPayment"
              checked={data.isDownPayment}
              onCheckedChange={(checked) => updateField("isDownPayment", checked)}
            />
            <Label htmlFor="isDownPayment">Facture d'acompte</Label>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Préfixe</Label>
              <Input
                id="prefix"
                value={data.prefix}
                onChange={(e) => updateField("prefix", e.target.value)}
                disabled={!canEdit}
                className={cn(errors.prefix && "border-destructive")}
              />
              {errors.prefix && (
                <p className="text-sm text-destructive">{errors.prefix}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="number">Numéro</Label>
              <Input
                id="number"
                value={data.number}
                onChange={(e) => updateField("number", e.target.value)}
                disabled={!canEdit}
                placeholder="Auto-généré"
                className={cn(errors.number && "border-destructive")}
              />
              {errors.number && (
                <p className="text-sm text-destructive">{errors.number}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Date d'émission</Label>
              <Input
                id="issueDate"
                type="date"
                value={data.issueDate}
                onChange={(e) => updateField("issueDate", e.target.value)}
                disabled={!canEdit}
                className={cn(errors.issueDate && "border-destructive")}
              />
              {errors.issueDate && (
                <p className="text-sm text-destructive">{errors.issueDate}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="executionDate">Date d'exécution</Label>
              <Input
                id="executionDate"
                type="date"
                value={data.executionDate || ""}
                onChange={(e) => updateField("executionDate", e.target.value || null)}
                disabled={!canEdit}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d'échéance</Label>
              <Input
                id="dueDate"
                type="date"
                value={data.dueDate || ""}
                onChange={(e) => updateField("dueDate", e.target.value || null)}
                disabled={!canEdit}
                className={cn(errors.dueDate && "border-destructive")}
              />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseOrderNumber">Numéro de commande</Label>
            <Input
              id="purchaseOrderNumber"
              value={data.purchaseOrderNumber}
              onChange={(e) => updateField("purchaseOrderNumber", e.target.value)}
              disabled={!canEdit}
              placeholder="Optionnel"
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientSelector
            selectedClient={data.client}
            onSelect={(client) => {
              updateField("client", client ? {
                name: client.name,
                email: client.email,
                phone: client.phone,
                address: client.address,
                siret: client.siret,
                vatNumber: client.vatNumber,
              } : null);
            }}
            placeholder="Rechercher ou sélectionner un client..."
          />
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Articles</CardTitle>
            {canEdit && (
              <Button onClick={addItem} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Aucun article ajouté</p>
              {canEdit && (
                <Button onClick={addItem} variant="outline">
                  Ajouter le premier article
                </Button>
              )}
              {errors.items && (
                <p className="text-sm text-destructive mt-2">{errors.items}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {data.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5 space-y-2">
                      <div className="min-w-[200px]">
                        {index === data.items.length - 1 ? (
                          <ProductAutocomplete
                            onSelect={(product) => {
                              updateItem(index, "description", product.description);
                              updateItem(index, "quantity", product.quantity);
                              updateItem(index, "unitPrice", product.unitPrice);
                              updateItem(index, "taxRate", product.taxRate);
                              // Add new empty row
                              addItem();
                            }}
                            placeholder="Rechercher un produit ou saisir une description..."
                          />
                        ) : (
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            placeholder="Description du produit/service"
                            disabled={!canEdit}
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label>Quantité</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        disabled={!canEdit}
                        min="0"
                        step="0.01"
                        className={cn(errors[`item_${index}_quantity`] && "border-destructive")}
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className="text-xs text-destructive">
                          {errors[`item_${index}_quantity`]}
                        </p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label>Prix unitaire</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        disabled={!canEdit}
                        min="0"
                        step="0.01"
                        className={cn(errors[`item_${index}_unitPrice`] && "border-destructive")}
                      />
                      {errors[`item_${index}_unitPrice`] && (
                        <p className="text-xs text-destructive">
                          {errors[`item_${index}_unitPrice`]}
                        </p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label>TVA (%)</Label>
                      <Input
                        type="number"
                        value={item.taxRate}
                        onChange={(e) => updateItem(index, "taxRate", parseFloat(e.target.value) || 0)}
                        disabled={!canEdit}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="md:col-span-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-right">
                    <p className="text-sm text-muted-foreground">
                      Total: {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(item.total || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discount and Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Remise et paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Remise</Label>
              <Input
                id="discount"
                type="number"
                value={data.discount}
                onChange={(e) => updateField("discount", parseFloat(e.target.value) || 0)}
                disabled={!canEdit}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discountType">Type de remise</Label>
              <Select
                value={data.discountType}
                onValueChange={(value) => updateField("discountType", value)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Méthode de paiement</Label>
              <Select
                value={data.paymentMethod || ""}
                onValueChange={(value) => updateField("paymentMethod", value || null)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes et conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headerNotes">Notes d'en-tête</Label>
            <Textarea
              id="headerNotes"
              value={data.headerNotes}
              onChange={(e) => updateField("headerNotes", e.target.value)}
              disabled={!canEdit}
              placeholder="Notes qui apparaîtront en haut de la facture"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="footerNotes">Notes de pied de page</Label>
            <Textarea
              id="footerNotes"
              value={data.footerNotes}
              onChange={(e) => updateField("footerNotes", e.target.value)}
              disabled={!canEdit}
              placeholder="Notes qui apparaîtront en bas de la facture"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="termsAndConditions">Conditions générales</Label>
            <Textarea
              id="termsAndConditions"
              value={data.termsAndConditions}
              onChange={(e) => updateField("termsAndConditions", e.target.value)}
              disabled={!canEdit}
              placeholder="Conditions générales de vente"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
          
          <Button
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "Validation..." : "Valider la facture"}
          </Button>
        </div>
      )}
    </div>
  );
}
