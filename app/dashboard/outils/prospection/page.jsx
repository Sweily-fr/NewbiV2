"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import {
  CircleAlert,
  Inbox,
  Loader2,
  Plus,
  ShieldCheck,
  Target,
  Timer,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  TabsNew,
  TabsNewList,
  TabsNewTrigger,
} from "@/src/components/ui/tabs-new";
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
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useIsMobile } from "@/src/hooks/use-mobile";
import {
  useCreateProspectingSequence,
  useProspectingSettings,
} from "@/src/hooks/useProspecting";
import {
  DELETE_PROSPECTING_SEQUENCE,
  GET_PROSPECTING_SEQUENCES,
} from "@/src/graphql/prospectingQueries";
import {
  SEQUENCE_TABS,
  cleanMailboxReturnUrl,
  countSequencesByTab,
  filterSequences,
  mailboxState,
  newSequenceInput,
  prospectingUrl,
  readMailboxReturn,
} from "@/src/utils/prospecting";
import { formatCount } from "@/src/utils/email-campaigns";
import { ProspectionPageSkeleton } from "./components/prospection-page-skeleton";
import { MailboxCard } from "./components/mailbox-card";
import { MailboxSettingsSheet } from "./components/mailbox-settings-sheet";
import { SequenceCards, SequencesTable } from "./components/sequences-list";
import {
  FOCUS_RING,
  SendModeNotice,
  errorMessage,
  useProspectingAccess,
} from "./components/shared";

// Une prospection en cours avance d'un message toutes les 3 à 8 minutes
const LIVE_POLL_MS = 60 * 1000;

const EMPTY_TAB_TEXT = {
  drafts: "Aucun brouillon",
  active: "Aucune prospection en cours",
  paused: "Aucune prospection en pause",
  done: "Aucune prospection terminée",
};

const FEATURES = [
  {
    icon: Inbox,
    title: "Depuis votre boîte",
    text: "Chaque message part de votre Gmail ou Outlook, à votre nom : les réponses arrivent chez vous.",
  },
  {
    icon: Timer,
    title: "Un rythme humain",
    text: "Quelques dizaines d'e-⁠mails par jour, espacés de quelques minutes, aux heures de bureau.",
  },
  {
    icon: ShieldCheck,
    title: "Respectueux des prospects",
    text: "Professionnels seulement, désinscription en un clic et aucun suivi d'ouverture.",
  },
];

