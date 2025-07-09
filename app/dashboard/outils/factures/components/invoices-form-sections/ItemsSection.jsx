"use client";

import { Package, Plus, Trash2, Percent } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion";
// Utilisation du composant ProductSearchCombobox défini dans enhanced-invoice-form.jsx

export default function ItemsSection({ 
  items, 
  addItem, 
  removeItem, 
  updateItem, 
  formatCurrency, 
  canEdit,
  ProductSearchCombobox 
}) {
  return (
    <Card className="shadow-none border-none bg-transparent">
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
        {items.length > 0 && (
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-3 mb-6"
          >
            {items.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-lg px-4 py-1 overflow-visible border last:border-b-1"
              >
                <AccordionTrigger className="justify-between gap-3 py-3 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1 text-left">
                      <div className="font-medium">
                        {item.description || `Article ${index + 1}`}
                      </div>
                      <div className="text-sm mt-1">
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
                        className="h-8 w-8 p-0"
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
                      <Label htmlFor={`item-description-${index}`} className="text-sm font-medium">
                        Description de l'article
                      </Label>
                      <Input
                        id={`item-description-${index}`}
                        value={item.description || ""}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Décrivez votre produit ou service"
                        disabled={!canEdit}
                        className="h-10 rounded-lg text-sm w-full"
                      />
                    </div>

                    {/* Détails supplémentaires */}
                    <div className="space-y-2">
                      <Label htmlFor={`item-details-${index}`} className="text-sm font-medium">
                        Détails supplémentaires (optionnel)
                      </Label>
                      <Textarea
                        id={`item-details-${index}`}
                        value={item.details || ""}
                        onChange={(e) => updateItem(index, "details", e.target.value)}
                        placeholder="Informations complémentaires sur l'article"
                        disabled={!canEdit}
                        rows={2}
                        className="rounded-lg text-sm w-full"
                      />
                    </div>

                    {/* Quantité et Unité */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`item-quantity-${index}`} className="text-sm font-medium">
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
                          className="h-10 rounded-lg text-sm w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Unité
                        </Label>
                        <Select
                          value={item.unit || "pièce"}
                          onValueChange={(value) => updateItem(index, "unit", value)}
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="h-10 rounded-lg px-3 text-sm">
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
                        <Label htmlFor={`item-price-${index}`} className="text-sm font-medium">
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
                          className="h-10 rounded-lg text-sm w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Taux de TVA
                        </Label>
                        <Select
                          value={item.vatRate?.toString() || "20"}
                          onValueChange={(value) => updateItem(index, "vatRate", parseFloat(value))}
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="h-10 rounded-lg px-3 text-sm">
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
                      <Label className="text-sm font-medium">
                        Total HT
                      </Label>
                      <div className="h-10 rounded-lg px-3 flex items-center text-sm font-medium">
                        {formatCurrency(item.total || 0)}
                      </div>
                    </div>

                    {/* Texte d'exonération TVA (affiché seulement si TVA = 0%) */}
                    {item.vatRate === 0 && (
                      <div className="space-y-2">
                        <Label htmlFor={`item-vat-exemption-${index}`} className="text-sm font-medium">
                          Texte d'exonération de TVA
                        </Label>
                        <Input
                          id={`item-vat-exemption-${index}`}
                          value={item.vatExemptionText || ""}
                          onChange={(e) => updateItem(index, "vatExemptionText", e.target.value)}
                          placeholder="Ex: TVA non applicable, art. 293 B du CGI"
                          disabled={!canEdit}
                          className="h-10 rounded-lg px-3 text-sm"
                        />
                      </div>
                    )}

                    {/* Remise sur l'article */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        <Label className="text-sm font-medium">
                          Remise sur cet article (optionnel)
                        </Label>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Type de remise
                          </Label>
                          <Select
                            value={item.discountType || "percentage"}
                            onValueChange={(value) => updateItem(index, "discountType", value)}
                            disabled={!canEdit}
                          >
                            <SelectTrigger className="w-full h-10 rounded-lg px-3 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                              <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-discount-${index}`} className="text-sm font-medium">
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
                            className="w-full h-10 rounded-lg text-sm"
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
        {items.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">Aucun article ajouté</h3>
            <p className="text-sm mb-4">Commencez par ajouter un article à votre facture</p>
          </div>
        )}

        {/* Bouton ajouter article en bas */}
        {items.length > 0 && (
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
  );
}
