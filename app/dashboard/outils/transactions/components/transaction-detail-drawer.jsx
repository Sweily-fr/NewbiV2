"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation } from "@apollo/client";
import { parseDate } from "@internationalized/date";
import {
  Button as RACButton,
  DatePicker,
  Dialog,
  Group,
} from "react-aria-components";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { LinkOriginTag } from "@/src/components/reconciliation/LinkOriginTag";
import { Popover as RACPopover } from "react-aria-components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Calendar as CalendarIcon,
  CreditCard,
  Banknote,
  Building2,
  Landmark,
  FileText,
  // Note : pour les icônes Source / paiements (CARD, TRANSFER, CHECK) on
  // utilise des SVG Vuesax custom importés depuis @/src/components/icons
  // (voir BankIcon / CardIcon / RoutingIcon / NoteIcon ci-dessous).
  Edit,
  Eye,
  Trash2,
  X,
  User,
  Receipt,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Link2,
  Unlink,
  ExternalLink,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BankIcon as BankVuesax,
  BankCardIcon as CardVuesax,
  NotepadIcon as NoteVuesax,
  RoutingIcon as RoutingVuesax,
  ReceiptItemIcon as ReceiptVuesax,
  DownloadIcon as DownloadVuesax,
  Save2Icon as SaveVuesax,
} from "@/src/components/icons";
import {
  formatDateToFrench,
  formatDateTimeToFrench,
  formatLocalDate,
} from "@/src/utils/dateFormatter";
import { findMerchant } from "@/lib/merchants-config";
import { getCategoryConfig } from "@/lib/category-icons-config";
import { toast } from "@/src/components/ui/sonner";
import { formatInvoiceReference } from "@/src/utils/invoiceUtils";
import {
  UPDATE_TRANSACTION,
  REMOVE_TRANSACTION_RECEIPT_FILE,
} from "@/src/graphql/queries/banking";
import { Calendar } from "@/src/components/ui/calendar-rac";
import { DateInput } from "@/src/components/ui/datefield-rac";
import CategorySearchSelect from "@/src/components/category-search-select";
import {
  useUnlinkTransactionFromInvoice,
  useReconciliationGraphQL,
} from "@/src/hooks/useReconciliationGraphQL";
import {
  useReconcilePurchaseInvoice,
  useUnlinkPurchaseInvoiceFromTransaction,
  usePurchaseInvoiceReconciliationPicker,
} from "@/src/hooks/usePurchaseInvoices";
import { useRouter } from "next/navigation";
import { PreviewImage } from "@/src/components/ui/preview-image";
import {
  findCarryingPurchaseInvoice,
  getStandaloneReceipts,
} from "./transactions/utils/receiptFiles";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

const paymentMethodIcons = {
  CARD: CardVuesax,
  CREDIT_CARD: CardVuesax,
  CASH: Banknote,
  TRANSFER: RoutingVuesax,
  CHECK: NoteVuesax,
};

const paymentMethodLabels = {
  CARD: "Paiement par carte",
  CREDIT_CARD: "Paiement par carte",
  CASH: "Paiement en espèces",
  TRANSFER: "Virement bancaire",
  BANK_TRANSFER: "Virement bancaire",
  CHECK: "Paiement par chèque",
  DIRECT_DEBIT: "Prélèvement",
  SEPA_DEBIT: "Prélèvement SEPA",
  PRELEVEMENT: "Prélèvement",
};

// Labels pour le titre du drawer
const transactionTypeLabels = {
  CARD: "Paiement par carte",
  CREDIT_CARD: "Paiement par carte",
  CASH: "Paiement en espèces",
  TRANSFER: "Virement",
  BANK_TRANSFER: "Virement",
  CHECK: "Chèque",
  DIRECT_DEBIT: "Prélèvement",
  SEPA_DEBIT: "Prélèvement SEPA",
  PRELEVEMENT: "Prélèvement",
};

const statusLabels = {
  PAID: "Payée",
  COMPLETED: "Encaissée",
  PENDING: "En attente",
  DRAFT: "Brouillon",
  CANCELLED: "Annulée",
  FAILED: "Échouée",
  REFUNDED: "Remboursée",
};

