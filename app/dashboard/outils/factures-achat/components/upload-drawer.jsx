"use client";

import { useCallback, useRef, useState } from "react";
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
  { value: "OTHER", label: "Autre" },
];

export function PurchaseInvoiceUploadDrawer({
  open,
  onOpenChange,
  onUploaded,
}) {
  const { workspaceId } = useRequiredWorkspace();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState([]);
  const [currentStep, setCurrentStep] = useState("upload");

  const [processOcr] = useMutation(PROCESS_DOCUMENT_OCR);
  const { createInvoice } = useCreatePurchaseInvoice();
  const { addFile } = useAddPurchaseInvoiceFile();

  const [editableData, setEditableData] = useState({
    supplierName: "",
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    amountHT: "",
    amountTVA: "",
    vatRate: "20",
    amountTTC: "",
    category: "OTHER",
  });

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
      ACCEPTED_TYPES.includes(f.type)
    );
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []).filter((f) =>
      ACCEPTED_TYPES.includes(f.type)
    );
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessOCR = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    const results = [];

    for (const file of files) {
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
          results.push({
            file,
            ocrData: result,
            financial: financialData,
            metadata: result.metadata,
          });
        } else {
          results.push({ file, error: result?.message || "Erreur OCR" });
        }
      } catch (error) {
        results.push({ file, error: error.message });
      }
    }

    setOcrResults(results);

    const firstSuccess = results.find((r) => !r.error);
    if (firstSuccess?.financial) {
      const f = firstSuccess.financial;
      setEditableData({
        supplierName:
          f.vendor_name || f.supplier_name || f.emitter_name || "",
        invoiceNumber: f.invoice_number || f.document_number || "",
        issueDate: f.invoice_date || f.date || "",
        dueDate: f.due_date || "",
        amountHT:
          f.subtotal?.toString() ||
          f.total_ht?.toString() ||
          f.amount_ht?.toString() ||
          "",
        amountTVA:
          f.tax_amount?.toString() ||
          f.total_vat?.toString() ||
          f.vat_amount?.toString() ||
          "",
        vatRate: f.tax_rate?.toString() || f.vat_rate?.toString() || "20",
        amountTTC:
          f.total?.toString() ||
          f.total_ttc?.toString() ||
          f.amount_ttc?.toString() ||
          "",
        category: "OTHER",
      });
    }

    setProcessing(false);
    setCurrentStep("review");
  };

  const handleCreate = async () => {
    if (!editableData.supplierName || !editableData.amountTTC) {
      toast.error("Fournisseur et montant TTC requis");
      return;
    }
    try {
      const invoice = await createInvoice({
        supplierName: editableData.supplierName,
        invoiceNumber: editableData.invoiceNumber || undefined,
        issueDate: editableData.issueDate || new Date().toISOString(),
        dueDate: editableData.dueDate || undefined,
        amountHT: parseFloat(editableData.amountHT) || 0,
        amountTVA: parseFloat(editableData.amountTVA) || 0,
        vatRate: parseFloat(editableData.vatRate) || 20,
        amountTTC: parseFloat(editableData.amountTTC),
        category: editableData.category,
        source: "OCR",
      });
      if (invoice?.id) {
        for (const result of ocrResults) {
          if (!result.error && result.metadata) {
            await addFile(invoice.id, {
              cloudflareUrl: result.metadata.documentUrl,
              fileName: result.metadata.fileName,
              mimeType: result.metadata.mimeType,
              fileSize: result.metadata.fileSize,
              ocrData: JSON.stringify(result.financial),
            });
          }
        }
      }
      setCurrentStep("done");
      setTimeout(() => {
        resetForm();
        onUploaded?.();
      }, 1000);
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const resetForm = () => {
    setFiles([]);
    setOcrResults([]);
    setCurrentStep("upload");
    setDragActive(false);
    setEditableData({
      supplierName: "",
      invoiceNumber: "",
      issueDate: "",
      dueDate: "",
      amountHT: "",
      amountTVA: "",
      vatRate: "20",
      amountTTC: "",
      category: "OTHER",
    });
  };

  const handleEditChange = (field, value) => {
    setEditableData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "amountHT" || field === "vatRate") {
        const ht =
          parseFloat(field === "amountHT" ? value : next.amountHT) || 0;
        const rate =
          parseFloat(field === "vatRate" ? value : next.vatRate) || 0;
        const tva = ht * (rate / 100);
        next.amountTVA = tva.toFixed(2);
        next.amountTTC = (ht + tva).toFixed(2);
      }
      return next;
    });
  };

  const handleOpenChange = (v) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent
        className="w-full h-full md:w-[500px] md:max-w-[500px] md:min-w-[500px] md:h-auto"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Header */}
        <DrawerHeader className="flex flex-row items-center justify-between px-6 py-4 border-b space-y-0">
          <div className="flex items-center gap-2">
            <DrawerTitle className="text-base font-medium">
              {currentStep === "upload"
                ? "Importer une facture"
                : currentStep === "review"
                ? "Vérifier les données"
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
            {currentStep === "review" && (
              <>
                {/* OCR status */}
                <div className="space-y-2">
                  {ocrResults.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        r.error
                          ? "bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400"
                          : "bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400"
                      }`}
                    >
                      {r.error ? (
                        <X className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="truncate">{r.file.name}</span>
                      {r.error && (
                        <span className="text-xs ml-auto flex-shrink-0">
                          {r.error}
                        </span>
                      )}
                    </div>
                  ))}
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
                          Date
                        </span>
                      </div>
                      <Input
                        type="date"
                        value={editableData.issueDate}
                        onChange={(e) =>
                          handleEditChange("issueDate", e.target.value)
                        }
                        className="w-44 h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-normal text-muted-foreground">
                          Échéance
                        </span>
                      </div>
                      <Input
                        type="date"
                        value={editableData.dueDate}
                        onChange={(e) =>
                          handleEditChange("dueDate", e.target.value)
                        }
                        className="w-44 h-8 text-sm"
                      />
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
                      <Select
                        value={editableData.vatRate}
                        onValueChange={(v) => handleEditChange("vatRate", v)}
                      >
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5.5">5,5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
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
                </div>
              </>
            )}

            {/* Step 3: Done */}
            {currentStep === "done" && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-lg font-medium tracking-tight">
                  Facture créée !
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  La facture a été ajoutée à votre liste
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
                disabled={
                  !editableData.supplierName || !editableData.amountTTC
                }
              >
                Créer la facture
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
      </DrawerContent>
    </Drawer>
  );
}
