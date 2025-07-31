"use client";

import { IconApps, IconCirclePlusFilled, IconMail } from "@tabler/icons-react";

import { Button } from "@/src/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import Link from "next/link";
import { cn } from "@/src/lib/utils";
import { usePathname } from "next/navigation";

export function NavMain({ items }) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2 pt-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Link href={"/dashboard/outils"} className="w-full">
              <SidebarMenuButton
                tooltip="Apps"
                className={cn(
                  "bg-transparent w-full cursor-pointer",
                  (pathname === "/dashboard/outils" ||
                    pathname?.startsWith("/dashboard/outils/")) &&
                    "bg-[#F0F0F0] hover:bg-[#F0F0F0]/90 active:bg-[#F0F0F0] text-black min-w-8 duration-200 ease-linear"
                )}
                //className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <IconApps />
                <span>Outils</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url} className="w-full">
                <SidebarMenuButton
                  className={cn(
                    "bg-transparent w-full cursor-pointer",
                    (pathname === item.url ||
                      (item.url !== "/dashboard" &&
                        pathname?.startsWith(item.url + "/"))) &&
                      "bg-[#F0F0F0] hover:bg-[#F0F0F0]/90 active:bg-[#F0F0F0] text-black min-w-8 duration-200 ease-linear"
                  )}
                  tooltip={item.title}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
