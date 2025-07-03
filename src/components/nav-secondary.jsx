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
  IconShare3,
  IconTrash,
  IconSettings,
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
        <span>Paramètres</span>
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
              <span>Paramètres entreprise</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={"/dashboard/settings/integrations"}>
              <IconShare3 />
              <span>Integrations</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            asChild
          >
            <Link href={"/dashboard/settings/delete-account"}>
              <IconTrash />
              <span>Supprimer le compte</span>
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
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
