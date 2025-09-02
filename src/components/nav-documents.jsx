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
import { useSubscription } from "@/src/contexts/subscription-context";
import { Crown } from "lucide-react";
import { cn } from "@/src/lib/utils";

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
import Link from "next/link";

export function NavDocuments({ items }) {
  const { isMobile } = useSidebar();
  const { isActive } = useSubscription();
  // Initialiser avec seulement Factures par défaut
  const [pinnedApps, setPinnedApps] = useState(items || []);

  // Outils qui nécessitent un abonnement Pro
  const proTools = ["Factures", "Devis", "Transferts de fichiers", "Dépenses"];

  // Available tools that can be pinned
  const availableTools = [
    {
      name: "Factures",
      url: "/dashboard/outils/factures",
      icon: IconReceipt,
      isPro: true,
    },
    {
      name: "Devis",
      url: "/dashboard/outils/devis",
      icon: IconFileText,
      isPro: true,
    },
    {
      name: "Kanban",
      url: "/dashboard/outils/kanban",
      icon: IconLayoutKanban,
      isPro: false,
    },
    {
      name: "Signatures de mail",
      url: "/dashboard/outils/signatures-mail",
      icon: IconMail,
      isPro: false,
    },
    {
      name: "Transferts de fichiers",
      url: "/dashboard/outils/transferts-fichiers",
      icon: IconFileUpload,
      isPro: true,
    },
    {
      name: "Dépenses",
      url: "/dashboard/outils/gestion-depenses",
      icon: IconCreditCard,
      isPro: true,
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
        {pinnedApps.map((item) => {
          const isProTool = item.isPro || proTools.includes(item.name);
          const hasAccess = !isProTool || isActive();
          
          return (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton 
              asChild={hasAccess}
              className={cn(
                "relative",
                !hasAccess && "opacity-60 cursor-not-allowed"
              )}
              disabled={!hasAccess}
            >
              {hasAccess ? (
                <Link href={item.url}>
                  <item.icon />
                  <span className="font-polysans font-light">{item.name}</span>
                </Link>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <item.icon className="size-4" />
                    <span className="font-polysans font-light">{item.name}</span>
                  </div>
                  <Crown className="w-3 h-3 text-[#5b4fff]" />
                </div>
              )}
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
          );
        })}
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
                {availableToPin.map((tool) => {
                  const hasAccess = !tool.isPro || isActive();
                  
                  return (
                    <DropdownMenuItem
                      key={tool.name}
                      onClick={hasAccess ? () => handlePinApp(tool) : undefined}
                      className={cn(
                        "cursor-pointer",
                        !hasAccess && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <tool.icon className="size-4" />
                      <span className="font-polysans font-light">
                        {tool.name}
                      </span>
                      {!hasAccess && (
                        <Crown className="w-3 h-3 ml-auto text-[#5b4fff]" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
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
