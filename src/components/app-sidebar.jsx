"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconRobot,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconHeart,
  IconCalendar,
  IconCirclePlusFilled,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
} from "@tabler/icons-react";

import {
  CircleGauge,
  Calendar,
  Users,
  FileMinus,
  Search,
  MessageCircleQuestionMark,
  Inbox,
  Landmark,
} from "lucide-react";

import { NavDocuments } from "@/src/components/nav-documents";
import { NavMain } from "@/src/components/nav-main";
import { NavSecondary } from "@/src/components/nav-secondary";
import { NavUser } from "@/src/components/nav-user";
import { SidebarTrialCard } from "@/src/components/sidebar-trial-card";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar";
import { getCurrentUser } from "../lib/auth/api";
import { useUser } from "../lib/auth/hooks";
import { TeamSwitcher } from "@/src/components/team-switcher";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { authClient } from "@/src/lib/auth-client";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { EmailVerificationBadge } from "@/src/components/email-verification-badge";

const data = {
  teams: [
    {
      name: "Sweily",
      logo: IconUsers,
      plan: "Enterprise",
    },
    {
      name: "Newbi",
      logo: IconUsers,
      plan: "Startup",
    },
    {
      name: "Cabinet comptable",
      logo: IconUsers,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: CircleGauge,
    },
    {
      title: "Transactions",
      url: "/dashboard/outils/transactions",
      icon: Landmark,
    },
  ],
  navVentes: [
    {
      title: "Factures clients",
      url: "/dashboard/outils/factures",
      isPro: true,
    },
    {
      title: "Devis",
      url: "/dashboard/outils/devis",
      isPro: true,
    },
    {
      title: "Liste client (CRM)",
      url: "/dashboard/clients",
      isPro: true,
    },
    {
      title: "Catalogues",
      url: "/dashboard/catalogues",
      isPro: true,
    },
  ],
  navAfterVentes: [
    {
      title: "Boîte de réception",
      url: "#",
      icon: Inbox,
      action: "openNotifications",
    },
    {
      title: "Calendrier",
      url: "/dashboard/calendar",
      icon: Calendar,
    },
  ],
  navProjets: [
    {
      title: "Kanban",
      url: "/dashboard/outils/kanban",
      isPro: false,
    },
    {
      title: "Tâches",
      url: "/dashboard/outils/taches",
      isPro: false,
    },
    {
      title: "Timer",
      url: "/dashboard/outils/timer",
      isPro: false,
    },
  ],
  navDocuments: [
    {
      title: "Transfert de fichiers",
      url: "/dashboard/outils/transferts-fichiers",
      isPro: true,
    },
    {
      title: "Documents partagés",
      url: "/dashboard/outils/documents-partages",
      isPro: true,
    },
  ],
  navCommunication: [
    {
      title: "Signature de mail",
      url: "/dashboard/outils/signatures-mail",
      isPro: false,
    },
  ],
  navSecondary: [
    {
      title: "Communauté",
      url: "https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL",
      icon: Users,
    },
    {
      title: "Recherche",
      url: "#",
      icon: Search,
    },
    {
      title: "Aide",
      url: "https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL",
      icon: MessageCircleQuestionMark,
    },
  ],
};

