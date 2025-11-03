"use client";

import { useState } from "react";
import { IconApps, IconCirclePlusFilled, IconMail } from "@tabler/icons-react";
import {
  Crown,
  LayoutPanelLeft,
  ChevronRight,
  FileText,
  FileSignature,
  Mail,
  Trello,
  Upload,
  Receipt,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/src/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import Link from "next/link";
import { cn } from "@/src/lib/utils";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/src/hooks/usePermissions";

export function NavMain({ items, onOpenNotifications, notificationCount = 0 }) {
  const pathname = usePathname();
  const { isActive } = useSubscription();
  const { setOpenMobile, isMobile } = useSidebar();
  const [isOutilsOpen, setIsOutilsOpen] = useState(false);
  const { getUserRole } = usePermissions();
  const userRole = getUserRole();

  // Définir les onglets qui nécessitent un abonnement Pro (inclut la période d'essai)
  const proTabs = ["Tableau de bord", "Clients", "Catalogues"];

  // Définir les onglets qui nécessitent un abonnement Pro PAYANT (pas de trial)
  const paidProTabs = [];

  // Définir les sous-outils
  const allOutilsItems = [
    { title: "Factures", url: "/dashboard/outils/factures", icon: FileText },
    { title: "Devis", url: "/dashboard/outils/devis", icon: FileSignature },
    {
      title: "Signature de mail",
      url: "/dashboard/outils/signatures-mail",
      icon: Mail,
    },
    { title: "Kanban", url: "/dashboard/outils/kanban", icon: Trello },
    {
      title: "Transfert de fichier",
      url: "/dashboard/outils/transferts-fichiers",
      icon: Upload,
    },
    {
      title: "Dépenses",
      url: "/dashboard/outils/gestion-depenses",
      icon: Receipt,
    },
  ];

  // Filtrer les outils selon le rôle
  const outilsItems =
    userRole === "accountant"
      ? allOutilsItems.filter((item) =>
          ["Factures", "Devis", "Dépenses"].includes(item.title)
        )
      : allOutilsItems;

  // Filtrer les items principaux selon le rôle
  const filteredItems =
    userRole === "accountant"
      ? [
          // Pour accountant : Tableau de bord, Boîte de réception, puis les outils financiers
          ...items.filter((item) =>
            ["Tableau de bord", "Boîte de réception"].includes(item.title)
          ),
          // Ajouter les items financiers directement dans la sidebar
          {
            title: "Factures",
            url: "/dashboard/outils/factures",
            icon: FileText,
          },
          {
            title: "Devis",
            url: "/dashboard/outils/devis",
            icon: FileSignature,
          },
          {
            title: "Gestion des dépenses",
            url: "/dashboard/outils/gestion-depenses",
            icon: Receipt,
          },
        ]
      : items;

  // Fonction pour fermer la sidebar sur mobile lors du clic
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2 pt-2">
        <SidebarMenu>
          {/* Masquer le menu Outils pour accountant car les items sont directement dans la sidebar */}
          {userRole !== "accountant" && (
            <Collapsible open={isOutilsOpen} onOpenChange={setIsOutilsOpen}>
              <SidebarMenuItem>
                <div
                  className={cn(
                    "flex items-center w-full rounded-md transition-colors",
                    pathname === "/dashboard/outils" &&
                      "bg-[#F0F0F0] dark:bg-sidebar-accent hover:bg-[#F0F0F0]/90 dark:hover:bg-sidebar-accent/90"
                  )}
                >
                  <Link
                    href="/dashboard/outils"
                    onClick={handleLinkClick}
                    className="flex-1 min-w-0"
                  >
                    <SidebarMenuButton
                      tooltip="Outils"
                      className={cn(
                        "bg-transparent w-full cursor-pointer hover:bg-transparent",
                        pathname === "/dashboard/outils" &&
                          "text-sidebar-foreground"
                      )}
                    >
                      <LayoutPanelLeft />
                      <span>Outils</span>
                    </SidebarMenuButton>
                  </Link>
                  <CollapsibleTrigger asChild>
                    <button
                      className="p-2 hover:bg-transparent transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOutilsOpen && "rotate-90"
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {outilsItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url} onClick={handleLinkClick}>
                            <subItem.icon className="w-3 h-3" />
                            <span className="text-xs">{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}
        </SidebarMenu>
        <SidebarMenu>
          {filteredItems.map((item) => {
            const isProTab = proTabs.includes(item.title);
            const isPaidProTab = paidProTabs.includes(item.title);
            const hasAccess =
              (!isProTab && !isPaidProTab) ||
              (isProTab && isActive()) ||
              (isPaidProTab && isActive(true)); // true = requirePaidSubscription

            // Gérer l'action spéciale pour ouvrir les notifications
            if (item.action === "openNotifications") {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className="bg-transparent w-full cursor-pointer relative"
                    tooltip={item.title}
                    onClick={() => {
                      if (onOpenNotifications) {
                        onOpenNotifications();
                      }
                      handleLinkClick();
                    }}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {notificationCount > 0 && (
                      <kbd className="ml-auto inline-flex items-center justify-center rounded border-y border-b-[#5b4eff]/30 border-t-[#5b4eff]/10 bg-[#5b4eff]/20 px-1 font-sans text-[10px] text-[#5b4eff] ring-1 ring-[#5b4eff]/20 dark:border-b-[#5b4eff]/40 dark:border-t-transparent dark:bg-[#5b4eff]/20 dark:text-[#5b4eff] dark:ring-[#5b4eff]/30 h-4 min-w-4">
                        {notificationCount}
                      </kbd>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <Link
                  href={hasAccess ? item.url : "#"}
                  className="w-full"
                  onClick={hasAccess ? handleLinkClick : undefined}
                >
                  <SidebarMenuButton
                    className={cn(
                      "bg-transparent w-full cursor-pointer relative",
                      !hasAccess && "opacity-60 cursor-not-allowed",
                      (pathname === item.url ||
                        (item.url !== "/dashboard" &&
                          pathname?.startsWith(item.url + "/"))) &&
                        "bg-[#F0F0F0] dark:bg-sidebar-accent hover:bg-[#F0F0F0]/90 dark:hover:bg-sidebar-accent/90 active:bg-[#F0F0F0] dark:active:bg-sidebar-accent text-sidebar-foreground min-w-8 duration-200 ease-linear"
                    )}
                    tooltip={
                      (isProTab || isPaidProTab) && !hasAccess
                        ? `${item.title} - Fonctionnalité Pro`
                        : item.title
                    }
                    disabled={!hasAccess}
                  >
                    {item.icon && <item.icon />}
                    <span className="">{item.title}</span>
                    {(isProTab || isPaidProTab) && !hasAccess && (
                      <Crown className="w-3 h-3 ml-auto text-[#5b4fff]" />
                    )}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
