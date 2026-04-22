"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/src/components/ui/drawer";
import { Skeleton } from "@/src/components/ui/skeleton";
import { GET_FORECAST_MONTH_DETAILS } from "@/src/graphql/queries/treasuryForecast";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { cn } from "@/src/lib/utils";

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

const formatMonthTitle = (month) => {
  if (!month) return "";
  const [year, m] = month.split("-");
  const d = new Date(parseInt(year), parseInt(m) - 1);
  return d
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());
};

const STATUS_LABELS = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  OVERDUE: "En retard",
  COMPLETED: "Payée",
  CANCELED: "Annulée",
  TO_PROCESS: "À traiter",
  TO_PAY: "À payer",
  PAID: "Payée",
  ARCHIVED: "Archivée",
};

function StatusDot({ status }) {
  const color =
    {
      COMPLETED: "bg-green-500",
      PAID: "bg-green-500",
      PENDING: "bg-amber-400",
      TO_PAY: "bg-amber-400",
      TO_PROCESS: "bg-amber-400",
      OVERDUE: "bg-red-500",
      CANCELED: "bg-muted-foreground/40",
      ARCHIVED: "bg-muted-foreground/40",
      DRAFT: "bg-muted-foreground/40",
    }[status] || "bg-muted-foreground/40";

  return <span className={cn("size-1.5 rounded-full shrink-0", color)} />;
}

function SectionHeader({ title, count, right }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5 bg-muted/30">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <span className="text-[11px] text-muted-foreground/60">{count}</span>
      </div>
      {right && (
        <span className="text-xs font-medium text-foreground tabular-nums">
          {right}
        </span>
      )}
    </div>
  );
}

function ItemRow({ name, meta, amount, isPositive, status }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] text-foreground truncate">{name}</p>
          {status && (
            <div className="flex items-center gap-1 shrink-0">
              <StatusDot status={status} />
              <span className="text-[11px] text-muted-foreground">
                {STATUS_LABELS[status] || status}
              </span>
            </div>
          )}
        </div>
        {meta && (
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">{meta}</p>
        )}
      </div>
      <span
        className={cn(
          "text-[13px] font-medium tabular-nums ml-4 shrink-0",
          isPositive === true && "text-green-600",
          isPositive === false && "text-red-500",
          isPositive == null && "text-foreground",
        )}
      >
        {isPositive === true && "+"}
        {isPositive === false && "−"}
        {formatCurrency(Math.abs(amount || 0))}
      </span>
    </div>
  );
}

const PAGE_SIZE = 5;

function PaginatedList({ items, renderItem, emptyLabel }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, PAGE_SIZE);
  const remaining = items.length - PAGE_SIZE;

  if (items.length === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <>
      <div className="divide-y divide-border/20">{visible.map(renderItem)}</div>
      {remaining > 0 && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full py-2.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Afficher {remaining} autre{remaining > 1 ? "s" : ""}
        </button>
      )}
    </>
  );
}

function EmptyState({ label }) {
  return (
    <p className="text-[11px] text-muted-foreground/50 text-center py-4">
      {label}
    </p>
  );
}

export function MonthDetailsDrawer({ month, open, onOpenChange }) {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading } = useQuery(GET_FORECAST_MONTH_DETAILS, {
    variables: { workspaceId, month },
    skip: !workspaceId || !month || !open,
    fetchPolicy: "cache-and-network",
  });

  const details = data?.forecastMonthDetails;
  const transactions = details?.bankTransactions || [];
  const invoices = details?.invoices || [];
  const quotes = details?.signedQuotes || [];
  const purchases = details?.purchaseInvoices || [];

  const totalIn = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const invoicesTotal = invoices.reduce((s, i) => s + (i.amountTTC || 0), 0);
  const quotesTotal = quotes.reduce((s, i) => s + (i.amountTTC || 0), 0);
  const purchasesTotal = purchases.reduce((s, i) => s + (i.amountTTC || 0), 0);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg">
        {/* Header */}
        <DrawerHeader className="px-5 pt-5 pb-4 border-b border-border/40">
          <DrawerTitle className="text-sm font-medium">
            {formatMonthTitle(month)}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Détail des flux du mois
          </DrawerDescription>
          {!loading && details && (
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {totalIn > 0 && (
                <span>
                  Entrées{" "}
                  <span className="font-medium text-green-600">
                    +{formatCurrency(totalIn)}
                  </span>
                </span>
              )}
              {totalOut > 0 && (
                <span>
                  Sorties{" "}
                  <span className="font-medium text-red-500">
                    −{formatCurrency(totalOut)}
                  </span>
                </span>
              )}
            </div>
          )}
        </DrawerHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && !details ? (
            <div className="px-5 py-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-20 mt-4" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {/* Transactions bancaires */}
              <div>
                <SectionHeader
                  title="Transactions"
                  count={transactions.length}
                  right={
                    transactions.length > 0
                      ? formatCurrency(totalIn - totalOut)
                      : undefined
                  }
                />
                <PaginatedList
                  items={transactions}
                  emptyLabel="Aucune transaction ce mois-ci"
                  renderItem={(t) => (
                    <ItemRow
                      key={t.id}
                      name={t.description}
                      meta={[formatDate(t.date), t.category]
                        .filter(Boolean)
                        .join(" · ")}
                      amount={Math.abs(t.amount)}
                      isPositive={t.amount > 0}
                    />
                  )}
                />
              </div>

              {/* Factures clients */}
              <div>
                <SectionHeader
                  title="Factures clients"
                  count={invoices.length}
                  right={
                    invoices.length > 0
                      ? formatCurrency(invoicesTotal)
                      : undefined
                  }
                />
                <PaginatedList
                  items={invoices}
                  emptyLabel="Aucune facture client"
                  renderItem={(inv) => (
                    <ItemRow
                      key={inv.id}
                      name={inv.partyName}
                      meta={[inv.number, formatDate(inv.issueDate)]
                        .filter(Boolean)
                        .join(" · ")}
                      amount={inv.amountTTC}
                      status={inv.status}
                    />
                  )}
                />
              </div>

              {/* Devis signés */}
              {quotes.length > 0 && (
                <div>
                  <SectionHeader
                    title="Devis signés"
                    count={quotes.length}
                    right={formatCurrency(quotesTotal)}
                  />
                  <PaginatedList
                    items={quotes}
                    emptyLabel=""
                    renderItem={(q) => (
                      <ItemRow
                        key={q.id}
                        name={q.partyName}
                        meta={[q.number, formatDate(q.issueDate)]
                          .filter(Boolean)
                          .join(" · ")}
                        amount={q.amountTTC}
                        status={q.status}
                      />
                    )}
                  />
                </div>
              )}

              {/* Factures fournisseurs */}
              <div>
                <SectionHeader
                  title="Fournisseurs"
                  count={purchases.length}
                  right={
                    purchases.length > 0
                      ? formatCurrency(purchasesTotal)
                      : undefined
                  }
                />
                <PaginatedList
                  items={purchases}
                  emptyLabel="Aucune facture fournisseur"
                  renderItem={(inv) => (
                    <ItemRow
                      key={inv.id}
                      name={inv.partyName}
                      meta={[inv.number, formatDate(inv.issueDate)]
                        .filter(Boolean)
                        .join(" · ")}
                      amount={inv.amountTTC}
                      status={inv.status}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
