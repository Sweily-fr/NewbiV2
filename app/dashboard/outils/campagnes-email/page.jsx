"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import {
  AtSign,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  Plus,
  Search,
  Send,
  ShieldBan,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
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
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { cn } from "@/src/lib/utils";
import {
  DELETE_EMAIL_CAMPAIGN,
  DUPLICATE_EMAIL_CAMPAIGN,
  GET_EMAIL_CAMPAIGNS,
  GET_EMAIL_CAMPAIGN_SETTINGS,
} from "@/src/graphql/emailCampaignQueries";
import {
  LIST_TABS,
  formatCount,
  quotaSummary,
} from "@/src/utils/email-campaigns";
import {
  sendingDomainBadge,
  sendingDomainState,
} from "@/src/utils/email-sending-domain";
import { CampagnesEmailPageSkeleton } from "./components/campagnes-email-page-skeleton";
import { CampaignCards, CampaignsTable } from "./components/campaigns-list";
import { NewCampaignDialog } from "./components/new-campaign-dialog";
import { SendingDomainSheet } from "./components/sender/sending-domain-sheet";
import { SuppressionsSheet } from "./components/suppressions-sheet";
import {
  FOCUS_RING,
  campaignUrl,
  errorMessage,
  useCampaignAccess,
} from "./components/shared";

const PAGE_SIZE = 20;

const EMPTY_TAB_TEXT = {
  drafts: "Aucun brouillon",
  scheduled: "Aucune campagne programmée",
  sending: "Aucune campagne en cours d'envoi",
  paused: "Aucune campagne en pause",
  sent: "Aucune campagne envoyée",
};

/** Quota du mois : jauge et « 1 240 / 2 500 e-mails ce mois-ci ». */
function QuotaMeter({ quota, className }) {
  const summary = quotaSummary(quota);
  if (!summary) return null;
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-[9px] border border-[#E6E7EA] px-3 dark:border-[#2E2E32]",
        className,
      )}
      title={`Il vous reste ${formatCount(summary.remaining)} e-mails ce mois-ci. Le compteur repart à zéro le 1er du mois.`}
    >
      <div
        className="h-1.5 w-14 overflow-hidden rounded-full bg-[#EEEFF1] dark:bg-white/10"
        role="progressbar"
        aria-label="E-mails envoyés ce mois-ci"
        aria-valuemin={0}
        aria-valuemax={summary.limit}
        aria-valuenow={summary.used}
      >
        <div
          className={cn(
            "h-full rounded-full",
            summary.tone === "danger"
              ? "bg-red-500"
              : summary.tone === "warning"
                ? "bg-amber-500"
                : "bg-[#5a50ff]",
          )}
          style={{ width: `${Math.max(2, summary.share * 100)}%` }}
        />
      </div>
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">
          {formatCount(summary.used)}
        </span>{" "}
        / {formatCount(summary.limit)} e-mails ce mois-ci
      </span>
    </div>
  );
}

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Vérification avant envoi",
    text: "Une note sur 10 et des conseils concrets pour ne pas finir en spam.",
  },
  {
    icon: Send,
    title: "Désinscription en un clic",
    text: "Ajoutée à chaque e-mail, comme l'exigent Gmail, Yahoo et Outlook.",
  },
  {
    icon: BarChart3,
    title: "Statistiques détaillées",
    text: "Ouvertures, clics et désinscriptions, contact par contact.",
  },
];

