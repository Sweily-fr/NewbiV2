"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, Plus, Search, ShieldCheck, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { TextareaNew } from "@/src/components/ui/textarea-new";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { toast } from "@/src/components/ui/sonner";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { cn } from "@/src/lib/utils";
import {
  GET_EMAIL_TRACKING_CONSENTS,
  GRANT_EMAIL_TRACKING,
  REFUSE_EMAIL_TRACKING,
  REMOVE_EMAIL_TRACKING_CONSENT,
} from "@/src/graphql/emailCampaignQueries";
import {
  MAX_TRACKING_GRANT_EMAILS,
  TRACKING_CONSENT_TABS,
  formatCount,
  formatDateTime,
  parseEmailList,
  plural,
  trackingConsentOrigin,
  trackingGrantMessage,
} from "@/src/utils/email-campaigns";
import { FOCUS_RING, ToneBadge, errorMessage } from "./shared";

const PAGE_SIZE = 50;

const LABEL = "text-xs font-medium text-black/55 dark:text-white/55";

const STATUS_BADGES = {
  GRANTED: { label: "Accepté", tone: "success" },
  REFUSED: { label: "Refusé", tone: "neutral" },
};

// Après un changement, le décompte des contacts suivis (section Suivi,
// fenêtre d'envoi) est relu
const REFETCH_COUNTS = { refetchQueries: ["EmailCampaignAudienceCount"] };

/** Textes de la confirmation d'un refus ou d'un retrait. */
function confirmation(pending) {
  if (!pending) return null;
  const { action, item } = pending;
  const erased = `Les ouvertures et les clics déjà enregistrés pour ${item.email} sont effacés de toutes les campagnes de l'espace, et plus rien ne sera suivi pour cette adresse. L'effacement est définitif.`;
  const erasedDone = `Ce qui avait été enregistré pour ${item.email} est effacé.`;
  if (action === "refuse") {
    return {
      title: "Noter un refus ?",
      description: erased,
      confirm: "Noter le refus",
      danger: true,
      success: "Refus noté",
      done: erasedDone,
      failure: "Refus impossible",
    };
  }
  if (item.status === "GRANTED") {
    return {
      title: "Retirer l'accord ?",
      description: erased,
      confirm: "Retirer l'accord",
      danger: true,
      success: "Accord retiré",
      done: erasedDone,
      failure: "Retrait impossible",
    };
  }
  return {
    title: "Retirer le refus ?",
    description: `Plus aucun choix ne sera enregistré pour ${item.email} : sans accord, cette adresse reste non suivie.`,
    confirm: "Retirer le refus",
    danger: false,
    success: "Refus retiré",
    done: `Plus aucun choix n'est enregistré pour ${item.email}.`,
    failure: "Retrait impossible",
  };
}

/**
 * Accords de suivi de l'espace (recommandation CNIL sur les pixels de
 * suivi) : une adresse n'est suivie (ouvertures, clics) que si elle l'a
 * accepté. Choix du contact (lien « Gérer mes préférences » de chaque
 * e-mail) : définitif, ni modifiable ni retirable ici. Accords saisis par
 * l'espace : attestation obligatoire, puis refus ou retrait possibles.
 */
