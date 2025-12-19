"use client";

import { useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";

export function useCreateWorkspace() {
  const [isCreating, setIsCreating] = useState(false);
  const { data: session } = authClient.useSession();

  const createWorkspace = async ({
    workspaceName,
    workspaceType,
    selectedPlan,
    isAnnual,
    membersWithRoles,
    onSuccess,
  }) => {
    if (!session?.user?.id) {
      toast.error("Vous devez être connecté pour créer un espace de travail");
      return;
    }

    setIsCreating(true);

    try {
      const invitedMembersWithRoles = membersWithRoles.map((member) => ({
        email: member.value,
        role: member.role,
      }));

      const orgData = {
        name: workspaceName,
        type: workspaceType,
        planName: selectedPlan,
        isAnnual: isAnnual,
        invitedMembers: invitedMembersWithRoles,
        userId: session.user.id,
      };

      // Stocker temporairement les données
      sessionStorage.setItem("pending_org_creation", JSON.stringify(orgData));

      // Créer la session de checkout Stripe
      const response = await fetch("/api/create-org-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationData: {
            name: workspaceName,
            type: workspaceType,
            planName: selectedPlan,
            isAnnual: isAnnual,
            invitedMembers: invitedMembersWithRoles,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la création de la session"
        );
      }

      const { url } = await response.json();

      // Rediriger vers Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Erreur création workspace:", error);
      toast.error(error.message || "Erreur lors de la création");
      sessionStorage.removeItem("pending_org_creation");
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createWorkspace,
    isCreating,
  };
}
