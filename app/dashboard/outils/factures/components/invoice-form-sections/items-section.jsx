"use client";

import { Package, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import ProductSearchCombobox from "../product-search-combobox";

export default function ItemsSection({ 
  data, 
  updateItem, 
  removeItem, 
  addItem, 
  formatCurrency, 
  canEdit 
}) {
  return (
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

                    {/* Prix unitaire et TVA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`item-price-${index}`} className="text-sm font-medium text-gray-900">
                          Prix unitaire HT (€)
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
                          value={item.taxRate?.toString() || "20"}
                          onValueChange={(value) => updateItem(index, "taxRate", parseFloat(value))}
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (Exonéré)</SelectItem>
                            <SelectItem value="5.5">5,5%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Remise sur l'article */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-900">
                          Type de remise
                        </Label>
                        <Select
                          value={item.discountType || "percentage"}
                          onValueChange={(value) => updateItem(index, "discountType", value)}
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
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
                          Remise {item.discountType === "percentage" ? "(%)" : "(€)"}
                        </Label>
                        <Input
                          id={`item-discount-${index}`}
                          type="number"
                          value={item.discount || 0}
                          onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          disabled={!canEdit}
                          className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    {/* Texte d'exonération TVA */}
                    {item.taxRate === 0 && (
                      <div className="space-y-2">
                        <Label htmlFor={`item-vat-exemption-${index}`} className="text-sm font-medium text-gray-900">
                          Texte d'exonération TVA
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

                    {/* Total HT */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-900">
                        Total HT
                      </Label>
                      <div className="h-10 rounded-lg border-gray-300 bg-gray-50 px-3 text-sm flex items-center font-medium text-gray-900">
                        {formatCurrency(item.total || 0)}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Message si aucun article */}
        {data.items.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Aucun article ajouté</p>
            <p className="text-sm">Utilisez la barre de recherche ou le bouton "Ajouter un article" pour commencer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
