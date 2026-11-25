"use client";

import { BarChart3, MoreHorizontal, PenLine, Trash2 } from "lucide-react";
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
  canDeleteSequence,
  isLaunched,
  replyRate,
  sequenceDateLabel,
  sequenceProgress,
} from "@/src/utils/prospecting";
import { formatCount, formatPercent } from "@/src/utils/email-campaigns";
import { TextWithVariables } from "@/app/dashboard/outils/campagnes-email/components/setup/subject-section";
import { FOCUS_RING, SequenceStatusBadge } from "./shared";

/** Expéditeur affiché sous le nom quand ce n'est pas la boîte du membre. */
function senderLine(sequence) {
  const mailbox = sequence.mailbox;
  if (!mailbox || mailbox.isMine) return null;
  return `Depuis ${mailbox.ownerName || mailbox.accountEmail}`;
}

/** Progression : messages partis sur destinataires, et sa jauge. */
function Progress({ sequence, compact = false }) {
  if (!isLaunched(sequence.status)) {
    return <span className="text-muted-foreground/60">-</span>;
  }
  const progress = sequenceProgress(sequence.stats);
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", compact && "gap-1")}>
      <span className="text-sm tabular-nums">
        <span className="font-medium">{formatCount(progress.sent)}</span>
        <span className="text-muted-foreground">
          {" "}
          / {formatCount(progress.total)} envoyés
        </span>
      </span>
      <div
        className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-[#EEEFF1] dark:bg-white/10"
        role="progressbar"
        aria-label="Destinataires traités"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.processed}
      >
        <div
          className={cn(
            "h-full rounded-full",
            sequence.status === "PAUSED" ? "bg-amber-500" : "bg-[#5a50ff]",
          )}
          style={{ width: `${progress.ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

function Replies({ sequence }) {
  if (!isLaunched(sequence.status)) {
    return <span className="text-muted-foreground/60">-</span>;
  }
  const replied = sequence.stats?.replied || 0;
  const rate = replyRate(sequence.stats);
  return (
    <span className="tabular-nums">
      {formatCount(replied)}
      {rate !== null && replied > 0 && (
        <span className="ml-1.5 text-xs text-muted-foreground">
          {formatPercent(rate)}
        </span>
      )}
    </span>
  );
}

function RowActions({ sequence, access, onOpen, onDelete }) {
  const launched = isLaunched(sequence.status);
  const deletable = canDeleteSequence(sequence.status);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-8 text-muted-foreground", FOCUS_RING)}
          aria-label={`Actions pour ${sequence.name}`}
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
          {launched ? (
            <BarChart3 className="size-4" />
          ) : (
            <PenLine className="size-4" />
          )}
          {launched ? "Voir le suivi" : access.canEdit ? "Modifier" : "Ouvrir"}
        </DropdownMenuItem>
        {access.canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              disabled={!deletable || access.readOnly}
              className="text-red-600 focus:text-red-600 dark:text-red-400"
              title={
                deletable
                  ? undefined
                  : "Arrêtez la prospection avant de la supprimer"
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
 * Tableau des prospections (ordinateur) : nom et objet, statut, messages
 * partis sur destinataires, réponses marquées, date utile.
 */
export function SequencesTable({ sequences, access, onOpen, onDelete }) {
  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        <col />
        <col className="w-[130px]" />
        <col className="w-[190px]" />
        <col className="w-[110px]" />
        <col className="w-[250px]" />
        <col className="w-[64px]" />
      </colgroup>
      <thead className="sticky top-0 z-10 bg-background">
        <tr className="border-b border-[#EEEFF1] dark:border-[#232323]">
          <th className={cn(HEAD, "pl-4 sm:pl-6")}>Prospection</th>
          <th className={HEAD}>Statut</th>
          <th className={HEAD}>Progression</th>
          <th className={cn(HEAD, "text-right")}>Réponses</th>
          <th className={HEAD}>Date</th>
          <th className={cn(HEAD, "pr-4 sm:pr-6")}>
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {sequences.map((sequence) => {
          const sender = senderLine(sequence);
          return (
            <tr
              key={sequence.id}
              onClick={() => onOpen(sequence)}
              className="group cursor-pointer border-b border-[#EEEFF1] transition-colors hover:bg-[#fafafa] dark:border-[#232323] dark:hover:bg-white/[0.03]"
            >
              <td className={cn(CELL, "pl-4 sm:pl-6")}>
                {/* Au clavier : la ligne entière est cliquable à la souris */}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(sequence);
                  }}
                  className={cn(
                    "block max-w-full cursor-pointer truncate rounded-sm text-left font-medium text-foreground",
                    FOCUS_RING,
                  )}
                >
                  {sequence.name}
                </button>
                <p className="truncate text-xs text-muted-foreground">
                  {sender ? (
                    sender
                  ) : sequence.subject ? (
                    <TextWithVariables text={sequence.subject} />
                  ) : (
                    "Sans objet"
                  )}
                </p>
              </td>
              <td className={CELL}>
                <SequenceStatusBadge status={sequence.status} />
              </td>
              <td className={CELL}>
                <Progress sequence={sequence} />
              </td>
              <td className={cn(CELL, "text-right")}>
                <Replies sequence={sequence} />
              </td>
              <td className={cn(CELL, "truncate text-muted-foreground")}>
                {sequenceDateLabel(sequence)}
              </td>
              <td className={cn(CELL, "pr-4 text-right sm:pr-6")}>
                <RowActions
                  sequence={sequence}
                  access={access}
                  onOpen={() => onOpen(sequence)}
                  onDelete={() => onDelete(sequence)}
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
export function SequenceCards({ sequences, access, onOpen, onDelete }) {
  return (
    <ul className="flex flex-col gap-2 px-4 py-3">
      {sequences.map((sequence) => {
        const sender = senderLine(sequence);
        const launched = isLaunched(sequence.status);
        return (
          <li
            key={sequence.id}
            className="relative rounded-xl border border-[#EEEFF1] bg-background dark:border-[#232323]"
          >
            <button
              type="button"
              onClick={() => onOpen(sequence)}
              className={cn(
                "flex w-full cursor-pointer flex-col gap-2 rounded-xl px-4 py-3 pr-12 text-left",
                FOCUS_RING,
              )}
            >
              <span className="min-w-0 truncate text-sm font-medium">
                {sequence.name}
              </span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <SequenceStatusBadge status={sequence.status} />
                <span className="text-xs text-muted-foreground">
                  {sequenceDateLabel(sequence)}
                </span>
              </span>
              {sender && (
                <span className="text-xs text-muted-foreground">{sender}</span>
              )}
              {launched && (
                <span className="flex items-end justify-between gap-4">
                  <Progress sequence={sequence} compact />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCount(sequence.stats?.replied || 0)}
                    </span>{" "}
                    réponse{(sequence.stats?.replied || 0) > 1 ? "s" : ""}
                  </span>
                </span>
              )}
            </button>
            <div className="absolute top-2.5 right-2">
              <RowActions
                sequence={sequence}
                access={access}
                onOpen={() => onOpen(sequence)}
                onDelete={() => onDelete(sequence)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
