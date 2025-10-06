"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Crown, Settings, Users } from "lucide-react";
import { IconBuilding } from "@tabler/icons-react";
import { authClient } from "@/src/lib/auth-client";
import { useSubscription as useSubscriptionContext } from "@/src/contexts/subscription-context";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import InviteMembers from "../../app/dashboard/collaborateurs/components/invite-members";
import { SettingsModal } from "./settings-modal";
import { apolloClient } from "@/src/lib/apolloClient";
import { toast } from "@/src/components/ui/sonner";
import { useRouter, usePathname } from "next/navigation";
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
  const { isActive, refreshSubscription: refreshDashboardSubscription } =
    useSubscription();
  const { refreshSubscription: refreshGlobalSubscription } =
    useSubscriptionContext();
  const router = useRouter();
  const pathname = usePathname();
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [settingsInitialTab, setSettingsInitialTab] =
    React.useState("preferences");
  const [isChangingOrg, setIsChangingOrg] = React.useState(false);

  // Utiliser les hooks Better Auth pour récupérer les organisations
  const { data: organizations, isPending: organizationsLoading } =
    authClient.useListOrganizations();
  const { data: activeOrganization, isPending: activeLoading } =
    authClient.useActiveOrganization();

  // Fonction pour changer d'organisation active
  const handleSetActiveOrganization = async (organizationId) => {
    // Éviter les changements multiples simultanés
    if (isChangingOrg) return;

    // Ne rien faire si on clique sur l'organisation déjà active
    if (activeOrganization?.id === organizationId) {
      return;
    }

    try {
      setIsChangingOrg(true);
      console.log("🔄 START - Changement d'organisation:", {
        from: activeOrganization?.id,
        to: organizationId,
      });

      // 1. Changer d'organisation côté serveur
      console.log("📡 Appel API set-active...");
      const response = await fetch("/api/auth/organization/set-active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erreur lors du changement d'organisation");
      }
      console.log("✅ API set-active OK");

      // 2. Vider le cache Apollo
      console.log("🗑️ Vidage cache Apollo...");
      await apolloClient.clearStore();
      console.log("✅ Cache Apollo vidé");

      // 3. Rafraîchir les abonnements
      console.log("🔄 Rafraîchissement abonnements...");
      if (refreshDashboardSubscription) {
        await refreshDashboardSubscription();
      }
      if (refreshGlobalSubscription) {
        await refreshGlobalSubscription();
      }
      console.log("✅ Abonnements rafraîchis");

      // 4. Forcer Next.js à refetch les données server-side (sans rechargement de page)
      console.log("🔄 Router refresh...");
      router.refresh();
      console.log("✅ Router refreshed");

      // 5. Notification
      toast.success("Organisation changée");

      console.log("✅ END - Changement terminé");
    } catch (error) {
      console.error("❌ Erreur changement d'organisation:", error);
      toast.error("Erreur lors du changement d'organisation");
    } finally {
      setIsChangingOrg(false);
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
                <img src="/newbi.svg" alt="NewBi Logo" className="size-7" />
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
                  disabled={isChangingOrg}
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
              <div className="flex gap-2 p-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSettingsInitialTab("preferences");
                    setSettingsModalOpen(true);
                  }}
                  className="flex-1 h-8 text-xs font-normal cursor-pointer"
                >
                  <Settings className="size-3 mr-1" />
                  Paramètres
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteDialogOpen(true)}
                  disabled={!isActive()}
                  className="flex-1 h-8 text-xs font-normal cursor-pointer relative"
                >
                  <Users className="size-3 mr-1" />
                  Inviter des membres
                  {!isActive() && (
                    <Crown className="size-3 ml-1 text-[#5b4fff]" />
                  )}
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <InviteMembers
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialTab={settingsInitialTab}
      />
    </>
  );
}
