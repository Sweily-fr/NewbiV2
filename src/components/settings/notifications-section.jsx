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
import { Badge } from "@/src/components/ui/badge";
import { Switch } from "@/src/components/ui/switch";
import {
  Settings,
  XIcon,
  Mail,
  Users,
  Bell,
  CheckCircle,
  CheckCheck,
  XCircle,
  Receipt,
  CreditCard,
  AlertTriangle,
  Clock,
  UserPlus,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { useNotificationPreferences } from "@/src/hooks/useNotificationPreferences";
import { useActivityNotifications } from "@/src/hooks/useActivityNotifications";
import Link from "next/link";
import { ClipboardList, ExternalLink } from "lucide-react";

// Configuration des catégories de notifications Phase 1
const notificationCategories = {
  billing: {
    label: "Facturation",
    icon: Receipt,
    description: "Notifications liées à vos factures et paiements clients",
    notifications: [
      {
        key: "invoice_overdue",
        label: "Facture en retard",
        description: "Quand une facture dépasse sa date d'échéance",
        email: true,
        push: true,
      },
      {
        key: "payment_received",
        label: "Paiement reçu",
        description: "Quand un client règle une facture",
        email: true,
        push: true,
      },
      {
        key: "quote_response",
        label: "Réponse à un devis",
        description: "Quand un client accepte ou refuse un devis",
        email: true,
        push: true,
      },
      {
        key: "invoice_due_soon",
        label: "Facture bientôt due",
        description: "3 jours avant l'échéance d'une facture",
        email: false,
        push: true,
      },
    ],
  },
  subscription: {
    label: "Abonnement",
    icon: CreditCard,
    description: "Notifications liées à votre abonnement Newbi",
    notifications: [
      {
        key: "payment_failed",
        label: "Échec de paiement",
        description: "Quand le prélèvement de votre abonnement échoue",
        email: true,
        push: true,
      },
      {
        key: "trial_ending",
        label: "Fin de période d'essai",
        description: "3 jours avant la fin de votre essai gratuit",
        email: true,
        push: true,
      },
      {
        key: "subscription_renewed",
        label: "Abonnement renouvelé",
        description: "Confirmation de renouvellement avec facture",
        email: true,
        push: false,
      },
    ],
  },
  team: {
    label: "Équipe",
    icon: UserPlus,
    description: "Notifications liées à votre équipe et collaborateurs",
    notifications: [
      {
        key: "invitation_received",
        label: "Invitation reçue",
        description: "Quand vous êtes invité à rejoindre une organisation",
        email: true,
        push: true,
      },
      {
        key: "member_joined",
        label: "Nouveau membre",
        description: "Quand quelqu'un rejoint votre organisation",
        email: false,
        push: true,
      },
      {
        key: "document_shared",
        label: "Document partagé",
        description: "Quand quelqu'un partage un document avec vous",
        email: false,
        push: true,
      },
      {
        key: "kanban_task_assigned",
        label: "Assignation de tâche",
        description: "Quand quelqu'un vous assigne à une tâche kanban",
        email: true,
        push: true,
      },
    ],
  },
};

export function NotificationsSection() {
  const [invitations, setInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState([]);

  // Charger les notifications lues depuis localStorage côté client
  useEffect(() => {
    const saved = localStorage.getItem("readNotifications");
    if (saved) {
      setReadNotifications(JSON.parse(saved));
    }
  }, []);

  // Hook pour les préférences de notifications (backend)
  const {
    preferences: notificationPreferences,
    loading: preferencesLoading,
    updating: savingPreferences,
    updatePreference: updateNotificationPreference,
  } = useNotificationPreferences();

  const { listInvitations, cancelInvitation } = useOrganizationInvitations();

  // Hook pour les notifications d'activité (assignations de tâches, etc.)
  const {
    notifications: activityNotifications,
    unreadCount: activityUnreadCount,
    loading: activityLoading,
    markAsRead: markActivityAsRead,
    markAllAsRead: markAllActivityAsRead,
    deleteNotification: deleteActivityNotification,
  } = useActivityNotifications();

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

  // Compter les invitations non lues
  const unreadInvitationsCount = useMemo(() => {
    return pendingInvitations.filter(
      (inv) => !readNotifications.includes(inv.id)
    ).length;
  }, [pendingInvitations, readNotifications]);

  // Compter les invitations envoyées non lues
  const unreadSentInvitationsCount = useMemo(() => {
    return sentInvitations.filter((inv) => !readNotifications.includes(inv.id))
      .length;
  }, [sentInvitations, readNotifications]);

  // Filtrer les invitations envoyées en attente
  const pendingSentInvitations = useMemo(() => {
    return sentInvitations?.filter((inv) => inv.status === "pending") || [];
  }, [sentInvitations]);

  const handleDismiss = (e, invitationId) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedNotifications([...dismissedNotifications, invitationId]);
  };

  // Marquer une notification comme lue
  const markAsRead = useCallback((invitationId) => {
    setReadNotifications((prev) => {
      if (prev.includes(invitationId)) return prev;
      const updated = [...prev, invitationId];
      // Sauvegarder dans le localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("readNotifications", JSON.stringify(updated));
        // Notifier la sidebar pour rafraîchir le compteur
        window.dispatchEvent(new Event("notificationsRead"));
      }
      return updated;
    });
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    const allIds = [
      ...pendingInvitations.map((inv) => inv.id),
      ...sentInvitations.map((inv) => inv.id),
    ];
    setReadNotifications(allIds);
    // Sauvegarder dans le localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("readNotifications", JSON.stringify(allIds));
      // Notifier la sidebar pour rafraîchir le compteur
      window.dispatchEvent(new Event("notificationsRead"));
    }
    toast.success("Toutes les notifications ont été marquées comme lues");
  }, [pendingInvitations, sentInvitations]);

  // Vérifier si une notification est lue
  const isRead = useCallback(
    (invitationId) => readNotifications.includes(invitationId),
    [readNotifications]
  );

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

  // Fonction helper pour obtenir le statut avec tags visuels
  const getStatusDisplay = useCallback((status) => {
    switch (status) {
      case "accepted":
        return {
          label: "Acceptée",
          showDot: false,
          badge: <CheckCheck className="w-3 h-3 mr-1 text-green-600" />,
        };
      case "rejected":
        return {
          label: "Refusée",
          showDot: false,
          badge: <XCircle className="w-3 h-3 mr-1 text-red-700" />,
        };
      case "pending":
      default:
        return {
          label: "En attente",
          showDot: true, // Point bleu pour les invitations en attente
          badge: <Bell className="w-3 h-3 mr-1 text-blue-700" />,
        };
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Titre avec bouton "Tout marquer comme lu" */}
      <div className="flex items-center justify-between">
        <div className="flex-1 hidden md:block">
          <h2 className="text-lg font-medium mb-1">Notifications</h2>
          <Separator />
        </div>
        {(unreadInvitationsCount > 0 || unreadSentInvitationsCount > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="cursor-pointer text-xs"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Tabs pour les différents types de notifications */}
      <Tabs defaultValue="invitations" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger
            value="invitations"
            className="gap-1 md:gap-2 font-normal flex-col md:flex-row py-2 md:py-1.5 text-xs md:text-sm"
          >
            <div className="flex items-center gap-1 relative">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Invitations</span>
              {/* Point violet sur mobile, badge sur desktop */}
              {unreadInvitationsCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#5b4fff] rounded-full sm:hidden"></span>
                  <span className="hidden sm:inline bg-[#5b4fff]/70 text-white text-xs rounded-md px-1.5 py-0.5 ml-1">
                    {unreadInvitationsCount}
                  </span>
                </>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="gap-1 md:gap-2 font-normal flex-col md:flex-row py-2 md:py-1.5 text-xs md:text-sm"
          >
            <div className="flex items-center gap-1 relative">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Activité</span>
              {/* Point violet sur mobile, badge sur desktop */}
              {activityUnreadCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#5b4fff] rounded-full sm:hidden"></span>
                  <span className="hidden sm:inline bg-[#5b4eff] text-white text-xs rounded-md px-1.5 py-0.5 ml-1">
                    {activityUnreadCount}
                  </span>
                </>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="gap-1 md:gap-2 font-normal flex-col md:flex-row py-2 md:py-1.5 text-xs md:text-sm"
          >
            <div className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Préférences</span>
            </div>
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
                        {/* Point bleu pour les invitations non lues */}
                        {!isRead(invitation.id) && (
                          <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-[#5b4eff] border-2 border-background"></div>
                        )}
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

        {/* Contenu: Activité - Notifications d'assignation de tâches */}
        <TabsContent value="activity" className="space-y-2 mt-6">
          {/* Bouton tout marquer comme lu pour les activités */}
          {activityUnreadCount > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllActivityAsRead}
                className="cursor-pointer text-xs"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Tout marquer comme lu
              </Button>
            </div>
          )}
          {activityLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chargement des notifications...
            </div>
          ) : activityNotifications.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>Aucune notification d&apos;activité</p>
              <p className="text-xs mt-1">Les assignations et mentions apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/50">
              {activityNotifications.map((notification) => {
                // Obtenir l'initiale de l'acteur
                const initial = notification.data?.actorName
                  ? notification.data.actorName.charAt(0).toUpperCase()
                  : "?";

                return (
                  <div
                    key={notification.id}
                    className="group py-4 px-2 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => {
                      if (!notification.read) {
                        markActivityAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar de l'acteur */}
                      <div className="relative flex-shrink-0">
                        {notification.data?.actorImage ? (
                          <img
                            src={notification.data.actorImage}
                            alt={notification.data.actorName}
                            className="size-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="size-10 rounded-full bg-[#5b4fff]/10 flex items-center justify-center text-sm font-medium text-[#5b4fff]">
                            {initial}
                          </div>
                        )}
                        {/* Point bleu pour les notifications non lues */}
                        {!notification.read && (
                          <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-[#5b4eff] border-2 border-background"></div>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">
                              {notification.data?.actorName || "Quelqu'un"}
                            </span>{" "}
                            {notification.type === "MENTION" ? (
                              <>
                                <span className="font-normal">
                                  vous a mentionné dans un commentaire sur
                                </span>{" "}
                                <span className="font-medium">
                                  {notification.data?.taskTitle || "une tâche"}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="font-normal">
                                  vous a assigné à
                                </span>{" "}
                                <span className="font-medium">
                                  {notification.data?.taskTitle || "une tâche"}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            📋 {notification.data?.boardName || "Tableau"}
                          </p>
                          {notification.data?.columnName && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">
                                📁 {notification.data?.columnName}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notification.data?.url && (
                          <Link
                            href={notification.data.url}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              type="button"
                              className="bg-[#5b4fff] text-white hover:bg-[#5b4fff]/90 cursor-pointer h-7 px-2 text-xs"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Voir
                            </Button>
                          </Link>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString("fr-FR", {
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

        {/* Contenu: Préférences de notifications */}
        <TabsContent value="system" className="mt-6">
          {preferencesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#5b4eff]" />
              <span className="ml-2 text-sm text-muted-foreground">
                Chargement des préférences...
              </span>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Catégories de notifications */}
              {Object.entries(notificationCategories).map(
                ([categoryKey, category]) => {
                  return (
                    <div key={categoryKey}>
                      {/* Header de catégorie - style preferences-section */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <h3 className="text-sm font-normal mb-1">
                            {category.label}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {category.description}
                          </p>
                        </div>
                      </div>

                      {/* Liste des notifications de cette catégorie */}
                      <div className="space-y-6">
                        {category.notifications.map((notif) => {
                          const prefs = notificationPreferences?.[
                            notif.key
                          ] || {
                            email: notif.email,
                            push: notif.push,
                          };
                          return (
                            <div
                              key={notif.key}
                              className="flex items-start justify-between"
                            >
                              <div className="flex-1">
                                <h3 className="text-sm font-normal mb-1">
                                  {notif.label}
                                </h3>
                                <p className="text-xs text-gray-400">
                                  {notif.description}
                                </p>
                              </div>

                              {/* Toggles Email et Push */}
                              <div className="flex items-center gap-4 ml-4">
                                {/* Email toggle */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    Email
                                  </span>
                                  <Switch
                                    checked={prefs.email}
                                    disabled={savingPreferences}
                                    onCheckedChange={(checked) =>
                                      updateNotificationPreference(
                                        notif.key,
                                        "email",
                                        checked
                                      )
                                    }
                                    className="scale-75 data-[state=checked]:!bg-[#5b4eff]"
                                  />
                                </div>

                                {/* Push toggle */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    Push
                                  </span>
                                  <Switch
                                    checked={prefs.push}
                                    disabled={savingPreferences}
                                    onCheckedChange={(checked) =>
                                      updateNotificationPreference(
                                        notif.key,
                                        "push",
                                        checked
                                      )
                                    }
                                    className="scale-75 data-[state=checked]:!bg-[#5b4eff]"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Séparateur entre catégories */}
                      {categoryKey !== "team" && (
                        <Separator className="mt-10" />
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
