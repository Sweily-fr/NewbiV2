"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ArrowLeft, CircleAlert, Monitor } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useIsMobile } from "@/src/hooks/use-mobile";
import {
  GET_EMAIL_CAMPAIGN,
  GET_EMAIL_CAMPAIGN_SETTINGS,
} from "@/src/graphql/emailCampaignQueries";
import { EditeurPageSkeleton } from "../../components/editeur-page-skeleton";
import { CampaignEditor } from "../../components/editor/campaign-editor";
import { CAMPAIGNS_URL, campaignUrl } from "../../components/shared";

/** Message plein écran (téléphone, campagne introuvable). */
function Notice({ icon: Icon, title, text, href, linkLabel, onRetry }) {
  return (
    <div className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#8b7fff]/15 dark:text-[#b5adff]">
        <Icon className="size-5" aria-hidden />
      </span>
      <h1 className="text-lg font-medium">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      <div className="mt-2 flex gap-2">
        <Button asChild variant="outline">
          <Link href={href}>
            <ArrowLeft className="size-3.5" aria-hidden />
            {linkLabel}
          </Link>
        </Button>
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Réessayer
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Éditeur du contenu d'une campagne (pleine largeur, sans la barre
 * latérale). Sur téléphone, un message : l'éditeur demande un écran
 * d'ordinateur ; la campagne et son rapport restent consultables.
 */
export default function EditeurPage() {
  const { id } = useParams();
  const { workspaceId, organization } = useRequiredWorkspace();
  const isMobile = useIsMobile();

  const { data, loading, error, refetch } = useQuery(GET_EMAIL_CAMPAIGN, {
    variables: { workspaceId, id },
    skip: !workspaceId || !id,
    // Toujours la dernière version enregistrée : l'éditeur la lit une fois
    fetchPolicy: "network-only",
    context: { skipErrorToast: true },
  });
  const campaign = data?.emailCampaign;
  const { data: settingsData, loading: settingsLoading } = useQuery(
    GET_EMAIL_CAMPAIGN_SETTINGS,
    {
      variables: { workspaceId },
      skip: !workspaceId,
      fetchPolicy: "cache-and-network",
      context: { skipErrorToast: true },
    },
  );
  const settings = settingsData?.emailCampaignSettings;

  if (isMobile) {
    return (
      <Notice
        icon={Monitor}
        title="L'éditeur est conçu pour un écran d'ordinateur"
        text="Glisser des blocs et régler les couleurs demande de la place. Ouvrez cette campagne sur un ordinateur pour modifier son contenu ; son aperçu reste disponible ici."
        href={campaignUrl(id)}
        linkLabel="Retour à la campagne"
      />
    );
  }

  if (
    !campaign &&
    (loading || !workspaceId || (settingsLoading && !settings))
  ) {
    return <EditeurPageSkeleton />;
  }

  if (!campaign) {
    return (
      <Notice
        icon={CircleAlert}
        title={error ? "Impossible d'ouvrir l'éditeur" : "Campagne introuvable"}
        text={
          error
            ? "Le chargement a échoué. Vérifiez votre connexion, puis réessayez."
            : "Elle a peut-être été supprimée, ou appartient à un autre espace."
        }
        href={CAMPAIGNS_URL}
        linkLabel="Retour aux campagnes"
        onRetry={error ? () => refetch() : undefined}
      />
    );
  }

  return (
    <CampaignEditor
      // Une autre campagne (navigation) repart d'un éditeur neuf
      key={campaign.id}
      campaign={campaign}
      workspaceId={workspaceId}
      settings={settings}
      companyName={
        settings?.defaultFromName ||
        organization?.companyName ||
        organization?.name
      }
    />
  );
}
