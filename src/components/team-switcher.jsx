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
  GripVertical,
  MoreHorizontal,
  Palette,
  Edit3,
  ChevronRight,
  Building2,
  Store,
  Factory,
  Construction,
  Landmark,
  Briefcase,
  BarChart3,
  TrendingUp,
  DollarSign,
  CreditCard,
  Target,
  Rocket,
  Zap,
  Flame,
  Lightbulb,
  Paintbrush,
  Music,
  Camera,
  Smartphone,
  Laptop,
  Monitor,
  Coffee,
  Pizza,
  Cake,
  Gamepad2,
  Dumbbell,
  Plane,
  Car,
  Home,
  Heart,
  Star,
  Gift,
  ShoppingCart,
  Package,
  Truck,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  MapPin,
  Globe,
} from "lucide-react";
import { IconBuilding } from "@tabler/icons-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { authClient } from "@/src/lib/auth-client";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import Link from "next/link";
import { InviteMemberModal } from "./invite-member-modal";
import { SettingsModal } from "./settings-modal";
import { CreateWorkspaceModal } from "./create-workspace-modal";
import { RenameOrganizationModal } from "./rename-organization-modal";
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
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
  const [renameModalOpen, setRenameModalOpen] = React.useState(false);
  const [selectedOrganization, setSelectedOrganization] = React.useState(null);
  const [settingsInitialTab, setSettingsInitialTab] =
    React.useState("preferences");
  const [isChangingOrg, setIsChangingOrg] = React.useState(false);
  const [forceUpdate, setForceUpdate] = React.useState(0);
  const [sortedOrganizations, setSortedOrganizations] = React.useState([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [organizationsLoading, setOrganizationsLoading] = React.useState(true);

  // Récupérer l'organisation active avec Better Auth
  const {
    data: activeOrganization,
    isPending: activeLoading,
    refetch: refetchActiveOrg,
  } = authClient.useActiveOrganization();

  // Fonction pour charger les organisations avec leur ordre
  const loadOrganizations = React.useCallback(async () => {
    try {
      setOrganizationsLoading(true);
      const response = await fetch("/api/organization/list-with-order");
      if (!response.ok) throw new Error("Erreur chargement organisations");
      const data = await response.json();
      setSortedOrganizations(data.organizations || []);
    } catch (error) {
      console.error("Erreur chargement organisations:", error);
      setSortedOrganizations([]);
    } finally {
      setOrganizationsLoading(false);
    }
  }, []);

  // Charger les organisations au montage et après certaines actions
  React.useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations, forceUpdate]);

  // Sensors pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Démarrer le drag après 8px de mouvement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Gérer le drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setIsDragging(false);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedOrganizations.findIndex(
      (org) => org.id === active.id
    );
    const newIndex = sortedOrganizations.findIndex((org) => org.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sortedOrganizations, oldIndex, newIndex);
      setSortedOrganizations(newOrder);

      // Sauvegarder l'ordre en BDD
      try {
        const response = await fetch("/api/organization/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationIds: newOrder.map((org) => org.id),
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur sauvegarde");
        }

        console.log("✅ Ordre sauvegardé avec succès");
      } catch (error) {
        console.error("Erreur sauvegarde ordre:", error);
        // Restaurer l'ordre précédent en cas d'erreur
        setSortedOrganizations(sortedOrganizations);
        toast.error("Erreur lors de la sauvegarde de l'ordre");
      }
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

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
  if (!sortedOrganizations || sortedOrganizations.length === 0) {
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
  const currentOrganization = activeOrganization || sortedOrganizations[0];

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
                    {sortedOrganizations.length} organisation
                    {sortedOrganizations.length > 1 ? "s" : ""}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
              >
                <SortableContext
                  items={sortedOrganizations.map((org) => org.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedOrganizations.map((org) => (
                    <SortableOrganizationItem
                      key={org.id}
                      org={org}
                      isActive={activeOrganization?.id === org.id}
                      onSelect={handleSetActiveOrganization}
                      disabled={isChangingOrg}
                      onRename={(org) => {
                        setSelectedOrganization(org);
                        setRenameModalOpen(true);
                      }}
                      setSortedOrganizations={setSortedOrganizations}
                    />
                  ))}
                </SortableContext>
              </DndContext>
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
          loadOrganizations();
          if (refetchActiveOrg) {
            refetchActiveOrg();
          }
        }}
      />
      <RenameOrganizationModal
        open={renameModalOpen}
        onOpenChange={setRenameModalOpen}
        organization={selectedOrganization}
        onSuccess={() => {
          // Rafraîchir les organisations
          loadOrganizations();
          if (refetchActiveOrg) {
            refetchActiveOrg();
          }
        }}
      />
    </>
  );
}

