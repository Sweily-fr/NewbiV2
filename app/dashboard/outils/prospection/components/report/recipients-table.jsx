"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
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
import { toast } from "@/src/components/ui/sonner";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { cn } from "@/src/lib/utils";
import {
  GET_PROSPECTING_RECIPIENTS,
  MARK_PROSPECTING_RECIPIENT,
} from "@/src/graphql/prospectingQueries";
import { formatCount, formatDateTime } from "@/src/utils/email-campaigns";
import {
  recipientActions,
  recipientDate,
  recipientFilters,
  recipientStatusFilter,
} from "@/src/utils/prospecting";
import {
  CARD_CLASS,
  FOCUS_RING,
  RecipientStatusBadge,
  errorMessage,
} from "../shared";

const PAGE_SIZE = 50;

const HEAD =
  "h-9 px-3 text-left align-middle text-xs font-normal whitespace-nowrap text-muted-foreground";

// Après un marquage : la ligne, les compteurs et le filtre suivent
const AFTER_MARK = ["ProspectingRecipients", "ProspectingSequence"];

function recipientTitle(recipient) {
  return recipient.company || recipient.name || recipient.email;
}

function recipientSubtitle(recipient) {
  const person =
    recipient.name && recipient.name !== recipient.company
      ? recipient.name
      : null;
  return [person, recipient.email].filter(Boolean).join(" · ");
}

/**
 * Menu « … » : « A répondu » (sauf s'il est déjà en bouton sur la ligne) et
 * « Ne plus contacter ».
 */
