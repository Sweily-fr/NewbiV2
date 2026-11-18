"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import {
  GET_EMAIL_CAMPAIGN,
  GET_EMAIL_CAMPAIGN_SETTINGS,
} from "@/src/graphql/emailCampaignQueries";
import { isReportStatus } from "@/src/utils/email-campaigns";
import { CampagnePageSkeleton } from "../components/campagne-page-skeleton";
import { CampaignReport } from "../components/report/campaign-report";
import { CampaignSetup } from "../components/setup/campaign-setup";
import { CAMPAIGNS_URL } from "../components/shared";

/**
 * Page d'une campagne : préparation (brouillon, programmée) ou rapport
 * (envoi en cours, en pause, terminé, annulé), à la même adresse.
 */
export default function CampagnePage() {
  const { id } = useParams();
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery(
    GET_EMAIL_CAMPAIGN,
    {
      variables: { workspaceId, id },
      skip: !workspaceId || !id,
      fetchPolicy: "cache-and-network",
      context: { skipErrorToast: true },
    },
  );
  const campaign = data?.emailCampaign;

  const { data: settingsData } = useQuery(GET_EMAIL_CAMPAIGN_SETTINGS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const settings = settingsData?.emailCampaignSettings;

  // Envoi en cours : avancement interrogé toutes les 5 secondes ; une
  // campagne programmée est surveillée pour basculer au départ
  const status = campaign?.status;
  useEffect(() => {
    if (status === "SENDING") startPolling(5000);
    else if (status === "SCHEDULED") startPolling(60000);
    else stopPolling();
    return () => stopPolling();
  }, [status, startPolling, stopPolling]);

  if (!campaign && (loading || !workspaceId)) return <CampagnePageSkeleton />;

  if (!campaign) {
    return (
      <div className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col items-center justify-center gap-3 p-6 text-center">
        <CircleAlert className="size-10 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-medium">
          {error ? "Impossible d'afficher la campagne" : "Campagne introuvable"}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {error
            ? "Le chargement a échoué. Vérifiez votre connexion, puis réessayez."
            : "Elle a peut-être été supprimée, ou appartient à un autre espace."}
        </p>
        <div className="mt-2 flex gap-2">
          <Button asChild variant="outline">
            <Link href={CAMPAIGNS_URL}>
              <ArrowLeft className="size-3.5" aria-hidden />
              Retour aux campagnes
            </Link>
          </Button>
          {error && (
            <Button variant="primary" onClick={() => refetch()}>
              Réessayer
            </Button>
          )}
        </div>
      </div>
    );
  }

  return isReportStatus(campaign.status) ? (
    <CampaignReport
      campaign={campaign}
      workspaceId={workspaceId}
      settings={settings}
    />
  ) : (
    <CampaignSetup
      campaign={campaign}
      workspaceId={workspaceId}
      settings={settings}
    />
  );
}