// Fonction helper pour obtenir l'icône Lucide correspondante
const getIconComponent = (iconName) => {
  const iconMap = {
    Building: Building2,
    Store: Store,
    Factory: Factory,
    Construction: Construction,
    Landmark: Landmark,
    Briefcase: Briefcase,
    Chart: BarChart3,
    Trending: TrendingUp,
    Dollar: DollarSign,
    Card: CreditCard,
    Target: Target,
    Rocket: Rocket,
    Zap: Zap,
    Flame: Flame,
    Lightbulb: Lightbulb,
    Paint: Paintbrush,
    Music: Music,
    Camera: Camera,
    Phone: Smartphone,
    Laptop: Laptop,
    Monitor: Monitor,
    Coffee: Coffee,
    Pizza: Pizza,
    Cake: Cake,
    Game: Gamepad2,
    Fitness: Dumbbell,
    Plane: Plane,
    Car: Car,
    Home: Home,
    Heart: Heart,
    Star: Star,
    Gift: Gift,
    Cart: ShoppingCart,
    Package: Package,
    Truck: Truck,
    Mail: Mail,
    Message: MessageSquare,
    Calendar: Calendar,
    Clock: Clock,
    Location: MapPin,
    Globe: Globe,
  };
  return iconMap[iconName] || Building2; // Building2 par défaut
};

