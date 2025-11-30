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
import { X, Users } from "lucide-react";
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
  const { inviteMember, inviting } = useOrganizationInvitations();
  const { organization } = useDashboardLayoutContext();

  // Récupérer les informations sur les sièges et les membres existants
  useEffect(() => {
    const fetchData = async () => {
      if (!organization?.id) return;

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

            const currentMembers = membersWithoutOwner.length;

            // Récupérer le plan de l'organisation depuis la DB
            const subResponse = await fetch(
              `/api/organizations/${organization.id}/subscription`
            );

            let includedSeats = 1; // Par défaut freelance
            let planName = "freelance";

            console.log("🔍 Subscription response status:", subResponse.status);

            if (subResponse.ok) {
              const subData = await subResponse.json();
              console.log("📊 Subscription data:", subData);
              planName = subData.plan || "freelance";

              // Limites selon le plan
              const planLimits = {
                freelance: 1,
                pme: 10,
                entreprise: 25,
              };

              includedSeats = planLimits[planName] || 1;
              console.log(
                `✅ Plan détecté: ${planName}, sièges inclus: ${includedSeats}`
              );
            } else {
              console.error(
                "❌ Erreur récupération subscription:",
                subResponse.status
              );
            }

            const availableSeats = Math.max(0, includedSeats - currentMembers);

            setSeatsInfo({
              currentMembers,
              includedSeats,
              availableSeats,
              plan: planName,
              seatCost: 7.49,
            });

            console.log("📊 Seats info calculé:", {
              currentMembers,
              includedSeats,
              availableSeats,
              plan: planName,
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
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

        <div className="space-y-4">
          {/* Affichage des membres actuels et sièges disponibles */}
          {seatsInfo && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 rounded-lg border border-border/50">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {seatsInfo.currentMembers}
                  </span>{" "}
                  membre{seatsInfo.currentMembers > 1 ? "s" : ""} actuel
                  {seatsInfo.currentMembers > 1 ? "s" : ""} •{" "}
                  <span className="font-medium text-foreground">
                    {seatsInfo.availableSeats}
                  </span>{" "}
                  siège{seatsInfo.availableSeats > 1 ? "s" : ""} disponible
                  {seatsInfo.availableSeats > 1 ? "s" : ""} sur{" "}
                  <span className="font-medium text-foreground">
                    {seatsInfo.includedSeats}
                  </span>
                </p>
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
                {seatsInfo.availableSeats > 0 ? (
                  <>
                    Les{" "}
                    <strong>
                      {seatsInfo.availableSeats} siège
                      {seatsInfo.availableSeats > 1 ? "s" : ""} restant
                      {seatsInfo.availableSeats > 1 ? "s" : ""}
                    </strong>{" "}
                    sont inclus dans votre abonnement. Au-delà, chaque membre
                    supplémentaire sera facturé <strong>7,49€/mois</strong>.
                  </>
                ) : (
                  <>
                    <strong>Facturation :</strong> L'ajout d'un membre (admin,
                    membre ou invité) est facturé <strong>7,49€/mois</strong> en
                    plus de votre abonnement.
                  </>
                )}{" "}
                Un seul <strong>comptable gratuit</strong> par organisation est
                autorisé.
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
                          <SelectValue>{getRoleLabel(member.role)}</SelectValue>
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

          {/* Message si limite atteinte */}
          {seatsInfo &&
            seatsInfo.availableSeats === 0 &&
            membersWithRoles.length > 0 && (
              <Callout type="warning" noMargin>
                <p className="text-xs">
                  <strong>Limite atteinte !</strong> Vous avez atteint la limite
                  de{" "}
                  <strong>
                    {seatsInfo.includedSeats} membre
                    {seatsInfo.includedSeats > 1 ? "s" : ""}
                  </strong>{" "}
                  de votre plan <strong>{seatsInfo.plan}</strong>.
                  {seatsInfo.plan !== "entreprise" && (
                    <> Passez au plan supérieur pour inviter plus de membres.</>
                  )}
                </p>
              </Callout>
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
              disabled={
                inviting ||
                membersWithRoles.length === 0 ||
                (seatsInfo &&
                  seatsInfo.availableSeats === 0 &&
                  membersWithRoles.length > 0)
              }
              className="flex-1 h-9 text-sm font-normal bg-[#5b4fff] hover:bg-[#5b4fff]/90 cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviting
                ? "Envoi..."
                : seatsInfo &&
                    seatsInfo.availableSeats === 0 &&
                    membersWithRoles.length > 0
                  ? "Limite atteinte"
                  : `Inviter ${membersWithRoles.length} membre${membersWithRoles.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
