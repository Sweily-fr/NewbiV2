"use client";

import { useCallback, useMemo, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import {
  CANCEL_SOCIAL_POST,
  COMPLETE_SOCIAL_VIDEO_UPLOAD,
  CONNECT_SOCIAL_ACCOUNT,
  DISCONNECT_SOCIAL_ACCOUNT,
  GET_BOARD_SOCIAL_POSTS,
  GET_SOCIAL_POST_MEDIA,
  GET_SOCIAL_PUBLISHING_STATUS,
  GET_SOCIAL_TRENDING_SOUNDS,
  GET_TIKTOK_CREATOR_INFO,
  REFRESH_SOCIAL_ACCOUNTS,
  RETRY_SOCIAL_POST,
  SCHEDULE_SOCIAL_POST,
  START_SOCIAL_VIDEO_UPLOAD,
  UPDATE_SOCIAL_POST,
  UPLOAD_SOCIAL_POST_MEDIA,
  UPLOAD_SOCIAL_VIDEO_CHUNK,
} from "@/src/graphql/socialPublishingQueries";
import { GET_BOARD } from "@/src/graphql/kanbanQueries";
import { throwIfMutationErrors } from "@/src/graphql/mutationErrors";
import {
  SOCIAL_PLATFORMS,
  getConnectorLabel,
  getPlatformLabel,
  normalizeConnectors,
  shouldPollSocialPosts,
} from "@/src/utils/social-post-rules";
import { uploadSocialVideo } from "@/src/utils/social-video-upload";

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
  return useMemo(() => {
    // Réseaux connectables par l'espace (fournisseur configuré côté API)
    const platforms = Array.isArray(status?.platforms)
      ? status.platforms
      : SOCIAL_PLATFORMS;
    return {
      enabled: !!status?.enabled,
      canManageAccounts: !!status?.canManageAccounts,
      canSchedule: !!status?.canSchedule,
      accounts: status?.accounts || EMPTY,
      platforms,
      // Façons de connecter chaque réseau (« Instagram », « Instagram via
      // Facebook »…), une par réseau si l'API ne les donne pas
      connectors: normalizeConnectors(status?.connectors, platforms),
      xPostQuota: status?.xPostQuota || null,
      loaded: !!status || (!loading && !!error),
      loading,
      error,
      refetch,
    };
  }, [status, loading, error, refetch]);
}

/**
 * Lance la connexion d'un réseau : l'API renvoie l'adresse d'autorisation,
 * le navigateur y part et revient sur `returnTo` (?social_connected=…).
 * `connector` : clé d'un SocialConnector (« instagram_facebook »…), absente
 * pour la connexion habituelle du réseau. `connecting` : clé (ou réseau) en
 * cours de connexion.
 */
