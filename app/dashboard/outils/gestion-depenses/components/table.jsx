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
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleXIcon,
  Columns3Icon,
  EllipsisIcon,
  FilterIcon,
  ListFilterIcon,
  PlusIcon,
  Landmark,
  TrashIcon,
  TrendingUp,
  TrendingDown,
  Upload,
} from "lucide-react";

import { cn } from "@/src/lib/utils";
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
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { toast } from "@/src/components/ui/sonner";
import { TransactionDetailDrawer } from "./transaction-detail-drawer";
import { AddTransactionDrawer } from "./add-transaction-drawer";
import { ReceiptUploadDrawer } from "./receipt-upload-drawer";
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useDeleteMultipleExpenses,
} from "@/src/hooks/useExpenses";
import { useInvoices, useCreateInvoice } from "@/src/graphql/invoiceQueries";
// Bridge integration removed
import { Plus } from "lucide-react";
import {
  FileTextIcon,
  ImageIcon,
  CreditCardIcon,
  BanknoteIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react";
import { formatDateToFrench } from "@/src/utils/dateFormatter";

// Custom filter function for multi-column searching
const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchableRowContent =
    `${row.original.description} ${row.original.category} ${row.original.paymentMethod} ${row.original.amount}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

const typeFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const type = row.getValue(columnId);
  return filterValue.includes(type);
};

const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Date",
    accessorKey: "date",
    cell: ({ row }) => {
      const dateValue = row.getValue("date");
      const formattedDate = formatDateToFrench(dateValue);
      return <div className="font-normal">{formattedDate}</div>;
    },
    size: 120,
    enableHiding: false,
  },
  {
    header: "Type",
    accessorKey: "type",
    cell: ({ row }) => {
      const type = row.getValue("type");
      const source = row.original.source;

      // Configuration des badges selon le type et la source
      const getBadgeConfig = () => {
        // Bridge transactions removed - keeping only expenses and invoices
        if (false) {
          if (type === "INCOME") {
            return {
              className:
                "bg-transparent border-blue-300 text-blue-800 font-normal",
              icon: <ArrowUpIcon size={12} />,
              label: "Virement reçu",
            };
          } else {
            return {
              className:
                "bg-transparent border-blue-300 text-blue-800 font-normal",
              icon: <Landmark size={12} />,
              label: "Virement",
            };
          }
        }

        // Factures - Entrées d'argent (vert)
        if (type === "INCOME" && source === "invoice") {
          return {
            className: "bg-transparent bg-green-50 text-green-800 font-normal",
            icon: <TrendingUp size={12} />,
            label: "Facture",
          };
        }

        // Entrées manuelles - Entrées d'argent (vert) basées sur les notes
        if (source === "expense") {
          const notes = row.original.notes;
          const isVatDeductible = row.original.isVatDeductible;
          const isIncome =
            (notes && notes.includes("[INCOME]")) || isVatDeductible === false;

          if (isIncome) {
            return {
              className:
                "bg-transparent bg-green-50 text-green-800 font-normal",
              icon: <TrendingUp size={12} />,
              label: "Entrée",
            };
          } else {
            // Dépenses manuelles - Sorties d'argent (rouge) avec sous-type
            const subType = row.original.subType;
            let subLabel = "Dépense";

            switch (subType) {
              case "transport":
                subLabel = "Transport";
                break;
              case "repas":
                subLabel = "Repas";
                break;
              case "bureau":
                subLabel = "Bureau";
                break;
              case "prestation":
                subLabel = "Prestation";
                break;
              default:
                subLabel = "Dépense";
            }

            return {
              className: "bg-transparent bg-red-50 text-red-800 font-normal",
              icon: <TrendingDown size={12} />,
              label: subLabel,
            };
          }
        }

        // Fallback
        return {
          className: "bg-transparent border-gray-300 text-gray-800 font-normal",
          icon: <ArrowDownIcon size={12} />,
          label: "Inconnu",
        };
      };

      const config = getBadgeConfig();

      return (
        <Badge
          className={cn("flex items-center gap-1 w-fit", config.className)}
        >
          {config.icon} {config.label}
        </Badge>
      );
    },
    size: 100,
    filterFn: typeFilterFn,
  },
  {
    header: "Catégorie",
    accessorKey: "category",
    cell: ({ row }) => (
      <div className="font-normal">{row.getValue("category")}</div>
    ),
    size: 140,
  },
  {
    header: "Montant",
    accessorKey: "amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount");
      const type = row.getValue("type");
      return (
        <div
          className={cn(
            "font-normal text-left",
            type === "INCOME" ? "text-green-600" : "text-red-600"
          )}
        >
          {type === "INCOME" ? "+" : "-"}
          {amount.toFixed(2)} €
        </div>
      );
    },
    size: 120,
  },
  {
    header: "Description",
    accessorKey: "description",
    cell: ({ row }) => (
      <div
        className="max-w-[200px] truncate"
        title={row.getValue("description")}
      >
        {row.getValue("description")}
      </div>
    ),
    size: 200,
    filterFn: multiColumnFilterFn,
  },
  {
    header: "Moyen de paiement",
    accessorKey: "paymentMethod",
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod");
      const getIcon = () => {
        switch (method) {
          case "CARD":
            return <CreditCardIcon size={14} />;
          case "CASH":
            return <BanknoteIcon size={14} />;
          case "TRANSFER":
            return <FileTextIcon size={14} />;
          default:
            return <CreditCardIcon size={14} />;
        }
      };

      const getLabel = () => {
        switch (method) {
          case "CARD":
            return "Carte";
          case "CASH":
            return "Espèces";
          case "TRANSFER":
            return "Virement";
          case "CHECK":
            return "Chèque";
          default:
            return method;
        }
      };

      return (
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm">{getLabel()}</span>
        </div>
      );
    },
    size: 150,
  },
  {
    header: "Justificatif",
    accessorKey: "attachment",
    cell: ({ row }) => {
      const attachment = row.getValue("attachment");
      return attachment ? (
        <div className="flex items-center gap-1 text-blue-600">
          <ImageIcon size={14} />
          <span className="text-xs">Oui</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">Non</span>
      );
    },
    size: 100,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <RowActions
            row={row}
            onEdit={table.options.meta?.onEdit}
            onRefresh={table.options.meta?.onRefresh}
            onDownloadAttachment={table.options.meta?.onDownloadAttachment}
          />
        </div>
      );
    },
    size: 60,
    enableHiding: false,
  },
];

// Données d'exemple pour les transactions
const sampleTransactions = [
  {
    id: 1,
    date: "2024-01-15",
    type: "INCOME",
    category: "Salaire",
    amount: 3500.0,
    description: "Salaire mensuel janvier",
    paymentMethod: "TRANSFER",
    attachment: true,
  },
  {
    id: 2,
    date: "2024-01-16",
    type: "EXPENSE",
    category: "Alimentation",
    amount: 85.5,
    description: "Courses supermarché",
    paymentMethod: "CARD",
    attachment: false,
  },
  {
    id: 3,
    date: "2024-01-17",
    type: "EXPENSE",
    category: "Transport",
    amount: 45.2,
    description: "Plein d'essence",
    paymentMethod: "CARD",
    attachment: true,
  },
  {
    id: 4,
    date: "2024-01-18",
    type: "INCOME",
    category: "Freelance",
    amount: 750.0,
    description: "Mission développement web",
    paymentMethod: "TRANSFER",
    attachment: true,
  },
  {
    id: 5,
    date: "2024-01-19",
    type: "EXPENSE",
    category: "Logement",
    amount: 1200.0,
    description: "Loyer mensuel",
    paymentMethod: "TRANSFER",
    attachment: false,
  },
];

export default function TransactionTable() {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 8,
  });
  const inputRef = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAddTransactionDrawerOpen, setIsAddTransactionDrawerOpen] =
    useState(false);
  const [isReceiptUploadDrawerOpen, setIsReceiptUploadDrawerOpen] =
    useState(false);

  // Récupération des dépenses depuis l'API
  const {
    expenses,
    totalCount: expensesTotalCount,
    loading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses({
    status: "PAID", // Récupérer les dépenses payées
    page: 1,
    limit: 100, // Récupérer plus de données pour la pagination côté client
  });

  // Hooks pour la création, modification et suppression
  const { createExpense, loading: createLoading } = useCreateExpense();
  const { updateExpense, loading: updateLoading } = useUpdateExpense();
  const { createInvoice, loading: createInvoiceLoading } = useCreateInvoice();
  const { deleteExpense, loading: deleteLoading } = useDeleteExpense();
  const { deleteMultipleExpenses, loading: deleteMultipleLoading } =
    useDeleteMultipleExpenses();

  // Récupération des factures payées depuis l'API
  const {
    invoices,
    totalCount: invoicesTotalCount,
    loading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices();

  // Filtrer les factures payées (statut COMPLETED)
  const paidInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.status === "COMPLETED");
  }, [invoices]);

  // Bridge transactions removed

  // Combiner les états de chargement et d'erreur
  const loading = expensesLoading || invoicesLoading;
  const error = expensesError || invoicesError;
  const totalCount = expensesTotalCount + paidInvoices.length;

  // Fonction de refetch combinée
  const refetch = useCallback(() => {
    refetchExpenses();
    refetchInvoices();
  }, [refetchExpenses, refetchInvoices]);

  // Mapper les dépenses et factures vers le format attendu par le tableau
  const transactions = useMemo(() => {
    // Mapper les dépenses (SORTIES D'ARGENT)
    const expenseTransactions = expenses.map((expense) => {
      const formattedDate =
        typeof expense.date === "string"
          ? expense.date
          : new Date(expense.date).toISOString().split("T")[0];

      return {
        id: expense.id,
        date: formattedDate,
        type: "EXPENSE", // Dépense = Sortie d'argent
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
        source: "expense", // Identifier la source
      };
    });

    // Mapper les factures payées (ENTRÉES D'ARGENT)
    const invoiceTransactions = paidInvoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      date:
        typeof invoice.issueDate === "string"
          ? invoice.issueDate
          : new Date(invoice.issueDate).toISOString().split("T")[0],
      type: "INCOME", // Facture = Entrée d'argent
      category: "SERVICES", // Catégorie par défaut pour les factures
      amount: invoice.finalTotalTTC,
      currency: "EUR",
      description: `Facture ${invoice.prefix}${invoice.number} - ${invoice.client.name}`,
      paymentMethod: "BANK_TRANSFER", // Méthode par défaut
      vendor: invoice.client.name,
      invoiceNumber: `${invoice.prefix}${invoice.number}`,
      documentNumber: invoice.number,
      vatAmount: invoice.totalVAT,
      vatRate: null, // Non applicable pour les factures
      status: "PAID", // Statut payé
      tags: [],
      attachment: null, // Les factures n'ont pas de fichiers attachés comme les dépenses
      files: [],
      ocrMetadata: null,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      source: "invoice", // Identifier la source
      // Données spécifiques aux factures
      client: invoice.client,
      dueDate: invoice.dueDate,
      totalHT: invoice.totalHT,
      totalTTC: invoice.totalTTC,
    }));

    // Combiner et trier par date (plus récent en premier)
    const allTransactions = [...expenseTransactions, ...invoiceTransactions];

    // Trier sans convertir les dates en timestamps
    return allTransactions.sort((a, b) => {
      const dateA =
        typeof a.date === "string"
          ? a.date
          : new Date(a.date).toISOString().split("T")[0];
      const dateB =
        typeof b.date === "string"
          ? b.date
          : new Date(b.date).toISOString().split("T")[0];
      return dateB.localeCompare(dateA);
    });
  }, [expenses, paidInvoices]);

  const totalItems = totalCount;

  const [sorting, setSorting] = useState([
    {
      id: "date",
      desc: true,
    },
  ]);

  // Effet pour gérer la recherche globale
  useEffect(() => {
    const timer = setTimeout(() => {
      // La recherche sera gérée localement pour l'instant
    }, 300);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  const handleDeleteRows = async () => {
    const selectedRows = table.getSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      toast.error("Aucune transaction sélectionnée");
      return;
    }

    const expenseRows = selectedRows.filter(
      (row) => row.original.source === "expense"
    );
    const invoiceRows = selectedRows.filter(
      (row) => row.original.source === "invoice"
    );

    if (invoiceRows.length > 0) {
      toast.warning(
        `${invoiceRows.length} facture(s) ignorée(s) (non supprimables)`
      );
    }

    if (expenseRows.length === 0) {
      toast.error("Aucune dépense sélectionnée pour la suppression");
      return;
    }

    try {
      const expenseIds = expenseRows.map((row) => row.original.id);
      const result = await deleteMultipleExpenses(expenseIds);

      if (result.success) {
        table.resetRowSelection();
        // Rafraîchir manuellement les données pour mise à jour en temps réel
        await refetchExpenses();
        // Le toast de succès est géré dans le hook
      }
    } catch (error) {
      console.error("Error deleting expenses:", error);
      // Le toast d'erreur est géré dans le hook
    }
  };

  const handleRefresh = async () => {
    try {
      // Simulation de rafraîchissement
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

    // Vérifier si c'est une dépense (seules les dépenses peuvent être supprimées)
    if (transaction.source === "invoice") {
      toast.error(
        "Les factures ne peuvent pas être supprimées depuis cette interface"
      );
      return;
    }

    try {
      const result = await deleteExpense(transaction.id);
      // Le toast de succès/erreur est géré dans le hook
    } catch (error) {
      console.error("Error deleting expense:", error);
      // Le toast d'erreur est géré dans le hook
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const handleAddTransaction = async (transaction) => {
    try {
      if (transaction.type === "INCOME") {
        // Pour les revenus, créer une dépense avec montant positif
        const expenseInput = {
          title: transaction.description || "Revenu manuel",
          description: transaction.description,
          amount: parseFloat(transaction.amount), // Montant positif pour les revenus
          currency: "EUR",
          category: mapCategoryToEnum(transaction.category),
          date: transaction.date,
          paymentMethod: mapPaymentMethodToEnum(transaction.paymentMethod),
          status: "PAID",
          isVatDeductible: false, // Les revenus ne sont généralement pas déductibles
          notes: `[INCOME] ${transaction.description}`,
          // Retirer le champ type car il n'existe pas dans le modèle Expense
        };

        const result = await createExpense(expenseInput);

        if (result.success) {
          setIsAddTransactionDrawerOpen(false);
          // Forcer le refetch des données pour mettre à jour les graphiques
          setTimeout(() => {
            refetchExpenses();
          }, 500);
        }
      } else {
        // Pour les dépenses, utiliser l'API existante
        const expenseInput = {
          title: transaction.description || "Dépense manuelle",
          description: transaction.description,
          amount: parseFloat(transaction.amount),
          currency: "EUR",
          category: mapCategoryToEnum(transaction.category),
          date: transaction.date,
          paymentMethod: mapPaymentMethodToEnum(transaction.paymentMethod),
          status: "PAID",
          isVatDeductible: true,
          notes: `[EXPENSE] ${transaction.description}`,
          // Retirer le champ type car il n'existe pas dans le modèle Expense
        };

        const result = await createExpense(expenseInput);

        if (result.success) {
          setIsAddTransactionDrawerOpen(false);
          // Forcer le refetch des données pour mettre à jour les graphiques
          refetchExpenses();
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la transaction:", error);
    }
  };

  // Fonction pour mapper les catégories du formulaire vers les enums de l'API
  const mapCategoryToEnum = (category) => {
    const categoryMap = {
      // Mapping depuis le formulaire (minuscules)
      bureau: "OFFICE_SUPPLIES",
      transport: "TRAVEL",
      repas: "MEALS",
      materiel: "EQUIPMENT",
      marketing: "MARKETING",
      formation: "TRAINING",
      autre: "OTHER",
      // Mapping ancien format (majuscules) pour compatibilité
      Transport: "TRAVEL",
      Repas: "MEALS",
      Bureau: "OFFICE_SUPPLIES",
      Prestation: "SERVICES",
      Alimentation: "MEALS",
      Logement: "RENT",
      Salaire: "SALARIES",
      Freelance: "SERVICES",
      "": "OTHER", // Catégorie vide par défaut
    };

    return categoryMap[category] || "OTHER";
  };

  // Fonction pour mapper les méthodes de paiement du formulaire vers les enums de l'API
  const mapPaymentMethodToEnum = (paymentMethod) => {
    const paymentMethodMap = {
      CARD: "CREDIT_CARD",
      CASH: "CASH",
      TRANSFER: "BANK_TRANSFER",
      CHECK: "CHECK",
    };

    return paymentMethodMap[paymentMethod] || "BANK_TRANSFER";
  };

  const handleReceiptUploadSuccess = (receiptData) => {
    setIsReceiptUploadDrawerOpen(false);

    // Si une dépense a été créée, rafraîchir les données
    if (receiptData.createdExpense) {
      refetch(); // Rafraîchir la liste des dépenses
      toast.success(
        `Dépense créée avec succès: ${receiptData.createdExpense.title}`
      );
    } else {
      toast.success(`Reçu "${receiptData.fileName}" traité avec succès`);
    }
  };

  const handleSaveTransaction = async (updatedTransaction) => {
    if (!editingTransaction) return;

    try {
      // Mapper les données du formulaire vers le format de l'API
      const updateInput = {
        title: updatedTransaction.description || "Transaction modifiée",
        description: updatedTransaction.description,
        amount: parseFloat(updatedTransaction.amount),
        currency: "EUR",
        category: mapCategoryToEnum(updatedTransaction.category),
        date: updatedTransaction.date,
        paymentMethod: mapPaymentMethodToEnum(updatedTransaction.paymentMethod),
        vendor: updatedTransaction.vendor,
        notes: updatedTransaction.description,
        status: "PAID", // Garder le statut PAID pour les dépenses modifiées
        isVatDeductible: true, // Valeur par défaut
      };

      const result = await updateExpense(editingTransaction.id, updateInput);

      if (result.success) {
        handleCloseEditModal();
        // Forcer le refetch des données pour mettre à jour le tableau
        refetchExpenses();
      }
    } catch (error) {
      console.error("Erreur lors de la modification de la transaction:", error);
    }
  };

  // Fonction pour télécharger le justificatif via l'URL Cloudflare
  const handleDownloadAttachment = async (transaction) => {
    try {
      if (!transaction.attachment) {
        toast.error("Aucun justificatif disponible");
        return;
      }

      // L'URL Cloudflare est directement utilisable pour le téléchargement
      const cloudflareUrl = transaction.attachment;

      // Créer un lien de téléchargement temporaire
      const link = document.createElement("a");
      link.href = cloudflareUrl;
      link.download = `justificatif-${transaction.id}.pdf`; // Nom par défaut
      link.target = "_blank"; // Ouvrir dans un nouvel onglet si le téléchargement échoue

      // Déclencher le téléchargement
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
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: multiColumnFilterFn,
    meta: {
      onEdit: handleEditTransaction,
      onRefresh: refetch,
      onDownloadAttachment: handleDownloadAttachment,
    },
  });

  // Get unique type values
  const uniqueTypeValues = useMemo(() => {
    const typeColumn = table.getColumn("type");

    if (!typeColumn) return [];

    const values = Array.from(typeColumn.getFacetedUniqueValues().keys());

    return values.sort();
  }, [table.getColumn("type")?.getFacetedUniqueValues()]);

  // Get counts for each type
  const typeCounts = useMemo(() => {
    const typeColumn = table.getColumn("type");
    if (!typeColumn) return new Map();
    return typeColumn.getFacetedUniqueValues();
  }, [table.getColumn("type")?.getFacetedUniqueValues()]);

  const selectedTypes = useMemo(() => {
    const filterValue = table.getColumn("type")?.getFilterValue();
    return filterValue ?? [];
  }, [table.getColumn("type")?.getFilterValue()]);

  const handleTypeChange = (checked, value) => {
    const filterValue = table.getColumn("type")?.getFilterValue();
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table
      .getColumn("type")
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  return (
    <div className="space-y-4">
      {/* Filters - Desktop */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Filter by description, category, amount */}
          <div className="relative">
            <Input
              ref={inputRef}
              className={cn(
                "peer min-w-60 ps-9",
                Boolean(globalFilter) && "pe-9"
              )}
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
              }}
              placeholder="Rechercher par description, catégorie, montant..."
              type="text"
              aria-label="Filter transactions"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <ListFilterIcon size={16} aria-hidden="true" />
            </div>
            {Boolean(globalFilter) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
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
          {/* Filter by type */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="font-normal">
                <FilterIcon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Type
                {selectedTypes.length > 0 && (
                  <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                    {selectedTypes.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs font-medium">
                  Filtres
                </div>
                <div className="space-y-3">
                  {uniqueTypeValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-${i}`}
                        checked={selectedTypes.includes(value)}
                        onCheckedChange={(checked) =>
                          handleTypeChange(checked, value)
                        }
                      />
                      <Label className="flex grow justify-between gap-2 font-normal">
                        {value === "INCOME" ? "Entrées" : "Sorties"}{" "}
                        <span className="text-muted-foreground ms-2 text-xs">
                          {typeCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="font-normal">
                <Columns3Icon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Vue
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
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
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-3">
          {/* Delete button */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="ml-auto"
                  variant="outline"
                  disabled={deleteMultipleLoading}
                >
                  <TrashIcon
                    className="-ms-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  {deleteMultipleLoading ? "Suppression..." : "Supprimer"}
                  <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                    {table.getSelectedRowModel().rows.length}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                    aria-hidden="true"
                  >
                    <CircleAlertIcon className="opacity-80" size={16} />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Êtes-vous absolument sûr ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {(() => {
                        const selectedRows = table.getSelectedRowModel().rows;
                        const expenseRows = selectedRows.filter(
                          (row) => row.original.source === "expense"
                        );
                        const invoiceRows = selectedRows.filter(
                          (row) => row.original.source === "invoice"
                        );
                        if (expenseRows.length === 0) {
                          return "Aucune dépense sélectionnée pour la suppression";
                        }

                        let message = `Êtes-vous sûr de vouloir supprimer ${expenseRows.length} dépense${expenseRows.length > 1 ? "s" : ""} ?`;

                        if (invoiceRows.length > 0) {
                          message += ` ${invoiceRows.length} facture${invoiceRows.length > 1 ? "s" : ""} sera${invoiceRows.length > 1 ? "ont" : ""} ignorée${invoiceRows.length > 1 ? "s" : ""} (non supprimables).`;
                        }

                        return message;
                      })()}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteRows}
                    disabled={
                      deleteMultipleLoading ||
                      table
                        .getSelectedRowModel()
                        .rows.filter((row) => row.original.source === "expense")
                        .length === 0
                    }
                  >
                    {deleteMultipleLoading ? "Suppression..." : "Supprimer"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {/* Add transaction button */}
          <Button
            className="ml-auto cursor-pointer font-normal"
            variant="default"
            onClick={() => setIsReceiptUploadDrawerOpen(true)}
          >
            {/* <Plus className="-ms-1 opacity-60" size={16} aria-hidden="true" />*/}
            Ajouter un reçu
          </Button>
          <Button
            className="ml-auto cursor-pointer font-normal"
            variant="outline"
            onClick={() => setIsAddTransactionDrawerOpen(true)}
          >
            {/* <Plus className="-ms-1 opacity-60" size={16} aria-hidden="true" />*/}
            Ajouter manuellement
          </Button>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block bg-background overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="h-11 font-normal"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                              "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            // Enhanced keyboard handling for sorting
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: (
                              <ChevronUpIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDownIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted()] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="last:py-0">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-red-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span>Erreur lors du chargement des transactions</span>
                    <button
                      onClick={handleRefresh}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Réessayer
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucune transaction trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Toolbar - Style Notion */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              className={cn(
                "peer w-full ps-9",
                Boolean(globalFilter) && "pe-9"
              )}
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
              }}
              placeholder="Rechercher..."
              type="text"
              aria-label="Filter transactions"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <ListFilterIcon size={16} aria-hidden="true" />
            </div>
            {Boolean(globalFilter) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* Bouton Ajouter un reçu - Icône seulement */}
          <Button
            size="icon"
            variant="default"
            className="bg-[#5A50FF]"
            onClick={() => setIsReceiptUploadDrawerOpen(true)}
            aria-label="Ajouter un reçu"
          >
            <Upload size={16} />
          </Button>

          {/* Bouton Ajouter manuellement - Icône seulement */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => setIsAddTransactionDrawerOpen(true)}
            aria-label="Ajouter manuellement"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>

      {/* Table - Mobile style (Notion-like) */}
      <div className="md:hidden overflow-x-auto">
        <Table className="w-max">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-gray-100 dark:border-gray-400"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-25 dark:hover:bg-gray-900"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-red-500"
                >
                  Erreur lors du chargement des transactions
                </TableCell>
              </TableRow>
            ) : loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Chargement...
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucune transaction trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Desktop only */}
      <div className="hidden md:flex items-center justify-between gap-8">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="max-sm:sr-only font-normal">
            Lignes par page
          </Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger id={id} className="w-fit whitespace-nowrap">
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
              {[5, 8, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Page number information */}
        <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
          <p
            className="text-muted-foreground text-sm whitespace-nowrap"
            aria-live="polite"
          >
            <span className="text-foreground">
              {pagination.pageIndex * pagination.pageSize + 1}-
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                totalItems || 0
              )}
            </span>{" "}
            sur <span className="text-foreground">{totalItems || 0}</span>
          </p>
        </div>

        {/* Pagination buttons */}
        <div>
          <Pagination>
            <PaginationContent>
              {/* First page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              {/* Previous page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              {/* Next page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              {/* Last page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTransaction}
        open={isDetailDrawerOpen}
        onOpenChange={handleCloseDetailDrawer}
        onEdit={handleEditFromDrawer}
        onDelete={handleDeleteFromDrawer}
      />

      {/* Add Transaction Drawer */}
      <AddTransactionDrawer
        open={isAddTransactionDrawerOpen}
        onOpenChange={setIsAddTransactionDrawerOpen}
        onSubmit={handleAddTransaction}
      />

      {/* Edit Transaction Drawer */}
      <AddTransactionDrawer
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleSaveTransaction}
        transaction={editingTransaction}
      />

      {/* Receipt Upload Drawer */}
      <ReceiptUploadDrawer
        open={isReceiptUploadDrawerOpen}
        onOpenChange={setIsReceiptUploadDrawerOpen}
        onUploadSuccess={handleReceiptUploadSuccess}
      />
    </div>
  );
}

