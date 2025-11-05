"use client";

import { useState, useEffect } from "react";
import {
  LoaderCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import CategorySearchSelect from "./category-search-select";

/**
 * Composant pour afficher et éditer les résultats OCR avec analyse financière
 */
export default function OcrEditableDisplay({
  ocrResult,
  onValidate,
  isCreatingExpense = false,
  imageUrl = null,
  isEditing = false,
  setIsEditing = () => {},
  onSave = null,
  onCancel = null,
}) {
  const [editedData, setEditedData] = useState(null);
  const [showRawData, setShowRawData] = useState(false);

  // Parser l'analyse financière si elle est en string
  let financialAnalysis = null;
  try {
    financialAnalysis =
      typeof ocrResult?.financialAnalysis === "string"
        ? JSON.parse(ocrResult.financialAnalysis)
        : ocrResult?.financialAnalysis;
  } catch (error) {
    console.warn("Erreur parsing analyse financière:", error);
  }

  // Initialiser les données éditables
  useEffect(() => {
    if (financialAnalysis && !editedData) {
      setEditedData({
        document_type:
          financialAnalysis.document_analysis?.document_type || "receipt",
        amount: financialAnalysis.transaction_data?.amount || 0,
        currency: financialAnalysis.transaction_data?.currency || "EUR",
        tax_amount: financialAnalysis.transaction_data?.tax_amount || 0,
        tax_rate: financialAnalysis.transaction_data?.tax_rate || 20,
        transaction_date:
          financialAnalysis.transaction_data?.transaction_date || "",
        due_date: financialAnalysis.transaction_data?.due_date || "",
        vendor_name: financialAnalysis.transaction_data?.vendor_name || "",
        document_number:
          financialAnalysis.transaction_data?.document_number || "",
        category: financialAnalysis.transaction_data?.category || "autre",
        subcategory: financialAnalysis.transaction_data?.subcategory || "",
        status: financialAnalysis.transaction_data?.status || "paid",
        payment_method:
          financialAnalysis.transaction_data?.payment_method || "card",
        description: financialAnalysis.transaction_data?.description || "",
        type: financialAnalysis.transaction_data?.type || "expense",
      });
    }
  }, [financialAnalysis]);

  if (!ocrResult || !editedData) return null;

  const handleSave = () => {
    // Reconstituer l'objet financialAnalysis avec les données modifiées
    const updatedFinancialAnalysis = {
      ...financialAnalysis,
      document_analysis: {
        ...financialAnalysis?.document_analysis,
        document_type: editedData.document_type,
      },
      transaction_data: {
        ...financialAnalysis?.transaction_data,
        ...editedData,
      },
    };

    setIsEditing(false);
    
    // Utiliser le callback personnalisé si fourni, sinon appeler onValidate
    if (onSave) {
      onSave(updatedFinancialAnalysis);
    } else if (onValidate) {
      onValidate(updatedFinancialAnalysis);
    }
  };

  const handleCancel = () => {
    // Réinitialiser les données
    setEditedData({
      document_type:
        financialAnalysis.document_analysis?.document_type || "receipt",
      amount: financialAnalysis.transaction_data?.amount || 0,
      currency: financialAnalysis.transaction_data?.currency || "EUR",
      tax_amount: financialAnalysis.transaction_data?.tax_amount || 0,
      tax_rate: financialAnalysis.transaction_data?.tax_rate || 20,
      transaction_date:
        financialAnalysis.transaction_data?.transaction_date || "",
      due_date: financialAnalysis.transaction_data?.due_date || "",
      vendor_name: financialAnalysis.transaction_data?.vendor_name || "",
      document_number:
        financialAnalysis.transaction_data?.document_number || "",
      category: financialAnalysis.transaction_data?.category || "autre",
      subcategory: financialAnalysis.transaction_data?.subcategory || "",
      status: financialAnalysis.transaction_data?.status || "paid",
      payment_method:
        financialAnalysis.transaction_data?.payment_method || "card",
      description: financialAnalysis.transaction_data?.description || "",
      type: financialAnalysis.transaction_data?.type || "expense",
    });
    setIsEditing(false);
    
    // Appeler le callback personnalisé si fourni
    if (onCancel) {
      onCancel();
    }
  };

  const updateField = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fonction pour formater la date en français (dd/mm/aa)
  const formatDateFr = (dateString) => {
    if (!dateString) return "Non spécifiée";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-normal">Données extraites</span>
      </div>
      {/* Type de document */}
      <div className="py-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-normal">Type de document</span>
          <Badge variant="outline" className="text-xs font-normal px-2.5 py-0.5 border-[#5a50ff]/20 bg-[#5a50ff]/5 text-[#5a50ff] dark:border-[#5a50ff]/30 dark:bg-[#5a50ff]/10 dark:text-[#8b85ff]">
            Transaction OCR
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Type de document
          </Label>
          {isEditing ? (
            <Select
              value={editedData.document_type}
              onValueChange={(value) => updateField("document_type", value)}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Facture</SelectItem>
                <SelectItem value="receipt">Reçu</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="w-56 text-sm text-right">
              {editedData.document_type === "invoice"
                ? "Facture"
                : editedData.document_type === "receipt"
                  ? "Reçu"
                  : "Autre"}
            </div>
          )}
        </div>

        {/* Preview de l'image OCR */}
        {imageUrl && (
          <div className="mt-4">
            <div 
              className="border-input relative flex h-48 w-full items-center justify-center overflow-hidden rounded-md border bg-muted/30 cursor-pointer hover:border-primary transition-colors group"
              onClick={() => window.open(imageUrl, '_blank')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.open(imageUrl, '_blank');
                }
              }}
            >
              {imageUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={imageUrl}
                  className="h-full w-full pointer-events-none"
                  title="Preview du document OCR"
                />
              ) : (
                <img
                  className="h-full w-full object-contain"
                  src={imageUrl}
                  alt="Preview du document OCR"
                  loading="lazy"
                />
              )}
              {/* Overlay avec icône */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-full p-2 shadow-lg border">
                  <ExternalLink className="h-5 w-5 text-foreground" />
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-xs text-center mt-2">
              Cliquez pour ouvrir en plein écran
            </p>
          </div>
        )}
      </div>
      <Separator />

      {/* Informations financières */}
      <div className="py-2 space-y-4">
        <div className="mb-4">
          <span className="text-sm font-normal">
            Informations financières
          </span>
        </div>
        <div className="space-y-4">
          {/* Montant */}
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Montant
            </Label>
            {isEditing ? (
              <div className="flex gap-2 w-56">
                <Input
                  type="number"
                  step="0.01"
                  value={editedData.amount}
                  onChange={(e) =>
                    updateField("amount", parseFloat(e.target.value) || 0)
                  }
                  className="flex-1"
                  placeholder="0.00"
                />
                <Select value="EUR" disabled>
                  <SelectTrigger className="w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="w-56 text-sm text-right">
                {editedData.amount?.toFixed(2)} {editedData.currency}
              </div>
            )}
          </div>
        </div>
      </div>
      <Separator />
      {/* Date */}
      <div className="py-2 space-y-4">
        <div className="mb-4">
          <span className="text-sm font-normal">Date</span>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Date de transaction
          </Label>
          {isEditing ? (
            <Input
              type="date"
              value={editedData.transaction_date}
              onChange={(e) =>
                updateField("transaction_date", e.target.value)
              }
              className="w-56"
              lang="fr-FR"
            />
          ) : (
            <div className="w-56 text-sm text-right">
              {formatDateFr(editedData.transaction_date)}
            </div>
          )}
        </div>
      </div>
      <Separator />
      {/* Fournisseur */}
      <div className="py-2 space-y-4">
        <div className="mb-4">
          <span className="text-sm font-normal">Fournisseur</span>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Nom du fournisseur
          </Label>
          {isEditing ? (
            <Input
              value={editedData.vendor_name}
              onChange={(e) => updateField("vendor_name", e.target.value)}
              placeholder="Nom du fournisseur"
              className="w-56"
            />
          ) : (
            <div className="w-56 text-sm text-right">
              {editedData.vendor_name || "Non détecté"}
            </div>
          )}
        </div>
      </div>
      <Separator />

      {/* Classification */}
      <div className="py-2 space-y-4">
        <div className="mb-4">
          <span className="text-sm font-normal">Classification</span>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Catégorie
            </Label>
            {isEditing ? (
              <CategorySearchSelect
                value={editedData.category}
                onValueChange={(value) => updateField("category", value)}
              />
            ) : (
              <div className="w-56 text-sm text-right capitalize">
                {editedData.category || "autre"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Moyen de paiement
            </Label>
            {isEditing ? (
              <Select
                value={editedData.payment_method}
                onValueChange={(value) =>
                  updateField("payment_method", value)
                }
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Carte</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="w-56 text-sm text-right">
                {editedData.payment_method === "card"
                  ? "Carte"
                  : editedData.payment_method === "transfer"
                    ? "Virement"
                    : editedData.payment_method === "cash"
                      ? "Espèces"
                      : editedData.payment_method === "check"
                        ? "Chèque"
                        : "Non détecté"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="py-2 space-y-4">
        <div className="mb-4">
          <span className="text-sm font-normal">Description</span>
        </div>
        <div className="flex items-start justify-between">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mt-1">
            Description
          </Label>
          {isEditing ? (
            <Textarea
              value={editedData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Description de la transaction"
              rows={3}
              className="w-56"
            />
          ) : (
            <div className="w-56 text-sm text-right">
              {editedData.description || "Aucune description"}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
