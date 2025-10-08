"use client";

import { IconApps, IconCirclePlusFilled, IconMail } from "@tabler/icons-react";
import { Crown, LayoutPanelLeft } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import Link from "next/link";
import { cn } from "@/src/lib/utils";
import { usePathname } from "next/navigation";

export function NavMain({ items }) {
  const pathname = usePathname();
  const { isActive } = useSubscription();
  const { setOpenMobile, isMobile } = useSidebar();

  // Définir les onglets qui nécessitent un abonnement Pro (inclut la période d'essai)
  const proTabs = ["Tableau de bord", "Clients", "Catalogues"];
  
  // Définir les onglets qui nécessitent un abonnement Pro PAYANT (pas de trial)
  const paidProTabs = [];
  
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
          <SidebarMenuItem className="flex items-center gap-2">
            <Link href={"/dashboard/outils"} className="w-full" onClick={handleLinkClick}>
              <SidebarMenuButton
                tooltip="Apps"
                className={cn(
                  "bg-transparent w-full cursor-pointer",
                  pathname === "/dashboard/outils" &&
                    "bg-[#F0F0F0] hover:bg-[#F0F0F0]/90 active:bg-[#F0F0F0] text-black min-w-8 duration-200 ease-linear"
                )}
                //className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <LayoutPanelLeft />
                <span className="">Outils</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            const isProTab = proTabs.includes(item.title);
            const isPaidProTab = paidProTabs.includes(item.title);
            const hasAccess = (!isProTab && !isPaidProTab) || 
                             (isProTab && isActive()) || 
                             (isPaidProTab && isActive(true)); // true = requirePaidSubscription

            return (
              <SidebarMenuItem key={item.title}>
                <Link href={hasAccess ? item.url : "#"} className="w-full" onClick={hasAccess ? handleLinkClick : undefined}>
                  <SidebarMenuButton
                    className={cn(
                      "bg-transparent w-full cursor-pointer relative",
                      !hasAccess && "opacity-60 cursor-not-allowed",
                      (pathname === item.url ||
                        (item.url !== "/dashboard" &&
                          pathname?.startsWith(item.url + "/"))) &&
                        "bg-[#F0F0F0] hover:bg-[#F0F0F0]/90 active:bg-[#F0F0F0] text-black min-w-8 duration-200 ease-linear"
                    )}
                    tooltip={
                      (isProTab || isPaidProTab) && !hasAccess
                        ? `${item.title} - Fonctionnalité Pro`
                        : item.title
                    }
                    disabled={!hasAccess}
                  >
                    {item.icon && <item.icon />}
                    <span className="">
                      {item.title}
                    </span>
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
