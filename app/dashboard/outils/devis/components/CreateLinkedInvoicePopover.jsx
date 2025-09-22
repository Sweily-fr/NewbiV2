"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { FileText, Plus, AlertCircle, Euro, Calculator } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

export default function CreateLinkedInvoicePopover({
  quote,
  onCreateInvoice,
  loading = false,
  existingInvoices = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [isDeposit, setIsDeposit] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculer les montants
  const quoteTotal = quote?.finalTotalTTC || 0;
  const totalInvoiced = existingInvoices.reduce(
    (sum, inv) => sum + (inv.finalTotalTTC || 0),
    0
  );
  const remainingAmount = quoteTotal - totalInvoiced;
  const canCreateMore = existingInvoices.length < 3 && remainingAmount > 0;

  // Réinitialiser le formulaire quand le popover s'ouvre
  useEffect(() => {
    if (isOpen) {
      setInvoiceAmount("");
      setIsDeposit(false);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    const amount = parseFloat(invoiceAmount);

    if (!invoiceAmount || isNaN(amount)) {
      newErrors.amount = "Le montant est requis";
    } else if (amount <= 0) {
      newErrors.amount = "Le montant doit être positif";
    } else if (amount > remainingAmount) {
      newErrors.amount = `Le montant ne peut pas dépasser ${remainingAmount.toFixed(2)}€`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const amount = parseFloat(invoiceAmount);

    try {
      await onCreateInvoice({
        amount,
        isDeposit,
        sourceQuoteId: quote.id,
      });

      setIsOpen(false);
    } catch (error) {
      toast.error("Erreur lors de la création de la facture");
    }
  };

  const handleQuickAmount = (percentage) => {
    const amount = ((remainingAmount * percentage) / 100).toFixed(2);
    setInvoiceAmount(amount);
  };

  if (!canCreateMore) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Créer une facture
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-6" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Créer une facture</h3>
              <p className="text-sm text-muted-foreground">
                Basée sur le devis {quote?.prefix}
                {quote?.number}
              </p>
            </div>
          </div>

          <Separator />

          {/* Résumé des montants */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Résumé des montants</span>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total du devis :</span>
                <span className="font-medium">{quoteTotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span>Déjà facturé :</span>
                <span className="font-medium">{totalInvoiced.toFixed(2)}€</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Montant restant :</span>
                <span className="text-green-600">
                  {remainingAmount.toFixed(2)}€
                </span>
              </div>
            </div>

            {existingInvoices.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">
                  Factures existantes :
                </span>
                <div className="space-y-1">
                  {existingInvoices.map((invoice, index) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={invoice.isDeposit ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {invoice.isDeposit ? "Acompte" : "Facture"} #
                          {index + 1}
                        </Badge>
                        <span>
                          {invoice.prefix}
                          {invoice.number}
                        </span>
                      </div>
                      <span className="font-medium">
                        {invoice.finalTotalTTC?.toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Formulaire */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant de la facture</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  className={errors.amount ? "border-red-500" : ""}
                />
                <Euro className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            {/* Boutons de montants rapides */}
            <div className="space-y-2">
              <Label className="text-sm">Montants rapides :</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(25)}
                  className="text-xs"
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(50)}
                  className="text-xs"
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(100)}
                  className="text-xs"
                >
                  Solde
                </Button>
              </div>
            </div>

            {/* Checkbox facture d'acompte */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDeposit"
                checked={isDeposit}
                onCheckedChange={setIsDeposit}
              />
              <Label htmlFor="isDeposit" className="text-sm">
                Cette facture est un acompte
              </Label>
            </div>

            {/* Limite de factures */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Vous pouvez créer jusqu'à 3 factures par devis. Factures créées
                : {existingInvoices.length}/3
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !invoiceAmount}
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Créer la facture
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