export function useConnectSocialAccount(workspaceId) {
  const [connectMutation] = useMutation(CONNECT_SOCIAL_ACCOUNT);
  const [connecting, setConnecting] = useState(null);

  const connect = useCallback(
    async (platform, returnTo, { connector, beforeRedirect } = {}) => {
      if (!platform) return;
      setConnecting(connector || platform);
      try {
        const result = await connectMutation({
          variables: {
            platform,
            ...(connector ? { connector } : {}),
            returnTo,
            workspaceId,
          },
        });
        throwIfMutationErrors(result);
        const url = result?.data?.connectSocialAccount;
        if (!url) throw new Error("Adresse de connexion absente");
        beforeRedirect?.();
        window.location.href = url;
        // On garde l'indicateur : la page va changer
      } catch (error) {
        setConnecting(null);
        toast.error(
          getApiErrorMessage(
            error,
            `Impossible de lancer la connexion à ${getConnectorLabel(connector || platform)}. Réessayez.`,
          ),
        );
      }
    },
    [connectMutation, workspaceId],
  );

  return { connect, connecting };
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
        throwIfMutationErrors(
          await disconnectMutation({
            variables: { accountId: account.id, workspaceId },
          }),
        );
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
      throwIfMutationErrors(
        await refreshMutation({ variables: { workspaceId } }),
      );
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

/**
 * Sons proposés pour un compte (Instagram via Facebook ou TikTok Business) :
 * tendances sans `search`, recherche par mot pour Instagram (`kind` "music"
 * ou "original_sound"). Gardés en cache par (compte, kind, search).
 */
export function useSocialTrendingSounds({
  accountId,
  workspaceId,
  search,
  kind,
  skip = false,
}) {
  const { data, loading, error, refetch } = useQuery(
    GET_SOCIAL_TRENDING_SOUNDS,
    {
      variables: {
        accountId,
        ...(search ? { search } : {}),
        ...(kind ? { kind } : {}),
        workspaceId,
      },
      skip: skip || !accountId || !workspaceId,
      fetchPolicy: "cache-first",
      errorPolicy: "all",
      context: { skipErrorToast: true },
      notifyOnNetworkStatusChange: true,
    },
  );
  return {
    sounds: data?.socialTrendingSounds || EMPTY,
    loaded: !!data?.socialTrendingSounds,
    loading,
    error,
    refetch,
  };
}

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
  const [startVideoMutation] = useMutation(START_SOCIAL_VIDEO_UPLOAD);
  const [uploadChunkMutation] = useMutation(UPLOAD_SOCIAL_VIDEO_CHUNK);
  const [completeVideoMutation] = useMutation(COMPLETE_SOCIAL_VIDEO_UPLOAD);
  const client = useApolloClient();

  // Refus de l'API relancés : avec errorPolicy "all" (défaut des mutations
  // dans apolloClient.js), ils arrivaient en résultat vide, sans message
  const schedule = useCallback(
    async (input) => {
      const result = await scheduleMutation({
        variables: { input: { boardId, ...input }, workspaceId },
      });
      throwIfMutationErrors(result);
      return result?.data?.scheduleSocialPost || null;
    },
    [scheduleMutation, boardId, workspaceId],
  );

  const update = useCallback(
    async (id, input) => {
      const result = await updateMutation({
        variables: { id, input, workspaceId },
      });
      throwIfMutationErrors(result);
      return result?.data?.updateSocialPost || null;
    },
    [updateMutation, workspaceId],
  );

  const cancel = useCallback(
    async (id) => {
      const result = await cancelMutation({
        variables: { id, workspaceId },
      });
      throwIfMutationErrors(result);
      return result?.data?.cancelSocialPost || null;
    },
    [cancelMutation, workspaceId],
  );

  const retry = useCallback(
    async (id) => {
      const result = await retryMutation({ variables: { id, workspaceId } });
      throwIfMutationErrors(result);
      return result?.data?.retrySocialPost || null;
    },
    [retryMutation, workspaceId],
  );

  const upload = useCallback(
    async (file) => {
      const result = await uploadMutation({
        variables: { file, workspaceId },
      });
      throwIfMutationErrors(result);
      return result?.data?.uploadSocialPostMedia || null;
    },
    [uploadMutation, workspaceId],
  );

  /**
   * Vidéo : envoi en morceaux puis attente de la préparation. Les erreurs
   * sont gérées par la fenêtre (pas de toast global, nouveaux essais
   * compris). Renvoie le média prêt ; rejette avec AbortError si `signal`
   * est annulé.
   */
  const uploadVideo = useCallback(
    (file, { signal, onProgress, onMedia } = {}) => {
      const context = (abortSignal) => ({
        skipErrorToast: true,
        ...(abortSignal ? { fetchOptions: { signal: abortSignal } } : {}),
      });
      return uploadSocialVideo(
        file,
        {
          start: async ({ fileName, size, contentType, signal: s }) => {
            const { data } = await startVideoMutation({
              variables: { fileName, size, contentType, workspaceId },
              context: context(s),
            });
            return data?.startSocialVideoUpload || null;
          },
          uploadChunk: async ({ mediaId, index, chunk, signal: s }) => {
            const { data } = await uploadChunkMutation({
              variables: { mediaId, index, chunk, workspaceId },
              context: context(s),
            });
            if (data?.uploadSocialVideoChunk !== true) {
              throw new Error("Morceau refusé");
            }
            return true;
          },
          complete: async ({ mediaId, signal: s }) => {
            const { data } = await completeVideoMutation({
              variables: { mediaId, workspaceId },
              context: context(s),
            });
            return data?.completeSocialVideoUpload || null;
          },
          fetchMedia: async ({ mediaId, signal: s }) => {
            const { data } = await client.query({
              query: GET_SOCIAL_POST_MEDIA,
              variables: { id: mediaId, workspaceId },
              fetchPolicy: "network-only",
              context: context(s),
            });
            return data?.socialPostMedia || null;
          },
        },
        { signal, onProgress, onMedia },
      );
    },
    [
      startVideoMutation,
      uploadChunkMutation,
      completeVideoMutation,
      client,
      workspaceId,
    ],
  );

  return {
    schedule,
    update,
    cancel,
    retry,
    upload,
    uploadVideo,
    scheduling,
    updating,
    cancelling,
    retrying,
  };
}
