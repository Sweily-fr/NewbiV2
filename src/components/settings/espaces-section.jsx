"use client";

import { useState, useEffect } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import {
  UserRoundPlusIcon,
  MoreHorizontal,
  Trash2,
  Search,
  Building2,
  ChevronRight,
  ArrowLeft,
  SlidersHorizontal,
  User,
  KeyRound,
  Users,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@/src/components/ui/avatar";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { InviteMemberModal } from "@/src/components/invite-member-modal";
import { authClient, useSession } from "@/src/lib/auth-client";
// Select retiré — rôle affiché en badge
import { usePermissions } from "@/src/hooks/usePermissions";
import { Callout } from "@/src/components/ui/callout";
import { Separator } from "@/src/components/ui/separator";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";

export default function EspacesSection({ canManageOrgSettings = true }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [orgMemberData, setOrgMemberData] = useState({});
  const [updatingRoleForMember, setUpdatingRoleForMember] = useState(null);
  const [statusFilters, setStatusFilters] = useState({
    active: true,
    pending: true,
    suspended: true,
  });
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState("");

  const { data: session } = useSession();

  // Utiliser le hook pour les invitations
  const {
    getAllCollaborators,
    removeMember,
    cancelInvitation,
    resendInvitation,
    updateMemberRole,
  } = useOrganizationInvitations();

  // Récupérer les organisations
  const { data: organizationsList } = authClient.useListOrganizations();

  // Fonction utilitaire pour formater et dédupliquer les membres
  const formatAndDeduplicateMembers = (data) => {
    const emailMap = new Map();

    data.forEach((item) => {
      let formattedItem;

      if (item.type === "member") {
        formattedItem = {
          id: item.id,
          email: item.user?.email || item.email,
          name: item.user?.name || item.name || item.user?.email?.split("@")[0],
          avatar: item.avatar || item.image || item.user?.avatar || item.user?.image,
          role: item.role,
          status: "active",
          type: "member",
          priority: 1,
          createdAt: item.createdAt || new Date(),
        };
      } else {
        if (item.status === "canceled") {
          return;
        }

        formattedItem = {
          id: item.id,
          email: item.email,
          name: item.email?.split("@")[0],
          avatar: null,
          role: item.role,
          status: item.status || "pending",
          type: "invitation",
          priority: item.status === "accepted" ? 2 : 3,
          createdAt: item.createdAt || new Date(),
        };
      }

      const email = formattedItem.email;
      if (email) {
        const existing = emailMap.get(email);

        if (
          !existing ||
          formattedItem.priority < existing.priority ||
          (formattedItem.priority === existing.priority &&
            new Date(formattedItem.createdAt) > new Date(existing.createdAt))
        ) {
          emailMap.set(email, formattedItem);
        }
      }
    });

    const deduplicatedMembers = Array.from(emailMap.values());
    // Trier : owners en premier
    return deduplicatedMembers.sort((a, b) => {
      if (a.role === "owner" && b.role !== "owner") return -1;
      if (a.role !== "owner" && b.role === "owner") return 1;
      return 0;
    });
  };

  // Charger les organisations et compter les membres
  useEffect(() => {
    if (organizationsList) {
      setOrganizations(organizationsList);

      // ✅ FIX: Utiliser Promise.all pour des appels parallèles au lieu de séquentiels
      const fetchMemberData = async () => {
        setLoading(true);

        try {
          // Lancer tous les appels API en parallèle
          const fetchPromises = organizationsList.map(async (org) => {
            try {
              const response = await fetch(`/api/organizations/${org.id}/members`);
              const result = await response.json();

              if (result.success) {
                return { orgId: org.id, members: formatAndDeduplicateMembers(result.data) };
              }
              return { orgId: org.id, members: [] };
            } catch (error) {
              console.error(`Erreur pour l'org ${org.id}:`, error);
              return { orgId: org.id, members: [] };
            }
          });

          // Attendre que tous les appels soient terminés
          const results = await Promise.all(fetchPromises);

          // Construire l'objet de données
          const data = {};
          results.forEach(({ orgId, members }) => {
            data[orgId] = members;
          });

          setOrgMemberData(data);
        } catch (error) {
          console.error("Erreur lors du chargement des membres:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchMemberData();
    }
  }, [organizationsList, refreshTrigger]);

  // Récupérer les membres d'une organisation spécifique
  // ✅ FIX: Réutiliser les données déjà chargées au lieu de faire un nouvel appel API
  useEffect(() => {
    if (!selectedOrg) {
      setMembers([]);
      return;
    }

    // ✅ Utiliser les données du cache si disponibles
    const cachedMembers = orgMemberData[selectedOrg.id];
    if (cachedMembers) {
      setMembers(cachedMembers);
    }
  }, [selectedOrg, orgMemberData]);

  // ✅ Rafraîchir les données de l'organisation sélectionnée quand refreshTrigger change
  useEffect(() => {
    if (!selectedOrg || refreshTrigger === 0) return;

    const refreshSelectedOrgMembers = async () => {
      try {
        // Ne pas afficher le loader si on a déjà des données (refresh silencieux)
        if (members.length === 0) {
          setMembersLoading(true);
        }

        const response = await fetch(
          `/api/organizations/${selectedOrg.id}/members`
        );
        const result = await response.json();

        if (result.success) {
          const formattedMembers = formatAndDeduplicateMembers(result.data);
          setMembers(formattedMembers);

          // ✅ Mettre à jour le cache
          setOrgMemberData((prev) => ({
            ...prev,
            [selectedOrg.id]: formattedMembers,
          }));
        }
      } catch (error) {
        console.error("Error refreshing members:", error);
      } finally {
        setMembersLoading(false);
      }
    };

    refreshSelectedOrgMembers();
  }, [refreshTrigger]);

  // Filter members based on search term + status filters
  const filteredMembers = members.filter((member) => {
    // Search filter
    const matchesSearch =
      member.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    // Status filter
    const memberStatus = member.status === "pending" ? "pending" : member.status === "suspended" ? "suspended" : "active";
    const matchesStatus = statusFilters[memberStatus];

    return matchesSearch && matchesStatus;
  });

  const toggleStatusFilter = (status) => {
    setStatusFilters((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const activeFilterCount = Object.values(statusFilters).filter((v) => !v).length;

  const handleDeleteMember = (member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      let result;
      if (memberToDelete.type === "member") {
        // Supprimer le membre
        result = await removeMember(memberToDelete.id, selectedOrg?.id);

        // Trouver et annuler l'invitation associée si elle existe
        if (result.success) {
          const invitation = members.find(
            (m) => m.type === "invitation" && m.email === memberToDelete.email
          );
          if (invitation) {
            await cancelInvitation(invitation.id);
          }
        }
      } else {
        // Annuler l'invitation
        result = await cancelInvitation(memberToDelete.id);
      }

      if (result.success) {
        setRefreshTrigger((prev) => prev + 1);
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 border-blue-300 text-blue-800 font-normal";
      case "member":
        return "bg-gray-100 border-gray-300 text-gray-800 font-normal";
      case "viewer":
        return "bg-orange-100 border-orange-300 text-orange-800 font-normal";
      case "accountant":
        return "bg-purple-100 border-purple-300 text-purple-800 font-normal";
      case "owner":
        return "bg-green-50 border-green-200 text-green-600 font-normal";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800 font-normal";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "member":
        return "Membre";
      case "viewer":
        return "Lecteur";
      case "accountant":
        return "Comptable";
      case "owner":
        return "Propriétaire";
      default:
        return role;
    }
  };

  const handleOrgClick = (org) => {
    setSelectedOrg(org);
  };

  // Gérer le changement de rôle d'un membre
  const handleRoleChange = async (member, newRole) => {
    if (!canManageOrgSettings) {
      toast.error("Vous n'avez pas la permission de modifier les rôles");
      return;
    }

    if (member.role === newRole) {
      return; // Pas de changement
    }

    try {
      setUpdatingRoleForMember(member.id);

      console.log("🔄 Changement de rôle pour:", {
        memberId: member.id,
        email: member.email,
        currentRole: member.role,
        newRole,
        type: member.type,
        orgId: selectedOrg?.id,
      });

      let result;

      if (member.type === "invitation") {
        // Pour les invitations, annuler et re-inviter avec le nouveau rôle
        result = await resendInvitation(member.email, newRole, member.id, { silent: true });
      } else {
        // Pour les membres actifs, utiliser updateMemberRole de Better Auth
        result = await updateMemberRole(
          member.id,
          newRole,
          selectedOrg?.id,
          member.role
        );
      }

      if (result.success) {
        if (member.type === "invitation") {
          toast.success("Rôle mis à jour avec succès");
        }
        // Rafraîchir la liste des membres
        setRefreshTrigger((prev) => prev + 1);
      } else if (member.type === "invitation") {
        toast.error(result.error?.message || "Erreur lors du changement de rôle");
      }
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
      toast.error("Erreur lors du changement de rôle");
    } finally {
      setUpdatingRoleForMember(null);
    }
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Container avec transition slide */}
      <div className="relative">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            selectedOrg
              ? "-translate-x-full opacity-0 absolute inset-0 pointer-events-none"
              : "translate-x-0 opacity-100"
          )}
        >
          {/* Header */}
          <div className="flex flex-col gap-1 mb-0 md:mb-6">
            <h3 className="text-lg font-medium hidden md:block">Gestion des espaces</h3>
            <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
          </div>

          {!canManageOrgSettings && (
            <div className="mt-4 mb-6">
              <Callout type="warning" noMargin>
                <p>
                  Vous n'avez pas la permission de modifier les paramètres de
                  l'organisation. Seuls les <strong>owners</strong> et{" "}
                  <strong>admins</strong> peuvent effectuer ces modifications.
                </p>
              </Callout>
            </div>
          )}

          {/* Organizations Table */}
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Membres</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton pour 3 lignes
                  <>
                    {[1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-7 w-7 rounded-md" />
                            <Skeleton className="h-4 w-[180px]" />
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex -space-x-2">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-7 w-7 rounded-full" />
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      Aucune organisation
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => {
                    const orgMembers = orgMemberData[org.id] || [];
                    const memberCount = orgMembers.length;
                    const displayedMembers = orgMembers.slice(0, 3);
                    const remainingCount = memberCount - 3;

                    return (
                      <TableRow
                        key={org.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleOrgClick(org)}
                      >
                        <TableCell className="py-2">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span className="font-normal text-sm">{org.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          {memberCount > 0 ? (
                            <AvatarGroup>
                              {displayedMembers.map((member, index) => (
                                <Avatar key={member.email || index} className="h-7 w-7 border-2 border-background">
                                  <AvatarImage
                                    src={member.avatar}
                                    alt={member.name || member.email}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                                    {(member.name || member.email || "?")
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {remainingCount > 0 && (
                                <AvatarGroupCount className="h-7 w-7 text-[10px]">
                                  +{remainingCount}
                                </AvatarGroupCount>
                              )}
                            </AvatarGroup>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Aucun membre
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Vue détaillée des membres (slide depuis la droite) */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            selectedOrg
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0 absolute inset-0 pointer-events-none"
          )}
        >
          {/* Header avec bouton retour */}
          <div className="flex flex-col gap-1 mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => {
                  setSelectedOrg(null);
                  setSearchTerm("");
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-[#5b4fff]/10 flex items-center justify-center">
                  <Building2 className="h-3 w-3 text-[#5b4fff]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-medium">{selectedOrg?.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    · {members.length} membre{members.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
          </div>

          {/* Search + Filter + Invite */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="cursor-pointer gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtrer
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={statusFilters.active}
                  onCheckedChange={() => toggleStatusFilter("active")}
                >
                  Actif
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilters.pending}
                  onCheckedChange={() => toggleStatusFilter("pending")}
                >
                  Invité
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilters.suspended}
                  onCheckedChange={() => toggleStatusFilter("suspended")}
                >
                  Suspendu
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              onClick={() => setInviteDialogOpen(true)}
              disabled={!canManageOrgSettings}
              className="cursor-pointer gap-2 bg-[#5b4fff] hover:bg-[#5b4fff]/90 dark:text-white whitespace-nowrap"
              title={
                !canManageOrgSettings
                  ? "Seuls les owners et admins peuvent ajouter des membres"
                  : ""
              }
            >
              <UserRoundPlusIcon size={14} />
              Inviter des membres
            </Button>
          </div>

          {/* Members Table */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Utilisateur
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      Rôle
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Équipes
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                      {searchTerm ? "Aucun membre trouvé" : "Aucun membre"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => {
                    const isCurrentUser = member.email === session?.user?.email;
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={member.avatar}
                                alt={member.name || member.email}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-[#D1D5DB] text-[#364153] text-xs">
                                {member.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {member.name || "Sans nom"}
                                {isCurrentUser && (
                                  <span className="text-muted-foreground font-normal"> (Vous)</span>
                                )}
                              </span>
                              <span className="text-sm text-muted-foreground truncate max-w-[160px]">
                                {member.email}
                              </span>
                              {member.status === "pending" && (
                                <Badge className="bg-orange-100 border-orange-300 text-orange-800 font-normal text-[10px] px-1.5 py-0">
                                  En attente
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-normal",
                              getRoleBadgeStyle(member.role)
                            )}
                          >
                            {updatingRoleForMember === member.id ? "..." : getRoleLabel(member.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">—</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {canManageOrgSettings && member.role !== "owner" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 cursor-pointer"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setMemberToChangeRole(member);
                                    setSelectedNewRole(member.role);
                                    setRoleChangeDialogOpen(true);
                                  }}
                                >
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Changer le rôle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                                  onClick={() => handleDeleteMember(member)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {member.type === "invitation"
                                    ? "Annuler l'invitation"
                                    : "Retirer de l'espace"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
        organizationId={selectedOrg?.id}
      />

      {/* Change Role Modal */}
      <Dialog
        open={roleChangeDialogOpen}
        onOpenChange={(open) => {
          setRoleChangeDialogOpen(open);
          if (!open) {
            setMemberToChangeRole(null);
            setSelectedNewRole("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
          <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
            <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
              <DialogTitle className="text-sm font-medium flex items-center gap-2">
                <KeyRound className="size-4" />
                Changer le rôle
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 px-5 pt-3 pb-0">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-lg border border-border/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={memberToChangeRole?.image} />
                  <AvatarFallback className="text-xs bg-muted">
                    {(memberToChangeRole?.name || memberToChangeRole?.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {memberToChangeRole?.name || "Sans nom"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {memberToChangeRole?.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Nouveau rôle
                </label>
                <Select value={selectedNewRole} onValueChange={setSelectedNewRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{getRoleLabel(selectedNewRole)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {["admin", "member", "accountant", "viewer"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {getRoleLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end border-t border-border/40 mt-3 px-5 py-3 -mx-5">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => {
                      setRoleChangeDialogOpen(false);
                      setMemberToChangeRole(null);
                      setSelectedNewRole("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    className="cursor-pointer"
                    disabled={
                      !selectedNewRole ||
                      selectedNewRole === memberToChangeRole?.role ||
                      updatingRoleForMember === memberToChangeRole?.id
                    }
                    onClick={async () => {
                      if (memberToChangeRole && selectedNewRole) {
                        setRoleChangeDialogOpen(false);
                        await handleRoleChange(memberToChangeRole, selectedNewRole);
                        setMemberToChangeRole(null);
                        setSelectedNewRole("");
                      }
                    }}
                  >
                    {updatingRoleForMember === memberToChangeRole?.id
                      ? "Mise à jour..."
                      : "Confirmer"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberToDelete?.type === "invitation"
                ? "Annuler l'invitation"
                : "Retirer le membre"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {memberToDelete?.type === "invitation" ? (
                <>
                  Êtes-vous sûr de vouloir annuler l'invitation envoyée à{" "}
                  <span className="font-semibold">
                    {memberToDelete?.email}
                  </span>{" "}
                  ? Cette personne ne pourra plus rejoindre l'espace.
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir retirer{" "}
                  <span className="font-semibold">
                    {memberToDelete?.name || memberToDelete?.email}
                  </span>{" "}
                  de l'espace ? Cette personne n'aura plus accès aux données.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMember}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {memberToDelete?.type === "invitation"
                ? "Annuler l'invitation"
                : "Retirer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
