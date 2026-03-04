"use client";

import * as React from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import {
  ChevronsUpDown,
  Check,
  Search,
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
  Boxes,
  Globe,
  Layers,
  LayersPlus,
} from "lucide-react";
import { IconBuilding } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { toast } from "@/src/components/ui/sonner";
import { apolloClient } from "@/src/lib/apolloClient";
import { CreateWorkspaceModal } from "./create-workspace-modal";
import { SettingsModal } from "./settings-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Skeleton } from "@/src/components/ui/skeleton";

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
  return iconMap[iconName] || Building2;
};

export function OrganizationSwitcherHeader() {
  const router = useRouter();
  const { isActive } = useSubscription();
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [isChangingOrg, setIsChangingOrg] = React.useState(false);
  const [sortedOrganizations, setSortedOrganizations] = React.useState([]);
  const [organizationsLoading, setOrganizationsLoading] = React.useState(true);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

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
      
      // Si non authentifié (401), ne pas throw d'erreur - laisser le composant gérer
      if (response.status === 401) {
        console.warn("Session expirée ou non authentifié");
        setSortedOrganizations([]);
        return;
      }
      
      if (!response.ok) {
        console.error("Erreur API:", response.status, response.statusText);
        setSortedOrganizations([]);
        return;
      }
      
      const data = await response.json();
      setSortedOrganizations(data.organizations || []);
    } catch (error) {
      console.error("Erreur chargement organisations:", error);
      // Ne pas vider les organisations en cas d'erreur réseau temporaire
    } finally {
      setOrganizationsLoading(false);
    }
  }, []);

  // Charger les organisations au montage
  React.useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Filtrer les organisations selon la recherche
  const filteredOrganizations = React.useMemo(() => {
    if (!debouncedSearchQuery.trim()) return sortedOrganizations;
    return sortedOrganizations.filter((org) =>
      org.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [sortedOrganizations, debouncedSearchQuery]);

  // Fonction pour changer d'organisation active
  const handleSetActiveOrganization = async (organizationId) => {
    if (isChangingOrg) return;
    if (activeOrganization?.id === organizationId) {
      setIsOpen(false);
      return;
    }

    // Vérifier si l'org cible a un abonnement actif
    const targetOrg = sortedOrganizations.find((org) => org.id === organizationId);
    const targetHasSubscription = targetOrg?.subscriptionStatus === "active";

    try {
      setIsChangingOrg(true);
      const oldWorkspaceId = activeOrganization?.id;

      await authClient.organization.setActive({
        organizationId,
      });

      // Si l'org n'a pas d'abonnement actif, rediriger vers le pricing
      if (!targetHasSubscription) {
        setIsOpen(false);
        router.push("/onboarding?step=4");
        return;
      }

      // Nettoyer le cache Apollo
      if (oldWorkspaceId) {
        apolloClient.cache.evict({
          id: "ROOT_QUERY",
          fieldName: "getInvoices",
        });
        apolloClient.cache.evict({ id: "ROOT_QUERY", fieldName: "getQuotes" });
        apolloClient.cache.evict({ id: "ROOT_QUERY", fieldName: "getClients" });
        apolloClient.cache.evict({
          id: "ROOT_QUERY",
          fieldName: "getExpenses",
        });
        apolloClient.cache.gc();
      }

      const newOrg = sortedOrganizations.find(
        (org) => org.id === organizationId
      );
      toast.success(
        `Vous êtes sur l'espace ${newOrg?.name || "l'organisation"}`
      );
      setIsOpen(false);
    } catch (error) {
      console.error("Erreur changement d'organisation:", error);
      toast.error("Erreur lors du changement d'organisation");
    } finally {
      setIsChangingOrg(false);
    }
  };

  // Loading state
  if (organizationsLoading || activeLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-sm" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  // Si aucune organisation
  if (!sortedOrganizations || sortedOrganizations.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Aucune organisation</span>
      </div>
    );
  }

  const currentOrganization = activeOrganization || sortedOrganizations[0];
  const currentOrgData = sortedOrganizations.find((org) => org.id === currentOrganization?.id);
  const currentSubStatus = currentOrgData?.subscriptionStatus || "none";
  const customColor = currentOrganization?.customColor || "#5b4fff";
  const customIconName = currentOrganization?.customIcon;
  const CustomIcon = customIconName ? getIconComponent(customIconName) : null;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          asChild
          data-tutorial="organization-switcher-header"
        >
          <div className="flex items-center gap-2">
            {/* Nom de l'organisation */}
            <Boxes className="size-3 text-[#707070]" />
            <span className="text-xs font-normal truncate max-w-[150px]">
              {currentOrganization.name}
            </span>
            {/* Badge statut abonnement */}
            {currentSubStatus === "active" ? (
              <Badge
                variant="outline"
                className="text-[8px] px-2.5 py-0 h-4 bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
              >
                PRO
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[8px] px-2.5 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
              >
                Expiré
              </Badge>
            )}
            {/* Bouton chevron avec hover */}
            <button className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer outline-none">
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-80 rounded-lg"
          align="start"
          alignOffset={125}
          sideOffset={8}
        >
          {/* Barre de recherche */}
          <div className="flex items-center px-4 mb-1 border-b">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Rechercher un espace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-9 w-full rounded-md shadow-none bg-transparent py-3 text-[13px] outline-none placeholder:text-[13px] border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Liste des organisations */}
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOrganizations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 px-2 text-center">
                <Search className="h-4 w-4 text-muted-foreground/50 mb-2" />
                <p className="text-[13px] text-muted-foreground">Aucun résultat</p>
              </div>
            )}
            {filteredOrganizations.map((org) => {
              const orgColor = org.customColor || "#5b4fff";
              const orgIconName = org.customIcon;
              const OrgIcon = orgIconName
                ? getIconComponent(orgIconName)
                : null;
              const isCurrentOrg = activeOrganization?.id === org.id;

              const hasActiveSub = org.subscriptionStatus === "active";

              return (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSetActiveOrganization(org.id)}
                  disabled={isChangingOrg}
                  className={`flex items-center gap-2 px-2 py-2 cursor-pointer rounded-sm ${isCurrentOrg ? "bg-accent" : ""}`}
                >
                  <span className="flex-1 text-[13px] font-normal truncate">{org.name}</span>
                  {hasActiveSub ? (
                    <Badge
                      variant="outline"
                      className="text-[8px] px-2 py-0 h-4 bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                    >
                      PRO
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[8px] px-2 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                    >
                      Expiré
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-1" />

          {/* Lien vers tous les espaces */}
          <DropdownMenuItem
            className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-sm"
            onClick={() => {
              setIsOpen(false);
              setSettingsModalOpen(true);
            }}
          >
            <Layers className="size-4 text-muted-foreground" />
            <span className="text-[13px] font-normal">Tous les espaces</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          {/* Créer un nouvel espace */}
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              router.push("/create-workspace");
            }}
            className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-sm"
          >
            <LayersPlus className="size-4 text-muted-foreground" />
            <span className="text-[13px] font-normal">Nouveau espace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialTab="espaces"
      />

      <CreateWorkspaceModal
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
        onSuccess={() => {
          loadOrganizations();
          if (refetchActiveOrg) {
            refetchActiveOrg();
          }
        }}
      />
    </>
  );
}
