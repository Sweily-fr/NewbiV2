"use client";

import { useState, useEffect } from "react";
import {
  UserRoundPlusIcon,
  MoreHorizontal,
  Trash2,
  Search,
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

export default function EspacesSection() {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Utiliser le hook pour les invitations
  const {
    getAllCollaborators,
    removeMember,
    cancelInvitation,
  } = useOrganizationInvitations();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Récupérer les membres
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const result = await getAllCollaborators();

        if (result.success) {
          // Format and deduplicate data exactly like collaborateurs page
          const emailMap = new Map();

          result.data.forEach((item) => {
            let formattedItem;

            if (item.type === "member") {
              // Debug: afficher la structure complète
              console.log("📦 Structure item:", JSON.stringify(item, null, 2));

              // Essayer différentes structures pour l'avatar
              const avatar =
                item.user?.avatar || item.avatar || item.user?.image || null;

              console.log(
                "🖼️ Avatar pour",
                item.user?.email || item.email,
                ":",
                avatar
              );

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
                priority: 1, // Priorité la plus haute pour les membres actifs
                createdAt: item.createdAt || new Date(),
              };
            } else {
              // invitation - ignorer les invitations annulées
              if (item.status === "canceled") {
                return; // Skip canceled invitations
              }

              formattedItem = {
                id: item.id,
                name: item.email?.split("@")[0],
                email: item.email,
                role: item.role,
                status: item.status || "pending",
                type: "invitation",
                priority: item.status === "accepted" ? 2 : 3, // Accepté > Pending
                createdAt: item.createdAt || new Date(),
              };
            }

            const email = formattedItem.email;
            if (email) {
              const existing = emailMap.get(email);

              // Garder l'entrée avec la priorité la plus haute (plus petit nombre)
              // ou la plus récente si même priorité
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
          setMembers(deduplicatedMembers);
        } else {
          console.error("Error fetching members:", result.error);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [refreshTrigger]);

  // Filter members based on search term
  const filteredMembers = members.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gestion des espaces</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les membres de votre organisation et leurs accès.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setInviteDialogOpen(true)}
          className="flex items-center gap-2 font-normal cursor-pointer bg-[#5b4fff] hover:bg-[#5b4fff]/90 dark:text-white"
        >
          <UserRoundPlusIcon size={16} />
          Inviter un membre
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 w-1/2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Members Table */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
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
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {searchTerm ? "Aucun membre trouvé" : "Aucun membre"}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id} className="pt-6 pb-6">
                  <TableCell>
                    <div className="flex items-center gap-3 pt-3 pb-3">
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
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeStyle(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>
                      {member.role === "accountant" && (
                        <Badge className="bg-green-100 border-green-300 text-green-800 font-normal">
                          Gratuit
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        member.status === "active"
                          ? "bg-green-100 border-green-300 text-green-800 font-normal"
                          : "bg-orange-100 border-orange-300 text-orange-800 font-normal"
                      }
                    >
                      {member.status === "active" ? "Actif" : "En attente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteMember(member)}
                          className="text-red-600 hover:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
