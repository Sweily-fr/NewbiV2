"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import {
  CANCEL_SOCIAL_POST,
  CONNECT_SOCIAL_ACCOUNT,
  DISCONNECT_SOCIAL_ACCOUNT,
  GET_BOARD_SOCIAL_POSTS,
  GET_SOCIAL_PUBLISHING_STATUS,
  GET_TIKTOK_CREATOR_INFO,
  REFRESH_SOCIAL_ACCOUNTS,
  RETRY_SOCIAL_POST,
  SCHEDULE_SOCIAL_POST,
  UPDATE_SOCIAL_POST,
  UPLOAD_SOCIAL_POST_MEDIA,
} from "@/src/graphql/socialPublishingQueries";
import { GET_BOARD } from "@/src/graphql/kanbanQueries";
import {
  SOCIAL_PLATFORMS,
  getPlatformLabel,
  shouldPollSocialPosts,
} from "@/src/utils/social-post-rules";

const POLL_INTERVAL_MS = 60 * 1000;
const EMPTY = Object.freeze([]);

// Erreur de requête (API sans ce champ, schéma refusé) : jamais affichée
const TECHNICAL_CODES = new Set([
  "GRAPHQL_VALIDATION_FAILED",
  "GRAPHQL_PARSE_FAILED",
  "BAD_REQUEST",
]);
const TECHNICAL_MESSAGE =
  /Cannot query field|Unknown (argument|type)|Variable "\$|ValidationError|Cast to |Cannot read propert|is not a function|\bundefined\b|ECONN|ETIMEDOUT/;

/**
 * Message à afficher pour une erreur Apollo : celui de l'API (rédigé en
 * français, prêt à afficher) quand il est propre, sinon le message de repli.
 */
export function getApiErrorMessage(error, fallback) {
  const first = error?.graphQLErrors?.[0];
  const message = first?.message;
  if (
    message &&
    !TECHNICAL_CODES.has(first?.extensions?.code) &&
    !TECHNICAL_MESSAGE.test(message) &&
    message.length <= 400
  ) {
    return message;
  }
  return fallback;
}

/**
 * État de la fonctionnalité pour l'espace : activée côté serveur, droits de
 * l'utilisateur et comptes connectés. Si l'API ne connaît pas encore la
 * requête, tout reste masqué, sans message d'erreur.
 */
export function useSocialPublishingStatus(workspaceId, { skip = false } = {}) {
  const { data, loading, error, refetch } = useQuery(
    GET_SOCIAL_PUBLISHING_STATUS,
    {
      variables: { workspaceId },
      skip: skip || !workspaceId,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      errorPolicy: "all",
      context: { skipErrorToast: true },
    },
  );

  const status = data?.socialPublishingStatus || null;
  return useMemo(
    () => ({
      enabled: !!status?.enabled,
      canManageAccounts: !!status?.canManageAccounts,
      canSchedule: !!status?.canSchedule,
      accounts: status?.accounts || EMPTY,
      // Réseaux connectables par l'espace (fournisseur configuré côté API)
      platforms: Array.isArray(status?.platforms)
        ? status.platforms
        : SOCIAL_PLATFORMS,
      xPostQuota: status?.xPostQuota || null,
      loaded: !!status || (!loading && !!error),
      loading,
      error,
      refetch,
    }),
    [status, loading, error, refetch],
  );
}

/**
 * Lance la connexion d'un réseau : l'API renvoie l'adresse d'autorisation,
 * le navigateur y part et revient sur `returnTo` (?social_connected=…).
 */
