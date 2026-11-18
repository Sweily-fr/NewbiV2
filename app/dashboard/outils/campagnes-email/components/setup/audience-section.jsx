"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import {
  ListChecks,
  Loader2,
  MinusCircle,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { cn } from "@/src/lib/utils";
import { GET_CLIENT_LISTS } from "@/src/graphql/queries/clientLists";
import { GET_EMAIL_CAMPAIGN_AUDIENCE_COUNT } from "@/src/graphql/emailCampaignQueries";
import {
  audienceExclusions,
  formatCount,
  plural,
} from "@/src/utils/email-campaigns";
import { FOCUS_RING } from "../shared";
import { FIELD_LABEL, SetupSection } from "./setup-section";

/** Audience au format de l'API (listes vides en mode « Tous »). */
export const audienceInput = (audience) => ({
  mode: audience?.mode === "LISTS" ? "LISTS" : "ALL",
  listIds: audience?.mode === "LISTS" ? audience?.listIds || [] : [],
  excludeListIds: audience?.excludeListIds || [],
});

/** Décompte des destinataires d'une audience (direct, à chaque changement). */
export function useAudienceCount(workspaceId, audience, { skip = false } = {}) {
  const input = audienceInput(audience);
  const key = JSON.stringify(input);
  const debouncedKey = useDebouncedValue(key, 300);
  const { data, previousData, loading, error } = useQuery(
    GET_EMAIL_CAMPAIGN_AUDIENCE_COUNT,
    {
      variables: { workspaceId, audience: JSON.parse(debouncedKey) },
      skip: skip || !workspaceId,
      fetchPolicy: "cache-and-network",
      context: { skipErrorToast: true },
    },
  );
  const count = (data || previousData)?.emailCampaignAudienceCount || null;
  return {
    count,
    loading: loading || key !== debouncedKey,
    error,
  };
}

