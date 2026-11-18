"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { cn } from "@/src/lib/utils";
import { GET_EMAIL_CAMPAIGN_RECIPIENTS } from "@/src/graphql/emailCampaignQueries";
import {
  RECIPIENT_FILTERS,
  formatCount,
  formatDateTime,
  recipientActivity,
  recipientLastActivity,
} from "@/src/utils/email-campaigns";
import { CARD_CLASS, FOCUS_RING, ToneBadge } from "../shared";

const PAGE_SIZE = 50;

const HEAD =
  "h-9 px-3 text-left align-middle text-xs font-normal whitespace-nowrap text-muted-foreground";

function Count({ value }) {
  return value > 0 ? (
    <span className="tabular-nums">{formatCount(value)}</span>
  ) : (
    <span className="text-muted-foreground/60">0</span>
  );
}

/**
 * Destinataires de la campagne, filtrables (ont ouvert, ont cliqué,
 * rejetés…) et cherchables, avec l'activité de chacun. `live` : rafraîchi
 * pendant l'envoi.
 */
export function RecipientsTable({ workspaceId, campaignId, live }) {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [filter, debounced]);

  const { data, previousData, loading, error, refetch } = useQuery(
    GET_EMAIL_CAMPAIGN_RECIPIENTS,
    {
      variables: {
        workspaceId,
        campaignId,
        filter,
        search: debounced || null,
        page,
        limit: PAGE_SIZE,
      },
      skip: !workspaceId,
      fetchPolicy: "cache-and-network",
      pollInterval: live ? 15000 : 0,
      context: { skipErrorToast: true },
    },
  );
  const result = (data || previousData)?.emailCampaignRecipients;
  const items = result?.items || [];
  const total = result?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
              placeholder="Nom ou adresse"
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
          {RECIPIENT_FILTERS.map((item) => {
            const active = item.value === filter;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(item.value)}
                className={cn(
                  "h-7 shrink-0 cursor-pointer rounded-full border px-3 text-xs whitespace-nowrap transition-colors",
                  FOCUS_RING,
                  active
                    ? "border-[#242529] bg-[#242529] text-white dark:border-white dark:bg-white dark:text-[#111]"
                    : "border-[#e6e7ea] text-muted-foreground hover:bg-[#f7f7f8] hover:text-foreground dark:border-[#2E2E32] dark:hover:bg-white/[0.04]",
                )}
              >
                {item.label}
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
              const activity = recipientActivity(recipient);
              const last = recipientLastActivity(recipient);
              return (
                <li
                  key={recipient.id}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {recipient.name || recipient.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {recipient.email}
                    </p>
                    {recipient.error && (
                      <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">
                        {recipient.error}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <ToneBadge tone={activity.tone}>{activity.label}</ToneBadge>
                    {last && (
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(last)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col />
              <col className="w-[150px]" />
              <col className="w-[110px]" />
              <col className="w-[80px]" />
              <col className="w-[200px]" />
            </colgroup>
            <thead>
              <tr className="border-y border-[#EEEFF1] dark:border-[#232323]">
                <th className={cn(HEAD, "pl-5")}>Contact</th>
                <th className={HEAD}>Activité</th>
                <th className={cn(HEAD, "text-right")}>Ouvertures</th>
                <th className={cn(HEAD, "text-right")}>Clics</th>
                <th className={cn(HEAD, "pr-5")}>Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {items.map((recipient) => {
                const activity = recipientActivity(recipient);
                const last = recipientLastActivity(recipient);
                return (
                  <tr
                    key={recipient.id}
                    className="border-b border-[#EEEFF1] last:border-b-0 dark:border-[#232323]"
                  >
                    <td className="py-2.5 pr-3 pl-5 align-middle">
                      <p className="truncate text-sm">
                        {recipient.name || recipient.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {recipient.email}
                        {recipient.error && (
                          <span className="text-red-700 dark:text-red-400">
                            {" "}
                            · {recipient.error}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <ToneBadge tone={activity.tone}>
                        {activity.label}
                      </ToneBadge>
                    </td>
                    <td className="px-3 py-2.5 text-right align-middle text-sm">
                      <Count value={recipient.openCount} />
                    </td>
                    <td className="px-3 py-2.5 text-right align-middle text-sm">
                      <Count value={recipient.clickCount} />
                    </td>
                    <td className="truncate py-2.5 pr-5 pl-3 align-middle text-sm text-muted-foreground">
                      {last ? formatDateTime(last) : "-"}
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
    </section>
  );
}