export function useConnectSocialAccount(workspaceId) {
  const [connectMutation] = useMutation(CONNECT_SOCIAL_ACCOUNT);
  const [connectingPlatform, setConnectingPlatform] = useState(null);

  const connect = useCallback(
    async (platform, returnTo, { beforeRedirect } = {}) => {
      if (!platform) return;
      setConnectingPlatform(platform);
      try {
        const { data } = await connectMutation({
          variables: { platform, returnTo, workspaceId },
        });
        const url = data?.connectSocialAccount;
        if (!url) throw new Error("Adresse de connexion absente");
        beforeRedirect?.();
        window.location.href = url;
        // On garde l'indicateur : la page va changer
      } catch (error) {
        setConnectingPlatform(null);
        toast.error(
          getApiErrorMessage(
            error,
            `Impossible de lancer la connexion à ${getPlatformLabel(platform)}. Réessayez.`,
          ),
        );
      }
    },
    [connectMutation, workspaceId],
  );

  return { connect, connectingPlatform };
}

/** Déconnexion et actualisation des comptes (Paramètres) */
export function useSocialAccountActions(workspaceId) {
  const [disconnectMutation, { loading: disconnecting }] = useMutation(
    DISCONNECT_SOCIAL_ACCOUNT,
    {
      refetchQueries: ["GetSocialPublishingStatus"],
      awaitRefetchQueries: true,
    },
  );
  const [refreshMutation, { loading: refreshing }] = useMutation(
    REFRESH_SOCIAL_ACCOUNTS,
    {
      refetchQueries: ["GetSocialPublishingStatus"],
      awaitRefetchQueries: true,
    },
  );

  const disconnect = useCallback(
    async (account) => {
      try {
        await disconnectMutation({
          variables: { accountId: account.id, workspaceId },
        });
        toast.success(
          `Compte ${getPlatformLabel(account.platform)} déconnecté`,
        );
        return true;
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Impossible de déconnecter ce compte."),
        );
        return false;
      }
    },
    [disconnectMutation, workspaceId],
  );

  const refresh = useCallback(async () => {
    try {
      await refreshMutation({ variables: { workspaceId } });
      toast.success("Comptes actualisés");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Impossible d'actualiser les comptes."),
      );
    }
  }, [refreshMutation, workspaceId]);

  return { disconnect, refresh, disconnecting, refreshing };
}

/**
 * Posts du tableau. Rafraîchis toutes les 60 s seulement quand une
 * publication approche ou est en cours.
 */
export function useBoardSocialPosts({ boardId, workspaceId, enabled }) {
  const { data, refetch, startPolling, stopPolling } = useQuery(
    GET_BOARD_SOCIAL_POSTS,
    {
      variables: { boardId, workspaceId },
      skip: !enabled || !boardId || !workspaceId,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      errorPolicy: "all",
      context: { skipErrorToast: true },
      notifyOnNetworkStatusChange: false,
    },
  );
  const posts = data?.boardSocialPosts || EMPTY;
  return { posts, refetch, startPolling, stopPolling };
}

/** Faut-il activer le rafraîchissement périodique ? (réexport pour la page) */
export { shouldPollSocialPosts, POLL_INTERVAL_MS };

/** Réglages TikTok du compte (visibilités permises, commentaires, quota) */
export function useTikTokCreatorInfo(accountId, workspaceId) {
  const { data, loading, error, refetch } = useQuery(GET_TIKTOK_CREATOR_INFO, {
    variables: { accountId, workspaceId },
    skip: !accountId || !workspaceId,
    fetchPolicy: "network-only",
    errorPolicy: "all",
    context: { skipErrorToast: true },
  });
  return {
    info: data?.tiktokCreatorInfo || null,
    loading,
    error,
    refetch,
  };
}

/**
 * Ajoute la carte créée par scheduleSocialPost au cache du tableau, comme
 * createTask (useKanbanTasks) : décale les cartes de la colonne, ignore une
 * carte déjà arrivée par le temps réel.
 */
