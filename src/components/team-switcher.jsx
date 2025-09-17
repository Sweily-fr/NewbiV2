"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Crown } from "lucide-react";
import { IconBuilding } from "@tabler/icons-react";
import { authClient } from "@/src/lib/auth-client";
import { useSubscription } from "@/src/contexts/subscription-context";
import { Badge } from "@/src/components/ui/badge";
import Link from "next/link";
import InviteMembers from "../../app/dashboard/collaborateurs/components/invite-members";
// app/dashboard/collaborateurs/components/invite-members
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar";

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { isActive } = useSubscription();
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);

  // Utiliser les hooks Better Auth pour récupérer les organisations
  const { data: organizations, isPending: organizationsLoading } =
    authClient.useListOrganizations();
  const { data: activeOrganization, isPending: activeLoading } =
    authClient.useActiveOrganization();

  // Fonction pour changer d'organisation active
  const handleSetActiveOrganization = async (organizationId) => {
    try {
      await authClient.organization.setActive({ organizationId });

      // Forcer la mise à jour des hooks Better Auth
      // Utiliser window.location.reload() pour s'assurer que tout se met à jour
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors du changement d'organisation:", error);
    }
  };

  // Afficher un loader pendant le chargement
  if (organizationsLoading || activeLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <img src="/newbi.svg" alt="NewBi Logo" className="size-8" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">...</span>
              <span className="truncate text-xs">-</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Si aucune organisation n'est disponible
  if (!organizations || organizations.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <img src="/newbi.svg" alt="NewBi Logo" className="size-8" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Aucune organisation</span>
              <span className="truncate text-xs">-</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Utiliser l'organisation active ou la première disponible
  const currentOrganization = activeOrganization || organizations[0];

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
              <img src="/newbi.svg" alt="NewBi Logo" className="size-8" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {currentOrganization.name}
                  </span>
                  <span className="truncate text-xs">
                  {organizations.length} organisation
                  {organizations.length > 1 ? "s" : ""}
                  </span>
                </div>
              <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
            <DropdownMenuLabel className="text-muted-foreground text-xs flex items-center justify-between">
              <span>Organisations</span>
              <Badge
                variant="outline"
                className={`text-xs px-2 py-0.5 ${
                  isActive()
                    ? "bg-[#5b4fff]/10 text-[#5b4fff] border-[#5b4fff]/20"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                <Crown className="w-3 h-3 mr-1" />
                {isActive() ? "Pro" : "Free"}
              </Badge>
              </DropdownMenuLabel>
            {organizations.map((org, index) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSetActiveOrganization(org.id)}
                  className="gap-2 p-2 cursor-pointer"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                  <IconBuilding className="size-3.5 shrink-0" />
                  </div>
                  <div className="flex flex-col">
                  <span className="font-medium">{org.name}</span>
                    {org.slug && (
                      <span className="text-xs text-muted-foreground">
                        @{org.slug}
                      </span>
                    )}
                  </div>
                  {activeOrganization?.id === org.id && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-[#5b4fff]/80" />
                  )}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="gap-2 p-2 cursor-pointer"
                onClick={() => setInviteDialogOpen(true)}
              >
                <div className="flex size-5 items-center justify-center rounded-sm border bg-transparent">
                  <Plus className="size-3" />
                </div>
                <div className="text-xs font-normal">
                  Inviter un collaborateur
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <InviteMembers open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </>
  );
}
