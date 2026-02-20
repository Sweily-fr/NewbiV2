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
import { ReceiptUploadDrawer } from "../receipt-upload-drawer";
import { ExportDialog } from "../export-dialog";
import {
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useDeleteMultipleExpenses,
  useAddExpenseFile,
} from "@/src/hooks/useExpenses";
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/src/hooks/useTransactions";
import { useMutation } from "@apollo/client";
import { UPLOAD_TRANSACTION_RECEIPT } from "@/src/graphql/queries/banking";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { useSession } from "@/src/lib/auth-client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { usePromoteTemporaryFile } from "@/src/hooks/usePromoteTemporaryFile";

import { columns } from "./columns/transactionColumns";
import { multiColumnFilterFn } from "./filters/multiColumnFilterFn";
import { mapCategoryToEnum, mapPaymentMethodToEnum } from "./utils/mappers";
import { MobileToolbar } from "./components/MobileToolbar";
import { MobileTable } from "./components/MobileTable";

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
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
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
import {
  Search,
  TrashIcon,
  ListFilterIcon,
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
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Label } from "@/src/components/ui/label";

// Fonction utilitaire pour récupérer le token JWT
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bearer_token");
};

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
}) {
  const id = useId();
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
  const [isAddTransactionDrawerOpen, setIsAddTransactionDrawerOpen] =
    useState(false);
  const [isReceiptUploadDrawerOpen, setIsReceiptUploadDrawerOpen] =
    useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("all");
  const [isMobileScrolled, setIsMobileScrolled] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState([]);

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
      advancedFilters.map((f) =>
        f.id === filterId ? { ...f, [key]: value } : f
      )
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
              m.userId === currentUser?.id || m.email === currentUser?.email
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
        (exp) => exp.id === initialTransactionId
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
  const { createTransaction, loading: createTransactionLoading } = useCreateTransaction();
  const { updateTransaction, loading: updateTransactionLoading } = useUpdateTransaction();
  const { deleteTransaction, loading: deleteTransactionLoading } = useDeleteTransaction();
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
    if (!dateValue) return new Date().toISOString().split("T")[0];

    // Si c'est déjà une string au format YYYY-MM-DD
    if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      return dateValue.split("T")[0];
    }

    // Essayer de parser la date
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn("Date invalide:", dateValue);
        return new Date().toISOString().split("T")[0];
      }
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.warn("Erreur de parsing de date:", dateValue, error);
      return new Date().toISOString().split("T")[0];
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
        ocrMetadata: expense.ocrMetadata || null,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        // Préserver la source originale (BANK, MANUAL, OCR) ou le type (BANK_TRANSACTION, MANUAL_EXPENSE)
        source: expense.source || expense.type || "MANUAL",
        // Indicateurs pour la vue unifiée
        hasReceipt:
          expense.hasReceipt || (expense.files && expense.files.length > 0) || !!expense.linkedInvoice?.id,
        receiptRequired: expense.receiptRequired !== false && !expense.linkedInvoice?.id,
        expenseType: expense.expenseType || "ORGANIZATION",
        assignedMember: expense.assignedMember || null,
        // Données originales de la transaction bancaire si disponibles
        originalTransaction: expense.originalTransaction || null,
        // Champs de rapprochement bancaire
        linkedInvoiceId: expense.linkedInvoiceId || null,
        linkedInvoice: expense.linkedInvoice || null,
        reconciliationStatus: expense.reconciliationStatus || null,
        reconciliationDate: expense.reconciliationDate || null,
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
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return {
      all: transactions.length,
      last_month: transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= oneMonthAgo && tx.amount < 0;
      }).length,
      missing_receipt: transactions.filter(
        (tx) => tx.amount < 0 && !tx.hasReceipt
      ).length,
    };
  }, [transactions]);

  // Apply mobile tab filter
  const tabFilteredTransactions = useMemo(() => {
    if (mobileTab === "last_month") {
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= oneMonthAgo && tx.amount < 0;
      });
    }
    if (mobileTab === "missing_receipt") {
      return transactions.filter(
        (tx) => tx.amount < 0 && !tx.hasReceipt
      );
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

  const [columnVisibility, setColumnVisibility] = useState({
    paymentMethod: false, // Cacher la colonne "Moyen de paiement" par défaut
  });

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

    // Filtrer les transactions manuelles (supprimables)
    const manualRows = selectedRows.filter(
      (row) => row.original.source === "MANUAL" || row.original.provider === "manual"
    );
    const bankRows = selectedRows.filter(
      (row) => row.original.source === "BANK" && row.original.provider !== "manual"
    );

    if (bankRows.length > 0) {
      toast.warning(
        `${bankRows.length} transaction(s) bancaire(s) ignorée(s) (non supprimables)`
      );
    }

    if (manualRows.length === 0) {
      toast.error("Aucune transaction manuelle sélectionnée pour la suppression");
      return;
    }

    try {
      // Supprimer les transactions une par une
      let deletedCount = 0;
      let failedCount = 0;

      for (const row of manualRows) {
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
    setSelectedTransaction(transaction);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
    setSelectedTransaction(null);
  };

  const handleEditFromDrawer = (transaction) => {
    setIsDetailDrawerOpen(false);
    handleEditTransaction(transaction);
  };

  const handleDeleteFromDrawer = async (transaction) => {
    setIsDetailDrawerOpen(false);

    if (transaction.source === "invoice") {
      toast.error(
        "Les factures ne peuvent pas être supprimées depuis cette interface"
      );
      return;
    }

    // Seules les transactions manuelles peuvent être supprimées
    if (transaction.source !== "MANUAL" && transaction.provider !== "manual") {
      toast.error(
        "Seules les transactions manuelles peuvent être supprimées"
      );
      return;
    }

    try {
      const result = await deleteTransaction(transaction.id);
      if (result.success) {
        setTimeout(() => {
          refetchExpenses();
        }, 300);
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

      // Construire l'input pour createTransaction
      const transactionInput = {
        workspaceId,
        amount: amount,
        currency: "EUR",
        description: transaction.description || (isIncome ? "Revenu manuel" : "Dépense manuelle"),
        type: transactionType,
        date: transaction.date,
        category: mapCategoryToEnum(transaction.category),
        vendor: transaction.vendor || "",
        notes: transaction.description || "",
      };

      const result = await createTransaction(transactionInput);

      if (result.success) {
        setIsAddTransactionDrawerOpen(false);
        // Le refetch est géré automatiquement par le hook via refetchQueries
        // Mais on peut aussi forcer un refresh pour s'assurer
        setTimeout(() => {
          refetchExpenses();
        }, 300);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la transaction:", error);
    }
  };

  const handleReceiptUploadSuccess = (receiptData) => {
    setIsReceiptUploadDrawerOpen(false);

    if (receiptData.createdExpense) {
      refetch();
      toast.success(
        `Dépense créée avec succès: ${receiptData.createdExpense.title}`
      );
    } else {
      toast.success(`Reçu "${receiptData.fileName}" traité avec succès`);
    }
  };

  // Attacher un reçu à une transaction bancaire (upload via GraphQL)
  const handleAttachReceipt = async (transaction, file) => {
    try {
      // Récupérer l'ID de la transaction originale (pour les transactions bancaires)
      const transactionId =
        transaction.originalTransaction?.id || transaction.id;

      // Upload via mutation GraphQL
      const { data } = await uploadReceiptMutation({
        variables: {
          transactionId,
          workspaceId,
          file,
        },
      });

      if (!data?.uploadTransactionReceipt?.success) {
        throw new Error(
          data?.uploadTransactionReceipt?.message || "Erreur lors de l'upload"
        );
      }

      // Mettre à jour selectedTransaction avec le receiptFile
      if (selectedTransaction) {
        setSelectedTransaction({
          ...selectedTransaction,
          receiptFile: data.uploadTransactionReceipt.receiptFile,
          receiptRequired: false,
        });
      }

      toast.success("Justificatif ajouté avec succès");
      refetch();
    } catch (error) {
      console.error("❌ [ATTACH RECEIPT] Error:", error);
      toast.error(error.message || "Erreur lors de l'upload du justificatif");
      throw error;
    }
  };

  const handleSaveTransaction = async (updatedTransaction) => {
    if (!editingTransaction) return;

    try {
      // Déterminer le type de transaction
      const isIncome = updatedTransaction.type === "INCOME";
      const transactionType = isIncome ? "CREDIT" : "DEBIT";

      // Montant : négatif pour les dépenses, positif pour les revenus
      const amount = isIncome
        ? Math.abs(parseFloat(updatedTransaction.amount))
        : -Math.abs(parseFloat(updatedTransaction.amount));

      const updateInput = {
        description: updatedTransaction.description || "Transaction modifiée",
        amount: amount,
        currency: "EUR",
        category: mapCategoryToEnum(updatedTransaction.category),
        date: updatedTransaction.date,
        type: transactionType,
        vendor: updatedTransaction.vendor,
        notes: updatedTransaction.description,
      };

      const result = await updateTransaction(editingTransaction.id, updateInput);

      if (result.success) {
        handleCloseEditModal();
        // Le refetch est géré automatiquement par le hook via refetchQueries
        setTimeout(() => {
          refetchExpenses();
        }, 300);
      }
    } catch (error) {
      console.error("Erreur lors de la modification de la transaction:", error);
    }
  };

  const handleDownloadAttachment = async (transaction) => {
    try {
      if (!transaction.attachment) {
        toast.error("Aucun justificatif disponible");
        return;
      }

      const cloudflareUrl = transaction.attachment;

      const link = document.createElement("a");
      link.href = cloudflareUrl;
      link.download = `justificatif-${transaction.id}.pdf`;
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
    },
  });

  // État pour les tabs de filtre rapide
  const [activeTab, setActiveTab] = useState("all");

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
      now.getDate()
    );

    const counts = {
      all: transactions.length,
      lastMonth: 0,
      missingReceipt: 0,
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
      now.getDate()
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
    }

    // Appliquer les filtres avancés
    if (advancedFilters.length > 0) {
      result = result.filter((transaction) => {
        return advancedFilters.every((filter) => {
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
    },
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filters and Actions - Fixe en haut */}
      <div className="flex items-center justify-between gap-3 hidden md:flex px-4 sm:px-6 py-4 flex-shrink-0">
        {/* Search + Colonnes + Filtres — côté gauche */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 h-8 w-full sm:w-[300px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
            <Search size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
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

          {/* Gérer les colonnes Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings2 size={14} aria-hidden="true" />
                Gérer les colonnes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Afficher les colonnes</DropdownMenuLabel>
              {tableWithFilteredData
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const label =
                    column.columnDef.meta?.label ||
                    column.columnDef.header ||
                    column.id;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtres avancés Button */}
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={advancedFilters.length > 0 ? "primary" : "filter"}
              >
                <Filter size={14} aria-hidden="true" />
                Filtres
                {advancedFilters.length > 0 && (
                  <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {advancedFilters.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[500px] p-0">
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
                        <SelectTrigger className="w-[140px]">
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

                      {/* Opérateur */}
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

                      {/* Valeur */}
                      {filterValues[filter.field] ? (
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
                  transaction(s) sélectionnée(s) ? Cette action ne peut pas
                  être annulée.
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
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              Toutes
              <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                {transactionCounts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="lastMonth"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              Régler le dernier mois
              <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                {transactionCounts.lastMonth}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="missingReceipt"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
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
                            header.getContext()
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
                    <td className="p-2 pl-4 sm:pl-6"><div className="h-4 w-4 rounded bg-muted animate-pulse" /></td>
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
                        <div className="h-4 w-[140px] rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="p-2"><div className="h-4 w-[70px] rounded bg-muted animate-pulse" /></td>
                    <td className="p-2"><div className="h-4 w-[70px] rounded bg-muted animate-pulse" /></td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
                        <div className="h-4 w-[60px] rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="p-2"><div className="h-4 w-[60px] rounded bg-muted animate-pulse" /></td>
                    <td className="p-2"><div className="h-4 w-[50px] rounded bg-muted animate-pulse" /></td>
                    <td className="p-2"><div className="h-4 w-4 rounded bg-muted animate-pulse" /></td>
                    <td className="p-2 pr-4 sm:pr-6"><div className="h-7 w-7 rounded bg-muted animate-pulse" /></td>
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
                        className={`p-2 align-middle text-sm ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={tableWithFilteredData.getAllColumns().length}
                    className="h-24 text-center p-2"
                  >
                    Aucune transaction trouvée.
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
        activeFilterCount={(expenseTypeFilter ? 1 : 0) + (assignedMemberFilter ? 1 : 0)}
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

      {/* Drawer unifié pour création */}
      <TransactionDetailDrawer
        open={isAddTransactionDrawerOpen}
        onOpenChange={setIsAddTransactionDrawerOpen}
        onSubmit={handleAddTransaction}
        onRefresh={refetch}
        isCreating={true}
      />

      {/* Drawer unifié pour édition */}
      <TransactionDetailDrawer
        transaction={editingTransaction}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleSaveTransaction}
        onRefresh={refetch}
      />

      <ReceiptUploadDrawer
        open={isReceiptUploadDrawerOpen}
        onOpenChange={setIsReceiptUploadDrawerOpen}
        onUploadSuccess={handleReceiptUploadSuccess}
      />
    </div>
  );
}