export function insertTaskInBoardCache(cache, { boardId, workspaceId, task }) {
  if (!task) return;
  try {
    const cacheData = cache.readQuery({
      query: GET_BOARD,
      variables: { id: boardId, workspaceId },
    });
    if (!cacheData?.board) return;
    const tasks = cacheData.board.tasks || [];
    if (tasks.some((t) => t.id === task.id)) return;
    const shifted = tasks.map((t) =>
      t.columnId === task.columnId &&
      t.position !== undefined &&
      t.position >= (task.position ?? 0)
        ? { ...t, position: t.position + 1 }
        : t,
    );
    cache.writeQuery({
      query: GET_BOARD,
      variables: { id: boardId, workspaceId },
      data: { board: { ...cacheData.board, tasks: [task, ...shifted] } },
    });
  } catch (error) {
    console.error("[SocialPost] Ajout de la carte au cache impossible:", error);
  }
}

function addPostToBoardCache(cache, { boardId, workspaceId, post }) {
  if (!post) return;
  try {
    const variables = { boardId, workspaceId };
    const existing = cache.readQuery({
      query: GET_BOARD_SOCIAL_POSTS,
      variables,
    });
    const posts = existing?.boardSocialPosts || [];
    if (posts.some((p) => p.id === post.id)) return;
    cache.writeQuery({
      query: GET_BOARD_SOCIAL_POSTS,
      variables,
      data: { boardSocialPosts: [post, ...posts] },
    });
  } catch {
    // Liste pas encore chargée : elle arrivera complète du serveur
  }
}

/** Création, modification, annulation, nouvel essai et téléversement */
export function useSocialPostMutations({ boardId, workspaceId }) {
  const [scheduleMutation, { loading: scheduling }] = useMutation(
    SCHEDULE_SOCIAL_POST,
    {
      // Compteur de posts X du mois
      refetchQueries: ["GetSocialPublishingStatus"],
      update(cache, { data }) {
        const payload = data?.scheduleSocialPost;
        if (!payload) return;
        insertTaskInBoardCache(cache, {
          boardId,
          workspaceId,
          task: payload.task,
        });
        addPostToBoardCache(cache, {
          boardId,
          workspaceId,
          post: payload.post,
        });
      },
    },
  );
  const refetchStatus = { refetchQueries: ["GetSocialPublishingStatus"] };
  const [updateMutation, { loading: updating }] = useMutation(
    UPDATE_SOCIAL_POST,
    refetchStatus,
  );
  const [cancelMutation, { loading: cancelling }] = useMutation(
    CANCEL_SOCIAL_POST,
    refetchStatus,
  );
  const [retryMutation, { loading: retrying }] = useMutation(
    RETRY_SOCIAL_POST,
    refetchStatus,
  );
  const [uploadMutation] = useMutation(UPLOAD_SOCIAL_POST_MEDIA);

  const schedule = useCallback(
    async (input) => {
      const { data } = await scheduleMutation({
        variables: { input: { boardId, ...input }, workspaceId },
      });
      return data?.scheduleSocialPost || null;
    },
    [scheduleMutation, boardId, workspaceId],
  );

  const update = useCallback(
    async (id, input) => {
      const { data } = await updateMutation({
        variables: { id, input, workspaceId },
      });
      return data?.updateSocialPost || null;
    },
    [updateMutation, workspaceId],
  );

  const cancel = useCallback(
    async (id) => {
      const { data } = await cancelMutation({
        variables: { id, workspaceId },
      });
      return data?.cancelSocialPost || null;
    },
    [cancelMutation, workspaceId],
  );

  const retry = useCallback(
    async (id) => {
      const { data } = await retryMutation({ variables: { id, workspaceId } });
      return data?.retrySocialPost || null;
    },
    [retryMutation, workspaceId],
  );

  const upload = useCallback(
    async (file) => {
      const { data } = await uploadMutation({
        variables: { file, workspaceId },
      });
      return data?.uploadSocialPostMedia || null;
    },
    [uploadMutation, workspaceId],
  );

  return {
    schedule,
    update,
    cancel,
    retry,
    upload,
    scheduling,
    updating,
    cancelling,
    retrying,
  };
}