/** Aucune prospection : présentation du mode et premier pas. */
function FirstProspection({ createButton, hasMailbox }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-10 text-center sm:py-14">
      <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#8b7fff]/15 dark:text-[#b5adff]">
        <Target className="size-5" aria-hidden />
      </span>
      <h2 className="text-lg font-medium">Écrivez à vos premiers prospects</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Choisissez une liste d&apos;entreprises, écrivez un message court et
        personnalisé : chacun le reçoit de votre boîte, comme un e-⁠mail que
        vous auriez envoyé vous-même.
      </p>
      {hasMailbox ? (
        createButton && <div className="mt-6">{createButton}</div>
      ) : (
        <p className="mt-5 text-sm font-medium">
          Commencez par connecter votre boîte d&apos;envoi, juste au-dessus.
        </p>
      )}
      <div className="mt-10 grid w-full gap-3 text-left sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-xl border border-[#EEEFF1] p-4 dark:border-[#232323]"
          >
            <Icon
              className="mb-2.5 size-4 text-[#5a50ff] dark:text-[#8b7fff]"
              aria-hidden
            />
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function deleteDescription(sequence) {
  if (!sequence) return "";
  if (sequence.status === "DRAFT")
    return "Le brouillon sera supprimé définitivement.";
  return "La prospection et son suivi seront supprimés. Les messages déjà reçus par vos prospects ne sont pas concernés. Cette action est irréversible.";
}

/**
 * Prospection : boîte d'envoi du membre (Gmail ou Outlook) et ses
 * prospections. Retour de la connexion OAuth : ?boite=connectee ou
 * ?boite_erreur=<message>, lu une fois puis retiré de l'adresse.
 */
export default function ProspectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { workspaceId } = useRequiredWorkspace();
  const access = useProspectingAccess();
  const isMobile = useIsMobile();

  const [tab, setTab] = useState("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    data,
    previousData,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
  } = useQuery(GET_PROSPECTING_SEQUENCES, {
    variables: { workspaceId, status: null },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const sequences = (data || previousData)?.prospectingSequences;

  const {
    settings,
    loading: settingsLoading,
    refetch: refetchSettings,
    startPolling: startSettingsPolling,
    stopPolling: stopSettingsPolling,
  } = useProspectingSettings();
  const mailbox = settings?.myMailbox || null;
  const hasMailbox = mailboxState(mailbox) !== "none";

  // Prospection en cours : chiffres et envois du jour relus chaque minute
  const live = (sequences || []).some((item) => item.status === "ACTIVE");
  useEffect(() => {
    if (!live) return undefined;
    startPolling(LIVE_POLL_MS);
    startSettingsPolling(LIVE_POLL_MS);
    return () => {
      stopPolling();
      stopSettingsPolling();
    };
  }, [
    live,
    startPolling,
    stopPolling,
    startSettingsPolling,
    stopSettingsPolling,
  ]);

  // Retour de Google ou Microsoft : message, puis adresse nettoyée (une
  // seule fois, même si l'effet est rejoué)
  const handledReturn = useRef(null);
  useEffect(() => {
    const result = readMailboxReturn(searchParams);
    if (!result) return;
    const key = searchParams.toString();
    if (handledReturn.current === key) return;
    handledReturn.current = key;
    if (result.kind === "connected") {
      toast.success("Boîte connectée", {
        description: "Vos prospections partiront de cette adresse.",
      });
      refetchSettings().catch(() => {});
    } else {
      toast.error("Connexion de la boîte impossible", {
        description: result.message,
      });
    }
    const clean = cleanMailboxReturnUrl(window.location.href);
    if (clean) window.history.replaceState(null, "", clean);
  }, [searchParams, refetchSettings]);

  const { create, creating } = useCreateProspectingSequence();
  const [deleteSequence] = useMutation(DELETE_PROSPECTING_SEQUENCE, {
    errorPolicy: "none",
  });

  const counts = useMemo(() => countSequencesByTab(sequences), [sequences]);
  const visible = useMemo(
    () => filterSequences(sequences, tab),
    [sequences, tab],
  );

  const openSequence = (sequence) => router.push(prospectingUrl(sequence.id));

  const handleCreate = async () => {
    try {
      const sequence = await create(
        newSequenceInput({ signatureId: mailbox?.signatureId }),
      );
      if (sequence) router.push(prospectingUrl(sequence.id));
    } catch (createError) {
      toast.error("Création impossible", {
        description: errorMessage(createError),
      });
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteSequence({ variables: { workspaceId, id: toDelete.id } });
      toast.success("Prospection supprimée");
      setToDelete(null);
      refetch();
    } catch (deleteError) {
      toast.error("Suppression impossible", {
        description: errorMessage(deleteError),
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!sequences && (loading || !workspaceId)) {
    return <ProspectionPageSkeleton />;
  }

  const createBlockedReason = access.readOnly
    ? access.readOnlyReason
    : hasMailbox
      ? null
      : "Connectez d'abord votre boîte d'envoi.";
  // Rond avec « + » dans l'en-tête sur téléphone, libellé complet sinon
  const renderCreateButton = (compact) =>
    access.canCreate && (
      <span title={createBlockedReason || undefined} className="inline-flex">
        <Button
          variant="primary"
          onClick={handleCreate}
          disabled={Boolean(createBlockedReason) || creating}
          className={compact ? "size-9 rounded-full p-0" : undefined}
          aria-label={compact ? "Nouvelle prospection" : undefined}
        >
          {creating ? (
            <Loader2
              className={
                compact ? "size-4 animate-spin" : "size-3.5 animate-spin"
              }
            />
          ) : (
            <Plus className={compact ? "size-4.5" : "size-3.5"} aria-hidden />
          )}
          {!compact && "Nouvelle prospection"}
        </Button>
      </span>
    );
  const createButton = renderCreateButton(isMobile);
  const firstUse = (sequences || []).length === 0 && !error;

  return (
    <div className="@container flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="min-w-[12rem] flex-1">
          <h1 className="text-2xl font-medium">Prospection</h1>
          <p className="text-sm text-muted-foreground">
            Écrivez à vos prospects depuis votre propre boîte mail : un message
            chacun, à votre nom, à un rythme qui protège votre adresse.
          </p>
        </div>
        {createButton && <div className="flex shrink-0">{createButton}</div>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 pt-4 sm:px-6">
          <SendModeNotice sendMode={settings?.sendMode} />
          <MailboxCard
            settings={settings}
            loading={settingsLoading}
            access={access}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>

        {firstUse ? (
          <FirstProspection
            createButton={renderCreateButton(false)}
            hasMailbox={hasMailbox}
          />
        ) : (
          <>
            <TabsNew value={tab} onValueChange={setTab} className="mt-5">
              <TabsNewList className="overflow-x-auto">
                {SEQUENCE_TABS.map((item) => (
                  <TabsNewTrigger
                    key={item.value}
                    value={item.value}
                    className={FOCUS_RING}
                  >
                    {item.label}
                    {counts[item.value] > 0 && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatCount(counts[item.value])}
                      </span>
                    )}
                  </TabsNewTrigger>
                ))}
              </TabsNewList>
            </TabsNew>

            {error && !sequences ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <CircleAlert className="mb-3 size-10 text-muted-foreground" />
                <p className="font-medium">
                  Impossible d&apos;afficher vos prospections
                </p>
                <p className="mt-1 mb-4 max-w-sm text-sm text-muted-foreground">
                  Le chargement a échoué. Vérifiez votre connexion, puis
                  réessayez.
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            ) : visible.length === 0 ? (
              <p className="px-6 py-16 text-center font-medium">
                {EMPTY_TAB_TEXT[tab] || "Aucune prospection"}
              </p>
            ) : isMobile ? (
              <SequenceCards
                sequences={visible}
                access={access}
                onOpen={openSequence}
                onDelete={setToDelete}
              />
            ) : (
              <SequencesTable
                sequences={visible}
                access={access}
                onOpen={openSequence}
                onDelete={setToDelete}
              />
            )}
          </>
        )}
      </div>

      <MailboxSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        workspaceId={workspaceId}
        mailbox={mailbox}
        settings={settings}
        canEdit={!access.readOnly}
      />

      <AlertDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && !deleting && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer « {toDelete?.name} » ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDescription(toDelete)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting && <Loader2 className="size-3.5 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
