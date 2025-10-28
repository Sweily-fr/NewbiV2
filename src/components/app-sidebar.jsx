"use client";

import * as React from "react";
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
} from "@/src/components/ui/sidebar";
import { getCurrentUser } from "../lib/auth/api";
import { useUser } from "../lib/auth/hooks";
import { TeamSwitcher } from "@/src/components/team-switcher";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";

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
      title: "Tableau de bord",
      url: "/dashboard",
      icon: CircleGauge,
    },
    // {
    //   title: "Intégrations",
    //   url: "/dashboard/automatisation",
    //   icon: IconRobot,
    // },
    // {
    //   title: "Collaborateurs",
    //   url: "/dashboard/collaborateurs",
    //   icon: IconUsers,
    // },
    // {
    //   title: "Analytics",
    //   url: "/dashboard/analytics",
    //   icon: IconChartBar,
    // },
    {
      title: "Calendrier",
      url: "/dashboard/calendar",
      icon: Calendar,
    },
    // {
    //   title: "Favoris",
    //   url: "/dashboard/favoris",
    //   icon: IconHeart,
    // },
    {
      title: "Clients (CRM)",
      url: "/dashboard/clients",
      icon: Users,
    },
    {
      title: "Catalogues",
      url: "/dashboard/catalogues",
      icon: FileMinus,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "/dashboard/proposal",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "/dashboard/prompts",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
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
  documents: [
    {
      name: "Factures",
      url: "/dashboard/outils/factures",
      icon: IconDatabase,
    },
  ],
};

export function AppSidebar({ onCommunityClick, ...props }) {
  const { session } = useUser();
  const {
    isLoading: subscriptionLoading,
    isActive,
    subscription,
  } = useSubscription();
  const [theme, setTheme] = React.useState("light");

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
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="mt-1">
        {session?.user && !subscriptionLoading ? (
          <>
            <NavMain items={data.navMain} />
            <NavDocuments items={data.documents} />
            <NavSecondary items={data.navSecondary} onCommunityClick={onCommunityClick} className="mt-auto" />
          </>
        ) : (
          <>
            {/* NavMain Skeleton */}
            <div className="px-2 py-2">
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex w-full items-center gap-2 px-2 py-1.5"
                  >
                    <Skeleton className="h-8 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* NavDocuments Skeleton */}
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

            {/* NavSecondary Skeleton */}
            <div className="px-2 py-2 mt-auto">
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                    <Skeleton className="h-8 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
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
          <div className="mb-2 px-2">
            <Skeleton className="h-16 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-md" />
          </div>
        )}
        {session?.user && !subscriptionLoading ? (
          <NavUser user={session.user} />
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-8 w-8 rounded-full bg-[#EBEBEB] dark:bg-[#292929]" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
              <Skeleton className="h-3 w-32 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
