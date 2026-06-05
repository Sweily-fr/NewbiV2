"use client";

import { useCallback, useRef, useState } from "react";
import { PreviewImage } from "@/src/components/ui/preview-image";
import { useMutation } from "@apollo/client";
import { PROCESS_DOCUMENT_OCR } from "@/src/graphql/mutations/ocr";
import {
  useCreatePurchaseInvoice,
  useAddPurchaseInvoiceFile,
} from "@/src/hooks/usePurchaseInvoices";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { VatRateSelect } from "@/src/components/vat-rate-select";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/src/lib/utils";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  X,
  Image as ImageIcon,
  CalendarIcon,
  Hash,
  Building2,
  Tag,
  CreditCard,
  Receipt,
  Paperclip,
  Eye,
} from "lucide-react";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const CATEGORY_OPTIONS = [
  { value: "RENT", label: "Loyer" },
  { value: "SUBSCRIPTIONS", label: "Abonnements" },
  { value: "OFFICE_SUPPLIES", label: "Fournitures" },
  { value: "SERVICES", label: "Sous-traitance" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "MEALS", label: "Repas" },
  { value: "TELECOMMUNICATIONS", label: "Télécommunications" },
  { value: "INSURANCE", label: "Assurance" },
  { value: "ENERGY", label: "Énergie" },
  { value: "SOFTWARE", label: "Logiciels" },
  { value: "HARDWARE", label: "Matériel" },
  { value: "MARKETING", label: "Marketing" },
  { value: "TRAINING", label: "Formation" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TAXES", label: "Impôts & taxes" },
  { value: "UTILITIES", label: "Services publics" },
  { value: "OTHER", label: "Autre" },
];

const STATUS_OPTIONS = [
  { value: "TO_PROCESS", label: "À traiter" },
  { value: "TO_PAY", label: "À payer" },
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Payée" },
  { value: "OVERDUE", label: "En retard" },
  { value: "ARCHIVED", label: "Archivée" },
];

const VALID_CATEGORIES = new Set(CATEGORY_OPTIONS.map((o) => o.value));

const PAYMENT_METHOD_OPTIONS = [
  { value: "BANK_TRANSFER", label: "Virement" },
  { value: "CREDIT_CARD", label: "Carte bancaire" },
  { value: "DIRECT_DEBIT", label: "Prélèvement" },
  { value: "CHECK", label: "Chèque" },
  { value: "CASH", label: "Espèces" },
  { value: "OTHER", label: "Autre" },
];

export function PurchaseInvoiceUploadDrawer({
  open,
  onOpenChange,
  onUploaded,
  // When true, render only the content + footer (no Drawer shell / header),
  // so this can be embedded inside another drawer (e.g. the tabbed create drawer).
  embedded = false,
}) {
  const { workspaceId } = useRequiredWorkspace();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState([]);
  const [currentStep, setCurrentStep] = useState("upload");
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);

  const [processOcr] = useMutation(PROCESS_DOCUMENT_OCR);
  const { createInvoice } = useCreatePurchaseInvoice();
  const { addFile } = useAddPurchaseInvoiceFile();

  const defaultEditableData = {
    supplierName: "",
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    paymentDate: "",
    amountHT: "",
    amountTVA: "",
    vatRate: "20",
    amountTTC: "",
    category: "OTHER",
    status: "TO_PROCESS",
    paymentMethod: "",
  };

  const [editableData, setEditableData] = useState(defaultEditableData);
  // Tracks which amount field was last edited ("ht" or "ttc") so vatRate
  // changes recalculate from the correct source field.
  const [amountSource, setAmountSource] = useState("ht");

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      ACCEPTED_TYPES.includes(f.type),
    );
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []).filter((f) =>
      ACCEPTED_TYPES.includes(f.type),
    );
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Normalize date to YYYY-MM-DD for <input type="date">
  const toDateInput = (dateStr) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const frMatch = dateStr.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (frMatch) {
      const [, day, month, year] = frMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return dateStr;
  };

  const populateEditableDataFromResult = useCallback((result) => {
    if (!result?.financial) {
      setEditableData({ ...defaultEditableData });
      return;
    }
    const f = result.financial;
    const td = f.transaction_data || {};
    const ef = f.extracted_fields || {};
    const totals = ef.totals || {};

    setEditableData({
      supplierName:
        td.vendor_name ||
        td.supplier_name ||
        f.vendor_name ||
        f.supplier_name ||
        "",
      invoiceNumber:
        td.document_number ||
        td.invoice_number ||
        f.invoice_number ||
        f.document_number ||
        "",
      issueDate: toDateInput(
        td.transaction_date ||
          td.invoice_date ||
          f.invoice_date ||
          f.date ||
          "",
      ),
      dueDate: toDateInput(td.due_date || f.due_date || ""),
      paymentDate: toDateInput(td.payment_date || f.payment_date || ""),
      amountHT:
        td.amount_ht?.toString() ||
        totals.total_ht?.toString() ||
        f.amount_ht?.toString() ||
        f.total_ht?.toString() ||
        "",
      amountTVA:
        td.tax_amount?.toString() ||
        totals.total_tax?.toString() ||
        f.tax_amount?.toString() ||
        f.total_vat?.toString() ||
        "",
      vatRate: td.tax_rate?.toString() || f.tax_rate?.toString() || "20",
      amountTTC:
        td.amount?.toString() ||
        totals.total_ttc?.toString() ||
        f.total_ttc?.toString() ||
        f.amount_ttc?.toString() ||
        "",
      category: VALID_CATEGORIES.has(td.category)
        ? td.category
        : VALID_CATEGORIES.has(f.category)
          ? f.category
          : "OTHER",
      status: "TO_PROCESS",
      paymentMethod: "",
    });
  }, []);

  const handleProcessOCR = async () => {
    if (files.length === 0) return;
    setProcessing(true);

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const { data } = await processOcr({
            variables: { file, workspaceId },
          });
          const result = data?.processDocumentOcr;
          if (result?.success) {
            let financialData = {};
            try {
              financialData = JSON.parse(result.financialAnalysis || "{}");
            } catch {
              // ignore
            }
            return {
              file,
              ocrData: result,
              financial: financialData,
              metadata: result.metadata,
            };
          }
          return { file, error: result?.message || "Erreur OCR" };
        } catch (error) {
          return { file, error: error.message };
        }
      }),
    );

    setOcrResults(results);

    // Find first successful result to start review
    const firstSuccessIndex = results.findIndex((r) => !r.error);
    setCurrentReviewIndex(firstSuccessIndex >= 0 ? firstSuccessIndex : 0);
    if (firstSuccessIndex >= 0) {
      populateEditableDataFromResult(results[firstSuccessIndex]);
    }

    setProcessing(false);
    setCreatedCount(0);
    setCurrentStep("review");
  };

  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    // Handle French format DD/MM/YYYY
    const frMatch = dateStr.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (frMatch) {
      const [, day, month, year] = frMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    // Handle ISO or other standard formats
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dy}`;
  };

  // Get only successful OCR results
  const successResults = ocrResults.filter((r) => !r.error);
  const totalToReview = successResults.length;
  const currentResult = ocrResults[currentReviewIndex];

  const handleCreate = async () => {
    if (!editableData.supplierName || !editableData.amountTTC) {
      toast.error("Fournisseur et montant TTC requis");
      return;
    }
    try {
      const result = currentResult;
      const invoice = await createInvoice(
        {
          supplierName: editableData.supplierName,
          invoiceNumber: editableData.invoiceNumber || undefined,
          issueDate:
            normalizeDate(editableData.issueDate) ||
            new Date().toLocaleDateString("sv-SE"),
          dueDate: normalizeDate(editableData.dueDate) || undefined,
          paymentDate: normalizeDate(editableData.paymentDate) || undefined,
          amountHT: parseFloat(editableData.amountHT) || 0,
          amountTVA: parseFloat(editableData.amountTVA) || 0,
          vatRate: parseFloat(editableData.vatRate) || 20,
          amountTTC: parseFloat(editableData.amountTTC),
          category: editableData.category,
          status: editableData.status,
          paymentMethod: editableData.paymentMethod || undefined,
          source: "OCR",
        },
        { silent: true },
      );
      if (invoice?.id && result && !result.error && result.metadata) {
        const fileInput = result.metadata.documentUrl
          ? {
              cloudflareUrl: result.metadata.documentUrl,
              fileName: result.metadata.fileName,
              mimeType: result.metadata.mimeType,
              fileSize: result.metadata.fileSize,
              ocrData: result.financial,
            }
          : {
              file: result.file,
              ocrData: result.financial,
              processOCR: false,
            };
        await addFile(invoice.id, fileInput);
      }

      const newCreatedCount = createdCount + 1;
      setCreatedCount(newCreatedCount);

      // Find next successful result after current index
      const nextIndex = ocrResults.findIndex(
        (r, i) => i > currentReviewIndex && !r.error,
      );

      if (nextIndex >= 0) {
        // Move to next invoice (no intermediate toast — only a recap at the end)
        setCurrentReviewIndex(nextIndex);
        populateEditableDataFromResult(ocrResults[nextIndex]);
      } else {
        // All done — pas de toast : l'écran "done" affiche déjà le récap
        setCurrentStep("done");
        setTimeout(() => {
          resetForm();
          onUploaded?.();
        }, 1000);
      }
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const resetForm = () => {
    setFiles([]);
    setOcrResults([]);
    setCurrentStep("upload");
    setCurrentReviewIndex(0);
    setCreatedCount(0);
    setDragActive(false);
    setEditableData({ ...defaultEditableData });
    setAmountSource("ht");
  };

  const handleEditChange = (field, value) => {
    if (field === "amountHT") setAmountSource("ht");
    if (field === "amountTTC") setAmountSource("ttc");

    setEditableData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "issueDate" && value) {
        if (next.dueDate && next.dueDate < value) next.dueDate = "";
        if (next.paymentDate && next.paymentDate < value) next.paymentDate = "";
      }

      const rate = parseFloat(next.vatRate) || 0;

      if (field === "amountHT") {
        const ht = parseFloat(value) || 0;
        const tva = ht * (rate / 100);
        next.amountTVA = tva.toFixed(2);
        next.amountTTC = (ht + tva).toFixed(2);
      } else if (field === "amountTTC") {
        const ttc = parseFloat(value) || 0;
        const ht = ttc / (1 + rate / 100);
        next.amountHT = ht.toFixed(2);
        next.amountTVA = (ttc - ht).toFixed(2);
      } else if (field === "vatRate") {
        if (amountSource === "ttc") {
          const ttc = parseFloat(next.amountTTC) || 0;
          const ht = ttc / (1 + rate / 100);
          next.amountHT = ht.toFixed(2);
          next.amountTVA = (ttc - ht).toFixed(2);
        } else {
          const ht = parseFloat(next.amountHT) || 0;
          const tva = ht * (rate / 100);
          next.amountTVA = tva.toFixed(2);
          next.amountTTC = (ht + tva).toFixed(2);
        }
      }
      return next;
    });
  };

  const handleOpenChange = (v) => {
    if (!v) {
      // Fermeture en pleine revue OCR : récap des factures créées / abandonnées
      if (currentStep === "review" && createdCount > 0) {
        const cancelled = Math.max(0, totalToReview - createdCount);
        const createdLabel =
          createdCount > 1
            ? `${createdCount} factures d'achat créées`
            : "1 facture d'achat créée";
        const cancelledLabel =
          cancelled > 1 ? `${cancelled} annulées` : "1 annulée";
        toast.success(
          cancelled > 0 ? `${createdLabel}, ${cancelledLabel}` : createdLabel,
        );
      }
      // Rafraîchir le tableau dès qu'au moins une facture a été créée,
      // même si on ferme avant la fin du flux (sinon elles n'apparaissent pas).
      if (createdCount > 0) onUploaded?.();
      resetForm();
    }
    onOpenChange(v);
  };

  const header = (
    <DrawerHeader className="flex flex-row items-center justify-between px-6 py-4 border-b space-y-0">
      <div className="flex items-center gap-2">
        <DrawerTitle className="text-base font-medium">
          {currentStep === "upload"
            ? "Importer une facture"
            : currentStep === "review"
              ? totalToReview > 1
                ? `Facture ${createdCount + 1} / ${totalToReview}`
                : "Vérifier les données"
              : createdCount > 1
                ? `${createdCount} factures créées !`
                : "Importation terminée"}
        </DrawerTitle>
        {currentStep === "review" && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            OCR
          </span>
        )}
      </div>
      <DrawerClose asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </DrawerClose>
    </DrawerHeader>
  );

  const body = (
    <>
        {/* Embedded step indicator (the tab label replaces the drawer title) */}
        {embedded && currentStep === "review" && (
          <div className="flex items-center gap-2 px-6 pt-4">
            <span className="text-sm font-medium">
              {totalToReview > 1
                ? `Facture ${createdCount + 1} / ${totalToReview}`
                : "Vérifier les données"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              OCR
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Step 1: Upload */}
            {currentStep === "upload" && (
              <>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-1 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                    dragActive
                      ? "border-[#5A50FF] bg-[#5A50FF]/5"
                      : "border-muted-foreground/25 hover:border-[#5A50FF]/50 hover:bg-muted/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Glissez vos factures ici
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ou cliquez pour sélectionner (PDF, JPG, PNG - max 10 Mo)
                      </p>
                    </div>
                  </div>
                </div>

                {files.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                        Fichiers sélectionnés
                      </p>
                      <div className="space-y-2">
                        {files.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                              {file.type === "application/pdf" ? (
                                <FileText className="h-5 w-5 text-red-500" />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-normal truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(0)} Ko
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(i);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 2: Review */}
            {currentStep === "review" && currentResult && (
              <>
                {/* Current file indicator */}
                <div className="space-y-2">
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                      currentResult.error
                        ? "bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400"
                        : "bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400"
                    }`}
                  >
                    {currentResult.error ? (
                      <X className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{currentResult.file.name}</span>
                    {currentResult.error && (
                      <span className="text-xs ml-auto flex-shrink-0">
                        {currentResult.error}
                      </span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Editable data */}
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Données extraites
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-normal text-muted-foreground">
                          Fournisseur *
                        </span>
                      </div>
                      <Input
                        value={editableData.supplierName}
                        onChange={(e) =>
                          handleEditChange("supplierName", e.target.value)
                        }
                        placeholder="Nom du fournisseur"
                        className="w-44 h-8 text-sm text-right"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-normal text-muted-foreground">
                          N° Facture
                        </span>
                      </div>
                      <Input
                        value={editableData.invoiceNumber}
                        onChange={(e) =>
                          handleEditChange("invoiceNumber", e.target.value)
                        }
                        className="w-44 h-8 text-sm text-right"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-normal text-muted-foreground">
                          Date d&apos;émission
                        </span>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-44 h-8 justify-start text-left font-normal text-sm",
                              !editableData.issueDate &&
                                "text-muted-foreground",
                            )}
                            type="button"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editableData.issueDate ? (
                              (() => {
                                try {
                                  const date = new Date(
                                    editableData.issueDate + "T00:00:00",
                                  );
                                  if (isNaN(date.getTime()))
                                    return <span>Date invalide</span>;
                                  return format(date, "PPP", { locale: fr });
                                } catch {
                                  return <span>Date invalide</span>;
                                }
                              })()
                            ) : (
                              <span>Choisir une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={
                              editableData.issueDate
                                ? new Date(editableData.issueDate + "T00:00:00")
                                : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                handleEditChange(
                                  "issueDate",
                                  format(date, "yyyy-MM-dd"),
                                );
                              }
                            }}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-normal text-muted-foreground">
                          Date d&apos;échéance
                        </span>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-44 h-8 justify-start text-left font-normal text-sm",
                              !editableData.dueDate && "text-muted-foreground",
                            )}
                            type="button"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editableData.dueDate ? (
                              (() => {
                                try {
                                  const date = new Date(
                                    editableData.dueDate + "T00:00:00",
                                  );
                                  if (isNaN(date.getTime()))
                                    return <span>Date invalide</span>;
                                  return format(date, "PPP", { locale: fr });
                                } catch {
                                  return <span>Date invalide</span>;
                                }
                              })()
                            ) : (
                              <span>Choisir une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={
                              editableData.dueDate
                                ? new Date(editableData.dueDate + "T00:00:00")
                                : undefined
                            }
                            disabled={
                              editableData.issueDate
                                ? {
                                    before: new Date(
                                      editableData.issueDate + "T00:00:00",
                                    ),
                                  }
                                : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                handleEditChange(
                                  "dueDate",
                                  format(date, "yyyy-MM-dd"),
                                );
                              }
                            }}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-normal text-muted-foreground">
                          Date de paiement
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-44 h-8 justify-start text-left font-normal text-sm",
                                !editableData.paymentDate &&
                                  "text-muted-foreground",
                              )}
                              type="button"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editableData.paymentDate ? (
                                (() => {
                                  try {
                                    const date = new Date(
                                      editableData.paymentDate + "T00:00:00",
                                    );
                                    if (isNaN(date.getTime()))
                                      return <span>Date invalide</span>;
                                    return format(date, "PPP", { locale: fr });
                                  } catch {
                                    return <span>Date invalide</span>;
                                  }
                                })()
                              ) : (
                                <span>Choisir une date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={
                                editableData.paymentDate
                                  ? new Date(
                                      editableData.paymentDate + "T00:00:00",
                                    )
                                  : undefined
                              }
                              disabled={
                                editableData.issueDate
                                  ? {
                                      before: new Date(
                                        editableData.issueDate + "T00:00:00",
                                      ),
                                    }
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  handleEditChange(
                                    "paymentDate",
                                    format(date, "yyyy-MM-dd"),
                                  );
                                }
                              }}
                              initialFocus
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Montants
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Montant HT
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={editableData.amountHT}
                        onChange={(e) =>
                          handleEditChange("amountHT", e.target.value)
                        }
                        className="w-32 h-8 text-sm text-right"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Taux TVA
                      </span>
                      <VatRateSelect
                        value={editableData.vatRate}
                        onChange={(v) => handleEditChange("vatRate", String(v))}
                        className="w-44 h-8 text-sm [&>span:first-child]:min-w-0 [&>span:first-child]:truncate [&>span:first-child]:block"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        TVA
                      </span>
                      <span className="text-sm font-normal">
                        {editableData.amountTVA || "0.00"} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Montant TTC *
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={editableData.amountTTC}
                        onChange={(e) =>
                          handleEditChange("amountTTC", e.target.value)
                        }
                        className="w-32 h-8 text-sm text-right"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        Catégorie
                      </span>
                    </div>
                    <Select
                      value={editableData.category}
                      onValueChange={(v) => handleEditChange("category", v)}
                    >
                      <SelectTrigger className="w-44 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        Statut
                      </span>
                    </div>
                    <Select
                      value={editableData.status}
                      onValueChange={(v) => handleEditChange("status", v)}
                    >
                      <SelectTrigger className="w-44 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        Mode de paiement
                      </span>
                    </div>
                    <Select
                      value={editableData.paymentMethod}
                      onValueChange={(v) =>
                        handleEditChange("paymentMethod", v)
                      }
                    >
                      <SelectTrigger className="w-44 h-8 text-sm">
                        <SelectValue placeholder="Non défini" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Justificatif */}
                {currentResult &&
                  !currentResult.error &&
                  currentResult.metadata && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                            Justificatif
                          </p>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                            <Paperclip className="w-3 h-3" />
                            Attaché
                          </span>
                        </div>
                        {(() => {
                          const r = currentResult;
                          const isImage = r.file.type.startsWith("image/");
                          const isPdf = r.file.type === "application/pdf";
                          const blobUrl = URL.createObjectURL(r.file);
                          return (
                            <div
                              className="relative group cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm transition-all"
                              onClick={() =>
                                window.open(
                                  r.metadata.documentUrl || blobUrl,
                                  "_blank",
                                )
                              }
                            >
                              <div className="w-full h-52 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                {isImage ? (
                                  <PreviewImage
                                    src={blobUrl}
                                    alt={r.file.name}
                                    className="w-full h-full object-contain"
                                    containerClassName="w-full h-full"
                                  />
                                ) : isPdf ? (
                                  <iframe
                                    src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                    title={r.file.name}
                                    className="w-full h-full border-0 pointer-events-none"
                                  />
                                ) : (
                                  <FileText className="h-10 w-10 text-red-400" />
                                )}
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-lg hidden group-hover:flex transition-all">
                                  <Eye className="w-5 h-5 text-gray-700" />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                  {isPdf ? (
                                    <FileText className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <ImageIcon className="h-4 w-4 text-blue-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-normal truncate text-foreground">
                                    {r.file.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {(r.file.size / 1024).toFixed(0)} Ko
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}
              </>
            )}

            {/* Step 3: Done */}
            {currentStep === "done" && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-lg font-medium tracking-tight">
                  {createdCount > 1
                    ? `${createdCount} factures créées !`
                    : "Facture créée !"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {createdCount > 1
                    ? "Les factures ont été ajoutées à votre liste"
                    : "La facture a été ajoutée à votre liste"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DrawerFooter className="border-t px-6 py-4">
          {currentStep === "upload" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-normal"
                onClick={() => handleOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 font-normal bg-primary hover:bg-primary/90"
                onClick={handleProcessOCR}
                disabled={files.length === 0 || processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Analyser{" "}
                    {files.length > 0
                      ? `${files.length} fichier${files.length > 1 ? "s" : ""}`
                      : ""}
                  </>
                )}
              </Button>
            </div>
          )}
          {currentStep === "review" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-normal"
                onClick={() => setCurrentStep("upload")}
              >
                Retour
              </Button>
              <Button
                className="flex-1 font-normal bg-primary hover:bg-primary/90"
                onClick={handleCreate}
                disabled={!editableData.supplierName || !editableData.amountTTC}
              >
                {totalToReview > 1
                  ? createdCount + 1 < totalToReview
                    ? "Valider et suivante"
                    : "Valider"
                  : "Créer la facture"}
              </Button>
            </div>
          )}
          {currentStep === "done" && (
            <Button
              className="w-full font-normal"
              onClick={() => handleOpenChange(false)}
            >
              Fermer
            </Button>
          )}
        </DrawerFooter>
    </>
  );

  if (embedded) {
    return <div className="flex flex-col h-full">{body}</div>;
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent
        className="w-full h-full md:w-[500px] md:max-w-[500px] md:min-w-[500px] md:h-auto"
        style={{ width: "100vw", height: "100vh" }}
      >
        {header}
        {body}
      </DrawerContent>
    </Drawer>
  );
}
