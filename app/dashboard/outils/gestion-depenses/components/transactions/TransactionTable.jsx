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
import { AddTransactionDrawer } from "../add-transaction-drawer";
import { ReceiptUploadDrawer } from "../receipt-upload-drawer";
import { ExportDialog } from "../export-dialog";
import {
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useDeleteMultipleExpenses,
  useAddExpenseFile,
} from "@/src/hooks/useExpenses";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { useSession } from "@/src/lib/auth-client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { usePromoteTemporaryFile } from "@/src/hooks/usePromoteTemporaryFile";
import { columns } from "./columns/transactionColumns";
import { multiColumnFilterFn } from "./filters/multiColumnFilterFn";
import { mapCategoryToEnum, mapPaymentMethodToEnum } from "./utils/mappers";
import { DesktopFilters } from "./components/DesktopFilters";
import { MobileToolbar } from "./components/MobileToolbar";
import { DesktopTable } from "./components/DesktopTable";
import { MobileTable } from "./components/MobileTable";
import { TablePagination } from "./components/TablePagination";

export default function TransactionTable({
  expenses: expensesProp = [],
  invoices: invoicesProp = [],
  loading: loadingProp = false,
  refetchExpenses: refetchExpensesProp,
  refetchInvoices: refetchInvoicesProp,
}) {
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

  const [expenseTypeFilter, setExpenseTypeFilter] = useState(null);
  const [assignedMemberFilter, setAssignedMemberFilter] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAddTransactionDrawerOpen, setIsAddTransactionDrawerOpen] =
    useState(false);
  const [isReceiptUploadDrawerOpen, setIsReceiptUploadDrawerOpen] =
    useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const { getAllCollaborators } = useOrganizationInvitations();
  const { organization: activeOrg } = useActiveOrganization();
  const { workspaceId } = useRequiredWorkspace();
  const { data: session } = useSession();
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const currentUser = session?.user;

  useEffect(() => {
    const fetchMembers = async () => {
      if (!activeOrg?.id) {
        console.log("⏳ [DEPENSES] En attente de l'organisation...");
        return;
      }

      try {
        setLoadingMembers(true);
        console.log("🔍 [DEPENSES] Organisation chargée:", activeOrg.id);

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

          console.log("✅ [DEPENSES] Membres finaux:", formattedMembers);
          console.log("🖼️ [DEPENSES] Détails des avatars:");
          formattedMembers.forEach((m) => {
            console.log(`  - ${m.email}: image="${m.image}"`);
          });

          setOrganizationMembers(formattedMembers);
        } else {
          console.error("❌ [DEPENSES] Erreur:", result.error);
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

  const expenses = expensesProp;
  const expensesTotalCount = expensesProp.length;
  const expensesLoading = loadingProp;
  const expensesError = null;
  const refetchExpenses = refetchExpensesProp;

  const { createExpense, loading: createExpenseLoading } = useCreateExpense();
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
      console.log("✅ [PROMOTE] Fichier promu avec succès:", promoteResult.url);
      const transaction = pendingTransactionRef.current;
      transaction.receiptImage = promoteResult.url;
      pendingTransactionRef.current = null;

      handleAddTransaction(transaction);
    }
  }, [promoteResult]);

  const invoices = invoicesProp;
  const invoicesTotalCount = invoicesProp.length;
  const invoicesLoading = loadingProp;
  const invoicesError = null;
  const refetchInvoices = refetchInvoicesProp;

  const paidInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.status === "COMPLETED");
  }, [invoices]);

  const loading = expensesLoading || invoicesLoading;
  const error = expensesError || invoicesError;
  const totalCount = expensesTotalCount + paidInvoices.length;

  const refetch = useCallback(() => {
    refetchExpenses();
    refetchInvoices();
  }, [refetchExpenses, refetchInvoices]);

  const transactions = useMemo(() => {
    const expenseTransactions = expenses.map((expense) => {
      const formattedDate =
        typeof expense.date === "string"
          ? expense.date
          : new Date(expense.date).toISOString().split("T")[0];

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
        source: "expense",
        expenseType: expense.expenseType || "ORGANIZATION",
        assignedMember: expense.assignedMember || null,
      };
    });

    const invoiceTransactions = paidInvoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      date:
        typeof invoice.issueDate === "string"
          ? invoice.issueDate
          : new Date(invoice.issueDate).toISOString().split("T")[0],
      type: "INCOME",
      category: "SERVICES",
      amount: invoice.finalTotalTTC,
      currency: "EUR",
      description: `Facture ${invoice.prefix}${invoice.number} - ${invoice.client.name}`,
      paymentMethod: "BANK_TRANSFER",
      vendor: invoice.client.name,
      invoiceNumber: `${invoice.prefix}${invoice.number}`,
      documentNumber: invoice.number,
      vatAmount: invoice.totalVAT,
      vatRate: null,
      status: "PAID",
      tags: [],
      attachment: null,
      files: [],
      ocrMetadata: null,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      source: "invoice",
      client: invoice.client,
      dueDate: invoice.dueDate,
      totalHT: invoice.totalHT,
      totalTTC: invoice.totalTTC,
    }));

    let allTransactions = [...expenseTransactions, ...invoiceTransactions];

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
  }, [expenses, paidInvoices, expenseTypeFilter, assignedMemberFilter]);

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
        await refetchExpenses();
      }
    } catch (error) {
      console.error("Error deleting expenses:", error);
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

    try {
      const result = await deleteExpense(transaction.id);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const handleAddTransaction = async (transaction) => {
    try {
      let promotedReceiptUrl = transaction.receiptImage;

      if (
        transaction.receiptImage &&
        transaction.receiptImage.includes("/temp/")
      ) {
        console.log(
          "📎 [PROMOTE] Promotion du fichier temporaire:",
          transaction.receiptImage
        );
        try {
          const urlParts = transaction.receiptImage.split("/");
          const tempKey = urlParts.slice(-3).join("/");
          console.log("📋 [PROMOTE] Clé extraite:", tempKey);

          pendingTransactionRef.current = transaction;
          await promoteTemporaryFile(tempKey);
          return;
        } catch (promoteError) {
          console.error("❌ [PROMOTE] Erreur promotion:", promoteError);
          promotedReceiptUrl = transaction.receiptImage;
        }
      }

      transaction.receiptImage = promotedReceiptUrl;

      if (transaction.type === "INCOME") {
        const expenseInput = {
          workspaceId, // ✅ Ajout du workspaceId requis
          title: transaction.description || "Revenu manuel",
          description: transaction.description,
          amount: parseFloat(transaction.amount),
          currency: "EUR",
          category: mapCategoryToEnum(transaction.category),
          date: transaction.date,
          paymentMethod: mapPaymentMethodToEnum(transaction.paymentMethod),
          vendor: transaction.vendor || "",
          status: "PAID",
          isVatDeductible: false,
          notes: `[INCOME] ${transaction.description}`,
        };

        const result = await createExpense(expenseInput);

        if (
          result.success &&
          (promotedReceiptUrl || transaction.receiptImage) &&
          result.expense?.id
        ) {
          try {
            const fileUrl = promotedReceiptUrl || transaction.receiptImage;
            await addExpenseFile(result.expense.id, {
              cloudflareUrl: fileUrl,
              fileName: "receipt.pdf",
              mimeType: fileUrl.toLowerCase().endsWith(".pdf")
                ? "application/pdf"
                : "image/jpeg",
              processOCR: false,
            });
          } catch (fileError) {
            console.error("Erreur ajout fichier:", fileError);
          }
        }

        if (result.success) {
          setIsAddTransactionDrawerOpen(false);
          setTimeout(() => {
            refetchExpenses();
          }, 500);
        }
      } else {
        let assignedMember = null;
        if (transaction.assignedMember && transaction.assignedMember.userId) {
          assignedMember = {
            userId: transaction.assignedMember.userId,
            name: transaction.assignedMember.name,
            email: transaction.assignedMember.email,
            image: transaction.assignedMember.image || null,
          };
        }

        const expenseInput = {
          workspaceId, // ✅ Ajout du workspaceId requis
          title: transaction.description || "Dépense manuelle",
          description: transaction.description,
          amount: parseFloat(transaction.amount),
          currency: "EUR",
          category: mapCategoryToEnum(transaction.category),
          date: transaction.date,
          paymentMethod: mapPaymentMethodToEnum(transaction.paymentMethod),
          vendor: transaction.vendor || "",
          status: "PAID",
          isVatDeductible: true,
          notes: `[EXPENSE] ${transaction.description}`,
          expenseType: transaction.expenseType || "ORGANIZATION",
        };

        if (assignedMember) {
          expenseInput.assignedMember = assignedMember;
        }

        console.log("📝 [CREATE EXPENSE] Données envoyées:", expenseInput);
        const result = await createExpense(expenseInput);
        console.log("📝 [CREATE RESULT]", result);

        if (result.success) {
          if (
            (promotedReceiptUrl || transaction.receiptImage) &&
            result.expense?.id
          ) {
            console.log(
              "📎 [ADD FILE] Ajout du fichier pour l'expense:",
              result.expense.id
            );
            const fileUrl = promotedReceiptUrl || transaction.receiptImage;
            console.log("📎 [ADD FILE] URL Cloudflare:", fileUrl);
            try {
              const fileResult = await addExpenseFile(result.expense.id, {
                cloudflareUrl: fileUrl,
                fileName: "receipt.pdf",
                mimeType: fileUrl.toLowerCase().endsWith(".pdf")
                  ? "application/pdf"
                  : "image/jpeg",
                processOCR: false,
              });
              console.log(
                "✅ [ADD FILE] Fichier ajouté avec succès:",
                fileResult
              );
            } catch (fileError) {
              console.error("❌ [ADD FILE] Erreur ajout fichier:", fileError);
            }
          } else {
            console.log("⚠️ [ADD FILE] Conditions non remplies:", {
              hasReceiptImage: !!(
                promotedReceiptUrl || transaction.receiptImage
              ),
              hasExpenseId: !!result.expense?.id,
            });
          }

          setIsAddTransactionDrawerOpen(false);
          refetchExpenses();
        }
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

  const handleSaveTransaction = async (updatedTransaction) => {
    if (!editingTransaction) return;

    try {
      let assignedMember = null;
      if (updatedTransaction.assignedMember) {
        assignedMember = {
          userId: updatedTransaction.assignedMember.userId,
          name: updatedTransaction.assignedMember.name,
          email: updatedTransaction.assignedMember.email,
          image: updatedTransaction.assignedMember.image || null,
        };
      }

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
        status: "PAID",
        isVatDeductible: true,
        expenseType: updatedTransaction.expenseType || "ORGANIZATION",
        assignedMember: assignedMember,
      };

      const result = await updateExpense(editingTransaction.id, updateInput);

      if (
        result.success &&
        updatedTransaction.receiptImage &&
        editingTransaction.id
      ) {
        const isNewImage =
          updatedTransaction.receiptImage !== editingTransaction.attachment;
        if (isNewImage) {
          try {
            await addExpenseFile(editingTransaction.id, {
              cloudflareUrl: updatedTransaction.receiptImage,
              fileName: "receipt.pdf",
              mimeType: updatedTransaction.receiptImage
                .toLowerCase()
                .endsWith(".pdf")
                ? "application/pdf"
                : "image/jpeg",
              processOCR: false,
            });
          } catch (fileError) {
            console.error("Erreur ajout fichier:", fileError);
          }
        }
      }

      if (result.success) {
        handleCloseEditModal();
        refetchExpenses();
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

  const uniqueTypeValues = useMemo(() => {
    const typeColumn = table.getColumn("type");

    if (!typeColumn) return [];

    const values = Array.from(typeColumn.getFacetedUniqueValues().keys());

    return values.sort();
  }, [table.getColumn("type")?.getFacetedUniqueValues()]);

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
      {/* Desktop Filters */}
      <DesktopFilters
        inputRef={inputRef}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        expenseTypeFilter={expenseTypeFilter}
        setExpenseTypeFilter={setExpenseTypeFilter}
        assignedMemberFilter={assignedMemberFilter}
        setAssignedMemberFilter={setAssignedMemberFilter}
        organizationMembers={organizationMembers}
        table={table}
        deleteMultipleLoading={deleteMultipleLoading}
        handleDeleteRows={handleDeleteRows}
        setIsExportDialogOpen={setIsExportDialogOpen}
        setIsAddTransactionDrawerOpen={setIsAddTransactionDrawerOpen}
        setIsReceiptUploadDrawerOpen={setIsReceiptUploadDrawerOpen}
      />

      {/* Desktop Table */}
      <DesktopTable
        table={table}
        columns={columns}
        error={error}
        handleRefresh={handleRefresh}
        onRowClick={handleViewTransaction}
      />

      {/* Mobile Toolbar */}
      <MobileToolbar
        inputRef={inputRef}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        setIsReceiptUploadDrawerOpen={setIsReceiptUploadDrawerOpen}
        setIsAddTransactionDrawerOpen={setIsAddTransactionDrawerOpen}
      />

      {/* Mobile Table */}
      <MobileTable
        table={table}
        columns={columns}
        error={error}
        loading={loading}
        onRowClick={handleViewTransaction}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        transactions={transactions}
        members={organizationMembers}
      />

      {/* Pagination */}
      <TablePagination
        id={id}
        table={table}
        pagination={pagination}
        totalItems={totalItems}
      />

      {/* Drawers */}
      <TransactionDetailDrawer
        transaction={selectedTransaction}
        open={isDetailDrawerOpen}
        onOpenChange={handleCloseDetailDrawer}
        onEdit={handleEditFromDrawer}
        onDelete={handleDeleteFromDrawer}
      />

      <AddTransactionDrawer
        open={isAddTransactionDrawerOpen}
        onOpenChange={setIsAddTransactionDrawerOpen}
        onSubmit={handleAddTransaction}
        organizationMembers={organizationMembers}
      />

      <AddTransactionDrawer
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleSaveTransaction}
        transaction={editingTransaction}
        organizationMembers={organizationMembers}
      />

      <ReceiptUploadDrawer
        open={isReceiptUploadDrawerOpen}
        onOpenChange={setIsReceiptUploadDrawerOpen}
        onUploadSuccess={handleReceiptUploadSuccess}
      />
    </div>
  );
}
