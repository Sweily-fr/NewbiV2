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
              // invitation
              formattedItem = {
                id: item.id,
                name: item.email?.split("@")[0],
                email: item.email,
                role: item.role,
                status: item.status || "pending",
                type: "invitation",
                priority: item.status === "accepted" ? 2 : 3, // Accepté > Pending/Canceled
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

  const onInviteSubmit = async (formData) => {
    const result = await inviteMember({
      email: formData.email,
      role: formData.role,
      message: formData.message,
    });

    if (result.success) {
      reset();
      setInviteDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleDeleteMember = async (member) => {
    try {
      let result;
      if (member.type === "member") {
        result = await removeMember(member.email);
      } else {
        result = await cancelInvitation(member.id);
      }

      if (result.success) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "default";
      case "member":
        return "secondary";
      case "guest":
        return "outline";
      default:
        return "secondary";
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
          onClick={() => setInviteDialogOpen(true)}
          className="flex items-center gap-2 font-normal cursor-pointer"
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
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
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
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.status === "active" ? "default" : "secondary"
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
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
        <DialogContent
          className={`overflow-y-auto overflow-x-hidden ${
            isMobile
              ? "!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !rounded-none !translate-x-0 !translate-y-0 !p-6"
              : "sm:max-w-lg"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <UserRoundPlusIcon className="opacity-80" size={20} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center font-medium">
                Inviter des membres
              </DialogTitle>
              <DialogDescription className="text-center w-full max-w-sm mx-auto">
                Inviter des membres pour qu'ils puissent utiliser vos outils.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            onSubmit={handleSubmit(onInviteSubmit)}
            className="space-y-5 pt-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-normal">
                  Email du collaborateur
                </Label>
                <InputEmail
                  id="email"
                  placeholder="collaborateur@exemple.com"
                  {...register("email", {
                    required: "L'email est requis",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email invalide",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="font-normal">
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
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membre</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="font-normal">
                  Message (optionnel)
                </Label>
                <Textarea
                  id="message"
                  placeholder="Ajoutez un message personnalisé à votre invitation..."
                  rows={3}
                  {...register("message")}
                />
                <p className="text-xs text-muted-foreground">
                  Ce message sera inclus dans l'email d'invitation
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={inviting}
              >
                {inviting ? "Envoi en cours..." : "Envoyer l'invitation"}
              </Button>
              <Button
                type="button"
                className="w-full cursor-pointer"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
