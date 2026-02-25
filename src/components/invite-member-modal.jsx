"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { LoaderCircle, CreditCard, X, AlertTriangle, Users, CornerDownLeft } from "lucide-react";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { Progress } from "@/src/components/ui/progress";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { toast } from "@/src/components/ui/sonner";
import { getPlanLimits, SEAT_PRICE } from "@/src/lib/plan-limits";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMemberModal({ open, onOpenChange, onSuccess, organizationId: propOrganizationId = null }) {
  const [emails, setEmails] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [role, setRole] = useState("member");
  const [seatsInfo, setSeatsInfo] = useState(null);
  const [existingMembers, setExistingMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaidSeatsConfirm, setShowPaidSeatsConfirm] = useState(false);
  const [paidSeatsInfo, setPaidSeatsInfo] = useState(null);
  const { inviteMember, inviting } = useOrganizationInvitations();
  const { organization: dashboardOrganization } = useDashboardLayoutContext();
  const inputRef = useRef(null);

  const targetOrganizationId = propOrganizationId || dashboardOrganization?.id;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setEmails([]);
      setInputValue("");
      setRole("member");
      setShowPaidSeatsConfirm(false);
      setPaidSeatsInfo(null);
    }
  }, [open]);

  // Récupérer les informations sur les sièges et les membres existants
  useEffect(() => {
    const fetchData = async () => {
      if (!targetOrganizationId) return;

      setIsLoading(true);
      try {
        const membersResponse = await fetch(
          `/api/organizations/${targetOrganizationId}/members`
        );

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          if (membersData.success) {
            const memberEmails = membersData.data.map((m) => m.email?.toLowerCase());
            setExistingMembers(memberEmails.filter(Boolean));

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

            const currentUsers = membersWithoutOwner.filter(
              (m) => m.role !== "accountant"
            ).length;
            const currentAccountants = membersWithoutOwner.filter(
              (m) => m.role === "accountant"
            ).length;

            const subResponse = await fetch(
              `/api/organizations/${targetOrganizationId}/subscription`
            );

            let planName = "freelance";

            if (subResponse.ok) {
              const subData = await subResponse.json();
              planName = subData.plan?.toLowerCase() || "freelance";
            }

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

            // Set default role for freelance plan
            if (planName === "freelance") {
              setRole("accountant");
            }
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

  // Add email as tag
  const addEmail = useCallback((value) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    if (emails.includes(trimmed)) {
      toast.error("Cet email est déjà dans la liste");
      setInputValue("");
      return;
    }
    setEmails((prev) => [...prev, trimmed]);
    setInputValue("");
  }, [emails]);

  // Remove email tag
  const removeEmail = useCallback((index) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle key events in the tag input
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab" || e.key === " ") {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmail(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      removeEmail(emails.length - 1);
    }
  };

  // Handle paste (multiple emails separated by comma/space/newline/semicolon)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const pastedEmails = pasteData.split(/[,;\s\n]+/).filter(Boolean);
    const newEmails = [];
    for (const email of pastedEmails) {
      const trimmed = email.trim().toLowerCase();
      if (trimmed && !emails.includes(trimmed) && !newEmails.includes(trimmed)) {
        newEmails.push(trimmed);
      }
    }
    if (newEmails.length > 0) {
      setEmails((prev) => [...prev, ...newEmails]);
    }
    setInputValue("");
  };

  // Click on container focuses the input
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Check if an email is valid
  const isEmailValid = (email) => EMAIL_REGEX.test(email);

  // Check if an email is already a member
  const isExistingMember = (email) => existingMembers.includes(email.toLowerCase());

  // Get available roles based on plan
  const isFreelance = seatsInfo?.plan === "freelance";
  const getAvailableRoles = () => {
    if (isFreelance) return ["accountant"];
    return ["member", "admin", "viewer", "accountant"];
  };

  const getRoleLabel = (r) => {
    switch (r) {
      case "admin": return "Administrateur";
      case "member": return "Membre";
      case "viewer": return "Lecteur";
      case "accountant": return "Comptable";
      case "owner": return "Propriétaire";
      default: return r;
    }
  };

  // Vérifier les limites et demander confirmation si sièges payants
  const handleInviteAll = async () => {
    // Add current input value if any before submitting
    let finalEmails = [...emails];
    if (inputValue.trim()) {
      const trimmed = inputValue.trim().toLowerCase();
      if (!finalEmails.includes(trimmed)) {
        finalEmails.push(trimmed);
        setEmails(finalEmails);
      }
      setInputValue("");
    }

    if (!targetOrganizationId || finalEmails.length === 0) return;

    // Validate emails
    const invalidEmails = finalEmails.filter((e) => !isEmailValid(e));
    if (invalidEmails.length > 0) {
      toast.error("Certaines adresses email ne sont pas valides", {
        description: invalidEmails.join(", "),
      });
      return;
    }

    // Check for existing members
    const duplicates = finalEmails.filter((e) => isExistingMember(e));
    if (duplicates.length > 0) {
      toast.error(
        `${duplicates.length} email${duplicates.length > 1 ? "s" : ""} déjà membre${duplicates.length > 1 ? "s" : ""} de l'organisation`,
        { description: duplicates.join(", ") }
      );
      return;
    }

    // Compter selon le rôle unique sélectionné
    const newUsers = role !== "accountant" ? finalEmails.length : 0;
    const newAccountants = role === "accountant" ? finalEmails.length : 0;

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

    // Demander confirmation si sièges payants
    if (usersOverLimit > 0 && seatsInfo?.canAddPaidUsers) {
      const additionalCost = usersOverLimit * SEAT_PRICE;
      setPaidSeatsInfo({
        count: usersOverLimit,
        monthlyCost: additionalCost,
      });
      setShowPaidSeatsConfirm(true);
      return;
    }

    await sendAllInvitations(finalEmails);
  };

  // Envoyer toutes les invitations
  const sendAllInvitations = async (emailList) => {
    const toSend = emailList || emails;
    const results = [];
    const errors = [];

    for (const email of toSend) {
      const result = await inviteMember({
        email,
        role,
        organizationId: targetOrganizationId,
      });

      if (result.success) {
        results.push(email);
      } else {
        errors.push({ email, error: result.error });
      }
    }

    if (errors.length > 0) {
      toast.error(
        `${errors.length} invitation(s) échouée(s)`,
        { description: errors.map((e) => e.email).join(", ") }
      );
    }

    if (results.length > 0) {
      toast.success(`${results.length} invitation(s) envoyée(s)`);
    }

    setEmails([]);
    setInputValue("");
    setRole("member");
    setShowPaidSeatsConfirm(false);
    setPaidSeatsInfo(null);
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden" style={{ boxShadow: "rgba(0, 0, 0, 0.07) 0px 0px 0px 1px" }}>
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
          <DialogTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="size-4" />
            Inviter des membres
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground/50" />
          </div>
        ) : (
          <div className="space-y-3 px-5 pt-3 pb-0">
            {/* Tag input for emails */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Envoyer l'invitation à ...
              </label>
              <div
                onClick={handleContainerClick}
                className="min-h-[90px] max-h-[160px] overflow-y-auto rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
              >
                <div className="flex flex-wrap gap-1.5">
                  {emails.map((email, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary/80 border border-border/50 px-2.5 py-1 text-sm"
                    >
                      {(!isEmailValid(email) || isExistingMember(email)) && (
                        <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                      )}
                      <span className="truncate max-w-[200px]">{email}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEmail(index);
                        }}
                        className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5 shrink-0"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      // Auto-add if user types a comma or space after an email
                      const val = e.target.value;
                      if (val.endsWith(",") || val.endsWith(";")) {
                        const email = val.slice(0, -1).trim();
                        if (email) addEmail(email);
                      } else {
                        setInputValue(val);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onBlur={() => {
                      if (inputValue.trim()) addEmail(inputValue);
                    }}
                    placeholder={emails.length === 0 ? "exemple@email.com" : ""}
                    className="flex-1 min-w-[180px] bg-transparent outline-none placeholder:text-muted-foreground py-1"
                  />
                </div>
              </div>
            </div>

            {/* Invite as - single role for all */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Inviter en tant que
              </label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <SelectValue>{getRoleLabel(role)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((r) => (
                    <SelectItem key={r} value={r}>
                      {getRoleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seat usage indicators */}
            {seatsInfo && (() => {
              const usedUsers = (seatsInfo.currentUsers || 0) + (role !== "accountant" ? emails.length : 0);
              const usedAccountants = (seatsInfo.currentAccountants || 0) + (role === "accountant" ? emails.length : 0);

              return (
                <div className="space-y-2">
                  {!isFreelance && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {usedUsers}
                        </span>{" "}
                        / {seatsInfo.includedUsers} utilisateur{seatsInfo.includedUsers > 1 ? "s" : ""}
                        {seatsInfo.includedAccountants > 0 && (
                          <>
                            {" "}&middot;{" "}
                            <span className="font-medium text-foreground">
                              {usedAccountants}
                            </span>{" "}
                            / {seatsInfo.includedAccountants} comptable{seatsInfo.includedAccountants > 1 ? "s" : ""}
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  {isFreelance && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {usedAccountants}
                        </span>{" "}
                        / {seatsInfo.includedAccountants} comptable{seatsInfo.includedAccountants > 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Send invites button - aligned right */}
            <div className="flex justify-end border-t border-border/40 mt-3 px-5 py-3 -mx-5">
              <Button
                variant="primary"
                onClick={handleInviteAll}
                disabled={inviting || emails.length === 0}
                className="gap-2"
              >
                {inviting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    Envoyer les invitations
                    <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                      <CornerDownLeft className="size-3" />
                    </kbd>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        </div>
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
            onClick={() => sendAllInvitations()}
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
