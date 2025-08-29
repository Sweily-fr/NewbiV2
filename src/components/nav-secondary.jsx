"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupContent,
} from "@/src/components/ui/sidebar";

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

// Composant pour le menu Paramètres avec dropdown
function SettingsDropdownMenu() {
  const [open, setOpen] = useState(false);

  return (
    <SidebarMenuItem key={"settings"}>
      <SidebarMenuButton
        className="mb-1 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <IconSettings />
        <span className="font-polysans font-light">Paramètres</span>
      </SidebarMenuButton>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            showOnHover
            className="data-[state=open]:bg-accent rounded-sm"
          >
            <IconDots />
            <span className="sr-only">Plus</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[200px] rounded-lg"
          side="bottom"
          align="start"
        >
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={"/dashboard/settings"}>
              <IconFolder />
              <span className="font-polysans font-light">
                Paramètres entreprise
              </span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={"/dashboard/collaborateurs"}>
              <IconUsers />
              <span className="font-polysans font-light">Collaborateurs</span>
            </Link>
          </DropdownMenuItem>

          {/* <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={"/dashboard/automatisation"}>
              <IconRobot />
              <span className="font-polysans font-light">Intégrations</span>
            </Link>
          </DropdownMenuItem> */}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            asChild
          >
            <Link href={"/dashboard/settings/delete-account"}>
              <IconTrash />
              <span className="font-polysans font-light">
                Supprimer le compte
              </span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

export function NavSecondary({ items, ...props }) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        {/* Menu Paramètres avec dropdown */}
        <SidebarMenu>
          <SettingsDropdownMenu />
        </SidebarMenu>
        {/* /// */}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a
                  href={item.url}
                  onClick={(e) => {
                    if (item.title === "Recherche") {
                      e.preventDefault();
                      // Déclencher l'événement personnalisé pour ouvrir la recherche
                      window.dispatchEvent(new Event("open-search-command"));
                    }
                  }}
                >
                  <item.icon />
                  <span className="font-polysans font-light">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
