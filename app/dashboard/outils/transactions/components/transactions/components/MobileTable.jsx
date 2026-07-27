import { useState, useEffect, useRef, useCallback } from "react";
import { flexRender } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Skeleton } from "@/src/components/ui/skeleton";
import { CheckCircle2, Receipt } from "lucide-react";
import BankingConnectButton from "@/src/components/banking/BankingConnectButton";
import { TableEmptyState } from "@/src/components/ui/table-empty-state";
import { ChartIcon } from "@/src/components/icons";

const BATCH_SIZE = 20;

function SkeletonRows({ count = 3, headers }) {
  if (!headers || headers.length === 0) return null;
  return Array.from({ length: count }).map((_, i) => (
    <TableRow
      key={`skeleton-${i}`}
      className="border-b border-gray-50 dark:border-gray-800"
    >
      {headers.map((header) => (
        <TableCell
          key={header.id}
          style={{ width: header.getSize() }}
          className="py-3 px-4"
        >
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

const emptyStates = {
  all: {
    icon: ChartIcon,
    title: "Aucune transaction trouvée",
    description:
      "Connectez votre banque pour importer automatiquement vos transactions.",
    showConnect: true,
  },
  lastMonth: {
    icon: CheckCircle2,
    title: "Aucune transaction ce dernier mois",
    description: "Vos prochaines transactions bancaires apparaîtront ici.",
  },
  toReconcile: {
    icon: CheckCircle2,
    title: "Aucune transaction à rapprocher",
    description: "Toutes vos entrées d'argent sont rapprochées.",
  },
  missingReceipt: {
    icon: Receipt,
    title: "Tous vos justificatifs sont en ordre",
    description: "Aucune transaction n'attend de justificatif.",
  },
};

export function MobileTable({
  table,
  columns,
  error,
  loading,
  onRowClick,
  onScrollChange,
  activeTab,
  hasNextPage = false,
  onLoadMore,
}) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sentinelRef = useRef(null);
  const scrollRef = useRef(null);
  const prevTabRef = useRef(activeTab);

  // All rows before pagination (filtered + sorted)
  const allRows = table.getPrePaginationRowModel().rows;
  const headers = table.getHeaderGroups()[0]?.headers || [];

  // Reset visible count when the dataset shrinks (filters, tabs, search) but
  // keep scroll progress when more rows arrive from the server (load more)
  useEffect(() => {
    setVisibleCount((prev) => (allRows.length < prev ? BATCH_SIZE : prev));
  }, [allRows.length]);

  // Scroll to top + fade transition on tab change
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      setIsTransitioning(true);

      // Scroll to top
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
        onScrollChange?.(false);
      }

      // Fade in after brief delay
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, onScrollChange]);

  const visibleRows = allRows.slice(0, visibleCount);
  const hasMoreLocal = visibleCount < allRows.length;
  // Plus de lignes localement OU une page serveur suivante à charger
  const hasMore = hasMoreLocal || hasNextPage;

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    if (hasMoreLocal) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, allRows.length));
        setIsLoadingMore(false);
      }, 300);
    } else if (hasNextPage) {
      // Page serveur suivante : élargir la fenêtre visible pour afficher les
      // nouvelles lignes dès leur arrivée
      setVisibleCount((prev) => prev + BATCH_SIZE);
      onLoadMore?.();
    }
  }, [hasMoreLocal, hasNextPage, isLoadingMore, allRows.length, onLoadMore]);

  // IntersectionObserver on sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Detect scroll for shadow
  const handleScroll = useCallback(
    (e) => {
      onScrollChange?.(e.target.scrollTop > 0);
    },
    [onScrollChange],
  );

  const emptyState = emptyStates[activeTab] || emptyStates.all;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="md:hidden overflow-y-auto overflow-x-auto flex-1 min-h-0"
    >
      <div
        className={`transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
      >
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
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {visibleRows.length > 0 ? (
              <>
                {visibleRows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-25 dark:hover:bg-gray-900 cursor-pointer"
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {isLoadingMore && <SkeletonRows count={3} headers={headers} />}
                {hasMore && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="p-0">
                      <div ref={sentinelRef} className="h-1" />
                    </TableCell>
                  </TableRow>
                )}
              </>
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
              <SkeletonRows count={6} headers={headers} />
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <TableEmptyState
                    icon={emptyState.icon}
                    title={emptyState.title}
                    description={emptyState.description}
                    size="compact"
                    action={
                      emptyState.showConnect ? <BankingConnectButton /> : null
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
