"use client";

import { useEffect, useState } from "react";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
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
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { MoreHorizontal, Mail, UserCheck, UserX, Trash2 } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

export default function MembersTable({ refreshTrigger, onRefresh }) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const {
    getAllCollaborators,
    removeMember,
    cancelInvitation,
    updateMemberRole,
  } = useOrganizationInvitations();

  // Charger tous les collaborateurs (membres + invitations)
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllCollaborators();

      if (result.success) {
        setCollaborators(result.data || []);
        console.log('Collaborateurs chargés:', result.data);
      } else {
        console.error('Erreur lors du chargement des collaborateurs:', result.error);
        toast.error('Erreur lors du chargement des collaborateurs');
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et lors du refresh
  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  // Supprimer un membre
  const handleRemoveMember = async (member) => {
    const email = member.type === 'member' ? member.user?.email : member.email;
    const result = await removeMember(email);
    if (result.success) {
      loadData(); // Recharger les données
      if (onRefresh) onRefresh();
    }
  };

  // Annuler une invitation
  const handleCancelInvitation = async (invitation) => {
    const result = await cancelInvitation(invitation.id);
    if (result.success) {
      loadData(); // Recharger les données
      if (onRefresh) onRefresh();
    }
  };

  // Changer le rôle d'un membre
  const handleChangeRole = async (member, newRole) => {
    const result = await updateMemberRole(member.id, newRole);
    if (result.success) {
      loadData(); // Recharger les données
      if (onRefresh) onRefresh();
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "member":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "accepted":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Formater les données pour l'affichage
  const formattedData = collaborators.map((item) => {
    if (item.type === 'member') {
      return {
        ...item,
        email: item.user?.email,
        name: item.user?.name || item.user?.email?.split('@')[0],
        status: 'active',
      };
    } else {
      // invitation
      return {
        ...item,
        name: item.email?.split('@')[0],
        status: item.status || 'pending',
      };
    }
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formattedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <div className="text-gray-500">
                  <Mail className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Aucun collaborateur</p>
                  <p className="text-sm">Invitez des personnes à rejoindre votre organisation</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            formattedData.map((item, index) => (
              <TableRow key={`${item.type}-${item.id}`}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    {item.type === "invitation" && (
                      <Mail className="h-4 w-4 text-blue-500" />
                    )}
                    <span>{item.name || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(item.role)}>
                    {item.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(item.status)}>
                    {item.type === "member" ? "Actif" : 
                     item.status === "pending" ? "En attente" : 
                     item.status === "accepted" ? "Accepté" : 
                     item.status === "rejected" ? "Rejeté" : item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.type === "member" && item.role !== "owner" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleChangeRole(item, "admin")}
                            disabled={item.role === "admin"}
                          >
                            Promouvoir admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleChangeRole(item, "member")}
                            disabled={item.role === "member"}
                          >
                            Rétrograder membre
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Supprimer le membre
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer{" "}
                                  <strong>{item.name}</strong> de l'organisation ?
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveMember(item)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      
                      {item.type === "invitation" && item.status === "pending" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-red-600"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Annuler l'invitation
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Annuler l'invitation
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir annuler l'invitation pour{" "}
                                <strong>{item.email}</strong> ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelInvitation(item)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Annuler l'invitation
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
