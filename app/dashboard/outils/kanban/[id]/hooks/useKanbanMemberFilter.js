import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ORGANIZATION_MEMBERS } from '@/src/graphql/kanbanQueries';

export const useKanbanMemberFilter = (workspaceId) => {
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [members, setMembers] = useState([]);

  // Récupérer les membres de l'organisation
  const { data, loading, error } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  // Traiter les données GraphQL des membres
  React.useEffect(() => {
    if (data?.organizationMembers) {
      const formattedMembers = data.organizationMembers.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        image: member.image || null,
        role: member.role,
      }));
      setMembers(formattedMembers);
    } else {
      setMembers([]);
    }
  }, [data]);

  // Fonction pour filtrer les tâches selon le membre sélectionné
  const filterTasksByMember = (tasks = []) => {
    if (!selectedMemberId) return tasks;

    return tasks.filter((task) => {
      if (!task || !task.assignedMembers) return false;
      return task.assignedMembers.includes(selectedMemberId);
    });
  };

  return {
    selectedMemberId,
    setSelectedMemberId,
    members,
    loading,
    error,
    filterTasksByMember,
  };
};
