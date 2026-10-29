import { useRef } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_CALENDAR_LINKED_ITEMS,
  GET_CALENDAR_OVERDUE_ITEMS,
} from "@/src/graphql/queries/calendarLinkedItems";
import { useWorkspace } from "@/src/hooks/useWorkspace";

const EMPTY = [];

/**
 * Échéances des autres pages sur la période [from, to] (AAAA-MM-JJ).
 *
 * cache-and-network : une période déjà vue s'affiche aussitôt puis se met
 * à jour (une facture payée entre-temps passe en « payée »). Pendant le
 * chargement d'une nouvelle période, les éléments de la précédente restent
 * affichés plutôt que de faire clignoter la grille.
 */
export function useCalendarLinkedItems({ from, to, skip = false }) {
  const { workspaceId } = useWorkspace();

  const { data, loading, error, refetch } = useQuery(
    GET_CALENDAR_LINKED_ITEMS,
    {
      variables: { workspaceId, from, to },
      skip: skip || !workspaceId || !from || !to,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      errorPolicy: "all",
    },
  );

  // Dernière réponse reçue, gardée pendant le chargement de la période
  // suivante ; jamais celle d'un autre espace
  const lastRef = useRef(null);
  if (data?.calendarLinkedItems) {
    lastRef.current = { workspaceId, result: data.calendarLinkedItems };
  }
  const result =
    data?.calendarLinkedItems ||
    (lastRef.current?.workspaceId === workspaceId
      ? lastRef.current.result
      : null);

  return {
    items: result?.items || EMPTY,
    kinds: result?.kinds || EMPTY,
    truncated: !!result?.truncated,
    // Source Fiscal : informations légales manquantes (null sans la source)
    fiscalSetup: result?.fiscalSetup || null,
    // Vrai tant que la période affichée n'a pas encore ses propres données
    loading: loading && !data?.calendarLinkedItems,
    // Requête en échec (API pas encore à jour…) : le calendrier garde ses
    // échéances de factures enregistrées comme événements
    unavailable: !!error && !result,
    refetch,
  };
}

/**
 * Tout ce qui est en retard, quelle que soit la date : factures à encaisser
 * et à payer, devis expirés sans réponse, tâches et livraisons. Requête en
 * échec (API pas encore à jour) : liste vide, le bouton ne s'affiche pas.
 */
export function useCalendarOverdueItems({ skip = false } = {}) {
  const { workspaceId } = useWorkspace();

  const { data } = useQuery(GET_CALENDAR_OVERDUE_ITEMS, {
    variables: { workspaceId },
    skip: skip || !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
  });

  return {
    items: data?.calendarOverdueItems?.items || EMPTY,
    truncated: !!data?.calendarOverdueItems?.truncated,
  };
}
