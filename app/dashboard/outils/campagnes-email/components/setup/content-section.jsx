"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { Eye, PenLine } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { GET_EMAIL_CAMPAIGN_PREVIEW } from "@/src/graphql/emailCampaignQueries";
import { designSummary } from "@/src/utils/email-campaign-design";
import { formatDateTime, plural } from "@/src/utils/email-campaigns";
import { EmailThumbnail } from "../email-frame";
import { CARD_CLASS, editorUrl } from "../shared";
import { StepIcon } from "./setup-section";

/** Vignette de l'e-mail rendu par l'API (HTML d'envoi). */
export function CampaignThumbnail({
  workspaceId,
  campaign,
  height = 300,
  className,
}) {
  const { data, loading } = useQuery(GET_EMAIL_CAMPAIGN_PREVIEW, {
    variables: { workspaceId, id: campaign.id },
    skip: !workspaceId,
    // Le contenu change dans l'éditeur : toujours le dernier rendu
    fetchPolicy: "network-only",
    context: { skipErrorToast: true },
  });
  const html = data?.emailCampaignPreview?.html;
  if (!html) {
    return loading ? (
      <Skeleton className={className} style={{ height }} />
    ) : (
      <div
        className={`flex items-center justify-center bg-[#f4f4f5] text-xs text-muted-foreground ${className || ""}`}
        style={{ height }}
      >
        Aperçu indisponible
      </div>
    );
  }
  return <EmailThumbnail html={html} height={height} className={className} />;
}

/**
 * Contenu : vignette de l'e-mail, ce qu'il contient, et l'éditeur. Complet
 * dès qu'il y a au moins un bloc.
 */
export function ContentSection({
  campaign,
  workspaceId,
  complete,
  canEdit,
  onPreview,
}) {
  const summary = designSummary(campaign.design);
  const facts = [
    plural(summary.blocks, "bloc"),
    summary.buttons ? plural(summary.buttons, "bouton") : null,
    summary.images ? plural(summary.images, "image") : null,
  ].filter(Boolean);
  const editable = canEdit && campaign.status === "DRAFT";

  return (
    <section
      id="contenu"
      aria-labelledby="contenu-title"
      className={`${CARD_CLASS} p-4 sm:p-5`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <StepIcon complete={complete} step={4} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 id="contenu-title" className="text-[15px] leading-6 font-medium">
            Contenu
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {complete
              ? facts.join(" · ")
              : "Votre e-mail est vide : ajoutez des blocs dans l'éditeur."}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-stretch sm:pl-11">
        <button
          type="button"
          onClick={onPreview}
          className="group relative w-full shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#EEEFF1] bg-[#f4f4f5] sm:w-[220px] dark:border-[#232323]"
          aria-label="Voir l'aperçu de l'e-mail"
        >
          <CampaignThumbnail
            workspaceId={workspaceId}
            campaign={campaign}
            height={280}
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/[0.06] to-transparent" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-[opacity,background-color] group-hover:bg-black/25 group-hover:opacity-100">
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#242529] shadow-sm">
              <Eye className="size-3.5" aria-hidden />
              Aperçu
            </span>
          </span>
        </button>
        <div className="flex min-w-0 flex-col justify-between gap-4">
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <p>
              Modifiez textes, images, boutons et couleurs dans l&apos;éditeur.
              Le pied de page (identité de l&apos;entreprise et lien de
              désinscription) est ajouté automatiquement.
            </p>
            <p className="text-xs">
              Dernière modification le {formatDateTime(campaign.updatedAt)}
              {campaign.createdByName
                ? ` · créée par ${campaign.createdByName}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {editable && (
              <Button asChild variant="primary">
                <Link href={editorUrl(campaign.id)}>
                  <PenLine className="size-3.5" aria-hidden />
                  Modifier le contenu
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={onPreview}>
              <Eye className="size-3.5" aria-hidden />
              Aperçu
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
