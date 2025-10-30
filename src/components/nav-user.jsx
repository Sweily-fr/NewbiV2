"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";
import { Moon, Sun, Monitor } from "lucide-react";

import { CreditCard, Crown } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar";
import { Badge } from "@/src/components/ui/badge";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import Link from "next/link";
import { ModeToggle } from "@/src/components/ui/mode-toggle";
import { signOut } from "../lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApolloClient } from "@apollo/client";
import { SettingsModal } from "./settings-modal";
import { useTheme } from "@/src/components/theme-provider";

export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const { isActive } = useSubscription();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("user-info");
  const apolloClient = useApolloClient();
  const { theme, setTheme } = useTheme();

  const profileImage = user.avatar;

  // Fonction pour générer les initiales du nom
  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = getUserInitials(user.name);

  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log("Déconnexion en cours - Clear du cache Apollo...");

      // Clear complet du cache Apollo pour éviter les fuites de données entre utilisateurs
      await apolloClient.clearStore();

      // Vider tous les caches localStorage
      try {
        console.log("🧹 Nettoyage des caches localStorage...");

        // Vider le cache utilisateur
        localStorage.removeItem("user-cache");

        // Vider tous les caches d'abonnement
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("subscription-")) {
            localStorage.removeItem(key);
            console.log(`🗑️ Cache supprimé: ${key}`);
          }
        });

        console.log("✅ Caches localStorage nettoyés");
      } catch (cacheError) {
        console.warn("⚠️ Erreur lors du nettoyage des caches:", cacheError);
      }

      await signOut({
        fetchOptions: {
          onSuccess: () => {
            console.log("Déconnexion réussie - Tous les caches vidés");
            router.push("/");
            toast.success("Deconnexion reussie");
          },
          onError: () => {
            toast.error("Erreur lors de la deconnexion");
          },
        },
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la deconnexion");
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {profileImage ? (
                  <AvatarImage
                    className="object-cover"
                    src={profileImage}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium">
                    {userInitials}
                  </div>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {profileImage ? (
                      <AvatarImage
                        className="object-cover"
                        src={profileImage}
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium">
                        {userInitials}
                      </div>
                    )}
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 mr-1 mb-4 ${
                    isActive()
                      ? "bg-[#5b4fff]/10 text-[#5b4fff] border-[#5b4fff]/20"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {isActive() ? "Pro" : "Free"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  setSettingsInitialTab("user-info");
                  setSettingsModalOpen(true);
                }}
              >
                <IconUserCircle />
                Compte
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  setSettingsInitialTab("subscription");
                  setSettingsModalOpen(true);
                }}
              >
                <CreditCard />
                Gérer l'abonnement
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  {theme === "light" ? (
                    <Sun className="h-4 w-4 mr-2" />
                  ) : theme === "dark" ? (
                    <Moon className="h-4 w-4 mr-2" />
                  ) : (
                    <Monitor className="h-4 w-4 mr-2" />
                  )}
                  Thème
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="cursor-pointer"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Clair
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="cursor-pointer"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Sombre
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="cursor-pointer"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Système
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
              className="cursor-pointer"
            >
              <IconLogout />
              Se deconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SettingsModal
          open={settingsModalOpen}
          onOpenChange={setSettingsModalOpen}
          initialTab={settingsInitialTab}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
