"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  X,
  Building,
  FileText,
  Save,
  ExternalLink,
  AlertTriangle,
  LoaderCircle,
  CheckCircle,
  ChevronRight,
  Eye,
  Paperclip,
  StickyNote,
} from "lucide-react";
import {
  ClipboardTickIcon,
  Edit2Icon,
  TrashIcon,
} from "@/src/components/icons";
import { formatDateToFrench, formatLocalDate } from "@/src/utils/dateFormatter";
import {
  IMPORTED_INVOICE_STATUS_LABELS,
  IMPORTED_INVOICE_STATUS_COLORS,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  useUpdateImportedInvoice,
  useDeleteImportedInvoice,
  useValidateImportedInvoice,
} from "@/src/graphql/importedInvoiceQueries";
import { toast } from "@/src/components/ui/sonner";

const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";
  try {
    const d = /^\d+$/.test(dateValue)
      ? new Date(parseInt(dateValue, 10))
      : new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    return formatLocalDate(d);
  } catch {
    return "";
  }
};

export function ImportedInvoiceSidebar({
  invoice,
  open,
  onOpenChange,
  onUpdate,
  reviewInfo = null,
  onValidated,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pdfHeightMM, setPdfHeightMM] = useState(297);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calcule la hauteur totale du PDF (somme des pages mises à l'échelle
  // sur la largeur de la feuille) pour éviter le scroll interne de l'iframe.
  useEffect(() => {
    const isPDFFile = invoice?.file?.mimeType === "application/pdf";
    if (!isPDFFile || !invoice?.file?.url) {
      setPdfHeightMM(297);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { PDFDocument } = await import("pdf-lib");
        const res = await fetch(invoice.file.url);
        if (!res.ok) throw new Error("fetch failed");
        const buffer = await res.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const total = pdf.getPages().reduce((sum, page) => {
          const { width, height } = page.getSize();
          // FitH scale chaque page à la largeur de la feuille (210mm)
          return sum + 210 * (height / width);
        }, 0);
        // Le viewer PDF natif ajoute un peu de chrome interne même avec toolbar=0,
        // on ajuste pour éviter une marge noire en bas
        if (!cancelled && total > 0) setPdfHeightMM(total * 0.95);
      } catch {
        if (!cancelled) setPdfHeightMM(297);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [invoice?.file?.url, invoice?.file?.mimeType]);

  const { updateImportedInvoice, loading: updateLoading } =
    useUpdateImportedInvoice();
  const { deleteImportedInvoice, loading: deleteLoading } =
    useDeleteImportedInvoice();
  const { validateImportedInvoice, loading: validateLoading } =
    useValidateImportedInvoice();

  const isLoading = updateLoading || deleteLoading || validateLoading;

  if (!invoice) return null;

  const needsValidation =
    invoice.status === "PENDING_REVIEW" || invoice.status === "UPLOADED";
  const isReviewMode = !!reviewInfo;
  const onClose = () => onOpenChange(false);

  const isPDF = invoice.file?.mimeType === "application/pdf";
  const isImage = invoice.file?.mimeType?.startsWith("image/");

  const handleEdit = () => {
    setEditData({
      originalInvoiceNumber: invoice.originalInvoiceNumber || "",
      clientName: invoice.client?.name || invoice.vendor?.name || "",
      clientSiret: invoice.client?.siret || invoice.vendor?.siret || "",
      invoiceDate: formatDateForInput(invoice.invoiceDate),
      dueDate: formatDateForInput(invoice.dueDate),
      totalHT: invoice.totalHT || 0,
      totalVAT: invoice.totalVAT || 0,
      totalTTC: invoice.totalTTC || 0,
      category: invoice.category || "OTHER",
      paymentMethod: invoice.paymentMethod || "UNKNOWN",
      notes: invoice.notes || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateImportedInvoice({
        variables: { id: invoice.id, input: editData },
      });
      toast.success("Facture mise à jour");
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteImportedInvoice({ variables: { id: invoice.id } });
      toast.success("Facture supprimée");
      setShowDeleteDialog(false);
      onUpdate?.();
      if (isReviewMode) {
        onValidated?.();
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleValidate = async () => {
    try {
      if (isEditing) {
        await updateImportedInvoice({
          variables: { id: invoice.id, input: editData },
        });
        setIsEditing(false);
      }
      await validateImportedInvoice({ variables: { id: invoice.id } });
      toast.success("Facture validée");
      onUpdate?.();
      if (isReviewMode) {
        onValidated?.();
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Erreur lors de la validation");
    }
  };

  const handleSkip = () => {
    setIsEditing(false);
    onValidated?.();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: invoice.currency || "EUR",
    }).format(amount || 0);
  };

  const handleDownloadOriginal = () => {
    if (invoice.file?.url) {
      window.open(invoice.file.url, "_blank");
    }
  };

  return (
    <>
      {/* Semi-transparent overlay (dim léger sur toute la page) */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onClick={onClose}
      />

      {/* Backdrop sombre sur la zone preview - fade in après la sidebar */}
      <motion.div
        className="fixed inset-y-0 left-0 md:right-[40%] right-0 z-40 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
        transition={{ duration: 0.2, delay: 0.2, ease: "easeOut" }}
      />

      {/* Preview du fichier importé - slide depuis la gauche */}
      <motion.div
        className="fixed inset-y-0 left-0 md:right-[40%] right-0 z-50 pointer-events-none"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{
          x: "-100%",
          transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
        }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="absolute inset-0 flex items-start justify-center overflow-y-auto py-4 md:py-12 px-2 md:px-24">
          <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white pointer-events-auto">
            {invoice.file?.url ? (
              isPDF ? (
                <iframe
                  src={`${invoice.file.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  title={invoice.file.originalFileName || "Facture importée"}
                  style={{ height: `${pdfHeightMM}mm` }}
                  className="w-full border-0 block"
                />
              ) : isImage ? (
                <img
                  src={invoice.file.url}
                  alt={invoice.file.originalFileName || "Facture importée"}
                  className="w-full h-auto object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-12 min-h-[calc(100vh-6rem)]">
                  <FileText className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-sm mb-4">Aperçu non disponible</p>
                  <Button variant="outline" onClick={handleDownloadOriginal}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir le fichier
                  </Button>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center text-muted-foreground min-h-[calc(100vh-6rem)]">
                <p className="text-sm">Aucun fichier associé</p>
              </div>
            )}
          </div>
        </div>

        {/* Bouton flottant pour ouvrir les détails sur mobile */}
        <Button
          onClick={() => setShowMobileDetails(true)}
          className="md:hidden fixed bottom-6 right-6 z-[60] rounded-full h-14 w-14 shadow-lg pointer-events-auto"
          size="icon"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Main Sidebar */}
      <motion.div
        className="fixed inset-y-0 right-0 z-50 md:w-[40%] w-full bg-background border-l shadow-lg flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: isMobile && !showMobileDetails ? "100%" : 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-6 py-4 border-b shrink-0">
          <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
            {isReviewMode && (
              <p className="text-xs font-medium text-muted-foreground">
                Validation des imports · {reviewInfo.current}/{reviewInfo.total}
              </p>
            )}
            <h2 className="text-base font-medium">Facture importée</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                  IMPORTED_INVOICE_STATUS_COLORS[invoice.status] ||
                  "bg-gray-100 text-gray-700"
                }`}
              >
                {IMPORTED_INVOICE_STATUS_LABELS[invoice.status] ||
                  invoice.status}
              </span>
              {invoice.isDuplicate && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  Doublon
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (window.innerWidth < 768 && showMobileDetails) {
                  setShowMobileDetails(false);
                } else {
                  setShowMobileDetails(false);
                  onClose();
                }
              }}
              className="h-8 w-8 bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)] dark:bg-[rgba(255,255,255,0.06)] dark:hover:bg-[rgba(255,255,255,0.1)]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Montant principal */}
          <div className="text-center py-2">
            <p className="text-3xl font-bold">
              {formatAmount(invoice.totalTTC)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              HT : {formatAmount(invoice.totalHT)} · TVA :{" "}
              {formatAmount(invoice.totalVAT)}
            </p>
          </div>

          <Separator />

          {/* Mode édition */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>N° Facture</Label>
                <Input
                  value={editData.originalInvoiceNumber}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      originalInvoiceNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <Input
                  value={editData.clientName}
                  onChange={(e) =>
                    setEditData({ ...editData, clientName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>SIRET Client</Label>
                <Input
                  value={editData.clientSiret}
                  onChange={(e) =>
                    setEditData({ ...editData, clientSiret: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editData.invoiceDate}
                    onChange={(e) =>
                      setEditData({ ...editData, invoiceDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Échéance</Label>
                  <Input
                    type="date"
                    value={editData.dueDate}
                    onChange={(e) =>
                      setEditData({ ...editData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>HT</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.totalHT ?? ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        totalHT:
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>TVA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.totalVAT ?? ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        totalVAT:
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>TTC</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.totalTTC ?? ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        totalTTC:
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={editData.category}
                  onValueChange={(value) =>
                    setEditData({ ...editData, category: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Paiement</Label>
                <Select
                  value={editData.paymentMethod}
                  onValueChange={(value) =>
                    setEditData({ ...editData, paymentMethod: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              {/* Client */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Fournisseur
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {invoice.client?.name ||
                      invoice.vendor?.name ||
                      "Non spécifié"}
                  </p>
                  {(invoice.client?.siret || invoice.vendor?.siret) && (
                    <p className="text-xs text-muted-foreground">
                      SIRET : {invoice.client?.siret || invoice.vendor?.siret}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Informations */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Informations
                  </p>
                </div>
                <div className="space-y-3">
                  {invoice.originalInvoiceNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        N° Facture
                      </span>
                      <span className="text-sm font-medium">
                        {invoice.originalInvoiceNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm">
                      {invoice.invoiceDate
                        ? formatDateToFrench(invoice.invoiceDate)
                        : "Non spécifiée"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Échéance
                    </span>
                    <span className="text-sm">
                      {invoice.dueDate
                        ? formatDateToFrench(invoice.dueDate)
                        : "Non spécifiée"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Catégorie
                    </span>
                    <span className="text-sm">
                      {EXPENSE_CATEGORY_LABELS[invoice.category] || "Autre"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Paiement
                    </span>
                    <span className="text-sm">
                      {PAYMENT_METHOD_LABELS[invoice.paymentMethod] ||
                        "Non spécifié"}
                    </span>
                  </div>
                  {invoice.ocrData?.confidence > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Confiance OCR
                      </span>
                      <span className="text-sm">
                        {Math.round(invoice.ocrData.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fichier joint */}
              {invoice.file && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                        Document
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={handleDownloadOriginal}
                    >
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {invoice.file.originalFileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.file.fileSize
                            ? `${Math.round(invoice.file.fileSize / 1024)} Ko`
                            : invoice.file.mimeType}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {invoice.notes && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                        Notes
                      </p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {invoice.notes}
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Actions Footer */}
        <div className="border-t p-4 mt-auto shrink-0 bg-background space-y-2">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
                className="flex-1 font-normal"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={isReviewMode ? handleValidate : handleSave}
                disabled={isLoading}
                className="flex-1 font-medium gap-1.5"
              >
                {updateLoading || validateLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : isReviewMode ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isReviewMode ? "Enregistrer & valider" : "Enregistrer"}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                  className="flex-1 font-normal text-destructive hover:text-destructive [&_svg]:text-destructive"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  disabled={isLoading}
                  className="flex-1 font-normal"
                >
                  <Edit2Icon className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                {needsValidation && (
                  <Button
                    variant="primary"
                    onClick={handleValidate}
                    disabled={isLoading}
                    className="flex-1 font-medium gap-1.5"
                  >
                    {validateLoading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <ClipboardTickIcon className="h-4 w-4" />
                    )}
                    Valider
                  </Button>
                )}
              </div>
              {isReviewMode && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="w-full text-muted-foreground font-normal"
                >
                  Passer
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Modal de confirmation avant la suppression */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(o) => {
          if (!deleteLoading) setShowDeleteDialog(o);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette facture&nbsp;?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture importée sera
              définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Retour
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleteLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                "Confirmer la suppression"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
