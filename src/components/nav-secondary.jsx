"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { useEInvoicingSettings } from "@/src/hooks/useEInvoicing";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import {
  Crown,
  Settings2,
  Trash,
  Users,
  Sparkles,
  GraduationCap,
  UsersRound,
  HelpCircle,
} from "lucide-react";
import {
  DirectNormalIcon as Bell,
  SettingIcon as Settings,
  MessagesIcon as MessageCircleQuestionMark,
  Setting5Icon,
  PeopleIcon,
  LampOnIcon,
  TeacherIcon,
  BookIcon,
} from "@/src/components/icons";
import { cn } from "@/src/lib/utils";
import { useUser } from "@/src/lib/auth/hooks";
import { SettingsModal } from "@/src/components/settings-modal";
import { EInvoicingPromoModal } from "@/src/components/e-invoicing-promo-modal";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupContent,
  useSidebar,
} from "@/src/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

// Composant pour le menu Aide et support avec dropdown
function HelpDropdownMenu({ onCommunityClick }) {
  const { isMobile, setOpenMobile, state } = useSidebar();
  const { session } = useUser();
  const isCollapsed = state === "collapsed";
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const buildMailtoLink = () => {
    const to = "contact@newbi.fr";
    const subject = encodeURIComponent("Demande d'aide - Newbi");
    const userEmail = session?.user?.email;
    const body = userEmail
      ? encodeURIComponent(`\n\n---\nEnvoyé depuis : ${userEmail}`)
      : "";
    return `mailto:${to}?subject=${subject}${body ? `&body=${body}` : ""}`;
  };

  return (
    <SidebarMenuItem key={"help"}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            className="mb-1 cursor-pointer"
            tooltip="Aide et support"
          >
            <MessageCircleQuestionMark />
            <span>Aide et support</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[280px] rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={8}
        >
          <DropdownMenuItem
            className="cursor-pointer flex-col items-start gap-1"
            asChild
          >
            <a href={buildMailtoLink()}>
              <div className="flex items-center gap-2 w-full">
                <LampOnIcon className="h-4 w-4 text-sidebar-foreground" />
                <div className="flex flex-col">
                  <span className="font-normal text-sm">Aide</span>
                  <span className="text-xs text-muted-foreground">
                    Besoin d'aide ? Contactez-nous
                  </span>
                </div>
              </div>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer flex-col items-start gap-1"
            onClick={(e) => {
              e.preventDefault();
              if (onCommunityClick) {
                onCommunityClick();
              }
              handleLinkClick();
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <TeacherIcon className="h-4 w-4 text-sidebar-foreground" />
              <div className="flex flex-col">
                <span className="font-normal text-sm">Communauté</span>
                <span className="text-xs text-muted-foreground">
                  Rejoignez notre communauté
                </span>
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer flex-col items-start gap-1"
            asChild
          >
            <a
              href="https://docs.newbi.fr"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex items-center gap-2 w-full">
                <BookIcon className="h-4 w-4 text-sidebar-foreground" />
                <div className="flex flex-col">
                  <span className="font-normal text-sm">Documentation</span>
                  <span className="text-xs text-muted-foreground">
                    Formations et tutoriels
                  </span>
                </div>
              </div>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

// Composant pour le menu Paramètres avec dropdown
function SettingsDropdownMenu() {
  const { isActive } = useSubscription();
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [open, setOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("preferences");

  return (
    <SidebarMenuItem key={"settings"}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            className="mb-1 cursor-pointer"
            tooltip="Paramètres"
          >
            <Settings />
            <span className="">Paramètres</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[200px] rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="start"
          sideOffset={8}
        >
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setSettingsInitialTab("generale");
              setSettingsModalOpen(true);
            }}
          >
            <Setting5Icon className="size-4 text-sidebar-foreground" />
            <span className="text-[13px]">Paramètres entreprise</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setSettingsInitialTab("espaces");
              setSettingsModalOpen(true);
            }}
          >
            <PeopleIcon className="size-4 text-sidebar-foreground" />
            <span className="text-[13px]">Collaborateurs</span>
          </DropdownMenuItem>

          {/* <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={"/dashboard/automatisation"}>
              <IconRobot />
              <span className="">Intégrations</span>
            </Link>
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialTab={settingsInitialTab}
      />
    </SidebarMenuItem>
  );
}

export function NavSecondary({
  items,
  onCommunityClick,
  onOpenEInvoicingPromo,
  onOpenNotifications,
  notificationCount = 0,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [eInvoicingPromoOpen, setEInvoicingPromoOpen] = useState(false);
  const { isActive } = useSubscription();
  const { isInTrial } = useSubscriptionAccess();
  const { settings: eInvoicingSettings } = useEInvoicingSettings();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Vérifier si la facturation électronique est activée
  const isEInvoicingEnabled = eInvoicingSettings?.eInvoicingEnabled;

  // Fonction pour fermer la sidebar sur mobile lors du clic
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        {/* Facturation électronique - réservée aux abonnés PAYANTS
            (masqué en période d'essai) ET si non activée.
            Sidebar expanded : card outline avec titre + sous-titre.
            Sidebar collapsed : icône Sparkles avec tooltip. */}
        {isActive() &&
          !isInTrial &&
          !isEInvoicingEnabled &&
          (isCollapsed ? (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="mb-3 cursor-pointer border border-[#5b50FF]/40 bg-[#5b50FF]/5 shadow-sm text-[#5b50FF] [&>svg]:text-[#5b50FF] hover:bg-[#5b50FF]/5 hover:text-[#5b50FF] active:bg-[#5b50FF]/5 active:text-[#5b50FF] data-[hovered]:bg-[#5b50FF]/5! data-[hovered]:text-[#5b50FF]!"
                  tooltip="Facturation électronique"
                  onClick={() => {
                    if (onOpenEInvoicingPromo) {
                      onOpenEInvoicingPromo();
                    } else {
                      setEInvoicingPromoOpen(true);
                    }
                    handleLinkClick();
                  }}
                >
                  <Sparkles />
                  <span>Facturation électronique</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <div className="px-2 mb-3 mt-1">
              <button
                type="button"
                onClick={() => {
                  if (onOpenEInvoicingPromo) {
                    onOpenEInvoicingPromo();
                  } else {
                    setEInvoicingPromoOpen(true);
                  }
                  handleLinkClick();
                }}
                className="w-full text-left border border-[#5b50FF]/40 bg-[#5b50FF]/5 rounded-lg px-3 py-2.5 shadow-sm cursor-pointer"
              >
                <p className="text-sm font-medium text-foreground leading-tight">
                  Facturation électronique
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  Activez Factur-X et préparez-vous à l'obligation de septembre
                  2026.
                </p>
              </button>
            </div>
          ))}

        {/* Notifications */}
        <SidebarMenu>
          <SidebarMenuItem className="relative">
            <SidebarMenuButton
              className="mb-1 cursor-pointer"
              tooltip="Notifications"
              onClick={() => {
                if (onOpenNotifications) onOpenNotifications();
                handleLinkClick();
              }}
            >
              <Bell />
              <span>Notifications</span>
              {!isCollapsed && notificationCount > 0 && (
                <kbd className="ml-auto inline-flex items-center justify-center rounded border-y border-b-[#5b4eff]/30 border-t-[#5b4eff]/10 bg-[#5b4eff]/20 px-1 font-sans text-[10px] text-[#5b4eff] ring-1 ring-[#5b4eff]/20 h-4 min-w-4">
                  {notificationCount}
                </kbd>
              )}
            </SidebarMenuButton>
            {isCollapsed && notificationCount > 0 && (
              <kbd className="absolute top-0 right-0 inline-flex items-center justify-center rounded border-y border-b-[#5b4eff]/30 border-t-[#5b4eff]/10 bg-[#5b4eff]/20 px-1 font-sans text-[10px] text-[#5b4eff] ring-1 ring-[#5b4eff]/20 h-4 min-w-4">
                {notificationCount > 9 ? "9+" : notificationCount}
              </kbd>
            )}
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Menu Paramètres avec dropdown */}
        <SidebarMenu>
          <SettingsDropdownMenu />
        </SidebarMenu>

        {/* Menu Aide et support avec dropdown */}
        <SidebarMenu>
          <HelpDropdownMenu onCommunityClick={onCommunityClick} />
        </SidebarMenu>

        {/* /// */}
        <SidebarMenu>
          {items.map((item) => {
            // Filtrer les items Communauté et Aide (maintenant dans les dropdowns)
            if (item.title === "Communauté" || item.title === "Aide") {
              return null;
            }

            const hasAccess = true;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild={hasAccess}
                  disabled={!hasAccess}
                  tooltip={item.title}
                  className={cn(!hasAccess && "opacity-60 cursor-not-allowed")}
                >
                  {hasAccess ? (
                    <a
                      href={item.url}
                      onClick={(e) => {
                        if (item.title === "Recherche") {
                          e.preventDefault();
                          // Déclencher l'événement personnalisé pour ouvrir la recherche
                          window.dispatchEvent(
                            new Event("open-search-command"),
                          );
                        } else if (item.title === "Communauté") {
                          e.preventDefault();
                          // Ouvrir la sidebar communautaire
                          if (onCommunityClick) {
                            onCommunityClick();
                          }
                        }
                        handleLinkClick();
                      }}
                    >
                      <item.icon />
                      <span className="">{item.title}</span>
                    </a>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span className="">{item.title}</span>
                      </div>
                      <Crown className="w-3 h-3 text-[#5b4fff]" />
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        {/* Modal de promotion facturation électronique */}
        <EInvoicingPromoModal
          open={eInvoicingPromoOpen}
          onOpenChange={setEInvoicingPromoOpen}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
