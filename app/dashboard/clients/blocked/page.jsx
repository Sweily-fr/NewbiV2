"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
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
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/src/components/ui/empty";
import { Checkbox } from "@/src/components/ui/checkbox";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useClients, useUnblockClient } from "@/src/hooks/useClients";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  ShieldOff,
  ShieldCheck,
  Search,
  CircleXIcon,
  Building2,
  User,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

function BlockedContent() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const inputRef = useRef(null);
  const { workspaceId } = useWorkspace();
  const { clients, loading } = useClients(1, 500, "");
  const { unblockClient, loading: unblocking } = useUnblockClient();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkUnblocking, setBulkUnblocking] = useState(false);

  const blockedClients = useMemo(() => {
    const blocked = (clients || []).filter((c) => c.isBlocked);
    if (!search) return blocked;
    const s = search.toLowerCase();
    return blocked.filter(
      (c) =>
        c.name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s)
    );
  }, [clients, search]);

  const totalPages = Math.ceil(blockedClients.length / pageSize) || 1;
  const paginatedClients = useMemo(() => {
    const start = pageIndex * pageSize;
    return blockedClients.slice(start, start + pageSize);
  }, [blockedClients, pageIndex, pageSize]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const pageIds = paginatedClients.map((c) => c.id);
      const allSelected = pageIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(pageIds);
    });
  }, [paginatedClients]);

  const handleBulkUnblock = useCallback(async () => {
    setBulkUnblocking(true);
    const ids = [...selectedIds];
    for (const id of ids) {
      await unblockClient(id);
    }
    setSelectedIds(new Set());
    setBulkUnblocking(false);
  }, [selectedIds, unblockClient]);

  // Reset à la page 1 et sélection quand la recherche ou le pageSize change
  const handleSearchChange = (value) => {
    setSearch(value);
    setPageIndex(0);
    setSelectedIds(new Set());
  };
  const handlePageSizeChange = (value) => {
    setPageSize(Number(value));
    setPageIndex(0);
    setSelectedIds(new Set());
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleUnblock = async (clientId) => {
    await unblockClient(clientId);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
        <div>
          <h1 className="text-2xl font-medium mb-0">Contacts bloqués</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez les contacts que vous avez bloqués.
          </p>
        </div>
      </div>

      {/* Search and Bulk actions */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 h-8 w-full sm:w-[300px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
            <Search
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
            <Input
              variant="ghost"
              ref={inputRef}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Recherchez un contact bloqué..."
              aria-label="Rechercher"
            />
            {Boolean(search) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground cursor-pointer shrink-0 transition-colors outline-none"
                aria-label="Effacer"
                onClick={() => {
                  handleSearchChange("");
                  inputRef.current?.focus();
                }}
              >
                <CircleXIcon size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 cursor-pointer"
                  disabled={bulkUnblocking}
                >
                  <ShieldOff className="w-4 h-4" />
                  {bulkUnblocking ? "Déblocage..." : `Débloquer (${selectedIds.size})`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                    aria-hidden="true"
                  >
                    <ShieldCheck className="opacity-80" size={16} />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Débloquer {selectedIds.size} contact{selectedIds.size > 1 ? "s" : ""} ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Les contacts sélectionnés pourront de nouveau être utilisés dans vos documents et communications.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkUnblock}>
                    Débloquer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="h-10 p-2 pl-4 sm:pl-6 text-left align-middle w-[40px]">
                    <Checkbox disabled />
                  </th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[28%]">Contact</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[25%]">Email</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[18%]">Bloqué le</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[14%]">Raison</th>
                  <th className="h-10 p-2 pr-4 sm:pr-6 text-right align-middle font-normal text-xs text-muted-foreground w-[10%]"></th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 pl-4 sm:pl-6 w-[40px]"><Skeleton className="h-4 w-4 rounded" /></td>
                    <td className="p-2 w-[28%]"><Skeleton className="h-4 w-[150px] rounded" /></td>
                    <td className="p-2 w-[25%]"><Skeleton className="h-4 w-[180px] rounded" /></td>
                    <td className="p-2 w-[18%]"><Skeleton className="h-4 w-[100px] rounded" /></td>
                    <td className="p-2 w-[14%]"><Skeleton className="h-4 w-[80px] rounded" /></td>
                    <td className="p-2 pr-4 sm:pr-6 w-[10%]"><Skeleton className="h-4 w-[60px] rounded ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : blockedClients.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Empty>
            <EmptyMedia variant="icon">
              <ShieldCheck />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Aucun contact bloqué</EmptyTitle>
              <EmptyDescription>
                Vous n&apos;avez bloqué aucun contact. Les contacts bloqués sont
                exclus de la création de documents et des communications.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/clients")}
                className="font-normal"
              >
                Retour aux contacts
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Table header */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="h-10 p-2 pl-4 sm:pl-6 text-left align-middle font-normal text-xs text-muted-foreground w-[40px]">
                    <Checkbox
                      checked={paginatedClients.length > 0 && paginatedClients.every((c) => selectedIds.has(c.id))}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Tout sélectionner"
                    />
                  </th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[28%]">Contact</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[25%]">Email</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[18%]">Bloqué le</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[14%]">Raison</th>
                  <th className="h-10 p-2 pr-4 sm:pr-6 text-right align-middle font-normal text-xs text-muted-foreground w-[10%]"></th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Table body */}
          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed">
              <tbody>
                {paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  >
                    <td className="p-2 pl-4 sm:pl-6 align-middle w-[40px]" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(client.id)}
                        onCheckedChange={() => toggleSelect(client.id)}
                        aria-label={`Sélectionner ${client.name}`}
                      />
                    </td>
                    <td className="p-2 align-middle w-[28%]">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                          {client.type === "COMPANY" ? (
                            <Building2 size={13} className="text-muted-foreground" />
                          ) : (
                            <User size={13} className="text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {client.name}
                          </p>
                          {client.address?.city && (
                            <p className="text-xs text-muted-foreground truncate">
                              {client.address.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 align-middle text-sm text-muted-foreground w-[25%]">
                      <span className="truncate block">{client.email}</span>
                    </td>
                    <td className="p-2 align-middle text-sm text-muted-foreground w-[18%]">
                      {formatDate(client.blockedAt) || "—"}
                    </td>
                    <td className="p-2 align-middle w-[14%]">
                      {client.blockedReason ? (
                        <span className="text-xs text-muted-foreground truncate block">
                          {client.blockedReason}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="p-2 pr-4 sm:pr-6 align-middle text-right w-[10%]" onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-normal hover:opacity-80"
                            style={{ color: "#5b50FF" }}
                            disabled={unblocking}
                          >
                            Débloquer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                            <div
                              className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                              aria-hidden="true"
                            >
                              <ShieldCheck className="opacity-80" size={16} />
                            </div>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Débloquer ce contact ?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {client.name} pourra de nouveau être utilisé dans
                                vos documents et communications.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnblock(client.id)}
                            >
                              Débloquer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
            <div className="flex-1 text-xs font-normal text-muted-foreground">
              {(() => {
                const start = pageIndex * pageSize + 1;
                const end = Math.min((pageIndex + 1) * pageSize, blockedClients.length);
                return `${start}-${end} sur ${blockedClients.length}`;
              })()}
            </div>
            <div className="flex items-center space-x-4 lg:space-x-6">
              <div className="flex items-center gap-1.5">
                <p className="whitespace-nowrap text-xs font-normal">Lignes par page</p>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 25, 50].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center whitespace-nowrap text-xs font-normal">
                Page {pageIndex + 1} sur {totalPages}
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
                      onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={pageIndex >= totalPages - 1}
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
                      onClick={() => setPageIndex(totalPages - 1)}
                      disabled={pageIndex >= totalPages - 1}
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
      )}
    </div>
  );
}

export default function BlockedPage() {
  return (
    <ProRouteGuard pageName="Clients">
      <BlockedContent />
    </ProRouteGuard>
  );
}
