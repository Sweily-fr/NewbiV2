import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ORGANIZATION_MEMBERS } from '@/src/graphql/kanbanQueries';

export const useKanbanMemberFilter = (workspaceId) => {
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // Récupérer les membres de l'organisation avec cache-first pour éviter les requêtes réseau inutiles
  const { data, loading, error } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { workspaceId },
    skip: !workspaceId,
    // Utiliser cache-first pour éviter les requêtes réseau pendant le drag
    // La première requête ira au serveur, mais les suivantes utiliseront le cache
    fetchPolicy: 'cache-first',
    // Ne pas notifier sur les changements de statut réseau
    notifyOnNetworkStatusChange: false,
  });

  // Mémoriser les membres formatés pour éviter les re-calculs inutiles
  const members = useMemo(() => {
    if (data?.organizationMembers) {
      return data.organizationMembers.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        image: member.image || null,
        role: member.role,
      }));
    }
    return [];
  }, [data?.organizationMembers]);

  // Fonction pour filtrer les tâches selon le membre sélectionné (mémorisée)
  const filterTasksByMember = React.useCallback((tasks = []) => {
    if (!selectedMemberId) return tasks;

    return tasks.filter((task) => {
      if (!task || !task.assignedMembers) return false;
      return task.assignedMembers.includes(selectedMemberId);
    });
  }, [selectedMemberId]);

  return {
    selectedMemberId,
    setSelectedMemberId,
    members,
    loading,
    error,
    filterTasksByMember,
  };
};
