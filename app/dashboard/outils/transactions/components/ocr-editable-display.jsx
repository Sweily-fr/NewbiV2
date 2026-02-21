"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ZoomIn, ZoomOut, RotateCw, X, Maximize2 } from "lucide-react";
import { parseDate } from "@internationalized/date";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@/src/components/ui/visually-hidden";
import { Calendar } from "@/src/components/ui/calendar-rac";
import CategorySearchSelect from "./category-search-select";

/**
 * Convertit une date française (DD/MM/YY ou DD/MM/YYYY) en format ISO (YYYY-MM-DD)
 * pour les inputs de type date
 */
const frenchDateToISO = (dateStr) => {
  if (!dateStr) return "";

  // Si déjà en format ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Format français DD/MM/YY ou DD/MM/YYYY
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    let year = match[3];
    if (year.length === 2) {
      year = `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  return dateStr;
};

/**
 * Normalise le moyen de paiement OCR vers les valeurs attendues par le Select
 */
const normalizePaymentMethod = (method) => {
  if (!method) return "card";
  const lower = method.toLowerCase();
  if (lower.includes("card") || lower.includes("carte") || lower.includes("cb") || lower.includes("credit")) return "card";
  if (lower.includes("transfer") || lower.includes("virement") || lower.includes("bank")) return "transfer";
  if (lower.includes("cash") || lower.includes("espèce") || lower.includes("liquide")) return "cash";
  if (lower.includes("check") || lower.includes("chèque")) return "check";
  return "card";
};

/**
 * Valeurs acceptées par le CategorySearchSelect (dépenses)
 */
const VALID_EXPENSE_CATEGORIES = [
  "bureau", "materiel", "mobilier", "equipement",
  "transport", "carburant", "parking", "peage", "taxi", "train", "avion", "location_vehicule",
  "repas", "restaurant", "hotel",
  "marketing", "publicite", "communication", "telephone", "internet", "site_web", "reseaux_sociaux",
  "formation", "conference", "livres", "abonnement",
  "comptabilite", "juridique", "assurance", "banque", "conseil", "sous_traitance",
  "loyer", "electricite", "eau", "chauffage", "entretien",
  "logiciel", "saas", "licence",
  "salaire", "charges_sociales", "recrutement",
  "impots_taxes", "tva", "avoirs_remboursement",
  "cadeaux", "representation", "poste", "impression", "autre",
];

/**
 * Normalise la catégorie OCR vers les valeurs attendues par le CategorySearchSelect
 */
const normalizeCategory = (category) => {
  if (!category) return "autre";
  const lower = category.toLowerCase().trim();

  // Déjà une valeur valide
  if (VALID_EXPENSE_CATEGORIES.includes(lower)) return lower;

  // Mapping des catégories OCR courantes
  if (lower.includes("food") || lower.includes("meal") || lower.includes("alimentation") || lower.includes("nourriture") || lower.includes("groceries") || lower.includes("grocery")) return "repas";
  if (lower.includes("restaurant") || lower.includes("dining") || lower.includes("cafe") || lower.includes("coffee")) return "restaurant";
  if (lower.includes("transport") || lower.includes("travel") || lower.includes("deplacement") || lower.includes("mobility")) return "transport";
  if (lower.includes("fuel") || lower.includes("gas") || lower.includes("essence") || lower.includes("gasoline")) return "carburant";
  if (lower.includes("parking")) return "parking";
  if (lower.includes("taxi") || lower.includes("uber") || lower.includes("vtc") || lower.includes("ride")) return "taxi";
  if (lower.includes("hotel") || lower.includes("hebergement") || lower.includes("accommodation") || lower.includes("lodging")) return "hotel";
  if (lower.includes("office") || lower.includes("fourniture") || lower.includes("supplies") || lower.includes("stationery")) return "bureau";
  if (lower.includes("hardware") || lower.includes("equipment") || lower.includes("informatique") || lower.includes("computer") || lower.includes("electronics")) return "materiel";
  if (lower.includes("software") || lower.includes("logiciel") || lower.includes("app") || lower.includes("digital")) return "logiciel";
  if (lower.includes("subscription") || lower.includes("abonnement") || lower.includes("saas") || lower.includes("cloud")) return "abonnement";
  if (lower.includes("insurance") || lower.includes("assurance")) return "assurance";
  if (lower.includes("phone") || lower.includes("telephone") || lower.includes("mobile") || lower.includes("telecom")) return "telephone";
  if (lower.includes("internet") || lower.includes("web") || lower.includes("hosting")) return "internet";
  if (lower.includes("marketing") || lower.includes("advertising") || lower.includes("pub") || lower.includes("ad")) return "marketing";
  if (lower.includes("training") || lower.includes("formation") || lower.includes("education") || lower.includes("course")) return "formation";
  if (lower.includes("rent") || lower.includes("loyer") || lower.includes("lease")) return "loyer";
  if (lower.includes("electric") || lower.includes("energy") || lower.includes("power")) return "electricite";
  if (lower.includes("tax") || lower.includes("impot") || lower.includes("fiscal")) return "impots_taxes";
  if (lower.includes("bank") || lower.includes("bancaire") || lower.includes("fee")) return "banque";
  if (lower.includes("legal") || lower.includes("juridique") || lower.includes("lawyer") || lower.includes("attorney")) return "juridique";
  if (lower.includes("accounting") || lower.includes("comptab")) return "comptabilite";
  if (lower.includes("maintenance") || lower.includes("repair") || lower.includes("entretien") || lower.includes("cleaning")) return "entretien";
  if (lower.includes("salary") || lower.includes("salaire") || lower.includes("wages") || lower.includes("payroll")) return "salaire";
  if (lower.includes("post") || lower.includes("courrier") || lower.includes("shipping") || lower.includes("delivery")) return "poste";
  if (lower.includes("print") || lower.includes("impression") || lower.includes("copy")) return "impression";

  return "autre";
};

/**
 * Parse une date ISO en CalendarDate (react-aria), retourne null si invalide
 */
const safeParseDateValue = (dateStr) => {
  if (!dateStr) return null;
  try {
    return parseDate(dateStr);
  } catch {
    return null;
  }
};

export default function OcrEditableDisplay({
  ocrResult,
  onValidate,
  isCreatingExpense = false,
  imageUrl = null,
  isEditing = false,
  setIsEditing = () => {},
  onSave = null,
  onCancel = null,
  onEditedDataChange = null,
}) {
  const [editedData, setEditedData] = useState(null);
  const [showRawData, setShowRawData] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docZoom, setDocZoom] = useState(1);
  const [docRotation, setDocRotation] = useState(0);

  // Stable object URL for the image to avoid re-creating on every render
  const stableImageUrl = useMemo(() => imageUrl, [imageUrl]);

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
      // Convertir les dates françaises en ISO pour les inputs
      const rawDate =
        financialAnalysis.transaction_data?.transaction_date || "";
      const rawDueDate = financialAnalysis.transaction_data?.due_date || "";

      setEditedData({
        document_type:
          financialAnalysis.document_analysis?.document_type || "receipt",
        amount: parseFloat(financialAnalysis.transaction_data?.amount) || 0,
        currency: financialAnalysis.transaction_data?.currency || "EUR",
        tax_amount: parseFloat(financialAnalysis.transaction_data?.tax_amount) || 0,
        tax_rate: parseFloat(financialAnalysis.transaction_data?.tax_rate) || 20,
        transaction_date: frenchDateToISO(rawDate),
        due_date: frenchDateToISO(rawDueDate),
        vendor_name: financialAnalysis.transaction_data?.vendor_name || "",
        document_number:
          financialAnalysis.transaction_data?.document_number || "",
        category: normalizeCategory(
          financialAnalysis.transaction_data?.category
        ),
        subcategory: financialAnalysis.transaction_data?.subcategory || "",
        status: financialAnalysis.transaction_data?.status || "paid",
        payment_method: normalizePaymentMethod(
          financialAnalysis.transaction_data?.payment_method
        ),
        description: financialAnalysis.transaction_data?.description || "",
        type: financialAnalysis.transaction_data?.type || "expense",
      });
    }
  }, [financialAnalysis]);

  // Notifier le parent quand les données éditées changent
  useEffect(() => {
    if (editedData && onEditedDataChange) {
      const updatedAnalysis = {
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
      onEditedDataChange(updatedAnalysis);
    }
  }, [editedData]);

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
    // Réinitialiser les données avec conversion des dates
    const rawDate = financialAnalysis.transaction_data?.transaction_date || "";
    const rawDueDate = financialAnalysis.transaction_data?.due_date || "";

    setEditedData({
      document_type:
        financialAnalysis.document_analysis?.document_type || "receipt",
      amount: parseFloat(financialAnalysis.transaction_data?.amount) || 0,
      currency: financialAnalysis.transaction_data?.currency || "EUR",
      tax_amount: parseFloat(financialAnalysis.transaction_data?.tax_amount) || 0,
      tax_rate: parseFloat(financialAnalysis.transaction_data?.tax_rate) || 20,
      transaction_date: frenchDateToISO(rawDate),
      due_date: frenchDateToISO(rawDueDate),
      vendor_name: financialAnalysis.transaction_data?.vendor_name || "",
      document_number:
        financialAnalysis.transaction_data?.document_number || "",
      category: normalizeCategory(
        financialAnalysis.transaction_data?.category
      ),
      subcategory: financialAnalysis.transaction_data?.subcategory || "",
      status: financialAnalysis.transaction_data?.status || "paid",
      payment_method: normalizePaymentMethod(
        financialAnalysis.transaction_data?.payment_method
      ),
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

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
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
          <Badge
            variant="outline"
            className="text-xs font-normal px-2.5 py-0.5 border-[#5a50ff]/20 bg-[#5a50ff]/5 text-[#5a50ff] dark:border-[#5a50ff]/30 dark:bg-[#5a50ff]/10 dark:text-[#8b85ff]"
          >
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
        {stableImageUrl && (
          <div className="mt-4">
            <div
              className="border-input relative flex h-48 w-full items-center justify-center overflow-hidden rounded-md border bg-muted/30 cursor-pointer hover:border-primary transition-colors group"
              onClick={() => {
                setDocZoom(1);
                setDocRotation(0);
                setDocViewerOpen(true);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDocZoom(1);
                  setDocRotation(0);
                  setDocViewerOpen(true);
                }
              }}
            >
              {stableImageUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={stableImageUrl}
                  className="h-full w-full pointer-events-none"
                  title="Preview du document OCR"
                />
              ) : (
                <img
                  className="h-full w-full object-contain"
                  src={stableImageUrl}
                  alt="Preview du document OCR"
                  loading="lazy"
                />
              )}
              {/* Overlay avec icône */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-full p-2 shadow-lg border">
                  <Maximize2 className="h-5 w-5 text-foreground" />
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-xs text-center mt-2">
              Cliquez pour agrandir le document
            </p>

            {/* Dialog plein écran pour voir le document */}
            <Dialog open={docViewerOpen} onOpenChange={setDocViewerOpen}>
              <DialogContent
                className="max-w-[95vw] max-h-[95vh] w-full h-[90vh] p-0 overflow-hidden flex flex-col sm:max-w-[95vw]"
                showCloseButton={false}
              >
                <VisuallyHidden>
                  <DialogTitle>Document OCR</DialogTitle>
                </VisuallyHidden>
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur-sm shrink-0">
                  <span className="text-sm font-medium">Document OCR</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDocZoom((z) => Math.max(0.25, z - 0.25))}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                      title="Dézoomer"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-xs text-muted-foreground w-12 text-center">
                      {Math.round(docZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setDocZoom((z) => Math.min(4, z + 0.25))}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                      title="Zoomer"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <div className="w-px h-5 bg-border mx-1" />
                    <button
                      type="button"
                      onClick={() => setDocRotation((r) => (r + 90) % 360)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                      title="Pivoter"
                    >
                      <RotateCw size={16} />
                    </button>
                    <div className="w-px h-5 bg-border mx-1" />
                    <button
                      type="button"
                      onClick={() => setDocViewerOpen(false)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                      title="Fermer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                {/* Document viewer */}
                <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center">
                  {stableImageUrl?.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                      src={stableImageUrl}
                      className="w-full h-full"
                      title="Document OCR"
                      style={{
                        transform: `scale(${docZoom}) rotate(${docRotation}deg)`,
                        transformOrigin: "center center",
                      }}
                    />
                  ) : (
                    <img
                      src={stableImageUrl}
                      alt="Document OCR"
                      className="max-w-none transition-transform duration-200"
                      style={{
                        transform: `scale(${docZoom}) rotate(${docRotation}deg)`,
                        transformOrigin: "center center",
                      }}
                      draggable={false}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      <Separator />

      {/* Informations financières */}
      <div className="py-2 space-y-4">
        <div className="mb-4">
          <span className="text-sm font-normal">Informations financières</span>
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
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-9 w-56 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className={editedData.transaction_date ? "" : "text-muted-foreground"}>
                    {editedData.transaction_date
                      ? formatDateFr(editedData.transaction_date)
                      : "Sélectionner une date"}
                  </span>
                  <CalendarIcon size={16} className="text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <Calendar
                  value={safeParseDateValue(editedData.transaction_date)}
                  onChange={(date) => {
                    if (date) {
                      updateField("transaction_date", date.toString());
                      setDatePopoverOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
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
                onValueChange={(value) => updateField("payment_method", value)}
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
