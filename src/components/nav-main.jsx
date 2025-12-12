"use client";

import React, { useState, useEffect } from "react";
import {
  IconApps,
  IconCirclePlusFilled,
  IconReceipt,
  IconFileText,
  IconLayoutKanban,
  IconMail,
  IconFileUpload,
  IconCreditCard,
} from "@tabler/icons-react";
import {
  Crown,
  LayoutPanelLeft,
  ChevronRight,
  ShoppingCart,
  Receipt,
  FileText,
  Users,
  Package,
  Plus,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import Link from "next/link";
import { cn } from "@/src/lib/utils";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/src/hooks/usePermissions";

export function NavMain({ items, onOpenNotifications, notificationCount = 0 }) {
  const pathname = usePathname();
  const { isActive } = useSubscription();
  const { setOpenMobile, isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { getUserRole } = usePermissions();
  const userRole = getUserRole();

  // Définir les onglets qui nécessitent un abonnement Pro (inclut la période d'essai)
  const proTabs = ["Tableau de bord", "Clients", "Catalogues", "Transactions"];

  // Définir les onglets qui nécessitent un abonnement Pro PAYANT (pas de trial)
  const paidProTabs = [];

  // Définir les sous-liens de Ventes
  const ventesItems = [
    {
      title: "Factures clients",
      url: "/dashboard/outils/factures",
      isPro: true,
    },
    {
      title: "Devis",
      url: "/dashboard/outils/devis",
      isPro: true,
    },
    {
      title: "Liste client (CRM)",
      url: "/dashboard/clients",
      isPro: true,
    },
    {
      title: "Catalogues",
      url: "/dashboard/catalogues",
      isPro: true,
    },
  ];

  // Définir les sous-outils (sans Factures, Devis et Transactions qui sont dans les liens principaux)
  const allOutilsItems = [
    {
      title: "Signature de mail",
      url: "/dashboard/outils/signatures-mail",
      icon: IconMail,
      isPro: false,
    },
    {
      title: "Projets",
      url: "/dashboard/outils/kanban",
      icon: IconLayoutKanban,
      isPro: false,
    },
    {
      title: "Transfert de fichier",
      url: "/dashboard/outils/transferts-fichiers",
      icon: IconFileUpload,
      isPro: true,
    },
  ];

  // Filtrer les outils selon le rôle (tous les outils restants sont accessibles)
  const outilsItems = allOutilsItems;

  // Vérifier si un sous-lien de Ventes est actif
  const isVentesSubActive = ventesItems.some(
    (item) => pathname === item.url || pathname?.startsWith(item.url + "/")
  );

  // Vérifier si un sous-lien d'Outils est actif
  const isOutilsSubActive = outilsItems.some(
    (item) => pathname === item.url || pathname?.startsWith(item.url + "/")
  );

  // États pour les menus collapsibles
  const [isOutilsOpen, setIsOutilsOpen] = useState(isOutilsSubActive);
  const [isVentesOpen, setIsVentesOpen] = useState(isVentesSubActive);

  // Garder les menus ouverts si un sous-lien est actif (quand le pathname change)
  useEffect(() => {
    if (isOutilsSubActive) {
      setIsOutilsOpen(true);
    }
  }, [isOutilsSubActive]);

  useEffect(() => {
    if (isVentesSubActive) {
      setIsVentesOpen(true);
    }
  }, [isVentesSubActive]);

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
            icon: IconReceipt,
          },
          {
            title: "Devis",
            url: "/dashboard/outils/devis",
            icon: IconFileText,
          },
          {
            title: "Transactions",
            url: "/dashboard/outils/transactions",
            icon: IconCreditCard,
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
          {/* Menu Outils - Premier dans l'ordre */}
          {userRole !== "accountant" &&
            (isCollapsed ? (
              // Mode rétréci : utiliser un dropdown
              <DropdownMenu>
                <SidebarMenuItem>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Outils"
                      className={cn(
                        "bg-transparent w-full cursor-pointer",
                        isOutilsSubActive &&
                          "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground"
                      )}
                    >
                      <LayoutPanelLeft />
                      <span>Outils</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className="min-w-[180px]"
                  >
                    {outilsItems.map((subItem) => {
                      const isSubActive =
                        pathname === subItem.url ||
                        pathname?.startsWith(subItem.url + "/");
                      const hasSubAccess = !subItem.isPro || isActive();
                      return (
                        <DropdownMenuItem
                          key={subItem.title}
                          asChild={hasSubAccess}
                          disabled={!hasSubAccess}
                          className={cn(
                            !hasSubAccess && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          {hasSubAccess ? (
                            <Link
                              href={subItem.url}
                              onClick={handleLinkClick}
                              className={cn(
                                "cursor-pointer",
                                isSubActive && "bg-accent font-medium"
                              )}
                            >
                              {subItem.title}
                            </Link>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span>{subItem.title}</span>
                              <Crown className="w-3 h-3 text-[#5b4fff]" />
                            </div>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </SidebarMenuItem>
              </DropdownMenu>
            ) : (
              // Mode étendu : utiliser un collapsible
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
                      {outilsItems.map((subItem) => {
                        const isSubActive =
                          pathname === subItem.url ||
                          pathname?.startsWith(subItem.url + "/");
                        const hasSubAccess = !subItem.isPro || isActive();
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild={hasSubAccess}
                              isActive={isSubActive && hasSubAccess}
                              className={cn(
                                !hasSubAccess && "opacity-60 cursor-not-allowed"
                              )}
                            >
                              {hasSubAccess ? (
                                <Link
                                  href={subItem.url}
                                  onClick={handleLinkClick}
                                  className={cn(
                                    isSubActive &&
                                      "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground font-medium"
                                  )}
                                >
                                  <span className="text-sm">
                                    {subItem.title}
                                  </span>
                                </Link>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-sm">
                                    {subItem.title}
                                  </span>
                                  <Crown className="w-3 h-3 text-[#5b4fff]" />
                                </div>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
        </SidebarMenu>
        <SidebarMenu>
          {filteredItems.map((item, index) => {
            const isProTab = proTabs.includes(item.title);
            const isPaidProTab = paidProTabs.includes(item.title);
            const hasAccess =
              (!isProTab && !isPaidProTab) ||
              (isProTab && isActive()) ||
              (isPaidProTab && isActive(true)); // true = requirePaidSubscription

            // Insérer le menu Ventes après Transactions (index 1)
            const renderVentesMenu = () =>
              isCollapsed ? (
                // Mode rétréci : utiliser un dropdown
                <DropdownMenu key="ventes-menu">
                  <SidebarMenuItem>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Ventes"
                        className={cn(
                          "bg-transparent w-full cursor-pointer",
                          isVentesSubActive &&
                            "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground"
                        )}
                      >
                        <ShoppingCart />
                        <span>Ventes</span>
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="right"
                      align="start"
                      className="min-w-[180px]"
                    >
                      <DropdownMenuItem
                        asChild={isActive()}
                        disabled={!isActive()}
                        className={cn(
                          !isActive() && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {isActive() ? (
                          <Link
                            href="/dashboard/outils/factures/new"
                            onClick={handleLinkClick}
                            className="cursor-pointer font-normal flex justify-between w-full"
                          >
                            <span>Nouvelle facture</span>
                            <Plus className="h-4 w-4" />
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span>Nouvelle facture</span>
                            <Crown className="w-3 h-3 text-[#5b4fff]" />
                          </div>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild={isActive()}
                        disabled={!isActive()}
                        className={cn(
                          !isActive() && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {isActive() ? (
                          <Link
                            href="/dashboard/outils/devis/new"
                            onClick={handleLinkClick}
                            className="cursor-pointer font-normal flex justify-between w-full"
                          >
                            <span>Nouveau devis</span>
                            <Plus className="h-4 w-4" />
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span>Nouveau devis</span>
                            <Crown className="w-3 h-3 text-[#5b4fff]" />
                          </div>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {ventesItems.map((subItem) => {
                        const isSubActive =
                          pathname === subItem.url ||
                          pathname?.startsWith(subItem.url + "/");
                        const hasSubAccess = !subItem.isPro || isActive();
                        return (
                          <DropdownMenuItem
                            key={subItem.title}
                            asChild={hasSubAccess}
                            disabled={!hasSubAccess}
                            className={cn(
                              !hasSubAccess && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            {hasSubAccess ? (
                              <Link
                                href={subItem.url}
                                onClick={handleLinkClick}
                                className={cn(
                                  "cursor-pointer",
                                  isSubActive && "bg-accent font-medium"
                                )}
                              >
                                {subItem.title}
                              </Link>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span>{subItem.title}</span>
                                <Crown className="w-3 h-3 text-[#5b4fff]" />
                              </div>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </SidebarMenuItem>
                </DropdownMenu>
              ) : (
                // Mode étendu : utiliser un collapsible
                <Collapsible
                  key="ventes-menu"
                  open={isVentesOpen}
                  onOpenChange={setIsVentesOpen}
                >
                  <SidebarMenuItem>
                    <div
                      className={cn(
                        "flex items-center w-full rounded-md transition-colors",
                        isVentesSubActive &&
                          "bg-[#F0F0F0] dark:bg-sidebar-accent hover:bg-[#F0F0F0]/90 dark:hover:bg-sidebar-accent/90"
                      )}
                    >
                      <SidebarMenuButton
                        tooltip="Ventes"
                        className={cn(
                          "bg-transparent w-full cursor-pointer hover:bg-transparent",
                          isVentesSubActive && "text-sidebar-foreground"
                        )}
                        onClick={() => setIsVentesOpen(!isVentesOpen)}
                      >
                        <ShoppingCart />
                        <span>Ventes</span>
                      </SidebarMenuButton>
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
                              isVentesOpen && "rotate-90"
                            )}
                          />
                        </button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {ventesItems.map((subItem) => {
                          const isSubActive =
                            pathname === subItem.url ||
                            pathname?.startsWith(subItem.url + "/");
                          const hasSubAccess = !subItem.isPro || isActive();
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild={hasSubAccess}
                                isActive={isSubActive && hasSubAccess}
                                className={cn(
                                  !hasSubAccess &&
                                    "opacity-60 cursor-not-allowed"
                                )}
                              >
                                {hasSubAccess ? (
                                  <Link
                                    href={subItem.url}
                                    onClick={handleLinkClick}
                                    className={cn(
                                      isSubActive &&
                                        "bg-[#F0F0F0] dark:bg-sidebar-accent text-sidebar-foreground font-medium"
                                    )}
                                  >
                                    <span className="text-sm">
                                      {subItem.title}
                                    </span>
                                  </Link>
                                ) : (
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-sm">
                                      {subItem.title}
                                    </span>
                                    <Crown className="w-3 h-3 text-[#5b4fff]" />
                                  </div>
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );

            // Gérer l'action spéciale pour ouvrir les notifications
            if (item.action === "openNotifications") {
              return (
                <React.Fragment key={item.title}>
                  <SidebarMenuItem>
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
                </React.Fragment>
              );
            }

            // Insérer Ventes après Transactions (index 1)
            const shouldInsertVentes =
              item.title === "Transactions" && userRole !== "accountant";

            return (
              <React.Fragment key={item.title}>
                <SidebarMenuItem>
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
                {shouldInsertVentes && renderVentesMenu()}
              </React.Fragment>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
