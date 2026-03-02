"use client";

import { UserPlus, Link2, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Progress } from "@/src/components/ui/progress";
import { toast } from "@/src/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { getPlanLimits } from "@/src/lib/plan-limits";

const ROLE_LABELS = {
  admin: "Administrateur",
  member: "Membre",
  accountant: "Comptable",
};

export function InviteForm({ members, setMembers, selectedPlan, onContinue, onSkip }) {
  const limits = getPlanLimits(selectedPlan);
  const isFreelance = selectedPlan === "freelance";

  // Count used seats by type
  const filledMembers = members.filter((m) => m.email.trim());
  const usedUsers = filledMembers.filter((m) => m.role !== "accountant").length;
  const usedAccountants = filledMembers.filter((m) => m.role === "accountant").length;
  const totalSeats = limits.invitableUsers + limits.accountants;
  const usedTotal = usedUsers + usedAccountants;

  const isUserLimitReached = usedUsers >= limits.invitableUsers;
  const isAccountantLimitReached = usedAccountants >= limits.accountants;
  const isTotalLimitReached = usedTotal >= totalSeats;

  const updateEmail = (index, value) => {
    const updated = [...members];
    updated[index] = { ...updated[index], email: value };
    setMembers(updated);
  };

  const updateRole = (index, role) => {
    const updated = [...members];
    updated[index] = { ...updated[index], role };
    setMembers(updated);
  };

  const addRow = () => {
    const defaultRole = isFreelance ? "accountant" : "member";
    setMembers([...members, { email: "", role: defaultRole }]);
  };

  const removeRow = (index) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  // Available roles depend on plan and current counts
  const getAvailableRoles = (currentRole) => {
    if (isFreelance) {
      return ["accountant"];
    }
    const roles = [];
    // Always allow keeping current role
    if (currentRole === "admin" || !isUserLimitReached) roles.push("admin");
    if (currentRole === "member" || !isUserLimitReached) roles.push("member");
    if (currentRole === "accountant" || !isAccountantLimitReached) roles.push("accountant");
    // Deduplicate
    return [...new Set(roles)];
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleContinue = () => {
    const invalidEmails = filledMembers.filter(
      (m) => !EMAIL_REGEX.test(m.email.trim())
    );
    if (invalidEmails.length > 0) {
      toast.error("Veuillez saisir des adresses email valides");
      return;
    }
    onContinue();
  };

  // Progress bar percentage
  const seatPercent = totalSeats > 0 ? Math.min((usedTotal / totalSeats) * 100, 100) : 0;

  return (
    <div className="flex flex-col h-full px-20 py-6">
      <div className="flex flex-col pt-14">
        {/* Title */}
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Collaborez avec votre équipe
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Plus vos coéquipiers utilisent Newbi, plus il devient puissant.
        </p>

        {/* Section label */}
        <p className="text-sm text-foreground mb-4">
          Invitez votre équipe à collaborer
        </p>

        {/* Email rows */}
        <div className="space-y-3 mb-3 max-h-[220px] overflow-y-auto p-1 -m-1">
          {members.map((member, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="email"
                value={member.email}
                onChange={(e) => updateEmail(index, e.target.value)}
                placeholder="exemple@email.com"
                className="flex-1"
              />
              <Select
                value={member.role}
                onValueChange={(value) => updateRole(index, value)}
              >
                <SelectTrigger className="w-[140px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles(member.role).map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeRow(index)}
                disabled={members.length <= 1}
                className="shrink-0"
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        {/* Seat indicator */}
        {totalSeats > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <Progress
              value={seatPercent}
              className={`h-1.5 flex-1 ${isTotalLimitReached ? "bg-red-100 [&_[data-slot=progress-indicator]]:bg-red-500" : ""}`}
            />
            <span className={`text-xs whitespace-nowrap ${isTotalLimitReached ? "text-red-500" : "text-muted-foreground"}`}>
              {isFreelance
                ? `${usedAccountants} / ${limits.accountants} comptable`
                : `${usedUsers} / ${limits.invitableUsers} sièges${limits.accountants > 0 ? ` · ${usedAccountants} / ${limits.accountants} comptable${limits.accountants > 1 ? "s" : ""}` : ""}`
              }
            </span>
          </div>
        )}

        {/* Add more + Copy link */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="filter"
            onClick={addRow}
            disabled={isFreelance ? isAccountantLimitReached : isTotalLimitReached}
            className="flex items-center gap-1.5"
          >
            <UserPlus className="size-4" />
            Ajouter
          </Button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Link2 className="size-4" />
            Copier le lien d&apos;invitation
          </button>
        </div>

        {/* Continue button */}
        <Button
          variant="primary"
          className="w-full"
          disabled={!members.some((m) => m.email.trim())}
          onClick={handleContinue}
        >
          Continuer
        </Button>

        {/* Skip */}
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-4 mx-auto cursor-pointer"
        >
          Passer pour le moment
        </button>
      </div>

      {/* Legal text at bottom */}
      <div className="mt-auto pt-8 pb-4">
        <p className="text-[11px] text-muted-foreground leading-tight">
          En continuant, vous acceptez nos conditions générales d&apos;utilisation. Vous confirmez que les services Newbi sont destinés à un usage professionnel et que vous avez l&apos;autorité légale pour agir au nom de l&apos;entreprise.
        </p>
      </div>
    </div>
  );
}
