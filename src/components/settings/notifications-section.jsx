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
  LoaderCircle,
} from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { useNotificationPreferences } from "@/src/hooks/useNotificationPreferences";
import { useActivityNotifications } from "@/src/hooks/useActivityNotifications";
import Link from "next/link";
import { AtSign, Activity, ExternalLink } from "lucide-react";

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
          // Enrichir les invitations avec les détails (nom d'organisation, etc.)
          const enriched = await Promise.all(
            (data || []).map(async (inv) => {
              try {
                const res = await fetch(`/api/invitations/${inv.id}`);
                if (res.ok) {
                  const details = await res.json();
                  return { ...inv, ...details };
                }
              } catch (e) {
                // Silently fail, keep original data
              }
              return inv;
            })
          );
          setInvitations(enriched);
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
        const enriched = await Promise.all(
          (data || []).map(async (inv) => {
            try {
              const res = await fetch(`/api/invitations/${inv.id}`);
              if (res.ok) {
                const details = await res.json();
                return { ...inv, ...details };
              }
            } catch (e) {
              // Silently fail
            }
            return inv;
          })
        );
        setInvitations(enriched);
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
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.details || result.error || "Erreur lors de l'acceptation de l'invitation");
        console.error("Erreur acceptation:", result);
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
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.details || result.error || "Erreur lors du refus de l'invitation");
        console.error("Erreur refus:", result);
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
      {/* Titre */}
      <div className="hidden md:block">
        <h2 className="text-lg font-medium mb-1">Notifications</h2>
        <Separator className="bg-[#eeeff1] dark:bg-[#232323]" />
      </div>

      {/* Tabs pour les différents types de notifications */}
      <Tabs defaultValue="invitations" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger
            value="invitations"
            className="gap-1 md:gap-2 font-normal flex-col md:flex-row py-2 md:py-1.5 text-xs md:text-sm"
          >
            <div className="flex items-center gap-1 relative">
              <AtSign className="w-4 h-4" />
              <span className="hidden sm:inline">Invitations</span>
              {/* Point violet sur mobile, badge sur desktop */}
              {unreadInvitationsCount > 0 && (
                <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                  {unreadInvitationsCount}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="gap-1 md:gap-2 font-normal flex-col md:flex-row py-2 md:py-1.5 text-xs md:text-sm"
          >
            <div className="flex items-center gap-1 relative">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Activité</span>
              {/* Point violet sur mobile, badge sur desktop */}
              {activityUnreadCount > 0 && (
                <span className="text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded px-1 py-0.5">
                  {activityUnreadCount}
                </span>
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
        <TabsContent value="invitations" className="mt-6">
          {(unreadInvitationsCount > 0 || unreadSentInvitationsCount > 0) && (
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tout marquer comme lu
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderCircle className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-10 h-10 rounded-xl bg-[#fbfbfb] dark:bg-[#1a1a1a] border border-[#eeeff1] dark:border-[#232323] flex items-center justify-center mb-3">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium mb-0.5">Aucune invitation</p>
              <p className="text-xs text-gray-400">Vous n'avez pas d'invitation en attente.</p>
            </div>
          ) : (
            <div>
              {pendingInvitations.map((invitation, index) => {
                const initial = invitation.organizationName
                  ? invitation.organizationName.charAt(0).toUpperCase()
                  : "O";
                const isExpired = invitation.expiresAt && new Date(invitation.expiresAt) < new Date();
                const unread = !isExpired && !isRead(invitation.id);
                const isLast = index === pendingInvitations.length - 1;

                return (
                  <div
                    key={invitation.id}
                    className={`group flex items-center gap-3 hover:bg-[#f9f9f9] dark:hover:bg-[#1a1a1a] hover:rounded-lg transition-all duration-75 ${isExpired ? "opacity-50" : ""} ${!isLast ? "border-b border-[#eeeff1] dark:border-[#232323]" : ""}`}
                    style={{ padding: "12px 16px 12px 12px" }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${isExpired ? "bg-gray-100 dark:bg-[#2c2c2c] text-gray-400" : "bg-[#5b4fff]/10 text-[#5b4fff]"}`}>
                        {initial}
                      </div>
                      {unread && (
                        <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-[#5b4eff] border-2 border-white dark:border-[#141414]" />
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate max-w-[600px]">
                        <span className="font-normal text-gray-500 dark:text-gray-400">Rejoindre</span>{" "}
                        <span className="font-medium">{invitation.organizationName}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-gray-400 capitalize">{invitation.role}</span>
                        {invitation.inviterEmail && (
                          <>
                            <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-400 truncate">{invitation.inviterEmail}</span>
                          </>
                        )}
                        {isExpired && (
                          <>
                            <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-red-400">Expirée</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isExpired ? (
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(e, invitation.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            type="button"
                            onClick={(e) => handleAcceptInvitation(e, invitation.id)}
                            className="bg-[#5b4fff] text-white hover:bg-[#4a40ee] cursor-pointer h-7 px-2.5 text-xs"
                          >
                            Accepter
                          </Button>
                          <button
                            type="button"
                            onClick={(e) => handleRejectInvitation(e, invitation.id)}
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-1"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Contenu: Activité */}
        <TabsContent value="activity" className="mt-6">
          {activityUnreadCount > 0 && (
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={markAllActivityAsRead}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tout marquer comme lu
              </button>
            </div>
          )}
          {activityLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderCircle className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : activityNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-10 h-10 rounded-xl bg-[#fbfbfb] dark:bg-[#1a1a1a] border border-[#eeeff1] dark:border-[#232323] flex items-center justify-center mb-3">
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium mb-0.5">Aucune activité</p>
              <p className="text-xs text-gray-400">Les assignations et mentions apparaîtront ici.</p>
            </div>
          ) : (
            <div>
              {activityNotifications.map((notification, index) => {
                const initial = notification.data?.actorName
                  ? notification.data.actorName.charAt(0).toUpperCase()
                  : "?";
                const isLast = index === activityNotifications.length - 1;

                return (
                  <div
                    key={notification.id}
                    className={`group flex items-center gap-3 hover:bg-[#f9f9f9] dark:hover:bg-[#1a1a1a] hover:rounded-lg cursor-pointer transition-all duration-75 ${!isLast ? "border-b border-[#eeeff1] dark:border-[#232323]" : ""}`}
                    style={{ padding: "12px 16px 12px 12px" }}
                    onClick={() => {
                      if (!notification.read) markActivityAsRead(notification.id);
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {notification.data?.actorImage ? (
                        <img
                          src={notification.data.actorImage}
                          alt={notification.data.actorName}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#5b4fff]/10 flex items-center justify-center text-xs font-medium text-[#5b4fff]">
                          {initial}
                        </div>
                      )}
                      {!notification.read && (
                        <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-[#5b4eff] border-2 border-white dark:border-[#141414]" />
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate max-w-[600px]">
                        <span className="font-medium">{notification.data?.actorName || "Quelqu'un"}</span>{" "}
                        <span className="font-normal text-gray-500 dark:text-gray-400">
                          {notification.type === "MENTION" ? "vous a mentionné sur" : "vous a assigné à"}
                        </span>{" "}
                        <span className="font-medium">{notification.data?.taskTitle || "une tâche"}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-gray-400">{notification.data?.boardName || "Tableau"}</span>
                        {notification.data?.columnName && (
                          <>
                            <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-400">{notification.data?.columnName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Date + action */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {notification.data?.url && (
                        <Link
                          href={notification.data.url}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        </Link>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
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
                        <Separator className="mt-10 bg-[#eeeff1] dark:bg-[#232323]" />
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
