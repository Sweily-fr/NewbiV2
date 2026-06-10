"use client";

import { useState, useRef, useEffect } from "react";
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
import { Popover as RACPopover } from "react-aria-components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
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
  Download,
  Edit,
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
  ZoomIn,
  ZoomOut,
  RotateCw,
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
import {
  UPDATE_TRANSACTION,
  REMOVE_TRANSACTION_RECEIPT_FILE,
} from "@/src/graphql/queries/banking";
import { Calendar } from "@/src/components/ui/calendar-rac";
import { DateInput } from "@/src/components/ui/datefield-rac";
import {
  Dialog as RadixDialog,
  DialogContent as RadixDialogContent,
  DialogTitle as RadixDialogTitle,
} from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@/src/components/ui/visually-hidden";
import CategorySearchSelect from "./category-search-select";
import { useUnlinkTransactionFromInvoice } from "@/src/hooks/useReconciliationGraphQL";
import { useRouter } from "next/navigation";
import { PreviewImage } from "@/src/components/ui/preview-image";
import { getAllPCGAccounts, PCG_ACCOUNTS } from "@/lib/pcg-mapping";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

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

// Mapping des catégories form vers API (étendu pour couvrir toutes les catégories du CategorySearchSelect)
const categoryFormToApi = {
  // Fournitures et équipement
  bureau: "OFFICE_SUPPLIES",
  materiel: "HARDWARE",
  mobilier: "OFFICE_SUPPLIES",
  equipement: "HARDWARE",

  // Transport et déplacements
  transport: "TRAVEL",
  carburant: "TRAVEL",
  parking: "TRAVEL",
  peage: "TRAVEL",
  taxi: "TRAVEL",
  train: "TRAVEL",
  avion: "TRAVEL",
  location_vehicule: "TRAVEL",

  // Repas et hébergement
  repas: "MEALS",
  restaurant: "MEALS",
  hotel: "ACCOMMODATION",

  // Communication et marketing
  marketing: "MARKETING",
  publicite: "MARKETING",
  communication: "MARKETING",
  telephone: "SUBSCRIPTIONS",
  internet: "SUBSCRIPTIONS",
  site_web: "SOFTWARE",
  reseaux_sociaux: "MARKETING",

  // Formation et développement
  formation: "TRAINING",
  conference: "TRAINING",
  livres: "TRAINING",
  abonnement: "SUBSCRIPTIONS",

  // Services professionnels
  comptabilite: "SERVICES",
  juridique: "SERVICES",
  assurance: "INSURANCE",
  banque: "SERVICES",
  conseil: "SERVICES",
  sous_traitance: "SERVICES",

  // Locaux et charges
  loyer: "RENT",
  electricite: "UTILITIES",
  eau: "UTILITIES",
  chauffage: "UTILITIES",
  entretien: "MAINTENANCE",

  // Logiciels et outils
  logiciel: "SOFTWARE",
  saas: "SOFTWARE",
  licence: "SOFTWARE",

  // Ressources humaines
  salaire: "SALARIES",
  charges_sociales: "SALARIES",
  recrutement: "SERVICES",

  // Fiscalité
  impots_taxes: "TAXES",
  tva: "TAXES",
  avoirs_remboursement: "OTHER",

  // Autres dépenses
  cadeaux: "OTHER",
  representation: "OTHER",
  poste: "OFFICE_SUPPLIES",
  impression: "OFFICE_SUPPLIES",
  autre: "OTHER",

  // Revenus
  ventes: "SERVICES",
  services: "SERVICES",
  honoraires: "SERVICES",
  commissions: "SERVICES",
  consulting: "SERVICES",
  abonnements_revenus: "SUBSCRIPTIONS",
  licences_revenus: "SOFTWARE",
  royalties: "OTHER",
  loyers_revenus: "RENT",
  interets: "OTHER",
  dividendes: "OTHER",
  plus_values: "OTHER",
  subventions: "OTHER",
  remboursements_revenus: "OTHER",
  indemnites: "OTHER",
  cadeaux_recus: "OTHER",
  autre_revenu: "OTHER",
};

