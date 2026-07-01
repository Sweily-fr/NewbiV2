"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "@/src/components/ui/sonner";
import { TransactionDetailDrawer } from "../transaction-detail-drawer";
import { PurchaseInvoiceDetailDrawer } from "../../../factures-achat/components/detail-drawer";
import { ReceiptUploadDrawer } from "../receipt-upload-drawer";
import { ExportDialog } from "../export-dialog";
import {
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useDeleteMultipleExpenses,
  useAddExpenseFile,
} from "@/src/hooks/useExpenses";
import {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/src/hooks/useTransactions";
import { useMutation } from "@apollo/client";
import { UPLOAD_TRANSACTION_RECEIPT } from "@/src/graphql/queries/banking";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { useSession } from "@/src/lib/auth-client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { usePromoteTemporaryFile } from "@/src/hooks/usePromoteTemporaryFile";
import { usePersistentColumnVisibility } from "@/src/hooks/usePersistentColumnVisibility";

import { columns } from "./columns/transactionColumns";
import { multiColumnFilterFn } from "./filters/multiColumnFilterFn";
import { mapCategoryToEnum, mapPaymentMethodToEnum } from "./utils/mappers";
import { MobileToolbar } from "./components/MobileToolbar";
import { MobileTable } from "./components/MobileTable";
import { TableEmptyState } from "@/src/components/ui/table-empty-state";
import { ChartIcon } from "@/src/components/icons";
import { formatLocalDate } from "@/src/utils/dateFormatter";
import { PCGSelectDialog } from "../pcg-select-dialog";

// UI Components
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/src/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Checkbox } from "@/src/components/ui/checkbox";
import { cn } from "@/src/lib/utils";
import {
  TagIcon,
  WalletIcon,
  Wallet1Icon,
  GraphIcon,
  DollarSquareIcon,
  Link2Icon,
  SortIcon as ListFilterIcon,
  Setting4Icon,
} from "@/src/components/icons";
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
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { AnimatePresence } from "framer-motion";
import {
  Search,
  TrashIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleXIcon,
  Settings2,
  Filter,
  Plus,
  X,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Label } from "@/src/components/ui/label";
