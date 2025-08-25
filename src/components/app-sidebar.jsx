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

import { NavDocuments } from "@/src/components/nav-documents";
import { NavMain } from "@/src/components/nav-main";
import { NavSecondary } from "@/src/components/nav-secondary";
import { NavUser } from "@/src/components/nav-user";
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

const data = {
  user: {
    name: "sofiane",
    email: "sofiane@emtimet.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
      icon: IconDashboard,
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
      icon: IconCalendar,
    },
    // {
    //   title: "Favoris",
    //   url: "/dashboard/favoris",
    //   icon: IconHeart,
    // },
    {
      title: "Clients",
      url: "/dashboard/clients",
      icon: IconUsers,
    },
    {
      title: "Catalogues",
      url: "/dashboard/catalogues",
      icon: IconFileWord,
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
      icon: IconUsers,
    },
    {
      title: "Recherche",
      url: "#",
      icon: IconSearch,
    },
    {
      title: "Aide",
      url: "https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL",
      icon: IconHelp,
    },
  ],
  documents: [
    {
      name: "Factures",
      url: "/dashboard/outils/factures",
      icon: IconDatabase,
    },
    {
      name: "Devis",
      url: "/dashboard/outils/devis",
      icon: IconReport,
    },
    {
      name: "Dépenses",
      url: "/dashboard/outils/gestion-depenses",
      icon: IconFileWord,
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { session } = useUser();
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

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      {/* <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                {theme === "dark" ? (
                  <img
                    src="http://localhost:3000/Logo + texte_blanc.svg"
                    alt="Logo newbi (version sombre)"
                    width="100"
                    height="100"
                  />
                ) : (
                  <img
                    src="http://localhost:3000/Logo + texte.svg"
                    alt="Logo newbi (version claire)"
                    width="100"
                    height="100"
                  />
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader> */}
      <SidebarContent className="mt-1">
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user || data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
