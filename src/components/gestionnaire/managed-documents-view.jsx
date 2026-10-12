"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CircleXIcon,
  Inbox,
  Search,
} from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DocumentStatusBadge } from "@/src/components/documents/linked-document-row";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";

const ALL = "__all__";
const TAB_CLASS =
  "relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]";

const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const formatDate = (value) =>
  value ? dateFormat.format(new Date(value)) : "-";

/**
 * Espace gestionnaire : liste de factures, devis, bons de commande, bons de
 * livraison ou avoirs de tous les clients du cabinet, au format des listes
 * du tableau de bord.
 * Filtres dans l'adresse (?statut, ?dossier, ?q, ?page) ; un clic ouvre le
 * document dans le dossier du client (bascule d'espace puis panneau).
 */
export default function ManagedDocumentsView({
  title,
  dueLabel,
  badgeType,
  openPath,
  showTotal = true,
  tabs,
  data,
  current,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(current.q || "");
  const [opening, setOpening] = useState(null);
  const inputRef = useRef(null);
  const { organization: activeOrganization } = useActiveOrganization();

  const setParams = (changes) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === "all" ||
        value === ALL
      ) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    if (!("page" in changes)) params.delete("page");
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  };

  // Recherche appliquée après une courte pause de frappe
  useEffect(() => {
    if (query === (current.q || "")) return undefined;
    const timer = setTimeout(() => setParams({ q: query.trim() }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const openDocument = async (row) => {
    if (opening) return;
    setOpening(row.id);
    try {
      if (activeOrganization?.id !== row.organizationId) {
        await authClient.organization.setActive({
          organizationId: row.organizationId,
        });
        localStorage.setItem("active_organization_id", row.organizationId);
      }
      window.location.assign(row.openUrl || `${openPath}?id=${row.id}`);
    } catch (error) {
      console.error("Ouverture du document impossible:", error);
      toast.error("Impossible d'ouvrir ce document");
      setOpening(null);
    }
  };

  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  const columns = [
    "Dossier",
    "Destinataire",
    "Date",
    dueLabel,
    ...(showTotal ? ["Montant TTC"] : []),
    "Statut",
  ];

  return (
    <div className="flex flex-col md:h-[calc(100vh-64px)] overflow-hidden">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-6">
        <div>
          <h1 className="text-2xl font-medium mb-0">{title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tous vos dossiers clients ({data.organizations.length})
          </p>
        </div>
      </div>

      {/* Onglets de statut */}
      <div className="pt-4">
        <Tabs
          value={current.status}
          onValueChange={(value) => setParams({ statut: value })}
        >
          <TabsList className="h-auto rounded-none bg-transparent p-0 pb-2 w-full justify-start px-4 sm:px-6">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={TAB_CLASS}
              >
                <span>{tab.label}</span>
                <span className="text-xs text-muted-foreground">
                  {data.statusCounts[tab.value] ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Recherche et dossier */}
      <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-4 flex-shrink-0 border-t border-border">
        <div className="relative max-w-md">
          <Input
            ref={inputRef}
            className={cn("w-full sm:w-[320px] ps-9", query && "pe-9")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Recherchez par numéro ou destinataire..."
            type="text"
            aria-label="Rechercher"
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
            <Search size={16} aria-hidden="true" />
          </div>
          {query && (
            <button
              type="button"
              className="text-muted-foreground/80 hover:text-foreground absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center outline-none"
              aria-label="Effacer la recherche"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <CircleXIcon size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        <Select
          value={current.organizationId || ALL}
          onValueChange={(value) => setParams({ dossier: value })}
        >
          <SelectTrigger className="h-8 w-[220px] text-sm" aria-label="Dossier">
            <SelectValue placeholder="Tous les dossiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les dossiers</SelectItem>
            {data.organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      <div
        className={cn(
          "flex-1 min-h-0 overflow-auto border-t border-border transition-opacity",
          isPending && "opacity-60",
        )}
      >
        <table className="w-full table-fixed min-w-[960px]">
          <thead className="sticky top-0 z-10 bg-background border-b border-border">
            <tr>
              {columns.map((label, index) => (
                <th
                  key={label}
                  className={cn(
                    "h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground",
                    index === 0 && "pl-4 sm:pl-6 w-[220px]",
                    index === 1 && "w-[260px]",
                    label === "Montant TTC" && "text-right",
                    index === columns.length - 1 && "pr-4 sm:pr-6 w-[150px]",
                  )}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-12">
                  <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                    <Inbox className="size-6" />
                    {data.organizations.length === 0
                      ? "Aucun dossier client à afficher."
                      : "Aucun document ne correspond à ces filtres."}
                  </div>
                </td>
              </tr>
            )}
            {data.rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => openDocument(row)}
                className={cn(
                  "border-b hover:bg-muted/50 cursor-pointer transition-colors",
                  opening === row.id && "opacity-60",
                )}
              >
                <td className="p-2 pl-4 sm:pl-6 align-middle text-sm truncate">
                  {row.organizationName}
                </td>
                <td className="p-2 align-middle text-sm">
                  <div className="truncate">
                    {row.clientName || (
                      <span className="italic text-muted-foreground">
                        Non défini
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.reference || <span className="italic">Brouillon</span>}
                  </div>
                </td>
                <td className="p-2 align-middle text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(row.issueDate)}
                </td>
                <td className="p-2 align-middle text-sm text-muted-foreground whitespace-nowrap">
                  {row.dueText ?? formatDate(row.dueDate)}
                </td>
                {showTotal && (
                  <td className="p-2 align-middle text-sm text-right tabular-nums whitespace-nowrap">
                    {row.totalTTC === null ? "-" : money.format(row.totalTTC)}
                  </td>
                )}
                <td className="p-2 pr-4 sm:pr-6 align-middle">
                  <DocumentStatusBadge type={badgeType} status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.total > data.pageSize && (
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 border-t border-border text-sm text-muted-foreground">
          <span className="tabular-nums">
            {(data.page - 1) * data.pageSize + 1}-
            {Math.min(data.page * data.pageSize, data.total)} sur {data.total}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1 || isPending}
            onClick={() => setParams({ page: data.page - 1 })}
            aria-label="Page précédente"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= lastPage || isPending}
            onClick={() => setParams({ page: data.page + 1 })}
            aria-label="Page suivante"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
