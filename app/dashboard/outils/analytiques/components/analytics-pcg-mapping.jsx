"use client";

import { useState, useMemo, Fragment } from "react";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useUpdateTransaction } from "@/src/hooks/useTransactions";
import { TransactionDetailDrawer } from "@/app/dashboard/outils/transactions/components/transaction-detail-drawer";
import { mapPaymentMethodToEnum } from "@/app/dashboard/outils/transactions/components/transactions/utils/mappers";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/src/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { formatDateToFrench } from "@/src/utils/dateFormatter";
import { findMerchant } from "@/lib/merchants-config";
import {
  Search,
  ArrowUpDown,
  Info,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  PenLine,
  ExternalLink,
} from "lucide-react";
import { CONFIDENCE_CONFIG } from "@/lib/pcg-mapping";

function formatAmount(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function ConfidenceBadge({ confidence }) {
  const key = confidence?.toLowerCase();
  const config = CONFIDENCE_CONFIG[key];
  if (!config) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      {config.label}
    </span>
  );
}

export function AnalyticsPCGMapping() {
  const { transactions, isLoading, refreshData } = useDashboardData();
  const { updateTransaction } = useUpdateTransaction();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("totalAmount");
  const [sortDir, setSortDir] = useState("desc");
  const [expandedAccounts, setExpandedAccounts] = useState(new Set());
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Handler appelé par le drawer quand l'utilisateur sauvegarde les modifications
  const handleSaveTransaction = async (updatedTransaction) => {
    const transactionId =
      updatedTransaction.id ||
      updatedTransaction.originalTransaction?.id ||
      selectedTransaction?.id;
    if (!transactionId) return;

    const isIncome = updatedTransaction.type === "INCOME";
    const amount = isIncome
      ? Math.abs(parseFloat(updatedTransaction.amount))
      : -Math.abs(parseFloat(updatedTransaction.amount));

    const updateInput = {
      description: updatedTransaction.description || "Transaction modifiée",
      amount,
      currency: "EUR",
      category: updatedTransaction.category || "OTHER",
      date: updatedTransaction.date,
      type: isIncome ? "CREDIT" : "DEBIT",
      vendor: updatedTransaction.vendor,
      paymentMethod: mapPaymentMethodToEnum(updatedTransaction.paymentMethod),
      notes: updatedTransaction.description,
    };

    if (updatedTransaction.pcgAccountNumero) {
      updateInput.pcgAccountNumero = updatedTransaction.pcgAccountNumero;
    }

    const result = await updateTransaction(transactionId, updateInput);
    if (result.success) {
      setIsDrawerOpen(false);
      await refreshData();
    }
  };

  const openTransaction = (tx) => {
    // Mapper les données Transaction (GraphQL) vers le format attendu par le drawer
    setSelectedTransaction({
      id: tx.id,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.description,
      date: tx.date || tx.processedAt || tx.createdAt,
      category: tx.category,
      vendor: tx.metadata?.vendor || null,
      paymentMethod: tx.metadata?.paymentMethod || "CARD",
      type: tx.amount > 0 ? "INCOME" : "EXPENSE",
      source: tx.provider === "manual" ? "MANUAL" : "BANK",
      provider: tx.provider,
      status: tx.status === "completed" ? "PAID" : tx.status?.toUpperCase(),
      receiptFile: tx.receiptFile,
      hasReceipt: !!tx.receiptFile?.url || !!tx.linkedInvoice?.id,
      pcgAccount: tx.pcgAccount || null,
      metadata: tx.metadata || {},
      linkedInvoice: tx.linkedInvoice || null,
      linkedInvoiceId: tx.linkedInvoiceId || null,
      reconciliationStatus: tx.reconciliationStatus || null,
      originalTransaction: {
        id: tx.id,
        externalId: tx.externalId,
        provider: tx.provider,
      },
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    });
    setIsDrawerOpen(true);
  };

  const toggleAccount = (numero) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(numero)) next.delete(numero);
      else next.add(numero);
      return next;
    });
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "numero" ? "asc" : "desc");
    }
  };

  // Grouper les transactions par compte PCG
  const accountGroups = useMemo(() => {
    if (!transactions?.length) return [];

    const groups = new Map();
    let unassignedCount = 0;
    let unassignedAmount = 0;
    const unassignedTxs = [];

    for (const tx of transactions) {
      const pcg = tx.pcgAccount;
      if (!pcg?.numero) {
        unassignedCount++;
        unassignedAmount += Math.abs(tx.amount || 0);
        unassignedTxs.push(tx);
        continue;
      }

      if (!groups.has(pcg.numero)) {
        groups.set(pcg.numero, {
          numero: pcg.numero,
          intitule: pcg.intitule || "",
          count: 0,
          totalDebit: 0,
          totalCredit: 0,
          totalNet: 0,
          manualCount: 0,
          transactions: [],
        });
      }
      const g = groups.get(pcg.numero);
      g.count++;
      if (tx.amount > 0) g.totalCredit += tx.amount;
      else g.totalDebit += Math.abs(tx.amount);
      g.totalNet += tx.amount || 0;
      if (pcg.isManual) g.manualCount++;
      g.transactions.push(tx);
    }

    // Trier les transactions dans chaque groupe par date desc
    for (const g of groups.values()) {
      g.transactions.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      g.totalAmount = g.totalDebit + g.totalCredit;
    }

    let result = Array.from(groups.values());

    // Ajouter le groupe "non affecté" s'il y en a
    if (unassignedCount > 0) {
      result.push({
        numero: "",
        intitule: "Non affecté",
        count: unassignedCount,
        totalDebit: unassignedAmount,
        totalCredit: 0,
        totalNet: -unassignedAmount,
        totalAmount: unassignedAmount,
        manualCount: 0,
        transactions: unassignedTxs.sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt || 0).getTime();
          const dateB = new Date(b.date || b.createdAt || 0).getTime();
          return dateB - dateA;
        }),
        isUnassigned: true,
      });
    }

    return result;
  }, [transactions]);

  const filteredGroups = useMemo(() => {
    let items = [...accountGroups];

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (g) =>
          g.numero.includes(s) ||
          g.intitule.toLowerCase().includes(s) ||
          g.transactions.some((t) =>
            (t.description || "").toLowerCase().includes(s),
          ),
      );
    }

    items.sort((a, b) => {
      // Toujours mettre "non affecté" en dernier
      if (a.isUnassigned) return 1;
      if (b.isUnassigned) return -1;

      let cmp = 0;
      if (sortField === "numero") cmp = a.numero.localeCompare(b.numero);
      else if (sortField === "count") cmp = a.count - b.count;
      else if (sortField === "totalAmount") cmp = a.totalAmount - b.totalAmount;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [accountGroups, search, sortField, sortDir]);

  // Stats globales
  const stats = useMemo(() => {
    const totalTxs = transactions?.length || 0;
    const assignedTxs =
      transactions?.filter((t) => t.pcgAccount?.numero).length || 0;
    const unassignedTxs = totalTxs - assignedTxs;
    const manualTxs =
      transactions?.filter((t) => t.pcgAccount?.isManual).length || 0;
    const uniqueAccounts = accountGroups.filter((g) => !g.isUnassigned).length;

    return {
      totalTxs,
      assignedTxs,
      unassignedTxs,
      manualTxs,
      uniqueAccounts,
      assignedPercent:
        totalTxs > 0 ? Math.round((assignedTxs / totalTxs) * 100) : 0,
    };
  }, [transactions, accountGroups]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 sm:px-6">
      {/* Info banner */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              Transactions regroupées par compte du Plan Comptable Général
            </p>
            <p>
              Visualise tes transactions classées par compte PCG. Clique sur une
              ligne pour voir le détail des transactions affectées à chaque
              compte. Les transactions sans PCG apparaissent en bas du tableau.
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg border p-3">
          <div className="text-sm text-muted-foreground">Transactions</div>
          <div className="text-2xl font-semibold">{stats.totalTxs}</div>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: "#22c55e33" }}
        >
          <div className="text-sm" style={{ color: "#22c55e" }}>
            Affectées
          </div>
          <div className="text-2xl font-semibold">{stats.assignedTxs}</div>
          <div className="text-xs text-muted-foreground">
            {stats.assignedPercent}%
          </div>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: "#ef444433" }}
        >
          <div className="text-sm" style={{ color: "#ef4444" }}>
            Non affectées
          </div>
          <div className="text-2xl font-semibold">{stats.unassignedTxs}</div>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: "#3b82f633" }}
        >
          <div className="text-sm" style={{ color: "#3b82f6" }}>
            Manuelles
          </div>
          <div className="text-2xl font-semibold">{stats.manualTxs}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-sm text-muted-foreground">Comptes PCG</div>
          <div className="text-2xl font-semibold">{stats.uniqueAccounts}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un compte PCG, une description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10" />
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("numero")}
                >
                  <div className="flex items-center gap-1">
                    Compte PCG
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-center"
                  onClick={() => toggleSort("count")}
                >
                  <div className="flex items-center gap-1 justify-center">
                    Transactions
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Débit</TableHead>
                <TableHead className="text-right">Crédit</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => toggleSort("totalAmount")}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Solde
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {transactions?.length === 0
                      ? "Aucune transaction"
                      : "Aucun résultat"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group) => {
                  const key = group.numero || "__unassigned";
                  const isExpanded = expandedAccounts.has(key);
                  return (
                    <Fragment key={key}>
                      <TableRow
                        className={`cursor-pointer hover:bg-muted/30 ${group.isUnassigned ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
                        onClick={() => toggleAccount(key)}
                      >
                        <TableCell className="w-10 px-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {group.isUnassigned ? (
                              <>
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <span className="font-medium text-amber-700 dark:text-amber-400">
                                  {group.intitule}
                                </span>
                              </>
                            ) : (
                              <>
                                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono font-semibold">
                                  {group.numero}
                                </code>
                                <span className="text-sm">
                                  {group.intitule}
                                </span>
                                {group.manualCount > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <PenLine className="h-3 w-3 text-blue-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {group.manualCount} affectation(s)
                                        manuelle(s)
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">
                            {group.count}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-red-600 dark:text-red-400">
                          {group.totalDebit > 0
                            ? formatAmount(group.totalDebit)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right text-sm text-green-600 dark:text-green-400">
                          {group.totalCredit > 0
                            ? formatAmount(group.totalCredit)
                            : "-"}
                        </TableCell>
                        <TableCell
                          className="text-right font-semibold text-sm"
                          style={{
                            color:
                              group.totalNet > 0
                                ? "#0E7A3E"
                                : group.totalNet < 0
                                  ? "#DC2626"
                                  : undefined,
                          }}
                        >
                          {formatAmount(group.totalNet)}
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0 bg-muted/20">
                            <div className="px-4 py-3">
                              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                                Détail des transactions ({group.count})
                              </div>
                              <div className="rounded-md border bg-background overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="h-8 text-xs">
                                        Date
                                      </TableHead>
                                      <TableHead className="h-8 text-xs">
                                        Description
                                      </TableHead>
                                      <TableHead className="h-8 text-xs text-right">
                                        Montant
                                      </TableHead>
                                      <TableHead className="h-8 text-xs text-center">
                                        Source
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.transactions
                                      .slice(0, 50)
                                      .map((tx) => {
                                        const merchant = findMerchant(
                                          tx.metadata?.vendor ||
                                            tx.description ||
                                            "",
                                        );
                                        const name =
                                          merchant?.name ||
                                          tx.metadata?.vendor ||
                                          tx.description ||
                                          "Transaction";
                                        const isIncome = tx.amount > 0;
                                        return (
                                          <TableRow
                                            key={tx.id}
                                            className="h-10 cursor-pointer hover:bg-muted/50 group"
                                            onClick={() => openTransaction(tx)}
                                          >
                                            <TableCell className="text-xs">
                                              {formatDateToFrench(tx.date)}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                              <div className="flex items-center gap-2">
                                                <div
                                                  className="truncate max-w-[240px]"
                                                  title={name}
                                                >
                                                  {name}
                                                </div>
                                                <ExternalLink
                                                  size={11}
                                                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                />
                                              </div>
                                            </TableCell>
                                            <TableCell
                                              className="text-xs text-right font-medium"
                                              style={{
                                                color: isIncome
                                                  ? "#0E7A3E"
                                                  : "#DC2626",
                                              }}
                                            >
                                              {isIncome ? "+" : ""}
                                              {formatAmount(tx.amount)}
                                            </TableCell>
                                            <TableCell className="text-xs text-center">
                                              {tx.pcgAccount?.isManual ? (
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger>
                                                      <PenLine
                                                        size={12}
                                                        className="text-blue-500 mx-auto"
                                                      />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      Affecté manuellement
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              ) : (
                                                <ConfidenceBadge
                                                  confidence={
                                                    tx.pcgAccount?.confidence
                                                  }
                                                />
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                                </Table>
                                {group.transactions.length > 50 && (
                                  <div className="text-center py-2 text-xs text-muted-foreground border-t">
                                    ... et {group.transactions.length - 50}{" "}
                                    autre
                                    {group.transactions.length - 50 > 1
                                      ? "s"
                                      : ""}{" "}
                                    transaction
                                    {group.transactions.length - 50 > 1
                                      ? "s"
                                      : ""}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-right">
        {filteredGroups.filter((g) => !g.isUnassigned).length} compte
        {filteredGroups.filter((g) => !g.isUnassigned).length > 1
          ? "s"
          : ""}{" "}
        PCG utilisé
        {filteredGroups.filter((g) => !g.isUnassigned).length > 1 ? "s" : ""}
      </div>

      {/* Drawer de détail de transaction */}
      <TransactionDetailDrawer
        transaction={selectedTransaction}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onRefresh={refreshData}
        onSubmit={handleSaveTransaction}
      />
    </div>
  );
}
