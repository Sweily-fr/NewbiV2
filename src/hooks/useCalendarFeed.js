import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import {
  GET_CALENDAR_FEED_LINK,
  GET_CALENDAR_WEEKLY_DIGEST,
} from "@/src/graphql/queries/calendarFeed";
import {
  DISABLE_CALENDAR_FEED_LINK,
  REGENERATE_CALENDAR_FEED_LINK,
  SET_CALENDAR_WEEKLY_DIGEST,
} from "@/src/graphql/mutations/calendarFeed";
import { useWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Lien d'abonnement au calendrier de l'espace actif : état, création ou
 * régénération, désactivation. `skip` tant que la fenêtre est fermée.
 */
export function useCalendarFeedLink({ skip = false } = {}) {
  const { workspaceId } = useWorkspace();
  const variables = { workspaceId };

  const { data, loading, error } = useQuery(GET_CALENDAR_FEED_LINK, {
    variables,
    skip: skip || !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  // Réponse des mutations écrite à la place de l'état lu
  const writeLink = (cache, link) => {
    if (!link) return;
    cache.writeQuery({
      query: GET_CALENDAR_FEED_LINK,
      variables,
      data: { calendarFeedLink: link },
    });
  };

  const [regenerateMutation, { loading: regenerating }] = useMutation(
    REGENERATE_CALENDAR_FEED_LINK,
    {
      variables,
      update: (cache, { data: result }) =>
        writeLink(cache, result?.regenerateCalendarFeedLink),
    },
  );
  const [disableMutation, { loading: disabling }] = useMutation(
    DISABLE_CALENDAR_FEED_LINK,
    {
      variables,
      update: (cache, { data: result }) =>
        writeLink(cache, result?.disableCalendarFeedLink),
    },
  );

  const regenerate = useCallback(async () => {
    try {
      const { data: result } = await regenerateMutation();
      return result?.regenerateCalendarFeedLink || null;
    } catch (mutationError) {
      toast.error("Le lien n'a pas pu être créé", {
        description: mutationError.message,
      });
      return null;
    }
  }, [regenerateMutation]);

  const disable = useCallback(async () => {
    try {
      await disableMutation();
      return true;
    } catch (mutationError) {
      toast.error("Le lien n'a pas pu être désactivé", {
        description: mutationError.message,
      });
      return false;
    }
  }, [disableMutation]);

  return {
    link: data?.calendarFeedLink || null,
    loading: loading && !data,
    error,
    regenerate,
    disable,
    busy: regenerating || disabling,
  };
}

/**
 * Récap du lundi par e-mail. Lu à part des autres préférences : tant que
 * l'API ne connaît pas encore ce réglage, l'interrupteur reste masqué
 * (`available` faux) sans message d'erreur.
 */
export function useCalendarWeeklyDigest({ skip = false } = {}) {
  const { data, loading } = useQuery(GET_CALENDAR_WEEKLY_DIGEST, {
    skip,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    context: { skipErrorToast: true },
  });

  const [setMutation, { loading: saving }] = useMutation(
    SET_CALENDAR_WEEKLY_DIGEST,
    {
      update: (cache, { data: result }) => {
        if (typeof result?.setCalendarWeeklyDigest !== "boolean") return;
        cache.writeQuery({
          query: GET_CALENDAR_WEEKLY_DIGEST,
          data: { calendarWeeklyDigest: result.setCalendarWeeklyDigest },
        });
      },
    },
  );

  const setEnabled = useCallback(
    async (enabled) => {
      try {
        await setMutation({
          variables: { enabled },
          optimisticResponse: { setCalendarWeeklyDigest: enabled },
        });
        toast.success(
          enabled ? "Récap du lundi activé" : "Récap du lundi désactivé",
        );
      } catch (mutationError) {
        toast.error("La préférence n'a pas pu être enregistrée", {
          description: mutationError.message,
        });
      }
    },
    [setMutation],
  );

  const value = data?.calendarWeeklyDigest;
  return {
    enabled: value === true,
    available: typeof value === "boolean",
    loading: loading && typeof value !== "boolean",
    saving,
    setEnabled,
  };
}
