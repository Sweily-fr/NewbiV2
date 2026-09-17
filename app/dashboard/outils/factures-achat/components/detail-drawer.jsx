"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
// Miniature canvas (pdfjs) des justificatifs PDF : pas de visualiseur natif
// en iframe (fond sombre autour de la page), même rendu que les documents.
const PdfPreview = dynamic(
  () =>
    import("@/src/components/pdf/pdf-preview").then((m) => ({
      default: m.PdfPreview,
    })),
  { ssr: false },
);
import { useQuery } from "@apollo/client";
import { GET_TRANSACTION } from "@/src/graphql/queries/banking";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
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
  Trash2,
  X,
  FileText,
  CheckCircle2,
  Eye,
  LinkIcon,
  CalendarIcon,
  Receipt,
  Building2,
  CreditCard,
  Save,
  Edit,
  Plus,
  Tag,
  AlertCircle,
  Upload,
  Unlink,
  Search,
  Loader2,
  ExternalLink,
  ScanSearch,
} from "lucide-react";
import { PurchaseOcrComparisonDialog } from "./ocr-comparison-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  DocumentEyeButton,
  DocumentPreviewPanel,
  isDocumentPreviewTarget,
} from "@/src/components/document-preview-panel";
import {
  useCreatePurchaseInvoice,
  useUpdatePurchaseInvoice,
  useDeletePurchaseInvoice,
  useAddPurchaseInvoiceFile,
  useRemovePurchaseInvoiceFile,
  useMarkAsPaid,
  useReconciliationSuggestions,
  useReconcilePurchaseInvoice,
  useAcknowledgePurchaseInvoiceEInvoice,
  useRefusePurchaseInvoiceEInvoice,
  useSubmitPurchaseInvoiceEInvoiceEvent,
  useUnlinkPurchaseInvoiceFromTransaction,
  usePurchaseInvoiceReconciliationPicker,
  useCheckPurchaseInvoiceDuplicates,
  useReanalyzePurchaseInvoice,
  useReanalyzePurchaseInvoiceFiles,
  useUnreconcilePurchaseInvoice,
} from "@/src/hooks/usePurchaseInvoices";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { DuplicateWarningDialog } from "./duplicate-warning-dialog";
import { ReconcileCandidateDialog } from "./reconcile-candidate-dialog";
import { LinkOriginTag } from "@/src/components/reconciliation/LinkOriginTag";
import { formatLocalDate } from "@/src/utils/dateFormatter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/components/ui/sonner";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { VatRateSelect } from "@/src/components/vat-rate-select";
import CategorySearchSelect from "@/src/components/category-search-select";
import { getCategoryLabel } from "@/lib/category-icons-config";
import {
  formatCurrencyAmount,
  currencySymbol,
  normalizeCurrencyCode,
} from "@/src/lib/format-currency";
import { needsReview, OCR_REVIEW_TITLE } from "./ocr-review";

const STATUS_OPTIONS = [
  { value: "TO_PROCESS", label: "À traiter" },
  { value: "TO_PAY", label: "À payer" },
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Payée" },
  { value: "OVERDUE", label: "En retard" },
  { value: "ARCHIVED", label: "Archivée" },
];

const STATUS_BADGE = {
  TO_PROCESS: "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
  TO_PAY:
    "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  PENDING: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  PAID: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  OVERDUE: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  ARCHIVED: "bg-gray-50 text-gray-500 dark:bg-gray-900/20 dark:text-gray-500",
};

const PAYMENT_METHOD_OPTIONS = [
  { value: "BANK_TRANSFER", label: "Virement" },
  { value: "CREDIT_CARD", label: "Carte bancaire" },
  { value: "DIRECT_DEBIT", label: "Prélèvement" },
  { value: "CHECK", label: "Chèque" },
  { value: "CASH", label: "Espèces" },
  { value: "OTHER", label: "Autre" },
];

const paymentMethodLabels = Object.fromEntries(
  PAYMENT_METHOD_OPTIONS.map((o) => [o.value, o.label]),
);

const statusLabels = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

// Montant dans la devise de la facture (ou de la transaction) : une facture
// d'achat créée depuis un justificatif étranger n'est pas forcément en euros.
function formatAmount(amount, currency) {
  return formatCurrencyAmount(amount, currency);
}

function formatDate(date, withTime = false) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  if (withTime) {
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("fr-FR");
}

