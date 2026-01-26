"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@tabler/icons-react";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
// DÉSACTIVÉ: SuperPDP API pas encore active
// import { useEInvoicingSettings } from "@/src/hooks/useEInvoicing";
import {
  Crown,
  Settings2,
  Trash,
  Settings,
  Users,
  Sparkles,
  MessageCircleQuestionMark,
  GraduationCap,
  UsersRound,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { SettingsModal } from "@/src/components/settings-modal";
// DÉSACTIVÉ: SuperPDP API pas encore active
// import { EInvoicingPromoModal } from "@/src/components/e-invoicing-promo-modal";

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
  IconDots,
  IconFolder,
  IconTrash,
  IconSettings,
  IconRobot,
  IconUsers,
} from "@tabler/icons-react";

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
  const isCollapsed = state === "collapsed";
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
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
          align="start"
          sideOffset={8}
        >
          <DropdownMenuItem
            className="cursor-pointer flex-col items-start gap-1"
            asChild
          >
            <a
              href="https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex items-center gap-2 w-full">
                <HelpCircle className="h-4 w-4" />
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
              <UsersRound className="h-4 w-4" />
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
              href="https://newbi.academy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex items-center gap-2 w-full">
                <GraduationCap className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-normal text-sm">Newbi Academy</span>
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
              setSettingsInitialTab("preferences");
              setSettingsModalOpen(true);
            }}
          >
            <Settings2 />
            <span className="">Paramètres entreprise</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(
              "cursor-pointer",
              !isActive() && "opacity-60 cursor-not-allowed"
            )}
            onClick={() => {
              // Toujours ouvrir le modal sur l'onglet espaces
              setSettingsInitialTab("espaces");
              setSettingsModalOpen(true);
            }}
          >
            {isActive() ? (
              <>
                <IconUsers />
                <span className="">Collaborateurs</span>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <IconUsers />
                  <span className="">Collaborateurs</span>
                </div>
                <Crown className="w-3 h-3 text-[#5b4fff]" />
              </div>
            )}
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
  onOpenEInvoicingPromo, // DÉSACTIVÉ: SuperPDP API pas encore active
  ...props
}) {
  const [open, setOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  // DÉSACTIVÉ: SuperPDP API pas encore active
  // const [eInvoicingPromoOpen, setEInvoicingPromoOpen] = useState(false);
  const { isActive } = useSubscription();
  // DÉSACTIVÉ: SuperPDP API pas encore active
  // const { settings: eInvoicingSettings } = useEInvoicingSettings();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // DÉSACTIVÉ: SuperPDP API pas encore active
  // Vérifier si la facturation électronique est activée
  // const isEInvoicingEnabled = eInvoicingSettings?.eInvoicingEnabled;

  // Fonction pour fermer la sidebar sur mobile lors du clic
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        {/* DÉSACTIVÉ: SuperPDP API pas encore active */}
        {/* Bouton Facturation électronique (Sparkles) - visible uniquement pour les abonnés ET si non activée */}
        {/* {isActive() && !isEInvoicingEnabled && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="cursor-pointer"
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
                <Sparkles className="text-[#5b4eff]" />
                <span>Facturation électronique</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )} */}

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
                            new Event("open-search-command")
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

        {/* DÉSACTIVÉ: SuperPDP API pas encore active */}
        {/* Modal de promotion facturation électronique */}
        {/* <EInvoicingPromoModal
          open={eInvoicingPromoOpen}
          onOpenChange={setEInvoicingPromoOpen}
        /> */}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
