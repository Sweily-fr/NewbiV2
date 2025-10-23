"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertTriangle,
  FileText,
  Euro,
  Calendar,
  Building,
  Tag,
  CreditCard,
  LoaderCircle,
  Edit3,
  Save,
  X,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

/**
 * Composant pour afficher et éditer les résultats OCR avec analyse financière
 */
export default function OcrEditableDisplay({
  ocrResult,
  onValidate,
  isCreatingExpense = false,
  imageUrl = null,
}) {
  const [isEditing, setIsEditing] = useState(false);
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
    if (onValidate) {
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
      {/* Header avec bouton d'édition */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Données extraites
        </h3>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="cursor-pointer"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} className="cursor-pointer">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="cursor-pointer"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </div>
      {/* Type de document */}
      <Card className="shadow-none border-none pb-2">
        <CardContent className="px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-normal">Type de document</span>
            </div>
            {isEditing ? (
              <Select
                value={editedData.document_type}
                onValueChange={(value) => updateField("document_type", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Facture</SelectItem>
                  <SelectItem value="receipt">Reçu</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary">
                {editedData.document_type === "invoice"
                  ? "Facture"
                  : editedData.document_type === "receipt"
                    ? "Reçu"
                    : "Autre"}
              </Badge>
            )}
          </div>

          {/* Preview de l'image OCR */}
          {imageUrl && (
            <div className="mt-4">
              <div 
                className="border-input relative flex h-48 w-full items-center justify-center overflow-hidden rounded-md border bg-gray-50 dark:bg-gray-900 cursor-pointer hover:border-blue-500 transition-colors group"
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
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                    <ExternalLink className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground mt-2 text-xs text-center">
                Cliquez pour ouvrir en plein écran
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Separator />

      {/* Informations financières */}
      <Card className="shadow-none border-none py-2">
        <CardContent className="px-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Euro className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-normal">
              Informations financières
            </span>
          </div>
          <div className="space-y-4">
            {/* Type de transaction */}
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Type de transaction
              </Label>
              {isEditing ? (
                <Select
                  value={editedData.type}
                  onValueChange={(value) => updateField("type", value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Dépense</SelectItem>
                    <SelectItem value="income">Revenu</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className="bg-[#5b4fff]/30 border-[#5b4fff]/20 text-[#5b4fff] text-[10px]">
                  {editedData.type === "expense" ? "Dépense" : "Revenu"}
                </Badge>
              )}
            </div>

            {/* Montant */}
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Montant
              </Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={editedData.amount}
                    onChange={(e) =>
                      updateField("amount", parseFloat(e.target.value) || 0)
                    }
                    className="w-24"
                  />
                  <Select
                    value={editedData.currency}
                    onValueChange={(value) => updateField("currency", value)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editedData.amount?.toFixed(2)} {editedData.currency}
                </div>
              )}
            </div>

            {/* Montant TVA */}
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Montant TVA
              </Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  value={editedData.tax_amount}
                  onChange={(e) =>
                    updateField("tax_amount", parseFloat(e.target.value) || 0)
                  }
                  className="w-32"
                />
              ) : (
                <div className="text-sm text-gray-600">
                  {editedData.tax_amount?.toFixed(2)} EUR
                </div>
              )}
            </div>

            {/* Taux TVA */}
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Taux TVA (%)
              </Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.1"
                  value={editedData.tax_rate}
                  onChange={(e) =>
                    updateField("tax_rate", parseFloat(e.target.value) || 0)
                  }
                  className="w-20"
                />
              ) : (
                <div className="text-sm text-gray-600">
                  {editedData.tax_rate}%
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Separator />
      {/* Dates */}
      <Card className="shadow-none border-none py-2">
        <CardContent className="px-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-normal">Dates</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Date de transaction
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedData.transaction_date}
                  onChange={(e) =>
                    updateField("transaction_date", e.target.value)
                  }
                  className="w-40"
                />
              ) : (
                <div className="text-sm text-gray-600">
                  {formatDateFr(editedData.transaction_date)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Date d'échéance
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedData.due_date}
                  onChange={(e) => updateField("due_date", e.target.value)}
                  className="w-40"
                />
              ) : (
                <div className="text-sm text-gray-600">
                  {editedData.due_date ? formatDateFr(editedData.due_date) : "Non définie"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Separator />
      {/* Fournisseur et référence */}
      <Card className="shadow-none border-none py-2">
        <CardContent className="px-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-normal">Fournisseur</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Nom du fournisseur
              </Label>
              {isEditing ? (
                <Input
                  value={editedData.vendor_name}
                  onChange={(e) => updateField("vendor_name", e.target.value)}
                  placeholder="Nom du fournisseur"
                  className="w-48"
                />
              ) : (
                <div className="text-sm text-gray-600">
                  {editedData.vendor_name || "Non détecté"}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Numéro de document
              </Label>
              {isEditing ? (
                <Input
                  value={editedData.document_number}
                  onChange={(e) =>
                    updateField("document_number", e.target.value)
                  }
                  placeholder="Référence du document"
                  className="w-48"
                />
              ) : (
                <div className="text-sm text-gray-600">
                  {editedData.document_number || "Non détecté"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Separator />

      {/* Catégorie et statut */}
      <Card className="shadow-none border-none py-2">
        <CardContent className="px-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Classification</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Catégorie
              </Label>
              {isEditing ? (
                <Select
                  value={editedData.category}
                  onValueChange={(value) => updateField("category", value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bureau">Bureau</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="repas">Repas</SelectItem>
                    <SelectItem value="materiel">Matériel</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="formation">Formation</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">
                  {editedData.category || "autre"}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Statut
              </Label>
              {isEditing ? (
                <Select
                  value={editedData.status}
                  onValueChange={(value) => updateField("status", value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant={
                    editedData.status === "paid"
                      ? "default"
                      : editedData.status === "overdue"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {editedData.status === "paid"
                    ? "Payé"
                    : editedData.status === "overdue"
                      ? "En retard"
                      : "En attente"}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Moyen de paiement
              </Label>
              {isEditing ? (
                <Select
                  value={editedData.payment_method}
                  onValueChange={(value) =>
                    updateField("payment_method", value)
                  }
                >
                  <SelectTrigger className="w-32">
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
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {editedData.payment_method === "card"
                      ? "Carte"
                      : editedData.payment_method === "transfer"
                        ? "Virement"
                        : editedData.payment_method === "cash"
                          ? "Espèces"
                          : editedData.payment_method === "check"
                            ? "Chèque"
                            : "Non détecté"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="shadow-none border-none py-2">
        <CardContent className="px-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Description</span>
          </div>
          <div className="flex items-start justify-between">
            <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mt-1">
              Description
            </Label>
            {isEditing ? (
              <Textarea
                value={editedData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Description de la transaction"
                rows={3}
                className="flex-1 ml-4"
              />
            ) : (
              <div className="flex-1 ml-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {editedData.description || "Aucune description"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {!isEditing && onValidate && (
        <div className="flex gap-2 pt-4 pb-20 md:pb-4">
          <Button
            onClick={() => {
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
              onValidate(updatedFinancialAnalysis);
            }}
            disabled={isCreatingExpense}
            className="flex-1 cursor-pointer"
          >
            {isCreatingExpense ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Valider et créer la dépense"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
