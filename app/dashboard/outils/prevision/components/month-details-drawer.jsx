"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/src/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Trash2 } from "lucide-react";
import { GET_FORECAST_MONTH_DETAILS } from "@/src/graphql/queries/treasuryForecast";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useExcludeForecastOccurrence } from "@/src/hooks/useForecastOccurrences";
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

const CATEGORY_LABELS = {
  SALES: "Ventes",
  REFUNDS_RECEIVED: "Remboursements",
  OTHER_INCOME: "Autres revenus",
  RENT: "Loyer",
  SUBSCRIPTIONS: "Abonnements",
  OFFICE_SUPPLIES: "Fournitures",
  SERVICES: "Services",
  TRANSPORT: "Transport",
  MEALS: "Repas",
  TELECOMMUNICATIONS: "Télécom",
  INSURANCE: "Assurance",
  ENERGY: "Énergie",
  SOFTWARE: "Logiciels",
  HARDWARE: "Matériel",
  MARKETING: "Marketing",
  TRAINING: "Formation",
  MAINTENANCE: "Maintenance",
  TAXES: "Impôts & taxes",
  UTILITIES: "Charges",
  SALARIES: "Salaires",
  OTHER_EXPENSE: "Autres dépenses",
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

// Ligne d'une occurrence de prévision avec suppression (un seul mois).
function ForecastRow({ entry, onDelete, readOnly }) {
  const isIncome = entry.type === "INCOME";
  return (
    <div className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition-colors group">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] text-foreground truncate">{entry.name}</p>
          {entry.kind === "DETECTED" && (
            <span className="text-[11px] text-muted-foreground/60 shrink-0">
              détectée
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          {[
            formatDate(entry.date),
            CATEGORY_LABELS[entry.category] || entry.category,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <span
          className={cn(
            "text-[13px] font-medium tabular-nums",
            isIncome ? "text-green-600" : "text-red-500",
          )}
        >
          {isIncome ? "+" : "−"}
          {formatCurrency(Math.abs(entry.amount || 0))}
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="p-1 rounded-md text-muted-foreground/40 hover:text-red-500 hover:bg-muted/50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            title="Supprimer cette prévision pour ce mois"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
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

export function MonthDetailsDrawer({
  month,
  open,
  onOpenChange,
  readOnly = false,
}) {
  const { workspaceId } = useRequiredWorkspace();
  // Onglet actif : "REAL" (données réelles) ou "FORECAST" (prévisions du mois).
  const [activeTab, setActiveTab] = useState("REAL");
  const { excludeOccurrence, loading: excluding } =
    useExcludeForecastOccurrence();
  const [toDelete, setToDelete] = useState(null);

  // À chaque ouverture / changement de mois, revenir sur l'onglet Réel.
  useEffect(() => {
    if (open) setActiveTab("REAL");
  }, [open, month]);

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
  const forecastEntries = details?.forecastEntries || [];

  const totalIn = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const invoicesTotal = invoices.reduce((s, i) => s + (i.amountTTC || 0), 0);
  const quotesTotal = quotes.reduce((s, i) => s + (i.amountTTC || 0), 0);
  const purchasesTotal = purchases.reduce((s, i) => s + (i.amountTTC || 0), 0);
  const forecastIn = forecastEntries
    .filter((e) => e.type === "INCOME")
    .reduce((s, e) => s + (e.amount || 0), 0);
  const forecastOut = forecastEntries
    .filter((e) => e.type === "EXPENSE")
    .reduce((s, e) => s + (e.amount || 0), 0);

  const isForecast = activeTab === "FORECAST";
  const summaryIn = isForecast ? forecastIn : totalIn;
  const summaryOut = isForecast ? forecastOut : totalOut;

  const confirmDelete = async () => {
    if (!toDelete) return;
    const result = await excludeOccurrence({
      kind: toDelete.kind,
      id: toDelete.id,
      month,
    });
    if (result.success) setToDelete(null);
  };

  const TabButton = ({ value, label }) => (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        "px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
        activeTab === value
          ? "bg-background text-foreground shadow-sm ring-1 ring-black/[0.07] dark:ring-white/[0.1]"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );

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
              {summaryIn > 0 && (
                <span>
                  Entrées{" "}
                  <span className="font-medium text-green-600">
                    +{formatCurrency(summaryIn)}
                  </span>
                </span>
              )}
              {summaryOut > 0 && (
                <span>
                  Sorties{" "}
                  <span className="font-medium text-red-500">
                    −{formatCurrency(summaryOut)}
                  </span>
                </span>
              )}
            </div>
          )}
          {/* Onglets Réel / Prévision */}
          <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg w-fit mt-3">
            <TabButton value="REAL" label="Réel" />
            <TabButton value="FORECAST" label="Prévision" />
          </div>
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
          ) : isForecast ? (
            <div>
              <SectionHeader
                title="Prévisions"
                count={forecastEntries.length}
                right={
                  forecastEntries.length > 0
                    ? formatCurrency(forecastIn - forecastOut)
                    : undefined
                }
              />
              <PaginatedList
                items={forecastEntries}
                emptyLabel="Aucune prévision pour ce mois"
                renderItem={(e, i) => (
                  <ForecastRow
                    key={`${e.kind}-${e.id}-${i}`}
                    entry={e}
                    readOnly={readOnly}
                    onDelete={setToDelete}
                  />
                )}
              />
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

      <AlertDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette prévision ?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              «&nbsp;{toDelete?.name}&nbsp;» sera retirée des prévisions de{" "}
              {formatMonthTitle(month)} uniquement.
              {toDelete?.kind === "DETECTED"
                ? " Les autres mois de cette récurrence détectée restent inchangés."
                : " Les autres occurrences de cette récurrence restent inchangées."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluding}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={excluding}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Drawer>
  );
}
