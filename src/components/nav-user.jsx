"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";

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
import { SettingsModal } from "./settings-modal";

export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const { isActive } = useSubscription();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("user-info");

  const profileImage = user.avatar;
  
  // Fonction pour générer les initiales du nom
  const getInitials = (name) => {
    if (!name) return 'U';
    
    const names = name.split(' ');
    let initials = names[0].charAt(0).toUpperCase();
    
    // Ajouter la première lettre du prénom et du nom si disponible
    if (names.length > 1) {
      initials += names[names.length - 1].charAt(0).toUpperCase();
    }
    
    return initials;
  };
  
  const userInitials = getInitials(user?.name);

  const router = useRouter();

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          toast.success("Deconnexion reussie");
        },
        onError: () => {
          toast.error("Erreur lors de la deconnexion");
        },
      },
    });
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
              {/* <DropdownMenuItem className="cursor-pointer">
                <IconCreditCard />
                Facture
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <IconNotification />
                Notifications
              </DropdownMenuItem> */}
              {/* <DropdownMenuItem>
                <ModeToggle />
              </DropdownMenuItem> */}
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
