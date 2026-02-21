"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
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
} from "lucide-react";

function BlockedContent() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const { workspaceId } = useWorkspace();
  const { clients, loading } = useClients(1, 500, "");
  const { unblockClient, loading: unblocking } = useUnblockClient();

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

      {/* Search */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-4 flex-shrink-0">
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherchez un contact bloqué..."
            aria-label="Rechercher"
          />
          {Boolean(search) && (
            <button
              className="text-muted-foreground/80 hover:text-foreground cursor-pointer shrink-0 transition-colors outline-none"
              aria-label="Effacer"
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
            >
              <CircleXIcon size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="h-10 p-2 pl-4 sm:pl-6 text-left align-middle font-normal text-xs text-muted-foreground w-[30%]">Contact</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[25%]">Email</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[20%]">Bloqué le</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[15%]">Raison</th>
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
                    <td className="p-2 pl-4 sm:pl-6 w-[30%]"><Skeleton className="h-4 w-[150px] rounded" /></td>
                    <td className="p-2 w-[25%]"><Skeleton className="h-4 w-[180px] rounded" /></td>
                    <td className="p-2 w-[20%]"><Skeleton className="h-4 w-[100px] rounded" /></td>
                    <td className="p-2 w-[15%]"><Skeleton className="h-4 w-[80px] rounded" /></td>
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
                  <th className="h-10 p-2 pl-4 sm:pl-6 text-left align-middle font-normal text-xs text-muted-foreground w-[30%]">Contact</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[25%]">Email</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[20%]">Bloqué le</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[15%]">Raison</th>
                  <th className="h-10 p-2 pr-4 sm:pr-6 text-right align-middle font-normal text-xs text-muted-foreground w-[10%]"></th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Table body */}
          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed">
              <tbody>
                {blockedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-2 pl-4 sm:pl-6 align-middle w-[30%]">
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
                    <td className="p-2 align-middle text-sm text-muted-foreground w-[20%]">
                      {formatDate(client.blockedAt) || "—"}
                    </td>
                    <td className="p-2 align-middle w-[15%]">
                      {client.blockedReason ? (
                        <span className="text-xs text-muted-foreground truncate block">
                          {client.blockedReason}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="p-2 pr-4 sm:pr-6 align-middle text-right w-[10%]">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-normal text-muted-foreground hover:text-foreground"
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

          {/* Footer */}
          <div className="flex items-center px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
            <p className="text-xs text-muted-foreground">
              {blockedClients.length} contact{blockedClients.length > 1 ? "s" : ""} bloqué{blockedClients.length > 1 ? "s" : ""}
            </p>
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
