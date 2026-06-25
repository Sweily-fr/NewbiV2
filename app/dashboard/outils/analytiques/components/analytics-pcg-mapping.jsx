"use client";

import { useState, useMemo, Fragment } from "react";
import { AnimatePresence } from "framer-motion";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useUpdateTransaction } from "@/src/hooks/useTransactions";
import { TransactionDetailDrawer } from "@/app/dashboard/outils/transactions/components/transaction-detail-drawer";
import { mapPaymentMethodToEnum } from "@/app/dashboard/outils/transactions/components/transactions/utils/mappers";
import { Input } from "@/src/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Skeleton } from "@/src/components/ui/skeleton";
import { formatDateToFrench } from "@/src/utils/dateFormatter";
import { findMerchant } from "@/lib/merchants-config";
import { Search, ChevronDown, AlertCircle, ExternalLink } from "lucide-react";
import { Edit2Icon } from "@/src/components/icons";
import { cn } from "@/src/lib/utils";
import { CONFIDENCE_CONFIG } from "@/lib/pcg-mapping";

// ─── Formatters ───

const formatAmount = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Math.round(Math.abs(value || 0)),
  );

// ─── Confidence Badge ───

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

// ═══════════════════════════════════════════════════════════
// ─── Main Component ───
// ═══════════════════════════════════════════════════════════

