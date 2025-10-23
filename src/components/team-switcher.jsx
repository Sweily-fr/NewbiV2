"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  Plus,
  Crown,
  Settings,
  Users,
  Check,
  LogOut,
} from "lucide-react";
import { IconBuilding } from "@tabler/icons-react";
import { authClient } from "@/src/lib/auth-client";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { InviteMemberModal } from "./invite-member-modal";
import { SettingsModal } from "./settings-modal";
import { CreateWorkspaceModal } from "./create-workspace-modal";
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
  const router = useRouter();
  const pathname = usePathname();
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false);
  const [settingsInitialTab, setSettingsInitialTab] =
    React.useState("preferences");
  const [isChangingOrg, setIsChangingOrg] = React.useState(false);
  const [forceUpdate, setForceUpdate] = React.useState(0);

  // Utiliser les hooks Better Auth pour récupérer les organisations
  const {
    data: organizations,
    isPending: organizationsLoading,
    refetch: refetchOrgs,
  } = authClient.useListOrganizations();
  const {
    data: activeOrganization,
    isPending: activeLoading,
    refetch: refetchActiveOrg,
  } = authClient.useActiveOrganization();

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
      const oldWorkspaceId = activeOrganization?.id;
      console.log("🔄 Changement d'organisation:", {
        from: oldWorkspaceId,
        to: organizationId,
      });

      // 1. Changer d'organisation côté serveur avec Better Auth client
      // Utiliser le client Better Auth au lieu de fetch pour éviter le rechargement
      await authClient.organization.setActive({
        organizationId,
        fetchOptions: {
          // Désactiver le rechargement automatique
          onSuccess: () => {
            console.log("✅ Organisation changée côté serveur");
          },
          onError: (error) => {
            console.error("❌ Erreur:", error);
            throw error;
          },
        },
      });

      // 2. Nettoyer le LocalStorage de l'ancienne organisation
      if (oldWorkspaceId) {
        const oldCacheKey = `dashboard-data-${oldWorkspaceId}`;
        localStorage.removeItem(oldCacheKey);
        console.log(`🗑️ Cache LocalStorage supprimé: ${oldCacheKey}`);
      }

      // 3. Vider sélectivement le cache Apollo (pas clearStore qui vide TOUT)
      console.log("🗑️ Vidage sélectif du cache Apollo...");
      if (oldWorkspaceId) {
        // Évict uniquement les queries de l'ancienne organisation
        apolloClient.cache.evict({
          id: "ROOT_QUERY",
          fieldName: "getInvoices",
          args: { workspaceId: oldWorkspaceId },
        });
        apolloClient.cache.evict({
          id: "ROOT_QUERY",
          fieldName: "getQuotes",
          args: { workspaceId: oldWorkspaceId },
        });
        apolloClient.cache.evict({
          id: "ROOT_QUERY",
          fieldName: "getClients",
          args: { workspaceId: oldWorkspaceId },
        });
        apolloClient.cache.evict({
          id: "ROOT_QUERY",
          fieldName: "getExpenses",
          args: { workspaceId: oldWorkspaceId },
        });
        apolloClient.cache.gc(); // Garbage collection
        console.log("✅ Cache Apollo nettoyé (sélectif)");
      }

      // 4. Rafraîchir les abonnements
      if (refreshDashboardSubscription) {
        await refreshDashboardSubscription();
      }
      console.log("✅ Abonnements rafraîchis");

      // 5. Forcer le refetch des hooks Better Auth
      console.log("🔄 Refetch des hooks Better Auth...");
      if (refetchActiveOrg) {
        await refetchActiveOrg();
      }
      if (refetchOrgs) {
        await refetchOrgs();
      }

      // Forcer un re-render du composant
      setForceUpdate((prev) => prev + 1);
      console.log("✅ Hooks Better Auth rafraîchis");

      // 6. Émettre un événement custom pour notifier le changement d'organisation
      const organizationChangeEvent = new CustomEvent("organizationChanged", {
        detail: {
          previousOrgId: oldWorkspaceId,
          newOrgId: organizationId,
        },
      });
      window.dispatchEvent(organizationChangeEvent);
      console.log("📢 Événement organizationChanged émis:", {
        from: oldWorkspaceId,
        to: organizationId,
      });

      // 7. Notification
      toast.success("Organisation changée");

      console.log("✅ Changement terminé sans rechargement");
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
                  <span className="truncate font-medium text-sm">
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
                    <span className="font-normal text-xs">{org.name}</span>
                    {/* {org.slug && (
                      <span className="text-xs text-muted-foreground">
                        @{org.slug}
                      </span>
                    )} */}
                  </div>
                  {activeOrganization?.id === org.id && (
                    <Check className="ml-auto h-4 w-4 text-[#5b4fff]" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (isActive()) {
                    setCreateWorkspaceOpen(true);
                  }
                }}
                disabled={!isActive()}
                className={`gap-2 p-2 ${
                  isActive()
                    ? "cursor-pointer text-[#5b4fff]"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                <Plus
                  className={`h-2 w-2 ${isActive() ? "text-[#5b4fff]" : ""}`}
                />
                <span
                  className={`text-xs ${isActive() ? "text-[#5b4fff]" : ""}`}
                >
                  Ajouter un espace de travail
                </span>
                {!isActive() && (
                  <Crown className="ml-auto h-3 w-3 text-[#5b4fff]" />
                )}
              </DropdownMenuItem>
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
              <div className="p-2 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            toast.success("Déconnexion réussie");
                            window.location.href = "/auth/login";
                          },
                          onError: (ctx) => {
                            toast.error("Erreur lors de la déconnexion");
                          },
                        },
                      });
                    } catch (error) {
                      console.error("Erreur déconnexion:", error);
                      toast.error("Erreur lors de la déconnexion");
                    }
                  }}
                  className="w-full h-8 text-xs font-normal cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <LogOut className="size-3 mr-1" />
                  Déconnexion
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <InviteMemberModal
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => {
          // Rafraîchir les données si nécessaire
          if (refetchOrgs) {
            refetchOrgs();
          }
        }}
      />
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialTab={settingsInitialTab}
      />
      <CreateWorkspaceModal
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
        onSuccess={() => {
          // Rafraîchir les organisations
          if (refetchOrgs) {
            refetchOrgs();
          }
          if (refetchActiveOrg) {
            refetchActiveOrg();
          }
        }}
      />
    </>
  );
}
