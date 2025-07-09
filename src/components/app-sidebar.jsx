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

const data = {
  user: {
    name: "sofiane",
    email: "sofiane@emtimet.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
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
    {
      title: "Favoris",
      url: "/dashboard/favoris",
      icon: IconHeart,
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

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <img
                  src="http://localhost:3000/newbiLogo.png"
                  alt="Logo newbi"
                  //   className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block"
                  width="70"
                  height="70"
                />
                {/* <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">NewBi.</span> */}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
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