// Ligne cliquable vers une transaction rapprochée (ouvre le détail de la
// transaction via ?transactionId= sur la page transactions)
function LinkedTransactionLink({
  transactionId,
  purchaseInvoiceId = null,
  action = null,
}) {
  const { data, loading } = useQuery(GET_TRANSACTION, {
    variables: { id: transactionId },
  });
  const tx = data?.transaction;

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/dashboard/outils/transactions?transactionId=${transactionId}`}
        className="flex flex-1 min-w-0 items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors group"
      >
        <div className="flex-1 min-w-0">
          {loading ? (
            <p className="text-xs text-muted-foreground">
              Chargement de la transaction...
            </p>
          ) : tx ? (
            <>
              <span className="text-sm font-medium">
                {formatAmount(Math.abs(tx.amount), tx.currency)}
              </span>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {tx.description && (
                  <span className="truncate">{tx.description}</span>
                )}
                <span className="shrink-0">{formatDate(tx.date)}</span>
              </div>
              {purchaseInvoiceId && (
                <LinkOriginTag
                  className="mt-1.5"
                  links={tx.reconciliationLinks}
                  documentType="PURCHASE_INVOICE"
                  documentId={purchaseInvoiceId}
                />
              )}
            </>
          ) : (
            <p className="text-sm">Voir la transaction</p>
          )}
        </div>
        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
      </Link>
      {action}
    </div>
  );
}

export function PurchaseInvoiceDetailDrawer({
  open,
  onOpenChange,
  invoice,
  mode = "view",
  onSaved,
  onDeleted,
  // Mode création : ouvrir la fiche d'une facture existante à la place
  // (issue « Utiliser cette facture » de l'avertissement de doublon).
  onOpenExisting,
  // When true, render only the content + footer (no Drawer shell / header),
  // so this can be embedded inside another drawer (e.g. the tabbed create drawer).
  embedded = false,
}) {
  const isCreate = mode === "create";
  const [isEditMode, setIsEditMode] = useState(isCreate);
  const [form, setForm] = useState({
    supplierName: "",
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    amountHT: "",
    amountTVA: "",
    vatRate: "20",
    amountTTC: "",
    currency: "EUR",
    status: "TO_PROCESS",
    category: "OTHER",
    notes: "",
    internalReference: "",
    paymentMethod: "",
    paymentDate: "",
  });
  // Tracks which amount field was last edited ("ht" or "ttc") so vatRate
  // changes recalculate from the correct source field.
  const [amountSource, setAmountSource] = useState("ht");
  // Justificatif ajouté à la création (uploadé après createInvoice).
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);

  const { createInvoice, loading: createLoading } = useCreatePurchaseInvoice();
  const { updateInvoice, loading: updateLoading } = useUpdatePurchaseInvoice();
  const { deleteInvoice } = useDeletePurchaseInvoice();
  const { addFile } = useAddPurchaseInvoiceFile();
  const { removeFile } = useRemovePurchaseInvoiceFile();
  // Ajout de justificatifs sur une facture existante (plusieurs fichiers)
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [removingFileId, setRemovingFileId] = useState(null);
  const handleAddFiles = async (fileList) => {
    const list = Array.from(fileList || []);
    if (!invoice?.id || list.length === 0) return;
    setUploadingFiles(true);
    try {
      let added = 0;
      for (const file of list) {
        const res = await addFile(invoice.id, { file, processOCR: false });
        if (res?.success) added += 1;
      }
      if (added > 0) {
        toast.success(
          added > 1 ? `${added} justificatifs ajoutés` : "Justificatif ajouté",
        );
        onSaved?.();
      }
    } finally {
      setUploadingFiles(false);
    }
  };
  const handleRemoveFile = async (fileId) => {
    if (!invoice?.id || !fileId) return;
    setRemovingFileId(fileId);
    try {
      const res = await removeFile(invoice.id, fileId);
      if (res?.success) {
        setPreviewIndex(null);
        onSaved?.();
      }
    } finally {
      setRemovingFileId(null);
    }
  };
  const { markAsPaid, loading: markLoading } = useMarkAsPaid();
  const { reconcile, loading: reconcileLoading } =
    useReconcilePurchaseInvoice();
  const { unlink: unlinkTransaction, loading: unlinkLoading } =
    useUnlinkPurchaseInvoiceFromTransaction();
  const { fetchTransactionsForPurchaseInvoice, fetchReconcileCandidate } =
    usePurchaseInvoiceReconciliationPicker();
  const { checkDuplicates } = useCheckPurchaseInvoiceDuplicates();
  // Doublons probables détectés avant création : { duplicates } ou null
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  // Facture créée alors que le paiement est déjà passé : transaction sûre
  // proposée avec confirmation ({ invoiceId, label, transaction } ou null).
  const [reconcileCandidate, setReconcileCandidate] = useState(null);
  const [confirmingCandidate, setConfirmingCandidate] = useState(false);
  // Rattachement manuel : sélecteur de transactions (débits) avec recherche
  // serveur — recours quand aucune suggestion ne sort (facture créée après
  // le paiement, écart de montant, relevé couvrant plusieurs prélèvements).
  const [showTransactionPicker, setShowTransactionPicker] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState("");
  const debouncedTransactionSearch = useDebouncedValue(transactionSearch, 300);
  const [availableTransactions, setAvailableTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [unlinkingTransactionId, setUnlinkingTransactionId] = useState(null);
  // Justificatif affiché dans le volet de gauche (index dans invoice.files),
  // null = volet fermé. Fermé à l'ouverture et au changement de facture.
  const [previewIndex, setPreviewIndex] = useState(null);
  useEffect(() => {
    setPreviewIndex(null);
  }, [open, invoice?.id]);
  const previewItems = (invoice?.files || []).map((file) => ({
    url: file.url,
    // URL publique R2 interdite par la CSP : PDF via le proxy same-origin.
    pdfSrc: `/api/document-preview/purchaseInvoice/${invoice?.id}?fileId=${file.id}`,
    filename: file.originalFilename,
    mimeType: file.mimetype,
  }));
  const togglePreview = (idx) =>
    setPreviewIndex((current) => (current === idx ? null : idx));

  // Relance OCR : la proposition est comparée aux valeurs actuelles dans un
  // dialogue, puis les champs cochés sont enregistrés (updatePurchaseInvoice)
  // et reportés dans le formulaire. Copie du flux des factures importées.
  const { reanalyzeInvoice, loading: reanalyzingOne } =
    useReanalyzePurchaseInvoice();
  const { reanalyzeAllFiles, loading: reanalyzingAll } =
    useReanalyzePurchaseInvoiceFiles();
  const reanalyzing = reanalyzingOne || reanalyzingAll;
  const [ocrProposal, setOcrProposal] = useState(null);
  // Résultat de l'analyse de tous les justificatifs (détail par fichier)
  const [ocrMulti, setOcrMulti] = useState(null);
  // Fichier relu en mode « un seul justificatif » (aperçu dans le dialogue)
  const [ocrSourceFileId, setOcrSourceFileId] = useState(null);
  const [applyingOcr, setApplyingOcr] = useState(false);
  const { unreconcile: unreconcileInvoice } = useUnreconcilePurchaseInvoice();
  useEffect(() => {
    setOcrProposal(null);
    setOcrMulti(null);
  }, [open, invoice?.id]);
  // Tous les justificatifs : dédoublonnage, somme des documents distincts,
  // conversion en devise de la facture (débit bancaire lié prioritaire).
  const handleReanalyzeAll = async () => {
    if (!invoice?.id) return;
    try {
      const result = await reanalyzeAllFiles(invoice.id);
      if (!result?.combined) {
        toast.error("L'analyse n'a rien lu d'exploitable");
        return;
      }
      setOcrMulti(result);
      setOcrProposal(result.combined);
    } catch (error) {
      toast.error(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Impossible de relancer l'analyse OCR",
      );
    }
  };
  const handleReanalyze = async (fileId) => {
    if (!invoice?.id) return;
    try {
      const targetFileId =
        fileId || invoice.files?.[previewIndex ?? 0]?.id || undefined;
      const proposal = await reanalyzeInvoice(invoice.id, targetFileId);
      setOcrMulti(null);
      setOcrSourceFileId(targetFileId || null);
      setOcrProposal(proposal);
    } catch (error) {
      toast.error(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Impossible de relancer l'analyse OCR",
      );
    }
  };
  // Plusieurs justificatifs : par défaut on relit tout (somme des documents
  // distincts, conversion de devise), ou un seul fichier au choix.
  const renderReanalyzeTrigger = (children) => {
    const files = invoice?.files || [];
    if (files.length <= 1) {
      return React.cloneElement(children, {
        onClick: () => handleReanalyze(),
      });
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuItem onClick={handleReanalyzeAll} className="gap-2">
            <ScanSearch className="h-4 w-4 shrink-0 text-[#5A50FF]" />
            <span>
              Tous les justificatifs
              <span className="block text-xs text-muted-foreground">
                Documents distincts additionnés, devise convertie
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Un seul justificatif
          </DropdownMenuLabel>
          {files.map((file, idx) => (
            <DropdownMenuItem
              key={file.id || idx}
              onClick={() => handleReanalyze(file.id)}
              className="gap-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {file.originalFilename || `Justificatif ${idx + 1}`}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const applyOcrPatch = async (patch, { unlinkFirst = false } = {}) => {
    if (!invoice?.id || Object.keys(patch).length === 0) return;
    setApplyingOcr(true);
    try {
      // Montant TTC d'une facture rapprochée : l'API exige de délier d'abord
      if (unlinkFirst) {
        const unlinked = await unreconcileInvoice(invoice.id);
        if (!unlinked) return;
      }
      // Formulaire : valeurs en chaînes, TVA/taux recalculés si besoin.
      const nextForm = { ...form };
      for (const [key, value] of Object.entries(patch)) {
        nextForm[key] =
          value === null || value === undefined ? "" : String(value);
      }
      const ht = parseFloat(nextForm.amountHT);
      const ttc = parseFloat(nextForm.amountTTC);
      if (!("amountTVA" in patch) && !isNaN(ht) && !isNaN(ttc) && ttc >= ht) {
        nextForm.amountTVA = (Math.round((ttc - ht) * 100) / 100).toString();
      }
      const tva = parseFloat(nextForm.amountTVA);
      if (!("vatRate" in patch) && !isNaN(ht) && ht > 0 && !isNaN(tva)) {
        nextForm.vatRate = (Math.round((tva / ht) * 10000) / 100).toString();
      }
      // API : mêmes champs que handleSave, category = sous-catégorie.
      const input = {};
      if ("supplierName" in patch && patch.supplierName)
        input.supplierName = patch.supplierName;
      if ("invoiceNumber" in patch) input.invoiceNumber = patch.invoiceNumber;
      if ("issueDate" in patch && patch.issueDate)
        input.issueDate = patch.issueDate;
      if ("dueDate" in patch) input.dueDate = patch.dueDate;
      if ("category" in patch && patch.category)
        input.subcategory = patch.category;
      if ("paymentMethod" in patch && patch.paymentMethod)
        input.paymentMethod = patch.paymentMethod;
      for (const key of ["amountHT", "amountTVA", "vatRate", "amountTTC"]) {
        const v = parseFloat(nextForm[key]);
        if (!isNaN(v)) input[key] = v;
      }
      const saved = await updateInvoice(invoice.id, input);
      if (!saved) return;
      setForm(nextForm);
      setOcrProposal(null);
      setOcrMulti(null);
      onSaved?.();
    } finally {
      setApplyingOcr(false);
    }
  };

  useEffect(() => {
    if (!showTransactionPicker || !invoice?.id) return;
    let cancelled = false;
    setLoadingTransactions(true);
    fetchTransactionsForPurchaseInvoice(invoice.id, debouncedTransactionSearch)
      .then((transactions) => {
        if (!cancelled) setAvailableTransactions(transactions);
      })
      .catch(() => {
        if (!cancelled) setAvailableTransactions([]);
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
    fetchTransactionsForPurchaseInvoice,
  ]);

  useEffect(() => {
    if (!open) {
      setShowTransactionPicker(false);
      setTransactionSearch("");
      setAvailableTransactions([]);
      setDuplicateWarning(null);
      setReconcileCandidate(null);
    }
  }, [open]);
  const { acknowledge, loading: ackLoading } =
    useAcknowledgePurchaseInvoiceEInvoice();
  const { refuse, loading: refuseLoading } = useRefusePurchaseInvoiceEInvoice();
  const { submitEvent, loading: eventLoading } =
    useSubmitPurchaseInvoiceEInvoiceEvent();

  // Actions cycle de vie e-facture reçue (visible si liée à SuperPDP et reçue)
  const canActOnEInvoice =
    !isCreate &&
    invoice?.superPdpInvoiceId &&
    invoice?.eInvoiceStatus === "RECEIVED";

  const eInvoiceActionLoading = ackLoading || refuseLoading || eventLoading;

  const handleAcceptEInvoice = async () => {
    if (!invoice?.id) return;
    await acknowledge(invoice.id);
  };

  const handleRefuseEInvoice = async () => {
    if (!invoice?.id) return;
    const reason = window.prompt("Motif du refus (optionnel) :") || undefined;
    await refuse(invoice.id, reason);
  };

  const handleAcknowledgeReceipt = async () => {
    if (!invoice?.id) return;
    await submitEvent(invoice.id, "fr:204");
  };

  const handleDisputeEInvoice = async () => {
    if (!invoice?.id) return;
    const reason = window.prompt("Motif du litige (optionnel) :") || undefined;
    await submitEvent(invoice.id, "fr:207", reason);
  };
  const { suggestions } = useReconciliationSuggestions(
    !isCreate && invoice?.id && invoice?.status !== "PAID" ? invoice.id : null,
  );

  useEffect(() => {
    if (invoice && !isCreate) {
      const parseDate = (val) => {
        if (!val) return "";
        const d = new Date(val);
        return isNaN(d.getTime()) ? "" : formatLocalDate(d);
      };
      setForm({
        supplierName: invoice.supplierName || "",
        invoiceNumber: invoice.invoiceNumber || "",
        issueDate: parseDate(invoice.issueDate),
        dueDate: parseDate(invoice.dueDate),
        amountHT: invoice.amountHT?.toString() || "",
        amountTVA: invoice.amountTVA?.toString() || "",
        vatRate: invoice.vatRate?.toString() || "20",
        amountTTC: invoice.amountTTC?.toString() || "",
        currency: invoice.currency || "EUR",
        status: invoice.status || "TO_PROCESS",
        category: invoice.subcategory || invoice.category || "OTHER",
        notes: invoice.notes || "",
        internalReference: invoice.internalReference || "",
        paymentMethod: invoice.paymentMethod || "",
        paymentDate: parseDate(invoice.paymentDate),
      });
      setIsEditMode(false);
      setAmountSource("ht");
    } else if (isCreate) {
      setForm({
        supplierName: "",
        invoiceNumber: "",
        issueDate: formatLocalDate(),
        dueDate: "",
        amountHT: "",
        amountTVA: "",
        vatRate: "20",
        amountTTC: "",
        currency: "EUR",
        status: "TO_PROCESS",
        category: "OTHER",
        notes: "",
        internalReference: "",
        paymentMethod: "",
        paymentDate: "",
      });
      setIsEditMode(true);
      setAmountSource("ht");
      setPendingFiles([]);
    }
  }, [invoice, isCreate, open]);

  const handleChange = (field, value) => {
    if (field === "amountHT") setAmountSource("ht");
    if (field === "amountTTC") setAmountSource("ttc");

    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "issueDate" && value) {
        const issue = new Date(value + "T00:00:00");
        if (next.dueDate && new Date(next.dueDate + "T00:00:00") < issue) {
          next.dueDate = "";
        }
        if (
          next.paymentDate &&
          new Date(next.paymentDate + "T00:00:00") < issue
        ) {
          next.paymentDate = "";
        }
      }

      // Quand on passe le statut à "Payée", on aligne la date de paiement sur
      // aujourd'hui — sinon une ancienne date résiduelle (OCR, statut PAID puis
      // dépayé puis re-PAID) garde la facture hors du compteur "Payé ce mois".
      // L'utilisateur reste libre de modifier la date après coup.
      if (field === "status" && value === "PAID" && prev.status !== "PAID") {
        next.paymentDate = formatLocalDate();
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

  const handleSave = async ({ skipDuplicateCheck = false } = {}) => {
    if (!form.supplierName || !form.amountTTC) return;
    const data = {
      supplierName: form.supplierName,
      invoiceNumber: form.invoiceNumber || undefined,
      issueDate: form.issueDate || new Date().toLocaleDateString("sv-SE"),
      dueDate: form.dueDate || undefined,
      amountHT: parseFloat(form.amountHT) || 0,
      amountTVA: parseFloat(form.amountTVA) || 0,
      vatRate: parseFloat(form.vatRate) || 20,
      amountTTC: parseFloat(form.amountTTC),
      currency: form.currency,
      status: form.status,
      // Sous-catégorie fine (référentiel Transactions) ou code large hérité ;
      // la catégorie large de la facture est dérivée côté API.
      subcategory: form.category || undefined,
      notes: form.notes || undefined,
      internalReference: form.internalReference || undefined,
      paymentMethod: form.paymentMethod || undefined,
      // « Créer quand même » : l'API refuse sinon toute création qui
      // ressemble à une facture existante (filet anti-doublon serveur).
      ...(isCreate && skipDuplicateCheck ? { forceCreate: true } : {}),
    };
    // Avertissement : une facture identique existe peut-être déjà (OCR
    // depuis une transaction, import Qonto ou Gmail, saisie précédente).
    if (isCreate && !skipDuplicateCheck) {
      const duplicates = await checkDuplicates({
        supplierName: data.supplierName,
        invoiceNumber: data.invoiceNumber,
        amountTTC: data.amountTTC,
        issueDate: data.issueDate,
      });
      if (duplicates.length > 0) {
        setDuplicateWarning({ duplicates });
        return;
      }
    }
    try {
      // Les hooks fournissent onError à useMutation : en cas d'échec la
      // promesse se résout avec un résultat vide au lieu de throw.
      let saved;
      if (isCreate) {
        saved = await createInvoice({
          ...data,
          paymentDate: form.paymentDate || undefined,
        });
      } else {
        saved = await updateInvoice(invoice.id, {
          ...data,
          paymentDate: form.paymentDate || null,
        });
      }
      if (!saved) return;
      // Justificatif ajouté à la création : uploadé une fois la facture créée
      // (addFile gère l'upload du fichier brut, sans OCR).
      if (isCreate && pendingFiles.length > 0 && saved.id) {
        for (const file of pendingFiles) {
          try {
            await addFile(saved.id, { file, processOCR: false });
          } catch (err) {
            console.error("Erreur upload justificatif (création):", err);
          }
        }
      }
      // Paiement déjà passé en banque : proposer la transaction trouvée,
      // rien n'est lié sans confirmation.
      if (isCreate && saved.id) {
        const found = await fetchReconcileCandidate(saved.id);
        if (found) {
          setReconcileCandidate({
            invoiceId: saved.id,
            label: [data.supplierName, data.invoiceNumber]
              .filter(Boolean)
              .join(" "),
            transaction: found,
          });
          return;
        }
      }
      onSaved?.();
    } catch {
      // Error toast is handled by the hook's onError callback
    }
  };

  const handleDelete = async () => {
    if (!invoice?.id) return;
    const result = await deleteInvoice(invoice.id);
    if (result?.success) {
      onDeleted?.();
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice?.id) return;
    const paymentDateIso = form.paymentDate
      ? new Date(form.paymentDate + "T00:00:00").toISOString()
      : new Date().toISOString();
    const marked = await markAsPaid(
      invoice.id,
      paymentDateIso,
      form.paymentMethod || undefined,
    );
    if (!marked) return;
    onSaved?.();
  };

  // origin : geste à l'origine du lien (DOCUMENT = sélecteur de cette fiche,
  // suggestion confirmée depuis la fiche = DOCUMENT aussi : l'étiquette
  // « rapproché depuis… » indique le côté, pas le mode de découverte).
  const handleReconcile = async (transactionId, origin = "DOCUMENT") => {
    if (!invoice?.id) return;
    // Le hook retourne undefined en cas d'erreur (toast déjà affiché) :
    // ne pas fermer/rafraîchir comme si le rapprochement avait réussi.
    const result = await reconcile(invoice.id, [transactionId], origin);
    if (!result) return;
    setShowTransactionPicker(false);
    setTransactionSearch("");
    onSaved?.();
  };

  // Déliaison d'UNE transaction : la facture reste payée tant qu'il en reste
  // au moins une (relevé mensuel couvrant plusieurs prélèvements).
  const handleUnlinkTransaction = async (transactionId) => {
    if (!invoice?.id || !transactionId) return;
    setUnlinkingTransactionId(transactionId);
    try {
      const result = await unlinkTransaction(invoice.id, transactionId);
      if (result) {
        toast.success("Transaction détachée");
        onSaved?.();
      }
    } finally {
      setUnlinkingTransactionId(null);
    }
  };

  const linkedTransactionIds = invoice?.linkedTransactionIds || [];

  const saving = createLoading || updateLoading;

  // Justificatif libellé dans une autre devise que la facture (ex. USD converti
  // en EUR par la banque) : on rappelle le montant d'origine à titre indicatif.
  const receiptCurrencyDiffers = Boolean(
    invoice?.ocrMetadata?.amountTTC &&
    invoice?.ocrMetadata?.currency &&
    normalizeCurrencyCode(invoice.ocrMetadata.currency) !==
      normalizeCurrencyCode(invoice?.currency),
  );

  const handleClose = () => {
    onOpenChange(false);
  };

  const header = (
    <DrawerHeader className="flex flex-row items-center justify-between gap-3 px-6 py-4 border-b space-y-0">
      <div className="flex items-center gap-2 min-w-0">
        <DrawerTitle className="text-base font-medium truncate">
          {isCreate
            ? "Nouvelle facture d'achat"
            : isEditMode
              ? "Modifier la facture"
              : "Détail de la facture"}
        </DrawerTitle>
        {!isCreate && invoice?.status && (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${STATUS_BADGE[invoice.status] || STATUS_BADGE.TO_PROCESS}`}
          >
            {statusLabels[invoice.status] || invoice.status}
          </span>
        )}
        {!isCreate && needsReview(invoice) && (
          <span
            className="inline-flex items-center rounded-md bg-amber-100 px-2 py-1 text-xs font-medium whitespace-nowrap text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            title={OCR_REVIEW_TITLE}
          >
            À compléter
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {/* Facture avec justificatif (créée par OCR ou fichier ajouté) :
            relance de l'analyse depuis l'en-tête, comme sur les factures
            importées, visible en lecture comme en modification. */}
        {!isCreate &&
          invoice?.files?.length > 0 &&
          renderReanalyzeTrigger(
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={reanalyzing || saving}
              title="Relancer l'analyse OCR du justificatif"
              aria-label="Relancer l'analyse OCR du justificatif"
            >
              {reanalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanSearch className="h-4 w-4" />
              )}
            </Button>,
          )}
        <DrawerClose asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DrawerClose>
      </div>
    </DrawerHeader>
  );

  const body = (
    <>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Bandeau de relance OCR : dès qu'un justificatif existe, la
              facture est modifiable et les valeurs lues peuvent être fausses.
              Ambre si créée sans analyse IA complète (« À compléter »). */}
          {!isCreate &&
            (invoice?.files?.length > 0 || needsReview(invoice)) &&
            (() => {
              const review = needsReview(invoice);
              const hasFile = invoice?.files?.length > 0;
              return (
                <div
                  className={`flex gap-3 rounded-xl border p-3 ${
                    review
                      ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
                      : "border-border bg-muted/40"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      review
                        ? "bg-amber-100 dark:bg-amber-900/60"
                        : "bg-[#5A50FF]/10"
                    }`}
                  >
                    {review ? (
                      <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                    ) : (
                      <ScanSearch className="h-4 w-4 text-[#5A50FF]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p
                      className={`text-sm font-medium ${
                        review
                          ? "text-amber-900 dark:text-amber-100"
                          : "text-foreground"
                      }`}
                    >
                      {review ? "Champs à vérifier" : "Valeurs lues par OCR"}
                    </p>
                    <p
                      className={`text-xs leading-relaxed ${
                        review
                          ? "text-amber-800 dark:text-amber-200"
                          : "text-muted-foreground"
                      }`}
                    >
                      {!hasFile
                        ? "Le justificatif n'a pas pu être lu : vérifiez le fournisseur, le numéro et les montants."
                        : "Certaines valeurs peuvent être fausses. Relancez l'analyse pour comparer et corriger."}
                    </p>
                    {hasFile && (
                      <div className="pt-1.5">
                        {renderReanalyzeTrigger(
                          <Button
                            type="button"
                            size="sm"
                            variant={review ? "default" : "outline"}
                            className={`h-8 gap-1.5 font-normal text-xs ${
                              review
                                ? "bg-amber-600 text-white hover:bg-amber-700"
                                : ""
                            }`}
                            disabled={reanalyzing || saving}
                          >
                            {reanalyzing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ScanSearch className="h-3.5 w-3.5" />
                            )}
                            {reanalyzing
                              ? "Analyse en cours..."
                              : "Relancer l'analyse"}
                          </Button>,
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          {/* Zone d'upload des justificatifs (création uniquement) */}
          {isCreate && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                Justificatifs
              </p>
              {pendingFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() =>
                      setPendingFiles((prev) =>
                        prev.filter((_, i) => i !== idx),
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 border border-dashed rounded-lg text-muted-foreground hover:bg-muted/40 hover:border-muted-foreground/40 transition-colors cursor-pointer ${
                  pendingFiles.length > 0 ? "p-3" : "flex-col gap-1.5 p-6"
                }`}
              >
                <Upload
                  className={pendingFiles.length > 0 ? "h-4 w-4" : "h-5 w-5"}
                />
                <span className="text-sm">
                  {pendingFiles.length > 0
                    ? "Ajouter un autre justificatif"
                    : "Ajouter un ou plusieurs justificatifs"}
                </span>
                {pendingFiles.length === 0 && (
                  <span className="text-xs text-muted-foreground/70">
                    PDF, JPG, PNG
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  if (list.length)
                    setPendingFiles((prev) => [...prev, ...list]);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {/* Amount Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  {form.supplierName || "Fournisseur"}
                </p>
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={form.amountTTC}
                      onChange={(e) =>
                        handleChange("amountTTC", e.target.value)
                      }
                      className="text-2xl font-medium h-auto py-1 w-32 border-none shadow-none px-0 focus-visible:ring-0"
                      placeholder="0.00"
                    />
                    <span className="text-2xl font-medium text-muted-foreground">
                      {currencySymbol(form.currency)}
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-medium">
                    {formatAmount(invoice?.amountTTC, invoice?.currency)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Fournisseur (view mode) */}
          {!isEditMode && (
            <>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Fournisseur
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {invoice?.supplierName || "Non spécifié"}
                    </p>
                    {invoice?.invoiceNumber && (
                      <p className="text-xs text-muted-foreground truncate">
                        N° {invoice.invoiceNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Informations */}
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              Informations
            </p>

            {isEditMode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-muted-foreground">
                    Fournisseur *
                  </span>
                  <Input
                    value={form.supplierName}
                    onChange={(e) =>
                      handleChange("supplierName", e.target.value)
                    }
                    placeholder="Nom du fournisseur"
                    className="w-40 h-8 text-sm text-right"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-muted-foreground">
                    N° Facture
                  </span>
                  <Input
                    value={form.invoiceNumber}
                    onChange={(e) =>
                      handleChange("invoiceNumber", e.target.value)
                    }
                    placeholder="F-20260001"
                    className="w-40 h-8 text-sm text-right"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground">
                      Date d'émission
                    </span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-40 h-8 justify-start text-left font-normal text-sm",
                          !form.issueDate && "text-muted-foreground",
                        )}
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.issueDate ? (
                          (() => {
                            try {
                              const date = new Date(
                                form.issueDate + "T00:00:00",
                              );
                              if (isNaN(date.getTime()))
                                return <span>Date invalide</span>;
                              return format(date, "dd/MM/yyyy");
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
                          form.issueDate
                            ? new Date(form.issueDate + "T00:00:00")
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            handleChange(
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
                    <span className="text-sm font-normal text-muted-foreground">
                      Date d&apos;échéance
                    </span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-40 h-8 justify-start text-left font-normal text-sm",
                          !form.dueDate && "text-muted-foreground",
                        )}
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.dueDate ? (
                          (() => {
                            try {
                              const date = new Date(form.dueDate + "T00:00:00");
                              if (isNaN(date.getTime()))
                                return <span>Date invalide</span>;
                              return format(date, "dd/MM/yyyy");
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
                          form.dueDate
                            ? new Date(form.dueDate + "T00:00:00")
                            : undefined
                        }
                        disabled={
                          form.issueDate
                            ? {
                                before: new Date(form.issueDate + "T00:00:00"),
                              }
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            handleChange("dueDate", format(date, "yyyy-MM-dd"));
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
                    <span className="text-sm font-normal text-muted-foreground">
                      Référence
                    </span>
                  </div>
                  <Input
                    value={form.internalReference}
                    onChange={(e) =>
                      handleChange("internalReference", e.target.value)
                    }
                    placeholder="Optionnel"
                    className="w-40 h-8 text-sm text-right"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-muted-foreground">
                    N° Facture
                  </span>
                  <span className="text-sm font-normal">
                    {invoice?.invoiceNumber || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground">
                      Date d&apos;émission
                    </span>
                  </div>
                  <span className="text-sm font-normal">
                    {formatDate(invoice?.issueDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground">
                      Date d&apos;échéance
                    </span>
                  </div>
                  <span className="text-sm font-normal">
                    {formatDate(invoice?.dueDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground">
                      Référence
                    </span>
                  </div>
                  <span className="text-sm font-normal">
                    {invoice?.internalReference || "—"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Montants (edit mode) */}
          {isEditMode && (
            <>
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
                      value={form.amountHT}
                      onChange={(e) => handleChange("amountHT", e.target.value)}
                      placeholder="0.00"
                      className="w-40 h-8 text-sm text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-muted-foreground">
                      Taux TVA
                    </span>
                    <VatRateSelect
                      value={form.vatRate}
                      onChange={(v) => handleChange("vatRate", String(v))}
                      className="w-40 h-8 text-sm [&>span:first-child]:min-w-0 [&>span:first-child]:truncate [&>span:first-child]:block"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-muted-foreground">
                      TVA
                    </span>
                    <span className="text-sm font-normal">
                      {formatAmount(form.amountTVA, form.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Montants (view mode) */}
          {!isEditMode && !isCreate && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Montants
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-muted-foreground">
                    HT
                  </span>
                  <span className="text-sm font-normal">
                    {formatAmount(invoice?.amountHT, invoice?.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-muted-foreground">
                    TVA ({invoice?.vatRate || 20}%)
                  </span>
                  <span className="text-sm font-normal">
                    {formatAmount(invoice?.amountTVA, invoice?.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">TTC</span>
                  <span className="text-sm font-medium">
                    {formatAmount(invoice?.amountTTC, invoice?.currency)}
                  </span>
                </div>
                {receiptCurrencyDiffers && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-muted-foreground">
                      Montant sur le justificatif
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {formatAmount(
                        invoice.ocrMetadata.amountTTC,
                        invoice.ocrMetadata.currency,
                      )}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Catégorisation (view mode) */}
          {!isEditMode && !isCreate && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Catégorisation
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal text-muted-foreground">
                      Catégorie
                    </span>
                  </div>
                  <span className="text-sm font-normal">
                    {getCategoryLabel(
                      invoice?.subcategory || invoice?.category,
                    ) || "Autre"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal text-muted-foreground">
                      Statut
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${STATUS_BADGE[invoice?.status] || STATUS_BADGE.TO_PROCESS}`}
                  >
                    {invoice?.status === "PAID" && (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {invoice?.status === "OVERDUE" && (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {statusLabels[invoice?.status] || "À traiter"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal text-muted-foreground">
                      Mode de paiement
                    </span>
                  </div>
                  <span className="text-sm font-normal">
                    {paymentMethodLabels[invoice?.paymentMethod] ||
                      "Non spécifié"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground">
                      Date de paiement
                    </span>
                  </div>
                  <span className="text-sm font-normal">
                    {formatDate(invoice?.paymentDate)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Catégorisation (edit mode) */}
          {isEditMode && (
            <>
              <Separator />
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Catégorisation
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-muted-foreground">
                      Catégorie
                    </span>
                    <CategorySearchSelect
                      value={form.category}
                      onValueChange={(v) => handleChange("category", v)}
                      triggerClassName="w-40 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-muted-foreground">
                      Statut
                    </span>
                    <Select
                      value={form.status}
                      onValueChange={(v) => handleChange("status", v)}
                    >
                      <SelectTrigger className="w-40 h-8 text-sm">
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
                    <span className="text-sm font-normal text-muted-foreground">
                      Mode de paiement
                    </span>
                    <Select
                      value={form.paymentMethod}
                      onValueChange={(v) => handleChange("paymentMethod", v)}
                    >
                      <SelectTrigger className="w-40 h-8 text-sm">
                        <SelectValue placeholder="Sélectionner..." />
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal text-muted-foreground">
                        Date de paiement
                      </span>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-40 h-8 justify-start text-left font-normal text-sm",
                            !form.paymentDate && "text-muted-foreground",
                          )}
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.paymentDate ? (
                            (() => {
                              try {
                                const date = new Date(
                                  form.paymentDate + "T00:00:00",
                                );
                                if (isNaN(date.getTime()))
                                  return <span>Date invalide</span>;
                                return format(date, "dd/MM/yyyy");
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
                            form.paymentDate
                              ? new Date(form.paymentDate + "T00:00:00")
                              : undefined
                          }
                          disabled={
                            form.issueDate
                              ? {
                                  before: new Date(
                                    form.issueDate + "T00:00:00",
                                  ),
                                }
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              handleChange(
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
            </>
          )}

          {/* Justificatifs (facture existante) : liste, ajout, suppression */}
          {!isCreate && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Justificatif{invoice?.files?.length > 1 ? "s" : ""}
                    {invoice?.files?.length > 1
                      ? ` (${invoice.files.length})`
                      : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 font-normal gap-1.5 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFiles}
                      title="Ajouter un ou plusieurs justificatifs"
                    >
                      {uploadingFiles ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Ajouter
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleAddFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    {/* Relance OCR : les valeurs relues sont comparées avant
                        application, rien n'est écrasé sans choix. */}
                    {invoice?.files?.length > 0 &&
                      renderReanalyzeTrigger(
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 font-normal gap-1.5 text-xs"
                          disabled={reanalyzing || saving}
                          title="Relire le justificatif et comparer avec les valeurs actuelles"
                        >
                          {reanalyzing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ScanSearch className="h-3.5 w-3.5" />
                          )}
                          {reanalyzing
                            ? "Analyse en cours..."
                            : "Relancer l'analyse"}
                        </Button>,
                      )}
                  </div>
                </div>
                {!invoice?.files?.length && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFiles}
                    className="w-full flex flex-col items-center justify-center gap-1.5 p-6 border border-dashed rounded-lg text-muted-foreground hover:bg-muted/40 hover:border-muted-foreground/40 transition-colors cursor-pointer"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">
                      Aucun justificatif : en ajouter
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      PDF, JPG, PNG, plusieurs fichiers possibles
                    </span>
                  </button>
                )}
                {(invoice?.files || []).map((file, fileIndex) => {
                  const isImage = file.mimetype?.startsWith("image/");
                  const isPdf =
                    file.mimetype === "application/pdf" ||
                    file.originalFilename?.endsWith(".pdf");
                  const isShown = previewIndex === fileIndex;
                  return (
                    <div
                      key={file.id}
                      className={`relative group cursor-pointer rounded-xl border overflow-hidden hover:shadow-sm transition-all ${
                        isShown
                          ? "border-[#5A50FF] ring-1 ring-[#5A50FF]/40"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                      onClick={() => togglePreview(fileIndex)}
                      title={isShown ? "Masquer l'aperçu" : "Voir à gauche"}
                    >
                      <div className="w-full h-52 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                        {isImage && file.url ? (
                          <img
                            src={file.url}
                            alt={file.originalFilename}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.querySelector(
                                ".preview-fallback",
                              ).style.display = "flex";
                            }}
                          />
                        ) : null}
                        {isPdf && file.url ? (
                          // URL publique R2 interdite par la CSP : miniature
                          // via le proxy same-origin /api/document-preview.
                          <div className="w-full h-full overflow-hidden pointer-events-none bg-white">
                            <PdfPreview
                              src={`/api/document-preview/purchaseInvoice/${invoice.id}?fileId=${file.id}`}
                              firstPageOnly
                              fallback={
                                <div className="w-full h-full flex items-center justify-center">
                                  <FileText className="h-10 w-10 text-red-400" />
                                </div>
                              }
                            />
                          </div>
                        ) : null}
                        <div
                          className={`preview-fallback items-center justify-center ${isImage || isPdf ? "hidden" : "flex"}`}
                        >
                          <FileText className="h-10 w-10 text-red-400" />
                        </div>
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
                            <FileText className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-normal truncate text-foreground">
                            {file.originalFilename}
                          </p>
                          {file.size && (
                            <p className="text-[10px] text-muted-foreground">
                              {(file.size / 1024).toFixed(0)} Ko
                            </p>
                          )}
                        </div>
                        <DocumentEyeButton
                          active={isShown}
                          onClick={() => togglePreview(fileIndex)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground"
                          title="Relancer l'analyse OCR sur ce justificatif"
                          disabled={reanalyzing || saving}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReanalyze(file.id);
                          }}
                        >
                          {reanalyzing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ScanSearch className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground"
                          title="Ouvrir dans un nouvel onglet"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(file.url, "_blank");
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          title="Retirer ce justificatif"
                          disabled={removingFileId === file.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                "Retirer ce justificatif de la facture ?",
                              )
                            ) {
                              handleRemoveFile(file.id);
                            }
                          }}
                        >
                          {removingFileId === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Rapprochement bancaire : transactions liées (déliaison unitaire),
              suggestions automatiques et recherche manuelle. N↔N : une
              facture d'achat peut couvrir plusieurs prélèvements (relevé
              mensuel Qonto) et une transaction porter plusieurs factures. */}
          {!isCreate && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                      Rapprochement bancaire
                    </p>
                  </div>
                  {linkedTransactionIds.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-[#5A50FF]/10 text-[#5A50FF] dark:bg-[#5A50FF]/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Rapprochée avec {linkedTransactionIds.length} transaction
                      {linkedTransactionIds.length > 1 ? "s" : ""}
                    </span>
                  ) : suggestions?.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3" />
                      Suggestions
                    </span>
                  ) : null}
                </div>

                {linkedTransactionIds.length > 0 && (
                  <div className="space-y-2">
                    {linkedTransactionIds.map((txId) => (
                      <LinkedTransactionLink
                        key={txId}
                        transactionId={txId}
                        purchaseInvoiceId={invoice?.id}
                        action={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            disabled={unlinkLoading}
                            onClick={() => handleUnlinkTransaction(txId)}
                            title="Détacher cette transaction"
                          >
                            {unlinkingTransactionId === txId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Unlink className="h-4 w-4" />
                            )}
                          </Button>
                        }
                      />
                    ))}
                  </div>
                )}

                {suggestions?.length > 0 && !showTransactionPicker && (
                  <div className="space-y-2">
                    {linkedTransactionIds.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Autres transactions correspondantes
                      </p>
                    )}
                    {suggestions.map((s) => (
                      <div
                        key={s.transactionId}
                        className="p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">
                              {formatAmount(s.amount, s.currency)}
                            </span>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {s.description && <span>{s.description}</span>}
                              <span>{formatDate(s.date)}</span>
                              <span>
                                Confiance: {Math.round(s.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            disabled={reconcileLoading}
                            onClick={() =>
                              handleReconcile(s.transactionId, "DOCUMENT")
                            }
                          >
                            <LinkIcon className="h-3.5 w-3.5 mr-1" />
                            Rapprocher
                          </Button>
                        </div>
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
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    {linkedTransactionIds.length > 0
                      ? "Rattacher une autre transaction"
                      : "Rechercher une transaction"}
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
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : availableTransactions.length > 0 ? (
                      <div className="max-h-[240px] overflow-y-auto space-y-2">
                        {availableTransactions.map((tx) => {
                          const alreadyMatched =
                            String(
                              tx.reconciliationStatus || "",
                            ).toLowerCase() === "matched";
                          return (
                            <div
                              key={tx.id}
                              className={cn(
                                "p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors",
                                tx.score >= 80 &&
                                  "border-[#5a50ff]/30 bg-[#5a50ff]/5",
                              )}
                              onClick={() =>
                                !reconcileLoading && handleReconcile(tx.id)
                              }
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {formatAmount(
                                      Math.abs(tx.amount),
                                      tx.currency,
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {tx.description || "Transaction"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(tx.date)}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  {tx.score >= 80 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#5a50ff]/10 text-[#5a50ff] border border-[#5a50ff]/30">
                                      Correspondance
                                    </span>
                                  )}
                                  {alreadyMatched && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                      Déjà rapprochée
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-xs text-muted-foreground">
                        {transactionSearch.trim()
                          ? "Aucune transaction ne correspond à cette recherche."
                          : "Aucune transaction ne ressemble à cette facture. Saisissez un libellé ou un montant pour chercher parmi toutes les transactions."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          {isEditMode ? (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Notes
                </p>
                <Textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Commentaires internes..."
                  rows={3}
                />
              </div>
            </>
          ) : (
            !isCreate && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Notes
                  </p>
                  <p className="text-sm font-normal text-foreground">
                    {invoice?.notes || "—"}
                  </p>
                </div>
              </>
            )
          )}

          {/* Timestamps */}
          {!isCreate && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-normal text-muted-foreground">
                    Créée le
                  </span>
                  <span className="text-xs font-normal">
                    {formatDate(invoice?.createdAt, true)}
                  </span>
                </div>
                {invoice?.updatedAt &&
                  invoice.updatedAt !== invoice.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-normal text-muted-foreground">
                        Modifiée le
                      </span>
                      <span className="text-xs font-normal">
                        {formatDate(invoice.updatedAt, true)}
                      </span>
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <DrawerFooter className="border-t px-6 py-4">
        {!isCreate && invoice?.eInvoicePaymentReportStatus === "ERROR" && (
          <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400">
            Paiement non signalé à la plateforme (SuperPDP) — relance
            automatique en cours.
          </div>
        )}
        {canActOnEInvoice && (
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-normal text-green-700 hover:bg-green-50"
                onClick={handleAcceptEInvoice}
                disabled={eInvoiceActionLoading}
              >
                {ackLoading ? "..." : "Approuver l'e-facture"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 font-normal text-red-600 hover:bg-red-50"
                onClick={handleRefuseEInvoice}
                disabled={eInvoiceActionLoading}
              >
                {refuseLoading ? "..." : "Refuser"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-normal"
                onClick={handleAcknowledgeReceipt}
                disabled={eInvoiceActionLoading}
              >
                {eventLoading ? "..." : "Accuser réception"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 font-normal text-amber-700 hover:bg-amber-50"
                onClick={handleDisputeEInvoice}
                disabled={eInvoiceActionLoading}
              >
                {eventLoading ? "..." : "Signaler un litige"}
              </Button>
            </div>
          </div>
        )}
        {isCreate ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 font-normal"
              onClick={handleClose}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              className="flex-1 font-normal"
              onClick={() => handleSave()}
              disabled={saving || !form.supplierName || !form.amountTTC}
            >
              <Plus className="h-4 w-4 mr-2" />
              {saving ? "Création..." : "Nouvelle facture d'achat"}
            </Button>
          </div>
        ) : isEditMode ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 font-normal"
              onClick={() => setIsEditMode(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 font-normal bg-primary hover:bg-primary/90"
              onClick={() => handleSave()}
              disabled={saving || !form.supplierName || !form.amountTTC}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 font-normal"
              onClick={() => setIsEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            {invoice?.status !== "PAID" && (
              <Button
                variant="primary"
                className="flex-1 font-normal"
                onClick={handleMarkAsPaid}
                disabled={markLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Payée
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DrawerFooter>
    </>
  );

  const duplicateDialog = (
    <DuplicateWarningDialog
      open={!!duplicateWarning}
      duplicates={duplicateWarning?.duplicates || []}
      onCancel={() => setDuplicateWarning(null)}
      onConfirm={() => {
        setDuplicateWarning(null);
        handleSave({ skipDuplicateCheck: true });
      }}
      onUseExisting={
        onOpenExisting
          ? (duplicate) => {
              setDuplicateWarning(null);
              onOpenExisting(duplicate.id);
            }
          : undefined
      }
    />
  );

  const reconcileCandidateDialog = (
    <ReconcileCandidateDialog
      open={!!reconcileCandidate}
      transaction={reconcileCandidate?.transaction}
      invoiceLabel={reconcileCandidate?.label}
      loading={confirmingCandidate}
      onCancel={() => {
        if (confirmingCandidate) return;
        setReconcileCandidate(null);
        onSaved?.();
      }}
      onConfirm={async () => {
        if (!reconcileCandidate) return;
        setConfirmingCandidate(true);
        try {
          // Le hook retourne undefined en cas d'erreur (toast déjà affiché) :
          // la facture est créée quand même, on ferme sans bloquer.
          await reconcile(
            reconcileCandidate.invoiceId,
            [reconcileCandidate.transaction.id],
            "DOCUMENT",
          );
        } finally {
          setConfirmingCandidate(false);
          setReconcileCandidate(null);
          onSaved?.();
        }
      }}
    />
  );

  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        {body}
        {duplicateDialog}
        {reconcileCandidateDialog}
      </div>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="w-full h-full md:w-[500px] md:max-w-[500px] md:min-w-[500px] md:h-auto"
        style={{ width: "100vw", height: "100vh" }}
        // Un clic dans le volet d'aperçu (portail hors du tiroir) ne doit pas
        // fermer le tiroir.
        onPointerDownOutside={(e) => {
          if (isDocumentPreviewTarget(e.detail?.originalEvent?.target))
            e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isDocumentPreviewTarget(e.detail?.originalEvent?.target))
            e.preventDefault();
        }}
      >
        {header}
        {body}
        {duplicateDialog}
        {reconcileCandidateDialog}
        <DocumentPreviewPanel
          items={previewIndex === null ? [] : previewItems}
          index={previewIndex ?? 0}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
        {/* Comparaison valeurs actuelles / nouvelle analyse OCR */}
        <PurchaseOcrComparisonDialog
          open={!!ocrProposal}
          onOpenChange={(o) => {
            if (!o && !applyingOcr) {
              setOcrProposal(null);
              setOcrMulti(null);
            }
          }}
          current={form}
          proposal={ocrProposal}
          multi={ocrMulti}
          invoiceId={invoice?.id}
          files={invoice?.files || []}
          sourceFileId={ocrSourceFileId}
          currency={form.currency}
          paymentMethodLabels={paymentMethodLabels}
          onApply={applyOcrPatch}
          reconciled={!!invoice?.isReconciled}
          onUnlinkAndApply={(patch) =>
            applyOcrPatch(patch, { unlinkFirst: true })
          }
          applying={applyingOcr}
        />
      </DrawerContent>
    </Drawer>
  );
}
