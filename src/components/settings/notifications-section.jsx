"use client";

import React, { useState, useEffect } from "react";
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

export function NotificationsSection() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState([]);

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

  // Filtrer les invitations en attente et non dismissées
  const pendingInvitations = invitations?.filter(
    (inv) =>
      inv.status === "pending" && !dismissedNotifications.includes(inv.id)
  ) || [];

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
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2 font-normal">
            <Settings className="w-4 h-4" />
            Système
          </TabsTrigger>
        </TabsList>

        {/* Contenu: Invitations */}
        <TabsContent value="invitations" className="space-y-4 mt-6">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chargement des invitations...
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucune invitation en attente
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="max-w-full rounded-lg border bg-background p-4 shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-[#5b4fff]/10"
                      aria-hidden="true"
                    >
                      <Users className="opacity-60 text-[#5b4fff]" size={16} />
                    </div>
                    <div className="flex grow items-start gap-3 flex-col sm:flex-row sm:items-center">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">
                          Invitation à rejoindre {invitation.organizationName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Rôle: {invitation.role} • Invité par{" "}
                          {invitation.inviterEmail}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          type="button"
                          onClick={(e) =>
                            handleAcceptInvitation(e, invitation.id)
                          }
                          className="bg-[#5b4fff] dark:text-white hover:bg-[#5b4fff]/90 cursor-pointer"
                        >
                          Accepter
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={(e) =>
                            handleRejectInvitation(e, invitation.id)
                          }
                        >
                          Refuser
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                      aria-label="Fermer la notification"
                      onClick={(e) => handleDismiss(e, invitation.id)}
                    >
                      <XIcon
                        size={16}
                        className="opacity-60 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contenu: Activité */}
        <TabsContent value="activity" className="space-y-4 mt-6">
          <div className="text-center py-8 text-sm text-muted-foreground">
            Aucune notification d'activité
          </div>
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
