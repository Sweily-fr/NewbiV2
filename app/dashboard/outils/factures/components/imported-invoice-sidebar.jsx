"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { ScrollArea } from "@/src/components/ui/scroll-area";
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
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  Building2,
  FileText,
  Edit,
  Trash2,
  Save,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  ChevronRight,
  Loader2,
  LoaderCircle,
  Landmark,
  Link2,
  Unlink,
  X,
} from "lucide-react";
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
import { useReconciliationForImportedInvoice } from "@/src/hooks/useReconciliation";
import { toast } from "sonner";

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

  // Rapprochement bancaire (entrée d'argent — facture de CA importée)
  const {
    fetchTransactionsForImportedInvoice,
    linkTransaction,
    unlinkTransaction,
  } = useReconciliationForImportedInvoice();
  const [availableTransactions, setAvailableTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showTransactionPicker, setShowTransactionPicker] = useState(false);
  const [linkingTransaction, setLinkingTransaction] = useState(false);

  const { updateImportedInvoice, loading: updateLoading } =
    useUpdateImportedInvoice();
  const { deleteImportedInvoice, loading: deleteLoading } =
    useDeleteImportedInvoice();
  const { validateImportedInvoice, loading: validateLoading } =
    useValidateImportedInvoice();

  const isLoading = updateLoading || deleteLoading || validateLoading;

  // Une facture importée n'est rapprochable qu'une fois validée (= CA confirmé)
  // et tant qu'aucune transaction n'y est rattachée.
  const canReconcile =
    invoice?.status === "VALIDATED" && !invoice?.linkedTransactionId;
  const isLinked = !!invoice?.linkedTransactionId;
  const invoiceId = invoice?.id;

  const loadAvailableTransactions = useCallback(async () => {
    if (!invoiceId) return;
    setLoadingTransactions(true);
    try {
      const { transactions } =
        await fetchTransactionsForImportedInvoice(invoiceId);
      setAvailableTransactions(transactions || []);
    } catch (err) {
      console.error("[IMPORTED-SIDEBAR] Erreur chargement transactions:", err);
    } finally {
      setLoadingTransactions(false);
    }
  }, [invoiceId, fetchTransactionsForImportedInvoice]);

  // Charger les suggestions à l'ouverture, pour les factures rapprochables
  useEffect(() => {
    if (open && canReconcile) {
      loadAvailableTransactions();
    } else {
      setAvailableTransactions([]);
      setShowTransactionPicker(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceId, canReconcile]);

  const suggestedTransactions = useMemo(
    () => availableTransactions.filter((tx) => tx.score >= 80),
    [availableTransactions],
  );

  const handleLinkTransaction = useCallback(
    async (transactionId) => {
      setLinkingTransaction(true);
      try {
        const result = await linkTransaction(transactionId, invoiceId);
        if (result.success) {
          toast.success("Paiement bancaire rattaché avec succès");
          setShowTransactionPicker(false);
          onUpdate?.();
        } else {
          toast.error(result.error || "Erreur lors du rattachement");
        }
      } catch (err) {
        toast.error("Erreur lors du rattachement");
      } finally {
        setLinkingTransaction(false);
      }
    },
    [invoiceId, linkTransaction, onUpdate],
  );

  const handleUnlinkTransaction = useCallback(async () => {
    setLinkingTransaction(true);
    try {
      const result = await unlinkTransaction(null, invoiceId);
      if (result.success) {
        toast.success("Paiement bancaire détaché");
        onUpdate?.();
      } else {
        toast.error(result.error || "Erreur lors du détachement");
      }
    } catch (err) {
      toast.error("Erreur lors du détachement");
    } finally {
      setLinkingTransaction(false);
    }
  }, [invoiceId, unlinkTransaction, onUpdate]);

  if (!invoice) return null;

  const needsValidation =
    invoice.status === "PENDING_REVIEW" || invoice.status === "UPLOADED";
  const isReviewMode = !!reviewInfo;

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
      toast.error(error?.message || "Erreur lors de la validation");
    }
  };

  const handleSkip = () => {
    setIsEditing(false);
    onValidated?.();
  };

  const handleDelete = async () => {
    try {
      await deleteImportedInvoice({ variables: { id: invoice.id } });
      toast.success("Facture supprimée");
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

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: invoice.currency || "EUR",
    }).format(amount || 0);
  };

  const handleDownload = () => {
    if (invoice.file?.url) {
      window.open(invoice.file.url, "_blank");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          {isReviewMode && (
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Validation des imports · {reviewInfo.current}/{reviewInfo.total}
            </p>
          )}
          <div className="flex items-center gap-3">
            <SheetTitle className="text-base font-medium">
              Facture importée
            </SheetTitle>
            <Badge className={IMPORTED_INVOICE_STATUS_COLORS[invoice.status]}>
              {IMPORTED_INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
            </Badge>
            {invoice.isDuplicate && (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-700"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Doublon
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {/* Montant principal */}
            <div className="text-center py-4">
              <p className="text-3xl font-bold">
                {formatAmount(invoice.totalTTC)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                HT: {formatAmount(invoice.totalHT)} | TVA:{" "}
                {formatAmount(invoice.totalVAT)}
              </p>
            </div>

            <Separator />

            {/* Mode édition ou affichage */}
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
                <div className="space-y-2">
                  <Label>Date de la facture</Label>
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
                <div className="space-y-2 w-full">
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
                <div className="space-y-2 w-full">
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Client
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {invoice.client?.name ||
                          invoice.vendor?.name ||
                          "Non spécifié"}
                      </p>
                      {(invoice.client?.siret || invoice.vendor?.siret) && (
                        <p className="text-xs text-muted-foreground">
                          SIRET: {invoice.client?.siret || invoice.vendor?.siret}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Informations */}
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Informations
                  </p>

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

                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Échéance
                      </span>
                      <span className="text-sm">
                        {formatDateToFrench(invoice.dueDate)}
                      </span>
                    </div>
                  )}

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
              </>
            )}

            {/* Rapprochement bancaire (entrée d'argent) */}
            {!isEditing && (isLinked || canReconcile) && (
              <>
                <Separator />
                {isLinked ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Paiement bancaire
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Paiement rattaché
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleUnlinkTransaction}
                          disabled={linkingTransaction}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                        >
                          {linkingTransaction ? (
                            <LoaderCircle className="h-3 w-3 animate-spin" />
                          ) : (
                            <Unlink className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : suggestedTransactions.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Paiement détecté
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                        {suggestedTransactions.length} correspondance
                        {suggestedTransactions.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {suggestedTransactions.slice(0, 3).map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {formatAmount(tx.amount)}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDateToFrench(tx.date)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {tx.description}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="ml-3 h-7 text-xs"
                            onClick={() => handleLinkTransaction(tx.id)}
                            disabled={linkingTransaction}
                          >
                            {linkingTransaction ? (
                              <LoaderCircle className="h-3 w-3 animate-spin" />
                            ) : (
                              "Rattacher"
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Paiement bancaire
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTransactionPicker((v) => !v)}
                        disabled={linkingTransaction}
                        className="h-7 px-2 text-xs"
                      >
                        <Link2 className="h-3 w-3 mr-1" />
                        Rattacher
                      </Button>
                    </div>

                    {!showTransactionPicker &&
                      (loadingTransactions ? (
                        <div className="flex items-center justify-center py-4">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          <Landmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Aucun paiement rattaché</p>
                          <p className="text-xs mt-1">
                            Rattachez une transaction bancaire pour marquer la
                            facture comme encaissée
                          </p>
                        </div>
                      ))}

                    {showTransactionPicker && (
                      <div className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Sélectionner une transaction
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTransactionPicker(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {loadingTransactions ? (
                          <div className="flex items-center justify-center py-4">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          </div>
                        ) : availableTransactions.length > 0 ? (
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                              {availableTransactions.map((tx) => (
                                <div
                                  key={tx.id}
                                  className={`p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                                    tx.score >= 80
                                      ? "border-primary/30 bg-primary/5"
                                      : ""
                                  }`}
                                  onClick={() => handleLinkTransaction(tx.id)}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">
                                        {formatAmount(tx.amount)}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {tx.description}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {formatDateToFrench(tx.date)}
                                      </div>
                                    </div>
                                    {tx.score >= 80 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-primary/30 bg-primary/10 text-primary shrink-0"
                                      >
                                        Correspondance
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            Aucune transaction disponible
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <Separator />

            {/* Fichier joint */}
            {invoice.file && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Document
                </p>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50"
                  onClick={handleDownload}
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {invoice.file.originalFileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.file.fileSize
                        ? `${Math.round(invoice.file.fileSize / 1024)} KB`
                        : "PDF"}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Actions - Footer fixe en bas */}
        <div className="border-t p-4 mt-auto shrink-0 bg-background">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                className="flex-1"
                onClick={isReviewMode ? handleValidate : handleSave}
                disabled={isLoading}
              >
                {updateLoading || validateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isReviewMode ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isReviewMode ? "Enregistrer et valider" : "Enregistrer"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {needsValidation && (
                <Button
                  className="w-full"
                  onClick={handleValidate}
                  disabled={isLoading}
                >
                  {validateLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Valider
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleEdit}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Supprimer cette facture ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. La facture importée sera
                        définitivement supprimée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {isReviewMode && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Passer
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
