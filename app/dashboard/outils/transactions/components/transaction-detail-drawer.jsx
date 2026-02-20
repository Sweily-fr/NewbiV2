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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Popover as RACPopover,
} from "react-aria-components";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
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
  ChevronDown,
  Check,
  Save,
  Plus,
  Link2,
  Unlink,
  ExternalLink,
} from "lucide-react";
import {
  formatDateToFrench,
  formatDateTimeToFrench,
} from "@/src/utils/dateFormatter";
import { findMerchant } from "@/lib/merchants-config";
import { getCategoryConfig, CATEGORY_CONFIG } from "@/lib/category-icons-config";
import { toast } from "@/src/components/ui/sonner";
import { UPDATE_TRANSACTION } from "@/src/graphql/queries/banking";
import { Calendar } from "@/src/components/ui/calendar-rac";
import { DateInput } from "@/src/components/ui/datefield-rac";
import CategorySearchSelect from "./category-search-select";
import { useUnlinkTransactionFromInvoice } from "@/src/hooks/useReconciliationGraphQL";
import { useRouter } from "next/navigation";

// Liste des catégories disponibles pour la sélection
const categoryOptions = Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
  value: key,
  label: config.label,
  icon: config.icon,
  color: config.color,
}));

const paymentMethodIcons = {
  CARD: CreditCard,
  CREDIT_CARD: CreditCard,
  CASH: Banknote,
  TRANSFER: Building2,
  CHECK: FileText,
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
  PENDING: "En attente",
  DRAFT: "Brouillon",
  CANCELLED: "Annulée",
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
  ventes: "SALES",
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
  subventions: "GRANTS",
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

  // Revenus (pour compatibilité)
  SALES: "ventes",
  INVESTMENTS: "investissements",
  GRANTS: "subventions",
};

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
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [calendarContainer, setCalendarContainer] = useState(null);
  const prevOpenRef = useRef(false);
  const fileInputRef = useRef(null);

  // Hook pour délier une transaction d'une facture
  const { unlinkTransaction } = useUnlinkTransactionFromInvoice();

  // État du formulaire pour création/édition
  const [formData, setFormData] = useState({
    type: "EXPENSE",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    paymentMethod: "CARD",
    vendor: "",
    receiptImage: null,
  });

  // Déterminer le mode
  const isCreateMode = isCreating || !transaction;
  const isBankTransaction = transaction && (
    transaction.source === "BANK" ||
    transaction.source === "BANK_TRANSACTION" ||
    transaction.type === "BANK_TRANSACTION"
  );
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
        date: new Date().toISOString().split("T")[0],
        description: "",
        paymentMethod: "CARD",
        vendor: "",
        receiptImage: null,
      });
      setIsEditMode(true);
      setPreviewUrl(null);
      setSelectedFile(null);
    } else if (transaction) {
      // Mode visualisation/édition: pré-remplir avec les données
      let formattedDate = new Date().toISOString().split("T")[0];
      if (transaction.date) {
        if (typeof transaction.date === "object" && transaction.date.$date) {
          formattedDate = new Date(transaction.date.$date).toISOString().split("T")[0];
        } else if (typeof transaction.date === "string") {
          if (transaction.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = transaction.date;
          } else {
            const parsedDate = new Date(transaction.date);
            if (!isNaN(parsedDate.getTime())) {
              formattedDate = parsedDate.toISOString().split("T")[0];
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
        DIRECT_DEBIT: "TRANSFER",
        SEPA_DEBIT: "TRANSFER",
      };
      const formPaymentMethod = apiPaymentMethodToForm[transaction.paymentMethod] || "CARD";

      setFormData({
        type: transaction.type || "EXPENSE",
        amount: Math.abs(transaction.amount)?.toString() || "",
        category: categoryApiToForm[transaction.category] || "",
        date: formattedDate,
        description: transaction.description || "",
        paymentMethod: formPaymentMethod,
        vendor: transaction.vendor || "",
        receiptImage: transaction.receiptImage || null,
      });
      setIsEditMode(false);
      setPreviewUrl(transaction.receiptFile?.url || transaction.receiptImage || null);
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

  // Gérer le changement de catégorie (pour transactions bancaires)
  const handleCategoryChange = async (newCategory) => {
    const transactionId = transaction?.originalTransaction?.id || transaction?.id;

    if (!transactionId || newCategory === transaction?.category) {
      setIsCategoryOpen(false);
      return;
    }

    setIsUpdatingCategory(true);
    try {
      await updateTransaction({
        variables: {
          id: transactionId,
          input: { category: newCategory },
        },
      });
    } finally {
      setIsUpdatingCategory(false);
      setIsCategoryOpen(false);
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
      // Mode création
      const submissionData = {
        ...formData,
        category: categoryFormToApi[formData.category] || formData.category,
        amount: parseFloat(formData.amount) || 0,
      };
      onSubmit?.(submissionData);
      onOpenChange(false);
    } else if (isManualTransaction && isEditMode) {
      // Mode édition manuelle
      const submissionData = {
        ...formData,
        category: categoryFormToApi[formData.category] || formData.category,
        amount: parseFloat(formData.amount) || 0,
        id: transaction.id,
      };
      onSubmit?.(submissionData);
      setIsEditMode(false);
    }
  };

  // Gérer l'upload de fichier
  const handleFileUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG, WebP ou PDF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux. Maximum 10 Mo.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    if (!isCreateMode && onAttachReceipt) {
      setIsUploading(true);
      try {
        await onAttachReceipt(transaction, file);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Délier la transaction de la facture
  const handleUnlinkInvoice = async () => {
    if (!transaction?.linkedInvoiceId) return;
    setIsUnlinking(true);
    try {
      const result = await unlinkTransaction(transaction.id, transaction.linkedInvoiceId);
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

  // Naviguer vers la facture liée
  const handleViewLinkedInvoice = () => {
    if (transaction?.linkedInvoice?.id) {
      router.push(`/dashboard/outils/factures/${transaction.linkedInvoice.id}`);
      onOpenChange(false);
    }
  };

  // Utilitaires
  const hasReceipt = transaction?.hasReceipt ||
    (transaction?.files && transaction.files.length > 0) ||
    !!transaction?.receiptFile?.url ||
    !!previewUrl;

  const formatDate = (dateInput, includeTime = false) => {
    if (!dateInput) return "Non spécifiée";
    if (typeof dateInput === "object" && dateInput.$date) {
      dateInput = dateInput.$date;
    }
    return includeTime ? formatDateTimeToFrench(dateInput) : formatDateToFrench(dateInput);
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
    if (transaction?.paymentMethod && transactionTypeLabels[transaction.paymentMethod]) {
      return transactionTypeLabels[transaction.paymentMethod];
    }
    if (transaction?.operationType) {
      const op = transaction.operationType.toLowerCase();
      if (op.includes("card") || op.includes("carte")) return "Paiement par carte";
      if (op.includes("transfer") || op.includes("virement")) return "Virement";
      if (op.includes("debit") || op.includes("prelevement") || op.includes("prélèvement")) return "Prélèvement";
    }
    if (isBankTransaction) return "Transaction bancaire";
    return "Transaction manuelle";
  };

  // Récupérer les infos visuelles
  // L'icône doit être réactive aux changements de catégorie en mode création ET édition
  const isEditingForm = isCreateMode || (isManualTransaction && isEditMode);
  const currentCategoryKey = isEditingForm
    ? (categoryFormToApi[formData.category] || "OTHER")
    : (transaction?.category || "OTHER");
  const categoryConfig = getCategoryConfig(currentCategoryKey);
  const CategoryIcon = categoryConfig.icon;
  const PaymentIcon = paymentMethodIcons[
    isEditingForm ? formData.paymentMethod : transaction?.paymentMethod
  ] || CreditCard;
  const merchant = !isCreateMode ? findMerchant(
    transaction?.vendor || transaction?.description || transaction?.title
  ) : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="w-full h-full md:w-[500px] md:max-w-[500px] md:min-w-[500px] md:h-auto"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Portal container for calendar popover (must render inside drawer to avoid vaul dismiss layer) */}
        <div ref={setCalendarContainer} />

        {/* Header */}
        <DrawerHeader className="flex flex-row items-center justify-between px-6 py-4 border-b space-y-0">
          <div className="flex items-center gap-2">
            <DrawerTitle className="text-base font-medium">
              {getDrawerTitle()}
            </DrawerTitle>
            {!isCreateMode && isBankTransaction && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                Bancaire
              </span>
            )}
            {isCreateMode && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <Plus className="w-3 h-3" />
                Nouvelle
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

            {/* Mode création ou édition manuelle: Type de transaction */}
            {(isCreateMode || (isManualTransaction && isEditMode)) && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-muted-foreground">Type</span>
                  <Tabs value={formData.type} onValueChange={handleChange("type")}>
                    <TabsList>
                      <TabsTrigger value="EXPENSE">Dépense</TabsTrigger>
                      <TabsTrigger value="INCOME">Revenu</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <Separator />
              </>
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
                  {(isCreateMode || (isManualTransaction && isEditMode)) ? (
                    <div className="mb-1">
                      <CategorySearchSelect
                        value={formData.category}
                        onValueChange={handleChange("category")}
                        type={formData.type}
                      />
                    </div>
                  ) : (
                    <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                      <PopoverTrigger asChild>
                        <button
                          className="flex items-center gap-1 text-xs text-muted-foreground font-normal hover:text-foreground transition-colors group"
                          disabled={isUpdatingCategory}
                        >
                          {isUpdatingCategory ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              {categoryConfig.label}
                              <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher une catégorie..." />
                          <CommandList>
                            <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                            <CommandGroup>
                              {categoryOptions.map((option) => {
                                const OptionIcon = option.icon;
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    keywords={[option.label]}
                                    onSelect={() => handleCategoryChange(option.value)}
                                    className="flex items-center gap-2"
                                  >
                                    <div
                                      className="h-6 w-6 rounded-full flex items-center justify-center"
                                      style={{ backgroundColor: `${option.color}15` }}
                                    >
                                      <OptionIcon
                                        className="h-3 w-3"
                                        style={{ color: option.color }}
                                      />
                                    </div>
                                    <span className="flex-1">{option.label}</span>
                                    {transaction?.category === option.value && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* Montant */}
                  {(isCreateMode || (isManualTransaction && isEditMode)) ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleChange("amount")(e.target.value)}
                        className="text-2xl font-medium h-auto py-1 w-32"
                        placeholder="0.00"
                      />
                      <span className="text-2xl font-medium text-muted-foreground">€</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-medium">
                      {formatAmount(transaction?.amount)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Fournisseur */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                {formData.type === "INCOME" ? "Source du revenu" : "Fournisseur"}
              </p>
              {(isCreateMode || (isManualTransaction && isEditMode)) ? (
                <Input
                  value={formData.vendor}
                  onChange={(e) => handleChange("vendor")(e.target.value)}
                  placeholder={formData.type === "INCOME" ? "Client / Source" : "Nom du fournisseur"}
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
                      {transaction?.vendor || merchant?.name || transaction?.title || "Fournisseur non spécifié"}
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

            <Separator />

            {/* Informations */}
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                Informations
              </p>

              {/* Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-normal text-muted-foreground">Date</span>
                </div>
                {(isCreateMode || (isManualTransaction && isEditMode)) ? (
                  <DatePicker
                    value={formData.date ? parseDate(formData.date) : null}
                    onChange={(date) => {
                      if (date) handleChange("date")(date.toString());
                    }}
                    className="w-40"
                  >
                    <div className="flex">
                      <Group className="w-full">
                        <DateInput className="pe-9 text-sm" />
                      </Group>
                      <RACButton className="z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground">
                        <CalendarIcon size={16} />
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
                  <span className="text-sm font-normal">
                    {formatDate(transaction?.date)}
                  </span>
                )}
              </div>

              {/* Moyen de paiement */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-normal text-muted-foreground">Paiement</span>
                </div>
                {(isCreateMode || (isManualTransaction && isEditMode)) ? (
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
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm font-normal">
                    {paymentMethodLabels[transaction?.paymentMethod] || "Non spécifié"}
                  </span>
                )}
              </div>

              {/* Statut (seulement en mode visualisation pour les transactions bancaires) */}
              {!isCreateMode && isBankTransaction && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal text-muted-foreground">Statut</span>
                  </div>
                  {transaction?.status === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      {statusLabels[transaction.status] || "Payée"}
                    </span>
                  ) : transaction?.status === "PENDING" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20">
                      <AlertCircle className="w-3 h-3" />
                      {statusLabels[transaction.status] || "En attente"}
                    </span>
                  ) : transaction?.status === "CANCELLED" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal text-muted-foreground">Source</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <Landmark className="w-3 h-3" />
                    Banque
                  </span>
                </div>
              )}

              {/* Utilisateur créateur */}
              {!isCreateMode && transaction?.createdBy && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal text-muted-foreground">Créé par</span>
                  </div>
                  <span className="text-sm font-medium">
                    {transaction.createdBy.name || transaction.createdBy.email || "Utilisateur"}
                  </span>
                </div>
              )}
            </div>

            {/* Description (mode création/édition) */}
            {(isCreateMode || (isManualTransaction && isEditMode)) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Description
                  </p>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description")(e.target.value)}
                    placeholder="Description de la transaction"
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Section Justificatif */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Justificatif
                </p>
                {!isCreateMode && (
                  hasReceipt ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Attaché
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3" />
                      Manquant
                    </span>
                  )
                )}
              </div>

              {/* Zone d'upload */}
              {(isCreateMode || !hasReceipt) && (
                <div
                  className={`relative border-1 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                    dragActive
                      ? "border-[#5A50FF] bg-[#5A50FF]/5"
                      : "border-muted-foreground/25 hover:border-[#5A50FF]/50 hover:bg-muted/30"
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
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    disabled={isUploading}
                  />
                  <div className="flex flex-col items-center gap-2 text-center">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-8 w-8 text-[#5A50FF] animate-spin" />
                        <p className="text-sm font-normal text-muted-foreground">Upload en cours...</p>
                      </>
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Glissez votre reçu ici</p>
                          <p className="text-xs text-muted-foreground">
                            ou cliquez pour sélectionner (JPG, PNG, PDF - max 10 Mo)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Preview du fichier uploadé (mode création) */}
              {isCreateMode && previewUrl && (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
                    onClick={() => window.open(previewUrl, "_blank")}
                  >
                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                      {selectedFile?.type === "application/pdf" ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                      ) : (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-normal truncate">{selectedFile?.name || "Justificatif"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewUrl(null);
                        setSelectedFile(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Afficher le receiptFile existant */}
              {!isCreateMode && transaction?.receiptFile?.url && (
                <div className="space-y-2">
                  {(() => {
                    const file = transaction.receiptFile;
                    const isImage = file.mimetype?.startsWith("image/");

                    const formatFileSize = (bytes) => {
                      if (!bytes) return "";
                      if (bytes < 1024) return `${bytes} B`;
                      if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
                      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                    };

                    return (
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        <div className="flex-shrink-0">
                          {isImage ? (
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                              <img src={file.url} alt={file.filename || "Justificatif"} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-normal truncate">{file.filename || "Justificatif"}</p>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement("a");
                            link.href = file.url;
                            link.download = file.filename || "justificatif";
                            link.target = "_blank";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Fichiers existants (ancien système) */}
              {!isCreateMode && transaction?.files && transaction.files.length > 0 && (
                <div className="space-y-2">
                  {transaction.files.map((file, index) => {
                    const isImage = file.mimetype?.startsWith("image/");
                    const formatFileSize = (bytes) => {
                      if (!bytes) return "";
                      if (bytes < 1024) return `${bytes} B`;
                      if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
                      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                    };

                    return (
                      <div
                        key={file.id || index}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        <div className="flex-shrink-0">
                          {isImage ? (
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                              <img src={file.url} alt={file.originalFilename || "Justificatif"} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-normal truncate">
                            {file.originalFilename || file.filename || `Fichier ${index + 1}`}
                          </p>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement("a");
                            link.href = file.url;
                            link.download = file.originalFilename || file.filename || `fichier-${index + 1}`;
                            link.target = "_blank";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes (seulement en visualisation) */}
            {!isCreateMode && transaction?.notes && transaction.notes !== "[EXPENSE]" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">Notes</p>
                  <p className="text-sm font-normal text-foreground">{transaction.notes}</p>
                </div>
              </>
            )}

            {/* Section Facture liée (seulement si une facture est liée) */}
            {!isCreateMode && transaction?.linkedInvoice && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                        Facture liée
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
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
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                              transaction.linkedInvoice.status === "COMPLETED"
                                ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                : transaction.linkedInvoice.status === "PENDING"
                                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                  : "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"
                            }`}
                          >
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
                          <span>{formatAmount(transaction.linkedInvoice.totalTTC)}</span>
                          {transaction.linkedInvoice.dueDate && (
                            <>
                              <span>•</span>
                              <span>Échéance: {formatDate(transaction.linkedInvoice.dueDate)}</span>
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
                          disabled={isUnlinking}
                          title="Détacher la facture"
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
              </>
            )}

            {/* Indicateur de statut de rapprochement (si pas de facture liée mais statut pertinent) */}
            {!isCreateMode && !transaction?.linkedInvoice && transaction?.reconciliationStatus &&
             transaction.reconciliationStatus !== "UNMATCHED" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                      Rapprochement
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {transaction.reconciliationStatus === "SUGGESTED" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
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
              </>
            )}

            {/* Dates de création/modification */}
            {!isCreateMode && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-normal text-muted-foreground">Créée le</span>
                    <span className="text-xs font-normal">{formatDate(transaction?.createdAt, true)}</span>
                  </div>
                  {transaction?.updatedAt && transaction.updatedAt !== transaction.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-normal text-muted-foreground">Modifiée le</span>
                      <span className="text-xs font-normal">{formatDate(transaction.updatedAt, true)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <DrawerFooter className="border-t px-6 py-4">
          {isCreateMode ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-normal"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 font-normal bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          ) : isManualTransaction ? (
            isEditMode ? (
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
                  onClick={handleSubmit}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
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
                <Button
                  variant="outline"
                  className="flex-1 font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDelete?.(transaction)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Cliquez sur la catégorie pour la modifier
              </p>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
