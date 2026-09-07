"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
// Rendu canvas (pdfjs) du PDF importé : pas de visualiseur natif (fond sombre
// autour de la page), même aperçu que les documents non importés.
import { PdfPageSkeleton, prefetchPdf } from "@/src/components/pdf/pdf-preview";
const PdfPreview = dynamic(
  () =>
    import("@/src/components/pdf/pdf-preview").then((m) => ({
      default: m.PdfPreview,
    })),
  { ssr: false },
);
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
  ExternalLink,
  AlertTriangle,
  LoaderCircle,
  CheckCircle,
  ChevronRight,
  Eye,
  Paperclip,
  StickyNote,
  Landmark,
  Link2,
  Unlink,
} from "lucide-react";
import { ClipboardTickIcon, TrashIcon } from "@/src/components/icons";
import { formatDateToFrench, formatLocalDate } from "@/src/utils/dateFormatter";
import {
  IMPORTED_INVOICE_STATUS_LABELS,
  IMPORTED_INVOICE_STATUS_COLORS,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  useUpdateImportedInvoice,
  useDeleteImportedInvoice,
  useValidateImportedInvoice,
  GET_IMPORTED_INVOICE_CLIENT_SUGGESTION,
} from "@/src/graphql/importedInvoiceQueries";
import { toast } from "@/src/components/ui/sonner";
import { ClientCombobox } from "./client-combobox";
import { useReconciliationForSidebar } from "@/src/hooks/useReconciliationGraphQL";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

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
  // Champs modifiables directement : editData suit la facture affichée,
  // chaque champ est enregistré à la perte de focus (ou au choix pour les
  // listes). savedRef = dernière valeur persistée, pour ne pas renvoyer une
  // mutation inutile.
  const [editData, setEditData] = useState({});
  const savedRef = useRef({});
  const pendingSaveRef = useRef(Promise.resolve());
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // L'URL publique R2 (invoice.file.url) n'est jamais chargée directement :
  // la CSP de prod (frame-src) bloque les iframes vers des domaines externes.
  // L'aperçu passe par le proxy same-origin, comme les documents natifs.
  const previewUrl =
    invoice?.id && invoice?.file?.url
      ? `/api/document-preview/importedInvoice/${invoice.id}`
      : null;

  useEffect(() => {
    if (open && previewUrl && invoice?.file?.mimeType === "application/pdf") {
      prefetchPdf(previewUrl);
    }
  }, [open, previewUrl, invoice?.file?.mimeType]);

  const { updateImportedInvoice, loading: updateLoading } =
    useUpdateImportedInvoice();
  const { deleteImportedInvoice, loading: deleteLoading } =
    useDeleteImportedInvoice();
  const { validateImportedInvoice, loading: validateLoading } =
    useValidateImportedInvoice();

  const isLoading = updateLoading || deleteLoading || validateLoading;

  // Rapprochement bancaire (N↔N) : transactions liées, recherche manuelle.
  const {
    linkImportedInvoice,
    unlinkImportedInvoice,
    fetchTransactionsForImportedInvoice,
    isLinkingImported,
    isUnlinkingImported,
  } = useReconciliationForSidebar();
  const [showTransactionPicker, setShowTransactionPicker] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState("");
  const debouncedTransactionSearch = useDebouncedValue(transactionSearch, 300);
  const [availableTransactions, setAvailableTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (!showTransactionPicker || !invoice?.id) return;
    let cancelled = false;
    setLoadingTransactions(true);
    fetchTransactionsForImportedInvoice(invoice.id, debouncedTransactionSearch)
      .then(({ transactions }) => {
        if (!cancelled) setAvailableTransactions(transactions);
      })
      .finally(() => {
        if (!cancelled) setLoadingTransactions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    showTransactionPicker,
    debouncedTransactionSearch,
    invoice?.id,
    fetchTransactionsForImportedInvoice,
  ]);

  useEffect(() => {
    if (!open) {
      setShowTransactionPicker(false);
      setTransactionSearch("");
      setAvailableTransactions([]);
    }
  }, [open]);

  const handleLinkTransaction = async (transactionId) => {
    if (!invoice?.id || !transactionId) return;
    const result = await linkImportedInvoice(transactionId, invoice.id);
    if (result?.success) {
      setShowTransactionPicker(false);
      setTransactionSearch("");
      onUpdate?.();
    }
  };

  const handleUnlinkTransaction = async (transactionId) => {
    if (!invoice?.id || !transactionId) return;
    const result = await unlinkImportedInvoice(transactionId, invoice.id);
    if (result?.success) onUpdate?.();
  };

  const linkedTransactions = invoice?.linkedTransactions || [];
  const canReconcile = !["REJECTED", "ARCHIVED"].includes(invoice?.status);

  if (!invoice) return null;

  const needsValidation =
    invoice.status === "PENDING_REVIEW" || invoice.status === "UPLOADED";
  const isReviewMode = !!reviewInfo;
  const onClose = () => onOpenChange(false);

  const isPDF = invoice.file?.mimeType === "application/pdf";
  const isImage = invoice.file?.mimeType?.startsWith("image/");

  const buildEditData = (inv) => ({
    originalInvoiceNumber: inv.originalInvoiceNumber || "",
    clientId: inv.client?.id || null,
    clientName: inv.client?.name || inv.vendor?.name || "",
    clientSiret: inv.client?.siret || inv.vendor?.siret || "",
    invoiceDate: formatDateForInput(inv.invoiceDate),
    dueDate: formatDateForInput(inv.dueDate),
    totalHT: inv.totalHT || 0,
    totalVAT: inv.totalVAT || 0,
    totalTTC: inv.totalTTC || 0,
    category: inv.category || "OTHER",
    paymentMethod: inv.paymentMethod || "UNKNOWN",
    notes: inv.notes || "",
  });

  // Nouvelle facture affichée → formulaire réinitialisé depuis ses valeurs.
  useEffect(() => {
    if (!invoice?.id) return;
    const data = buildEditData(invoice);
    setEditData(data);
    savedRef.current = data;
    setSaveState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id]);

  // Enregistre les champs indiqués s'ils ont changé depuis la dernière
  // sauvegarde. `override` permet de passer une valeur avant que le state
  // ne soit à jour (listes, combobox).
  const commitFields = (fields, override = {}) => {
    if (!invoice?.id) return Promise.resolve();
    const current = { ...editData, ...override };
    const patch = {};
    for (const field of fields) {
      if (current[field] !== savedRef.current[field]) {
        patch[field] = current[field];
      }
    }
    if (Object.keys(patch).length === 0) return Promise.resolve();
    setSaveState("saving");
    const run = updateImportedInvoice({
      variables: { id: invoice.id, input: patch },
    })
      .then(() => {
        savedRef.current = { ...savedRef.current, ...patch };
        setSaveState("saved");
        onUpdate?.();
      })
      .catch(() => {
        setSaveState("error");
        toast.error("Erreur lors de l'enregistrement");
      });
    pendingSaveRef.current = run;
    return run;
  };

  // Client par défaut : si l'import n'a pas posé client.id, on cherche un
  // client existant correspondant (nom / SIRET / email) et on l'associe.
  const { data: suggestionData } = useQuery(
    GET_IMPORTED_INVOICE_CLIENT_SUGGESTION,
    {
      variables: { id: invoice?.id },
      skip: !open || !invoice?.id || !!invoice?.client?.id,
      fetchPolicy: "network-only",
    },
  );
  const suggestedClient = suggestionData?.importedInvoiceClientSuggestion;
  useEffect(() => {
    if (!suggestedClient?.id || !invoice?.id || invoice?.client?.id) return;
    if (editData.clientId) return;
    const name =
      suggestedClient.type === "INDIVIDUAL"
        ? `${suggestedClient.firstName || ""} ${suggestedClient.lastName || ""}`.trim()
        : suggestedClient.name || editData.clientName;
    const next = { clientId: suggestedClient.id, clientName: name };
    setEditData((prev) => ({ ...prev, ...next }));
    commitFields(["clientId", "clientName"], next).then(() => {
      toast.success(`Client associé automatiquement : ${name}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedClient?.id, invoice?.id]);

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
      // Un champ en cours de saisie est enregistré à la perte de focus, qui
      // précède le clic : on attend cette sauvegarde avant de valider.
      await pendingSaveRef.current;
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
            {previewUrl ? (
              isPDF ? (
                <PdfPreview
                  src={previewUrl}
                  placeholder={<PdfPageSkeleton />}
                  fallback={
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-12 min-h-[calc(100vh-6rem)]">
                      <FileText className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-sm mb-4">Aperçu non disponible</p>
                      <Button
                        variant="outline"
                        onClick={handleDownloadOriginal}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ouvrir le fichier
                      </Button>
                    </div>
                  }
                />
              ) : isImage ? (
                <img
                  src={previewUrl}
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

          {/* Champs modifiables directement, enregistrés à la perte de focus */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                Informations
              </p>
              <span className="text-xs text-muted-foreground">
                {saveState === "saving"
                  ? "Enregistrement..."
                  : saveState === "saved"
                    ? "Modifications enregistrées"
                    : saveState === "error"
                      ? "Erreur d'enregistrement"
                      : ""}
              </span>
            </div>
            <div className="space-y-2">
              <Label>N° Facture</Label>
              <Input
                onBlur={() => commitFields(["originalInvoiceNumber"])}
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
              {/* Association à un client existant : corrige un mauvais
                    rapprochement automatique ou un client non détecté */}
              <ClientCombobox
                value={editData.clientId}
                selectedName={editData.clientName}
                onChange={(client) => {
                  const next = {
                    clientId: client ? client.id : null,
                    clientName: client
                      ? client.type === "INDIVIDUAL"
                        ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
                        : client.name || editData.clientName
                      : editData.clientName,
                  };
                  setEditData({ ...editData, ...next });
                  commitFields(["clientId", "clientName"], next);
                }}
              />
              <Input
                onBlur={() => commitFields(["clientName"])}
                value={editData.clientName}
                onChange={(e) =>
                  setEditData({ ...editData, clientName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>SIRET Client</Label>
              <Input
                onBlur={() => commitFields(["clientSiret"])}
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
                  onBlur={() => commitFields(["invoiceDate"])}
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
                  onBlur={() => commitFields(["dueDate"])}
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
                  onBlur={() => commitFields(["totalHT"])}
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
                  onBlur={() => commitFields(["totalVAT"])}
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
                  onBlur={() => commitFields(["totalTTC"])}
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
                onValueChange={(value) => {
                  setEditData({ ...editData, category: value });
                  commitFields(["category"], { category: value });
                }}
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
                onValueChange={(value) => {
                  setEditData({ ...editData, paymentMethod: value });
                  commitFields(["paymentMethod"], { paymentMethod: value });
                }}
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

          <Separator />

          {/* Paiement bancaire : encaissements liés (N↔N), recherche
                  manuelle de transaction. */}
          {canReconcile && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                      Paiement bancaire
                    </p>
                  </div>
                  {linkedTransactions.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-[#5A50FF]/10 text-[#5A50FF] dark:bg-[#5A50FF]/20">
                      <CheckCircle className="w-3 h-3" />
                      Rapprochée
                    </span>
                  ) : null}
                </div>

                {linkedTransactions.length > 0 && (
                  <div className="space-y-2">
                    {linkedTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            }).format(tx.amount || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {tx.description || "Transaction"}
                            {tx.date ? ` - ${formatDateToFrench(tx.date)}` : ""}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          disabled={isUnlinkingImported}
                          onClick={() => handleUnlinkTransaction(tx.id)}
                          title="Détacher cette transaction"
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {!showTransactionPicker ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowTransactionPicker(true)}
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1.5" />
                    {linkedTransactions.length > 0
                      ? "Rattacher une autre transaction"
                      : "Rattacher une transaction"}
                  </Button>
                ) : (
                  <div className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Sélectionner une transaction
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setShowTransactionPicker(false);
                          setTransactionSearch("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      value={transactionSearch}
                      onChange={(e) => setTransactionSearch(e.target.value)}
                      placeholder="Libellé, référence, montant..."
                      className="h-8 text-sm"
                      autoFocus
                    />
                    {loadingTransactions ? (
                      <div className="flex items-center justify-center py-4">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      </div>
                    ) : availableTransactions.length > 0 ? (
                      <div className="max-h-[240px] overflow-y-auto space-y-2">
                        {availableTransactions.map((tx) => (
                          <div
                            key={tx.id}
                            className={`p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                              tx.score >= 80
                                ? "border-[#5a50ff]/30 bg-[#5a50ff]/5"
                                : ""
                            }`}
                            onClick={() =>
                              !isLinkingImported && handleLinkTransaction(tx.id)
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {new Intl.NumberFormat("fr-FR", {
                                    style: "currency",
                                    currency: "EUR",
                                  }).format(tx.amount || 0)}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {tx.description || "Transaction"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {tx.date ? formatDateToFrench(tx.date) : ""}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {tx.score >= 80 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#5a50ff]/10 text-[#5a50ff] border border-[#5a50ff]/30">
                                    Correspondance
                                  </span>
                                )}
                                {String(
                                  tx.reconciliationStatus || "",
                                ).toLowerCase() === "matched" && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                    Déjà rapprochée
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-xs text-muted-foreground">
                        {transactionSearch.trim()
                          ? "Aucune transaction ne correspond à cette recherche."
                          : "Aucune entrée d'argent à rapprocher depuis la date de la facture. Saisissez un libellé ou un montant pour élargir la recherche."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

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
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </>
          )}
        </div>

        {/* Actions Footer */}
        <div className="border-t p-4 mt-auto shrink-0 bg-background space-y-2">
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
