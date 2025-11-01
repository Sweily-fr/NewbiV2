"use client";

import { useState, useEffect } from "react";
import {
  UserRoundPlusIcon,
  MoreHorizontal,
  Trash2,
  Search,
  Building2,
  Users,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
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
import { Badge } from "@/src/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { InviteMemberModal } from "@/src/components/invite-member-modal";
import { authClient } from "@/src/lib/auth-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

export default function EspacesSection() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Utiliser le hook pour les invitations
  const { getAllCollaborators, removeMember, cancelInvitation } =
    useOrganizationInvitations();

  // Récupérer les organisations
  const { data: organizationsList } = authClient.useListOrganizations();

  // Charger les organisations
  useEffect(() => {
    if (organizationsList) {
      setOrganizations(organizationsList);
      setLoading(false);
    }
  }, [organizationsList]);

  // Récupérer les membres d'une organisation spécifique
  useEffect(() => {
    if (!selectedOrg) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        setMembersLoading(true);
        const result = await getAllCollaborators(selectedOrg.id);

        if (result.success) {
          // Format and deduplicate data
          const emailMap = new Map();

          result.data.forEach((item) => {
            let formattedItem;

            if (item.type === "member") {
              const avatar =
                item.user?.avatar || item.avatar || item.user?.image || null;

              formattedItem = {
                id: item.id,
                name:
                  item.user?.name ||
                  item.name ||
                  item.user?.email?.split("@")[0],
                email: item.user?.email || item.email,
                avatar: avatar,
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
                name: item.email?.split("@")[0],
                email: item.email,
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
                  new Date(formattedItem.createdAt) >
                    new Date(existing.createdAt))
              ) {
                emailMap.set(email, formattedItem);
              }
            }
          });

          const deduplicatedMembers = Array.from(emailMap.values());
          const membersWithoutOwner = deduplicatedMembers.filter(
            (m) => m.role !== "owner"
          );

          setMembers(membersWithoutOwner);
        } else {
          console.error("Error fetching members:", result.error);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [selectedOrg, refreshTrigger]);

  // Filter members based on search term and status (only active members)
  const filteredMembers = members.filter(
    (member) =>
      member.status === "active" &&
      (member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        result = await removeMember(memberToDelete.email);

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
      case "guest":
        return "bg-orange-100 border-orange-300 text-orange-800 font-normal";
      case "accountant":
        return "bg-purple-100 border-purple-300 text-purple-800 font-normal";
      case "owner":
        return "bg-green-100 border-green-300 text-green-800 font-normal";
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
      case "guest":
        return "Invité";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gestion des espaces</h3>
          <p className="text-sm text-muted-foreground">
            Gérez vos organisations et leurs membres.
          </p>
        </div>
      </div>

      {/* Organizations Table */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organisation</TableHead>
              <TableHead>Membres</TableHead>
              <TableHead>Accès</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Aucune organisation
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow
                  key={org.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleOrgClick(org)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3 pt-3 pb-3">
                      <div className="h-8 w-8 rounded-md bg-[#5b4fff]/10 flex items-center justify-center">
                        <Building2 className="h-3.5 w-3.5 text-[#5b4fff]" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{org.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {org.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {org.memberCount || 0} membre
                        {(org.memberCount || 0) > 1 ? "s" : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-gray-100 border-gray-300 text-gray-800 font-normal">
                      Défaut
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal des membres de l'organisation */}
      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent
          className="flex flex-col !max-w-[45vw] !w-[45vw] max-h-[85vh] sm:!max-w-[1000px] p-0 gap-0"
          style={{ maxWidth: "45vw", width: "45vw", minHeight: "60vh" }}
        >
          {/* Header fixe */}
          <div className="px-6 py-5 border-b bg-white dark:bg-[#0A0A0A]">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-[#5b4fff]/10 flex items-center justify-center">
                <Building2 className="h-3 w-3 text-[#5b4fff]" />
              </div>
              <div className="flex items-baseline gap-2">
                <DialogTitle className="text-sm font-medium m-0">
                  {selectedOrg?.name}
                </DialogTitle>
                .
                <span className="text-xs text-muted-foreground">
                  {members.length} membre{members.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Contenu scrollable */}
          <div className="px-6 py-4 space-y-4 bg-white dark:bg-[#0A0A0A]">
            {/* Search et bouton */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un membre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button
                type="button"
                onClick={() => setInviteDialogOpen(true)}
                className="flex items-center gap-1.5 font-normal cursor-pointer bg-[#5b4fff] hover:bg-[#5b4fff]/90 dark:text-white px-3 h-9"
              >
                <UserRoundPlusIcon size={14} />
                Ajouter des membres
              </Button>
            </div>

            {/* Members Table */}
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="text-right">Rôle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersLoading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8">
                        {searchTerm ? "Aucun membre trouvé" : "Aucun membre"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
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
                            <div>
                              <div className="font-normal text-sm">
                                {member.name || "Sans nom"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={member.role}
                            onValueChange={(newRole) => {
                              // TODO: Implémenter le changement de rôle
                              console.log(
                                `Changer le rôle de ${member.email} à ${newRole}`
                              );
                            }}
                          >
                            <SelectTrigger className="w-[240px] border-none shadow-none cursor-pointer hover:bg-[#F0EFED]/90 ml-auto transition-colors">
                              <SelectValue>
                                <div className="flex flex-col items-start">
                                  <span className="font-normal text-sm">
                                    {getRoleLabel(member.role)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {getRoleLabel(member.role)} de l'espace
                                    d'équipe
                                  </span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">
                                <div className="flex flex-col">
                                  <span className="font-normal text-sm">
                                    Propriétaire
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Propriétaire de l'espace d'équipe
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex flex-col">
                                  <span className="font-normal text-sm">
                                    Administrateur
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Administrateur de l'espace d'équipe
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="member">
                                <div className="flex flex-col">
                                  <span className="font-normal text-sm">
                                    Membre
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Membre de l'espace d'équipe
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="accountant">
                                <div className="flex flex-col">
                                  <span className="font-normal text-sm">
                                    Comptable
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Comptable de l'espace d'équipe
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="guest">
                                <div className="flex flex-col">
                                  <span className="font-normal text-sm">
                                    Invité
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Invité de l'espace d'équipe
                                  </span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Member Modal */}
      <InviteMemberModal
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-semibold">
                {memberToDelete?.name || memberToDelete?.email}
              </span>{" "}
              de l'organisation ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