// Mapping des catégories API vers form (inverse de categoryFormToApi)
const categoryApiToForm = {
  // Fournitures et équipement
  OFFICE_SUPPLIES: "bureau",
  HARDWARE: "materiel",

  // Transport et déplacements
  TRAVEL: "transport",

  // Repas et hébergement
  MEALS: "repas",
  ACCOMMODATION: "hotel",

  // Communication et marketing
  MARKETING: "marketing",
  UTILITIES: "telephone",

  // Formation et développement
  TRAINING: "formation",
  SUBSCRIPTIONS: "abonnement",

  // Services professionnels
  SERVICES: "comptabilite",
  INSURANCE: "assurance",

  // Locaux et charges
  RENT: "loyer",
  MAINTENANCE: "entretien",

  // Logiciels et outils
  SOFTWARE: "logiciel",

  // Ressources humaines
  SALARIES: "salaire",

  // Fiscalité
  TAXES: "impots_taxes",
  TAXES_DUTIES: "impots_taxes",
  VAT: "tva",
  REFUNDS: "avoirs_remboursement",

  // Autres
  OTHER: "autre",

  // Revenus (pour compatibilité avec d'anciennes données)
  SALES: "ventes",
  INVESTMENTS: "autre_revenu",
  GRANTS: "subventions",
};

// Sélecteur PCG inline pour le formulaire de transaction
const pcgAccountsList = getAllPCGAccounts();

