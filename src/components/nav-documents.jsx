"use client";

import { useState } from "react";
import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  IconPlus,
  IconReceipt,
  IconFileText,
  IconLayoutKanban,
  IconMail,
  IconFileUpload,
  IconCreditCard,
} from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar";

export function NavDocuments({ items }) {
  const { isMobile } = useSidebar();
  const [pinnedApps, setPinnedApps] = useState(items || []);

  // Available tools that can be pinned
  const availableTools = [
    {
      name: "Factures",
      url: "/dashboard/outils/factures",
      icon: IconReceipt,
    },
    {
      name: "Devis",
      url: "/dashboard/outils/devis",
      icon: IconFileText,
    },
    {
      name: "Kanban",
      url: "/dashboard/outils/kanban",
      icon: IconLayoutKanban,
    },
    {
      name: "Signatures de mail",
      url: "/dashboard/outils/signatures-mail",
      icon: IconMail,
    },
    {
      name: "Transferts de fichiers",
      url: "/dashboard/outils/transferts-fichiers",
      icon: IconFileUpload,
    },
    {
      name: "Dépenses",
      url: "/dashboard/outils/gestion-depenses",
      icon: IconCreditCard,
    },
  ];

  // Filter out already pinned apps
  const availableToPin = availableTools.filter(
    (tool) => !pinnedApps.some((app) => app.url === tool.url)
  );

  const handlePinApp = (tool) => {
    if (pinnedApps.length < 3) {
      setPinnedApps([...pinnedApps, tool]);
    }
  };

  const handleUnpinApp = (appUrl) => {
    setPinnedApps(pinnedApps.filter((app) => app.url !== appUrl));
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="font-polysans font-normal">
        Mes apps
      </SidebarGroupLabel>
      <SidebarMenu>
        {pinnedApps.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span className="font-polysans font-light">{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                >
                  <IconDots />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-32 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem asChild>
                  <a href={item.url}>
                    <IconFolder />
                    <span>Accéder</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleUnpinApp(item.url)}
                >
                  <IconTrash />
                  <span>Supprimer</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        {pinnedApps.length < 3 && availableToPin.length > 0 && (
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="text-sidebar-foreground/70">
                  <IconPlus className="text-sidebar-foreground/70" />
                  <span className="font-polysans font-normal">
                    Ajouter une app
                  </span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                {availableToPin.map((tool) => (
                  <DropdownMenuItem
                    key={tool.name}
                    onClick={() => handlePinApp(tool)}
                  >
                    <tool.icon className="size-4" />
                    <span className="font-polysans font-light">
                      {tool.name}
                    </span>
                  </DropdownMenuItem>
                ))}
                {pinnedApps.length >= 3 && (
                  <DropdownMenuItem disabled>
                    <span className="text-xs text-muted-foreground">
                      Maximum 3 apps épinglées
                    </span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