/** Aucune campagne : présentation de l'outil et premier pas. */
function FirstCampaign({ canCreate, readOnlyReason, onCreate }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12 text-center sm:py-16">
      <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#8b7fff]/15 dark:text-[#b5adff]">
        <Send className="size-5" aria-hidden />
      </span>
      <h2 className="text-lg font-medium">Envoyez votre première campagne</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Une newsletter, une promotion ou une invitation : choisissez un modèle,
        personnalisez-le à vos couleurs, puis envoyez-le à vos contacts, chacun
        à son nom.
      </p>
      {canCreate && (
        <Button
          variant="primary"
          className="mt-6"
          onClick={onCreate}
          disabled={Boolean(readOnlyReason)}
          title={readOnlyReason || undefined}
        >
          <Plus className="size-3.5" aria-hidden />
          Créer une campagne
        </Button>
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

const DOT_TONES = { warning: "bg-amber-500", danger: "bg-red-500" };

/**
 * « Adresse d'envoi » : ouvre le panneau du domaine connecté. Une pastille
 * signale un domaine en attente de validation ou en échec.
 */
function SenderAddressButton({ settings, isMobile, onClick }) {
  const domain = settings?.sendingDomain;
  const state = sendingDomainState(domain);
  const badge =
    state === "pending" || state === "failed"
      ? sendingDomainBadge(domain)
      : null;
  const label = badge
    ? `Adresse d'envoi\u00a0: ${badge.label.toLowerCase()}`
    : "Adresse d'envoi";
  const title = settings?.senderEmail
    ? `Vos campagnes partent de ${settings.senderEmail}${
        badge
          ? ` (domaine ${domain.domain}\u00a0: ${badge.label.toLowerCase()})`
          : ""
      }`
    : label;
  return (
    <Button
      variant="outline"
      onClick={onClick}
      size={isMobile ? "icon" : "default"}
      className={isMobile ? "size-9 rounded-full" : undefined}
      aria-label={label}
      title={title}
    >
      <AtSign className={isMobile ? "size-4" : "size-3.5"} aria-hidden />
      {/* Libellé masqué quand l'en-tête manque de place (barre latérale
          dépliée sur un petit écran) : l'icône et l'infobulle restent */}
      {!isMobile && (
        <span className="hidden @6xl:inline">Adresse d&apos;envoi</span>
      )}
      {badge && (
        <span
          aria-hidden
          className={cn(
            "rounded-full",
            DOT_TONES[badge.tone] || DOT_TONES.warning,
            isMobile
              ? "absolute top-1 right-1 size-2.5 ring-2 ring-background"
              : "size-1.5",
          )}
        />
      )}
    </Button>
  );
}

function SearchBox({ value, onChange, className }) {
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded-[9px] border border-[#E6E7EA] px-2.5 transition-[border] focus-within:border-[#D1D3D8] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A]",
        className,
      )}
    >
      <Search
        className="size-3.5 shrink-0 text-muted-foreground/80"
        aria-hidden
      />
      <Input
        variant="ghost"
        placeholder="Rechercher une campagne"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Rechercher une campagne"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="cursor-pointer text-muted-foreground/80 hover:text-foreground"
          aria-label="Effacer la recherche"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function deleteDescription(campaign) {
  if (!campaign) return "";
  if (campaign.status === "SCHEDULED")
    return "L'envoi programmé est annulé et la campagne supprimée. Cette action est irréversible.";
  if (campaign.status === "SENT" || campaign.status === "CANCELED")
    return "La campagne et ses statistiques seront supprimées. Les e-mails déjà reçus par vos contacts ne sont pas concernés. Cette action est irréversible.";
  return "Le brouillon sera supprimé définitivement.";
}

export default function CampagnesEmailPage() {
  const router = useRouter();
  const { workspaceId, organization } = useRequiredWorkspace();
  const access = useCampaignAccess();
  const isMobile = useIsMobile();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [newOpen, setNewOpen] = useState(false);
  const [suppressionsOpen, setSuppressionsOpen] = useState(false);
  const [senderOpen, setSenderOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setPage(1), [tab, debouncedSearch]);

  const status = LIST_TABS.find((item) => item.value === tab)?.status ?? null;
  const {
    data,
    previousData,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
  } = useQuery(GET_EMAIL_CAMPAIGNS, {
    variables: {
      workspaceId,
      status,
      search: debouncedSearch || null,
      page,
      limit: PAGE_SIZE,
    },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const list = (data || previousData)?.emailCampaigns;
  const campaigns = list?.items || [];
  const total = list?.total || 0;

  // Une campagne part : ses chiffres avancent dans la liste
  const sending = campaigns.some((campaign) => campaign.status === "SENDING");
  useEffect(() => {
    if (sending) startPolling(10000);
    else stopPolling();
    return () => stopPolling();
  }, [sending, startPolling, stopPolling]);

  const { data: settingsData } = useQuery(GET_EMAIL_CAMPAIGN_SETTINGS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const settings = settingsData?.emailCampaignSettings;

  const [duplicateCampaign] = useMutation(DUPLICATE_EMAIL_CAMPAIGN, {
    errorPolicy: "none",
  });
  const [deleteCampaign] = useMutation(DELETE_EMAIL_CAMPAIGN, {
    errorPolicy: "none",
  });

  const openCampaign = (campaign) => router.push(campaignUrl(campaign.id));

  const handleDuplicate = async (campaign) => {
    try {
      const { data: copy } = await duplicateCampaign({
        variables: { workspaceId, id: campaign.id },
      });
      toast.success("Campagne dupliquée");
      router.push(campaignUrl(copy.duplicateEmailCampaign.id));
    } catch (duplicateError) {
      toast.error("Duplication impossible", {
        description: errorMessage(duplicateError),
      });
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCampaign({ variables: { workspaceId, id: toDelete.id } });
      toast.success("Campagne supprimée");
      setToDelete(null);
      // Dernière ligne d'une page : retour à la précédente
      if (campaigns.length === 1 && page > 1) setPage((value) => value - 1);
      else refetch();
    } catch (deleteError) {
      toast.error("Suppression impossible", {
        description: errorMessage(deleteError),
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!list && (loading || !workspaceId)) return <CampagnesEmailPageSkeleton />;

  const firstUse = !debouncedSearch && tab === "all" && total === 0 && !error;
  const createButton = access.canCreate && (
    <Button
      variant="primary"
      onClick={() => setNewOpen(true)}
      disabled={access.readOnly}
      title={access.readOnlyReason || undefined}
      className={isMobile ? "size-9 rounded-full p-0" : undefined}
      aria-label={isMobile ? "Nouvelle campagne" : undefined}
    >
      <Plus className={isMobile ? "size-4.5" : "size-3.5"} aria-hidden />
      {!isMobile && "Nouvelle campagne"}
    </Button>
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="@container flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="min-w-[12rem] flex-1">
          <h1 className="text-2xl font-medium">Campagnes e-mail</h1>
          <p className="text-sm text-muted-foreground">
            Un e-mail personnalisé à vos clients, avec désinscription et
            vérification anti-spam intégrées.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isMobile && <QuotaMeter quota={settings?.quota} />}
          <SenderAddressButton
            settings={settings}
            isMobile={isMobile}
            onClick={() => setSenderOpen(true)}
          />
          <Button
            variant="outline"
            onClick={() => setSuppressionsOpen(true)}
            size={isMobile ? "icon" : "default"}
            className={isMobile ? "size-9 rounded-full" : undefined}
            aria-label="Désinscrits et exclusions"
            title="Désinscrits et exclusions"
          >
            <ShieldBan
              className={isMobile ? "size-4" : "size-3.5"}
              aria-hidden
            />
            {!isMobile && (
              <span className="hidden @6xl:inline">
                Désinscrits et exclusions
              </span>
            )}
          </Button>
          {createButton}
        </div>
      </div>

      {isMobile && settings?.quota && (
        <div className="shrink-0 px-4 pt-3">
          <QuotaMeter quota={settings.quota} className="w-full" />
        </div>
      )}

      {firstUse ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FirstCampaign
            canCreate={access.canCreate}
            readOnlyReason={access.readOnlyReason}
            onCreate={() => setNewOpen(true)}
          />
        </div>
      ) : (
        <>
          <div className="mt-4 flex shrink-0 flex-col gap-3 md:relative">
            <TabsNew value={tab} onValueChange={setTab}>
              <TabsNewList className="overflow-x-auto md:pr-[300px]">
                {LIST_TABS.map((item) => (
                  <TabsNewTrigger
                    key={item.value}
                    value={item.value}
                    className={FOCUS_RING}
                  >
                    {item.label}
                    {item.value === tab && list && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatCount(total)}
                      </span>
                    )}
                  </TabsNewTrigger>
                ))}
              </TabsNewList>
            </TabsNew>
            <SearchBox
              value={search}
              onChange={setSearch}
              className="mx-4 md:absolute md:top-0 md:right-6 md:mx-0 md:w-[260px]"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {error && !list ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <CircleAlert className="mb-3 size-10 text-muted-foreground" />
                <p className="font-medium">
                  Impossible d&apos;afficher vos campagnes
                </p>
                <p className="mt-1 mb-4 max-w-sm text-sm text-muted-foreground">
                  Le chargement a échoué. Vérifiez votre connexion, puis
                  réessayez.
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <p className="font-medium">
                  {debouncedSearch
                    ? "Aucune campagne ne correspond à votre recherche"
                    : EMPTY_TAB_TEXT[tab] || "Aucune campagne"}
                </p>
                {debouncedSearch && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-2 cursor-pointer text-sm text-[#5a50ff] hover:underline dark:text-[#8b7fff]"
                  >
                    Effacer la recherche
                  </button>
                )}
              </div>
            ) : isMobile ? (
              <CampaignCards
                campaigns={campaigns}
                access={access}
                onOpen={openCampaign}
                onDuplicate={handleDuplicate}
                onDelete={setToDelete}
              />
            ) : (
              <CampaignsTable
                campaigns={campaigns}
                access={access}
                onOpen={openCampaign}
                onDuplicate={handleDuplicate}
                onDelete={setToDelete}
              />
            )}
          </div>

          {total > PAGE_SIZE && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#EEEFF1] px-4 py-2 sm:px-6 dark:border-[#232323]">
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
                  disabled={page <= 1 || loading}
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
                  disabled={page >= totalPages || loading}
                  aria-label="Page suivante"
                >
                  {loading && data === undefined ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <NewCampaignDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        workspaceId={workspaceId}
        companyName={
          settings?.defaultFromName ||
          organization?.companyName ||
          organization?.name
        }
        companyAddress={settings?.companyAddress}
      />

      <SendingDomainSheet
        open={senderOpen}
        onOpenChange={setSenderOpen}
        workspaceId={workspaceId}
        settings={settings}
      />

      <SuppressionsSheet
        open={suppressionsOpen}
        onOpenChange={setSuppressionsOpen}
        workspaceId={workspaceId}
        canEdit={access.canEdit && !access.readOnly}
      />

      <AlertDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && !deleting && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer « {toDelete?.name} » ?
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
