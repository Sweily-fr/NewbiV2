"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Separator } from "@/src/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { Settings, XIcon, Mail, Users, Bell, CheckCircle } from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";

export function NotificationsSection() {
  const [invitations, setInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState([]);

  const { listInvitations, cancelInvitation } = useOrganizationInvitations();

  // Récupérer les invitations reçues par l'utilisateur via Better Auth
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true);
        const { data, error } =
          await authClient.organization.listUserInvitations();

        if (error) {
          console.error(
            "Erreur lors de la récupération des invitations:",
            error
          );
          setInvitations([]);
        } else {
          setInvitations(data || []);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des invitations:", error);
        setInvitations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, []);

  // Récupérer les invitations envoyées par l'utilisateur
  useEffect(() => {
    const fetchSentInvitations = async () => {
      try {
        setLoadingSent(true);
        const result = await listInvitations();

        if (result.success) {
          console.log("📤 Invitations envoyées:", result.data);
          setSentInvitations(result.data || []);
        } else {
          console.error(
            "Erreur lors de la récupération des invitations envoyées:",
            result.error
          );
          setSentInvitations([]);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des invitations envoyées:",
          error
        );
        setSentInvitations([]);
      } finally {
        setLoadingSent(false);
      }
    };

    fetchSentInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Charger une seule fois au montage

  // Filtrer les invitations en attente et non dismissées
  const pendingInvitations = useMemo(() => {
    return (
      invitations?.filter(
        (inv) =>
          inv.status === "pending" && !dismissedNotifications.includes(inv.id)
      ) || []
    );
  }, [invitations, dismissedNotifications]);

  // Filtrer les invitations envoyées en attente
  const pendingSentInvitations = useMemo(() => {
    return sentInvitations?.filter((inv) => inv.status === "pending") || [];
  }, [sentInvitations]);

  const handleDismiss = (e, invitationId) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedNotifications([...dismissedNotifications, invitationId]);
  };

  const refetchInvitations = async () => {
    try {
      const { data, error } =
        await authClient.organization.listUserInvitations();

      if (error) {
        console.error("Erreur lors de la récupération des invitations:", error);
      } else {
        setInvitations(data || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des invitations:", error);
    }
  };

  const refetchSentInvitations = useCallback(async () => {
    try {
      const result = await listInvitations();
      if (result.success) {
        setSentInvitations(result.data || []);
      }
    } catch (error) {
      console.error(
        "Erreur lors du rafraîchissement des invitations envoyées:",
        error
      );
    }
  }, [listInvitations]);

  const handleAcceptInvitation = async (e, invitationId) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        toast.error("Erreur lors de l'acceptation de l'invitation");
        console.error("Erreur:", error);
      } else {
        toast.success("Invitation acceptée !");
        refetchInvitations();
        // Recharger la page pour mettre à jour l'organisation active
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'acceptation de l'invitation");
    }
  };

  const handleRejectInvitation = async (e, invitationId) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const { data, error } = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (error) {
        toast.error("Erreur lors du refus de l'invitation");
        console.error("Erreur:", error);
      } else {
        toast.success("Invitation refusée");
        refetchInvitations();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du refus de l'invitation");
    }
  };

  const handleCancelInvitation = async (e, invitationId) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const result = await cancelInvitation(invitationId);

      if (result.success) {
        // Rafraîchir la liste des invitations envoyées
        await refetchSentInvitations();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Fonction helper pour obtenir le statut (sans couleurs vives)
  const getStatusDisplay = useCallback((status) => {
    switch (status) {
      case "accepted":
        return {
          label: "Acceptée",
          showDot: false,
        };
      case "rejected":
        return {
          label: "Refusée",
          showDot: false,
        };
      case "pending":
      default:
        return {
          label: "En attente",
          showDot: true, // Point bleu pour les invitations en attente
        };
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-lg font-medium mb-1">Notifications</h2>
        <Separator className="hidden md:block" />
      </div>

      {/* Tabs pour les différents types de notifications */}
      <Tabs defaultValue="invitations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invitations" className="gap-2 font-normal">
            <Mail className="w-4 h-4" />
            Invitations
            {pendingInvitations.length > 0 && (
              <span className="ml-1 bg-[#5b4fff]/70 text-white text-xs rounded-md px-2 py-0.5">
                {pendingInvitations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 font-normal">
            <Bell className="w-4 h-4" />
            Activité
            {pendingSentInvitations.length > 0 && (
              <span className="ml-1 bg-[#5b4eff] text-white text-xs rounded-md px-2 py-0.5">
                {pendingSentInvitations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2 font-normal">
            <Settings className="w-4 h-4" />
            Système
          </TabsTrigger>
        </TabsList>

        {/* Contenu: Invitations */}
        <TabsContent value="invitations" className="space-y-2 mt-6">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chargement des invitations...
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucune invitation en attente
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/50">
              {pendingInvitations.map((invitation) => {
                // Log pour déboguer les données de l'invitation
                console.log("📧 Données de l'invitation:", invitation);
                console.log("📧 inviterEmail:", invitation.inviterEmail);

                // Obtenir l'initiale de l'organisation
                const initial = invitation.organizationName
                  ? invitation.organizationName.charAt(0).toUpperCase()
                  : "O";

                return (
                  <div
                    key={invitation.id}
                    className="group py-4 px-2 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar avec initiale */}
                      <div className="relative flex-shrink-0">
                        <div className="size-10 rounded-full bg-[#5b4fff]/10 flex items-center justify-center text-sm font-medium text-[#5b4fff]">
                          {initial}
                        </div>
                        {/* Point bleu pour les invitations en attente */}
                        <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-[#5b4eff] border-2 border-background"></div>
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm text-foreground truncate">
                            <span className="font-normal">
                              Invitation à rejoindre
                            </span>{" "}
                            <span className="font-medium">
                              {invitation.organizationName}
                            </span>
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Rôle: {invitation.role}
                          {invitation.inviterEmail && (
                            <> • Invité par {invitation.inviterEmail}</>
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          type="button"
                          onClick={(e) =>
                            handleAcceptInvitation(e, invitation.id)
                          }
                          className="bg-[#5b4fff] text-white hover:bg-[#5b4fff]/90 cursor-pointer h-8 px-3 text-xs"
                        >
                          Accepter
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          className="hover:bg-red-100 hover:text-red-500 cursor-pointer h-8 px-3 text-xs"
                          onClick={(e) =>
                            handleRejectInvitation(e, invitation.id)
                          }
                        >
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Contenu: Activité - Invitations envoyées */}
        <TabsContent value="activity" className="space-y-2 mt-6">
          {loadingSent ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chargement des invitations envoyées...
            </div>
          ) : sentInvitations.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucune invitation envoyée
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/50">
              {sentInvitations.map((invitation) => {
                const statusDisplay = getStatusDisplay(invitation.status);

                // Obtenir l'initiale de l'email
                const initial = invitation.email.charAt(0).toUpperCase();

                return (
                  <div
                    key={invitation.id}
                    className="group py-4 px-2 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar avec initiale */}
                      <div className="relative flex-shrink-0">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                          {initial}
                        </div>
                        {/* Point bleu pour les invitations en attente */}
                        {statusDisplay.showDot && (
                          <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-[#5b4eff] border-2 border-background"></div>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm text-foreground truncate">
                            <span className="font-normal">
                              Invitation envoyée à
                            </span>{" "}
                            <span className="font-medium">
                              {invitation.email}
                            </span>
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Rôle: {invitation.role}
                        </p>
                      </div>

                      {invitation.status === "pending" && (
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 cursor-pointer transition-opacity text-xs h-7 px-2"
                          onClick={(e) =>
                            handleCancelInvitation(e, invitation.id)
                          }
                        >
                          Annuler
                        </Button>
                      )}
                      {/* Date et actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            invitation.createdAt || Date.now()
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Contenu: Système */}
        <TabsContent value="system" className="space-y-4 mt-6">
          <div className="text-center py-8 text-sm text-muted-foreground">
            Aucune notification système
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