// Bouton « œil » commun à toutes les lignes de la sidebar : affiche le
// document dans le volet de gauche (violet quand il y est déjà). Sans
// fichier disponible, l'œil reste visible mais désactivé.
const EyeButton = ({ active, onClick, disabled, label }) =>
  disabled ? (
    // Un bouton désactivé ne reçoit pas la souris : l'infobulle est portée
    // par un conteneur autour.
    <span
      className="inline-flex shrink-0"
      title="Aucun fichier à afficher"
      aria-label="Aucun fichier à afficher"
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground pointer-events-none"
        disabled
        tabIndex={-1}
      >
        <Eye className="h-4 w-4" />
      </Button>
    </span>
  ) : (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${active ? "text-[#5A50FF]" : "text-muted-foreground"}`}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={
        disabled
          ? "Aucun fichier à afficher"
          : active
            ? "Masquer l'aperçu"
            : label || "Voir à gauche"
      }
    >
      <Eye className="h-4 w-4" />
    </Button>
  );

export function TransactionDetailDrawer({
  transaction,
  open,
  onOpenChange,
  onEdit,
  onAttachReceipt,
  isAnalyzingReceipt = false,
  onRefresh,
  onSubmit,
  isCreating = false,
}) {
  const router = useRouter();
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const { workspaceId } = useRequiredWorkspace();
  const readOnlyTooltip = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : undefined;
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // Fichiers en attente d'upload (mode création) — array de { file, previewUrl }
  const [pendingFiles, setPendingFiles] = useState([]);
  // Volet d'aperçu à gauche. Fermé à l'ouverture du tiroir : il ne s'ouvre que
  // sur un clic explicite (justificatif de la liste, bouton « Voir » d'une
  // facture liée). { source: "receipts", index } pour les justificatifs de la
  // transaction, { source: "linked", key, items, index } pour les fichiers
  // d'une facture d'achat ou d'une facture client importée liée.
  const [preview, setPreview] = useState(null);
  // Id de la facture d'achat en cours de détachement (liste N↔N)
  const [unlinkingPurchaseInvoiceId, setUnlinkingPurchaseInvoiceId] =
    useState(null);
  const [calendarContainer, setCalendarContainer] = useState(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const prevOpenRef = useRef(false);
  const fileInputRef = useRef(null);

  // Détecter mobile pour la sidebar
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fermer avec Escape + lock scroll body
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onOpenChange]);

  // Reset mobile details quand on ferme
  useEffect(() => {
    if (!open) setShowMobileDetails(false);
  }, [open]);

  // Le volet d'aperçu ne survit ni à la fermeture ni au changement de
  // transaction : chaque ouverture repart sur les seuls détails.
  useEffect(() => {
    setPreview(null);
  }, [open, transaction?.id]);

  // Hook pour délier une transaction d'une facture
  const { unlinkTransaction } = useUnlinkTransactionFromInvoice();
  // Factures d'achat : rattachement (additif) et détachement unitaire
  const { reconcile: reconcilePurchaseInvoice, loading: isLinkingPI } =
    useReconcilePurchaseInvoice();
  const { unlink: unlinkPurchaseInvoice } =
    useUnlinkPurchaseInvoiceFromTransaction();
  const { fetchPurchaseInvoicesForTransaction } =
    usePurchaseInvoiceReconciliationPicker();

  // Suggestions de rapprochement : on affiche la/les facture(s) rapprochable(s)
  // pour cette transaction (au lieu d'un statut "ignoré"/"suggéré").
  const {
    suggestions: reconciliationSuggestions,
    linkTransaction,
    isLinking,
    unignoreTransaction,
    isUnignoring,
    fetchInvoicesForTransaction,
    fetchImportedInvoicesForTransaction,
    linkImportedInvoice,
    unlinkImportedInvoice,
    isLinkingImported,
  } = useReconciliationGraphQL();
  const matchingInvoices =
    reconciliationSuggestions?.find(
      (s) => s.transaction?.id === transaction?.id,
    )?.matchingInvoices || [];

  // Rattachement manuel : sélecteur de factures PENDING avec recherche serveur,
  // pour les entrées d'argent sans suggestion automatique.
  const [showInvoicePicker, setShowInvoicePicker] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const debouncedInvoiceSearch = useDebouncedValue(invoiceSearch, 300);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    if (!showInvoicePicker || !transaction?.id) return;
    let cancelled = false;
    setLoadingInvoices(true);
    // Factures Newbi et factures clients importées dans un même sélecteur,
    // triées par score (kind distingue la mutation à appeler).
    Promise.all([
      fetchInvoicesForTransaction(transaction.id, debouncedInvoiceSearch),
      fetchImportedInvoicesForTransaction(
        transaction.id,
        debouncedInvoiceSearch,
      ),
    ])
      .then(([{ invoices }, importedInvoices]) => {
        if (cancelled) return;
        const merged = [
          ...invoices.map((inv) => ({ ...inv, kind: "newbi" })),
          ...importedInvoices.map((inv) => ({ ...inv, kind: "imported" })),
        ].sort((a, b) => (b.score || 0) - (a.score || 0));
        setAvailableInvoices(merged);
      })
      .finally(() => {
        if (!cancelled) setLoadingInvoices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    showInvoicePicker,
    debouncedInvoiceSearch,
    transaction?.id,
    fetchInvoicesForTransaction,
    fetchImportedInvoicesForTransaction,
  ]);

  // Rattachement manuel côté dépense : sélecteur de factures d'achat
  // existantes (évite de re-déposer un justificatif qui recréerait une
  // facture ; une facture Qonto mensuelle couvre plusieurs prélèvements).
  const [showPurchaseInvoicePicker, setShowPurchaseInvoicePicker] =
    useState(false);
  const [purchaseInvoiceSearch, setPurchaseInvoiceSearch] = useState("");
  const debouncedPurchaseInvoiceSearch = useDebouncedValue(
    purchaseInvoiceSearch,
    300,
  );
  const [availablePurchaseInvoices, setAvailablePurchaseInvoices] = useState(
    [],
  );
  const [loadingPurchaseInvoices, setLoadingPurchaseInvoices] = useState(false);

  useEffect(() => {
    if (!showPurchaseInvoicePicker || !transaction?.id) return;
    let cancelled = false;
    setLoadingPurchaseInvoices(true);
    fetchPurchaseInvoicesForTransaction(
      transaction.id,
      debouncedPurchaseInvoiceSearch,
    )
      .then((invoices) => {
        if (!cancelled) setAvailablePurchaseInvoices(invoices);
      })
      .catch(() => {
        if (!cancelled) setAvailablePurchaseInvoices([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPurchaseInvoices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    showPurchaseInvoicePicker,
    debouncedPurchaseInvoiceSearch,
    transaction?.id,
    fetchPurchaseInvoicesForTransaction,
  ]);

  // Reset des sélecteurs à la fermeture du drawer
  useEffect(() => {
    if (!open) {
      setShowInvoicePicker(false);
      setInvoiceSearch("");
      setAvailableInvoices([]);
      setShowPurchaseInvoicePicker(false);
      setPurchaseInvoiceSearch("");
      setAvailablePurchaseInvoices([]);
    }
  }, [open]);

  // Pas d'onRefresh ici : le hook refetch déjà GetTransactionsPage /
  // GetTransactions (agrégats serveur), un refetch de plus serait un doublon.
  // origin : geste à l'origine du lien (TRANSACTION = sélecteur de ce tiroir,
  // suggestion confirmée depuis le tiroir = TRANSACTION aussi : l'étiquette
  // « rapproché depuis… » indique le côté, pas le mode de découverte).
  const handleReconcileInvoice = async (invoiceId, origin = "TRANSACTION") => {
    if (!transaction?.id || !invoiceId) return;
    const result = await linkTransaction(transaction.id, invoiceId, origin);
    if (result?.success) {
      setShowInvoicePicker(false);
      setInvoiceSearch("");
    }
  };

  // Facture client importée (Qonto, OCR, Gmail) : même geste que pour une
  // facture Newbi, mutation dédiée.
  const handleReconcileImportedInvoice = async (
    importedInvoiceId,
    origin = "TRANSACTION",
  ) => {
    if (!transaction?.id || !importedInvoiceId) return;
    const result = await linkImportedInvoice(
      transaction.id,
      importedInvoiceId,
      origin,
    );
    if (result?.success) {
      setShowInvoicePicker(false);
      setInvoiceSearch("");
      onRefresh?.();
    }
  };

  const handlePickInvoice = (invoice) => {
    if (isLinking || isLinkingImported) return;
    if (invoice.kind === "imported") handleReconcileImportedInvoice(invoice.id);
    else handleReconcileInvoice(invoice.id, "TRANSACTION");
  };

  // Rattacher une facture d'achat existante (additif : la facture peut déjà
  // porter d'autres transactions, la transaction d'autres factures).
  const handleReconcilePurchaseInvoice = async (purchaseInvoiceId) => {
    if (!transaction?.id || !purchaseInvoiceId) return;
    const result = await reconcilePurchaseInvoice(
      purchaseInvoiceId,
      [transaction.id],
      "TRANSACTION",
    );
    if (result) {
      setShowPurchaseInvoicePicker(false);
      setPurchaseInvoiceSearch("");
      onRefresh?.();
    }
  };

  // État du formulaire pour création/édition
  const [formData, setFormData] = useState({
    type: "EXPENSE",
    amount: "",
    category: "",
    date: formatLocalDate(),
    description: "",
    paymentMethod: "CARD",
    vendor: "",
    receiptImage: null,
  });

  // Déterminer le mode
  const isCreateMode = isCreating || !transaction;
  const isBankTransaction =
    transaction &&
    (transaction.source === "BANK" ||
      transaction.source === "BANK_TRANSACTION" ||
      transaction.type === "BANK_TRANSACTION");
  const isManualTransaction = transaction && !isBankTransaction;
  // N↔N : la transaction peut porter plusieurs factures de vente (paiement
  // groupé) et plusieurs factures d'achat (plusieurs justificatifs, ou une
  // facture Qonto mensuelle couvrant plusieurs prélèvements). Les factures
  // de vente liées sont listées dans la section Justificatif.
  const linkedImportedInvoices = transaction?.linkedImportedInvoices || [];
  const hasLinkedInvoices =
    (transaction?.linkedInvoices?.length || 0) > 0 ||
    linkedImportedInvoices.length > 0;
  // Titre d'une carte de facture d'achat liée : le nom du justificatif déposé
  // d'abord, la référence lue par l'analyse ensuite. Sans cela la carte, qui
  // n'affiche que des champs de facture, ne permettait plus de reconnaître le
  // fichier qu'on venait de déposer : la référence imprimée sur le document
  // n'a souvent rien à voir avec son nom de fichier.
  const describePurchaseInvoice = (pi) => {
    const receipt = (transaction?.receiptFiles || []).find((r) =>
      findCarryingPurchaseInvoice(r, [pi]),
    );
    const fileName =
      receipt?.originalFilename ||
      receipt?.filename ||
      pi?.files?.[0]?.filename ||
      null;
    const supplier = pi?.supplierName || "Fournisseur";
    return {
      title: fileName || pi?.invoiceNumber || "Facture d'achat",
      // La référence n'est répétée en sous-titre que si le titre est le fichier
      subtitle:
        fileName && pi?.invoiceNumber
          ? `${pi.invoiceNumber} • ${supplier}`
          : supplier,
    };
  };

  // Factures d'achat liées (lien par référence — le justificatif est sur la
  // facture, accessible via ce lien). Triées de la plus récemment rattachée à
  // la plus ancienne : le justificatif qu'on vient de déposer doit arriver en
  // tête. La date vient de reconciliationLinks, qui enregistre le moment du
  // rattachement (et non la date de la facture, qui peut être ancienne).
  const linkedPurchaseInvoices = useMemo(() => {
    const list = transaction?.linkedPurchaseInvoices || [];
    if (list.length < 2) return list;
    const linkedAt = new Map(
      (transaction?.reconciliationLinks || [])
        .filter((l) => l?.documentType === "PURCHASE_INVOICE" && l?.documentId)
        .map((l) => [
          String(l.documentId),
          new Date(l.linkedAt || 0).getTime() || 0,
        ]),
    );
    return [...list].sort(
      (a, b) =>
        (linkedAt.get(String(b?.id)) || 0) - (linkedAt.get(String(a?.id)) || 0),
    );
  }, [transaction?.linkedPurchaseInvoices, transaction?.reconciliationLinks]);
  // Rattachement manuel possible : entrée d'argent. Les transactions
  // manuelles de type EXPENSE (montant positif possible) sont exclues.
  const canPickInvoice =
    transaction?.amount > 0 &&
    (!isManualTransaction || transaction?.type === "INCOME");
  // Rattachement d'une facture d'achat existante : dépenses uniquement.
  const canPickPurchaseInvoice =
    !isCreateMode &&
    (transaction?.amount < 0 ||
      (isManualTransaction && transaction?.type === "EXPENSE"));
  // Transaction exclue du rapprochement par une action "ignorer" : proposer
  // d'annuler ce choix (le statut n'était pas réversible dans l'UI avant).
  const isIgnoredReconciliation =
    isBankTransaction &&
    String(transaction?.reconciliationStatus || "").toUpperCase() === "IGNORED";

  // Pas d'onRefresh ici : le hook refetch déjà GetTransactionsPage /
  // GetTransactions (agrégats serveur), un refetch de plus serait un doublon.
  const handleUnignoreReconciliation = async () => {
    if (!transaction?.id) return;
    await unignoreTransaction(transaction.id);
  };

  // Initialiser le formulaire uniquement quand le drawer s'ouvre (transition false → true)
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;

    if (!justOpened) return;

    if (isCreateMode) {
      // Mode création: réinitialiser le formulaire
      setFormData({
        type: "EXPENSE",
        amount: "",
        category: "",
        date: formatLocalDate(),
        description: "",
        paymentMethod: "CARD",
        vendor: "",
        receiptImage: null,
      });
      setIsEditMode(true);
      setPendingFiles([]);
      setPreview(null);
    } else if (transaction) {
      // Mode visualisation/édition: pré-remplir avec les données
      let formattedDate = formatLocalDate();
      if (transaction.date) {
        if (typeof transaction.date === "object" && transaction.date.$date) {
          formattedDate = formatLocalDate(new Date(transaction.date.$date));
        } else if (typeof transaction.date === "string") {
          if (transaction.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = transaction.date;
          } else {
            const parsedDate = new Date(transaction.date);
            if (!isNaN(parsedDate.getTime())) {
              formattedDate = formatLocalDate(parsedDate);
            }
          }
        }
      }

      // Mapper le paymentMethod de l'API vers le format du formulaire
      const apiPaymentMethodToForm = {
        CREDIT_CARD: "CARD",
        BANK_TRANSFER: "TRANSFER",
        CASH: "CASH",
        CHECK: "CHECK",
        CARD: "CARD",
        TRANSFER: "TRANSFER",
        DIRECT_DEBIT: "DIRECT_DEBIT",
        SEPA_DEBIT: "DIRECT_DEBIT",
      };
      const formPaymentMethod =
        apiPaymentMethodToForm[transaction.paymentMethod] || "CARD";

      // Mapper le type API vers EXPENSE/INCOME pour le formulaire
      let formType = "EXPENSE";
      if (
        transaction.type === "INCOME" ||
        transaction.type === "CREDIT" ||
        (transaction.amount && transaction.amount > 0)
      ) {
        formType = "INCOME";
      }

      // Catégorie du formulaire : valeur stockée telle quelle (sous-catégorie
      // fine ou catégorie large API), même principe que viewCategoryForm — le
      // CategorySearchSelect affiche le même libellé que le tableau et un
      // enregistrement sans changement ne réécrit plus la catégorie.
      const formCategory = transaction.category || "";

      setFormData({
        type: formType,
        amount: Math.abs(transaction.amount)?.toString() || "",
        category: formCategory,
        date: formattedDate,
        description: transaction.description || "",
        paymentMethod: formPaymentMethod,
        vendor: transaction.vendor || "",
        receiptImage: transaction.receiptImage || null,
        status: (transaction.status || "COMPLETED").toUpperCase(),
      });
      // Les transactions bancaires s'ouvrent en mode visualisation : leurs
      // informations viennent du compte bancaire et ne sont pas modifiables.
      // Seules la description et la catégorie s'éditent, directement en vue.
      setIsEditMode(false);
      setPendingFiles([]);
      setPreview(null);
    }
  }, [open, transaction, isCreateMode]);

  // Mutation pour mettre à jour la catégorie
  const [updateTransaction] = useMutation(UPDATE_TRANSACTION, {
    onCompleted: () => {
      toast.success("Transaction mise à jour");
      onRefresh?.();
    },
    onError: (error) => {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Catégorie en mode vue : valeur stockée passée telle quelle (sous-catégorie
  // fine OU catégorie large API). La convertir vers une sous-catégorie
  // arbitraire faisait diverger le libellé du sélecteur de celui de la colonne
  // du tableau (ex: "SERVICES" affiché « Sous-traitance » dans le tableau mais
  // « Comptabilité » ici) — le CategorySearchSelect résout maintenant les deux
  // formats via getCategoryConfig.
  const viewCategoryForm = transaction?.category || "";

  // Gérer le changement de catégorie (mode vue - utilise les mêmes sous-catégories fines)
  const handleViewCategoryChange = async (newCategory) => {
    const transactionId =
      transaction?.originalTransaction?.id || transaction?.id;
    if (!transactionId || newCategory === transaction?.category) return;

    try {
      await updateTransaction({
        variables: {
          id: transactionId,
          input: { category: newCategory },
        },
      });
    } catch (error) {
      console.error("Erreur mise à jour catégorie:", error);
    }
  };

  // Enregistrer la description au blur (transaction bancaire, mode vue).
  // Seule la description part dans la mutation : le reste des informations
  // vient du compte bancaire et n'est pas modifiable.
  const handleDescriptionSave = async () => {
    const transactionId =
      transaction?.originalTransaction?.id || transaction?.id;
    const newDescription = (formData.description || "").trim();
    if (
      !transactionId ||
      !newDescription ||
      newDescription === (transaction?.description || "")
    )
      return;

    try {
      await updateTransaction({
        variables: {
          id: transactionId,
          input: { description: newDescription },
        },
      });
    } catch (error) {
      console.error("Erreur mise à jour description:", error);
    }
  };

  // Gérer les changements de formulaire
  const handleChange = (field) => (value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "type" && prev.type !== value) {
        newData.category = "";
      }
      return newData;
    });
  };

  // Soumettre le formulaire
  const handleSubmit = () => {
    if (isCreateMode) {
      // Mode création — envoyer la sous-catégorie fine (le backend fait le mapping)
      const submissionData = {
        ...formData,
        category: formData.category || "OTHER",
        amount: parseFloat(formData.amount) || 0,
        receiptFiles: pendingFiles.map((p) => p.file),
      };
      onSubmit?.(submissionData);
      onOpenChange(false);
    } else if (isEditMode) {
      // Mode édition (transaction manuelle uniquement — les transactions
      // bancaires n'ont plus de mode édition) — envoyer la sous-catégorie fine
      const transactionId =
        transaction?.originalTransaction?.id || transaction?.id;
      const submissionData = {
        ...formData,
        category: formData.category || "OTHER",
        amount: parseFloat(formData.amount) || 0,
        id: transactionId,
      };
      onSubmit?.(submissionData);
      if (isManualTransaction) {
        setIsEditMode(false);
      }
    }
  };

  // Gérer l'upload d'un ou plusieurs fichiers
  const handleFilesUpload = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (files.length === 0) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    const validFiles = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `Format non supporté (${file.name}). JPG, PNG, WebP ou PDF.`,
        );
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Fichier trop volumineux (${file.name}). Max 10 Mo.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    if (isCreateMode) {
      // Mode création — stocker en pending, ils seront uploadés au submit
      const newPending = await Promise.all(
        validFiles.map(
          (file) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve({ file, previewUrl: reader.result });
              reader.readAsDataURL(file);
            }),
        ),
      );
      setPendingFiles((prev) => [...prev, ...newPending]);
    } else if (onAttachReceipt) {
      // Mode visualisation/édition — upload immédiat via parent
      setIsUploading(true);
      try {
        await onAttachReceipt(transaction, validFiles);
        onRefresh?.();
      } catch (error) {
        console.error("Erreur upload:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  // Mutation pour supprimer un justificatif individuel
  const [removeReceiptMutation] = useMutation(REMOVE_TRANSACTION_RECEIPT_FILE, {
    onCompleted: (data) => {
      if (data?.removeTransactionReceiptFile?.success) {
        toast.success("Justificatif supprimé");
        onRefresh?.();
      } else {
        toast.error(
          data?.removeTransactionReceiptFile?.message || "Erreur suppression",
        );
      }
    },
    onError: (err) => {
      console.error("Erreur suppression justificatif:", err);
      toast.error("Erreur lors de la suppression");
    },
  });

  const handleRemoveReceiptFile = async (file) => {
    // Mode création : retirer du pending
    if (isCreateMode || !file?.id) {
      setPendingFiles((prev) => prev.filter((p) => p.file !== file?.file));
      return;
    }
    const txId = transaction?.originalTransaction?.id || transaction?.id;
    if (!txId) return;
    await removeReceiptMutation({
      variables: {
        transactionId: txId,
        workspaceId,
        fileId: file.id,
      },
    });
  };

  // Ouvre le volet de gauche sur les fichiers d'un document lié ; un second
  // clic sur le même document le referme.
  const openLinkedPreview = (key, items) => {
    setPreview((prev) =>
      prev?.source === "linked" && prev.key === key
        ? null
        : { source: "linked", key, items, index: 0 },
    );
    setShowMobileDetails(false);
  };
  const isLinkedPreviewed = (key) =>
    preview?.source === "linked" && preview.key === key;

  // Ouvrir une facture d'achat liée (page Factures d'achat)
  const handleViewPurchaseInvoice = (purchaseInvoice) => {
    if (purchaseInvoice?.id) {
      router.push(`/dashboard/outils/factures-achat?id=${purchaseInvoice.id}`);
      onOpenChange(false);
    }
  };

  // Voir les justificatifs d'une facture d'achat liée dans le volet de gauche.
  // Les PDF passent par le proxy same-origin (la CSP de prod bloque les
  // iframes vers l'URL publique R2), sélection du fichier via ?fileId=.
  const handleViewPurchaseInvoiceReceipt = (purchaseInvoice) => {
    const items = (purchaseInvoice?.files || [])
      .filter((f) => f?.url)
      .map((f) => ({
        id: f.id,
        url: f.url,
        mimetype: f.mimetype || "",
        filename:
          f.filename || purchaseInvoice.invoiceNumber || "Facture d'achat",
        size: f.size,
        isPending: false,
        pdfSrc: /^[0-9a-f]{24}$/i.test(f.id || "")
          ? `/api/document-preview/purchaseInvoice/${purchaseInvoice.id}?fileId=${f.id}`
          : `/api/document-preview/purchaseInvoice/${purchaseInvoice.id}`,
      }));
    if (items.length === 0) return;
    openLinkedPreview(`pi-${purchaseInvoice.id}`, items);
  };

  // Voir une facture Newbi liée dans le volet de gauche : PDF archivé servi
  // par le proxy. On vérifie la disponibilité avant d'ouvrir le volet pour ne
  // pas afficher une erreur JSON dans l'iframe (brouillon, archive absente).
  const handleViewInvoicePdf = async (inv) => {
    if (!inv?.id) return;
    const key = `invoice-${inv.id}`;
    if (isLinkedPreviewed(key)) {
      closePreview();
      return;
    }
    const src = `/api/document-preview/invoice/${inv.id}`;
    try {
      const res = await fetch(src, { credentials: "include" });
      if (!res.ok) {
        toast.error("Le PDF de cette facture n'est pas encore disponible");
        return;
      }
      openLinkedPreview(key, [
        {
          url: src,
          mimetype: "application/pdf",
          filename: formatInvoiceReference(inv),
          isPending: false,
          pdfSrc: src,
        },
      ]);
    } catch {
      toast.error("Impossible de charger le PDF de la facture");
    }
  };

  // Ouvre la page du document lié (facture, facture importée) et ferme le tiroir
  const goToInvoicePage = (id) => {
    router.push(`/dashboard/outils/factures?id=${id}&returnTo=transactions`);
    onOpenChange(false);
  };

  // Voir le fichier d'une facture client importée liée dans le volet de gauche
  const handleViewImportedInvoiceFile = (inv) => {
    const file = inv?.file;
    if (!file?.url) return;
    openLinkedPreview(`imported-${inv.id}`, [
      {
        url: file.url,
        mimetype: file.mimeType || "",
        filename: file.originalFileName || inv.number || "Facture importée",
        isPending: false,
        pdfSrc: `/api/document-preview/importedInvoice/${inv.id}`,
      },
    ]);
  };

  // Détacher UNE facture d'achat de cette transaction (la facture garde ses
  // autres transactions, la transaction ses autres factures).
  const handleUnlinkPurchaseInvoice = async (purchaseInvoice) => {
    if (!purchaseInvoice?.id || !transaction?.id) return;
    setUnlinkingPurchaseInvoiceId(purchaseInvoice.id);
    try {
      const result = await unlinkPurchaseInvoice(
        purchaseInvoice.id,
        transaction.id,
      );
      if (result) {
        toast.success("Facture d'achat détachée");
        onRefresh?.();
      }
    } catch (error) {
      console.error("Erreur lors du détachement (facture d'achat):", error);
      toast.error("Erreur lors du détachement de la facture d'achat");
    } finally {
      setUnlinkingPurchaseInvoiceId(null);
    }
  };

  // Liste complète des justificatifs (existants + pending), affichés dans la
  // sidebar ; le volet de gauche ne montre que celui qui a été cliqué.
  // Un fichier devenu facture d'achat liée n'est pas relisté : la carte
  // « Facture d'achat liée » le porte déjà (cf. getStandaloneReceipts).
  const allReceipts = (() => {
    const list = [];
    // Existants venant du backend (receiptFiles, legacy `files[]` en repli)
    for (const r of getStandaloneReceipts(transaction)) {
      list.push({
        id: r.id,
        // Position dans receiptFiles : sert au proxy d'aperçu quand le
        // justificatif n'a pas d'identifiant Mongo (anciens fichiers migrés)
        receiptIndex: r.receiptIndex,
        url: r.url,
        mimetype: r.mimetype || "",
        filename: r.originalFilename || r.filename || "Justificatif",
        size: r.size,
        uploadedAt: r.uploadedAt || null,
        isPending: false,
      });
    }
    // Pending (mode création)
    for (const p of pendingFiles) {
      list.push({
        url: p.previewUrl,
        mimetype: p.file?.type || "",
        filename: p.file?.name || "Justificatif",
        size: p.file?.size,
        isPending: true,
        file: p.file,
      });
    }
    return list;
  })();

  const hasReceipt = transaction?.hasReceipt || allReceipts.length > 0;
  // Documents parcourus par le volet (prev/next) et document affiché.
  // Aucun volet tant que l'utilisateur n'a rien cliqué.
  const previewItems = !preview
    ? []
    : preview.source === "receipts"
      ? allReceipts
      : preview.items;
  const previewIndex = Math.min(
    preview?.index || 0,
    Math.max(previewItems.length - 1, 0),
  );
  const activeReceipt =
    previewItems.length > 0 ? previewItems[previewIndex] : null;
  const isReceiptPreviewed = (idx) =>
    preview?.source === "receipts" && previewIndex === idx;
  const togglePreviewReceipt = (idx) => {
    setPreview(
      isReceiptPreviewed(idx) ? null : { source: "receipts", index: idx },
    );
    setShowMobileDetails(false);
  };
  const closePreview = () => setPreview(null);
  const stepPreview = (delta) =>
    setPreview((prev) =>
      prev
        ? {
            ...prev,
            index: Math.max(
              0,
              Math.min(previewItems.length - 1, previewIndex + delta),
            ),
          }
        : prev,
    );
  // Détection PDF/image : mimetype d'abord, fallback sur l'extension de l'URL/nom
  const inferReceiptKind = (r) => {
    if (!r) return { isPdf: false, isImage: false };
    const mt = (r.mimetype || "").toLowerCase();
    if (mt === "application/pdf") return { isPdf: true, isImage: false };
    if (mt.startsWith("image/")) return { isPdf: false, isImage: true };
    const source = `${r.filename || ""} ${r.url || ""}`.toLowerCase();
    const cleanSource = source.split("?")[0];
    if (/\.pdf(\b|$)/.test(cleanSource)) return { isPdf: true, isImage: false };
    if (/\.(jpe?g|png|webp|gif|bmp|avif|svg)(\b|$)/.test(cleanSource))
      return { isPdf: false, isImage: true };
    return { isPdf: false, isImage: false };
  };
  const { isPdf: activeReceiptIsPdf, isImage: activeReceiptIsImage } =
    inferReceiptKind(activeReceipt);

  // PDF en attente d'upload (mode création) : URL blob:, autorisée par la CSP
  // (frame-src 'self' blob:), contrairement à la data URL de la miniature.
  const pendingPdfBlobUrl = useMemo(
    () =>
      activeReceipt?.isPending && activeReceipt.file && activeReceiptIsPdf
        ? URL.createObjectURL(activeReceipt.file)
        : null,
    [activeReceipt?.isPending, activeReceipt?.file, activeReceiptIsPdf],
  );
  useEffect(
    () => () => {
      if (pendingPdfBlobUrl) URL.revokeObjectURL(pendingPdfBlobUrl);
    },
    [pendingPdfBlobUrl],
  );

  // URL chargée dans l'iframe PDF. Les justificatifs déjà uploadés passent
  // par le proxy same-origin /api/document-preview : la CSP de prod
  // (frame-src 'self') bloque les iframes vers l'URL publique R2
  // (ERR_BLOCKED_BY_CSP constaté le 14/09/2026). Les images gardent l'URL
  // directe (img-src autorise https:), le bouton Télécharger aussi.
  const activeReceiptPdfSrc = (() => {
    if (!activeReceipt || !activeReceiptIsPdf) return null;
    if (activeReceipt.isPending) return pendingPdfBlobUrl || activeReceipt.url;
    // Fichier d'un document lié : proxy déjà résolu à l'ouverture du volet
    if (activeReceipt.pdfSrc) return activeReceipt.pdfSrc;
    const txId = transaction?.id;
    if (!txId || activeReceipt.receiptIndex === undefined) {
      // Legacy `files[]` : pas servi par le proxy
      return activeReceipt.url;
    }
    const selector = /^[0-9a-f]{24}$/i.test(activeReceipt.id || "")
      ? `fileId=${activeReceipt.id}`
      : `index=${activeReceipt.receiptIndex}`;
    return `/api/document-preview/transaction/${txId}?${selector}`;
  })();

  const formatDate = (dateInput, includeTime = false) => {
    if (!dateInput) return "Non spécifiée";
    if (typeof dateInput === "object" && dateInput.$date) {
      dateInput = dateInput.$date;
    }
    return includeTime
      ? formatDateTimeToFrench(dateInput)
      : formatDateToFrench(dateInput);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getDrawerTitle = () => {
    if (isCreateMode) {
      return "Nouvelle transaction";
    }
    if (
      transaction?.paymentMethod &&
      transactionTypeLabels[transaction.paymentMethod]
    ) {
      return transactionTypeLabels[transaction.paymentMethod];
    }
    if (transaction?.operationType) {
      const op = transaction.operationType.toLowerCase();
      if (op.includes("card") || op.includes("carte"))
        return "Paiement par carte";
      if (op.includes("transfer") || op.includes("virement")) return "Virement";
      if (
        op.includes("debit") ||
        op.includes("prelevement") ||
        op.includes("prélèvement")
      )
        return "Prélèvement";
    }
    if (isBankTransaction) return "Transaction bancaire";
    return "Transaction manuelle";
  };

  // Récupérer les infos visuelles
  // L'icône doit être réactive aux changements de catégorie en mode création ET édition
  const isEditingForm = isCreateMode || isEditMode;
  // getCategoryConfig résout directement sous-catégories fines et catégories
  // larges : pas besoin de pré-mapper vers la catégorie large
  const currentCategoryKey = isEditingForm
    ? formData.category || "OTHER"
    : transaction?.category || "OTHER";
  const categoryConfig = getCategoryConfig(currentCategoryKey);
  const CategoryIcon = categoryConfig.icon;
  const PaymentIcon =
    paymentMethodIcons[
      isEditingForm ? formData.paymentMethod : transaction?.paymentMethod
    ] || CardVuesax;
  const merchant = !isCreateMode
    ? findMerchant(
        transaction?.vendor || transaction?.description || transaction?.title,
      )
    : null;

  return (
    <>
      {/* Semi-transparent overlay (dim léger sur toute la page) */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/30"
        data-app-overlay=""
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onClick={() => onOpenChange(false)}
      />

      {/* Backdrop sombre + volet d'aperçu à gauche : uniquement après un clic
          sur un justificatif ou sur « Voir » d'une facture liée. Un clic dans
          le fond referme le volet sans fermer le tiroir. */}
      {activeReceipt?.url && (
        <>
          <motion.div
            className="fixed inset-y-0 left-0 md:right-[500px] right-0 z-40 bg-black/60 cursor-pointer"
            onClick={closePreview}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.1, ease: "easeOut" },
            }}
            transition={{ duration: 0.2, delay: 0.2, ease: "easeOut" }}
          />

          <motion.div
            className="fixed inset-y-0 left-0 md:right-[500px] right-0 z-50 pointer-events-none"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{
              x: "-100%",
              transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
            }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Nom du document + fermeture du volet */}
            <div className="fixed top-4 left-4 z-[60] flex items-center gap-2 pointer-events-auto max-w-[calc(100%-2rem)] md:max-w-[calc(100%-500px-2rem)]">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
                onClick={closePreview}
                title="Fermer l'aperçu"
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium truncate">
                {activeReceipt.filename || "Justificatif"}
              </span>
            </div>

            <div className="absolute inset-0 flex items-start justify-center overflow-y-auto py-16 px-2 md:px-24">
              <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white pointer-events-auto overflow-hidden shadow-2xl">
                {activeReceiptIsPdf ? (
                  <iframe
                    src={`${activeReceiptPdfSrc}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    title={activeReceipt.filename || "Justificatif"}
                    className="w-full h-full min-h-[297mm] border-0 block"
                  />
                ) : activeReceiptIsImage ? (
                  <PreviewImage
                    src={activeReceipt.url}
                    alt={activeReceipt.filename || "Justificatif"}
                    className="w-full h-auto object-contain"
                    containerClassName="w-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-12 min-h-[calc(100vh-6rem)]">
                    <FileText className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-sm mb-4">Aperçu non disponible</p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(activeReceipt.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ouvrir le fichier
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation prev/next + indicateur N/total — seulement si > 1 document */}
            {previewItems.length > 1 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-[calc((100%-500px)/2)] md:translate-x-[-50%] z-[60] flex items-center gap-2 px-3 py-2 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-medium pointer-events-auto shadow-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/15 hover:text-white rounded-full"
                  disabled={previewIndex === 0}
                  onClick={() => stepPreview(-1)}
                  title="Précédent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="tabular-nums select-none">
                  {previewIndex + 1} / {previewItems.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/15 hover:text-white rounded-full"
                  disabled={previewIndex >= previewItems.length - 1}
                  onClick={() => stepPreview(1)}
                  title="Suivant"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Bouton flottant pour ouvrir les détails sur mobile */}
            <Button
              onClick={() => setShowMobileDetails(true)}
              className="md:hidden fixed bottom-6 right-6 z-[60] rounded-full h-14 w-14 shadow-lg pointer-events-auto"
              size="icon"
            >
              <Edit className="h-5 w-5" />
            </Button>
          </motion.div>
        </>
      )}

      {/* Main Sidebar - slide depuis la droite */}
      <motion.div
        className="fixed inset-y-0 right-0 z-50 md:w-[500px] w-full bg-background border-l shadow-lg flex flex-col"
        initial={{ x: "100%" }}
        animate={{
          x: isMobile && activeReceipt?.url && !showMobileDetails ? "100%" : 0,
        }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Portal container for calendar popover */}
        <div ref={setCalendarContainer} />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h2 className="text-base font-medium truncate">
              {getDrawerTitle()}
            </h2>
            {!isCreateMode && isBankTransaction && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 shrink-0">
                Bancaire
              </span>
            )}
            {isCreateMode && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 shrink-0">
                <Plus className="w-3 h-3" />
                Nouvelle
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeReceipt?.url && (
              <Button
                variant="primary"
                className="gap-1.5 font-medium"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = activeReceipt.url;
                  link.download = activeReceipt.filename || "justificatif";
                  link.target = "_blank";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <DownloadVuesax className="h-4 w-4" />
                Télécharger
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (window.innerWidth < 768 && showMobileDetails) {
                  setShowMobileDetails(false);
                } else {
                  setShowMobileDetails(false);
                  onOpenChange(false);
                }
              }}
              className="h-8 w-8 bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)] dark:bg-[rgba(255,255,255,0.06)] dark:hover:bg-[rgba(255,255,255,0.1)]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Montant principal */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${categoryConfig.color}15` }}
                >
                  <CategoryIcon
                    className="h-5 w-5"
                    style={{ color: categoryConfig.color }}
                  />
                </div>
                <div className="flex-1">
                  {/* Catégorie */}
                  {isEditingForm ? (
                    <div className="mb-1">
                      <CategorySearchSelect
                        value={formData.category}
                        onValueChange={handleChange("category")}
                        type={formData.type}
                      />
                    </div>
                  ) : (
                    <div className="mb-1">
                      <CategorySearchSelect
                        value={viewCategoryForm}
                        onValueChange={handleViewCategoryChange}
                        type={transaction?.amount > 0 ? "INCOME" : "EXPENSE"}
                      />
                    </div>
                  )}

                  {/* Montant — lecture seule (issu du flux bancaire Bridge) */}
                  <p className="text-2xl font-medium">
                    {formatAmount(transaction?.amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Fournisseur */}
            <div className="space-y-3">
              <p className="text-sm font-normal text-muted-foreground">
                {formData.type === "INCOME"
                  ? "Source du revenu"
                  : "Fournisseur"}
              </p>
              {
                <div className="flex items-center gap-3">
                  {merchant?.logo ? (
                    <div className="h-10 w-10 rounded-full overflow-hidden border bg-white flex-shrink-0">
                      <img
                        src={merchant.logo}
                        alt={merchant.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<div class="h-full w-full flex items-center justify-center bg-muted"><span class="text-xs font-medium text-muted-foreground">${merchant.name.charAt(0)}</span></div>`;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {transaction?.vendor ||
                        merchant?.name ||
                        transaction?.title ||
                        "Fournisseur non spécifié"}
                    </p>
                    {transaction?.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                </div>
              }
            </div>

            {/* Informations — style Attio (cards compactes, icône carrée) */}
            <div className="space-y-3">
              <p className="text-sm font-normal text-muted-foreground">
                Informations
              </p>
              <div className="divide-y divide-border/50">
                {/* Date */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <CalendarIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="text-sm font-normal text-muted-foreground">
                      Date
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {formatDate(transaction?.date)}
                  </span>
                </div>

                {/* Moyen de paiement */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <PaymentIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="text-sm font-normal text-muted-foreground">
                      Paiement
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {paymentMethodLabels[transaction?.paymentMethod] ||
                      "Non spécifié"}
                  </span>
                </div>

                {/* Statut (seulement en mode visualisation pour les transactions bancaires) */}
                {!isCreateMode && isBankTransaction && (
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Receipt className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-sm font-normal text-muted-foreground">
                        Statut
                      </span>
                    </div>
                    {transaction?.status === "PAID" ||
                    transaction?.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {transaction?.amount > 0 ? "Encaissée" : "Payée"}
                      </span>
                    ) : transaction?.status === "PENDING" ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                        <AlertCircle className="w-3 h-3" />
                        {statusLabels[transaction.status] || "En attente"}
                      </span>
                    ) : transaction?.status === "CANCELLED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                        <AlertCircle className="w-3 h-3" />
                        {statusLabels[transaction.status] || "Annulée"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                        <FileText className="w-3 h-3" />
                        {statusLabels[transaction?.status] || "Brouillon"}
                      </span>
                    )}
                  </div>
                )}

                {/* Source (Banque) */}
                {!isCreateMode && isBankTransaction && (
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <BankVuesax className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-sm font-normal text-muted-foreground">
                        Source
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                      <BankVuesax className="w-3 h-3" />
                      Banque
                    </span>
                  </div>
                )}

                {/* Utilisateur créateur */}
                {!isCreateMode && transaction?.createdBy && (
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-sm font-normal text-muted-foreground">
                        Créé par
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {transaction.createdBy.name ||
                        transaction.createdBy.email ||
                        "Utilisateur"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description : seul champ texte modifiable d'une transaction
                bancaire (enregistrée au blur) */}
            {!isCreateMode && isBankTransaction && !isEditingForm && (
              <div className="space-y-3">
                <p className="text-sm font-normal text-muted-foreground">
                  Description
                </p>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description")(e.target.value)}
                  onBlur={handleDescriptionSave}
                  placeholder="Description de la transaction"
                  rows={3}
                  className="rounded-xl"
                  disabled={isReadOnly}
                  title={readOnlyTooltip}
                />
              </div>
            )}

            {/* Référence bancaire brute (Bridge provider_description) :
                conserve les références de virement (ex. numéros de facture)
                que la description nettoyée par Bridge tronque. Lecture seule. */}
            {!isCreateMode &&
              isBankTransaction &&
              transaction?.reference &&
              transaction.reference !== transaction.description && (
                <div className="space-y-3">
                  <p className="text-sm font-normal text-muted-foreground">
                    Référence bancaire
                  </p>
                  <p className="text-sm text-foreground break-words rounded-xl border p-3 bg-muted/30">
                    {transaction.reference}
                  </p>
                </div>
              )}

            {/* Description (mode création/édition) */}
            {isEditingForm && (
              <div className="space-y-3">
                <p className="text-sm font-normal text-muted-foreground">
                  Description
                </p>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description")(e.target.value)}
                  placeholder="Description de la transaction"
                  rows={3}
                  className="rounded-xl"
                />
              </div>
            )}

            {/* Section Justificatif */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ReceiptVuesax className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-normal text-muted-foreground">
                    Justificatif
                  </p>
                </div>
                {!isCreateMode &&
                  (hasReceipt ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Attaché
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                      <AlertCircle className="w-3 h-3" />
                      Manquant
                    </span>
                  ))}
              </div>

              {/* Zone d'upload — large card dashed, toujours visible pour ajouter plusieurs justificatifs */}
              {(isCreateMode || !isReadOnly) && (
                <div
                  className={`relative flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-lg cursor-pointer border border-dashed text-center transition-colors duration-[120ms] ${
                    dragActive
                      ? "border-[#5A50FF]/60 bg-[#5A50FF]/10"
                      : "border-border bg-transparent hover:bg-muted/40"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFilesUpload(e.target.files);
                        e.target.value = "";
                      }
                    }}
                    disabled={isUploading}
                  />
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 text-[#5A50FF] animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {isUploading
                        ? "Upload en cours..."
                        : allReceipts.length > 0
                          ? "Ajouter d'autres justificatifs"
                          : "Glissez vos justificatifs ici"}
                    </p>
                    {!isUploading && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {allReceipts.length > 0
                          ? "Glissez ou cliquez pour ajouter · JPG, PNG, PDF · max 10 Mo"
                          : "ou cliquez pour en sélectionner plusieurs · JPG, PNG, PDF · max 10 Mo par fichier"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Liste des justificatifs attachés — même carte que les
                  factures d'achat liées ; clic = afficher/masquer dans le
                  volet de gauche */}
              {allReceipts.length > 0 && (
                <div className="space-y-3">
                  {allReceipts.map((rcpt, idx) => {
                    const isActive = isReceiptPreviewed(idx);
                    // Mêmes lignes que les cartes de documents liés : titre,
                    // nature, puis date (pas de poids de fichier).
                    const { isPdf, isImage } = inferReceiptKind(rcpt);
                    const kindLabel = isPdf
                      ? "Document PDF"
                      : isImage
                        ? "Image"
                        : "Fichier";
                    const dateLabel = rcpt.uploadedAt
                      ? `Déposé le ${formatDate(rcpt.uploadedAt)}`
                      : "";
                    return (
                      <div
                        key={rcpt.id || `pending-${idx}`}
                        onClick={() => togglePreviewReceipt(idx)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors duration-[120ms] ${
                          isActive
                            ? "bg-muted/70 ring-1 ring-border"
                            : "bg-muted/30 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium truncate">
                                {rcpt.filename}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {kindLabel}
                            </p>
                            {dateLabel && (
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{dateLabel}</span>
                              </div>
                            )}
                            <span
                              className={`mt-1.5 inline-flex items-center max-w-full truncate text-[10px] leading-none px-1.5 py-1 rounded whitespace-nowrap ${
                                rcpt.isPending
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                              }`}
                            >
                              {rcpt.isPending
                                ? "À envoyer"
                                : "Justificatif déposé"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <EyeButton
                              active={isActive}
                              onClick={() => togglePreviewReceipt(idx)}
                              label="Voir le justificatif"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveReceiptFile(rcpt);
                                closePreview();
                              }}
                              title="Retirer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Factures liées (rapprochement N↔N) — rendues DANS la section
                  Justificatif : la facture est un justificatif comptable de la
                  transaction. Tap = navigate vers la facture. */}
              {!isCreateMode &&
                (transaction?.linkedInvoices?.length || 0) > 0 && (
                  <div className="space-y-1.5">
                    {transaction.linkedInvoices.map((inv) => (
                      <div
                        key={`linked-${inv.id}`}
                        onClick={() => handleViewInvoicePdf(inv)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-[120ms] ${
                          isLinkedPreviewed(`invoice-${inv.id}`)
                            ? "bg-muted/70 ring-1 ring-border"
                            : "bg-muted/40 hover:bg-muted/60"
                        }`}
                      >
                        <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-[#5A50FF]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {formatInvoiceReference(inv)}
                            {inv.clientName ? ` — ${inv.clientName}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {inv.totalTTC != null
                              ? formatAmount(inv.totalTTC)
                              : ""}
                          </p>
                          <LinkOriginTag
                            className="mt-1"
                            links={transaction.reconciliationLinks}
                            documentType="INVOICE"
                            documentId={inv.id}
                          />
                        </div>
                        <EyeButton
                          active={isLinkedPreviewed(`invoice-${inv.id}`)}
                          onClick={() => handleViewInvoicePdf(inv)}
                          label="Voir la facture"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToInvoicePage(inv.id);
                          }}
                          title="Ouvrir la facture"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const result = await unlinkTransaction(
                                transaction.id,
                                inv.id,
                              );
                              if (result.success) {
                                toast.success("Facture détachée");
                                onRefresh?.();
                              } else {
                                toast.error(result.error || "Erreur");
                              }
                            } catch (err) {
                              toast.error("Erreur lors du détachement");
                            }
                          }}
                          title="Détacher la facture"
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {transaction.reconciliationDate && (
                      <p className="text-xs text-muted-foreground text-center">
                        Rapprochée le{" "}
                        {formatDate(transaction.reconciliationDate)}
                      </p>
                    )}
                  </div>
                )}

              {/* Factures clients importées liées (Qonto, OCR, Gmail) : même
                  rendu que les factures Newbi, badge « Importée ». */}
              {!isCreateMode && linkedImportedInvoices.length > 0 && (
                <div className="space-y-1.5">
                  {linkedImportedInvoices.map((inv) => (
                    <div
                      key={`linked-imported-${inv.id}`}
                      onClick={() =>
                        inv.file?.url
                          ? handleViewImportedInvoiceFile(inv)
                          : goToInvoicePage(inv.id)
                      }
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-[120ms] ${
                        isLinkedPreviewed(`imported-${inv.id}`)
                          ? "bg-muted/70 ring-1 ring-border"
                          : "bg-muted/40 hover:bg-muted/60"
                      }`}
                    >
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-[#5A50FF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {inv.number || "Facture importée"}
                          {inv.clientName ? ` — ${inv.clientName}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inv.totalTTC != null
                            ? formatAmount(inv.totalTTC)
                            : ""}
                        </p>
                        <LinkOriginTag
                          className="mt-1"
                          links={transaction?.reconciliationLinks}
                          documentType="IMPORTED_INVOICE"
                          documentId={inv.id}
                        />
                      </div>
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Importée
                      </span>
                      <EyeButton
                        active={isLinkedPreviewed(`imported-${inv.id}`)}
                        disabled={!inv.file?.url}
                        onClick={() => handleViewImportedInvoiceFile(inv)}
                        label="Voir la facture"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToInvoicePage(inv.id);
                        }}
                        title="Ouvrir la facture"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const result = await unlinkImportedInvoice(
                            transaction.id,
                            inv.id,
                          );
                          if (result?.success) onRefresh?.();
                        }}
                        title="Détacher la facture importée"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes (seulement en visualisation) */}
            {!isCreateMode &&
              transaction?.notes &&
              transaction.notes !== "[EXPENSE]" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <NoteVuesax className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-normal text-muted-foreground">
                      Notes
                    </p>
                  </div>
                  <p className="text-sm font-normal text-foreground">
                    {transaction.notes}
                  </p>
                </div>
              )}

            {/* Factures d'achat liées (lien par référence — le justificatif
                reste sur la facture, accessible via ce lien). N↔N : plusieurs
                factures possibles, détachement unitaire. */}
            {!isCreateMode &&
              (linkedPurchaseInvoices.length > 0 || isAnalyzingReceipt) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-normal text-muted-foreground">
                        {linkedPurchaseInvoices.length > 1
                          ? "Factures d'achat liées"
                          : "Facture d'achat liée"}
                      </p>
                    </div>
                    {/* Rien n'est encore rapproché tant que la section ne
                        contient que le loader d'analyse */}
                    {linkedPurchaseInvoices.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                        <Link2 className="w-3 h-3" />
                        Rapprochée
                      </span>
                    )}
                  </div>

                  {isAnalyzingReceipt && (
                    <div className="p-3 border rounded-lg bg-muted/30 flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          Analyse du justificatif en cours
                        </p>
                        <p className="text-sm text-muted-foreground">
                          La facture d'achat apparaîtra ici dès qu'elle est
                          prête.
                        </p>
                      </div>
                    </div>
                  )}
                  {linkedPurchaseInvoices.map((pi) => (
                    <div
                      key={pi.id}
                      onClick={() =>
                        pi.files?.some((f) => f?.url)
                          ? handleViewPurchaseInvoiceReceipt(pi)
                          : handleViewPurchaseInvoice(pi)
                      }
                      className={`p-3 border rounded-lg cursor-pointer transition-colors duration-[120ms] ${
                        isLinkedPreviewed(`pi-${pi.id}`)
                          ? "bg-muted/70 ring-1 ring-border"
                          : "bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium truncate">
                              {describePurchaseInvoice(pi).title}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {describePurchaseInvoice(pi).subtitle}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{formatAmount(pi.amountTTC)}</span>
                            {pi.issueDate && (
                              <>
                                <span>•</span>
                                <span>{formatDate(pi.issueDate)}</span>
                              </>
                            )}
                          </div>
                          <LinkOriginTag
                            className="mt-1.5"
                            links={transaction?.reconciliationLinks}
                            documentType="PURCHASE_INVOICE"
                            documentId={pi.id}
                          />
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <EyeButton
                            active={isLinkedPreviewed(`pi-${pi.id}`)}
                            disabled={!pi.files?.some((f) => f?.url)}
                            onClick={() => handleViewPurchaseInvoiceReceipt(pi)}
                            label="Voir le justificatif"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPurchaseInvoice(pi);
                            }}
                            title="Ouvrir la facture d'achat"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlinkPurchaseInvoice(pi);
                            }}
                            disabled={
                              isReadOnly || unlinkingPurchaseInvoiceId !== null
                            }
                            title={
                              readOnlyTooltip || "Détacher la facture d'achat"
                            }
                          >
                            {unlinkingPurchaseInvoiceId === pi.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Unlink className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* Rattacher une facture d'achat existante (dépenses) : recours
                au dépôt de justificatif quand la facture existe déjà (saisie,
                import Qonto, ou déjà rapprochée à un autre prélèvement). */}
            {canPickPurchaseInvoice && !isIgnoredReconciliation && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-normal text-muted-foreground">
                      {linkedPurchaseInvoices.length > 0
                        ? "Rattacher une autre facture d'achat"
                        : "Rattacher une facture d'achat existante"}
                    </p>
                  </div>
                  {!showPurchaseInvoicePicker && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setShowPurchaseInvoicePicker(true)}
                      disabled={isReadOnly}
                      title={
                        readOnlyTooltip || "Rechercher une facture d'achat"
                      }
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      Rattacher
                    </Button>
                  )}
                </div>

                {showPurchaseInvoicePicker && (
                  <div className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Sélectionner une facture d&apos;achat
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setShowPurchaseInvoicePicker(false);
                          setPurchaseInvoiceSearch("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <Input
                      value={purchaseInvoiceSearch}
                      onChange={(e) => setPurchaseInvoiceSearch(e.target.value)}
                      placeholder="Fournisseur, n° de facture, montant..."
                      className="h-8 text-sm"
                      autoFocus
                    />

                    {loadingPurchaseInvoices ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : availablePurchaseInvoices.length > 0 ? (
                      <div className="max-h-[240px] overflow-y-auto space-y-2">
                        {availablePurchaseInvoices.map((pi) => (
                          <div
                            key={pi.id}
                            className={`p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                              pi.score >= 80
                                ? "border-[#5a50ff]/30 bg-[#5a50ff]/5"
                                : ""
                            }`}
                            onClick={() =>
                              !isLinkingPI &&
                              handleReconcilePurchaseInvoice(pi.id)
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {pi.supplierName || "Fournisseur"}
                                  {pi.invoiceNumber
                                    ? ` - ${pi.invoiceNumber}`
                                    : ""}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                  <span>{formatAmount(pi.amountTTC)}</span>
                                  {pi.issueDate && (
                                    <>
                                      <span>•</span>
                                      <span>{formatDate(pi.issueDate)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {pi.score >= 80 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#5a50ff]/10 text-[#5a50ff] border border-[#5a50ff]/30">
                                    Correspondance
                                  </span>
                                )}
                                {pi.isReconciled && (
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
                        {purchaseInvoiceSearch.trim()
                          ? "Aucune facture d'achat ne correspond à cette recherche."
                          : "Aucune facture d'achat disponible."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Rapprochement ignoré : la transaction a été volontairement
                exclue des suggestions (action "ignorer"). On propose d'annuler
                ce choix, sinon le statut est irréversible côté UI. */}
            {!isCreateMode && !hasLinkedInvoices && isIgnoredReconciliation && (
              <div className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Rapprochement ignoré pour cette transaction
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs shrink-0"
                  onClick={handleUnignoreReconciliation}
                  disabled={isReadOnly || isUnignoring}
                  title={readOnlyTooltip}
                >
                  {isUnignoring ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Réactiver"
                  )}
                </Button>
              </div>
            )}

            {/* Factures rapprochables : si la transaction n'est pas encore liée
                mais qu'une ou plusieurs factures correspondent, on les propose
                directement (pas de statut "ignoré"/"suggéré"). Pour les entrées
                d'argent sans suggestion, un sélecteur avec recherche permet le
                rattachement manuel. */}
            {!isCreateMode &&
              !isIgnoredReconciliation &&
              (matchingInvoices.length > 0 || canPickInvoice) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-normal text-muted-foreground">
                        {hasLinkedInvoices
                          ? "Rattacher une autre facture"
                          : matchingInvoices.length > 1
                            ? "Factures à rapprocher"
                            : "Facture à rapprocher"}
                      </p>
                    </div>
                    {canPickInvoice && !showInvoicePicker && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setShowInvoicePicker(true)}
                        disabled={isReadOnly}
                        title={readOnlyTooltip || "Rechercher une facture"}
                      >
                        <Link2 className="h-3 w-3 mr-1" />
                        Rattacher
                      </Button>
                    )}
                  </div>

                  {matchingInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {invoice.kind === "imported"
                              ? invoice.number || "Facture importée"
                              : formatInvoiceReference(invoice)}
                            {invoice.kind === "imported" && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground align-middle">
                                Importée
                              </span>
                            )}
                          </span>
                          <p className="text-sm text-muted-foreground truncate">
                            {invoice.clientName}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{formatAmount(invoice.totalTTC)}</span>
                            {invoice.dueDate && (
                              <>
                                <span>•</span>
                                <span>
                                  Échéance: {formatDate(invoice.dueDate)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={() =>
                            invoice.kind === "imported"
                              ? handleReconcileImportedInvoice(
                                  invoice.id,
                                  "TRANSACTION",
                                )
                              : handleReconcileInvoice(
                                  invoice.id,
                                  "TRANSACTION",
                                )
                          }
                          disabled={
                            isReadOnly || isLinking || isLinkingImported
                          }
                          title={readOnlyTooltip || "Rapprocher cette facture"}
                        >
                          {isLinking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Link2 className="h-4 w-4 mr-1.5" />
                              Rapprocher
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {matchingInvoices.length === 0 &&
                    !showInvoicePicker &&
                    !hasLinkedInvoices && (
                      <p className="text-sm text-muted-foreground">
                        Aucune correspondance automatique. Utilisez « Rattacher
                        » pour rechercher une facture.
                      </p>
                    )}

                  {/* Sélecteur manuel de facture (recherche serveur) */}
                  {showInvoicePicker && (
                    <div className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Sélectionner une facture
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setShowInvoicePicker(false);
                            setInvoiceSearch("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <Input
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                        placeholder="N° de facture, client, montant..."
                        className="h-8 text-sm"
                      />

                      {loadingInvoices ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : availableInvoices.length > 0 ? (
                        <div className="max-h-[240px] overflow-y-auto space-y-2">
                          {availableInvoices.map((invoice) => (
                            <div
                              key={invoice.id}
                              className={`p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                                invoice.score >= 80
                                  ? "border-[#5a50ff]/30 bg-[#5a50ff]/5"
                                  : ""
                              }`}
                              onClick={() => handlePickInvoice(invoice)}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {invoice.kind === "imported"
                                      ? invoice.number || "Facture importée"
                                      : formatInvoiceReference(invoice)}
                                    {invoice.kind === "imported" && (
                                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground align-middle">
                                        Importée
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {invoice.clientName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                    <span>
                                      {formatAmount(invoice.totalTTC)}
                                    </span>
                                    {invoice.dueDate && (
                                      <>
                                        <span>•</span>
                                        <span>
                                          Échéance:{" "}
                                          {formatDate(invoice.dueDate)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {invoice.score >= 80 && (
                                  <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-[#5a50ff]/10 text-[#5a50ff] border border-[#5a50ff]/30">
                                    Correspondance
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-4 text-xs text-muted-foreground">
                          {invoiceSearch.trim()
                            ? "Aucune facture ne correspond à cette recherche."
                            : "Aucune facture en attente de paiement."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Dates de création/modification */}
            {!isCreateMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-normal text-muted-foreground">
                    Créée le
                  </span>
                  <span className="text-xs font-normal">
                    {formatDate(transaction?.createdAt, true)}
                  </span>
                </div>
                {transaction?.updatedAt &&
                  transaction.updatedAt !== transaction.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-normal text-muted-foreground">
                        Modifiée le
                      </span>
                      <span className="text-xs font-normal">
                        {formatDate(transaction.updatedAt, true)}
                      </span>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 shrink-0">
          {(() => {
            const handleAnnuler = () => {
              if (isEditMode && isManualTransaction && !isCreateMode) {
                setIsEditMode(false);
              } else {
                onOpenChange(false);
              }
            };
            return (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 font-normal"
                  onClick={handleAnnuler}
                >
                  Annuler
                </Button>
                {(isCreateMode || isEditMode) && (
                  <Button
                    variant="primary"
                    className="flex-1 font-normal gap-1.5"
                    onClick={handleSubmit}
                    disabled={isReadOnly}
                    title={readOnlyTooltip}
                  >
                    {isCreateMode ? (
                      <Plus className="h-4 w-4" />
                    ) : (
                      <SaveVuesax className="h-4 w-4" />
                    )}
                    {isCreateMode ? "Ajouter" : "Enregistrer"}
                  </Button>
                )}
              </div>
            );
          })()}
        </div>
      </motion.div>
    </>
  );
}
