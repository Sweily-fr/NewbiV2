"use client";

import { useEffect, useRef, useState } from "react";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { apiRefusalMessage } from "@/src/graphql/mutationErrors";
import { cn } from "@/src/lib/utils";
import { STATUS_META } from "@/src/utils/email-campaigns";

export const CAMPAIGNS_URL = "/dashboard/outils/campagnes-email";
export const campaignUrl = (id) => `${CAMPAIGNS_URL}/${id}`;
export const editorUrl = (id) => `${CAMPAIGNS_URL}/${id}/editeur`;

/** Anneau de focus au clavier (jamais au clic), comme l'éditeur de signature. */
export const FOCUS_RING =
  "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a50ff] dark:focus-visible:outline-[#8b7fff]";

/** Couleurs des pastilles (statuts, activité d'un destinataire). */
const TONES = {
  neutral:
    "bg-[#f1f1f3] text-[#4b4d55] dark:bg-white/[0.08] dark:text-white/75",
  muted: "bg-[#f4f4f5] text-[#8a8c93] dark:bg-white/[0.05] dark:text-white/45",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  accent:
    "bg-[#5a50ff]/10 text-[#4a41e0] dark:bg-[#8b7fff]/15 dark:text-[#b5adff]",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  warning:
    "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
};

const DOTS = {
  neutral: "bg-[#9a9ca3]",
  muted: "bg-[#c4c6cc]",
  info: "bg-sky-500",
  accent: "bg-[#5a50ff]",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export function ToneBadge({
  tone = "neutral",
  dot = false,
  pulse = false,
  className,
  children,
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap",
        TONES[tone] || TONES.neutral,
        className,
      )}
    >
      {dot && (
        <span className="relative flex size-1.5">
          {pulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                DOTS[tone],
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex size-1.5 rounded-full",
              DOTS[tone],
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  const meta = STATUS_META[status] || { label: status, tone: "neutral" };
  return (
    <ToneBadge
      tone={meta.tone}
      dot
      pulse={status === "SENDING"}
      className={className}
    >
      {meta.label}
    </ToneBadge>
  );
}

/** Message d'un refus de l'API (rédigé en français par elle), sinon `fallback`. */
export function errorMessage(
  error,
  fallback = "Une erreur est survenue. Réessayez.",
) {
  const graphQLMessage = error?.graphQLErrors?.[0]?.message;
  if (graphQLMessage) return apiRefusalMessage({ message: graphQLMessage });
  if (error?.networkError) {
    return "Connexion impossible avec le serveur. Vérifiez votre connexion, puis réessayez.";
  }
  return apiRefusalMessage(error) || fallback;
}

/**
 * Droits du rôle sur les campagnes (tout permis tant que la grille n'est
 * pas chargée : l'API refuse de toute façon) et abonnement en lecture seule.
 */
export function useCampaignAccess() {
  const { canDo, isReady } = useMyPermissions();
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const can = (action) => !isReady || canDo("emailCampaigns", action);
  return {
    canCreate: can("create"),
    canEdit: can("edit"),
    canDelete: can("delete"),
    canSend: can("send"),
    readOnly: Boolean(isReadOnly),
    readOnlyReason: isReadOnly
      ? isOwner
        ? "Mode lecture seule : renouvelez votre abonnement"
        : "Mode lecture seule : contactez l'administrateur"
      : null,
  };
}

/** Ouvre un onglet des paramètres (« generale » : nom et adresse). */
export function openSettings(tab = "generale") {
  window.dispatchEvent(
    new CustomEvent("newbi:open-settings", { detail: { tab } }),
  );
}

/** Carte de la page : bord fin, coins arrondis, fond de la page. */
export const CARD_CLASS =
  "rounded-xl border border-[#EEEFF1] bg-background dark:border-[#232323]";

/** Largeur d'un élément, suivie (vignettes mises à l'échelle). */
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = () => setWidth(element.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