export function TrackingConsentsSheet({
  open,
  onOpenChange,
  workspaceId,
  canEdit,
}) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [formOpen, setFormOpen] = useState(false);
  const [emailsText, setEmailsText] = useState("");
  const [note, setNote] = useState("");
  const [attested, setAttested] = useState(false);
  const [pending, setPending] = useState(null);

  useEffect(() => setLimit(PAGE_SIZE), [debouncedSearch, tab]);

  // Saisie vide à chaque ouverture : l'attestation vaut pour un seul ajout
  useEffect(() => {
    if (!open) return;
    setFormOpen(false);
    setEmailsText("");
    setNote("");
    setAttested(false);
  }, [open]);

  const status =
    TRACKING_CONSENT_TABS.find((item) => item.value === tab)?.status ?? null;
  const variables = {
    workspaceId,
    status,
    search: debouncedSearch || null,
    page: 1,
    limit,
  };
  const { data, loading, error, refetch, previousData } = useQuery(
    GET_EMAIL_TRACKING_CONSENTS,
    {
      variables,
      skip: !open || !workspaceId,
      fetchPolicy: "cache-and-network",
      context: { skipErrorToast: true },
    },
  );
  const page = (data || previousData)?.emailTrackingConsents;
  const items = page?.items || [];
  const total = page?.total || 0;

  const [grantTracking, { loading: granting }] = useMutation(
    GRANT_EMAIL_TRACKING,
    { errorPolicy: "none", ...REFETCH_COUNTS },
  );
  const [refuseTracking, { loading: refusing }] = useMutation(
    REFUSE_EMAIL_TRACKING,
    { errorPolicy: "none", ...REFETCH_COUNTS },
  );
  const [removeConsent, { loading: removing }] = useMutation(
    REMOVE_EMAIL_TRACKING_CONSENT,
    { errorPolicy: "none", ...REFETCH_COUNTS },
  );
  const confirming = refusing || removing;
  const copy = confirmation(pending);

  const { valid, invalid } = parseEmailList(emailsText);
  const tooMany = valid.length > MAX_TRACKING_GRANT_EMAILS;
  const canSubmit = attested && valid.length > 0 && !tooMany && !granting;
  const emailsHint = tooMany
    ? `${formatCount(MAX_TRACKING_GRANT_EMAILS)} adresses au plus à la fois : vous en avez collé ${formatCount(valid.length)}.`
    : valid.length || invalid.length
      ? [
          `${plural(valid.length, "adresse")} à enregistrer`,
          invalid.length > 0 &&
            plural(invalid.length, "invalide ignorée", "invalides ignorées"),
        ]
          .filter(Boolean)
          .join(" · ")
      : `${formatCount(MAX_TRACKING_GRANT_EMAILS)} adresses au plus à la fois.`;

  const closeForm = () => {
    setFormOpen(false);
    setEmailsText("");
    setNote("");
    setAttested(false);
  };

  const handleGrant = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      const response = await grantTracking({
        variables: {
          workspaceId,
          emails: valid,
          note: note.trim() || null,
          attestation: true,
        },
      });
      const message = trackingGrantMessage(
        response.data?.grantEmailTracking,
        invalid,
      );
      (message.ok ? toast.success : toast.error)(message.title, {
        description: message.description,
      });
      closeForm();
      refetch().catch(() => {});
    } catch (grantError) {
      toast.error("Enregistrement impossible", {
        description: errorMessage(grantError),
      });
    }
  };

  const handleConfirm = async () => {
    if (!pending || confirming) return;
    const { action, item } = pending;
    try {
      if (action === "refuse") {
        await refuseTracking({
          variables: { workspaceId, email: item.email },
        });
      } else {
        await removeConsent({ variables: { workspaceId, id: item.id } });
      }
      toast.success(copy.success, { description: copy.done });
      setPending(null);
      refetch().catch(() => {});
    } catch (actionError) {
      toast.error(copy.failure, { description: errorMessage(actionError) });
    }
  };

  const emptyTitle = debouncedSearch
    ? "Aucune adresse trouvée"
    : status === "GRANTED"
      ? "Aucun accord"
      : status === "REFUSED"
        ? "Aucun refus"
        : "Aucun accord ni refus";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[460px]">
        <SheetHeader className="shrink-0 border-b border-[#EEEFF1] px-5 pt-5 pb-4 dark:border-[#232323]">
          <SheetTitle className="text-base font-medium">
            Accords de suivi
          </SheetTitle>
          <SheetDescription className="text-xs leading-5">
            Le suivi des ouvertures et des clics ne s&apos;applique qu&apos;aux
            adresses qui l&apos;ont accepté. Un refus efface ce qui a déjà été
            enregistré pour l&apos;adresse.
          </SheetDescription>
        </SheetHeader>

        {canEdit && (
          <div className="shrink-0 border-b border-[#EEEFF1] px-5 py-4 dark:border-[#232323]">
            {formOpen ? (
              <form onSubmit={handleGrant} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tracking-consent-emails" className={LABEL}>
                    Adresses qui ont accepté le suivi
                  </label>
                  <TextareaNew
                    id="tracking-consent-emails"
                    rows={3}
                    placeholder="Collez les adresses, séparées par des virgules, des espaces ou des retours à la ligne"
                    value={emailsText}
                    onChange={(event) => setEmailsText(event.target.value)}
                    aria-invalid={tooMany || undefined}
                    aria-describedby="tracking-consent-emails-hint"
                    className="min-h-[76px]"
                  />
                  <p
                    id="tracking-consent-emails-hint"
                    className={cn(
                      "text-xs",
                      tooMany
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {emailsHint}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tracking-consent-note" className={LABEL}>
                    Comment avez-vous recueilli cet accord ?{" "}
                    <span className="font-normal">(facultatif)</span>
                  </label>
                  <Input
                    id="tracking-consent-note"
                    placeholder="Ex. : formulaire d'inscription, case cochée"
                    value={note}
                    maxLength={200}
                    onChange={(event) => setNote(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e6e7ea] p-3 transition-colors hover:bg-[#fafafa] has-[[data-state=checked]]:border-[#5a50ff]/40 has-[[data-state=checked]]:bg-[#5a50ff]/[0.04] dark:border-[#2E2E32] dark:hover:bg-white/[0.03]">
                  <Checkbox
                    checked={attested}
                    onCheckedChange={(value) => setAttested(value === true)}
                    aria-labelledby="tracking-consent-attestation"
                    className="mt-0.5 data-[state=checked]:border-[#5a50ff] data-[state=checked]:bg-[#5a50ff]"
                  />
                  <span
                    id="tracking-consent-attestation"
                    className="text-xs leading-5"
                  >
                    Ces contacts m&apos;ont donné leur accord pour mesurer
                    l&apos;ouverture de mes e-mails et les clics sur leurs
                    liens, et je peux le prouver.
                  </span>
                </label>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={closeForm}
                    disabled={granting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" disabled={!canSubmit}>
                    {granting && <Loader2 className="size-3.5 animate-spin" />}
                    Enregistrer
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="outline" onClick={() => setFormOpen(true)}>
                <Plus className="size-3.5" aria-hidden />
                Ajouter des accords
              </Button>
            )}
          </div>
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
          <div
            role="tablist"
            aria-label="Filtrer les accords"
            className="mt-3 flex gap-1.5"
          >
            {TRACKING_CONSENT_TABS.map((item) => {
              const active = item.value === tab;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.value)}
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
                <ShieldCheck className="size-4.5" aria-hidden />
              </span>
              <p className="text-sm font-medium">{emptyTitle}</p>
              {!debouncedSearch && !status && (
                <p className="mt-1 max-w-[280px] text-xs leading-5 text-muted-foreground">
                  Les contacts qui acceptent ou refusent le suivi depuis le lien
                  « Gérer mes préférences » de vos e-mails apparaîtront ici.
                </p>
              )}
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-[#EEEFF1] dark:divide-[#232323]">
              {items.map((item) => {
                const badge = STATUS_BADGES[item.status] || {
                  label: item.status,
                  tone: "neutral",
                };
                const editable = canEdit && item.source === "SENDER";
                return (
                  <li key={item.id} className="flex items-start gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{item.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {trackingConsentOrigin(item)} ·{" "}
                        {formatDateTime(item.decidedAt)}
                      </p>
                      {item.note && (
                        <p className="mt-0.5 text-xs break-words text-muted-foreground">
                          Note : {item.note}
                        </p>
                      )}
                      {editable && (
                        <div className="mt-1 -ml-1.5 flex flex-wrap gap-1">
                          {item.status === "GRANTED" && (
                            <Button
                              variant="ghost"
                              className="h-6 rounded-md px-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setPending({ action: "refuse", item })
                              }
                              aria-label={`Noter un refus pour ${item.email}`}
                            >
                              Noter un refus
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            className="h-6 rounded-md px-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setPending({ action: "remove", item })
                            }
                            aria-label={`Retirer ${item.status === "GRANTED" ? "l'accord" : "le refus"} de ${item.email}`}
                          >
                            Retirer
                          </Button>
                        </div>
                      )}
                    </div>
                    <ToneBadge tone={badge.tone}>{badge.label}</ToneBadge>
                  </li>
                );
              })}
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

        <AlertDialog
          open={Boolean(pending)}
          onOpenChange={(next) => !next && !confirming && setPending(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {copy?.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={confirming}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  handleConfirm();
                }}
                disabled={confirming}
                className={
                  copy?.danger
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : undefined
                }
              >
                {confirming && <Loader2 className="size-3.5 animate-spin" />}
                {copy?.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