function ModeCard({ selected, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-[border-color,background-color,box-shadow]",
        FOCUS_RING,
        selected
          ? "border-[#5a50ff] bg-[#5a50ff]/[0.04] shadow-[0_0_0_3px_rgba(90,80,255,0.08)]"
          : "border-[#e6e7ea] hover:border-[#c9cbd1] dark:border-[#2E2E32] dark:hover:border-[#44444A]",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          selected
            ? "bg-[#5a50ff] text-white"
            : "bg-[#f1f1f3] text-[#4b4d55] dark:bg-white/10 dark:text-white/70",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function ListPicker({
  lists,
  selected,
  onToggle,
  disabledIds = [],
  emptyText,
}) {
  if (!lists.length) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="flex max-h-64 flex-col overflow-y-auto rounded-xl border border-[#EEEFF1] dark:border-[#232323]">
      {lists.map((list, index) => {
        const checked = selected.includes(list.id);
        const disabled = disabledIds.includes(list.id);
        return (
          <li
            key={list.id}
            className={cn(
              index > 0 && "border-t border-[#EEEFF1] dark:border-[#232323]",
            )}
          >
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-[#fafafa] dark:hover:bg-white/[0.03]",
                disabled &&
                  "cursor-not-allowed opacity-45 hover:bg-transparent",
              )}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => onToggle(list.id)}
                className="data-[state=checked]:border-[#5a50ff] data-[state=checked]:bg-[#5a50ff]"
              />
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: list.color || "#94a3b8" }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {list.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {plural(list.clientCount || 0, "contact")}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** Décompte en direct : destinataires, et pourquoi certains sont écartés. */
export function AudienceCountPanel({
  count,
  loading,
  error,
  quota,
  emptyText,
  className,
}) {
  const exclusions = audienceExclusions(count);
  const overQuota = count && quota && count.sendable > quota.remaining;
  return (
    <div
      aria-live="polite"
      className={cn(
        "rounded-xl bg-[#f7f7f8] p-4 dark:bg-white/[0.04]",
        className,
      )}
    >
      {!count && loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      ) : error && !count ? (
        <p className="text-sm text-muted-foreground">
          Le nombre de destinataires n&apos;a pas pu être calculé.
        </p>
      ) : count ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium tracking-tight tabular-nums">
              {formatCount(count.sendable)}
            </span>
            <span className="text-sm text-muted-foreground">
              destinataire{count.sendable > 1 ? "s" : ""}
            </span>
            {loading && (
              <Loader2 className="size-3.5 animate-spin self-center text-muted-foreground" />
            )}
          </div>
          {count.total > count.sendable && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              sur {plural(count.total, "contact")} sélectionné
              {count.total > 1 ? "s" : ""}
            </p>
          )}
          {exclusions.length > 0 && (
            <div className="mt-3 border-t border-[#e9e9ec] pt-3 dark:border-white/10">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#4b4d55] dark:text-white/70">
                <MinusCircle className="size-3.5" aria-hidden />
                Écartés automatiquement
              </p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {exclusions.map((item) => (
                  <li key={item.key}>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCount(item.count)}
                    </span>{" "}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {count.sendable === 0 && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
              Aucun contact ne peut recevoir cette campagne.
            </p>
          )}
          {overQuota && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400">
              <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
              Votre quota mensuel ne suffit pas : il reste{" "}
              {formatCount(quota.remaining)} e-mails pour{" "}
              {formatCount(count.sendable)} destinataires.
            </p>
          )}
        </>
      ) : emptyText ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : null}
    </div>
  );
}

const listNames = (lists, ids) =>
  ids.map((id) => lists.find((list) => list.id === id)?.name).filter(Boolean);

/**
 * Destinataires : tous les contacts, ou des listes (avec listes à exclure),
 * décompte en direct et détail de ce qui est écarté (sans adresse,
 * désinscrits, doublons…).
 */
export function AudienceSection({
  campaign,
  workspaceId,
  complete,
  canEdit,
  savedCount,
  quota,
  onSave,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => audienceInput(campaign.audience));
  const [showExclusions, setShowExclusions] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: listsData, loading: listsLoading } = useQuery(
    GET_CLIENT_LISTS,
    {
      variables: { workspaceId },
      skip: !workspaceId,
      fetchPolicy: "cache-and-network",
      context: { skipErrorToast: true },
    },
  );
  const lists = useMemo(() => listsData?.clientLists || [], [listsData]);
  const live = useAudienceCount(workspaceId, draft, { skip: !editing });

  const startEdit = () => {
    const current = audienceInput(campaign.audience);
    setDraft(current);
    setShowExclusions(current.excludeListIds.length > 0);
    setEditing(true);
  };

  const toggle = (field, id) =>
    setDraft((current) => {
      const ids = current[field];
      const next = ids.includes(id)
        ? ids.filter((item) => item !== id)
        : [...ids, id];
      const update = { ...current, [field]: next };
      // Une liste ne peut pas être à la fois incluse et exclue
      if (field === "listIds") {
        update.excludeListIds = current.excludeListIds.filter(
          (item) => !next.includes(item),
        );
      }
      return update;
    });

  const save = async () => {
    setSaving(true);
    const ok = await onSave({ audience: audienceInput(draft) });
    setSaving(false);
    if (ok) setEditing(false);
  };

  const saved = audienceInput(campaign.audience);
  const included = listNames(lists, saved.listIds);
  const excluded = listNames(lists, saved.excludeListIds);
  const countText = savedCount
    ? `${formatCount(savedCount.sendable)} destinataire${savedCount.sendable > 1 ? "s" : ""}`
    : null;
  const summary =
    saved.mode === "ALL" ? (
      <>
        <span className="font-medium text-foreground">Tous mes contacts</span>
        {excluded.length > 0 && <> sauf {excluded.join(", ")}</>}
        {countText && (
          <>
            <span className="mx-1.5 text-muted-foreground/60">·</span>
            {countText}
          </>
        )}
      </>
    ) : saved.listIds.length ? (
      <>
        <span className="font-medium text-foreground">
          {included.length > 2
            ? `${included.slice(0, 2).join(", ")} et ${included.length - 2} autre${included.length > 3 ? "s" : ""}`
            : included.join(", ") || plural(saved.listIds.length, "liste")}
        </span>
        {excluded.length > 0 && <> sauf {excluded.join(", ")}</>}
        {countText && (
          <>
            <span className="mx-1.5 text-muted-foreground/60">·</span>
            {countText}
          </>
        )}
      </>
    ) : (
      <span className="text-amber-700 dark:text-amber-400">
        Choisissez au moins une liste de contacts.
      </span>
    );

  const noList = draft.mode === "LISTS" && draft.listIds.length === 0;
  const excludable =
    draft.mode === "LISTS"
      ? lists.filter((list) => !draft.listIds.includes(list.id))
      : lists;

  return (
    <SetupSection
      id="destinataires"
      step={2}
      title="Destinataires"
      complete={complete}
      summary={summary}
      editing={editing}
      canEdit={canEdit}
      onEdit={startEdit}
      onCancel={() => setEditing(false)}
      onSave={save}
      saving={saving}
      saveDisabled={draft.mode === "LISTS" && draft.listIds.length === 0}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div
            role="radiogroup"
            aria-label="Destinataires"
            className="grid gap-2.5 sm:grid-cols-2"
          >
            <ModeCard
              selected={draft.mode === "ALL"}
              icon={Users}
              title="Tous mes contacts"
              description={
                <>
                  Les contacts du CRM qui ont une adresse{" "}
                  <span className="whitespace-nowrap">e-mail</span>.
                </>
              }
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  mode: "ALL",
                  listIds: [],
                }))
              }
            />
            <ModeCard
              selected={draft.mode === "LISTS"}
              icon={ListChecks}
              title="Des listes"
              description="Une ou plusieurs de vos listes de contacts."
              onClick={() =>
                setDraft((current) => ({ ...current, mode: "LISTS" }))
              }
            />
          </div>

          {draft.mode === "LISTS" && (
            <div className="flex flex-col gap-2">
              <span className={FIELD_LABEL}>Listes à inclure</span>
              {listsLoading && !lists.length ? (
                <Skeleton className="h-28 rounded-xl" />
              ) : (
                <ListPicker
                  lists={lists}
                  selected={draft.listIds}
                  onToggle={(id) => toggle("listIds", id)}
                  emptyText={
                    <>
                      Vous n&apos;avez pas encore de liste.{" "}
                      <Link
                        href="/dashboard/clients/listes"
                        className="text-[#5a50ff] hover:underline"
                      >
                        Créer une liste
                      </Link>
                    </>
                  }
                />
              )}
            </div>
          )}

          {lists.length > 0 &&
            (showExclusions ? (
              <div className="flex flex-col gap-2">
                <span className={FIELD_LABEL}>Contacts à exclure (listes)</span>
                <ListPicker
                  lists={excludable}
                  selected={draft.excludeListIds}
                  onToggle={(id) => toggle("excludeListIds", id)}
                  emptyText="Aucune autre liste."
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowExclusions(true)}
                className={cn(
                  "self-start rounded-sm text-sm font-medium text-[#5a50ff] hover:underline dark:text-[#8b7fff]",
                  FOCUS_RING,
                )}
              >
                Exclure les contacts d&apos;une liste
              </button>
            ))}
        </div>
        <AudienceCountPanel
          count={noList ? null : live.count}
          loading={live.loading && !noList}
          error={noList ? null : live.error}
          quota={quota}
          emptyText="Cochez au moins une liste pour voir le nombre de destinataires."
          className="self-start"
        />
      </div>
    </SetupSection>
  );
}
