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
    {
      title: "Automatisation",
      url: "/dashboard/automatisation",
      icon: IconRobot,
    },
    {
      title: "Collaborateurs",
      url: "/dashboard/collaborateurs",
      icon: IconUsers,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconChartBar,
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
      url: "/dashboard/community",
      icon: IconUsers,
    },
    {
      title: "Recherche",
      url: "#",
      icon: IconSearch,
    },
    {
      title: "Aide",
      url: "/dashboard/help",
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">NewBi.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
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
