"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
  BOOKING_SLUG_AVAILABLE,
  GET_APPOINTMENT_TYPES,
  GET_EVENT_PAYMENT_METHODS,
  GET_EVENT_REGISTRATIONS,
  GET_EVENT_REGISTRATIONS_CSV,
  GET_BOOKING,
  GET_BOOKINGS,
  GET_MY_BOOKING_PAGE,
} from "@/src/graphql/queries/booking";
import {
  CANCEL_BOOKING,
  CANCEL_EVENT_REGISTRATION,
  CHECK_IN_TICKET,
  CREATE_APPOINTMENT_TYPE,
  DELETE_APPOINTMENT_TYPE,
  UNDO_TICKET_CHECK_IN,
  UPDATE_APPOINTMENT_TYPE,
  UPLOAD_APPOINTMENT_EVENT_IMAGE,
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

// Réservations prises par les invités pendant que la page est ouverte :
// relues au retour sur l'onglet du navigateur (au plus toutes les 30 s) et
// toutes les minutes tant que l'onglet est visible.
const VISIBLE_REFRESH_MIN_MS = 30 * 1000;
const BOOKINGS_POLL_MS = 60 * 1000;
const tabHidden = () =>
  typeof document !== "undefined" && document.visibilityState === "hidden";

function useRefetchWhenVisible(refetch, skip) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  useEffect(() => {
    if (skip || typeof document === "undefined") return undefined;
    let last = Date.now();
    const onVisible = () => {
      if (tabHidden() || Date.now() - last < VISIBLE_REFRESH_MIN_MS) return;
      last = Date.now();
      refetchRef.current?.().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [skip]);
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
  // Compteur « à venir » de chaque type
  useRefetchWhenVisible(refetch, skip || !workspaceId);
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
    pollInterval: BOOKINGS_POLL_MS,
    skipPollAttempt: tabHidden,
  });
  useRefetchWhenVisible(refetch, skip || !workspaceId);
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
  // Création et suppression : la liste des types est corrigée dans le
  // cache dès la réponse (affichage immédiat, sans attendre de relecture),
  // puis relue en arrière-plan (position, compteurs calculés par l'API)
  const typesQuery = {
    query: GET_APPOINTMENT_TYPES,
    variables: { workspaceId },
  };
  const [createTypeMutation, { loading: creatingType }] = useMutation(
    CREATE_APPOINTMENT_TYPE,
    {
      ...strict,
      update(cache, { data }) {
        const created = data?.createAppointmentType;
        if (!created) return;
        cache.updateQuery(typesQuery, (existing) => {
          const list = existing?.appointmentTypes || [];
          if (list.some((type) => type.id === created.id)) return existing;
          return { appointmentTypes: [...list, created] };
        });
      },
      refetchQueries: ["AppointmentTypes"],
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
      update(cache, { data }, { variables }) {
        if (!data?.deleteAppointmentType) return;
        cache.updateQuery(typesQuery, (existing) =>
          existing
            ? {
                appointmentTypes: existing.appointmentTypes.filter(
                  (type) => type.id !== variables.id,
                ),
              }
            : existing,
        );
        cache.evict({
          id: cache.identify({
            __typename: "AppointmentType",
            id: variables.id,
          }),
        });
        cache.gc();
      },
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

// --- Billetterie ------------------------------------------------------------

/**
 * Inscrits d'un événement (recherche : nom, e-mail ou numéro de billet),
 * par pages de `pageSize` (200 au plus pour l'API) : `loadMore` ajoute la
 * page suivante (offset = nombre déjà chargé) tant qu'il en reste.
 */
export function useEventRegistrations(
  typeId,
  { search = "", status = null, pageSize = 50, skip = false } = {},
) {
  const { workspaceId } = useWorkspace();
  const [loadingMore, setLoadingMore] = useState(false);
  const { data, previousData, loading, error, refetch, fetchMore } = useQuery(
    GET_EVENT_REGISTRATIONS,
    {
      variables: {
        workspaceId,
        typeId,
        search: search.trim() || null,
        status: status || null,
        limit: Math.min(pageSize, 200),
        offset: 0,
      },
      skip: skip || !workspaceId || !typeId,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    },
  );
  // Pendant une nouvelle recherche, la liste précédente reste affichée
  const shown = data || previousData;
  const registrations = shown?.eventRegistrations?.items || EMPTY;
  const totalCount = shown?.eventRegistrations?.totalCount || 0;
  const hasMore = Boolean(data) && registrations.length < totalCount;

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: { offset: registrations.length },
        updateQuery(previous, { fetchMoreResult }) {
          const next = fetchMoreResult?.eventRegistrations;
          if (!next) return previous;
          const known = new Set(
            previous.eventRegistrations.items.map((item) => item.id),
          );
          return {
            eventRegistrations: {
              ...next,
              items: [
                ...previous.eventRegistrations.items,
                ...next.items.filter((item) => !known.has(item.id)),
              ],
            },
          };
        },
      });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, fetchMore, registrations.length]);

  return {
    registrations,
    totalCount,
    hasMore,
    loadMore,
    loadingMore,
    loading: loading && !shown,
    searching: loading && Boolean(shown) && !loadingMore,
    error,
    refetch,
  };
}

