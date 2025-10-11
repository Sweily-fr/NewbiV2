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

export function NavMain({ items }) {
  const pathname = usePathname();
  const { isActive } = useSubscription();
  const { setOpenMobile, isMobile } = useSidebar();
  const [isOutilsOpen, setIsOutilsOpen] = useState(false);

  // Définir les onglets qui nécessitent un abonnement Pro (inclut la période d'essai)
  const proTabs = ["Tableau de bord", "Clients", "Catalogues"];

  // Définir les onglets qui nécessitent un abonnement Pro PAYANT (pas de trial)
  const paidProTabs = [];

  // Définir les sous-outils
  const outilsItems = [
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
                      pathname === "/dashboard/outils" && "text-sidebar-foreground"
                    )}
                  >
                    <LayoutPanelLeft />
                    <span>Outils</span>
                  </SidebarMenuButton>
                </Link>
                <CollapsibleTrigger asChild>
                  <button
                    className="p-2 hover:bg-transparent transition-colors"
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
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            const isProTab = proTabs.includes(item.title);
            const isPaidProTab = paidProTabs.includes(item.title);
            const hasAccess =
              (!isProTab && !isPaidProTab) ||
              (isProTab && isActive()) ||
              (isPaidProTab && isActive(true)); // true = requirePaidSubscription

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
