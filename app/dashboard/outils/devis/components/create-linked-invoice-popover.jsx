"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { Separator } from "@/src/components/ui/separator";
import { Slider } from "@/src/components/ui/slider";
import { Plus, Euro } from "lucide-react";

export default function CreateLinkedInvoicePopover({ 
  quote, 
  onCreateLinkedInvoice, 
  isLoading = false 
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [percentage, setPercentage] = useState([50]); // Slider pour le pourcentage
  const [isDeposit, setIsDeposit] = useState(false);

  // Calculer le montant restant à facturer
  const calculateRemainingAmount = () => {
    if (!quote.linkedInvoices || quote.linkedInvoices.length === 0) {
      return quote.finalTotalTTC;
    }
    
    const totalInvoiced = quote.linkedInvoices.reduce((sum, invoice) => {
      return sum + (invoice.finalTotalTTC || 0);
    }, 0);
    
    return quote.finalTotalTTC - totalInvoiced;
  };

  const remainingAmount = calculateRemainingAmount();
  const linkedInvoicesCount = quote.linkedInvoices ? quote.linkedInvoices.length : 0;
  const canCreateInvoice = linkedInvoicesCount < 3 && remainingAmount > 0;
  const isLastInvoice = linkedInvoicesCount === 2; // 3ème et dernière facture

  console.log('CreateLinkedInvoicePopover - État:', {
    remainingAmount,
    linkedInvoicesCount,
    canCreateInvoice,
    isLastInvoice,
    quoteStatus: quote.status,
    quoteFinalTotal: quote.finalTotalTTC
  });

  // Si c'est la dernière facture, forcer le montant au reste à facturer
  React.useEffect(() => {
    if (isLastInvoice && remainingAmount > 0) {
      setAmount(remainingAmount.toFixed(2));
    }
  }, [isLastInvoice, remainingAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('handleSubmit appelé avec:', { amount, isDeposit, quoteId: quote.id });
    
    const invoiceAmount = parseFloat(amount);
    if (isNaN(invoiceAmount) || invoiceAmount <= 0) {
      console.log('Montant invalide:', invoiceAmount);
      return;
    }

    if (invoiceAmount > remainingAmount) {
      console.log('Montant supérieur au reste à facturer:', invoiceAmount, '>', remainingAmount);
      return;
    }

    try {
      console.log('Appel de onCreateLinkedInvoice avec:', {
        quoteId: quote.id,
        amount: invoiceAmount,
        isDeposit
      });
      
      await onCreateLinkedInvoice({
        quoteId: quote.id,
        amount: invoiceAmount,
        isDeposit
      });

      console.log('Facture liée créée avec succès');
      
      // Réinitialiser le formulaire et fermer le popover
      setAmount("");
      setIsDeposit(false);
      setOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création de la facture liée:', error);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Permettre seulement les nombres avec jusqu'à 2 décimales
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      // Mettre à jour le slider en fonction du montant saisi
      updatePercentageFromAmount(value);
    }
  };

  const setQuickAmount = (percentage) => {
    const quickAmount = (remainingAmount * percentage / 100).toFixed(2);
    setAmount(quickAmount);
    setPercentage([percentage]); // Synchroniser le slider
  };

  // Gérer le changement du slider de pourcentage
  const handlePercentageChange = (value) => {
    const newPercentage = value[0];
    setPercentage([newPercentage]);
    const calculatedAmount = (remainingAmount * newPercentage / 100).toFixed(2);
    setAmount(calculatedAmount);
  };

  // Mettre à jour le slider quand le montant change manuellement
  const updatePercentageFromAmount = (amountValue) => {
    if (amountValue && !isNaN(parseFloat(amountValue)) && remainingAmount > 0) {
      const calculatedPercentage = Math.round((parseFloat(amountValue) / remainingAmount) * 100);
      setPercentage([Math.min(100, Math.max(0, calculatedPercentage))]);
    }
  };

  if (!canCreateInvoice) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full font-normal text-sm"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer une facture liée
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Créer une facture liée au devis</h4>
            <p className="text-sm text-muted-foreground">
              Créez une facture partielle à partir de ce devis
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total du devis :</span>
              <span className="font-medium">{quote.finalTotalTTC.toFixed(2)} €</span>
            </div>
            
            {linkedInvoicesCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Déjà facturé :</span>
                <span className="font-medium">
                  {(quote.finalTotalTTC - remainingAmount).toFixed(2)} €
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reste à facturer :</span>
              <span className="font-semibold text-green-600">
                {remainingAmount.toFixed(2)} €
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Factures liées :</span>
              <span className="font-medium">{linkedInvoicesCount}/3</span>
            </div>
          </div>
          
          <Separator />
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Montant de la facture
                {isLastInvoice && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (Dernière facture - montant fixé)
                  </span>
                )}
              </Label>
              
              {/* Slider de pourcentage - caché pour la dernière facture */}
              {!isLastInvoice && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">
                      Pourcentage du reste à facturer
                    </Label>
                    <span className="text-sm font-medium text-primary">
                      {percentage[0]}%
                    </span>
                  </div>
                  <Slider
                    value={percentage}
                    onValueChange={handlePercentageChange}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                    showTooltip={true}
                    tooltipContent={(value) => `${value}%`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
              
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pl-10"
                  disabled={isLastInvoice}
                  required
                />
              </div>
              
              {/* Boutons de montants rapides - cachés pour la dernière facture */}
              {!isLastInvoice && (
                <div className="flex gap-1 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto"
                    onClick={() => setQuickAmount(25)}
                  >
                    25%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto"
                    onClick={() => setQuickAmount(50)}
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto"
                    onClick={() => setQuickAmount(100)}
                  >
                    Tout
                  </Button>
                </div>
              )}
              
              {/* Message explicatif pour la dernière facture */}
              {isLastInvoice && (
                <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  ⚠️ Cette dernière facture doit obligatoirement être égale au montant restant à facturer.
                </p>
              )}
            </div>
            
            {/* Checkbox "Facture d'acompte" seulement pour la première facture liée */}
            {linkedInvoicesCount === 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDeposit"
                  checked={isDeposit}
                  onCheckedChange={setIsDeposit}
                />
                <Label 
                  htmlFor="isDeposit" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Facture d'acompte
                </Label>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1"
                disabled={
                  isLoading || 
                  !amount || 
                  parseFloat(amount) <= 0 || 
                  parseFloat(amount) > remainingAmount
                }
              >
                {isLoading ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