// Composant sortable pour chaque organisation
function SortableOrganizationItem({
  org,
  isActive,
  onSelect,
  disabled,
  onRename,
  setSortedOrganizations,
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showActionsMenu, setShowActionsMenu] = React.useState(false);
  const [showColorMenu, setShowColorMenu] = React.useState(false);
  const buttonRef = React.useRef(null);
  const colorButtonRef = React.useRef(null);
  
  // Récupérer la couleur et l'icône personnalisées
  const customColor = org.customColor || "#5b4fff";
  const customIconName = org.customIcon;
  const CustomIcon = customIconName ? getIconComponent(customIconName) : null;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: org.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Garder l'opacité normale pendant le drag
    opacity: 1,
    // Ajouter une ombre pendant le drag
    ...(isDragging && {
      // boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      borderRadius: "6px",
    }),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => !isDragging && !showActionsMenu && !showColorMenu && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
      {...attributes}
      {...listeners}
    >
      <DropdownMenuItem
        onClick={() => !disabled && onSelect(org.id)}
        className={`gap-2 p-2 transition-colors ${
          isDragging ? "bg-accent/80" : ""
        }`}
        disabled={disabled}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onSelect={(e) => e.preventDefault()}
      >
        {/* Icône qui change au hover : Icône personnalisée (avec carré coloré) -> Grip (sans carré) */}
        <div className="flex size-6 items-center justify-center relative">
          {/* Icône personnalisée avec bordure et couleur de fond (visible par défaut) */}
          <div
            className={`flex size-6 items-center justify-center rounded-sm transition-opacity absolute ${
              isHovered && !disabled ? "opacity-0" : "opacity-100"
            }`}
            style={{ backgroundColor: customColor }}
          >
            {CustomIcon ? (
              <CustomIcon className="size-3.5 shrink-0 text-white" />
            ) : (
              <IconBuilding className="size-3.5 shrink-0 text-white" />
            )}
          </div>
          {/* Icône Grip sans bordure (visible au hover) */}
          <div
            className={`flex items-center justify-center transition-opacity absolute ${
              isHovered && !disabled ? "opacity-100" : "opacity-0"
            }`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col flex-1">
          <span className="font-normal text-xs">{org.name}</span>
        </div>

        {/* Check si actif */}
        {isActive && <Check className="ml-auto h-4 w-4 text-[#5b4fff]" />}

        {/* Bouton 3 points */}
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowActionsMenu(!showActionsMenu);
          }}
          className={`flex items-center justify-center h-6 w-6 rounded hover:bg-accent transition-opacity ${
            isHovered && !disabled && !showColorMenu && !showActionsMenu ? "opacity-100" : "opacity-0"
          }`}
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuItem>

      {/* Menu des actions - COMPLÈTEMENT SÉPARÉ */}
      {showActionsMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowActionsMenu(false)}
        >
          <div
            className="absolute bg-popover text-popover-foreground rounded-md border shadow-md w-48 p-1"
            style={{
              top: buttonRef.current?.getBoundingClientRect().top - 8,
              left: buttonRef.current?.getBoundingClientRect().right - 240,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setShowActionsMenu(false);
                if (onRename) {
                  onRename(org);
                }
              }}
            >
              <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-normal">Renommer</span>
            </div>
            <div
              ref={colorButtonRef}
              className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onMouseEnter={() => setShowColorMenu(true)}
              onMouseLeave={() => setShowColorMenu(false)}
              onClick={(e) => {
                e.stopPropagation();
                setShowColorMenu(!showColorMenu);
              }}
            >
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-normal flex-1">Couleur et icône</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      {/* Sous-menu Couleur et icône */}
      {showColorMenu && showActionsMenu && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => {
            setShowColorMenu(false);
            setShowActionsMenu(false);
          }}
        >
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-md border shadow-lg w-64 p-4"
            style={{
              top: colorButtonRef.current?.getBoundingClientRect().top - 16,
              left: colorButtonRef.current?.getBoundingClientRect().right - 245,
            }}
            onMouseEnter={() => setShowColorMenu(true)}
            onMouseLeave={() => setShowColorMenu(false)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Palette de couleurs */}
            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5">
                Color
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "#7c3aed", // Violet
                  "#2563eb", // Bleu
                  "#0891b2", // Cyan
                  "#059669", // Vert
                  "#0d9488", // Teal
                  "#eab308", // Jaune
                  "#f97316", // Orange
                  "#ef4444", // Rouge
                  "#ec4899", // Rose
                  "#a855f7", // Violet clair
                  "#78716c", // Brun
                  "#000000", // Noir
                ].map((color) => (
                  <button
                    key={color}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        // Mise à jour optimiste : changer immédiatement dans l'état local
                        setSortedOrganizations((prev) =>
                          prev.map((o) =>
                            o.id === org.id ? { ...o, customColor: color } : o
                          )
                        );
                        
                        // Mise à jour en base de données en arrière-plan
                        authClient.organization.update({
                          organizationId: org.id,
                          data: {
                            customColor: color,
                          },
                        });
                      } catch (error) {
                        console.error("Erreur mise à jour couleur:", error);
                      }
                    }}
                    className="w-5 h-5 rounded-full transition-all hover:scale-110 hover:shadow-sm ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Grille d'icônes */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Input
                  type="text"
                  placeholder="Recherche"
                  className="flex-1 h-7 text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  Importer
                </Button>
              </div>
              <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto">
                {[
                  { Icon: Building2, name: "Building" },
                  { Icon: Store, name: "Store" },
                  { Icon: Factory, name: "Factory" },
                  { Icon: Construction, name: "Construction" },
                  { Icon: Landmark, name: "Landmark" },
                  { Icon: Briefcase, name: "Briefcase" },
                  { Icon: BarChart3, name: "Chart" },
                  { Icon: TrendingUp, name: "Trending" },
                  { Icon: DollarSign, name: "Dollar" },
                  { Icon: CreditCard, name: "Card" },
                  { Icon: Target, name: "Target" },
                  { Icon: Rocket, name: "Rocket" },
                  { Icon: Zap, name: "Zap" },
                  { Icon: Flame, name: "Flame" },
                  { Icon: Lightbulb, name: "Lightbulb" },
                  { Icon: Paintbrush, name: "Paint" },
                  { Icon: Music, name: "Music" },
                  { Icon: Camera, name: "Camera" },
                  { Icon: Smartphone, name: "Phone" },
                  { Icon: Laptop, name: "Laptop" },
                  { Icon: Monitor, name: "Monitor" },
                  { Icon: Coffee, name: "Coffee" },
                  { Icon: Pizza, name: "Pizza" },
                  { Icon: Cake, name: "Cake" },
                  { Icon: Gamepad2, name: "Game" },
                  { Icon: Dumbbell, name: "Fitness" },
                  { Icon: Plane, name: "Plane" },
                  { Icon: Car, name: "Car" },
                  { Icon: Home, name: "Home" },
                  { Icon: Heart, name: "Heart" },
                  { Icon: Star, name: "Star" },
                  { Icon: Gift, name: "Gift" },
                  { Icon: ShoppingCart, name: "Cart" },
                  { Icon: Package, name: "Package" },
                  { Icon: Truck, name: "Truck" },
                  { Icon: Mail, name: "Mail" },
                  { Icon: Phone, name: "Phone" },
                  { Icon: MessageSquare, name: "Message" },
                  { Icon: Calendar, name: "Calendar" },
                  { Icon: Clock, name: "Clock" },
                  { Icon: MapPin, name: "Location" },
                  { Icon: Globe, name: "Globe" },
                ].map(({ Icon, name }, index) => (
                  <button
                    key={index}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        // Mise à jour optimiste : changer immédiatement dans l'état local
                        setSortedOrganizations((prev) =>
                          prev.map((o) =>
                            o.id === org.id ? { ...o, customIcon: name } : o
                          )
                        );
                        
                        // Mise à jour en base de données en arrière-plan
                        authClient.organization.update({
                          organizationId: org.id,
                          data: {
                            customIcon: name,
                          },
                        });
                      } catch (error) {
                        console.error("Erreur mise à jour icône:", error);
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    title={name}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