export function AppSidebar({
  onCommunityClick,
  onOpenNotifications,
  ...props
}) {
  const pathname = usePathname();
  const { session } = useUser();
  const {
    isLoading: subscriptionLoading,
    isActive,
    subscription,
  } = useSubscription();
  const [theme, setTheme] = React.useState("light");
  const [notificationCount, setNotificationCount] = React.useState(0);
  const { listInvitations } = useOrganizationInvitations();

  // Récupérer l'état de la sidebar pour adapter les skeletons
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  // Déterminer si on est sur une page d'outil qui nécessite la sidebar masquée
  const isToolPage =
    pathname?.includes("/dashboard/outils/") &&
    (pathname?.includes("/new") ||
      pathname?.includes("/nouveau") ||
      pathname?.includes("/edit") ||
      pathname?.includes("/editer") ||
      pathname?.includes("/view") ||
      pathname?.includes("/avoir/"));

  // Utiliser offcanvas pour les pages d'outils, icon pour les autres
  const collapsibleMode = isToolPage ? "offcanvas" : "icon";

  // Récupérer le nombre de notifications
  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Récupérer les invitations reçues
        const { data: receivedInvitations } =
          await authClient.organization.listUserInvitations();
        const pendingReceived =
          receivedInvitations?.filter((inv) => inv.status === "pending") || [];

        // Récupérer les invitations envoyées
        const sentResult = await listInvitations();
        const pendingSent = sentResult.success
          ? sentResult.data?.filter((inv) => inv.status === "pending") || []
          : [];

        // Total des notifications
        const total = pendingReceived.length + pendingSent.length;
        setNotificationCount(total);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des notifications:",
          error
        );
      }
    };

    if (session?.user) {
      fetchNotifications();

      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // Dépendre uniquement de l'ID utilisateur

  // Effet pour détecter le thème depuis localStorage au chargement du composant
  React.useEffect(() => {
    // Vérifier si on est côté client (browser)
    if (typeof window !== "undefined") {
      // Récupérer le thème depuis localStorage ou utiliser "light" par défaut
      const storedTheme = localStorage.getItem("vite-ui-theme") || "light";
      setTheme(storedTheme);

      // Écouter les changements de thème
      const handleStorageChange = () => {
        const updatedTheme = localStorage.getItem("vite-ui-theme") || "light";
        setTheme(updatedTheme);
      };

      // Ajouter un écouteur pour les changements de localStorage
      window.addEventListener("storage", handleStorageChange);

      // Écouter également les changements de classe sur l'élément html pour détecter les changements de thème
      const observer = new MutationObserver(() => {
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "dark" : "light");
        localStorage.setItem("vite-ui-theme", isDark ? "dark" : "light");
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      // Nettoyage
      return () => {
        window.removeEventListener("storage", handleStorageChange);
        observer.disconnect();
      };
    }
  }, []);

  let isLoading = false;

  return (
    <Sidebar collapsible={collapsibleMode} {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="mt-1">
        {session?.user && !subscriptionLoading ? (
          <>
            <NavMain
              items={data.navMain}
              navVentes={data.navVentes}
              navAfterVentes={data.navAfterVentes}
              navProjets={data.navProjets}
              navDocuments={data.navDocuments}
              navCommunication={data.navCommunication}
              onOpenNotifications={onOpenNotifications}
              notificationCount={notificationCount}
            />
            <NavSecondary
              items={data.navSecondary}
              onCommunityClick={onCommunityClick}
              className="mt-auto"
            />
          </>
        ) : (
          <>
            {/* NavMain Skeleton */}
            <div className={isCollapsed ? "px-1 py-2" : "px-2 py-2"}>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={
                      isCollapsed
                        ? "flex justify-center py-1.5"
                        : "flex w-full items-center gap-2 px-2 py-1.5"
                    }
                  >
                    <Skeleton
                      className={
                        isCollapsed
                          ? "h-8 w-8 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm"
                          : "h-8 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-sm"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* NavDocuments Skeleton - Masqué en mode rétréci */}
            {!isCollapsed && (
              <div className="px-4 py-6">
                <Skeleton className="h-5 w-16 mb-2 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 py-1.5">
                    <Skeleton className="h-8 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
                  </div>
                  <div className="flex items-center gap-2 py-1.5">
                    <Skeleton className="h-8 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* NavSecondary Skeleton */}
            <div
              className={
                isCollapsed ? "px-1 py-2 mt-auto" : "px-2 py-2 mt-auto"
              }
            >
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={
                      isCollapsed
                        ? "flex justify-center py-1.5"
                        : "flex items-center gap-2 px-2 py-1.5"
                    }
                  >
                    <Skeleton
                      className={
                        isCollapsed
                          ? "h-8 w-8 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm"
                          : "h-8 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-sm"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        {session?.user && !subscriptionLoading ? (
          <SidebarTrialCard />
        ) : (
          !isCollapsed && (
            <div className="mb-2 px-2">
              <Skeleton className="h-16 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-md" />
            </div>
          )
        )}
        {session?.user && !subscriptionLoading ? (
          <NavUser user={session.user} />
        ) : (
          <div
            className={
              isCollapsed
                ? "flex justify-center py-1.5"
                : "flex items-center gap-2 px-2 py-1.5"
            }
          >
            <Skeleton className="h-8 w-8 rounded-full bg-[#EBEBEB] dark:bg-[#292929]" />
            {!isCollapsed && (
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
                <Skeleton className="h-3 w-32 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
              </div>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
