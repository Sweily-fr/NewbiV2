"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  CREATE_PROSPECTING_SEQUENCE,
  GET_PROSPECTING_SETTINGS,
} from "@/src/graphql/prospectingQueries";
import { mailboxAuthorizeUrl, providerLabel } from "@/src/utils/prospecting";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/+$/, "");

/**
 * Réglages de la prospection de l'espace : fournisseurs configurés, boîte
 * du membre et de l'équipe, variables, bornes de la limite quotidienne.
 */
export function useProspectingSettings({ skip = false } = {}) {
  const { workspaceId } = useWorkspace();
  const query = useQuery(GET_PROSPECTING_SETTINGS, {
    variables: { workspaceId },
    skip: skip || !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  return {
    ...query,
    settings: (query.data || query.previousData)?.prospectingSettings || null,
  };
}

/**
 * Crée un brouillon de prospection (boîte du membre connecté : refus de
 * l'API s'il n'en a pas). Rend la prospection créée, ou lève l'erreur.
 */
export function useCreateProspectingSequence() {
  const { workspaceId } = useWorkspace();
  const [mutate, { loading }] = useMutation(CREATE_PROSPECTING_SEQUENCE, {
    errorPolicy: "none",
    refetchQueries: ["ProspectingSequences"],
  });
  const create = useCallback(
    async (input) => {
      const { data } = await mutate({ variables: { workspaceId, input } });
      return data?.createProspectingSequence || null;
    },
    [mutate, workspaceId],
  );
  return { create, creating: loading };
}

/**
 * Connexion d'une boîte Gmail ou Outlook : appel direct de l'API (et non
 * d'un proxy du site), qui pose le cookie liant le retour du fournisseur à
 * ce navigateur, puis départ vers la page d'autorisation. Le retour arrive
 * sur la page Prospection (?boite=connectee ou ?boite_erreur=).
 */
export function useMailboxConnect() {
  const { workspaceId } = useWorkspace();
  const [connecting, setConnecting] = useState(null);

  const connect = useCallback(
    async (provider) => {
      const url = mailboxAuthorizeUrl(API_URL, provider);
      if (!url || !workspaceId) return;
      setConnecting(provider);
      try {
        const tokenResponse = await fetch("/api/auth/token", {
          credentials: "include",
        });
        const { token } = await tokenResponse.json().catch(() => ({}));
        if (!token) {
          throw new Error("Votre session a expiré : reconnectez-vous.");
        }
        const response = await fetch(url, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-organization-id": workspaceId,
            "x-workspace-id": workspaceId,
          },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.authUrl) {
          throw new Error(
            data.message ||
              data.error ||
              "La connexion n'a pas pu démarrer. Réessayez dans un instant.",
          );
        }
        // La page part : le bouton reste en attente jusqu'au départ
        window.location.href = data.authUrl;
      } catch (error) {
        toast.error(`Connexion ${providerLabel(provider)} impossible`, {
          description: error?.message,
        });
        setConnecting(null);
      }
    },
    [workspaceId],
  );

  return { connect, connecting };
}
