"use client";

import { useState, useEffect } from "react";
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
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
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
import { usePathname } from "next/navigation";

export function NavDocuments({ items }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { isActive } = useSubscription();
  const pathname = usePathname();
  
  // Fonction pour fermer la sidebar sur mobile lors du clic
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  // Initialiser avec seulement Factures par défaut
  const [pinnedApps, setPinnedApps] = useState(items || []);
  const [isLoaded, setIsLoaded] = useState(false);

  // Outils qui nécessitent un abonnement Pro
  const proTools = ["Factures", "Devis", "Transferts de fichiers", "Dépenses"];

  // Icon mapping for localStorage serialization
  const iconMap = {
    'IconReceipt': IconReceipt,
    'IconFileText': IconFileText,
    'IconLayoutKanban': IconLayoutKanban,
    'IconMail': IconMail,
    'IconFileUpload': IconFileUpload,
    'IconCreditCard': IconCreditCard,
  };

  // Available tools that can be pinned
  const availableTools = [
    {
      name: "Factures",
      url: "/dashboard/outils/factures",
      icon: IconReceipt,
      iconName: 'IconReceipt',
      isPro: true,
    },
    {
      name: "Devis",
      url: "/dashboard/outils/devis",
      icon: IconFileText,
      iconName: 'IconFileText',
      isPro: true,
    },
    {
      name: "Kanban",
      url: "/dashboard/outils/kanban",
      icon: IconLayoutKanban,
      iconName: 'IconLayoutKanban',
      isPro: false,
    },
    {
      name: "Signatures de mail",
      url: "/dashboard/outils/signatures-mail",
      icon: IconMail,
      iconName: 'IconMail',
      isPro: false,
    },
    {
      name: "Transferts de fichiers",
      url: "/dashboard/outils/transferts-fichiers",
      icon: IconFileUpload,
      iconName: 'IconFileUpload',
      isPro: true,
    },
    {
      name: "Dépenses",
      url: "/dashboard/outils/gestion-depenses",
      icon: IconCreditCard,
      iconName: 'IconCreditCard',
      isPro: true,
    },
  ];

  // Load pinned apps from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedApps = localStorage.getItem('newbi-pinned-apps');
        if (savedApps) {
          const parsedApps = JSON.parse(savedApps);
          // Restore icon components from iconName
          const validApps = parsedApps
            .filter(app => app.name && app.url && app.iconName)
            .map(app => ({
              ...app,
              icon: iconMap[app.iconName] || IconReceipt // fallback icon
            }));
          if (validApps.length > 0) {
            setPinnedApps(validApps);
          }
        }
      } catch (error) {
        console.error('Error loading pinned apps from localStorage:', error);
        // Fallback to default items if localStorage is corrupted
        setPinnedApps(items || []);
      }
      setIsLoaded(true);
    }
  }, [items]);

  // Save pinned apps to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        // Serialize apps with iconName instead of icon component
        const appsToSave = pinnedApps.map(app => ({
          name: app.name,
          url: app.url,
          iconName: app.iconName,
          isPro: app.isPro
        }));
        localStorage.setItem('newbi-pinned-apps', JSON.stringify(appsToSave));
      } catch (error) {
        console.error('Error saving pinned apps to localStorage:', error);
      }
    }
  }, [pinnedApps, isLoaded]);

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
      <SidebarGroupLabel className="font-normal">
        Mes apps
      </SidebarGroupLabel>
      <SidebarMenu>
        {pinnedApps.map((item) => {
          const isProTool = item.isPro || proTools.includes(item.name);
          const hasAccess = !isProTool || isActive();
          
          // Vérifier si le lien est actif
          const isActiveLink = pathname === item.url || 
            (item.url !== "/dashboard" && pathname?.startsWith(item.url + "/"));
          
          return (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton 
              asChild={hasAccess}
              className={cn(
                "relative",
                !hasAccess && "opacity-60 cursor-not-allowed",
                isActiveLink && hasAccess && "bg-[#F0F0F0] dark:bg-sidebar-accent hover:bg-[#F0F0F0]/90 dark:hover:bg-sidebar-accent/90 active:bg-[#F0F0F0] dark:active:bg-sidebar-accent text-sidebar-foreground min-w-8 duration-200 ease-linear"
              )}
              disabled={!hasAccess}
            >
              {hasAccess ? (
                <Link href={item.url} onClick={handleLinkClick}>
                  <item.icon />
                  <span className="">{item.name}</span>
                </Link>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <item.icon className="size-4" />
                    <span className="">{item.name}</span>
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
                  <a href={item.url} onClick={handleLinkClick}>
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
                  <span className="font-normal">
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
                      <span className="">
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