export function AnalyticsPCGMapping() {
  const { transactions, isLoading, refreshData } = useDashboardData();
  const { updateTransaction } = useUpdateTransaction();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("totalAmount");
  const [sortDir, setSortDir] = useState("desc");
  const [expandedAccounts, setExpandedAccounts] = useState(new Set());
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ─── Handlers ───

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
      receiptFiles: tx.receiptFiles || [],
      hasReceipt:
        (Array.isArray(tx.receiptFiles) && tx.receiptFiles.length > 0) ||
        !!tx.linkedInvoice?.id,
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

  // ─── Data processing ───

  const accountGroups = useMemo(() => {
    if (!transactions?.length) return [];
    const groups = new Map();
    const unassignedTxs = [];

    for (const tx of transactions) {
      const pcg = tx.pcgAccount;
      if (!pcg?.numero) {
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

    for (const g of groups.values()) {
      g.transactions.sort(
        (a, b) =>
          new Date(b.date || b.createdAt || 0) -
          new Date(a.date || a.createdAt || 0),
      );
      g.totalAmount = g.totalDebit + g.totalCredit;
    }

    let result = Array.from(groups.values());

    if (unassignedTxs.length > 0) {
      const totalDebit = unassignedTxs
        .filter((t) => t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      const totalCredit = unassignedTxs
        .filter((t) => t.amount > 0)
        .reduce((s, t) => s + t.amount, 0);
      result.push({
        numero: "",
        intitule: "Non affecté",
        count: unassignedTxs.length,
        totalDebit,
        totalCredit,
        totalNet: totalCredit - totalDebit,
        totalAmount: totalDebit + totalCredit,
        manualCount: 0,
        transactions: unassignedTxs.sort(
          (a, b) =>
            new Date(b.date || b.createdAt || 0) -
            new Date(a.date || a.createdAt || 0),
        ),
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

  const stats = useMemo(() => {
    const totalTxs = transactions?.length || 0;
    const assignedTxs =
      transactions?.filter((t) => t.pcgAccount?.numero).length || 0;
    const manualTxs =
      transactions?.filter((t) => t.pcgAccount?.isManual).length || 0;
    const uniqueAccounts = accountGroups.filter((g) => !g.isUnassigned).length;
    return {
      totalTxs,
      assignedTxs,
      unassignedTxs: totalTxs - assignedTxs,
      manualTxs,
      uniqueAccounts,
      assignedPercent:
        totalTxs > 0 ? Math.round((assignedTxs / totalTxs) * 100) : 0,
    };
  }, [transactions, accountGroups]);

  // ─── Loading ───

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border px-5 py-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  // ─── Render ───

  return (
    <div className="px-4 sm:px-6">
      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border px-5 py-4">
          <p className="text-sm text-muted-foreground mb-1">Transactions</p>
          <p className="text-2xl font-medium text-foreground">
            {stats.totalTxs}
          </p>
        </div>
        <div className="rounded-xl border border-border px-5 py-4">
          <p className="text-sm text-muted-foreground mb-1">Affectées</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-medium text-foreground">
              {stats.assignedTxs}
            </p>
            <span className="text-sm text-green-600 font-medium">
              {stats.assignedPercent}%
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border px-5 py-4">
          <p className="text-sm text-muted-foreground mb-1">Non affectées</p>
          <p
            className={cn(
              "text-2xl font-medium",
              stats.unassignedTxs > 0 ? "text-red-600" : "text-foreground",
            )}
          >
            {stats.unassignedTxs}
          </p>
        </div>
      </div>

      {/* ─── Search ─── */}
      <div className="relative mb-4 w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un compte, une description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* ─── Table ─── */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div
          className="grid items-center bg-muted/40 border-b border-border text-[13px] text-muted-foreground"
          style={{ gridTemplateColumns: "1fr 100px 120px 120px 120px" }}
        >
          <div className="px-4 py-3 font-medium">Compte PCG</div>
          <div
            className="py-3 text-center cursor-pointer hover:text-foreground transition-colors"
            onClick={() => toggleSort("count")}
          >
            Transactions
          </div>
          <div className="py-3 text-right pr-4">Débit</div>
          <div className="py-3 text-right pr-4">Crédit</div>
          <div
            className="py-3 text-right pr-4 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => toggleSort("totalAmount")}
          >
            Solde
          </div>
        </div>

        {/* Rows */}
        {filteredGroups.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {transactions?.length === 0
              ? "Aucune transaction"
              : "Aucun résultat"}
          </div>
        ) : (
          filteredGroups.map((group) => {
            const key = group.numero || "__unassigned";
            const isExpanded = expandedAccounts.has(key);
            return (
              <Fragment key={key}>
                {/* Account row */}
                <div
                  className={cn(
                    "grid items-center border-b border-border/40 cursor-pointer hover:bg-muted/20 transition-colors",
                    group.isUnassigned && "bg-amber-50/30 dark:bg-amber-950/10",
                  )}
                  style={{
                    gridTemplateColumns: "1fr 100px 120px 120px 120px",
                  }}
                  onClick={() => toggleAccount(key)}
                >
                  <div className="px-4 py-3.5 flex items-center gap-2.5">
                    <ChevronDown
                      size={14}
                      className={cn(
                        "text-muted-foreground transition-transform shrink-0",
                        !isExpanded && "-rotate-90",
                      )}
                    />
                    {group.isUnassigned ? (
                      <>
                        <AlertCircle
                          size={14}
                          className="text-amber-500 shrink-0"
                        />
                        <span className="text-[13px] font-medium text-amber-700 dark:text-amber-400">
                          {group.intitule}
                        </span>
                      </>
                    ) : (
                      <>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[12px] font-mono font-semibold text-foreground">
                          {group.numero}
                        </code>
                        <span className="text-[13px] text-foreground truncate">
                          {group.intitule}
                        </span>
                        {group.manualCount > 0 && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Edit2Icon className="w-3 h-3 text-muted-foreground shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {group.manualCount} affectation(s) manuelle(s)
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </div>
                  <div className="py-3.5 text-center text-[13px] text-muted-foreground tabular-nums">
                    {group.count}
                  </div>
                  <div className="py-3.5 text-right pr-4 text-[13px] text-red-600 tabular-nums">
                    {group.totalDebit > 0
                      ? formatNumber(group.totalDebit)
                      : "–"}
                  </div>
                  <div className="py-3.5 text-right pr-4 text-[13px] text-green-600 tabular-nums">
                    {group.totalCredit > 0
                      ? formatNumber(group.totalCredit)
                      : "–"}
                  </div>
                  <div
                    className="py-3.5 text-right pr-4 text-[13px] font-semibold tabular-nums"
                    style={{
                      color:
                        group.totalNet > 0
                          ? "var(--color-income)"
                          : group.totalNet < 0
                            ? "var(--color-expense)"
                            : undefined,
                    }}
                  >
                    {formatAmount(group.totalNet)}
                  </div>
                </div>

                {/* Expanded transactions */}
                {isExpanded && (
                  <div className="border-b border-border/40 bg-muted/10">
                    <div className="px-4 py-3">
                      <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-2 pl-6">
                        {group.count} transaction
                        {group.count > 1 ? "s" : ""}
                      </p>
                      <div className="space-y-px">
                        {group.transactions.slice(0, 50).map((tx) => {
                          const merchant = findMerchant(
                            tx.metadata?.vendor || tx.description || "",
                          );
                          const name =
                            merchant?.name ||
                            tx.metadata?.vendor ||
                            tx.description ||
                            "Transaction";
                          const isIncome = tx.amount > 0;
                          return (
                            <div
                              key={tx.id}
                              className="flex items-center py-2 px-6 rounded-md cursor-pointer hover:bg-muted/40 transition-colors group/tx"
                              onClick={() => openTransaction(tx)}
                            >
                              <span className="text-[12px] text-muted-foreground w-20 shrink-0 tabular-nums">
                                {formatDateToFrench(tx.date)}
                              </span>
                              <span className="text-[12px] text-foreground/80 truncate flex-1 flex items-center gap-1.5">
                                {name}
                                <ExternalLink
                                  size={10}
                                  className="text-muted-foreground/30 opacity-0 group-hover/tx:opacity-100 transition-opacity shrink-0"
                                />
                              </span>
                              <span
                                className="text-[12px] font-medium tabular-nums w-24 text-right shrink-0"
                                style={{
                                  color: isIncome
                                    ? "var(--color-income)"
                                    : "var(--color-expense)",
                                }}
                              >
                                {isIncome ? "+" : ""}
                                {formatAmount(tx.amount)}
                              </span>
                              <span className="w-16 text-center shrink-0">
                                {tx.pcgAccount?.isManual ? (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Edit2Icon className="w-3 h-3 text-muted-foreground mx-auto" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Affecté manuellement
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <ConfidenceBadge
                                    confidence={tx.pcgAccount?.confidence}
                                  />
                                )}
                              </span>
                            </div>
                          );
                        })}
                        {group.transactions.length > 50 && (
                          <p className="text-[11px] text-muted-foreground/50 text-center py-2">
                            et {group.transactions.length - 50} autre
                            {group.transactions.length - 50 > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })
        )}
      </div>

      {/* Footer */}
      <p className="text-[11px] text-muted-foreground/50 text-right mt-3">
        {filteredGroups.filter((g) => !g.isUnassigned).length} compte
        {filteredGroups.filter((g) => !g.isUnassigned).length > 1
          ? "s"
          : ""}{" "}
        PCG
      </p>

      {/* Drawer */}
      <AnimatePresence onExitComplete={() => setSelectedTransaction(null)}>
        {isDrawerOpen && (
          <TransactionDetailDrawer
            transaction={selectedTransaction}
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
            onRefresh={refreshData}
            onSubmit={handleSaveTransaction}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
