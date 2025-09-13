import { MoreHorizontal, Trash2, UserCheck, UserX } from "lucide-react";
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
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { toast } from "@/src/components/ui/sonner";

export default function MemberRowActions({ row, onRefetch }) {
  const member = row.original;
  const { removeMember, cancelInvitation, updateMemberRole } =
    useOrganizationInvitations();

  // Supprimer un membre
  const handleRemoveMember = async () => {
    const email = member.type === "member" ? member.user?.email : member.email;
    const result = await removeMember(email);
    if (result.success && onRefetch) {
      onRefetch();
    }
  };

  // Annuler une invitation
  const handleCancelInvitation = async () => {
    const result = await cancelInvitation(member.id);
    if (result.success && onRefetch) {
      onRefetch();
    }
  };

  // Changer le rôle d'un membre
  const handleChangeRole = async (newRole) => {
    const result = await updateMemberRole(member.id, newRole);
    if (result.success && onRefetch) {
      onRefetch();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {member.type === "member" && member.role !== "owner" && (
          <>
            <DropdownMenuItem
              onClick={() => handleChangeRole("admin")}
              disabled={member.role === "admin"}
              className="cursor-pointer"
            >
              Promouvoir admin
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleChangeRole("member")}
              disabled={member.role === "member"}
              className="cursor-pointer"
            >
              Rétrograder membre
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  variant="destructive"
                  className="text-red-600 hover:bg-red-50 cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                  Supprimer
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer le membre</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer{" "}
                    <strong>{member.name}</strong> de l'organisation ? Cette
                    action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveMember}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {member.type === "invitation" && member.status === "pending" && (
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
                <AlertDialogTitle>Annuler l'invitation</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir annuler l'invitation pour{" "}
                  <strong>{member.email}</strong> ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelInvitation}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Annuler l'invitation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {member.type === "invitation" &&
          (member.status === "rejected" || member.status === "canceled") && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-red-600"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer l'invitation
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer l'invitation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer définitivement
                    l'invitation pour <strong>{member.email}</strong> ?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelInvitation}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
