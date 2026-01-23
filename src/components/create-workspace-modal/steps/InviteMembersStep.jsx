"use client";

import React from "react";
import { Lightbulb, Users } from "lucide-react";
import MultipleSelector from "@/src/components/ui/multiselect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Callout } from "@/src/components/ui/callout";

export function InviteMembersStep({
  invitedEmails,
  membersWithRoles,
  onEmailsChange,
  onRoleChange,
  selectedPlan,
}) {
  // Configuration des limites par plan
  const planLimitsConfig = {
    freelance: { users: 0, accountants: 1 },
    pme: { users: 10, accountants: 3 },
    entreprise: { users: 25, accountants: 5 },
  };

  const planLimits =
    planLimitsConfig[selectedPlan] || planLimitsConfig.freelance;

  // Compter les utilisateurs et comptables invités
  const invitedUsers = membersWithRoles.filter(
    (m) => m.role !== "accountant"
  ).length;
  const invitedAccountants = membersWithRoles.filter(
    (m) => m.role === "accountant"
  ).length;

  const availableUsers = Math.max(0, planLimits.users - invitedUsers);
  const availableAccountants = Math.max(
    0,
    planLimits.accountants - invitedAccountants
  );

  // Forcer le rôle "accountant" pour le plan Freelance
  React.useEffect(() => {
    if (selectedPlan === "freelance" && membersWithRoles.length > 0) {
      const hasNonAccountant = membersWithRoles.some(
        (m) => m.role !== "accountant"
      );
      if (hasNonAccountant) {
        // Convertir tous les membres en comptables
        const updatedMembers = membersWithRoles.map((m, index) => {
          if (m.role !== "accountant") {
            onRoleChange(index, "accountant");
          }
          return m;
        });
      }
    }
  }, [selectedPlan, membersWithRoles, onRoleChange]);

  return (
    <div className="w-full max-w-3xl space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
          Invitez des personnes dans votre espace :
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tapez l'email puis appuyez sur{" "}
          <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-[#313131] rounded">
            Entrée
          </kbd>{" "}
          pour ajouter des utilisateurs et leur appliquer un rôle.
        </p>
      </div>

      <div className="space-y-3">
        {/* Affichage des sièges disponibles */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-[#313131]/90">
            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">
                  {invitedUsers}
                </span>{" "}
                utilisateur{invitedUsers > 1 ? "s" : ""} •{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {availableUsers}
                </span>{" "}
                disponible{availableUsers > 1 ? "s" : ""} sur{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {planLimits.users}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-[#313131]/90">
            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">
                  {invitedAccountants}
                </span>{" "}
                comptable{invitedAccountants > 1 ? "s" : ""} •{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {availableAccountants}
                </span>{" "}
                disponible{availableAccountants > 1 ? "s" : ""} sur{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {planLimits.accountants}
                </span>
              </p>
            </div>
          </div>
        </div>
        <MultipleSelector
          value={invitedEmails}
          onChange={onEmailsChange}
          placeholder="Entrez des adresses email"
          creatable
          hidePlaceholderWhenSelected
          emptyIndicator={
            <p className="text-center text-sm text-muted-foreground">
              Aucun résultat trouvé
            </p>
          }
          className="dark:bg-[#171717] dark:border-gray-700"
        />

        {membersWithRoles.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Attribuer des rôles :
            </p>
            {membersWithRoles.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#313131]/90"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {member.label.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {member.label}
                  </span>
                </div>
                <Select
                  value={member.role}
                  onValueChange={(value) => onRoleChange(index, value)}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs border-none shadow-none hover:bg-muted dark:hover:bg-[#252525]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPlan !== "freelance" && (
                      <>
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
                            <span className="font-normal text-sm">Membre</span>
                            <span className="text-xs text-muted-foreground">
                              Accès standard
                            </span>
                          </div>
                        </SelectItem>
                      </>
                    )}
                    <SelectItem value="accountant">
                      <div className="flex flex-col">
                        <span className="font-normal text-sm">Comptable</span>
                        <span className="text-xs text-muted-foreground">
                          Accès comptabilité
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        <Callout
          icon={Lightbulb}
          variant="info"
          className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50"
        >
          <p>
            Ne travaillez pas seul - Invitez votre équipe pour commencer 200%
            plus vite.
          </p>
        </Callout>
      </div>
    </div>
  );
}
