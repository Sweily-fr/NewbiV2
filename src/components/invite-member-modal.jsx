"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { X } from "lucide-react";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import MultipleSelector from "@/src/components/ui/multiselect";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Callout } from "@/src/components/ui/callout";

export function InviteMemberModal({ open, onOpenChange, onSuccess }) {
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [membersWithRoles, setMembersWithRoles] = useState([]);
  const { inviteMember, inviting } = useOrganizationInvitations();

  // Quand on ajoute des emails, les ajouter à la liste avec un rôle par défaut
  const handleEmailsChange = (emails) => {
    setInvitedEmails(emails);

    // Ajouter les nouveaux emails à la liste avec rôle par défaut
    const newMembers = emails.map((email) => {
      const existingMember = membersWithRoles.find(
        (m) => m.email === (email.value || email.label)
      );
      return (
        existingMember || {
          email: email.value || email.label,
          role: "member",
        }
      );
    });

    setMembersWithRoles(newMembers);
  };

  // Changer le rôle d'un membre
  const handleRoleChange = (email, newRole) => {
    setMembersWithRoles((prev) =>
      prev.map((member) =>
        member.email === email ? { ...member, role: newRole } : member
      )
    );
  };

  // Supprimer un membre
  const handleRemoveMember = (emailToRemove) => {
    setInvitedEmails((prev) =>
      prev.filter((e) => (e.value || e.label) !== emailToRemove)
    );
    setMembersWithRoles((prev) =>
      prev.filter((m) => m.email !== emailToRemove)
    );
  };

  // Envoyer les invitations
  const handleInviteAll = async () => {
    for (const member of membersWithRoles) {
      await inviteMember({
        email: member.email,
        role: member.role,
      });
    }

    // Réinitialiser et fermer
    setInvitedEmails([]);
    setMembersWithRoles([]);
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-6 gap-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-medium text-lg">
            Inviter des membres
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Saisissez ou collez les adresses e-mail ci-dessous
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Champ d'ajout d'emails */}
          <div className="space-y-2">
            <MultipleSelector
              value={invitedEmails}
              onChange={handleEmailsChange}
              placeholder="Entrez des adresses email"
              creatable
              className="w-full"
            />
          </div>

          {/* Callout pour le comptable gratuit */}
          <Callout type="neutral" noMargin>
            <p className="text-xs">
              <strong>Comptable gratuit :</strong> Un seul comptable par
              organisation est autorisé et n'est pas facturé. L'ajout d'autres membres sera facturé en plus de votre abonnement.
            </p>
          </Callout>

          {/* Liste des membres ajoutés */}
          {membersWithRoles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Membres à inviter ({membersWithRoles.length})
              </p>
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {membersWithRoles.map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center justify-between p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-xs">
                          {member.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.email}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(newRole) =>
                          handleRoleChange(member.email, newRole)
                        }
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs border-none shadow-none hover:bg-muted">
                          <SelectValue>{getRoleLabel(member.role)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                Administrateur
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Gestion complète
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="member">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                Membre
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Accès standard
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="guest">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                Invité
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Accès limité
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="accountant">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                Comptable
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Accès comptabilité
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.email)}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setInvitedEmails([]);
                setMembersWithRoles([]);
                onOpenChange(false);
              }}
              className="flex-1 h-9 text-sm cursor-pointer font-normal"
            >
              Annuler
            </Button>
            <Button
              onClick={handleInviteAll}
              disabled={inviting || membersWithRoles.length === 0}
              className="flex-1 h-9 text-sm font-normal bg-[#5b4fff] hover:bg-[#5b4fff]/90 cursor-pointer text-white"
            >
              {inviting
                ? "Envoi..."
                : `Inviter ${membersWithRoles.length} membre${membersWithRoles.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