import { Calendar } from "@/src/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function TransactionTable({
  expenses: expensesProp = [],
  loading: loadingProp = false,
  refetchExpenses: refetchExpensesProp,
  initialTransactionId = null,
  openOcr = false,
  triggerAddManual = false,
  onAddManualTriggered,
  triggerAddOcr = false,
  onAddOcrTriggered,
  bankAccounts = [],
  initialTab = null,
}) {
  const id = useId();

  // Onglet initial déduit de l'URL (?filter=... depuis le dashboard).
  // "unmatched" (lien "Rapprochements à faire") → onglet "À rapprocher".
  const FILTER_TO_TAB = {
    unmatched: "toReconcile",
    toReconcile: "toReconcile",
    lastMonth: "lastMonth",
    missingReceipt: "missingReceipt",
  };
  const resolvedInitialTab = FILTER_TO_TAB[initialTab] || "all";
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const inputRef = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [expenseTypeFilter, setExpenseTypeFilter] = useState(null);
  const [assignedMemberFilter, setAssignedMemberFilter] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  // Affichage unifié : drawer de détail d'une facture d'achat ouverte depuis
  // la liste des transactions (lignes sourceKind === "PURCHASE_INVOICE").
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState(null);
  const [isPIDrawerOpen, setIsPIDrawerOpen] = useState(false);
  const [isAddTransactionDrawerOpen, setIsAddTransactionDrawerOpen] =
    useState(false);
  const [isReceiptUploadDrawerOpen, setIsReceiptUploadDrawerOpen] =
    useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState(resolvedInitialTab);
  const [isMobileScrolled, setIsMobileScrolled] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [pcgTransaction, setPcgTransaction] = useState(null);
  const [isPCGDialogOpen, setIsPCGDialogOpen] = useState(false);

  const handleEditPCG = useCallback((transaction) => {
    setPcgTransaction(transaction);
    setIsPCGDialogOpen(true);
  }, []);

  // Options de filtres disponibles
  const filterOptions = [
    { value: "category", label: "Catégorie" },
    { value: "paymentMethod", label: "Méthode de paiement" },
    { value: "source", label: "Source" },
    { value: "amount", label: "Montant" },
    { value: "date", label: "Date" },
  ];

  // Valeurs possibles pour chaque filtre
  const filterValues = {
    category: [
      { value: "TRAVEL", label: "Transport" },
      { value: "MEALS", label: "Repas" },
      { value: "OFFICE_SUPPLIES", label: "Fournitures" },
      { value: "SERVICES", label: "Services" },
      { value: "SOFTWARE", label: "Logiciels" },
      { value: "MARKETING", label: "Marketing" },
      { value: "OTHER", label: "Autre" },
    ],
    paymentMethod: [
      { value: "CARD", label: "Carte" },
      { value: "BANK_TRANSFER", label: "Virement" },
      { value: "CASH", label: "Espèces" },
      { value: "CHECK", label: "Chèque" },
      { value: "DIRECT_DEBIT", label: "Prélèvement" },
    ],
    source: [
      { value: "BANK", label: "Bancaire" },
      { value: "MANUAL", label: "Manuel" },
      { value: "OCR", label: "OCR" },
    ],
  };

  // Ajouter un nouveau filtre
  const addFilter = () => {
    setAdvancedFilters([
      ...advancedFilters,
      { id: Date.now(), field: "category", operator: "includes", value: "" },
    ]);
  };

  // Supprimer un filtre
  const removeFilter = (filterId) => {
    setAdvancedFilters(advancedFilters.filter((f) => f.id !== filterId));
  };

  // Mettre à jour un filtre
  const updateFilter = (filterId, key, value) => {
    setAdvancedFilters(
      advancedFilters.map((f) => {
        if (f.id !== filterId) return f;
        const updated = { ...f, [key]: value };
        // Passage vers un filtre date → initialiser startDate/endDate
        if (key === "field" && value === "date") {
          updated.operator = "between";
          updated.value = "";
          updated.startDate = "";
          updated.endDate = "";
        }
        // Passage depuis un filtre date vers autre chose → nettoyer
        if (key === "field" && f.field === "date" && value !== "date") {
          delete updated.startDate;
          delete updated.endDate;
          updated.operator = "includes";
          updated.value = "";
        }
        return updated;
      }),
    );
  };

  // Mettre à jour la plage de dates (début + fin) en une seule fois
  const updateFilterRange = (filterId, startDate, endDate) => {
    setAdvancedFilters(
      advancedFilters.map((f) =>
        f.id === filterId ? { ...f, startDate, endDate } : f,
      ),
    );
  };

  // Supprimer tous les filtres
  const clearAllFilters = () => {
    setAdvancedFilters([]);
  };

  // Réagir aux triggers depuis le header de la page
  useEffect(() => {
    if (triggerAddManual) {
      setIsAddTransactionDrawerOpen(true);
      onAddManualTriggered?.();
    }
  }, [triggerAddManual, onAddManualTriggered]);

  useEffect(() => {
    if (triggerAddOcr) {
      setIsReceiptUploadDrawerOpen(true);
      onAddOcrTriggered?.();
    }
  }, [triggerAddOcr, onAddOcrTriggered]);

  const { getAllCollaborators } = useOrganizationInvitations();
  const { organization: activeOrg } = useActiveOrganization();
  const { workspaceId } = useRequiredWorkspace();
  const { data: session } = useSession();
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Mutation pour upload de justificatif
  const [uploadReceiptMutation] = useMutation(UPLOAD_TRANSACTION_RECEIPT);

  const currentUser = session?.user;

  useEffect(() => {
    const fetchMembers = async () => {
      if (!activeOrg?.id) {
        return;
      }

      try {
        setLoadingMembers(true);

        const result = await getAllCollaborators();

        if (result.success) {
          const formattedMembers = result.data
            .filter((item) => item.type === "member")
            .map((item) => ({
              userId: item.user?.id || item.userId || item.id,
              name:
                item.user?.name ||
                item.name ||
                item.user?.email?.split("@")[0] ||
                "Utilisateur",
              email: item.user?.email || item.email,
              image:
                item.user?.image || item.user?.avatar || item.avatar || null,
              role: item.role,
            }));

          const currentUserInList = formattedMembers.some(
            (m) =>
              m.userId === currentUser?.id || m.email === currentUser?.email,
          );

          if (currentUser && !currentUserInList) {
            formattedMembers.unshift({
              userId: currentUser.id,
              name:
                currentUser.name || currentUser.email?.split("@")[0] || "Moi",
              email: currentUser.email,
              image: currentUser.image || currentUser.avatar || null,
              role: "owner",
            });
          }

          setOrganizationMembers(formattedMembers);
        } else {
          setOrganizationMembers([]);
        }
      } catch (error) {
        console.error("❌ [DEPENSES] Exception:", error);
        setOrganizationMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    if (activeOrg?.id) {
      fetchMembers();
    }
  }, [activeOrg?.id]);

  // Ouvrir automatiquement la sidebar si initialTransactionId est fourni
  useEffect(() => {
    if (initialTransactionId && expensesProp.length > 0) {
      const transaction = expensesProp.find(
        (exp) => exp.id === initialTransactionId,
      );
      if (transaction) {
        if (openOcr) {
          // Ouvrir la sidebar d'édition pour voir les données OCR
          setEditingTransaction(transaction);
          setIsEditModalOpen(true);
        } else {
          // Ouvrir la sidebar de détails
          setSelectedTransaction(transaction);
          setIsDetailDrawerOpen(true);
        }
      }
    }
  }, [initialTransactionId, openOcr, expensesProp]);

  const expenses = expensesProp;
  const expensesTotalCount = expensesProp.length;
  const expensesLoading = loadingProp;
  const expensesError = null;
  const refetchExpenses = refetchExpensesProp;

  const { createExpense, loading: createExpenseLoading } = useCreateExpense();
  const { createTransaction, loading: createTransactionLoading } =
    useCreateTransaction();
  const { updateTransaction, loading: updateTransactionLoading } =
    useUpdateTransaction();
  const { deleteTransaction, loading: deleteTransactionLoading } =
    useDeleteTransaction();
  const { updateExpense, loading: updateExpenseLoading } = useUpdateExpense();
  const { deleteExpense, loading: deleteExpenseLoading } = useDeleteExpense();
  const { deleteMultipleExpenses, loading: deleteMultipleExpensesLoading } =
    useDeleteMultipleExpenses();
  const deleteMultipleLoading = deleteMultipleExpensesLoading;
  const { addExpenseFile, loading: addExpenseFileLoading } =
    useAddExpenseFile();
  const { promoteTemporaryFile, promoteResult } = usePromoteTemporaryFile();
  const pendingTransactionRef = useRef(null);

  useEffect(() => {
    if (
      promoteResult?.success &&
      promoteResult?.url &&
      pendingTransactionRef.current
    ) {
      const transaction = pendingTransactionRef.current;
      transaction.receiptImage = promoteResult.url;
      pendingTransactionRef.current = null;

      handleAddTransaction(transaction);
    }
  }, [promoteResult]);

  const loading = expensesLoading;
  const error = expensesError;
  const totalCount = expensesTotalCount;

  const refetch = useCallback(() => {
    refetchExpenses();
  }, [refetchExpenses]);

  // Fonction utilitaire pour formater les dates de manière sécurisée
  const safeFormatDate = (dateValue) => {
    if (!dateValue) return formatLocalDate();

    // Si c'est déjà une string au format YYYY-MM-DD
    if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      return dateValue.split("T")[0];
    }

    // Essayer de parser la date
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn("Date invalide:", dateValue);
        return formatLocalDate();
      }
      return formatLocalDate(date);
    } catch (error) {
      console.warn("Erreur de parsing de date:", dateValue, error);
      return formatLocalDate();
    }
  };

  const transactions = useMemo(() => {
    const expenseTransactions = expenses.map((expense) => {
      const formattedDate = safeFormatDate(expense.date);

      return {
        id: expense.id,
        date: formattedDate,
        type: "EXPENSE",
        subType:
          expense.category === "TRAVEL"
            ? "transport"
            : expense.category === "MEALS"
              ? "repas"
              : expense.category === "OFFICE_SUPPLIES"
                ? "bureau"
                : expense.category === "SERVICES"
                  ? "prestation"
                  : "autre",
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency || "EUR",
        description: expense.description || expense.title,
        paymentMethod: expense.paymentMethod,
        vendor: expense.vendor,
        invoiceNumber: expense.invoiceNumber,
        documentNumber: expense.documentNumber,
        vatAmount: expense.vatAmount,
        vatRate: expense.vatRate,
        status: expense.status,
        tags: expense.tags || [],
        attachment:
          expense.files && expense.files.length > 0
            ? expense.files[0].url
            : null,
        files: expense.files || [],
        receiptFiles: expense.receiptFiles || [],
        ocrMetadata: expense.ocrMetadata || null,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        // Préserver la source originale (BANK, MANUAL, OCR) ou le type (BANK_TRANSACTION, MANUAL_EXPENSE)
        source: expense.source || expense.type || "MANUAL",
        // Indicateurs pour la vue unifiée
        hasReceipt:
          expense.hasReceipt ||
          (expense.files && expense.files.length > 0) ||
          !!expense.linkedInvoice?.id,
        receiptRequired:
          expense.receiptRequired !== false && !expense.linkedInvoice?.id,
        expenseType: expense.expenseType || "ORGANIZATION",
        assignedMember: expense.assignedMember || null,
        // Données originales de la transaction bancaire si disponibles
        originalTransaction: expense.originalTransaction || null,
        // Affichage unifié : ligne issue d'une facture d'achat (sourceKind)
        sourceKind: expense.sourceKind || null,
        originalPurchaseInvoice: expense.originalPurchaseInvoice || null,
        // Champs de rapprochement bancaire
        linkedInvoiceId: expense.linkedInvoiceId || null,
        linkedInvoice: expense.linkedInvoice || null,
        reconciliationStatus: expense.reconciliationStatus || null,
        reconciliationDate: expense.reconciliationDate || null,
        // Compte PCG et métadonnées (pour affichage et suggestion dans le dialog)
        pcgAccount: expense.pcgAccount || null,
        metadata: expense.metadata || {},
      };
    });

    let allTransactions = [...expenseTransactions];

    if (expenseTypeFilter || assignedMemberFilter) {
      allTransactions = allTransactions.filter((transaction) => {
        if (expenseTypeFilter) {
          if (transaction.expenseType !== expenseTypeFilter) {
            return false;
          }
        }

        if (assignedMemberFilter && expenseTypeFilter === "EXPENSE_REPORT") {
          if (
            !transaction.assignedMember ||
            transaction.assignedMember.userId !== assignedMemberFilter
          ) {
            return false;
          }
        }

        return true;
      });
    }

    return allTransactions.sort((a, b) => {
      const dateA = safeFormatDate(a.date);
      const dateB = safeFormatDate(b.date);
      return dateB.localeCompare(dateA);
    });
  }, [expenses, expenseTypeFilter, assignedMemberFilter]);

  // Tab counts (computed from base transactions, before tab filter)
  const mobileTabCounts = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );
    return {
      all: transactions.length,
      last_month: transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= oneMonthAgo && tx.amount < 0;
      }).length,
      missing_receipt: transactions.filter(
        (tx) => tx.amount < 0 && !tx.hasReceipt,
      ).length,
    };
  }, [transactions]);

  // Apply mobile tab filter
  const tabFilteredTransactions = useMemo(() => {
    if (mobileTab === "last_month") {
      const now = new Date();
      const oneMonthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate(),
      );
      return transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= oneMonthAgo && tx.amount < 0;
      });
    }
    if (mobileTab === "missing_receipt") {
      return transactions.filter((tx) => tx.amount < 0 && !tx.hasReceipt);
    }
    return transactions;
  }, [transactions, mobileTab]);

  const totalItems = totalCount;

  const [sorting, setSorting] = useState([
    {
      id: "date",
      desc: true,
    },
  ]);

  const [columnVisibility, setColumnVisibility] = usePersistentColumnVisibility(
    "newbi:column-visibility:transactions",
    {
      paymentMethod: false,
    },
  );

  useEffect(() => {
    const timer = setTimeout(() => {}, 300);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  const handleDeleteRows = async () => {
    const selectedRows = tableWithFilteredData.getSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      toast.error("Aucune transaction sélectionnée");
      return;
    }

    // Filtrer les factures (non supprimables depuis cette interface) ainsi que
    // les factures d'achat affichées en lecture (sourceKind === PURCHASE_INVOICE)
    const deletableRows = selectedRows.filter(
      (row) =>
        row.original.source !== "invoice" &&
        row.original.sourceKind !== "PURCHASE_INVOICE",
    );
    const invoiceRows = selectedRows.filter(
      (row) =>
        row.original.source === "invoice" ||
        row.original.sourceKind === "PURCHASE_INVOICE",
    );

    if (invoiceRows.length > 0) {
      toast.warning(
        `${invoiceRows.length} facture(s) ignorée(s) (non supprimables depuis cette interface)`,
      );
    }

    if (deletableRows.length === 0) {
      toast.error("Aucune transaction sélectionnée pour la suppression");
      return;
    }

    try {
      // Supprimer les transactions une par une
      let deletedCount = 0;
      let failedCount = 0;

      for (const row of deletableRows) {
        const result = await deleteTransaction(row.original.id);
        if (result.success) {
          deletedCount++;
        } else {
          failedCount++;
        }
      }

      if (deletedCount > 0) {
        tableWithFilteredData.resetRowSelection();
        toast.success(`${deletedCount} transaction(s) supprimée(s)`);
        await refetchExpenses();
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} suppression(s) échouée(s)`);
      }
    } catch (error) {
      console.error("Error deleting transactions:", error);
    }
  };

  const handleRefresh = async () => {
    try {
      toast.success("Données actualisées");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
      console.error("Error refreshing transactions:", error);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleViewTransaction = (transaction) => {
    // Ligne issue d'une facture d'achat : ouvrir le drawer facture d'achat en place
    if (transaction?.sourceKind === "PURCHASE_INVOICE") {
      setSelectedPurchaseInvoice(
        transaction.originalPurchaseInvoice || transaction,
      );
      setIsPIDrawerOpen(true);
      return;
    }
    setSelectedTransaction(transaction);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = (isOpen) => {
    if (isOpen === false || isOpen === undefined) {
      setIsDetailDrawerOpen(false);
      // Ne pas reset selectedTransaction tout de suite : laisser l'exit anim jouer
    }
  };

  const handleEditFromDrawer = (transaction) => {
    setIsDetailDrawerOpen(false);
    handleEditTransaction(transaction);
  };

  const handleDeleteFromDrawer = async (transaction) => {
    setIsDetailDrawerOpen(false);

    if (transaction.source === "invoice") {
      toast.error(
        "Les factures ne peuvent pas être supprimées depuis cette interface",
      );
      return;
    }

    if (transaction.sourceKind === "PURCHASE_INVOICE") {
      toast.error(
        "Supprimez cette facture d'achat depuis la page Factures d'achat",
      );
      return;
    }

    try {
      const result = await deleteTransaction(transaction.id);
      if (result.success) {
        await refetchExpenses();
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const handleAddTransaction = async (transaction) => {
    try {
      let promotedReceiptUrl = transaction.receiptImage;

      // Promotion du fichier temporaire si nécessaire
      if (
        transaction.receiptImage &&
        transaction.receiptImage.includes("/temp/")
      ) {
        try {
          const urlParts = transaction.receiptImage.split("/");
          const tempKey = urlParts.slice(-3).join("/");

          pendingTransactionRef.current = transaction;
          await promoteTemporaryFile(tempKey);
          return;
        } catch (promoteError) {
          promotedReceiptUrl = transaction.receiptImage;
        }
      }

      transaction.receiptImage = promotedReceiptUrl;

      // Déterminer le type de transaction (DEBIT pour dépense, CREDIT pour revenu)
      const isIncome = transaction.type === "INCOME";
      const transactionType = isIncome ? "CREDIT" : "DEBIT";

      // Montant : négatif pour les dépenses, positif pour les revenus
      const amount = isIncome
        ? Math.abs(parseFloat(transaction.amount))
        : -Math.abs(parseFloat(transaction.amount));

      // Envoyer la sous-catégorie fine directement (le backend fait le mapping vers expenseCategory)
      const category = transaction.category || "OTHER";

      // Mapper le moyen de paiement
      const paymentMethod = mapPaymentMethodToEnum(transaction.paymentMethod);

      // Construire l'input pour createTransaction
      const transactionInput = {
        workspaceId,
        amount: amount,
        currency: "EUR",
        description:
          transaction.description ||
          (isIncome ? "Revenu manuel" : "Dépense manuelle"),
        type: transactionType,
        date: transaction.date,
        category: category,
        vendor: transaction.vendor || "",
        paymentMethod: paymentMethod,
        notes: transaction.description || "",
      };

      const result = await createTransaction(transactionInput);

      if (result.success) {
        // Upload des justificatifs si des fichiers ont été sélectionnés
        const filesToUpload =
          (Array.isArray(transaction.receiptFiles) &&
            transaction.receiptFiles) ||
          (transaction.receiptFile ? [transaction.receiptFile] : null);
        if (filesToUpload?.length && result.transaction?.id) {
          try {
            await uploadReceiptMutation({
              variables: {
                transactionId: result.transaction.id,
                workspaceId,
                files: filesToUpload,
              },
            });
          } catch (uploadError) {
            console.error("Erreur upload justificatif:", uploadError);
            toast.error(
              "Transaction créée mais erreur lors de l'upload du justificatif",
            );
          }
        }

        setIsAddTransactionDrawerOpen(false);
        await refetchExpenses();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la transaction:", error);
    }
  };

  const handleReceiptUploadSuccess = (receiptData) => {
    setIsReceiptUploadDrawerOpen(false);

    // Toujours rafraîchir les données après un upload de reçu réussi
    refetch();

    if (receiptData.action === "linked") {
      toast.success(`Justificatif lié à la transaction`);
    } else {
      toast.success(`Reçu "${receiptData.fileName}" traité avec succès`);
    }
  };

  // Attacher un (ou plusieurs) reçu(s) à une transaction bancaire (upload via GraphQL)
  const handleAttachReceipt = async (transaction, fileOrFiles) => {
    try {
      const transactionId =
        transaction.originalTransaction?.id || transaction.id;

      const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];

      const { data } = await uploadReceiptMutation({
        variables: {
          transactionId,
          workspaceId,
          files,
        },
      });

      if (!data?.uploadTransactionReceipt?.success) {
        throw new Error(
          data?.uploadTransactionReceipt?.message || "Erreur lors de l'upload",
        );
      }

      // Mettre à jour selectedTransaction avec receiptFiles
      if (selectedTransaction) {
        setSelectedTransaction({
          ...selectedTransaction,
          receiptFiles: data.uploadTransactionReceipt.receiptFiles || [],
          receiptRequired: false,
        });
      }

      toast.success(
        files.length === 1
          ? "Justificatif ajouté avec succès"
          : `${files.length} justificatifs ajoutés avec succès`,
      );
      refetch();
    } catch (error) {
      console.error("❌ [ATTACH RECEIPT] Error:", error);
      toast.error(error.message || "Erreur lors de l'upload du justificatif");
      throw error;
    }
  };

  const handleSaveTransaction = async (updatedTransaction) => {
    // Support pour l'édition depuis le detail drawer (selectedTransaction) ou le edit drawer (editingTransaction)
    const transactionId =
      updatedTransaction.id ||
      editingTransaction?.id ||
      selectedTransaction?.id;
    if (!transactionId) return;

    try {
      // Déterminer le type de transaction
      const isIncome = updatedTransaction.type === "INCOME";
      const transactionType = isIncome ? "CREDIT" : "DEBIT";

      // Montant : négatif pour les dépenses, positif pour les revenus
      const amount = isIncome
        ? Math.abs(parseFloat(updatedTransaction.amount))
        : -Math.abs(parseFloat(updatedTransaction.amount));

      // Envoyer la sous-catégorie fine directement (le backend fait le mapping vers expenseCategory)
      const category = updatedTransaction.category || "OTHER";

      // Mapper le moyen de paiement
      const paymentMethod = mapPaymentMethodToEnum(
        updatedTransaction.paymentMethod,
      );

      const updateInput = {
        description: updatedTransaction.description || "Transaction modifiée",
        amount: amount,
        currency: "EUR",
        category: category,
        date: updatedTransaction.date,
        type: transactionType,
        vendor: updatedTransaction.vendor,
        paymentMethod: paymentMethod,
        notes: updatedTransaction.description,
      };

      // Statut (si modifié dans le drawer) — enum GraphQL en majuscules
      if (updatedTransaction.status) {
        updateInput.status = updatedTransaction.status;
      }

      // Ajouter le compte PCG si renseigné
      if (updatedTransaction.pcgAccountNumero) {
        updateInput.pcgAccountNumero = updatedTransaction.pcgAccountNumero;
      }

      const result = await updateTransaction(transactionId, updateInput);

      if (result.success) {
        handleCloseEditModal();
        handleCloseDetailDrawer();
        await refetchExpenses();
      }
    } catch (error) {
      console.error("Erreur lors de la modification de la transaction:", error);
    }
  };

  const handleDownloadAttachment = async (transaction) => {
    try {
      // Chercher l'URL du 1er justificatif dans les différents champs possibles
      const firstReceipt = transaction.receiptFiles?.[0];
      const receiptUrl =
        firstReceipt?.url ||
        transaction.attachment ||
        (transaction.files && transaction.files.length > 0
          ? transaction.files[0].url
          : null);

      if (!receiptUrl) {
        toast.error("Aucun justificatif disponible");
        return;
      }

      const filename =
        firstReceipt?.filename ||
        transaction.files?.[0]?.filename ||
        `justificatif-${transaction.id}`;

      const link = document.createElement("a");
      link.href = receiptUrl;
      link.download = filename;
      link.target = "_blank";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Justificatif ouvert dans un nouvel onglet");
    } catch (error) {
      console.error("❌ Erreur lors du téléchargement:", error);
      toast.error("Erreur lors de l'affichage du justificatif");
    }
  };

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    manualPagination: false,
    // Lignes facture d'achat (affichage unifié) : non sélectionnables
    enableRowSelection: (row) => row.original.sourceKind !== "PURCHASE_INVOICE",
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: multiColumnFilterFn,
    meta: {
      onEdit: handleEditTransaction,
      onRefresh: refetch,
      onDownloadAttachment: handleDownloadAttachment,
      onEditPCG: handleEditPCG,
      onOpenReconciliation: (transaction) => {
        setSelectedTransaction(transaction);
        setIsDetailDrawerOpen(true);
      },
      bankAccounts,
    },
  });

  // État pour les tabs de filtre rapide
  const [activeTab, setActiveTab] = useState(resolvedInitialTab);

  // Gérer le changement de tab
  const handleTabChange = (value) => {
    setActiveTab(value);
    // Reset le filtre de type - le filtrage est géré dans filteredTransactions
    setExpenseTypeFilter(null);
  };

  // Compter les transactions par filtre
  const transactionCounts = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );

    const counts = {
      all: transactions.length,
      lastMonth: 0,
      missingReceipt: 0,
      toReconcile: 0,
    };

    transactions.forEach((t) => {
      // Transactions du dernier mois
      const transactionDate = new Date(t.date);
      if (transactionDate >= oneMonthAgo) {
        counts.lastMonth++;
      }

      // Justificatif manquant (transactions bancaires sans justificatif)
      const source = t.source || "MANUAL";
      const isBankTransaction =
        source === "BANK" || source === "BANK_TRANSACTION";
      if (isBankTransaction && !t.hasReceipt && t.receiptRequired !== false) {
        counts.missingReceipt++;
      }

      // À rapprocher : entrée d'argent (amount > 0), non rapprochée et SANS
      // justificatif. hasReceipt = un justificatif (receiptFiles) OU une facture
      // liée → dans les deux cas il n'y a plus rien à rapprocher. Doit rester
      // identique au filtre toReconcile ci-dessous et au backend (reconcileQuery).
      const recoStatus = t.reconciliationStatus?.toLowerCase();
      const isNotReconciled =
        !recoStatus || recoStatus === "unmatched" || recoStatus === "suggested";
      if (isNotReconciled && !t.hasReceipt && t.amount > 0) {
        counts.toReconcile++;
      }
    });

    return counts;
  }, [transactions]);

  // Filtrer les transactions selon le tab actif et les filtres avancés
  const filteredTransactions = useMemo(() => {
    let result = tabFilteredTransactions;
    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );

    // Filtrer par tab
    if (activeTab === "lastMonth") {
      result = result.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= oneMonthAgo;
      });
    } else if (activeTab === "missingReceipt") {
      result = result.filter((t) => {
        const source = t.source || "MANUAL";
        const isBankTransaction =
          source === "BANK" || source === "BANK_TRANSACTION";
        return (
          isBankTransaction && !t.hasReceipt && t.receiptRequired !== false
        );
      });
    } else if (activeTab === "toReconcile") {
      result = result.filter((t) => {
        const recoStatus = t.reconciliationStatus?.toLowerCase();
        const isNotReconciled =
          !recoStatus ||
          recoStatus === "unmatched" ||
          recoStatus === "suggested";
        return isNotReconciled && !t.hasReceipt && t.amount > 0;
      });
    }

    // Appliquer les filtres avancés
    if (advancedFilters.length > 0) {
      result = result.filter((transaction) => {
        return advancedFilters.every((filter) => {
          // Filtre par plage de dates
          if (filter.field === "date") {
            if (!filter.startDate && !filter.endDate) return true;
            const transactionDate = new Date(transaction.date);
            if (filter.startDate) {
              const start = new Date(filter.startDate);
              start.setHours(0, 0, 0, 0);
              if (transactionDate < start) return false;
            }
            if (filter.endDate) {
              const end = new Date(filter.endDate);
              end.setHours(23, 59, 59, 999);
              if (transactionDate > end) return false;
            }
            return true;
          }

          if (!filter.value) return true; // Ignorer les filtres sans valeur

          const fieldValue = transaction[filter.field];
          const filterValue = filter.value;

          switch (filter.operator) {
            case "includes":
              if (typeof fieldValue === "string") {
                return fieldValue
                  .toLowerCase()
                  .includes(filterValue.toLowerCase());
              }
              return fieldValue === filterValue;
            case "excludes":
              if (typeof fieldValue === "string") {
                return !fieldValue
                  .toLowerCase()
                  .includes(filterValue.toLowerCase());
              }
              return fieldValue !== filterValue;
            case "equals":
              return fieldValue === filterValue;
            default:
              return true;
          }
        });
      });
    }

    return result;
  }, [tabFilteredTransactions, activeTab, advancedFilters]);

  // Mettre à jour la table avec les transactions filtrées
  const tableWithFilteredData = useReactTable({
    data: filteredTransactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    manualPagination: false,
    // Lignes facture d'achat (affichage unifié) : non sélectionnables
    enableRowSelection: (row) => row.original.sourceKind !== "PURCHASE_INVOICE",
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: multiColumnFilterFn,
    meta: {
      onEdit: handleEditTransaction,
      onRefresh: refetch,
      onDownloadAttachment: handleDownloadAttachment,
      onEditPCG: handleEditPCG,
      onOpenReconciliation: (transaction) => {
        setSelectedTransaction(transaction);
        setIsDetailDrawerOpen(true);
      },
      bankAccounts,
    },
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filters and Actions - Fixe en haut */}
      <div className="flex items-center justify-between gap-3 hidden md:flex px-4 sm:px-6 py-4 flex-shrink-0">
        {/* Search + Colonnes + Filtres — côté gauche */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 h-8 w-full sm:w-[300px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
            <Search
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
            <Input
              variant="ghost"
              ref={inputRef}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Recherchez par description, fournisseur ou montant..."
              aria-label="Filter transactions"
            />
            {Boolean(globalFilter) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground cursor-pointer shrink-0 transition-colors outline-none"
                aria-label="Clear filter"
                onClick={() => {
                  setGlobalFilter("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <CircleXIcon size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Colonnes visibles Button */}
          {(() => {
            const hideableColumns = tableWithFilteredData
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide(),
              );
            const allColumnsVisible =
              hideableColumns.length > 0 &&
              hideableColumns.every((column) => column.getIsVisible());
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="filter" className="cursor-pointer">
                    <Setting4Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    Colonnes visibles
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[250px] max-h-[400px] overflow-y-auto"
                >
                  <div
                    className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                    onClick={() =>
                      tableWithFilteredData.toggleAllColumnsVisible(
                        !allColumnsVisible,
                      )
                    }
                  >
                    <Checkbox
                      checked={allColumnsVisible}
                      className="mr-2 pointer-events-none"
                    />
                    <span>Tout sélectionner</span>
                  </div>
                  <DropdownMenuSeparator />
                  {hideableColumns.map((column) => {
                    const label =
                      column.columnDef.meta?.label ||
                      (typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id);
                    return (
                      <div
                        key={column.id}
                        className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                        onClick={() => column.toggleVisibility()}
                      >
                        <Checkbox
                          checked={column.getIsVisible()}
                          className="mr-2 pointer-events-none"
                        />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })()}

          {/* Filtres avancés Button */}
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={advancedFilters.length > 0 ? "primary" : "filter"}
              >
                <ListFilterIcon className="w-3.5 h-3.5" aria-hidden="true" />
                Filtres
                {advancedFilters.length > 0 && (
                  <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {advancedFilters.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[620px] p-0">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtres</h4>
                  {advancedFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      Supprimer tous les critères
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                {advancedFilters.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun filtre actif. Cliquez sur "Ajouter un critère" pour
                    commencer.
                  </p>
                ) : (
                  advancedFilters.map((filter, index) => (
                    <div key={filter.id} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-12">
                        {index === 0 ? "Quand" : "et"}
                      </span>

                      {/* Sélection du champ */}
                      <Select
                        value={filter.field}
                        onValueChange={(value) =>
                          updateFilter(filter.id, "field", value)
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          {filterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Opérateur (masqué pour les filtres date) */}
                      {filter.field !== "date" && (
                        <Select
                          value={filter.operator}
                          onValueChange={(value) =>
                            updateFilter(filter.id, "operator", value)
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="includes">inclut</SelectItem>
                            <SelectItem value="excludes">exclut</SelectItem>
                            <SelectItem value="equals">égal à</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {/* Valeur */}
                      {filter.field === "date" ? (
                        <div className="flex-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-left font-normal h-9"
                              >
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span
                                  className={cn(
                                    "truncate",
                                    filter.startDate
                                      ? "text-foreground"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {filter.startDate
                                    ? filter.endDate
                                      ? `${format(
                                          new Date(filter.startDate),
                                          "dd MMM yyyy",
                                          { locale: fr },
                                        )} → ${format(
                                          new Date(filter.endDate),
                                          "dd MMM yyyy",
                                          { locale: fr },
                                        )}`
                                      : format(
                                          new Date(filter.startDate),
                                          "dd MMM yyyy",
                                          { locale: fr },
                                        )
                                    : "Sélectionner une période"}
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              style={{ zIndex: 9999 }}
                              align="start"
                              side="left"
                              collisionPadding={16}
                            >
                              <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={
                                  filter.startDate
                                    ? new Date(filter.startDate)
                                    : undefined
                                }
                                selected={{
                                  from: filter.startDate
                                    ? new Date(filter.startDate)
                                    : undefined,
                                  to: filter.endDate
                                    ? new Date(filter.endDate)
                                    : undefined,
                                }}
                                onSelect={(range) =>
                                  updateFilterRange(
                                    filter.id,
                                    range?.from ? range.from.toISOString() : "",
                                    range?.to ? range.to.toISOString() : "",
                                  )
                                }
                                numberOfMonths={2}
                                locale={fr}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : filterValues[filter.field] ? (
                        <Select
                          value={filter.value}
                          onValueChange={(value) =>
                            updateFilter(filter.id, "value", value)
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {filterValues[filter.field].map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={filter.value}
                          onChange={(e) =>
                            updateFilter(filter.id, "value", e.target.value)
                          }
                          placeholder="Valeur..."
                          className="flex-1"
                        />
                      )}

                      {/* Supprimer */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilter(filter.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addFilter}
                  className="w-full justify-start text-muted-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un critère
                </Button>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearAllFilters();
                      setIsFiltersOpen(false);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button size="sm" onClick={() => setIsFiltersOpen(false)}>
                    Appliquer
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Actions à droite — bulk delete */}
        {tableWithFilteredData.getSelectedRowModel().rows.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={deleteMultipleLoading}
                data-mobile-delete-trigger
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Supprimer (
                {tableWithFilteredData.getSelectedRowModel().rows.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer{" "}
                  {tableWithFilteredData.getSelectedRowModel().rows.length}{" "}
                  transaction(s) sélectionnée(s) ? Cette action ne peut pas être
                  annulée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteRows}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Tabs de filtre rapide - Desktop */}
      <div className="hidden md:block flex-shrink-0 border-b border-[#eeeff1] dark:border-[#232323] pt-2 pb-[9px] transaction-tabs">
        <style>{`
          .transaction-tabs [data-slot="tabs-trigger"][data-state="active"] {
            text-shadow: 0.015em 0 currentColor, -0.015em 0 currentColor;
          }
        `}</style>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-auto rounded-none bg-transparent p-0 w-full justify-start px-4 sm:px-6 gap-1.5">
            <TabsTrigger
              value="all"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              Toutes
              <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                {transactionCounts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="lastMonth"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              Régler le dernier mois
              <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                {transactionCounts.lastMonth}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="toReconcile"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              À rapprocher
              {transactionCounts.toReconcile > 0 ? (
                <span className="text-[10px] leading-none bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded px-1 py-0.5">
                  {transactionCounts.toReconcile}
                </span>
              ) : (
                <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                  0
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="missingReceipt"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              Justificatif manquant
              <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                {transactionCounts.missingReceipt}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table - Desktop style avec header fixe et body scrollable */}
      <div className="hidden md:flex md:flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header fixe */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
          <table className="w-full table-fixed">
            <thead>
              {tableWithFilteredData.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index, arr) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          </table>
        </div>
        {/* Body scrollable */}
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed">
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b">
                    <td className="p-2 pl-4 sm:pl-6">
                      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
                        <div className="h-4 w-[140px] rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="h-4 w-[70px] rounded bg-muted animate-pulse" />
                    </td>
                    <td className="p-2">
                      <div className="h-4 w-[70px] rounded bg-muted animate-pulse" />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
                        <div className="h-4 w-[60px] rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="h-4 w-[60px] rounded bg-muted animate-pulse" />
                    </td>
                    <td className="p-2">
                      <div className="h-4 w-[50px] rounded bg-muted animate-pulse" />
                    </td>
                    <td className="p-2">
                      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                    </td>
                    <td className="p-2 pr-4 sm:pr-6">
                      <div className="h-7 w-7 rounded bg-muted animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : tableWithFilteredData.getRowModel().rows?.length ? (
                tableWithFilteredData.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
                    onClick={(e) => {
                      if (
                        e.target.closest('[role="checkbox"]') ||
                        e.target.closest("[data-actions-cell]") ||
                        e.target.closest('button[role="combobox"]') ||
                        e.target.closest('[role="menu"]')
                      ) {
                        return;
                      }
                      handleViewTransaction(row.original);
                    }}
                  >
                    {row.getVisibleCells().map((cell, index, arr) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={`p-2 align-middle text-[13px] ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={tableWithFilteredData.getAllColumns().length}
                    className="p-0"
                  >
                    <TableEmptyState
                      icon={ChartIcon}
                      title="Aucune transaction trouvée"
                      description="Aucune transaction ne correspond à vos critères."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Toolbar */}
      <MobileToolbar
        inputRef={inputRef}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        onFilterPress={() => setIsFiltersOpen(!isFiltersOpen)}
        activeFilterCount={
          (expenseTypeFilter ? 1 : 0) + (assignedMemberFilter ? 1 : 0)
        }
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        isScrolled={isMobileScrolled}
        tabCounts={mobileTabCounts}
      />

      {/* Mobile Table */}
      <MobileTable
        table={tableWithFilteredData}
        columns={columns}
        error={error}
        loading={loading}
        onRowClick={handleViewTransaction}
        onScrollChange={setIsMobileScrolled}
        activeTab={mobileTab}
      />

      {/* Pagination - Fixe en bas sur desktop */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
        <div className="flex-1 text-xs font-normal text-muted-foreground">
          {tableWithFilteredData.getFilteredSelectedRowModel().rows.length} sur{" "}
          {tableWithFilteredData.getFilteredRowModel().rows.length} ligne(s)
          sélectionnée(s).
        </div>
        <div className="flex items-center space-x-4 lg:space-x-6">
          <div className="flex items-center gap-1.5">
            <p className="whitespace-nowrap text-xs font-normal">
              Lignes par page
            </p>
            <Select
              value={`${tableWithFilteredData.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                tableWithFilteredData.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-7 w-[70px] text-xs">
                <SelectValue
                  placeholder={
                    tableWithFilteredData.getState().pagination.pageSize
                  }
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center whitespace-nowrap text-xs font-normal">
            Page {tableWithFilteredData.getState().pagination.pageIndex + 1} sur{" "}
            {tableWithFilteredData.getPageCount()}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => tableWithFilteredData.setPageIndex(0)}
                  disabled={!tableWithFilteredData.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => tableWithFilteredData.previousPage()}
                  disabled={!tableWithFilteredData.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => tableWithFilteredData.nextPage()}
                  disabled={!tableWithFilteredData.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => tableWithFilteredData.lastPage()}
                  disabled={!tableWithFilteredData.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        transactions={filteredTransactions}
        members={organizationMembers}
      />

      {/* Drawers */}
      {/* Drawer unifié pour visualisation */}
      <AnimatePresence onExitComplete={() => setSelectedTransaction(null)}>
        {isDetailDrawerOpen && (
          <TransactionDetailDrawer
            transaction={selectedTransaction}
            open={isDetailDrawerOpen}
            onOpenChange={handleCloseDetailDrawer}
            onEdit={handleEditFromDrawer}
            onDelete={handleDeleteFromDrawer}
            onAttachReceipt={handleAttachReceipt}
            onRefresh={refetch}
            onSubmit={handleSaveTransaction}
          />
        )}
      </AnimatePresence>

      {/* Drawer unifié pour création */}
      <AnimatePresence>
        {isAddTransactionDrawerOpen && (
          <TransactionDetailDrawer
            open={isAddTransactionDrawerOpen}
            onOpenChange={setIsAddTransactionDrawerOpen}
            onSubmit={handleAddTransaction}
            onRefresh={refetch}
            isCreating={true}
          />
        )}
      </AnimatePresence>

      {/* Drawer unifié pour édition */}
      <AnimatePresence>
        {isEditModalOpen && (
          <TransactionDetailDrawer
            transaction={editingTransaction}
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onSubmit={handleSaveTransaction}
            onRefresh={refetch}
          />
        )}
      </AnimatePresence>

      {/* Drawer facture d'achat (affichage unifié) — lignes sourceKind PURCHASE_INVOICE */}
      <PurchaseInvoiceDetailDrawer
        open={isPIDrawerOpen}
        onOpenChange={(open) => {
          setIsPIDrawerOpen(open);
          if (!open) setSelectedPurchaseInvoice(null);
        }}
        invoice={selectedPurchaseInvoice}
        mode="view"
        onSaved={() => {
          setIsPIDrawerOpen(false);
          setSelectedPurchaseInvoice(null);
          refetch();
        }}
        onDeleted={() => {
          setIsPIDrawerOpen(false);
          setSelectedPurchaseInvoice(null);
          refetch();
        }}
      />

      <ReceiptUploadDrawer
        open={isReceiptUploadDrawerOpen}
        onOpenChange={setIsReceiptUploadDrawerOpen}
        onUploadSuccess={handleReceiptUploadSuccess}
      />

      <PCGSelectDialog
        open={isPCGDialogOpen}
        onOpenChange={setIsPCGDialogOpen}
        transaction={pcgTransaction}
        onRefresh={refetchExpenses}
      />
    </div>
  );
}
