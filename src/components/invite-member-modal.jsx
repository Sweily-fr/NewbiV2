"use client";

import { useState, useEffect } from "react";
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
import { X, Users, LoaderCircle } from "lucide-react";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import MultipleSelector from "@/src/components/ui/multiselect";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Callout } from "@/src/components/ui/callout";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { toast } from "@/src/components/ui/sonner";

export function InviteMemberModal({ open, onOpenChange, onSuccess }) {
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [membersWithRoles, setMembersWithRoles] = useState([]);
  const [seatsInfo, setSeatsInfo] = useState(null);
  const [existingMembers, setExistingMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { inviteMember, inviting } = useOrganizationInvitations();
  const { organization } = useDashboardLayoutContext();

  // Récupérer les informations sur les sièges et les membres existants
  useEffect(() => {
    const fetchData = async () => {
      if (!organization?.id) return;

      setIsLoading(true);
      try {
        // Récupérer les membres existants (comme dans espaces-section)
        const membersResponse = await fetch(
          `/api/organizations/${organization.id}/members`
        );

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          if (membersData.success) {
            // Extraire les emails des membres existants
            const emails = membersData.data.map((m) => m.email?.toLowerCase());
            setExistingMembers(emails.filter(Boolean));

            // Calculer les infos de sièges à partir des membres
            // Même logique que espaces-section.jsx
            const emailMap = new Map();

            membersData.data.forEach((item) => {
              let formattedItem;

              if (item.type === "member") {
                formattedItem = {
                  email: item.email,
                  role: item.role,
                  status: "active",
                  type: "member",
                  priority: 1,
                };
              } else {
                if (item.status === "canceled") return;

                formattedItem = {
                  email: item.email,
                  role: item.role,
                  status: item.status || "pending",
                  type: "invitation",
                  priority: item.status === "accepted" ? 2 : 3,
                };
              }

              const email = formattedItem.email;
              if (email) {
                const existing = emailMap.get(email);
                if (!existing || formattedItem.priority < existing.priority) {
                  emailMap.set(email, formattedItem);
                }
              }
            });

            const deduplicatedMembers = Array.from(emailMap.values());
            const membersWithoutOwner = deduplicatedMembers.filter(
              (m) => m.role !== "owner"
            );

            // Compter utilisateurs et comptables séparément
            const currentUsers = membersWithoutOwner.filter(
              (m) => m.role !== "accountant"
            ).length;
            const currentAccountants = membersWithoutOwner.filter(
              (m) => m.role === "accountant"
            ).length;

            // Récupérer le plan de l'organisation depuis la DB
            const subResponse = await fetch(
              `/api/organizations/${organization.id}/subscription`
            );

            // Nouvelles limites par plan
            const planLimitsConfig = {
              freelance: { users: 0, accountants: 1, canAddPaidUsers: false },
              pme: { users: 10, accountants: 3, canAddPaidUsers: true },
              entreprise: { users: 25, accountants: 5, canAddPaidUsers: true },
            };

            let planName = "freelance";

            console.log("🔍 Subscription response status:", subResponse.status);

            if (subResponse.ok) {
              const subData = await subResponse.json();
              console.log("📊 Subscription data:", subData);
              planName = subData.plan?.toLowerCase() || "freelance";
            } else {
              console.error(
                "❌ Erreur récupération subscription:",
                subResponse.status
              );
            }

            const planLimits =
              planLimitsConfig[planName] || planLimitsConfig.freelance;
            const availableUsers = Math.max(0, planLimits.users - currentUsers);
            const availableAccountants = Math.max(
              0,
              planLimits.accountants - currentAccountants
            );

            setSeatsInfo({
              currentUsers,
              currentAccountants,
              includedUsers: planLimits.users,
              includedAccountants: planLimits.accountants,
              availableUsers,
              availableAccountants,
              canAddPaidUsers: planLimits.canAddPaidUsers,
              plan: planName,
              seatCost: 7.49,
            });

            console.log("📊 Seats info calculé:", {
              currentUsers,
              currentAccountants,
              includedUsers: planLimits.users,
              includedAccountants: planLimits.accountants,
              availableUsers,
              availableAccountants,
              canAddPaidUsers: planLimits.canAddPaidUsers,
              plan: planName,
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, organization?.id]);

  // Quand on ajoute des emails, les ajouter à la liste avec un rôle par défaut
  const handleEmailsChange = (emails) => {
    // Filtrer les emails qui existent déjà dans l'organisation
    const validEmails = [];
    const duplicateEmails = [];

    emails.forEach((email) => {
      const emailValue = (email.value || email.label).toLowerCase();
      if (existingMembers.includes(emailValue)) {
        duplicateEmails.push(emailValue);
      } else {
        validEmails.push(email);
      }
    });

    // Afficher un toast si des emails sont déjà membres
    if (duplicateEmails.length > 0) {
      toast.error(
        `${duplicateEmails.length} email${duplicateEmails.length > 1 ? "s" : ""} déjà membre${duplicateEmails.length > 1 ? "s" : ""} de l'organisation`,
        {
          description: duplicateEmails.join(", "),
        }
      );
    }

    setInvitedEmails(validEmails);

    // Ajouter les nouveaux emails à la liste avec rôle par défaut
    const newMembers = validEmails.map((email) => {
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
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base font-medium text-lg">
            Inviter des membres
          </DialogTitle>
          <div className="space-y-3">
            <p className="text-sm font-normal text-foreground">
              Invitez des personnes dans votre espace :
            </p>
            <p className="text-xs text-muted-foreground">
              Tapez l'email puis appuyez sur{" "}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">
                Entrée
              </kbd>{" "}
              pour ajouter des utilisateurs et leur appliquer un rôle.
            </p>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Affichage des membres actuels et sièges disponibles */}
            {seatsInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 rounded-lg border border-border/50">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {seatsInfo.currentUsers}
                      </span>{" "}
                      utilisateur{seatsInfo.currentUsers > 1 ? "s" : ""} •{" "}
                      <span className="font-medium text-foreground">
                        {seatsInfo.availableUsers}
                      </span>{" "}
                      disponible{seatsInfo.availableUsers > 1 ? "s" : ""} sur{" "}
                      <span className="font-medium text-foreground">
                        {seatsInfo.includedUsers}
                      </span>
                      {seatsInfo.canAddPaidUsers &&
                        seatsInfo.availableUsers === 0 && (
                          <span className="text-amber-600 dark:text-amber-400">
                            {" "}
                            (+7,49€/mois)
                          </span>
                        )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 rounded-lg border border-border/50">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {seatsInfo.currentAccountants}
                      </span>{" "}
                      comptable{seatsInfo.currentAccountants > 1 ? "s" : ""} •{" "}
                      <span className="font-medium text-foreground">
                        {seatsInfo.availableAccountants}
                      </span>{" "}
                      disponible{seatsInfo.availableAccountants > 1 ? "s" : ""}{" "}
                      sur{" "}
                      <span className="font-medium text-foreground">
                        {seatsInfo.includedAccountants}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

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

            {/* Callout pour la facturation */}
            {seatsInfo && (
              <Callout type="neutral" noMargin>
                <p className="text-xs">
                  {seatsInfo.plan === "freelance" ? (
                    <>
                      <strong>Plan Freelance :</strong> Vous pouvez inviter{" "}
                      <strong>{seatsInfo.includedAccountants} comptable</strong>{" "}
                      gratuit. Pour inviter des collaborateurs, passez au plan
                      PME ou Entreprise.
                    </>
                  ) : seatsInfo.availableUsers > 0 ? (
                    <>
                      <strong>
                        {seatsInfo.availableUsers} siège
                        {seatsInfo.availableUsers > 1 ? "s" : ""} utilisateur
                      </strong>{" "}
                      inclus dans votre abonnement. Au-delà, chaque utilisateur
                      supplémentaire sera facturé <strong>7,49€/mois</strong>.{" "}
                      <strong>
                        {seatsInfo.includedAccountants} comptable
                        {seatsInfo.includedAccountants > 1 ? "s" : ""}
                      </strong>{" "}
                      gratuit{seatsInfo.includedAccountants > 1 ? "s" : ""}.
                    </>
                  ) : (
                    <>
                      <strong>Limite atteinte :</strong> L'ajout d'un
                      utilisateur sera facturé <strong>7,49€/mois</strong>.{" "}
                      <strong>
                        {seatsInfo.availableAccountants} comptable
                        {seatsInfo.availableAccountants > 1 ? "s" : ""}
                      </strong>{" "}
                      disponible{seatsInfo.availableAccountants > 1 ? "s" : ""}.
                    </>
                  )}
                </p>
              </Callout>
            )}

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
                            <SelectValue>
                              {getRoleLabel(member.role)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex flex-col">
                                <span className="font-normal text-sm">
                                  Administrateur
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Gestion complète
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="member">
                              <div className="flex flex-col">
                                <span className="font-normal text-sm">
                                  Membre
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Accès standard
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="guest">
                              <div className="flex flex-col">
                                <span className="font-normal text-sm">
                                  Invité
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Accès limité
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="accountant">
                              <div className="flex flex-col">
                                <span className="font-normal text-sm">
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
                className="flex-1 h-9 text-sm font-normal bg-[#5b4fff] hover:bg-[#5b4fff]/90 cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviting
                  ? "Envoi..."
                  : `Inviter ${membersWithRoles.length} membre${membersWithRoles.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