function PCGInlineSelect({ value, onChange }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = search
    ? pcgAccountsList.filter(
        (a) =>
          a.numero.includes(search) ||
          a.intitule.toLowerCase().includes(search.toLowerCase()),
      )
    : pcgAccountsList;

  const selectedLabel = value ? `${value} - ${PCG_ACCOUNTS[value] || ""}` : "";

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? (
          <>
            <code className="font-mono font-semibold text-xs bg-muted px-1 py-0.5 rounded">
              {value}
            </code>
            <span className="truncate text-muted-foreground">
              {PCG_ACCOUNTS[value] || ""}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">
            Selectionner un compte PCG...
          </span>
        )}
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-background border rounded-lg shadow-lg max-h-[250px] flex flex-col">
          <div className="p-2 border-b">
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Aucun compte
              </div>
            ) : (
              filtered.map((acc) => (
                <button
                  key={acc.numero}
                  className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer ${
                    value === acc.numero ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    onChange(acc.numero);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  <code className="font-mono text-xs min-w-[45px]">
                    {acc.numero}
                  </code>
                  <span className="truncate">{acc.intitule}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TransactionDetailDrawer({
  transaction,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onAttachReceipt,
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
  // Index du justificatif actif dans le pane preview gauche (navigation prev/next)
  const [activeReceiptIndex, setActiveReceiptIndex] = useState(0);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [calendarContainer, setCalendarContainer] = useState(null);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [receiptViewerUrl, setReceiptViewerUrl] = useState(null);
  const [receiptViewerMime, setReceiptViewerMime] = useState(null);
  const [receiptZoom, setReceiptZoom] = useState(1);
  const [receiptRotation, setReceiptRotation] = useState(0);
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

  // Hook pour délier une transaction d'une facture
  const { unlinkTransaction } = useUnlinkTransactionFromInvoice();

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
        pcgAccountNumero: "",
      });
      setIsEditMode(true);
      setPendingFiles([]);
      setActiveReceiptIndex(0);
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

      // Résoudre la catégorie du formulaire
      // Si c'est déjà une sous-catégorie fine (ex: "parking"), l'utiliser directement
      // Sinon c'est une catégorie large API (ex: "TRAVEL"), la mapper vers une sous-catégorie
      let formCategory = "";
      if (transaction.category) {
        if (categoryFormToApi[transaction.category]) {
          // Déjà une sous-catégorie fine (ex: "parking", "carburant")
          formCategory = transaction.category;
        } else if (formType === "INCOME") {
          // Catégorie large API pour un revenu — d'abord mapper vers une catégorie revenu spécifique,
          // sinon utiliser le mapping général (le CategorySearchSelect cherche dans les deux listes)
          const incomeCategoryMap = {
            SERVICES: "services",
            SUBSCRIPTIONS: "abonnements_revenus",
            SOFTWARE: "licences_revenus",
            RENT: "loyers_revenus",
            OTHER: "autre_revenu",
          };
          formCategory =
            incomeCategoryMap[transaction.category] ||
            categoryApiToForm[transaction.category] ||
            "autre_revenu";
        } else {
          // Catégorie large API pour une dépense (rétro-compatibilité)
          formCategory = categoryApiToForm[transaction.category] || "";
        }
      }

      setFormData({
        type: formType,
        amount: Math.abs(transaction.amount)?.toString() || "",
        category: formCategory,
        date: formattedDate,
        description: transaction.description || "",
        paymentMethod: formPaymentMethod,
        vendor: transaction.vendor || "",
        receiptImage: transaction.receiptImage || null,
        pcgAccountNumero: transaction.pcgAccount?.numero || "",
        status: (transaction.status || "COMPLETED").toUpperCase(),
      });
      // Les transactions bancaires s'ouvrent directement en mode édition
      const txIsBankTransaction =
        transaction.source === "BANK" ||
        transaction.source === "BANK_TRANSACTION" ||
        transaction.type === "BANK_TRANSACTION";
      setIsEditMode(txIsBankTransaction);
      setPendingFiles([]);
      setActiveReceiptIndex(0);
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

  // Catégorie en mode vue : mapper la valeur stockée vers la sous-catégorie fine
  const viewCategoryForm = (() => {
    if (!transaction?.category) return "";
    // Si c'est déjà une sous-catégorie fine
    if (categoryFormToApi[transaction.category]) return transaction.category;
    // Sinon c'est une catégorie large API → mapper vers une sous-catégorie
    if (transaction.amount > 0) {
      const incomeCategoryMap = {
        SERVICES: "services",
        SUBSCRIPTIONS: "abonnements_revenus",
        SOFTWARE: "licences_revenus",
        RENT: "loyers_revenus",
        OTHER: "autre_revenu",
      };
      return (
        incomeCategoryMap[transaction.category] ||
        categoryApiToForm[transaction.category] ||
        "autre_revenu"
      );
    }
    return categoryApiToForm[transaction.category] || "autre";
  })();

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
      // Mode édition (manuelle ou bancaire) — envoyer la sous-catégorie fine
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

  // Délier la transaction de la facture
  const handleUnlinkInvoice = async () => {
    if (!transaction?.linkedInvoiceId) return;
    setIsUnlinking(true);
    try {
      const result = await unlinkTransaction(
        transaction.id,
        transaction.linkedInvoiceId,
      );
      if (result.success) {
        toast.success("Facture détachée avec succès");
        onRefresh?.();
      } else {
        toast.error(result.error || "Erreur lors du détachement");
      }
    } catch (error) {
      console.error("Erreur lors du détachement:", error);
      toast.error("Erreur lors du détachement de la facture");
    } finally {
      setIsUnlinking(false);
    }
  };

  // Ouvrir le viewer de justificatif
  const openReceiptViewer = (url, mimetype) => {
    setReceiptViewerUrl(url);
    setReceiptViewerMime(mimetype || "");
    setReceiptZoom(1);
    setReceiptRotation(0);
    setReceiptViewerOpen(true);
  };

  // Naviguer vers la facture liée
  const handleViewLinkedInvoice = () => {
    if (transaction?.linkedInvoice?.id) {
      router.push(`/dashboard/outils/factures/${transaction.linkedInvoice.id}`);
      onOpenChange(false);
    }
  };

  // Liste complète des justificatifs (existants + pending) — passe par le pane preview gauche
  const allReceipts = (() => {
    const list = [];
    // Existants venant du backend
    const existing = transaction?.receiptFiles || [];
    for (const r of existing) {
      list.push({
        id: r.id,
        url: r.url,
        mimetype: r.mimetype || "",
        filename: r.filename || "Justificatif",
        size: r.size,
        isPending: false,
      });
    }
    // Legacy `files[]` fallback (anciens formats)
    if (
      list.length === 0 &&
      Array.isArray(transaction?.files) &&
      transaction.files.length > 0
    ) {
      for (const f of transaction.files) {
        list.push({
          id: f.id,
          url: f.url,
          mimetype: f.mimetype || "",
          filename: f.originalFilename || f.filename || "Justificatif",
          size: f.size,
          isPending: false,
        });
      }
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
  const activeReceipt =
    allReceipts.length > 0
      ? allReceipts[Math.min(activeReceiptIndex, allReceipts.length - 1)]
      : null;
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
  const currentCategoryKey = isEditingForm
    ? categoryFormToApi[formData.category] || "OTHER"
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onClick={() => onOpenChange(false)}
      />

      {/* Backdrop sombre + preview à gauche — uniquement si un justificatif est attaché ou en upload */}
      {(activeReceipt?.url || isUploading) && (
        <>
          <motion.div
            className="fixed inset-y-0 left-0 md:right-[500px] right-0 z-40 bg-black/60"
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
            <div className="absolute inset-0 flex items-start justify-center overflow-y-auto py-4 md:py-12 px-2 md:px-24">
              {isUploading ? (
                <div className="flex items-center justify-center w-full min-h-[calc(100%-4rem)] pointer-events-auto">
                  <Loader2 className="h-10 w-10 animate-spin text-white/80" />
                </div>
              ) : (
                <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white pointer-events-auto overflow-hidden shadow-2xl">
                  {activeReceiptIsPdf ? (
                    <iframe
                      src={`${activeReceipt.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
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
              )}
            </div>

            {/* Navigation prev/next + indicateur N/total — seulement si > 1 justificatif */}
            {allReceipts.length > 1 && !isUploading && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-[calc((100%-500px)/2)] md:translate-x-[-50%] z-[60] flex items-center gap-2 px-3 py-2 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-medium pointer-events-auto shadow-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/15 hover:text-white rounded-full"
                  disabled={activeReceiptIndex === 0}
                  onClick={() =>
                    setActiveReceiptIndex((i) => Math.max(0, i - 1))
                  }
                  title="Précédent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="tabular-nums select-none">
                  {activeReceiptIndex + 1} / {allReceipts.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/15 hover:text-white rounded-full"
                  disabled={activeReceiptIndex >= allReceipts.length - 1}
                  onClick={() =>
                    setActiveReceiptIndex((i) =>
                      Math.min(allReceipts.length - 1, i + 1),
                    )
                  }
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
        animate={{ x: isMobile && !showMobileDetails ? "100%" : 0 }}
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
            {/* Mode création ou édition manuelle: Type de transaction
                  (tabs style de la table transactions, sans label "Type") */}
            {isEditingForm && (
              <div className="border-b border-[#eeeff1] dark:border-[#232323] pt-2 pb-[9px] transaction-tabs">
                <style>{`
                    .transaction-tabs [data-slot="tabs-trigger"][data-state="active"] {
                      text-shadow: 0.015em 0 currentColor, -0.015em 0 currentColor;
                    }
                  `}</style>
                <Tabs
                  value={formData.type}
                  onValueChange={handleChange("type")}
                >
                  <TabsList className="h-auto rounded-none bg-transparent p-0 w-full justify-start gap-1.5">
                    <TabsTrigger
                      value="EXPENSE"
                      className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
                    >
                      Dépense
                    </TabsTrigger>
                    <TabsTrigger
                      value="INCOME"
                      className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
                    >
                      Revenu
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

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

                  {/* Montant — input bg gris sans border/shadow, € à droite */}
                  {isEditingForm ? (
                    <div className="inline-flex items-baseline gap-2 px-3 py-1.5 rounded-lg bg-muted/60 w-fit">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleChange("amount")(e.target.value)}
                        className="text-2xl font-medium h-auto py-0 px-0 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:border-0 field-sizing-content min-w-[2ch] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                      />
                      <span className="text-2xl font-medium text-muted-foreground">
                        €
                      </span>
                    </div>
                  ) : (
                    <p className="text-2xl font-medium">
                      {formatAmount(transaction?.amount)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Compte PCG */}
            <div className="space-y-2">
              <p className="text-sm font-normal text-muted-foreground">
                Compte PCG
              </p>
              {isEditingForm ? (
                <PCGInlineSelect
                  value={formData.pcgAccountNumero}
                  onChange={handleChange("pcgAccountNumero")}
                />
              ) : (
                <div className="px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors duration-[120ms] text-sm">
                  {transaction?.pcgAccount?.numero ? (
                    <span>
                      <code className="font-mono font-semibold bg-background border border-border/60 px-1.5 py-0.5 rounded text-xs">
                        {transaction.pcgAccount.numero}
                      </code>{" "}
                      <span className="text-muted-foreground">
                        {transaction.pcgAccount.intitule}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Non affecte</span>
                  )}
                </div>
              )}
            </div>

            {/* Fournisseur */}
            <div className="space-y-3">
              <p className="text-sm font-normal text-muted-foreground">
                {formData.type === "INCOME"
                  ? "Source du revenu"
                  : "Fournisseur"}
              </p>
              {isEditingForm ? (
                <Input
                  value={formData.vendor}
                  onChange={(e) => handleChange("vendor")(e.target.value)}
                  placeholder={
                    formData.type === "INCOME"
                      ? "Client / Source"
                      : "Nom du fournisseur"
                  }
                  className="w-full"
                />
              ) : (
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
              )}
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
                  {isEditingForm ? (
                    <DatePicker
                      value={formData.date ? parseDate(formData.date) : null}
                      onChange={(date) => {
                        if (date) handleChange("date")(date.toString());
                      }}
                      className="w-40"
                    >
                      <div className="flex">
                        <Group className="w-full pointer-events-none">
                          <DateInput className="h-8 rounded-[9px] pe-9 ps-2.5 py-0 text-sm border-none shadow-none bg-transparent hover:bg-[rgba(0,0,0,0.04)] dark:bg-[#171717] dark:hover:bg-[#222] [box-shadow:rgba(255,255,255,0)_0_0_0_1px_inset,rgba(28,40,64,0.18)_0_0_2px_0,rgba(24,41,75,0.04)_0_1px_3px_0] dark:[box-shadow:rgba(255,255,255,0.08)_0_0_0_1px_inset,rgba(255,255,255,0.1)_0_0_2px_0,rgba(0,0,0,0.2)_0_1px_3px_0] data-focus-within:ring-0 data-focus-within:border-none" />
                        </Group>
                        <RACButton className="z-10 -ms-8 -me-px flex w-8 h-8 items-center justify-center rounded-e-[9px] text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground pointer-events-auto">
                          <CalendarIcon size={14} />
                        </RACButton>
                      </div>
                      <RACPopover
                        className="z-[100] rounded-lg border bg-background text-popover-foreground shadow-lg outline-hidden"
                        offset={4}
                        UNSTABLE_portalContainer={calendarContainer}
                      >
                        <Dialog className="max-h-[inherit] overflow-auto p-2">
                          <Calendar />
                        </Dialog>
                      </RACPopover>
                    </DatePicker>
                  ) : (
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(transaction?.date)}
                    </span>
                  )}
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
                  {isEditingForm ? (
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={handleChange("paymentMethod")}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CARD">Carte</SelectItem>
                        <SelectItem value="TRANSFER">Virement</SelectItem>
                        <SelectItem value="CASH">Espèces</SelectItem>
                        <SelectItem value="CHECK">Chèque</SelectItem>
                        <SelectItem value="DIRECT_DEBIT">
                          Prélèvement
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm font-medium text-foreground">
                      {paymentMethodLabels[transaction?.paymentMethod] ||
                        "Non spécifié"}
                    </span>
                  )}
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
                    {isEditingForm ? (
                      <Select
                        value={formData.status}
                        onValueChange={handleChange("status")}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMPLETED">
                            {formData.type === "INCOME" ? "Encaissée" : "Payée"}
                          </SelectItem>
                          <SelectItem value="PENDING">En attente</SelectItem>
                          <SelectItem value="CANCELLED">Annulée</SelectItem>
                          <SelectItem value="REFUNDED">Remboursée</SelectItem>
                          <SelectItem value="FAILED">Échouée</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : transaction?.status === "PAID" ||
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

              {/* Liste des justificatifs attachés — clic pour activer dans le preview à gauche */}
              {allReceipts.length > 0 && (
                <div className="space-y-1.5">
                  {allReceipts.map((rcpt, idx) => {
                    const isImg = (rcpt.mimetype || "").startsWith("image/");
                    const formatFileSize = (bytes) => {
                      if (!bytes) return "";
                      if (bytes < 1024) return `${bytes} B`;
                      if (bytes < 1024 * 1024)
                        return `${Math.round(bytes / 1024)} KB`;
                      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                    };
                    const isActive = idx === activeReceiptIndex;
                    return (
                      <div
                        key={rcpt.id || `pending-${idx}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-[120ms] ${
                          isActive
                            ? "bg-muted/70 ring-1 ring-border"
                            : "bg-muted/40 hover:bg-muted/60"
                        }`}
                        onClick={() => setActiveReceiptIndex(idx)}
                      >
                        <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {isImg ? (
                            <PreviewImage
                              src={rcpt.url}
                              alt=""
                              className="h-full w-full object-cover rounded-md"
                              containerClassName="h-full w-full"
                            />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {rcpt.filename}
                          </p>
                          {rcpt.size && (
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(rcpt.size)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveReceiptFile(rcpt);
                            setActiveReceiptIndex(0);
                          }}
                          title="Retirer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
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

            {/* Section Facture liée (seulement si une facture est liée) */}
            {!isCreateMode && transaction?.linkedInvoice && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-normal text-muted-foreground">
                      Facture liée
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                    <Link2 className="w-3 h-3" />
                    Rapprochée
                  </span>
                </div>

                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          Facture {transaction.linkedInvoice.number || "N/A"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                          {transaction.linkedInvoice.status === "COMPLETED" && (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {transaction.linkedInvoice.status === "PENDING" && (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {transaction.linkedInvoice.status === "COMPLETED"
                            ? "Payée"
                            : transaction.linkedInvoice.status === "PENDING"
                              ? "En attente"
                              : transaction.linkedInvoice.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {transaction.linkedInvoice.clientName}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          {formatAmount(transaction.linkedInvoice.totalTTC)}
                        </span>
                        {transaction.linkedInvoice.dueDate && (
                          <>
                            <span>•</span>
                            <span>
                              Échéance:{" "}
                              {formatDate(transaction.linkedInvoice.dueDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleViewLinkedInvoice}
                        title="Voir la facture"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={handleUnlinkInvoice}
                        disabled={isReadOnly || isUnlinking}
                        title={readOnlyTooltip || "Détacher la facture"}
                      >
                        {isUnlinking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Date de rapprochement */}
                {transaction.reconciliationDate && (
                  <p className="text-xs text-muted-foreground text-center">
                    Rapprochée le {formatDate(transaction.reconciliationDate)}
                  </p>
                )}
              </div>
            )}

            {/* Indicateur de statut de rapprochement (si pas de facture liée mais statut pertinent) */}
            {!isCreateMode &&
              !transaction?.linkedInvoice &&
              transaction?.reconciliationStatus &&
              transaction.reconciliationStatus !== "UNMATCHED" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-normal text-muted-foreground">
                      Rapprochement
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {transaction.reconciliationStatus === "SUGGESTED" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                        <AlertCircle className="w-3 h-3" />
                        Suggestion en attente
                      </span>
                    )}
                    {transaction.reconciliationStatus === "IGNORED" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                        Ignorée
                      </span>
                    )}
                  </div>
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

      {/* Viewer plein écran pour le justificatif */}
      <RadixDialog open={receiptViewerOpen} onOpenChange={setReceiptViewerOpen}>
        <RadixDialogContent
          className="max-w-[95vw] max-h-[95vh] w-full h-[90vh] p-0 overflow-hidden flex flex-col sm:max-w-[95vw]"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <RadixDialogTitle>Justificatif</RadixDialogTitle>
          </VisuallyHidden>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur-sm shrink-0">
            <span className="text-sm font-medium">Justificatif</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setReceiptZoom((z) => Math.max(0.25, z - 0.25))}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                title="Dézoomer"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {Math.round(receiptZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setReceiptZoom((z) => Math.min(4, z + 0.25))}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                title="Zoomer"
              >
                <ZoomIn size={16} />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button
                type="button"
                onClick={() => setReceiptRotation((r) => (r + 90) % 360)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                title="Pivoter"
              >
                <RotateCw size={16} />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button
                type="button"
                onClick={() => setReceiptViewerOpen(false)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                title="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {/* Document viewer */}
          <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center">
            {receiptViewerMime === "application/pdf" ? (
              <iframe
                src={receiptViewerUrl}
                className="w-full h-full"
                title="Justificatif"
                style={{
                  transform: `scale(${receiptZoom}) rotate(${receiptRotation}deg)`,
                  transformOrigin: "center center",
                }}
              />
            ) : (
              <PreviewImage
                src={receiptViewerUrl}
                alt="Justificatif"
                className="max-w-none transition-transform duration-200"
                containerClassName="flex items-center justify-center w-full h-full"
                loaderSize="h-8 w-8"
                draggable={false}
                style={{
                  transform: `scale(${receiptZoom}) rotate(${receiptRotation}deg)`,
                  transformOrigin: "center center",
                }}
              />
            )}
          </div>
        </RadixDialogContent>
      </RadixDialog>
    </>
  );
}
