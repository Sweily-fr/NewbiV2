"use client";

import * as React from "react";
import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
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
import Link from "next/link";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        {/* /// */}
        <SidebarMenu>
          <SidebarMenuItem key={"settings"}>
            <SidebarMenuButton asChild>
              <a href={"#"}>
                <IconSettings />
                <span>Paramètres</span>
              </a>
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
