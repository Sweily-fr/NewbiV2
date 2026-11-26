"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { Building2, ListChecks } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { GET_CLIENT_LISTS } from "@/src/graphql/queries/clientLists";
import { GET_PROSPECTING_AUDIENCE_COUNT } from "@/src/graphql/prospectingQueries";
import { plural } from "@/src/utils/email-campaigns";
import { prospectingExclusions } from "@/src/utils/prospecting";
import {
  AudienceCountPanel,
  ListPicker,
  ModeCard,
  audienceInput,
  useAudienceCount,
} from "@/app/dashboard/outils/campagnes-email/components/setup/audience-section";
import {
  FIELD_LABEL,
  SetupSection,
} from "@/app/dashboard/outils/campagnes-email/components/setup/setup-section";
import { FOCUS_RING } from "../shared";

const COUNT_OPTIONS = {
  query: GET_PROSPECTING_AUDIENCE_COUNT,
  field: "prospectingAudienceCount",
};

const listNames = (lists, ids) =>
  ids.map((id) => lists.find((list) => list.id === id)?.name).filter(Boolean);

/**
 * Destinataires : toutes les entreprises des contacts, ou des listes (avec
 * listes à exclure), décompte en direct et détail de ce qui est écarté
 * (particuliers, sans adresse, déjà prospectés depuis moins de 30 jours…).
 */
export function RecipientsSection({
  sequence,
  workspaceId,
  complete,
  canEdit,
  savedCount,
  onSave,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => audienceInput(sequence.audience));
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
  const live = useAudienceCount(workspaceId, draft, {
    ...COUNT_OPTIONS,
    skip: !editing,
  });

  const startEdit = () => {
    const current = audienceInput(sequence.audience);
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

  const saved = audienceInput(sequence.audience);
  const included = listNames(lists, saved.listIds);
  const excluded = listNames(lists, saved.excludeListIds);
  const countText = savedCount
    ? plural(savedCount.sendable, "destinataire")
    : null;
  const countSuffix = countText && (
    <>
      <span className="mx-1.5 text-muted-foreground/60">·</span>
      {countText}
    </>
  );
  const summary =
    saved.mode === "ALL" ? (
      <>
        <span className="font-medium text-foreground">
          Toutes mes entreprises
        </span>
        {excluded.length > 0 && <> sauf {excluded.join(", ")}</>}
        {countSuffix}
      </>
    ) : saved.listIds.length ? (
      <>
        <span className="font-medium text-foreground">
          {included.length > 2
            ? `${included.slice(0, 2).join(", ")} et ${included.length - 2} autre${included.length > 3 ? "s" : ""}`
            : included.join(", ") || plural(saved.listIds.length, "liste")}
        </span>
        {excluded.length > 0 && <> sauf {excluded.join(", ")}</>}
        {countSuffix}
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
  const count = noList ? null : live.count;

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
      saveDisabled={noList}
    >
      {/* Décompte à côté des choix seulement sur un très grand écran : la
          carte n'occupe que la colonne de gauche de la page */}
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div
            role="radiogroup"
            aria-label="Destinataires"
            className="grid gap-2.5 sm:grid-cols-2"
          >
            <ModeCard
              selected={draft.mode === "LISTS"}
              icon={ListChecks}
              title="Des listes"
              description="Une ou plusieurs listes, par exemple vos prospects générés."
              onClick={() =>
                setDraft((current) => ({ ...current, mode: "LISTS" }))
              }
            />
            <ModeCard
              selected={draft.mode === "ALL"}
              icon={Building2}
              title="Toutes mes entreprises"
              description={
                <>
                  Les entreprises de vos contacts qui ont une adresse{" "}
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
                        href="/dashboard/clients"
                        className="text-[#5a50ff] hover:underline"
                      >
                        Générer des prospects
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

          <p className="text-xs leading-5 text-muted-foreground">
            Seules les entreprises sont prospectées. Les particuliers, les
            désinscrits et les contacts déjà prospectés depuis moins de 30 jours
            sont écartés d&apos;office.
          </p>
        </div>
        <AudienceCountPanel
          count={count}
          loading={live.loading && !noList}
          error={noList ? null : live.error}
          exclusions={prospectingExclusions(count)}
          zeroText="Aucune entreprise ne peut recevoir cette prospection."
          emptyText="Cochez au moins une liste pour voir le nombre de destinataires."
          className="self-start"
        />
      </div>
    </SetupSection>
  );
}
