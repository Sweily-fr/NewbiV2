"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useProspectingSettings } from "@/src/hooks/useProspecting";
import { GET_PROSPECTING_SEQUENCE } from "@/src/graphql/prospectingQueries";
import { PROSPECTING_URL, isLaunched } from "@/src/utils/prospecting";
import { ProspectionDetailPageSkeleton } from "../components/prospection-detail-page-skeleton";
import { SequenceReport } from "../components/report/sequence-report";
import { SequenceSetup } from "../components/setup/sequence-setup";

// Un message part toutes les 3 à 8 minutes : avancement relu toutes les 30 s
const LIVE_POLL_MS = 30 * 1000;

/**
 * Page d'une prospection : brouillon (préparation) ou suivi (en cours, en
 * pause, terminée, arrêtée), à la même adresse.
 */
export default function ProspectionDetailPage() {
  const { id } = useParams();
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery(
    GET_PROSPECTING_SEQUENCE,
    {
      variables: { workspaceId, id },
      skip: !workspaceId || !id,
      fetchPolicy: "cache-and-network",
      context: { skipErrorToast: true },
    },
  );
  const sequence = data?.prospectingSequence;
  const { settings } = useProspectingSettings();

  const status = sequence?.status;
  useEffect(() => {
    if (status === "ACTIVE") startPolling(LIVE_POLL_MS);
    else stopPolling();
    return () => stopPolling();
  }, [status, startPolling, stopPolling]);

  if (!sequence && (loading || !workspaceId)) {
    return <ProspectionDetailPageSkeleton />;
  }

  if (!sequence) {
    return (
      <div className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col items-center justify-center gap-3 p-6 text-center">
        <CircleAlert className="size-10 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-medium">
          {error
            ? "Impossible d'afficher la prospection"
            : "Prospection introuvable"}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {error
            ? "Le chargement a échoué. Vérifiez votre connexion, puis réessayez."
            : "Elle a peut-être été supprimée, ou appartient à un autre espace."}
        </p>
        <div className="mt-2 flex gap-2">
          <Button asChild variant="outline">
            <Link href={PROSPECTING_URL}>
              <ArrowLeft className="size-3.5" aria-hidden />
              Retour à la prospection
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

  return isLaunched(sequence.status) ? (
    <SequenceReport
      sequence={sequence}
      workspaceId={workspaceId}
      settings={settings}
    />
  ) : (
    <SequenceSetup
      sequence={sequence}
      workspaceId={workspaceId}
      settings={settings}
    />
  );
}