function RowActions({ row, onEdit, onRefresh, onDownloadAttachment }) {
  const transaction = row.original;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteExpense, loading: deleteLoading } = useDeleteExpense();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
    }
  };

  const handleDelete = async () => {
    // Vérifier si c'est une dépense (seules les dépenses peuvent être supprimées)
    if (transaction.source === "invoice") {
      toast.error(
        "Les factures ne peuvent pas être supprimées depuis cette interface"
      );
      setShowDeleteDialog(false);
      return;
    }

    try {
      const result = await deleteExpense(transaction.id);
      setShowDeleteDialog(false);

      // Si la suppression a réussi, forcer le rafraîchissement
      if (result.success && onRefresh) {
        onRefresh();
      }
      // Le toast de succès/erreur est géré dans le hook
    } catch (error) {
      console.error("Error deleting expense:", error);
      setShowDeleteDialog(false);
      // Le toast d'erreur est géré dans le hook
    }
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(transaction.description);
    toast.success("Description copiée dans le presse-papier");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="shadow-none"
              aria-label="Actions de la transaction"
            >
              <EllipsisIcon size={16} aria-hidden="true" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={handleEdit}
              disabled={transaction.source === "invoice"}
            >
              <span>Modifier</span>
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyDescription}>
              <span>Copier description</span>
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
            {transaction.attachment && (
              <DropdownMenuItem
                onClick={() =>
                  onDownloadAttachment && onDownloadAttachment(transaction)
                }
              >
                <span>Afficher le justificatif</span>
                <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            disabled={deleteLoading || transaction.source === "invoice"}
          >
            <span>{deleteLoading ? "Suppression..." : "Supprimer"}</span>
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette transaction ? Cette
              action est irréversible.
              <br />
              <strong>Description :</strong> {transaction.description}
              <br />
              <strong>Montant :</strong> {transaction.amount.toFixed(2)} €
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
