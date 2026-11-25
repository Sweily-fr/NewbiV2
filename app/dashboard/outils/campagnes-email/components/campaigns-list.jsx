"use client";

import {
  BarChart3,
  CopyPlus,
  MoreHorizontal,
  PenLine,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import {
  campaignDateLabel,
  canDeleteStatus,
  formatCount,
  formatPercent,
  isReportStatus,
  trackingRates,
} from "@/src/utils/email-campaigns";
import { FOCUS_RING, StatusBadge } from "./shared";
import { TextWithVariables } from "./setup/subject-section";

/**
 * Taux d'ouverture et de clics de la liste, sur la même base que le rapport
 * (contacts suivis) ; null quand ils ne sont pas suivis ou qu'aucun contact
 * ne l'est.
 */
function listRates(campaign) {
  const rates = trackingRates(campaign);
  const measurable = !rates.perContact || rates.base > 0;
  return {
    openRate: campaign.trackOpens && measurable ? rates.openRate : null,
    clickRate: campaign.trackClicks && measurable ? rates.clickRate : null,
  };
}

/** Taux affiché dans le tableau (rien tant que l'envoi n'a pas commencé). */
function Rate({ value, count }) {
  if (value === null)
    return <span className="text-muted-foreground/60">-</span>;
  return (
    <span className="tabular-nums">
      {formatPercent(value)}
      <span className="ml-1.5 text-xs text-muted-foreground">
        {formatCount(count)}
      </span>
    </span>
  );
}

function RowActions({ campaign, access, onOpen, onDuplicate, onDelete }) {
  const report = isReportStatus(campaign.status);
  const deletable = canDeleteStatus(campaign.status);
  const showDuplicate = access.canCreate;
  const showDelete = access.canDelete;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-8 text-muted-foreground", FOCUS_RING)}
          aria-label={`Actions pour ${campaign.name}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onClick={onOpen}>
          {report ? (
            <BarChart3 className="size-4" />
          ) : (
            <PenLine className="size-4" />
          )}
          {report
            ? "Voir le rapport"
            : campaign.status === "DRAFT" && access.canEdit
              ? "Modifier"
              : "Ouvrir"}
        </DropdownMenuItem>
        {showDuplicate && (
          <DropdownMenuItem onClick={onDuplicate} disabled={access.readOnly}>
            <CopyPlus className="size-4" />
            Dupliquer
          </DropdownMenuItem>
        )}
        {showDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              disabled={!deletable || access.readOnly}
              className="text-red-600 focus:text-red-600 dark:text-red-400"
              title={
                deletable
                  ? undefined
                  : "Mettez fin à l'envoi avant de supprimer la campagne"
              }
            >
              <Trash2 className="size-4" />
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const HEAD =
  "h-10 px-3 text-left align-middle text-xs font-normal whitespace-nowrap text-muted-foreground";
const CELL = "px-3 py-3 align-middle text-sm";

/**
 * Tableau des campagnes (ordinateur) : nom et objet, statut, destinataires,
 * ouvertures et clics uniques, date utile. Une ligne ouvre la campagne.
 */
export function CampaignsTable({
  campaigns,
  access,
  onOpen,
  onDuplicate,
  onDelete,
}) {
  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        <col />
        <col className="w-[150px]" />
        <col className="w-[116px]" />
        <col className="w-[124px]" />
        <col className="w-[104px]" />
        <col className="w-[270px]" />
        <col className="w-[64px]" />
      </colgroup>
      <thead className="sticky top-0 z-10 bg-background">
        <tr className="border-b border-[#EEEFF1] dark:border-[#232323]">
          <th className={cn(HEAD, "pl-4 sm:pl-6")}>Campagne</th>
          <th className={HEAD}>Statut</th>
          <th className={cn(HEAD, "text-right")}>Destinataires</th>
          <th className={cn(HEAD, "text-right")}>Ouvertures</th>
          <th className={cn(HEAD, "text-right")}>Clics</th>
          <th className={HEAD}>Date</th>
          <th className={cn(HEAD, "pr-4 sm:pr-6")}>
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map((campaign) => {
          const rates = listRates(campaign);
          const started = isReportStatus(campaign.status);
          return (
            <tr
              key={campaign.id}
              onClick={() => onOpen(campaign)}
              className="group cursor-pointer border-b border-[#EEEFF1] transition-colors hover:bg-[#fafafa] dark:border-[#232323] dark:hover:bg-white/[0.03]"
            >
              <td className={cn(CELL, "pl-4 sm:pl-6")}>
                {/* Lien au clavier : la ligne entière est cliquable à la souris */}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(campaign);
                  }}
                  className={cn(
                    "block max-w-full cursor-pointer truncate rounded-sm text-left font-medium text-foreground",
                    FOCUS_RING,
                  )}
                >
                  {campaign.name}
                </button>
                <p className="truncate text-xs text-muted-foreground">
                  {campaign.subject ? (
                    <TextWithVariables text={campaign.subject} />
                  ) : (
                    "Sans objet"
                  )}
                </p>
              </td>
              <td className={CELL}>
                <StatusBadge status={campaign.status} />
              </td>
              <td className={cn(CELL, "text-right tabular-nums")}>
                {started || campaign.stats?.recipients ? (
                  formatCount(campaign.stats?.recipients || 0)
                ) : (
                  <span className="text-muted-foreground/60">-</span>
                )}
              </td>
              <td className={cn(CELL, "text-right")}>
                <Rate
                  value={started ? rates.openRate : null}
                  count={campaign.stats?.opened || 0}
                />
              </td>
              <td className={cn(CELL, "text-right")}>
                <Rate
                  value={started ? rates.clickRate : null}
                  count={campaign.stats?.clicked || 0}
                />
              </td>
              <td className={cn(CELL, "truncate text-muted-foreground")}>
                {campaignDateLabel(campaign)}
              </td>
              <td className={cn(CELL, "pr-4 text-right sm:pr-6")}>
                <RowActions
                  campaign={campaign}
                  access={access}
                  onOpen={() => onOpen(campaign)}
                  onDuplicate={() => onDuplicate(campaign)}
                  onDelete={() => onDelete(campaign)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Liste en cartes (téléphone). */
export function CampaignCards({
  campaigns,
  access,
  onOpen,
  onDuplicate,
  onDelete,
}) {
  return (
    <ul className="flex flex-col gap-2 px-4 py-3">
      {campaigns.map((campaign) => {
        const rates = listRates(campaign);
        const started = isReportStatus(campaign.status);
        return (
          <li
            key={campaign.id}
            className="relative rounded-xl border border-[#EEEFF1] bg-background dark:border-[#232323]"
          >
            <button
              type="button"
              onClick={() => onOpen(campaign)}
              className={cn(
                "flex w-full cursor-pointer flex-col gap-2 rounded-xl px-4 py-3 pr-12 text-left",
                FOCUS_RING,
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 truncate text-sm font-medium">
                  {campaign.name}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <StatusBadge status={campaign.status} />
                <span className="text-xs text-muted-foreground">
                  {campaignDateLabel(campaign)}
                </span>
              </span>
              {started && (
                <span className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCount(campaign.stats?.recipients || 0)}
                    </span>{" "}
                    destinataires
                  </span>
                  {rates.openRate !== null && (
                    <span>
                      <span className="font-medium text-foreground">
                        {formatPercent(rates.openRate) || "0 %"}
                      </span>{" "}
                      ouvertures
                    </span>
                  )}
                  {rates.clickRate !== null && (
                    <span>
                      <span className="font-medium text-foreground">
                        {formatPercent(rates.clickRate) || "0 %"}
                      </span>{" "}
                      clics
                    </span>
                  )}
                </span>
              )}
            </button>
            <div className="absolute top-2.5 right-2">
              <RowActions
                campaign={campaign}
                access={access}
                onOpen={() => onOpen(campaign)}
                onDuplicate={() => onDuplicate(campaign)}
                onDelete={() => onDelete(campaign)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
