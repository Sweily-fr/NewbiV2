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
import { Label } from "@/src/components/ui/label";
import { InputEmail } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import { useForm, Controller } from "react-hook-form";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";

export default function EspacesSection() {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [memberType, setMemberType] = useState("collaborator"); // "collaborator" ou "accountant"

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      role: "member",
      message: "",
    },
  });

  const {
    getAllCollaborators,
    inviteMember,
    inviting,
    removeMember,
    cancelInvitation,
  } = useOrganizationInvitations();

  // Fetch members data using the same logic as collaborateurs page
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
              formattedItem = {
                id: item.id,
                name: item.user?.name || item.user?.email?.split("@")[0],
                email: item.user?.email,
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

  const onInviteSubmit = async (formData, event) => {
    // Empêcher la propagation vers le formulaire parent
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Déterminer le rôle basé sur le type de membre
    let role;
    if (memberType === "accountant") {
      role = "accountant";
    } else {
      role = formData.role || "member";
    }

    const result = await inviteMember({
      email: formData.email,
      role: role,
      message: formData.message,
    });

    if (result.success) {
      reset();
      setInviteDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

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
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
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

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 gap-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold">
              Inviter un membre
            </DialogTitle>
            <p className="text-xs text-foreground">
              Saisissez ou collez les adresses e-mail ci-dessous
            </p>
            {memberType === "accountant" && (
              <div className="bg-[#5b4fff]/10 border border-[#5b4fff]/50 rounded-lg p-3">
                <p className="text-xs text-[#5b4fff]/700">
                  <strong>Comptable gratuit :</strong> Un seul comptable par
                  organisation est autorisé et n'est pas facturé.
                </p>
              </div>
            )}
          </DialogHeader>

          <div className="space-y-5">
            {/* Switch Collaborateur / Comptable - Style Notion */}
            <div className="inline-flex items-center gap-1 p-0.5 bg-muted/50 rounded-md">
              <button
                type="button"
                onClick={() => setMemberType("collaborator")}
                className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                  memberType === "collaborator"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Collaborateur
              </button>
              <button
                type="button"
                onClick={() => setMemberType("accountant")}
                className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                  memberType === "accountant"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Comptable
              </button>
            </div>

            {/* Information de tarification - Minimaliste */}
            <div className="text-xs text-muted-foreground">
              {memberType === "collaborator" ? (
                <span>
                  <span className="text-[#5b4fff] font-medium">7,49€/mois</span>{" "}
                  par collaborateur additionnel
                </span>
              ) : (
                <span>
                  <span className="text-[#5b4fff] font-medium">Gratuit</span> ·
                  Un seul comptable par organisation
                </span>
              )}
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Email
                </Label>
                <InputEmail
                  id="email"
                  placeholder={
                    memberType === "collaborator"
                      ? "nom@exemple.com"
                      : "comptable@exemple.com"
                  }
                  className="h-9 text-sm"
                  {...register("email", {
                    required: "L'email est requis",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email invalide",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Champ Rôle avec hauteur fixe */}
              <div className="space-y-1.5 min-h-[68px]">
                {memberType === "collaborator" && (
                  <>
                    <Label
                      htmlFor="role"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Rôle
                    </Label>
                    <Controller
                      name="role"
                      control={control}
                      rules={{ required: "Le rôle est requis" }}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Membre</SelectItem>
                            <SelectItem value="admin">
                              Administrateur
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.role && (
                      <p className="text-xs text-red-500">
                        {errors.role.message}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setInviteDialogOpen(false)}
                  className="flex-1 h-9 text-sm cursor-pointer"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 h-9 text-sm bg-[#5b4fff] hover:bg-[#5b4fff]/90 cursor-pointer text-white"
                >
                  {inviting ? "Envoi..." : "Inviter"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

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
