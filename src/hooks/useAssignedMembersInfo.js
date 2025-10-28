import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

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
 * Hook pour récupérer les infos complètes des utilisateurs assignés
 * @param {Array} assignedMembers - Tableau simple d'IDs utilisateurs
 * @returns {Object} { members, loading, error }
 */
export function useAssignedMembersInfo(assignedMembers = []) {
  const userIds = assignedMembers.filter(Boolean);

  const { data, loading, error } = useQuery(GET_USERS_INFO, {
    variables: { userIds: userIds.length > 0 ? userIds : [] },
    skip: false, // Ne pas skip, même si userIds est vide
  });

  const members = data?.usersInfo || [];

  return { members, loading, error };
}
