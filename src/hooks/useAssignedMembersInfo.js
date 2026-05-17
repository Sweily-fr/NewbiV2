import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";

// Query pour récupérer les infos complètes des utilisateurs
const GET_USERS_INFO = gql`
  query GetUsersInfo($userIds: [String!]!) {
    usersInfo(userIds: $userIds) {
      id
      name
      email
      image
    }
  }
`;

/**
 * Contexte de lookup synchrone partagé au niveau d'une page (ex: kanban).
 * Quand il est fourni, `useAssignedMembersInfo` lit les infos sans déclencher
 * une nouvelle requête Apollo par instance — ce qui évite des centaines de
 * useQuery (un par TaskCard) qui s'abonnent au cache et re-rendent à chaque
 * notification.
 */
export const BoardMembersLookupContext = createContext(null);

/**
 * Provider à monter au niveau du board kanban. Charge toutes les infos
 * utilisateurs nécessaires en une seule requête et expose une Map id → user.
 */
export function BoardMembersLookupProvider({ userIds, children }) {
  // Dédupliquer + trier pour avoir une clé stable et éviter des refetch inutiles
  const stableIds = useMemo(() => {
    const set = new Set();
    (userIds || []).forEach((id) => {
      if (id) set.add(String(id));
    });
    return Array.from(set).sort();
  }, [userIds]);

  const { data } = useQuery(GET_USERS_INFO, {
    variables: { userIds: stableIds },
    skip: stableIds.length === 0,
    fetchPolicy: "cache-first",
  });

  const lookup = useMemo(() => {
    const map = new Map();
    (data?.usersInfo || []).forEach((u) => {
      if (u?.id) map.set(String(u.id), u);
    });
    return map;
  }, [data]);

  return (
    <BoardMembersLookupContext.Provider value={lookup}>
      {children}
    </BoardMembersLookupContext.Provider>
  );
}

/**
 * Hook pour récupérer les infos complètes des utilisateurs assignés.
 *
 * Fast path : si un BoardMembersLookupProvider parent est présent, lit depuis
 * la Map (synchrone, pas de useQuery → pas d'abonnement Apollo par instance).
 *
 * Fallback : useQuery individuelle (comportement historique pour les usages
 * hors page kanban).
 *
 * @param {Array} assignedMembers - Tableau simple d'IDs utilisateurs
 * @returns {Object} { members, loading, error }
 */
export function useAssignedMembersInfo(assignedMembers = []) {
  const lookup = useContext(BoardMembersLookupContext);
  const userIds = (assignedMembers || []).filter(Boolean).map(String);

  const { data, loading, error } = useQuery(GET_USERS_INFO, {
    variables: { userIds: userIds.length > 0 ? userIds : [] },
    skip: !!lookup, // Si lookup partagé dispo, pas de query individuelle
    fetchPolicy: "cache-first",
  });

  const members = useMemo(() => {
    if (lookup) {
      const out = [];
      for (const id of userIds) {
        const u = lookup.get(id);
        if (u) out.push(u);
      }
      return out;
    }
    return data?.usersInfo || [];
    // userIds est recréé à chaque render — on dépend de assignedMembers à la place
    // pour éviter une boucle infinie ; le contenu fonctionnel est équivalent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookup, data, assignedMembers]);

  return { members, loading: lookup ? false : loading, error };
}
