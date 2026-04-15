"use client";

import { useQuery } from "@apollo/client";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { GET_FORECAST_MONTH_DETAILS } from "@/src/graphql/queries/treasuryForecast";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { ArrowUpRight, ArrowDownRight, FileText, Landmark } from "lucide-react";

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
    day: "2-digit",
    month: "short",
    year: "numeric",
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

const STATUS_VARIANT = {
  COMPLETED: "default",
  PAID: "default",
  PENDING: "secondary",
  TO_PAY: "secondary",
  TO_PROCESS: "secondary",
  OVERDUE: "destructive",
  CANCELED: "outline",
  ARCHIVED: "outline",
};

function Section({ title, icon, items, emptyLabel, accentColor }) {
  const total = items.reduce((s, i) => s + (i.amountTTC || 0), 0);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">{items.length}</span>
        </div>
        <span
          className="text-sm font-medium tabular-nums"
          style={{ color: accentColor }}
        >
          {formatCurrency(total)}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">
          {emptyLabel}
        </p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-md">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.partyName}
                  </p>
                  <Badge
                    variant={STATUS_VARIANT[item.status] || "outline"}
                    className="text-[10px] font-normal shrink-0"
                  >
                    {STATUS_LABELS[item.status] || item.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.number && <span>{item.number} · </span>}
                  {formatDate(item.issueDate)}
                </p>
              </div>
              <span
                className="text-sm font-medium tabular-nums ml-3 shrink-0"
                style={{ color: accentColor }}
              >
                {formatCurrency(item.amountTTC)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BankTransactionsSection({ transactions }) {
  const totalIn = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Landmark size={14} className="text-blue-600" />
          <h3 className="text-sm font-medium text-foreground">
            Transactions bancaires
          </h3>
          <span className="text-xs text-muted-foreground">
            {transactions.length}
          </span>
        </div>
        <div className="text-xs tabular-nums">
          {totalIn > 0 && (
            <span className="text-green-600 font-medium mr-2">
              +{formatCurrency(totalIn)}
            </span>
          )}
          {totalOut > 0 && (
            <span className="text-red-600 font-medium">
              −{formatCurrency(totalOut)}
            </span>
          )}
        </div>
      </div>
      {transactions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">
          Aucune transaction bancaire ce mois-ci
        </p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-md">
          {transactions.map((t) => {
            const isIn = t.amount > 0;
            return (
              <li
                key={t.id}
                className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {t.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(t.date)}
                    {t.category && (
                      <span className="ml-1.5 opacity-70">· {t.category}</span>
                    )}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium tabular-nums ml-3 shrink-0 ${
                    isIn ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isIn ? "+" : "−"}
                  {formatCurrency(Math.abs(t.amount))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Détail de {formatMonthTitle(month)}</DrawerTitle>
          <DrawerDescription>
            Transactions bancaires, factures et devis liés à ce mois.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8 overflow-y-auto">
          {loading && !details ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <BankTransactionsSection
                transactions={details?.bankTransactions || []}
              />
              <Section
                title="Factures clients"
                icon={<ArrowUpRight size={14} className="text-green-600" />}
                items={details?.invoices || []}
                emptyLabel="Aucune facture client ce mois-ci"
                accentColor="#16a34a"
              />
              <Section
                title="Devis signés (à facturer)"
                icon={<FileText size={14} className="text-[#5b50ff]" />}
                items={details?.signedQuotes || []}
                emptyLabel="Aucun devis signé non converti"
                accentColor="#5b50ff"
              />
              <Section
                title="Factures fournisseurs"
                icon={<ArrowDownRight size={14} className="text-red-600" />}
                items={details?.purchaseInvoices || []}
                emptyLabel="Aucune facture fournisseur ce mois-ci"
                accentColor="#dc2626"
              />
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