/** Moyens de paiement en ligne prêts pour vendre des billets. */
export function useEventPaymentMethods({ skip = false } = {}) {
  const { workspaceId } = useWorkspace();
  const { data, loading } = useQuery(GET_EVENT_PAYMENT_METHODS, {
    variables: { workspaceId },
    skip: skip || !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  return {
    methods: data?.eventPaymentMethods || EMPTY,
    loaded: data !== undefined,
    loading: loading && !data,
  };
}

/** Ajoute `delta` aux compteurs de présence d'un type et d'une inscription. */
function shiftCheckedIn(cache, { typeId, registrationId, delta }) {
  const add = (value) => Math.max(0, (Number(value) || 0) + delta);
  if (typeId) {
    cache.modify({
      id: cache.identify({ __typename: "AppointmentType", id: typeId }),
      fields: { checkedInCount: add },
    });
  }
  if (registrationId) {
    cache.modify({
      id: cache.identify({
        __typename: "EventRegistration",
        id: registrationId,
      }),
      fields: { checkedInCount: add },
    });
  }
}

/**
 * Mutations de la billetterie (errorPolicy « none ») : annulation, contrôle
 * des billets, envoi d'image, export. Le cache suit chaque réponse : statut,
 * présence et compteurs s'affichent sans rechargement.
 */
export function useEventMutations() {
  const client = useApolloClient();
  const { workspaceId } = useWorkspace();
  const strict = { errorPolicy: "none" };

  const [uploadImageMutation, { loading: uploadingImage }] = useMutation(
    UPLOAD_APPOINTMENT_EVENT_IMAGE,
    strict,
  );
  const [cancelMutation, { loading: cancellingRegistration }] = useMutation(
    CANCEL_EVENT_REGISTRATION,
    {
      ...strict,
      // Places rendues et nombre d'inscrits recalculés par l'API
      refetchQueries: ["AppointmentTypes"],
    },
  );
  const [checkInMutation, { loading: checkingIn }] = useMutation(
    CHECK_IN_TICKET,
    strict,
  );
  const [undoMutation, { loading: undoingCheckIn }] = useMutation(
    UNDO_TICKET_CHECK_IN,
    strict,
  );

  /** Fichier → URL publique, ou { error } (format, taille, réseau). */
  const uploadImage = useCallback(
    async (file, kind) => {
      try {
        const { data } = await uploadImageMutation({
          variables: { workspaceId, file, kind },
        });
        const result = data?.uploadAppointmentEventImage;
        if (!result?.success || !result.url) {
          return {
            error: result?.message || "L'image n'a pas pu être envoyée.",
          };
        }
        return { url: result.url };
      } catch (error) {
        return {
          error: bookingErrorMessage(error, "L'image n'a pas pu être envoyée."),
        };
      }
    },
    [uploadImageMutation, workspaceId],
  );

  const cancelRegistration = useCallback(
    async (id, reason) => {
      const { data } = await cancelMutation({
        variables: { id, workspaceId, reason: reason?.trim() || null },
      });
      return data?.cancelEventRegistration || null;
    },
    [cancelMutation, workspaceId],
  );

  /** Contrôle d'un billet ; VALID : compteurs de présence mis à jour. */
  const checkIn = useCallback(
    async (typeId, code) => {
      const { data } = await checkInMutation({
        variables: { workspaceId, typeId, code },
        update(cache, { data: result }) {
          if (result?.checkInTicket?.result !== "VALID") return;
          // L'inscription renvoyée porte déjà son compteur à jour
          shiftCheckedIn(cache, { typeId, delta: 1 });
        },
      });
      return data?.checkInTicket || null;
    },
    [checkInMutation, workspaceId],
  );

  const undoCheckIn = useCallback(
    async ({ ticketId, typeId, registrationId }) => {
      const { data } = await undoMutation({
        variables: { workspaceId, ticketId },
        update(cache, { data: result }) {
          if (!result?.undoTicketCheckIn) return;
          shiftCheckedIn(cache, { typeId, registrationId, delta: -1 });
        },
      });
      return data?.undoTicketCheckIn || null;
    },
    [undoMutation, workspaceId],
  );

  /** Texte CSV de l'export (une ligne par billet confirmé). */
  const fetchRegistrationsCsv = useCallback(
    async (typeId) => {
      const { data } = await client.query({
        query: GET_EVENT_REGISTRATIONS_CSV,
        variables: { workspaceId, typeId },
        fetchPolicy: "network-only",
        errorPolicy: "none",
      });
      return data?.eventRegistrationsCsv || "";
    },
    [client, workspaceId],
  );

  return {
    uploadImage,
    cancelRegistration,
    checkIn,
    undoCheckIn,
    fetchRegistrationsCsv,
    uploadingImage,
    cancellingRegistration,
    checkingIn,
    undoingCheckIn,
  };
}
