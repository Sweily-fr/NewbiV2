"use client";

import { Percent, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";

export default function DiscountAndTotalsSection({ 
  data, 
  updateField, 
  applyDiscount, 
  formatCurrency, 
  canEdit 
}) {
  // Calculs des totaux
  const subtotalHT = data.items.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
    let itemDiscount = 0;
    
    if (item.discount && item.discount > 0) {
      if (item.discountType === "percentage") {
        itemDiscount = itemTotal * (item.discount / 100);
      } else {
        itemDiscount = item.discount;
      }
    }
    
    return sum + (itemTotal - itemDiscount);
  }, 0);

  const discountAmount = data.discountType === "percentage" 
    ? subtotalHT * ((data.discountValue || 0) / 100)
    : (data.discountValue || 0);

  const totalHT = subtotalHT - discountAmount;
  const totalTVA = data.items.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
    let itemDiscount = 0;
    
    if (item.discount && item.discount > 0) {
      if (item.discountType === "percentage") {
        itemDiscount = itemTotal * (item.discount / 100);
      } else {
        itemDiscount = item.discount;
      }
    }
    
    const itemTotalAfterDiscount = itemTotal - itemDiscount;
    const itemTVA = itemTotalAfterDiscount * ((item.taxRate || 0) / 100);
    return sum + itemTVA;
  }, 0);

  const totalTTC = totalHT + totalTVA;

  const addCustomField = () => {
    const newFields = [...(data.customFields || []), { name: "", value: "" }];
    updateField("customFields", newFields);
  };

  const updateCustomField = (index, field, value) => {
    const newFields = [...(data.customFields || [])];
    newFields[index] = { ...newFields[index], [field]: value };
    updateField("customFields", newFields);
  };

  const removeCustomField = (index) => {
    const newFields = (data.customFields || []).filter((_, i) => i !== index);
    updateField("customFields", newFields);
  };

  return (
    <Card className="shadow-none border-none p-2">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Remise et totaux
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Boutons de remises rapides */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-900">Remises rapides</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyDiscount("percentage", 5)}
              disabled={!canEdit}
              className="text-xs"
            >
              -5%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyDiscount("percentage", 10)}
              disabled={!canEdit}
              className="text-xs"
            >
              -10%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyDiscount("percentage", 15)}
              disabled={!canEdit}
              className="text-xs"
            >
              -15%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyDiscount("fixed", 50)}
              disabled={!canEdit}
              className="text-xs"
            >
              -50€
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyDiscount("fixed", 100)}
              disabled={!canEdit}
              className="text-xs"
            >
              -100€
            </Button>
          </div>
        </div>

        {/* Configuration de remise */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">
              Type de remise
            </Label>
            <Select
              value={data.discountType || "percentage"}
              onValueChange={(value) => updateField("discountType", value)}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full">
                <SelectValue placeholder="Pourcentage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                <SelectItem value="fixed">Montant fixe (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount-value" className="text-sm font-medium text-gray-900">
              Valeur de la remise {data.discountType === "percentage" ? "(%)" : "(€)"}
            </Label>
            <Input
              id="discount-value"
              type="number"
              value={data.discountValue || 0}
              onChange={(e) => updateField("discountValue", parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              disabled={!canEdit}
              className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Champs personnalisés */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-900">Champs personnalisés</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomField}
              disabled={!canEdit}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un champ personnalisé
            </Button>
          </div>

          {data.customFields && data.customFields.length > 0 ? (
            <div className="space-y-3">
              {data.customFields.map((field, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">Nom du champ</Label>
                    <Input
                      value={field.name || ""}
                      onChange={(e) => updateCustomField(index, "name", e.target.value)}
                      placeholder="Ex: Référence client"
                      disabled={!canEdit}
                      className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">Valeur</Label>
                    <div className="flex gap-2">
                      <Input
                        value={field.value || ""}
                        onChange={(e) => updateCustomField(index, "value", e.target.value)}
                        placeholder="Ex: REF-2025-001"
                        disabled={!canEdit}
                        className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomField(index)}
                        disabled={!canEdit}
                        className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Aucun champ personnalisé ajouté
            </p>
          )}
        </div>

        {/* Résumé des totaux */}
        <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Résumé des totaux</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Sous-total HT :</span>
              <span className="font-medium">{formatCurrency(subtotalHT)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Remise :</span>
                <span className="font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Total HT :</span>
              <span className="font-medium">{formatCurrency(totalHT)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">TVA :</span>
              <span className="font-medium">{formatCurrency(totalTVA)}</span>
            </div>
            
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total TTC :</span>
              <span>{formatCurrency(totalTTC)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
