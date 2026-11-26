"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_EMAIL_CAMPAIGN_LINK_TARGETS,
  GET_EMAIL_CAMPAIGN_SIGNATURES,
} from "@/src/graphql/emailCampaignQueries";
import { signatureIdsOf } from "@/src/utils/email-campaign-design";

/**
 * Données des autres outils dont l'éditeur a besoin : signatures (bloc
 * Signature, rendues par l'API comme dans l'e-mail) et destinations du
 * bouton (pages de rendez-vous et événements). Hors éditeur (vignettes des
 * modèles), aucun fournisseur : le bloc Signature n'affiche rien.
 */
const CampaignDataContext = createContext(null);

export const useCampaignData = () => useContext(CampaignDataContext);

// Liste relue au retour sur l'onglet (signature créée dans un autre onglet),
// au plus une fois par période
const REFETCH_ON_FOCUS_MS = 30 * 1000;

/**
 * Données de l'éditeur pour `design` (le contenu en cours) : à passer à
 * CampaignDataProvider. { signatures, signaturesById, signaturesLoaded,
 * signaturesError, linkTargets }.
 */
export function useCampaignDataValue(workspaceId, design) {
  // Signatures d'un autre membre déjà choisies dans le contenu : demandées
  // en plus de celles de l'utilisateur
  const idsKey = signatureIdsOf(design).sort().join(",");
  const ids = useMemo(() => (idsKey ? idsKey.split(",") : []), [idsKey]);

  const signaturesQuery = useQuery(GET_EMAIL_CAMPAIGN_SIGNATURES, {
    variables: { workspaceId, ids },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const linksQuery = useQuery(GET_EMAIL_CAMPAIGN_LINK_TARGETS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });

  const { refetch } = signaturesQuery;
  const lastRefetch = useRef(0);
  useEffect(() => {
    if (!workspaceId) return undefined;
    const onFocus = () => {
      const now = Date.now();
      if (now - lastRefetch.current < REFETCH_ON_FOCUS_MS) return;
      lastRefetch.current = now;
      refetch().catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [workspaceId, refetch]);

  // Pendant un nouveau chargement (signature d'un collègue ajoutée), la
  // liste précédente reste affichée
  const signatures = (signaturesQuery.data ?? signaturesQuery.previousData)
    ?.emailCampaignSignatures;
  const linkTargets = linksQuery.data?.emailCampaignLinkTargets;

  const value = useMemo(
    () => ({
      signatures: signatures || [],
      signaturesById: new Map(
        (signatures || []).map((signature) => [signature.id, signature]),
      ),
      signaturesLoaded: Boolean(signatures),
      signaturesError: Boolean(signaturesQuery.error) && !signatures,
      linkTargets: linkTargets || [],
    }),
    [signatures, signaturesQuery.error, linkTargets],
  );
  return value;
}

export function CampaignDataProvider({ value, children }) {
  return (
    <CampaignDataContext.Provider value={value}>
      {children}
    </CampaignDataContext.Provider>
  );
}
