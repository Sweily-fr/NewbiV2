"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  ExternalLink,
  FileText,
} from "lucide-react";

import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { TableEmptyState } from "@/src/components/ui/table-empty-state";
import { DocumentText2Icon } from "@/src/components/icons";

import { useCreditNotes } from "@/src/graphql/creditNoteQueries";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

// Mêmes colonnes que la table factures (visibles par défaut).
const COLUMNS = [
  { id: "select", label: "", size: 40 },
  { id: "client", label: "Client", size: 200 },
  { id: "invoiceLink", label: "Facture liée", size: 140 },
  { id: "totalTTC", label: "Montant TTC", size: 120 },
  { id: "issueDate", label: "Date d'émission", size: 120 },
  { id: "dueDate", label: "Échéance", size: 120 },
  { id: "status", label: "Statut", size: 120 },
  { id: "emailTracking", label: "Suivi", size: 100 },
  { id: "actions", label: "Actions", size: 80 },
];

function formatDate(value) {
  if (!value) return "-";
  try {
    const parsed =
      typeof value === "string" && /^\d+$/.test(value)
        ? new Date(parseInt(value, 10))
        : new Date(value);
    if (isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("fr-FR");
  } catch {
    return "-";
  }
}

function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(amount));
}

function formatNumber(item) {
  if (!item) return "";
  const prefix = item.prefix ? `${item.prefix.replace(/-$/, "")}-` : "";
  return `${prefix}${item.number || ""}`.trim();
}

