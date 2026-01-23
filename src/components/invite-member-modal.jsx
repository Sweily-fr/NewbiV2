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
import { X, Users, LoaderCircle, CreditCard } from "lucide-react";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import MultipleSelector from "@/src/components/ui/multiselect";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Callout } from "@/src/components/ui/callout";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { toast } from "@/src/components/ui/sonner";
import { getPlanLimits, SEAT_PRICE } from "@/src/lib/plan-limits";

export function InviteMemberModal({ open, onOpenChange, onSuccess, organizationId: propOrganizationId = null }) {
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [membersWithRoles, setMembersWithRoles] = useState([]);
  const [seatsInfo, setSeatsInfo] = useState(null);
  const [existingMembers, setExistingMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaidSeatsConfirm, setShowPaidSeatsConfirm] = useState(false);
  const [paidSeatsInfo, setPaidSeatsInfo] = useState(null);
  const { inviteMember, inviting } = useOrganizationInvitations();
  const { organization: dashboardOrganization } = useDashboardLayoutContext();

  // Utiliser l'organizationId fourni en prop, sinon celui du dashboard
  const targetOrganizationId = propOrganizationId || dashboardOrganization?.id;

  // Récupérer les informations sur les sièges et les membres existants
  useEffect(() => {
    const fetchData = async () => {
      if (!targetOrganizationId) return;

      setIsLoading(true);
      try {
        // Récupérer les membres existants (comme dans espaces-section)
        const membersResponse = await fetch(
          `/api/organizations/${targetOrganizationId}/members`
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
              `/api/organizations/${targetOrganizationId}/subscription`
            );

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

            // Utiliser les limites centralisées
            const planLimits = getPlanLimits(planName);
            const availableUsers = Math.max(0, planLimits.invitableUsers - currentUsers);
            const availableAccountants = Math.max(
              0,
              planLimits.accountants - currentAccountants
            );

            setSeatsInfo({
              currentUsers,
              currentAccountants,
              includedUsers: planLimits.invitableUsers,
              includedAccountants: planLimits.accountants,
              availableUsers,
              availableAccountants,
              canAddPaidUsers: planLimits.canAddPaidUsers,
              plan: planName,
              seatCost: SEAT_PRICE,
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
  }, [open, targetOrganizationId]);

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

  // Vérifier les limites et demander confirmation si sièges payants
  const handleInviteAll = async () => {
    if (!targetOrganizationId || membersWithRoles.length === 0) return;

    // 1. Compter les utilisateurs et comptables dans le batch
    const newUsers = membersWithRoles.filter((m) => m.role !== "accountant").length;
    const newAccountants = membersWithRoles.filter((m) => m.role === "accountant").length;

    // 2. Vérifier les limites AVANT d'envoyer (évite la race condition)
    const totalUsersAfter = (seatsInfo?.currentUsers || 0) + newUsers;
    const totalAccountantsAfter = (seatsInfo?.currentAccountants || 0) + newAccountants;

    // Vérifier limite comptables
    if (totalAccountantsAfter > (seatsInfo?.includedAccountants || 0)) {
      toast.error(
        `Limite de ${seatsInfo?.includedAccountants} comptable(s) dépassée. Vous essayez d'ajouter ${newAccountants} comptable(s) mais il n'en reste que ${seatsInfo?.availableAccountants}.`
      );
      return;
    }

    // Vérifier limite utilisateurs
    const usersOverLimit = totalUsersAfter - (seatsInfo?.includedUsers || 0);
    if (usersOverLimit > 0 && !seatsInfo?.canAddPaidUsers) {
      toast.error(
        `Le plan ${seatsInfo?.plan?.toUpperCase()} ne permet pas d'inviter d'utilisateurs. Passez au plan PME ou ENTREPRISE.`
      );
      return;
    }

    // 3. Demander confirmation si sièges payants
    if (usersOverLimit > 0 && seatsInfo?.canAddPaidUsers) {
      const additionalCost = usersOverLimit * SEAT_PRICE;
      setPaidSeatsInfo({
        count: usersOverLimit,
        monthlyCost: additionalCost,
      });
      setShowPaidSeatsConfirm(true);
      return;
    }

    // 4. Envoyer les invitations directement si pas de surcoût
    await sendAllInvitations();
  };

  // Envoyer toutes les invitations
  const sendAllInvitations = async () => {
    const results = [];
    const errors = [];

    for (const member of membersWithRoles) {
      const result = await inviteMember({
        email: member.email,
        role: member.role,
        organizationId: targetOrganizationId,
      });

      if (result.success) {
        results.push(member.email);
      } else {
        errors.push({ email: member.email, error: result.error });
      }
    }

    // Afficher le résumé
    if (errors.length > 0) {
      toast.error(
        `${errors.length} invitation(s) échouée(s)`,
        { description: errors.map((e) => e.email).join(", ") }
      );
    }

    if (results.length > 0) {
      toast.success(`${results.length} invitation(s) envoyée(s)`);
    }

    // Réinitialiser et fermer
    setInvitedEmails([]);
    setMembersWithRoles([]);
    setShowPaidSeatsConfirm(false);
    setPaidSeatsInfo(null);
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
    <>
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

    {/* Dialog de confirmation pour sièges payants */}
    <AlertDialog open={showPaidSeatsConfirm} onOpenChange={setShowPaidSeatsConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-500" />
            Sièges supplémentaires
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {paidSeatsInfo && (
              <>
                Vous avez atteint la limite de votre plan. L'ajout de{" "}
                <span className="font-medium text-foreground">
                  {paidSeatsInfo.count} utilisateur{paidSeatsInfo.count > 1 ? "s" : ""}
                </span>{" "}
                supplémentaire{paidSeatsInfo.count > 1 ? "s" : ""} entraînera une facturation de{" "}
                <span className="font-medium text-foreground">
                  {paidSeatsInfo.monthlyCost.toFixed(2).replace(".", ",")}€/mois
                </span>
                .
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setShowPaidSeatsConfirm(false);
              setPaidSeatsInfo(null);
            }}
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={sendAllInvitations}
            disabled={inviting}
            className="bg-[#5b4fff] hover:bg-[#5b4fff]/90"
          >
            {inviting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              "Confirmer et inviter"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