function RowMenu({
  recipient,
  onReplied,
  onDoNotContact,
  busy,
  withReplied = true,
}) {
  const actions = recipientActions(recipient);
  const replied = withReplied && actions.replied;
  if (!replied && !actions.doNotContact) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-8 text-muted-foreground", FOCUS_RING)}
          aria-label={`Actions pour ${recipient.email}`}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {replied && (
          <DropdownMenuItem onClick={onReplied}>
            <Check className="size-4" />
            {"A répondu"}
          </DropdownMenuItem>
        )}
        {actions.doNotContact && (
          <DropdownMenuItem
            onClick={onDoNotContact}
            className="text-red-600 focus:text-red-600 dark:text-red-400"
          >
            <Ban className="size-4" />
            Ne plus contacter
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Destinataires de la prospection, filtrables par statut et cherchables :
 * « A répondu » (réponse reçue dans la boîte) et « Ne plus contacter »
 * (l'adresse rejoint les désinscrits de l'espace). `live` : rafraîchi
 * pendant l'envoi.
 */
export function RecipientsTable({
  workspaceId,
  sequence,
  canMark,
  live = false,
}) {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [toBlock, setToBlock] = useState(null);
  useEffect(() => setPage(1), [filter, debounced]);

  const { data, previousData, loading, error, refetch } = useQuery(
    GET_PROSPECTING_RECIPIENTS,
    {
      variables: {
        workspaceId,
        id: sequence.id,
        status: recipientStatusFilter(filter),
        search: debounced || null,
        offset: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      },
      skip: !workspaceId,
      fetchPolicy: "cache-and-network",
      pollInterval: live ? 60000 : 0,
      context: { skipErrorToast: true },
    },
  );
  const result = (data || previousData)?.prospectingRecipients;
  const items = result?.items || [];
  const total = result?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filters = recipientFilters(sequence.stats, filter);

  const [markRecipient] = useMutation(MARK_PROSPECTING_RECIPIENT, {
    errorPolicy: "none",
    refetchQueries: AFTER_MARK,
  });

  const mark = async (recipient, action) => {
    setBusyId(recipient.id);
    try {
      await markRecipient({
        variables: { workspaceId, id: recipient.id, action },
      });
      if (action === "REPLIED") {
        toast.success("Réponse notée", {
          description: `${recipientTitle(recipient)} a répondu.`,
        });
      } else {
        toast.success("Ne plus contacter", {
          description: `${recipient.email} rejoint vos désinscrits.`,
        });
      }
      return true;
    } catch (markError) {
      toast.error("Modification impossible", {
        description: errorMessage(markError),
      });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const actionsFor = (recipient, { withReplied = true } = {}) =>
    canMark ? (
      <RowMenu
        recipient={recipient}
        busy={busyId === recipient.id}
        withReplied={withReplied}
        onReplied={() => mark(recipient, "REPLIED")}
        onDoNotContact={() => setToBlock(recipient)}
      />
    ) : null;

  return (
    <section
      aria-labelledby="destinataires-title"
      className={cn(CARD_CLASS, "overflow-hidden")}
    >
      <div className="flex flex-col gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="destinataires-title" className="text-[15px] font-medium">
            Destinataires
            {result && (
              <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
                {formatCount(total)}
              </span>
            )}
          </h2>
          <div className="flex h-8 w-full items-center gap-2 rounded-[9px] border border-[#E6E7EA] px-2.5 transition-[border] focus-within:border-[#D1D3D8] hover:border-[#D1D3D8] sm:w-[240px] dark:border-[#2E2E32] dark:hover:border-[#44444A]">
            <Search
              className="size-3.5 shrink-0 text-muted-foreground/80"
              aria-hidden
            />
            <Input
              variant="ghost"
              placeholder="Entreprise, nom ou adresse"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Rechercher un destinataire"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="cursor-pointer text-muted-foreground/80 hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
        <div
          role="tablist"
          aria-label="Filtrer les destinataires"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        >
          {filters.map((item) => {
            const active = item.value === filter;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(item.value)}
                className={cn(
                  "flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs whitespace-nowrap transition-colors",
                  FOCUS_RING,
                  active
                    ? "border-[#242529] bg-[#242529] text-white dark:border-white dark:bg-white dark:text-[#111]"
                    : "border-[#e6e7ea] text-muted-foreground hover:bg-[#f7f7f8] hover:text-foreground dark:border-[#2E2E32] dark:hover:bg-white/[0.04]",
                )}
              >
                {item.label}
                {item.count !== null && (
                  <span
                    className={cn(
                      "tabular-nums",
                      active ? "opacity-70" : "text-muted-foreground/80",
                    )}
                  >
                    {formatCount(item.count)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2">
        {loading && !result ? (
          <div className="flex flex-col gap-2 px-4 pb-4 sm:px-5">
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        ) : error && !result ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <CircleAlert className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Les destinataires n&apos;ont pas pu être chargés.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {debounced
              ? "Aucun destinataire ne correspond à votre recherche."
              : "Aucun destinataire dans cette catégorie."}
          </p>
        ) : isMobile ? (
          <ul className="divide-y divide-[#EEEFF1] border-t border-[#EEEFF1] dark:divide-[#232323] dark:border-[#232323]">
            {items.map((recipient) => {
              const date = recipientDate(recipient);
              return (
                <li
                  key={recipient.id}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {recipientTitle(recipient)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {recipientSubtitle(recipient)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <RecipientStatusBadge status={recipient.status} />
                      {date && (
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateTime(date)}
                        </span>
                      )}
                    </div>
                    {recipient.error && (
                      <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                        {recipient.error}
                      </p>
                    )}
                  </div>
                  {actionsFor(recipient)}
                </li>
              );
            })}
          </ul>
        ) : (
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col />
              <col className="w-[150px]" />
              <col className="w-[190px]" />
              <col className="w-[180px]" />
            </colgroup>
            <thead>
              <tr className="border-y border-[#EEEFF1] dark:border-[#232323]">
                <th className={cn(HEAD, "pl-5")}>Destinataire</th>
                <th className={HEAD}>Statut</th>
                <th className={HEAD}>Date</th>
                <th className={cn(HEAD, "pr-5")}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((recipient) => {
                const date = recipientDate(recipient);
                const actions = recipientActions(recipient);
                return (
                  <tr
                    key={recipient.id}
                    className="border-b border-[#EEEFF1] last:border-b-0 dark:border-[#232323]"
                  >
                    <td className="py-2.5 pr-3 pl-5 align-middle">
                      <p className="truncate text-sm">
                        {recipientTitle(recipient)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {recipientSubtitle(recipient)}
                        {recipient.error && (
                          <span className="text-red-700 dark:text-red-400">
                            {" "}
                            · {recipient.error}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <RecipientStatusBadge status={recipient.status} />
                    </td>
                    <td className="truncate px-3 py-2.5 align-middle text-sm text-muted-foreground">
                      {date ? formatDateTime(date) : "-"}
                    </td>
                    <td className="py-2.5 pr-5 pl-3 align-middle">
                      {canMark && (
                        <div className="flex items-center justify-end gap-1">
                          {actions.replied && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => mark(recipient, "REPLIED")}
                              disabled={busyId === recipient.id}
                            >
                              <Check className="size-3.5" aria-hidden />
                              {"A répondu"}
                            </Button>
                          )}
                          {actionsFor(recipient, { withReplied: false })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 border-t border-[#EEEFF1] px-4 py-2 sm:px-5 dark:border-[#232323]">
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatCount((page - 1) * PAGE_SIZE + 1)} à{" "}
            {formatCount(Math.min(total, page * PAGE_SIZE))} sur{" "}
            {formatCount(total)}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              aria-label="Page précédente"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              disabled={page >= totalPages}
              aria-label="Page suivante"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={Boolean(toBlock)}
        onOpenChange={(open) => !open && !busyId && setToBlock(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ne plus contacter {toBlock?.email} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;adresse rejoint les désinscrits de votre espace : elle ne
              recevra plus ni prospection ni campagne e-mail.
              {toBlock?.status === "PENDING" &&
                " Son message en attente ne partira pas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(busyId)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                const ok = await mark(toBlock, "DO_NOT_CONTACT");
                if (ok) setToBlock(null);
              }}
              disabled={Boolean(busyId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {busyId && <Loader2 className="size-3.5 animate-spin" />}
              Ne plus contacter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
