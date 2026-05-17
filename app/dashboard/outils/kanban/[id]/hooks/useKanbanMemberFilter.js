import React, { useState, useMemo, useCallback } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_ORGANIZATION_MEMBERS } from "@/src/graphql/kanbanQueries";

export const useKanbanMemberFilter = (workspaceId) => {
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  // Lazy query : ne se déclenche que quand loadMembers() est appelé (ex: ouverture du filtre)
  const [loadMembers, { data, loading, error, called }] = useLazyQuery(
    GET_ORGANIZATION_MEMBERS,
    {
      variables: { workspaceId },
      fetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: false,
    },
  );

  // Charger les membres à la demande (appelé quand le dropdown s'ouvre)
  const fetchMembers = useCallback(() => {
    if (!called && workspaceId) {
      loadMembers();
    }
  }, [called, workspaceId, loadMembers]);

  // Toggle a single member id (add if absent, remove if present)
  const toggleMemberId = useCallback((memberId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  }, []);

  const clearSelectedMembers = useCallback(() => {
    setSelectedMemberIds([]);
  }, []);

  // Mémoriser les membres formatés pour éviter les re-calculs inutiles
  const members = useMemo(() => {
    if (data?.organizationMembers) {
      return data.organizationMembers.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        image: member.image || null,
        role: member.role,
      }));
    }
    return [];
  }, [data?.organizationMembers]);

  // Fonction pour filtrer les tâches selon les membres sélectionnés (mémorisée)
  const filterTasksByMember = React.useCallback(
    (tasks = []) => {
      if (!selectedMemberIds || selectedMemberIds.length === 0) return tasks;

      return tasks.filter((task) => {
        if (!task || !task.assignedMembers) return false;
        return task.assignedMembers.some((id) =>
          selectedMemberIds.includes(id),
        );
      });
    },
    [selectedMemberIds],
  );

  return {
    selectedMemberIds,
    setSelectedMemberIds,
    toggleMemberId,
    clearSelectedMembers,
    members,
    loading,
    error,
    filterTasksByMember,
    fetchMembers,
  };
};
