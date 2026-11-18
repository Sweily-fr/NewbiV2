"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, Search, ShieldBan, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { toast } from "@/src/components/ui/sonner";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import {
  ADD_EMAIL_SUPPRESSION,
  GET_EMAIL_SUPPRESSIONS,
  REMOVE_EMAIL_SUPPRESSION,
} from "@/src/graphql/emailCampaignQueries";
import {
  formatCount,
  formatDay,
  isValidEmail,
  suppressionReasonLabel,
} from "@/src/utils/email-campaigns";
import { ToneBadge, errorMessage } from "./shared";

const PAGE_SIZE = 50;

const REASON_TONES = {
  UNSUBSCRIBED: "neutral",
  BOUNCED: "danger",
  COMPLAINED: "danger",
  MANUAL: "accent",
};

/**
 * Désinscrits et exclusions de l'espace : adresses qui ne reçoivent plus
 * aucune campagne (désinscription, rejet définitif, signalement en spam,
 * exclusion manuelle). Seules les exclusions manuelles se retirent.
 */
export function SuppressionsSheet({
  open,
  onOpenChange,
  workspaceId,
  canEdit,
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [email, setEmail] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => setLimit(PAGE_SIZE), [debouncedSearch]);

  const variables = {
    workspaceId,
    search: debouncedSearch || null,
    page: 1,
    limit,
  };
  const { data, loading, error, refetch, previousData } = useQuery(
    GET_EMAIL_SUPPRESSIONS,
    {
      variables,
      skip: !open || !workspaceId,
      fetchPolicy: "cache-and-network",
      context: { skipErrorToast: true },
    },
  );
  const page = (data || previousData)?.emailSuppressions;
  const items = page?.items || [];
  const total = page?.total || 0;

  const [addSuppression, { loading: adding }] = useMutation(
    ADD_EMAIL_SUPPRESSION,
    { errorPolicy: "none" },
  );
  const [removeSuppression] = useMutation(REMOVE_EMAIL_SUPPRESSION, {
    errorPolicy: "none",
  });

  const trimmed = email.trim().toLowerCase();
  const emailInvalid = trimmed.length > 0 && !isValidEmail(trimmed);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!trimmed || emailInvalid) return;
    try {
      await addSuppression({ variables: { workspaceId, email: trimmed } });
      toast.success("Adresse exclue", {
        description: `${trimmed} ne recevra plus vos campagnes.`,
      });
      setEmail("");
      refetch();
    } catch (addError) {
      toast.error("Exclusion impossible", {
        description: errorMessage(addError),
      });
    }
  };

  const handleRemove = async (item) => {
    setRemovingId(item.id);
    try {
      await removeSuppression({ variables: { workspaceId, id: item.id } });
      toast.success("Exclusion retirée", {
        description: `${item.email} pourra de nouveau recevoir vos campagnes.`,
      });
      await refetch();
    } catch (removeError) {
      toast.error("Retrait impossible", {
        description: errorMessage(removeError),
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[460px]">
        <SheetHeader className="shrink-0 border-b border-[#EEEFF1] px-5 pt-5 pb-4 dark:border-[#232323]">
          <SheetTitle className="text-base font-medium">
            Désinscrits et exclusions
          </SheetTitle>
          <SheetDescription className="text-xs leading-5">
            Ces adresses ne reçoivent plus aucune campagne de cet espace :
            désinscriptions, adresses rejetées, signalements en spam et
            exclusions ajoutées à la main.
          </SheetDescription>
        </SheetHeader>

        {canEdit && (
          <form
            onSubmit={handleAdd}
            className="flex shrink-0 flex-col gap-1.5 border-b border-[#EEEFF1] px-5 py-4 dark:border-[#232323]"
          >
            <label
              htmlFor="suppression-email"
              className="text-xs font-medium text-black/55 dark:text-white/55"
            >
              Exclure une adresse
            </label>
            <div className="flex gap-2">
              <Input
                id="suppression-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="adresse@exemple.fr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={emailInvalid || undefined}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={!trimmed || emailInvalid || adding}
                className="shrink-0"
              >
                {adding && <Loader2 className="size-3.5 animate-spin" />}
                Exclure
              </Button>
            </div>
            {emailInvalid && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Cette adresse n&apos;est pas valide.
              </p>
            )}
          </form>
        )}

        <div className="shrink-0 px-5 pt-4 pb-2">
          <div className="flex h-8 items-center gap-2 rounded-[9px] border border-[#E6E7EA] px-2.5 transition-[border] focus-within:border-[#D1D3D8] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A]">
            <Search
              className="size-3.5 shrink-0 text-muted-foreground/80"
              aria-hidden
            />
            <Input
              variant="ghost"
              placeholder="Rechercher une adresse"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Rechercher une adresse"
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
          {!loading && page && (
            <p className="mt-2 text-xs text-muted-foreground">
              {total === 0
                ? "Aucune adresse"
                : `${formatCount(total)} adresse${total > 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {loading && !page ? (
            <div className="flex flex-col gap-2 pt-1">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-[52px] rounded-lg" />
              ))}
            </div>
          ) : error && !page ? (
            <div className="flex flex-col items-start gap-3 py-6">
              <p className="text-sm text-muted-foreground">
                La liste n&apos;a pas pu être chargée.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#f4f4f5] text-muted-foreground dark:bg-white/[0.06]">
                <ShieldBan className="size-4.5" aria-hidden />
              </span>
              <p className="text-sm font-medium">
                {debouncedSearch
                  ? "Aucune adresse trouvée"
                  : "Aucune exclusion"}
              </p>
              {!debouncedSearch && (
                <p className="mt-1 max-w-[280px] text-xs leading-5 text-muted-foreground">
                  Les contacts qui se désinscrivent apparaîtront ici
                  automatiquement.
                </p>
              )}
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-[#EEEFF1] dark:divide-[#232323]">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Depuis le {formatDay(item.createdAt)}
                    </p>
                  </div>
                  <ToneBadge tone={REASON_TONES[item.reason] || "neutral"}>
                    {suppressionReasonLabel(item.reason)}
                  </ToneBadge>
                  {item.reason === "MANUAL" && canEdit ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground"
                      onClick={() => handleRemove(item)}
                      disabled={removingId === item.id}
                      aria-label={`Retirer l'exclusion de ${item.email}`}
                      title="Retirer l'exclusion"
                    >
                      {removingId === item.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <X className="size-3.5" />
                      )}
                    </Button>
                  ) : (
                    <span className="size-7 shrink-0" aria-hidden />
                  )}
                </li>
              ))}
            </ul>
          )}
          {items.length < total && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setLimit((value) => value + PAGE_SIZE)}
              disabled={loading}
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              Afficher plus
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
