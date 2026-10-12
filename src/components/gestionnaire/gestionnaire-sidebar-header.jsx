"use client";

import Link from "next/link";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar";
import { useAccountManager } from "@/src/hooks/useAccountManager";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";

/**
 * En-tête de la barre latérale dans l'espace gestionnaire : même rendu que
 * le sélecteur d'espace (TeamSwitcher), avec le cabinet à la place de
 * l'organisation active. Le changement de dossier passe par le sélecteur
 * de l'en-tête de page.
 */
export function GestionnaireSidebarHeader() {
  const manager = useAccountManager();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          className={isCollapsed ? "justify-center" : ""}
        >
          <Link href={GESTIONNAIRE_PATH}>
            <img
              src="/newbi.svg"
              alt="Newbi"
              className={
                isCollapsed ? "size-8 rounded-md" : "size-7 rounded-md"
              }
            />
            {!isCollapsed && (
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-sm text-foreground">
                  {manager?.name || "Espace gestionnaire"}
                </span>
                <span className="truncate text-xs font-normal">
                  Espace gestionnaire
                </span>
              </div>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