export default function CreditNotesTable({
  globalFilter = "",
  onPreviewInvoice,
}) {
  const { creditNotes, loading, error, refetch } = useCreditNotes();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState(() => new Set());

  const filtered = useMemo(() => {
    const list = creditNotes || [];
    const q = (globalFilter || "").trim().toLowerCase();
    if (!q) return list;
    return list.filter((creditNote) => {
      const number = formatNumber(creditNote).toLowerCase();
      const invoiceNumber = (
        formatNumber(creditNote.originalInvoice) ||
        creditNote.originalInvoiceNumber ||
        ""
      )
        .toString()
        .toLowerCase();
      const clientName = (creditNote.client?.name || "").toLowerCase();
      const amount = String(
        creditNote.finalTotalTTC ?? creditNote.totalTTC ?? "",
      );
      return (
        number.includes(q) ||
        invoiceNumber.includes(q) ||
        clientName.includes(q) ||
        amount.includes(q)
      );
    });
  }, [creditNotes, globalFilter]);

  useEffect(() => {
    setPageIndex(0);
  }, [globalFilter, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageIndex, pageSize]);

  const pageIds = useMemo(() => pageRows.map((r) => r.id), [pageRows]);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected =
    pageIds.some((id) => selected.has(id)) && !allPageSelected;

  const togglePage = (checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) pageIds.forEach((id) => next.add(id));
      else pageIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const toggleRow = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const previewInvoice = useCallback(
    (invoiceId) => {
      if (!invoiceId) return;
      onPreviewInvoice?.(invoiceId);
    },
    [onPreviewInvoice],
  );

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircleAlertIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les avoirs
          </p>
          <Button onClick={refetch}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* En-têtes — mêmes classes que la table factures */}
      <div className="hidden md:block bg-background">
        <div className="border-b border-border">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                {COLUMNS.map((col, index) => (
                  <th
                    key={col.id}
                    style={{ width: col.size }}
                    className={cn(
                      "h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground",
                      index === 0 && "pl-4 sm:pl-6",
                      index === COLUMNS.length - 1 && "pr-4 sm:pr-6",
                      col.id === "actions" && "text-right",
                    )}
                  >
                    {col.id === "select" ? (
                      <Checkbox
                        checked={
                          allPageSelected
                            ? true
                            : somePageSelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={(value) => togglePage(!!value)}
                        aria-label="Sélectionner tout"
                      />
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
      </div>

      {/* Corps - Desktop */}
      <div className="hidden md:flex md:flex-col flex-1">
        <table className="w-full table-fixed">
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b">
                  {COLUMNS.map((col, index) => (
                    <td
                      key={col.id}
                      style={{ width: col.size }}
                      className={cn(
                        "p-2",
                        index === 0 && "pl-4 sm:pl-6",
                        index === COLUMNS.length - 1 && "pr-4 sm:pr-6",
                      )}
                    >
                      {col.id === "select" ? (
                        <Skeleton className="h-4 w-4" />
                      ) : col.id === "client" ? (
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-3 w-[100px]" />
                          <Skeleton className="h-3 w-[60px]" />
                        </div>
                      ) : col.id === "status" ? (
                        <Skeleton className="h-5 w-[70px] rounded-full" />
                      ) : (
                        <Skeleton className="h-4 w-[80px]" />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length > 0 ? (
              pageRows.map((creditNote) => {
                const invoiceLabel =
                  formatNumber(creditNote.originalInvoice) ||
                  creditNote.originalInvoiceNumber ||
                  "-";
                const hasInvoiceLink = Boolean(creditNote.originalInvoice?.id);
                const avoirNumber = formatNumber(creditNote);
                const isSelected = selected.has(creditNote.id);
                return (
                  <tr
                    key={creditNote.id}
                    data-state={isSelected && "selected"}
                    onClick={() =>
                      hasInvoiceLink &&
                      previewInvoice(creditNote.originalInvoice.id)
                    }
                    className="border-b hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
                  >
                    {/* Select */}
                    <td
                      className="p-2 pl-4 sm:pl-6 align-middle text-[13px]"
                      style={{ width: 40 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(value) =>
                          toggleRow(creditNote.id, !!value)
                        }
                        aria-label="Sélectionner la ligne"
                      />
                    </td>

                    {/* Client (nom + n° avoir en sous-texte) */}
                    <td
                      className="p-2 align-middle text-[13px]"
                      style={{ width: 200 }}
                    >
                      <div className="min-h-[40px] flex items-center gap-2">
                        <div className="flex flex-col justify-center min-w-0">
                          <div
                            className="font-normal max-w-[100px] md:max-w-none truncate"
                            title={creditNote.client?.name || ""}
                          >
                            {creditNote.client?.name || (
                              <span className="text-muted-foreground italic">
                                Non défini
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-none">
                            {avoirNumber || (
                              <span className="italic">Avoir</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Facture liée */}
                    <td
                      className="p-2 align-middle text-[13px]"
                      style={{ width: 140 }}
                    >
                      {hasInvoiceLink ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            previewInvoice(creditNote.originalInvoice.id);
                          }}
                          className="inline-flex items-center gap-1.5 font-normal text-foreground hover:underline cursor-pointer truncate max-w-[140px]"
                          title="Aperçu de la facture liée"
                        >
                          <span className="truncate">{invoiceLabel}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground">
                          {invoiceLabel}
                        </span>
                      )}
                    </td>

                    {/* Montant TTC */}
                    <td
                      className="p-2 align-middle text-[13px]"
                      style={{ width: 120 }}
                    >
                      <div className="font-normal">
                        {formatCurrency(
                          creditNote.finalTotalTTC ?? creditNote.totalTTC,
                        )}
                      </div>
                    </td>

                    {/* Date d'émission */}
                    <td
                      className="p-2 align-middle text-[13px]"
                      style={{ width: 120 }}
                    >
                      {formatDate(creditNote.issueDate)}
                    </td>

                    {/* Échéance (N/A pour les avoirs) */}
                    <td
                      className="p-2 align-middle text-[13px]"
                      style={{ width: 120 }}
                    >
                      <span className="text-muted-foreground">-</span>
                    </td>

                    {/* Statut */}
                    <td
                      className="p-2 align-middle text-[13px]"
                      style={{ width: 120 }}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
                          "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
                        )}
                      >
                        <FileText className="w-3 h-3" />
                        Avoir
                      </span>
                    </td>

                    {/* Suivi (N/A pour le moment) */}
                    <td
                      className="p-2 align-middle text-[13px]"
                      style={{ width: 100 }}
                    >
                      <span className="text-muted-foreground">-</span>
                    </td>

                    {/* Actions */}
                    <td
                      className="p-2 pr-4 sm:pr-6 align-middle text-[13px] text-right"
                      style={{ width: 80 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hasInvoiceLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() =>
                            previewInvoice(creditNote.originalInvoice.id)
                          }
                          title="Aperçu de la facture liée"
                        >
                          Aperçu
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={COLUMNS.length} className="p-0">
                  <TableEmptyState
                    icon={DocumentText2Icon}
                    title="Aucun avoir trouvé"
                    description="Aucun avoir n'a été créé pour le moment."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex-1 min-h-0 overflow-y-auto pb-20">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-400">
              <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400 text-sm">
                Client
              </th>
              <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400 text-sm">
                Facture liée
              </th>
              <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400 text-sm">
                Montant
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr
                  key={`m-skeleton-${i}`}
                  className="border-b border-gray-50 dark:border-gray-800"
                >
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-[100px]" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-[100px]" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-[60px]" />
                  </td>
                </tr>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((creditNote) => {
                const invoiceLabel =
                  formatNumber(creditNote.originalInvoice) ||
                  creditNote.originalInvoiceNumber ||
                  "-";
                const hasInvoiceLink = Boolean(creditNote.originalInvoice?.id);
                return (
                  <tr
                    key={creditNote.id}
                    onClick={() =>
                      hasInvoiceLink &&
                      previewInvoice(creditNote.originalInvoice.id)
                    }
                    className="border-b border-gray-50 dark:border-gray-800 cursor-pointer"
                  >
                    <td className="py-3 px-4 text-sm">
                      <div className="font-normal">
                        {creditNote.client?.name || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {formatNumber(creditNote) || "Avoir"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {hasInvoiceLink ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            previewInvoice(creditNote.originalInvoice.id);
                          }}
                          className="inline-flex items-center gap-1 text-sm hover:underline"
                        >
                          {invoiceLabel}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground">
                          {invoiceLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatCurrency(
                        creditNote.finalTotalTTC ?? creditNote.totalTTC,
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="p-0">
                  <TableEmptyState
                    icon={DocumentText2Icon}
                    title="Aucun avoir trouvé"
                    description="Aucun avoir n'a été créé pour le moment."
                    size="compact"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination desktop — même style que la table factures */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-2 border-t border-border bg-background sticky bottom-0 z-10">
        <div className="flex-1 text-xs font-normal text-muted-foreground">
          {selected.size} sur {filtered.length} ligne(s) sélectionnée(s).
        </div>
        <div className="flex items-center space-x-4 lg:space-x-6">
          <div className="flex items-center gap-1.5">
            <p className="whitespace-nowrap text-xs font-normal">
              Lignes par page
            </p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="h-7 w-[70px] text-xs">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center whitespace-nowrap text-xs font-normal">
            Page {pageIndex + 1} sur {pageCount}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => setPageIndex(0)}
                  disabled={pageIndex === 0}
                  aria-label="Première page"
                >
                  <ChevronFirstIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={pageIndex === 0}
                  aria-label="Page précédente"
                >
                  <ChevronLeftIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() =>
                    setPageIndex((p) => Math.min(pageCount - 1, p + 1))
                  }
                  disabled={pageIndex >= pageCount - 1}
                  aria-label="Page suivante"
                >
                  <ChevronRightIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => setPageIndex(pageCount - 1)}
                  disabled={pageIndex >= pageCount - 1}
                  aria-label="Dernière page"
                >
                  <ChevronLastIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
