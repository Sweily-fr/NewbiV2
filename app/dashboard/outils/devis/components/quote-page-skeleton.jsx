import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

// Skeleton du tableau des devis (toolbar + tableau + pagination).
// Mêmes dimensions que l'état de chargement de QuoteTable pour que la
// transition finale vers les données soit invisible.
export function QuoteTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar : recherche + filtres + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-background overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 w-7">
                <Skeleton className="h-4 w-4 rounded" />
              </TableHead>
              <TableHead className="h-11 w-[150px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="h-11 w-[200px]">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="h-11 w-[100px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="h-11 w-[80px]">
                <Skeleton className="h-4 w-14" />
              </TableHead>
              <TableHead className="h-11 w-[120px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="h-11 w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell>
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16" />
        </div>
        <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}

// Reprend la même structure que la page réelle (header + stats + tableau)
// pour que la transition loading.jsx -> page -> chargement des données soit
// invisible. Partagé entre loading.jsx et le fallback du ProRouteGuard.
export function QuotePageSkeleton() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
          <Skeleton className="h-8 w-[160px]" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-[110px] rounded-md" />
            <Skeleton className="h-9 w-[110px] rounded-md" />
            <Skeleton className="h-9 w-[150px] rounded-md" />
          </div>
        </div>

        {/* Zone scrollable : stats + tableau */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex flex-col min-h-full">
            {/* Cartes de stats */}
            <div className="flex gap-3 px-4 sm:px-6 py-3">
              <div className="bg-background border rounded-lg px-4 py-3 flex items-center gap-0">
                <div className="pr-4">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="w-px h-10 bg-border mx-4" />
                <div className="pl-0">
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <div className="bg-background border rounded-lg px-4 py-3">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>

            {/* Tableau */}
            <QuoteTableSkeleton />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <Skeleton className="h-8 w-[100px]" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>

        {/* Tableau */}
        <QuoteTableSkeleton />
      </div>
    </>
  );
}
