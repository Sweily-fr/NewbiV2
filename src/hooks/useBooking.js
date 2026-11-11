"use client";

import { useCallback, useEffect, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
  BOOKING_SLUG_AVAILABLE,
  GET_APPOINTMENT_TYPES,
  GET_BOOKING,
  GET_BOOKINGS,
  GET_MY_BOOKING_PAGE,
} from "@/src/graphql/queries/booking";
import {
  CANCEL_BOOKING,
  CREATE_APPOINTMENT_TYPE,
  DELETE_APPOINTMENT_TYPE,
  UPDATE_APPOINTMENT_TYPE,
  UPSERT_BOOKING_PAGE,
} from "@/src/graphql/mutations/booking";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { bookingListVariables, isValidBookingSlug } from "@/src/utils/booking";

const EMPTY = [];

/** Fragments qui trahissent un message technique, jamais affichés. */
const TECHNICAL =
  /ValidationError|Path `|Cast to |Cannot read propert|is not a function|\bundefined\b|E11000|Error:/;

/**
 * Message d'un refus de l'API, pour l'utilisateur : les erreurs métier de la
 * prise de rendez-vous sont rédigées en français par l'API (adresse prise,
 * plages invalides, lieu incohérent…).
 */
export function bookingErrorMessage(
  error,
  fallback = "Une erreur est survenue. Réessayez.",
) {
  const graphQLError = error?.graphQLErrors?.[0];
  const code = graphQLError?.extensions?.code;
  if (code === "FORBIDDEN") {
    return "Votre rôle ne permet pas cette action. Demandez à un administrateur de l'espace.";
  }
  const message = graphQLError?.message || "";
  if (message && !TECHNICAL.test(message)) return message;
  if (error?.networkError)
    return "Connexion impossible. Vérifiez votre réseau.";
  return fallback;
}

/** Page de réservation de l'utilisateur dans l'espace actif (null = pas encore créée). */
export function useMyBookingPage({ skip = false } = {}) {
  const { workspaceId } = useWorkspace();
  const { data, loading, error, refetch } = useQuery(GET_MY_BOOKING_PAGE, {
    variables: { workspaceId },
    skip: skip || !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  return {
    page: data?.myBookingPage || null,
    // Réponse reçue (page ou null) : distingue « pas de page » du chargement
    loaded: data !== undefined,
    loading: loading && data === undefined,
    error,
    refetch,
  };
}

export function useAppointmentTypes({ skip = false } = {}) {
  const { workspaceId } = useWorkspace();
  const { data, loading, error, refetch } = useQuery(GET_APPOINTMENT_TYPES, {
    variables: { workspaceId },
    skip: skip || !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  const types = data?.appointmentTypes || EMPTY;
  return {
    types,
    loading: loading && !data,
    error,
    refetch,
  };
}

/**
 * Réservations d'un onglet : à venir, passées ou annulées.
 */
export function useBookings(
  tab,
  { limit = 50, offset = 0, skip = false } = {},
) {
  const { workspaceId } = useWorkspace();
  const { data, loading, error, refetch } = useQuery(GET_BOOKINGS, {
    variables: { workspaceId, ...bookingListVariables(tab), limit, offset },
    skip: skip || !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  return {
    bookings: data?.bookings?.items || EMPTY,
    totalCount: data?.bookings?.totalCount || 0,
    loading: loading && !data,
    error,
    refetch,
  };
}

/** Une réservation par son identifiant (fiche ouverte depuis un lien). */
export function useBooking(id, { skip = false } = {}) {
  const { workspaceId } = useWorkspace();
  const { data, loading, error } = useQuery(GET_BOOKING, {
    variables: { id, workspaceId },
    skip: skip || !workspaceId || !id,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  return {
    booking: data?.booking || null,
    loading: loading && !data,
    error,
  };
}

/**
 * Réservation liée à un événement du Calendrier (fiche « Rendez-vous ») :
 * par `bookingId` porté par l'événement ; à défaut, cherchée parmi les
 * réservations confirmées à venir ou passées par `eventId`.
 */
export function useBookingForEvent(event, { skip = false } = {}) {
  const { workspaceId } = useWorkspace();
  const eventId = event?.id || null;
  const bookingId = event?.bookingId || null;
  const direct = useBooking(bookingId, { skip: skip || !bookingId });
  const upcoming = event?.end ? new Date(event.end) >= new Date() : true;
  const { data, loading, error } = useQuery(GET_BOOKINGS, {
    variables: {
      workspaceId,
      scope: upcoming ? "upcoming" : "past",
      status: "CONFIRMED",
      limit: 100,
      offset: 0,
    },
    skip: skip || Boolean(bookingId) || !workspaceId || !eventId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  if (bookingId) return direct;
  const booking =
    (data?.bookings?.items || EMPTY).find((item) => item.eventId === eventId) ||
    null;
  return { booking, loading: loading && !data, error };
}

/**
 * Disponibilité d'une adresse de page, vérifiée par l'API après une courte
 * pause de saisie. `status` : idle | invalid | checking | available | taken
 * | error. L'adresse actuelle de la page est toujours « disponible ».
 */
export function useBookingSlugAvailability(slug, { currentSlug = null } = {}) {
  const client = useApolloClient();
  const { workspaceId } = useWorkspace();
  const [state, setState] = useState({ slug: null, status: "idle" });

  useEffect(() => {
    if (!slug) {
      setState({ slug, status: "idle" });
      return undefined;
    }
    if (!isValidBookingSlug(slug)) {
      setState({ slug, status: "invalid" });
      return undefined;
    }
    if (slug === currentSlug) {
      setState({ slug, status: "available" });
      return undefined;
    }
    let cancelled = false;
    setState({ slug, status: "checking" });
    const timer = setTimeout(async () => {
      try {
        const { data } = await client.query({
          query: BOOKING_SLUG_AVAILABLE,
          variables: { slug, workspaceId },
          fetchPolicy: "network-only",
        });
        if (!cancelled) {
          setState({
            slug,
            status: data?.bookingSlugAvailable ? "available" : "taken",
          });
        }
      } catch {
        if (!cancelled) setState({ slug, status: "error" });
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, currentSlug, client, workspaceId]);

  return state.slug === slug ? state.status : "checking";
}

/**
 * Mutations de la prise de rendez-vous. Toutes en errorPolicy « none » : un
 * refus de l'API (rôle, adresse prise, lieu incohérent…) fait échouer la
 * promesse au lieu de passer pour une réussite.
 */
export function useBookingMutations() {
  const { workspaceId } = useWorkspace();
  const strict = { errorPolicy: "none" };

  const [upsertPageMutation, { loading: savingPage }] = useMutation(
    UPSERT_BOOKING_PAGE,
    {
      ...strict,
      update(cache, { data }) {
        const page = data?.upsertBookingPage;
        if (!page) return;
        cache.writeQuery({
          query: GET_MY_BOOKING_PAGE,
          variables: { workspaceId },
          data: { myBookingPage: page },
        });
      },
    },
  );
  const [createTypeMutation, { loading: creatingType }] = useMutation(
    CREATE_APPOINTMENT_TYPE,
    {
      ...strict,
      refetchQueries: [
        { query: GET_APPOINTMENT_TYPES, variables: { workspaceId } },
      ],
      awaitRefetchQueries: true,
    },
  );
  const [updateTypeMutation, { loading: updatingType }] = useMutation(
    UPDATE_APPOINTMENT_TYPE,
    strict,
  );
  const [deleteTypeMutation, { loading: deletingType }] = useMutation(
    DELETE_APPOINTMENT_TYPE,
    {
      ...strict,
      refetchQueries: [
        { query: GET_APPOINTMENT_TYPES, variables: { workspaceId } },
      ],
      awaitRefetchQueries: true,
    },
  );
  const [cancelBookingMutation, { loading: cancellingBooking }] = useMutation(
    CANCEL_BOOKING,
    {
      ...strict,
      // La réservation change d'onglet (À venir → Annulées) et le compteur
      // de son type baisse
      refetchQueries: ["Bookings", "AppointmentTypes"],
    },
  );

  const upsertPage = useCallback(
    async (input, { isCreation = false } = {}) => {
      const { data } = await upsertPageMutation({
        variables: { workspaceId, input },
        // Création : l'API ajoute un type par défaut
        refetchQueries: isCreation
          ? [{ query: GET_APPOINTMENT_TYPES, variables: { workspaceId } }]
          : [],
      });
      return data?.upsertBookingPage || null;
    },
    [upsertPageMutation, workspaceId],
  );

  const createType = useCallback(
    async (input) => {
      const { data } = await createTypeMutation({
        variables: { workspaceId, input },
      });
      return data?.createAppointmentType || null;
    },
    [createTypeMutation, workspaceId],
  );

  const updateType = useCallback(
    async (id, input) => {
      const { data } = await updateTypeMutation({
        variables: { id, workspaceId, input },
      });
      return data?.updateAppointmentType || null;
    },
    [updateTypeMutation, workspaceId],
  );

  const deleteType = useCallback(
    async (id) => {
      const { data } = await deleteTypeMutation({
        variables: { id, workspaceId },
      });
      return Boolean(data?.deleteAppointmentType);
    },
    [deleteTypeMutation, workspaceId],
  );

  const cancelBooking = useCallback(
    async (id, reason) => {
      const { data } = await cancelBookingMutation({
        variables: { id, workspaceId, reason: reason?.trim() || null },
      });
      return data?.cancelBooking || null;
    },
    [cancelBookingMutation, workspaceId],
  );

  return {
    upsertPage,
    createType,
    updateType,
    deleteType,
    cancelBooking,
    savingPage,
    creatingType,
    updatingType,
    deletingType,
    cancellingBooking,
  };
}
